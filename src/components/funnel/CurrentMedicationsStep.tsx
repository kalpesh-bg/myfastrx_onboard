import { useState } from 'react';
import { FunnelData, CURRENT_MEDICATIONS } from '@/types/funnel';
import { Check } from 'lucide-react';

interface CurrentMedicationsStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CurrentMedicationsStep = ({ data, onUpdate, onNext, onBack }: CurrentMedicationsStepProps) => {
  const [error, setError] = useState('');

  const toggleMedication = (id: string) => {
    let newMedications: string[];

    if (id === 'none') {
      // If "none" is selected, clear all others
      newMedications = data.currentMedications.includes('none') ? [] : ['none'];
    } else {
      // If selecting another option, remove "none" if present
      const withoutNone = data.currentMedications.filter((m) => m !== 'none');
      if (withoutNone.includes(id)) {
        newMedications = withoutNone.filter((m) => m !== id);
      } else {
        newMedications = [...withoutNone, id];
      }
    }

    onUpdate({ currentMedications: newMedications });
    setError('');
  };

  const validate = () => {
    if (data.currentMedications.length === 0) {
      setError('Please select at least one option');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h1 className="form-title">Current Weight-Loss Medications</h1>
      
      <p className="text-center text-muted-foreground mb-8">
        We ask this to ensure your care is safe, personalized, and medically appropriate.
      </p>

      <div className="space-y-3">
        {CURRENT_MEDICATIONS.map((medication) => {
          const isSelected = data.currentMedications.includes(medication.id);
          return (
            <button
              key={medication.id}
              type="button"
              onClick={() => toggleMedication(medication.id)}
              className={`w-full checkbox-option ${isSelected ? 'checkbox-option-selected' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary-foreground border-primary-foreground'
                    : 'border-input'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
              <span className={medication.id === 'none' ? 'font-semibold' : ''}>
                {medication.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-destructive text-center mt-4">{error}</p>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary">
          Next
        </button>
      </div>
    </form>
  );
};

export default CurrentMedicationsStep;
