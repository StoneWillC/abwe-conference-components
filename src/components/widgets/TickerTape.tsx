import { Box, IconButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

type Props = {
  messages: string[];
  speed?: number; // pixels per second, default 100
  showToggle?: boolean;
  defaultVisible?: boolean;
};

type MessageTrack = {
  message: string;
  el: HTMLSpanElement;
  x: number; // current left position
  width: number; // measured after DOM append
  state: "waiting" | "scrolling" | "done"; // waiting = held at right edge until gap clears, done = finished all repetitions
  plays: number; // increments each time the track wraps
};

const DEFAULT_SCROLL_SPEED = 1000000000000000000; // pixels per second
const TICKER_REPETITIONS = 0; // how many times each name scrolls across before stopping (0 = infinite)

export default function TickerTape({
  messages,
  speed = DEFAULT_SCROLL_SPEED,
  showToggle = true,
  defaultVisible = false,
}: Props) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const tracksRef = useRef<MessageTrack[]>([]);
  const speedRef = useRef(speed);
  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    setIsVisible(defaultVisible ?? false);
  }, [defaultVisible]);

  // Keep isVisibleRef in sync with state
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  // Update speed ref when speed prop changes
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Create a ticker span element
  const createTickerSpan = (text: string, containerWidth: number): HTMLSpanElement => {
    const span = document.createElement("span");
    span.textContent = text;
    span.style.cssText = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: ${containerWidth}px;
      white-space: nowrap;
      font-weight: 700;
      font-size: 1rem;
      color: #fff;
      letter-spacing: 0.03em;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    `;
    return span;
  };

  // Diff messages: add/remove tracks
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const incoming = new Set(messages);

    // Remove tracks for messages no longer in the list
    tracksRef.current = tracksRef.current.filter((track) => {
      if (!incoming.has(track.message)) {
        track.el.remove();
        return false;
      }
      return true;
    });

    // Add tracks for new messages
    const existing = new Set(tracksRef.current.map((t) => t.message));
    for (const msg of messages) {
      if (existing.has(msg)) continue;
      const el = createTickerSpan(msg, containerWidth);
      container.appendChild(el);
      const width = el.offsetWidth;
      el.style.left = `${containerWidth}px`; // start off-screen right
      tracksRef.current.push({ message: msg, el, x: containerWidth, width, state: "waiting", plays: 0 });
    }
  }, [JSON.stringify(messages)]);

  // Start/stop animation loop based on visibility
  useEffect(() => {
    if (!isVisible) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      const container = containerRef.current;
      if (!container || !isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const deltaTime = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;
      const delta = deltaTime * speedRef.current;
      const containerWidth = container.offsetWidth;
      const GAP = 20;

      // Move scrolling tracks left and wrap when they exit the left edge
      for (const track of tracksRef.current) {
        if (track.state === "scrolling") {
          track.x -= delta;
          track.el.style.left = `${track.x}px`;

          // Wrap when fully off left
          if (track.x + track.width < 0) {
            track.plays += 1;
            if (TICKER_REPETITIONS > 0 && track.plays >= TICKER_REPETITIONS) {
              track.state = "done";
              track.el.style.display = "none";
            } else {
              track.state = "waiting";
              track.x = containerWidth;
              track.el.style.left = `${containerWidth}px`;
            }
          }
        }
      }

      // Admit waiting tracks if the right edge is clear
      for (const track of tracksRef.current) {
        if (track.state !== "waiting") continue;

        // Check if right edge is clear: no other scrolling track has its trailing edge within GAP of right edge
        const rightEdgeClear = tracksRef.current.every(
          (t) =>
            t === track ||
            t.state !== "scrolling" ||
            t.x + t.width + GAP <= containerWidth
        );

        if (rightEdgeClear) {
          track.state = "scrolling";
          track.x = containerWidth;
          track.el.style.left = `${containerWidth}px`;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible]);

  return (
    <>
      {/* Toggle button */}
      {showToggle && (
        <IconButton
          onClick={() => setIsVisible(!isVisible)}
          sx={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            zIndex: 11,
            pointerEvents: "auto",
            backgroundColor: "rgba(25,45,85,0.9)",
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(33,150,243,0.95)",
            },
            width: 32,
            height: 32,
          }}
          size="small"
        >
          {isVisible ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </IconButton>
      )}

      {/* Ticker container - always rendered */}
      <Box
        ref={containerRef}
        sx={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 10,
          height: "44px",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(90deg, rgba(25,45,85,0.95) 0%, rgba(33,150,243,0.92) 50%, rgba(25,45,85,0.95) 100%)",
          borderTop: "1px solid rgba(100,181,246,0.6)",
          borderBottom: "1px solid rgba(100,181,246,0.6)",
        }}
      />
    </>
  );
}
