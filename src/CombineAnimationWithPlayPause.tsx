import React from "react";
import { motion } from "framer-motion";
import NurseAssessmentAnimation from "./NurseAssessmentAnimation";
import DoctorProcessAnimation from "./DoctorProcessAnimation";

export interface CombinedAnimationProps {
  nurseIconUrl?: string;
  computerIconUrl?: string;
  fileIconUrl?: string;
  doctorIconUrl?: string;
  bottomSteps?: { title: string }[];
  bridgeDurationMs?: number;
  showPathDebug?: boolean;
  /** bump this to force the file to move again (doesn’t affect bottom pane) */
  externalRestartKey?: number;
}

/**
 * Behavior:
 * - Bottom (Doctor) pane is visible from the start.
 * - When the Nurse (top) animation completes the FIRST time, we start the Doctor pane's step animation.
 * - The file travels along the bridge on every restart (from nurse completion OR externalRestartKey change).
 * - Subsequent restarts DO NOT reset or re-animate the Doctor pane; it stays as-is.
 *
 * Visual layering:
 * - Top pane (nurse) has higher z-index than the bridge so the file begins behind it.
 * - Bridge sits above the bottom pane so the file flies over the bottom.
 */
export default function CombinedAnimation({
  nurseIconUrl,
  computerIconUrl,
  fileIconUrl,
  doctorIconUrl,
  bottomSteps,
  bridgeDurationMs = 1200,
  showPathDebug = false,
  externalRestartKey,
}: CombinedAnimationProps) {
  // Increments each time we want the file to move again
  const [bridgeRun, setBridgeRun] = React.useState(0);
  // 0..1 file progress along the curve
  const [bridgeProg, setBridgeProg] = React.useState(0);
  // Latches true after the first top completion; bottom stays visible regardless
  const [bottomStartedOnce, setBottomStartedOnce] = React.useState(false);

  // First-time-only: when top completes, we both move the file and (if not yet) start the bottom animation
  const handleTopComplete = React.useCallback(() => {
    triggerFileRun();
    if (!bottomStartedOnce) setBottomStartedOnce(true);
  }, [bottomStartedOnce]);

  // Allow parent to retrigger only the file movement (bottom unchanged)
  React.useEffect(() => {
    if (externalRestartKey !== undefined) {
      triggerFileRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRestartKey]);

  const triggerFileRun = React.useCallback(() => {
    setBridgeProg(0);
    setBridgeRun((r) => r + 1);
  }, []);

  // StrictMode-safe RAF loop to animate the file each time bridgeRun changes
  React.useEffect(() => {
    if (bridgeRun === 0) return; // don't auto-run on initial mount
    let cancelled = false;
    let raf = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const p = Math.min(1, (now - t0) / bridgeDurationMs);
      setBridgeProg(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [bridgeRun, bridgeDurationMs]);

  return (
    <div className="w-full">
      {/* TOP: Nurse flow sits above the bridge so the file can start behind it */}
      <div className="relative z-40 bg-white">
        <NurseAssessmentAnimation
          nurseIconUrl={nurseIconUrl}
          computerIconUrl={computerIconUrl}
          fileIconUrl={fileIconUrl}
          onComplete={handleTopComplete}
        />
        {/* Optional soft mask so the very first pixels of the file are hidden under the top pane */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-1 h-6 bg-gradient-to-b from-white to-transparent"
        />
      </div>

      {/* BRIDGE: file travels every time bridgeRun increments; below top, above bottom */}
      <div className="relative z-30 h-14 -mt-6">
        <BridgePath
          progress={bridgeProg}
          fileIconUrl={fileIconUrl}
          runKey={bridgeRun} // remount moving icon each run
          showPathDebug={showPathDebug}
        />
      </div>

      {/* BOTTOM: always visible; step animation fires once when bottomStartedOnce becomes true */}
      <div className="relative z-20">
        <DoctorProcessAnimation
		  doctorIconUrl={doctorIconUrl}
		  computerIconUrl={computerIconUrl}
		  fileIconUrl={fileIconUrl}
		  steps={bottomSteps}
		  start={bottomStartedOnce}   // stays true after first completion

		  // If you want the final handoff to replay on each file run, include this:
		  // resetToken={bridgeRun}

		  // If you want to disable the final handoff entirely:
		  // disableFinalHandoff
		/>

      </div>
    </div>
  );
}

/** Bridge: file travels on a smooth cubic curve between blocks */
function BridgePath({
  progress,
  fileIconUrl,
  runKey,
  showPathDebug,
}: {
  progress: number;
  fileIconUrl?: string;
  runKey: number;
  showPathDebug?: boolean;
}) {
  const p = easeInOutCubic(clamp01(progress));

  // Control points tuned to match a typical layout (adjust as needed)
  const x1 = 900, y1 = -20; // near top monitor
  const x2 = 120, y2 = 180; // near bottom start icon
  const cx1 = 900, cy1 = 0;
  const cx2 = 40, cy2 = 180;

  const { x, y } = cubicBezierPoint(p, x1, y1, cx1, cy1, cx2, cy2, x2, y2);

  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 1000 200" className="absolute inset-0 w-full h-full">
        <path
          d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
          fill="none"
          stroke={showPathDebug ? "#94a3b8" : "transparent"}
          strokeWidth={4}
        />
      </svg>

      {/* Keep mounted; remount on runKey so motion state fully resets */}
      {fileIconUrl && (
        <motion.img
          key={runKey}
          src={fileIconUrl}
          alt="File"
          className="absolute w-6 h-6 object-contain" // removed z-50 so it can live under the top pane
          style={{
            left: `${(x / 1000) * 100}%`,
            top: `${(y / 200) * 100}%`,
            transform: "translate(-50%, -50%)",
            // No explicit zIndex here; inherits the bridge wrapper's z-30
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2.0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </div>
  );
}

// ------------------------- helpers -------------------------

function cubicBezierPoint(
  t: number,
  x1: number,
  y1: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x2: number,
  y2: number
) {
  const u = 1 - t,
    tt = t * t,
    uu = u * u,
    uuu = uu * u,
    ttt = tt * t;
  const x = uuu * x1 + 3 * uu * t * cx1 + 3 * u * tt * cx2 + ttt * x2;
  const y = uuu * y1 + 3 * uu * t * cy1 + 3 * u * tt * cy2 + ttt * y2;
  return { x, y };
}
function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
