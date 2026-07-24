import { useState } from 'react';
import { FunnelData, SAFETY_CONDITIONS } from '@/types/funnel';
import { Check } from 'lucide-react';
import SafetyIneligibilityView from './SafetyIneligibilityView';

const isDisqualified = (conditions: string[]) =>
  conditions.some((c) => c !== 'none');

interface SafetyScreeningStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onNext: () => void;
  onBack: () => void;
  onFieldBlur?: (fieldName: string, fieldValue: string | boolean | number | string[] | null) => void;
}

const SafetyScreeningStep = ({ data, onUpdate, onNext, onBack, onFieldBlur }: SafetyScreeningStepProps) => {
  const [error, setError] = useState('');
  const [showIneligibility, setShowIneligibility] = useState(false);

  const toggleCondition = (id: string) => {
    let newConditions: string[];

    if (id === 'none') {
      // If "none" is selected, clear all others
      newConditions = data.safetyConditions.includes('none') ? [] : ['none'];
    } else {
      // If selecting another option, remove "none" if present
      const withoutNone = data.safetyConditions.filter((c) => c !== 'none');
      if (withoutNone.includes(id)) {
        newConditions = withoutNone.filter((c) => c !== id);
      } else {
        newConditions = [...withoutNone, id];
      }
    }

    onUpdate({ safetyConditions: newConditions });
    onFieldBlur?.('safetyConditions', newConditions.length > 0 ? newConditions : null);
    setError('');
  };

  const validate = () => {
    if (data.safetyConditions.length === 0) {
      setError('Please select at least one option');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    if (isDisqualified(data.safetyConditions)) {
      setShowIneligibility(true);
      return;
    }
    onNext();
  };

  const handleReviewAnswers = () => {
    setError('');
    setShowIneligibility(false);
  };

  if (showIneligibility) {
    return <SafetyIneligibilityView onReviewAnswers={handleReviewAnswers} />;
  }

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h1 className="form-title">Quick Safety Check</h1>
      
      <p className="text-center text-muted-foreground mb-8">
        This only takes a few seconds and helps our doctors make sure GLP-1 medication is safe for you.
      </p>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {SAFETY_CONDITIONS.map((condition) => {
          const isSelected = data.safetyConditions.includes(condition.id);
          return (
            <button
              key={condition.id}
              type="button"
              onClick={() => toggleCondition(condition.id)}
              className={`w-full checkbox-option text-left ${isSelected ? 'checkbox-option-selected' : ''}`}
            >
              <div
                className={`w-6 h-6 min-w-6 rounded border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary-foreground border-primary-foreground'
                    : 'border-input'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
              <span className={condition.bold ? 'font-bold' : ''}>
                {condition.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Duplicate "NONE OF THE ABOVE APPLY TO ME" checkbox at the bottom */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => toggleCondition('none')}
          className={`w-full checkbox-option text-left ${data.safetyConditions.includes('none') ? 'checkbox-option-selected' : ''}`}
        >
          <div
            className={`w-6 h-6 min-w-6 rounded border-2 flex items-center justify-center transition-all ${
              data.safetyConditions.includes('none')
                ? 'bg-primary-foreground border-primary-foreground'
                : 'border-input'
            }`}
          >
            {data.safetyConditions.includes('none') && <Check className="w-4 h-4 text-primary" />}
          </div>
          <span className="font-bold">
            NONE OF THE ABOVE APPLY TO ME
          </span>
        </button>
      </div>

      {error && (
        <p className="text-destructive text-center mt-4">{error}</p>
      )}

      <div className="mt-8 flex justify-center gap-4 mb-3">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary">
          Confirm & Continue
        </button>
      </div>
    </form>
  );
};

export default SafetyScreeningStep;
