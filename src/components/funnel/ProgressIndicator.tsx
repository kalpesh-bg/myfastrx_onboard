import { Check } from "lucide-react";

const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="mb-4 md:mb-5">
      {/* mobile view */}
      <div className="md:hidden block ">

        <div className="flex  justify-center w-full gap-2 items-center relative ">
          
          {/* Left Label */}
          <div className="text-[11px] font-semibold text-slate-700 text-center absolute left-0">
            Step {currentStep} of {steps.length}
          </div>

          {/* Center: Progress Line Track and Circles */}
          <div className="relative flex-1 flex  items-center justify-between mx-2 max-w-[220px]">
            
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
                      w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300
                      ${isCompleted ? "bg-white border border-gray-100 text-primary shadow-sm" : ""}
                      ${isActive ? "bg-blue-600 text-white font-bold  shadow-sm" : ""}
                      ${!isCompleted && !isActive ? "bg-white border border-slate-200 text-slate-400" : ""}
                    `}
                  >
                    {isCompleted ? <Check size={18} strokeWidth={3} /> : stepNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* dsktop */}
      <div className="hidden md:block w-full max-w-xl mx-auto px-0 py-4">
        <div className="flex  justify-between w-full gap-2 flex-col">
          
          {/* Left Label */}
          <div className="text-sm font-semibold text-slate-700 text-center">
            Step {currentStep} of {steps.length}
          </div>

          {/* Center: Progress Line Track and Circles */}
          <div className="relative flex-1 flex  items-center justify-between mx-2 px-[12%] ">
            
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
                      ${isCompleted ? "bg-primary border border-blue-100 text-white shadow-sm" : ""}
                      ${isActive ? "bg-blue-600 text-white font-bold  ring-blue-600/10 shadow-sm" : ""}
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
          {/* <div className="text-sm font-semibold text-slate-700 min-w-[170px] text-right">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </div> */}

        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;