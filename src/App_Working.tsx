import NurseAssessmentAnimation from "./NurseAssessmentAnimation";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <NurseAssessmentAnimation
          nurseIconUrl="/icons/nurse_icon.png"
          computerIconUrl="/icons/computer_icon.png"
		  fileIconUrl="/icons/file-icon.png"
        />
      </div>
    </div>
  );
}
