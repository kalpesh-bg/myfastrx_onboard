import { Check } from "lucide-react";

const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="mb-4 md:mb-8">
      {/* mobile view */}
      <div className="md:hidden block ">

      {/* Top Row */}
      <div className="flex justify-between text-xs md:text-sm text-muted-foreground mb-2 px-2">
        <span>Step {currentStep} of {steps.length}</span>
        <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-4 md:mb-6">
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
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all
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
      {/* dsktop */}
      <div className="hidden md:block w-full max-w-6xl mx-auto px-0 py-6">
      <div className="flex items-center justify-between w-full gap-4">
        
        {/* Left Label */}
        <div className="text-sm font-semibold text-slate-700 min-w-[90px]">
          Step {currentStep} of {steps.length}
        </div>

        {/* Center: Progress Line Track and Circles */}
        <div className="relative flex-1 flex items-center justify-between mx-2 pl-[12%]">
          
          {/* Background Grey Track Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-slate-100 -translate-y-1/2 z-0" />

          {/* Active Blue Progress Line Fill */}
          <div 
            className="absolute top-1/2 left-0 h-[3px] bg-blue-600 -translate-y-1/2 transition-all duration-300 ease-in-out z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {/* Your Steps Circles Loop */}
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;

            return (
              <div 
                key={step.id || index} 
                className="relative z-10 flex items-center justify-center bg-white rounded-full"
              >
                <div
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300
                    ${isCompleted ? "bg-white border border-blue-100 text-blue-600 shadow-sm" : ""}
                    ${isActive ? "bg-blue-600 text-white font-bold ring-4 ring-blue-600/10 shadow-sm" : ""}
                    ${!isCompleted && !isActive ? "bg-white border border-slate-200 text-slate-400" : ""}
                  `}
                >
                  {isCompleted ? <Check size={18} strokeWidth={3} /> : stepNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Label */}
        <div className="text-sm font-semibold text-slate-700 min-w-[170px] text-right">
          {Math.round((currentStep / steps.length) * 100)}% Complete
        </div>

      </div>
    </div>
    </div>
  );
};

export default ProgressIndicator;