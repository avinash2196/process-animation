import CombinedAnimation from "./CombinedAnimation";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="w-[960px] max-w-full">
        <CombinedAnimation
          nurseIconUrl="/icons/nurse_icon.png"
          computerIconUrl="/icons/computer_icon.png"
          fileIconUrl="/icons/file-icon.png"
          doctorIconUrl="/icons/doctor-icon.png"
          bottomSteps={[
           { title: "Lab Order" }, { title: "Prescription Order" }, { title: "Imaging Order"},{ title: "Follow up"},{ title: "Referral"},
          ]}
          topDurationMs={6000}     // should match NurseAssessmentAnimation
          bridgeDurationMs={1600}
        />
      </div>
    </div>
  );
}
