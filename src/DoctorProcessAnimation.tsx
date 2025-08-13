import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Step = { title: string };

export interface DoctorProcessAnimationProps {
  doctorIconUrl?: string;
  computerIconUrl?: string;
  fileIconUrl?: string;
  steps?: Step[];
  start?: boolean;
  resetToken?: number;
  staggerMs?: number;
  disableFinalHandoff?: boolean;
  clinicalNoteText?: string;
}

const MonitorCard: React.FC<{ title: string; visible: boolean; Icon?: React.FC<any>; scale?: number }>
  = ({ title, visible, Icon, scale = 1 }) => (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 * scale } : { opacity: 0, y: 8, scale: 0.98 * scale }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
        visible ? "bg-emerald-50 border-emerald-200" : "bg-transparent border-transparent"
      }`}
      style={{ transform: `scale(${scale})` }}
    >
      {Icon ? <Icon /> : null}
      <div className="text-slate-800 font-medium">{title}</div>
    </motion.div>
  );

const DefaultNoteIcon = () => (
  <svg viewBox="0 0 48 48" className="w-6 h-6">
    <rect x="10" y="8" width="28" height="32" rx="4" fill="#fff7ed" stroke="#9a3412" strokeWidth="2" />
    <path d="M16 16h16M16 22h16M16 28h12" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function DoctorProcessAnimation({
  doctorIconUrl,
  computerIconUrl,
  fileIconUrl,
  steps = [
    { title: "Lab Order" },
    { title: "Prescription Order" },
    { title: "Imaging Order" },
    { title: "Follow up" },
    { title: "Referral" },
  ],
  start = false,
  resetToken,
  staggerMs = 750,
  disableFinalHandoff = false,
  clinicalNoteText = "Clinical Note",
}: DoctorProcessAnimationProps) {
  const [runId, setRunId] = React.useState(0);
  const prevStart = usePrevious(start);
  const [noteVisible, setNoteVisible] = React.useState(false);

  React.useEffect(() => {
    if ((prevStart === false && start === true) || resetToken !== undefined) {
      setRunId((r) => r + 1);
      setNoteVisible(false);
    }
  }, [start, resetToken, prevStart]);

  const perItemDelaySec = staggerMs / 2000;
  const handoffDelaySec = steps.length * perItemDelaySec + 0.2;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const doctorRef = React.useRef<HTMLDivElement>(null);
  const computerRef = React.useRef<HTMLDivElement>(null);
  const screenRef = React.useRef<HTMLDivElement>(null);

  const [coords, setCoords] = React.useState<{
    startLeft: number; startTop: number; endLeft: number; endTop: number;
  } | null>(null);

  const recomputeCoords = React.useCallback(() => {
    const container = containerRef.current;
    const doctor = doctorRef.current;
    const screen = screenRef.current;
    if (!container || !doctor || !screen) return;

    const cRect = container.getBoundingClientRect();
    const dRect = doctor.getBoundingClientRect();
    const sRect = screen.getBoundingClientRect();

    const dCx = dRect.left + dRect.width * 0.6;
    const dCy = dRect.top + dRect.height * 0.45;
    const sCx = sRect.left + sRect.width * 0.5;
    const sCy = sRect.top + sRect.height * 0.5;

    const fileHalf = 20; // for a 40x40px file icon

    setCoords({
      startLeft: dCx - cRect.left - fileHalf,
      startTop:  dCy - cRect.top  - fileHalf,
      endLeft:   sCx - cRect.left - fileHalf,
      endTop:    sCy - cRect.top  - fileHalf,
    });
  }, []);

  React.useLayoutEffect(() => {
    recomputeCoords();
    const onResize = () => recomputeCoords();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeCoords, runId]);

  return (
    <div className="w-full min-h-[420px]">
      <AnimatePresence mode="wait">
        {start && (
          <motion.div
            key={`doctor-root-${runId}`}
            ref={containerRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative w-full min-h-[420px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0" ref={doctorRef}>
                {doctorIconUrl ? (
                  <img src={doctorIconUrl} alt="doctor" className="w-24 h-39 object-contain" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-200" />
                )}
              </div>

              <div className="flex-1 pr-[440px]">
                <div className="text-slate-800 font-semibold mb-3">Post Diagnosis</div>
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <motion.div
                      key={`${s.title}-${i}-${runId}`}
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: perItemDelaySec * i,
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      className="rounded-lg border p-2 text-sm bg-indigo-50 border-indigo-200"
                    >
                      {s.title}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {!disableFinalHandoff && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-6">
                <div className="relative flex justify-center items-center" ref={computerRef} style={{ maxWidth: "400px", width: "400px" }}>
                  {computerIconUrl ? (
                    <img src={computerIconUrl} alt="Computer" className="w-full h-auto object-contain" />
                  ) : (
                    <div className="w-full aspect-[16/10] rounded-3xl bg-slate-200" />
                  )}

                  <div
                    ref={screenRef}
                    className="absolute flex flex-col items-center justify-center space-y-1"
                    style={{ top: "8%", left: "13%", width: "74%", height: "56%" }}
                  >
                    <MonitorCard
                      key={`clinical-note-${runId}`}
                      title={clinicalNoteText}
                      visible={noteVisible}
                      Icon={DefaultNoteIcon}
                      scale={1.5}
                    />
                  </div>
                </div>
              </div>
            )}

            {!disableFinalHandoff && fileIconUrl && coords && (
              <motion.img
                key={`handoff-file-${runId}`}
                src={fileIconUrl}
                alt="file"
                className="absolute w-10 h-10 object-contain" // increased size
                initial={{
                  opacity: 0,
                  left: coords.startLeft,
                  top: coords.startTop,
                  rotate: -8,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  left: [coords.startLeft, coords.endLeft],
                  top: [coords.startTop, coords.endTop],
                  rotate: 0,
                }}
                transition={{
                  delay: handoffDelaySec,
                  duration: 1.1,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                }}
                onAnimationComplete={() => setNoteVisible(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
