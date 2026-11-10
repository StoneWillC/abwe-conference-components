/**
 * Message schema for tab-to-tab map control communication
 */

export type MapControlMessageType =
  | "panTo"
  | "setZoom"
  | "addMarker"
  | "ping"
  | "pong"
  | "heartbeat"
  | "setMode"
  | "setRemoteControl"
  | "responseUpdate";

export interface MapControlPayload {
  // For panTo
  lat?: number;
  lng?: number;

  // For setZoom
  zoom?: number;

  // For addMarker
  label?: string;

  // For setMode
  mode?: "qr-full" | "qr-corner-main" | "qr-corner-map" | "main";

  // For heartbeat
  visible?: boolean;

  // For setRemoteControl
  remoteControlEnabled?: boolean;

  // For responseUpdate
  participants?: number;
}

export interface MapControlMessage {
  version: number;
  sessionId: string;
  instanceId?: string; // Optional: to target specific tab instances
  type: MapControlMessageType;
  payload?: MapControlPayload;
  ts: number;
}

/**
 * Heartbeat message sent periodically by map tabs
 */
export interface HeartbeatData {
  sessionId: string;
  instanceId: string;
  visible: boolean;
  ts: number;
}

/**
 * Validation utilities
 */
export const validateMapControlMessage = (
  msg: any,
): msg is MapControlMessage => {
  if (!msg || typeof msg !== "object") return false;
  if (typeof msg.version !== "number") return false;
  if (typeof msg.sessionId !== "string") return false;
  if (typeof msg.type !== "string") return false;
  if (typeof msg.ts !== "number") return false;

  // Validate payload if present
  if (msg.payload) {
    const payload = msg.payload;

    // Validate lat/lng ranges
    if (payload.lat !== undefined) {
      if (
        typeof payload.lat !== "number" ||
        payload.lat < -90 ||
        payload.lat > 90
      ) {
        return false;
      }
    }

    if (payload.lng !== undefined) {
      if (
        typeof payload.lng !== "number" ||
        payload.lng < -180 ||
        payload.lng > 180
      ) {
        return false;
      }
    }

    // Validate zoom range
    if (payload.zoom !== undefined) {
      if (
        typeof payload.zoom !== "number" ||
        payload.zoom < 1 ||
        payload.zoom > 18
      ) {
        return false;
      }
    }

    // Validate mode
    if (payload.mode !== undefined) {
      const validModes = ["qr-full", "qr-corner-main", "qr-corner-map", "main"];
      if (!validModes.includes(payload.mode)) {
        return false;
      }
    }

    // Validate participants
    if (payload.participants !== undefined) {
      if (typeof payload.participants !== "number" || payload.participants < 0) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Generate a random session ID
 */
export const generateSessionId = (): string => {
  return `sess-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Generate a random instance ID
 */
export const generateInstanceId = (): string => {
  return `inst-${Math.random().toString(36).substring(2, 15)}`;
};
