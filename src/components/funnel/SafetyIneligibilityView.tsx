import { ArrowLeft, X } from 'lucide-react';

interface SafetyIneligibilityViewProps {
  onReviewAnswers: () => void;
}

const SafetyIneligibilityView = ({ onReviewAnswers }: SafetyIneligibilityViewProps) => {
  return (
    <div className="form-section">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-border shadow-sm px-6 py-10 md:px-10 md:py-12 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div className="  flex items-center justify-center pointer-events-none">
            <svg
              className="  w-[72px] h-8 text-primary/40"
              viewBox="0 0 72 32"
              fill="none"
              aria-hidden
            >
              <path
                d="M0 16 L8 16 L10 8 L14 24 L18 4 L22 28 L26 12 L30 20 L36 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="relative z-10 w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <X className="w-9 h-9 text-primary" strokeWidth={2.5} />
          </div>
            <svg
              className="  w-[72px] h-8 text-primary/40 scale-x-[-1]"
              viewBox="0 0 72 32"
              fill="none"
              aria-hidden
            >
              <path
                d="M0 16 L8 16 L10 8 L14 24 L18 4 L22 28 L26 12 L30 20 L36 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          You May Not Be Eligible
        </h1>

        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
          Based on your responses, it appears you may not currently meet the eligibility
          requirements for this program. If you believe this may be incorrect, please review
          and update your answers.
        </p>

        <button
          type="button"
          onClick={onReviewAnswers}
          className="btn-primary inline-flex items-center justify-center gap-2 w-full max-w-sm mx-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Review Your Answers
        </button>
      </div>
    </div>
  );
};

export default SafetyIneligibilityView;
