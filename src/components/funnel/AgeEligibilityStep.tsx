import { useState } from 'react';
import { FunnelData, MONTHS } from '@/types/funnel';
import { ChevronDown } from 'lucide-react';

interface AgeEligibilityStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AgeEligibilityStep = ({ data, onUpdate, onNext, onBack }) => {
  const [error, setError] = useState("");

  const handleSelect = (value) => {
    onUpdate({ isEligibleAge: value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (data.isEligibleAge === undefined) {
      setError("Please select an option");
      return;
    }

    if (data.isEligibleAge === false) {
      setError("You must be between 18 and 80 years old");
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h1 className="form-title">Age Eligibility</h1>

      <p className="text-center text-muted-foreground mb-8">
        We currently treat adults between 18 and 80 years old.
        <br />
        Are you between 18 and 80 years old?
      </p>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => handleSelect(true)}
          className={`btn-primary ${
            data.isEligibleAge === true ? "opacity-100" : "opacity-70"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => handleSelect(false)}
          className={`btn-secondary ${
            data.isEligibleAge === false ? "opacity-100" : "opacity-70"
          }`}
        >
          No
        </button>
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
export default AgeEligibilityStep;
