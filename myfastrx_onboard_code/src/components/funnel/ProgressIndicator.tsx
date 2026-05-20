import { Check } from "lucide-react";

const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">

      {/* Top Row */}
      <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
        <span>Step {currentStep} of {steps.length}</span>
        <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps Circles */}
      <div className="flex justify-center items-center gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;

          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              className={`
                w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all
                ${isCompleted ? "bg-blue-100 text-primary" : ""}
                ${isActive ? "bg-primary text-white shadow-md" : ""}
                ${!isCompleted && !isActive ? "bg-gray-200 text-gray-500" : ""}
              `}
            >
              {isCompleted ? <Check size={16} /> : stepNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;