import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Settings2 } from "lucide-react";

// Default Nurse SVG (fallback if no nurseIconUrl given)
const SvgNurseCap = () => (
  <svg viewBox="0 0 160 160" className="w-36 h-36">
    <defs>
      <linearGradient id="scrub" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#cfe3ff" />
        <stop offset="100%" stopColor="#b5d0fb" />
      </linearGradient>
    </defs>
    <circle cx="80" cy="65" r="28" fill="#ffd9b3" stroke="#3b3b46" strokeWidth="3" />
    <circle cx="60" cy="47" r="14" fill="#2a2a33" />
    <path d="M35 35 L125 35 L110 15 L50 15 Z" fill="#fff" stroke="#3b3b46" strokeWidth="3" />
    <path d="M78 18 v18 M68 27 h20" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
    <rect x="40" y="92" width="80" height="58" rx="16" fill="url(#scrub)" stroke="#3b3b46" strokeWidth="3" />
    <path d="M55 95 q25 40 50 0" stroke="#333" strokeWidth="4" fill="none" />
    <circle cx="105" cy="120" r="6" fill="#666" />
  </svg>
);

// Default Monitor SVG (fallback if no computerIconUrl given)
const DefaultMonitor = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl bg-slate-200 p-3 border border-slate-300 shadow-inner">
    <div className="rounded-2xl bg-white p-4 border border-slate-200 space-y-3">
      {children}
    </div>
    <div className="h-3 bg-slate-300 rounded-b-2xl mt-2" />
  </div>
);

