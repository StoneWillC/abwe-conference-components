import { useEffect, useRef, useCallback } from "react";
import {
  MapControlMessage,
  validateMapControlMessage,
} from "../types/MapControl";

/**
 * Hook for cross-tab communication using BroadcastChannel API
 * with localStorage fallback for older browsers
 */
export const useBroadcastChannel = (
  channelName: string,
  onMessage: (message: MapControlMessage) => void
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isMountedRef = useRef(true);

  // Initialize channel
  useEffect(() => {
    isMountedRef.current = true;

    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(channelName);
      channelRef.current = channel;

      // Listen for messages
      channel.onmessage = (event) => {
        if (!isMountedRef.current) return;

        // Validate message
        if (validateMapControlMessage(event.data)) {
          onMessage(event.data);
        }
      };

      channel.onmessageerror = (event) => {
        console.error(`[BroadcastChannel] Message error:`, event);
      };
    } else {
      // Fallback to localStorage for older browsers
      console.warn(
        `[BroadcastChannel] Not supported, using localStorage fallback`
      );

      const handleStorageEvent = (event: StorageEvent) => {
        if (!isMountedRef.current) return;

        // Only listen to our channel's key
        if (event.key === `broadcast-${channelName}`) {
          try {
            if (event.newValue) {
              const data = JSON.parse(event.newValue);

              // Validate message
              if (validateMapControlMessage(data.message)) {
                onMessage(data.message);
              }
            }
          } catch (err) {
            console.error(`[BroadcastChannel] Storage parse error:`, err);
          }
        }
      };

      window.addEventListener("storage", handleStorageEvent);

      // Store cleanup function
      return () => {
        window.removeEventListener("storage", handleStorageEvent);
      };
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [channelName, onMessage]);

  /**
   * Post a message to the channel
   */
  const postMessage = useCallback(
    (message: MapControlMessage) => {
      if (channelRef.current) {
        channelRef.current.postMessage(message);
      } else {
        // Fallback to localStorage
        // Write to localStorage with timestamp to trigger storage event
        localStorage.setItem(
          `broadcast-${channelName}`,
          JSON.stringify({
            message,
            timestamp: Date.now(),
          })
        );

        // Note: localStorage storage event doesn't fire in the same tab that sets it,
        // so we manually call the handler for the current tab
        if (validateMapControlMessage(message)) {
          onMessage(message);
        }
      }
    },
    [channelName, onMessage]
  );

  return { postMessage };
};

/**
 * Hook for implementing ping/pong presence checking
 */
export const usePingPong = (
  channelName: string,
  sessionId: string,
  timeoutMs: number = 800
) => {
  const { postMessage } = useBroadcastChannel(channelName, (message) => {
    // Auto-respond to pings with pongs
    if (message.type === "ping" && message.sessionId === sessionId) {
      postMessage({
        version: 1,
        sessionId,
        type: "pong",
        ts: Date.now(),
      });
    }
  });

  /**
   * Check if a target is present by sending a ping and waiting for a pong
   */
  const checkPresence = useCallback(
    async (targetSessionId?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        let resolved = false;
        const targetSession = targetSessionId || sessionId;

        // Listen for pong
        const handlePong = (message: MapControlMessage) => {
          if (
            message.type === "pong" &&
            message.sessionId === targetSession &&
            !resolved
          ) {
            resolved = true;
            resolve(true);
          }
        };

        // Create temporary listener
        const tempChannel = new BroadcastChannel(channelName);
        tempChannel.onmessage = (event) => {
          if (validateMapControlMessage(event.data)) {
            handlePong(event.data);
          }
        };

        // Send ping
        postMessage({
          version: 1,
          sessionId: targetSession,
          type: "ping",
          ts: Date.now(),
        });

        // Timeout
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            tempChannel.close();
            resolve(false);
          }
        }, timeoutMs);
      });
    },
    [channelName, sessionId, postMessage, timeoutMs]
  );

  return { postMessage, checkPresence };
};

/**
 * Hook for implementing heartbeat pattern
 * Map tabs send periodic heartbeats so controllers can check last heartbeat time
 */
export const useHeartbeat = (
  channelName: string,
  sessionId: string,
  instanceId: string,
  intervalMs: number = 2000
) => {
  const { postMessage } = useBroadcastChannel(channelName, () => {
    // Heartbeat sender doesn't need to handle incoming messages
  });

  useEffect(() => {
    // Send initial heartbeat
    const sendHeartbeat = () => {
      const visible = document.visibilityState === "visible";

      postMessage({
        version: 1,
        sessionId,
        instanceId,
        type: "heartbeat",
        payload: { visible },
        ts: Date.now(),
      });
    };

    sendHeartbeat();

    // Send periodic heartbeats
    const intervalId = setInterval(sendHeartbeat, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [channelName, sessionId, instanceId, intervalMs, postMessage]);

  return { postMessage };
};
