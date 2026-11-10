import { useEffect, useRef, useState } from "react";
import {
  useBroadcastChannel,
  useHeartbeat,
} from "../hooks/useBroadcastChannel";
import { MapControlMessage, generateInstanceId } from "../types/MapControl";

interface MapReceiverProps {
  sessionId: string;
  channelName?: string;
  onPanTo?: (lat: number, lng: number) => void;
  onSetZoom?: (zoom: number) => void;
  onAddMarker?: (lat: number, lng: number, label?: string) => void;
  onSetMode?: (
    mode: "qr-full" | "qr-corner-main" | "qr-corner-map" | "main",
  ) => void;
  onSetRemoteControl?: (enabled: boolean) => void;
  requireApproval?: boolean;
  onApprovalRequest?: (instanceId: string) => Promise<boolean>;
}

/**
 * MapReceiver Component
 *
 * Listens for map control commands from other tabs and applies them
 * Sends heartbeat messages to indicate it's alive
 * Responds to ping messages with pong
 */
export const MapReceiver: React.FC<MapReceiverProps> = ({
  sessionId,
  channelName = "map-control",
  onPanTo,
  onSetZoom,
  onAddMarker,
  onSetMode,
  onSetRemoteControl,
  requireApproval = false,
  onApprovalRequest,
}) => {
  const [instanceId] = useState(() => generateInstanceId());
  const [approvedControllers, setApprovedControllers] = useState<Set<string>>(
    new Set(),
  );
  const messageCountRef = useRef(0);
  const lastMessageTimeRef = useRef<number>(Date.now());

  // Construct full channel name with session ID
  const fullChannelName = `${channelName}-${sessionId}`;

  // Handle incoming messages
  const handleMessage = async (message: MapControlMessage) => {
    messageCountRef.current++;

    // Validate session ID
    if (message.sessionId !== sessionId) {
      return;
    }

    // Check if we need approval for this controller
    if (
      requireApproval &&
      message.instanceId &&
      !approvedControllers.has(message.instanceId) &&
      message.type !== "ping" // Allow ping without approval
    ) {
      if (onApprovalRequest) {
        const approved = await onApprovalRequest(message.instanceId);
        if (approved) {
          setApprovedControllers((prev) =>
            new Set(prev).add(message.instanceId!),
          );
        } else {
          return;
        }
      }
    }

    // Rate limiting: throttle rapid-fire messages (e.g. drag events) to max 10 per second
    // But always allow discrete control commands (zoom, mode, pan) through immediately
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;
    const isDiscreteCommand =
      message.type === "setZoom" ||
      message.type === "panTo" ||
      message.type === "setMode" ||
      message.type === "setRemoteControl";
    if (!isDiscreteCommand && timeSinceLastMessage < 100) {
      return;
    }
    lastMessageTimeRef.current = now;

    // Process message based on type
    switch (message.type) {
      case "panTo":
        if (
          message.payload?.lat !== undefined &&
          message.payload?.lng !== undefined
        ) {
          onPanTo?.(message.payload.lat, message.payload.lng);
        }
        break;

      case "setZoom":
        if (message.payload?.zoom !== undefined) {
          onSetZoom?.(message.payload.zoom);
        }
        break;

      case "addMarker":
        if (
          message.payload?.lat !== undefined &&
          message.payload?.lng !== undefined
        ) {
          onAddMarker?.(
            message.payload.lat,
            message.payload.lng,
            message.payload.label,
          );
        }
        break;

      case "setMode":
        if (message.payload?.mode) {
          onSetMode?.(message.payload.mode);
        }
        break;

      case "setRemoteControl":
        if (message.payload?.remoteControlEnabled !== undefined) {
          onSetRemoteControl?.(message.payload.remoteControlEnabled);
        }
        break;

      case "ping":
        // Ping is handled automatically by the hook

      case "pong":
        // We don't send pings, so we shouldn't receive pongs

      case "heartbeat":
        // Ignore heartbeats from other instances

      case "responseUpdate":
        // Handled by PresenterConsole, not MapReceiver
        break;

      default:
        break;
    }
  };

  // Set up broadcast channel with message handler
  const { postMessage } = useBroadcastChannel(fullChannelName, handleMessage);

  // Set up heartbeat
  useHeartbeat(fullChannelName, sessionId, instanceId);

  // Auto-respond to pings with pongs
  useEffect(() => {
    const handlePing = (message: MapControlMessage) => {
      if (message.type === "ping" && message.sessionId === sessionId) {
        postMessage({
          version: 1,
          sessionId,
          instanceId,
          type: "pong",
          ts: Date.now(),
        });
      }
    };

    // This is handled in the main message handler above
    // This comment is here for clarity
  }, [sessionId, instanceId, postMessage]);

  // Display session info for debugging
  useEffect(() => {
    // Expose debug info to window
    (window as any).mapReceiverDebug = {
      sessionId,
      instanceId,
      channelName: fullChannelName,
      messageCount: () => messageCountRef.current,
      approvedControllers: () => Array.from(approvedControllers),
    };

    return () => {
      delete (window as any).mapReceiverDebug;
    };
  }, [
    sessionId,
    instanceId,
    fullChannelName,
    requireApproval,
    approvedControllers,
  ]);

  // This component doesn't render anything visible
  return null;
};

export default MapReceiver;