// Default output icons
const DefaultVitalsIcon = () => (
  <svg viewBox="0 0 48 48" className="w-6 h-6">
    <path d="M8 24c0-8.836 7.164-16 16-16s16 7.164 16 16-7.164 16-16 16S8 32.836 8 24z" fill="#e6f7ee" />
    <path d="M10 24h8l3-6 6 18 4-12h7" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DefaultPainIcon = () => (
  <svg viewBox="0 0 48 48" className="w-6 h-6">
    <circle cx="24" cy="24" r="20" fill="#eef2ff" />
    <circle cx="18" cy="20" r="2.8" fill="#334155" />
    <circle cx="30" cy="20" r="2.8" fill="#334155" />
    <path d="M16 32 q8 -6 16 0" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const DefaultNotesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-6 h-6">
    <rect x="10" y="8" width="28" height="32" rx="4" fill="#fff7ed" stroke="#9a3412" strokeWidth="2" />
    <path d="M16 16h16M16 22h16M16 28h12" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Monitor card for outputs (with scale option)
const MonitorCard: React.FC<{ title: string; visible: boolean; Icon: React.FC<any>; scale?: number }> =
  ({ title, visible, Icon, scale = 1 }) => (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 * scale } : { opacity: 0, y: 8, scale: 0.98 * scale }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
       className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
      visible ? "bg-emerald-50 border-emerald-200" : "bg-transparent border-transparent"
    }`}  
      style={{ transform: `scale(${scale})` }}
    >
      <Icon />
      <div className="text-slate-800 font-medium">{title}</div>
    </motion.div>
  );

// Scribble effect for nurse writing
const NurseScribble: React.FC<{ progress: number }> = ({ progress }) => {
  const lines = new Array(10).fill(0).map((_, i) => {
    const pct = Math.min(1, Math.max(0, progress * 1.2 - i * 0.08));
    return (
      <div key={i} className="h-2 my-1 bg-slate-300 rounded" style={{ width: `${pct * 100}%` }} />
    );
  });
  return <div className="w-full">{lines}</div>;
};

// Arrow animation (hidden until progress starts)
const ArrowToSystem: React.FC<{ progress: number }> = ({ progress }) => {
  if (progress <= 0) return null; // don't render before start

  const length = 320;
  const dash = Math.max(0.0001, length * progress); // grows from 0 → full

  return (
    <motion.svg
      viewBox="0 0 340 80"
      className="w-full h-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <defs>
        <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L10,3 L0,6 Z" fill="transparent"//fill="#1f2937"
		  />
        </marker>
      </defs>
      <line
        x1="10"
        y1="40"
        x2="320"
        y2="40"
      //  stroke="#1f2937"
	  stroke="transparent"
        strokeWidth="6"
        strokeDasharray={`${dash} ${length}`}
        markerEnd={progress > 0.05 ? "url(#arrowHead)" : undefined}
      />
    </motion.svg>
  );
};

// Smooth ease so it feels slower but still reaches 100%
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// File packet moving along a 180° arc path
const FileTransfer: React.FC<{ progress: number; fileIconUrl?: string }> = ({ progress, fileIconUrl }) => {
  if (!fileIconUrl || progress <= 0 || progress > 1) return null;

  const p = easeInOutQuad(clamp01(progress)); // eased 0..1

  // Half-circle arc from left (10,40) to right (320,40) with big radius
  const pathData = "M 10 40 A 155 155 0 0 1 320 40";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);

  const L = path.getTotalLength();
  const pt = path.getPointAtLength(L * p);

  // Convert to percentage for positioning inside relative container
  const viewW = 340, viewH = 80;
  const leftPct = (pt.x / viewW) * 100;
  const topPct  = (pt.y / viewH) * 100;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -140%)",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 3.9 }}
      transition={{ duration: 0.2 }}
    >
      <img
        src={fileIconUrl}
        alt="File icon"
        className="w-8 h-8 object-contain"
      />
    </motion.div>
  );
};

export default function NurseAssessmentAnimation({
  nurseIconUrl,
  computerIconUrl,
  fileIconUrl, // <-- added to props
  vitalsIconUrl,
  painIconUrl,
  subjectiveIconUrl,
  onComplete,
}: {
  nurseIconUrl?: string;
  computerIconUrl?: string;
  fileIconUrl?: string;
  vitalsIconUrl?: string;
  painIconUrl?: string;
  subjectiveIconUrl?: string;
  onComplete?: () => void;
}) {
  const [isPlaying, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const NurseIcon = useMemo(() => nurseIconUrl
    ? () => <img src={nurseIconUrl} alt="Nurse" className="w-36 h-36 object-contain" />
    : SvgNurseCap, [nurseIconUrl]);

  const VitalsIcon = useMemo(() => vitalsIconUrl
    ? () => <img src={vitalsIconUrl} alt="Vitals" className="w-6 h-6" />
    : DefaultVitalsIcon, [vitalsIconUrl]);

  const PainIcon = useMemo(() => painIconUrl
    ? () => <img src={painIconUrl} alt="Pain" className="w-6 h-6" />
    : DefaultPainIcon, [painIconUrl]);

  const NotesIcon = useMemo(() => subjectiveIconUrl
    ? () => <img src={subjectiveIconUrl} alt="Notes" className="w-6 h-6" />
    : DefaultNotesIcon, [subjectiveIconUrl]);

  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const dur = 6000;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (isPlaying) {
        setStep(s => {
          let ns = s + (dt * speed) / dur;
          if (ns >= 1) ns = 1;
          return ns;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed]);

  // Timeline slices
  const writeProg = clamp01(mapRange(step, 0.0, 0.35));
  const arrowProg = clamp01(mapRange(step, 0.35, 0.55)); // arrow draws here
  const fileProg  = clamp01(mapRange(step, 0.35, 0.80)); // file travels here

  const showVitals = step >= 0.6;
  const showPain   = step >= 0.75;
  const showNotes  = step >= 0.9;
const [firedComplete, setFiredComplete] = useState(false);

React.useEffect(() => {
  if (!firedComplete && step >= 1) {
    setFiredComplete(true);
    onComplete?.();
  }
}, [step, firedComplete, onComplete]);
  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6">
      {/* Controls */}
      

      {/* Stage */}
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Nurse */}
        <div className="col-span-4 flex gap-4">
          <NurseIcon />
          <div className="w-full max-w-[260px] p-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-inner">
            <div className="h-4 w-24 bg-amber-200/70 rounded mb-2" />
            <NurseScribble progress={writeProg} />
          </div>
        </div>

        {/* Arrow + moving file */}
        <div className="col-span-4 relative z-0">
          {(arrowProg > 0 || fileProg > 0) && (
            <>
              <ArrowToSystem progress={arrowProg} />
              <FileTransfer progress={fileProg} fileIconUrl={fileIconUrl} />
            </>
          )}
        </div>

        {/* Monitor */}
        <div className="col-span-4">
          {computerIconUrl ? (
            <div className="relative flex justify-center items-center z-10 -translate-x-18" style={{ maxWidth: "400px", width: "400px"}}>
              <img src={computerIconUrl} alt="Computer" className="w-full h-auto object-contain" />
              <div
                className="absolute flex flex-col items-center justify-center space-y-1"
                style={{ top: "8%", left: "13%", width: "74%", height: "56%" }}
              >
                <MonitorCard title="Vitals" visible={showVitals} Icon={DefaultVitalsIcon} scale={1.0} />
                <MonitorCard title="Pain Assessment" visible={showPain} Icon={DefaultPainIcon} scale={1.0} />
                <MonitorCard title="Subjective Notes" visible={showNotes} Icon={DefaultNotesIcon} scale={1.0} />
              </div>
            </div>
          ) : (
            <DefaultMonitor>
              <MonitorCard title="Vitals" visible={showVitals} Icon={DefaultVitalsIcon} />
              <MonitorCard title="Pain Assessment" visible={showPain} Icon={DefaultPainIcon} />
              <MonitorCard title="Subjective Notes" visible={showNotes} Icon={DefaultNotesIcon} />
            </DefaultMonitor>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp01(n: number) { return Math.min(1, Math.max(0, n)); }
function mapRange(v: number, a: number, b: number) {
  if (v <= a) return 0; if (v >= b) return 1; return (v - a) / (b - a);
}
