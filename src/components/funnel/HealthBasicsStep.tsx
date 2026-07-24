import { useState, useRef } from "react";

const HealthBasicsStep = ({ data, onUpdate, onNext, onBack, onFieldBlur }) => {
  const buttonsRef = useRef(null);

  const [errors, setErrors] = useState<{
    age?: string;
    meds?: string;
    weight?: string;
    height?: string;
  }>({});

  /** Body details + BMI only for new patients (not already on weight-loss meds). */
  const showBodyDetails =
    data.ageEligible === true && data.takingWeightLossMeds === false;

  const clearAgeError = () => {
    setErrors((prev) => {
      if (!prev.age) return prev;
      const { age: _age, ...rest } = prev;
      return rest;
    });
  };

  const validate = () => {
    const newErrors: { age?: string; meds?: string; weight?: string; height?: string } = {};

    if (data.ageEligible === undefined) {
      newErrors.age = "Please select Yes or No";
      setErrors(newErrors);
      return false;
    }

    if (data.ageEligible === false) {
      newErrors.age = "You must be between 18 and 80 years old to proceed.";
      setErrors(newErrors);
      return false;
    }

    if (data.takingWeightLossMeds == null) {
      newErrors.meds = "Please select Yes or No";
    }

    if (showBodyDetails) {
      if (!data.weight) {
        newErrors.weight = "Please enter your weight";
      }
      if (!data.heightFeet || !data.heightInches) {
        newErrors.height = "Please enter your height";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onNext();
  };

  const MEDICATION_OPTIONS = [
    { id: "semaglutide", label: "Semaglutide (Ozempic, Wegovy, Rybelsus)" },
    { id: "tirzepatide", label: "Tirzepatide (Mounjaro, Zepbound)" },
    { id: "liraglutide", label: "Liraglutide (Saxenda, Victoza)" },
    { id: "other", label: "Other weight-loss medication" },
  ];

  const toggleMedication = (id) => {
    let updated = data.currentMedications || [];

    if (updated.includes(id)) {
      updated = updated.filter((m) => m !== id);
    } else {
      updated = [...updated, id];
    }

    onUpdate({ currentMedications: updated });
    onFieldBlur?.("currentMedications", updated);
  };

  return (
    <form onSubmit={handleSubmit} className="form-section space-y-12">

      {/* AGE */}
      <div>
        <h1 className="form-title">Age Eligibility</h1>

        <p className="text-center text-muted-foreground mb-6">
          We currently treat adults between 18 and 80 years old.
        </p>

        <p className="text-center mb-4">
          Are you between 18 and 80 years old?
        </p>

        <div className="flex justify-center gap-4 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => {
              onUpdate({ ageEligible: true });
              onFieldBlur?.("ageEligible", true);
              clearAgeError();
            }}
            className={`flex-1 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${data.ageEligible === true
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:border-primary/50"
              }`}
          >
            Yes
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdate({ ageEligible: false });
              onFieldBlur?.("ageEligible", false);
              clearAgeError();
            }}
            className={`flex-1 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${data.ageEligible === false
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:border-primary/50"
              }`}
          >
            No
          </button>
        </div>

        {errors.age && (
          <p className="text-destructive text-center mt-4">{errors.age}</p>
        )}
      </div>


      {/* MEDS — ask before body details; BMI section only if they answer No */}
      <div>
        <h2 className="form-title">Current Weight-Loss Medications</h2>

        <p className="text-center text-muted-foreground mb-6">
          We ask this to ensure your care is safe, personalized, and medically appropriate.
        </p>

        <p className="text-center mb-4">
          Are you currently taking any weight-loss medications?
        </p>

        <div className="flex justify-center gap-4 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => {
              onUpdate({
                takingWeightLossMeds: true,
                weight: "",
                heightFeet: "",
                heightInches: "",
              });
              onFieldBlur?.("takingWeightLossMeds", true);
            }}
            className={`flex-1 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${data.takingWeightLossMeds === true
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:border-primary/50"
              }`}
          >
            Yes
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdate({ takingWeightLossMeds: false });
              onFieldBlur?.("takingWeightLossMeds", false);
            }}
            className={`flex-1 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${data.takingWeightLossMeds === false
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:border-primary/50"
              }`}
          >
            No
          </button>
        </div>

        {/* {data.takingWeightLossMeds === true && (
  <div className="mt-6 max-w-lg mx-auto space-y-3">

    <p className="text-sm text-muted-foreground mb-2">
      Please select which medications you're currently taking:
    </p>

    {MEDICATION_OPTIONS.map((med) => {
      const isSelected = data.currentMedications?.includes(med.id);

      return (
        <button
          key={med.id}
          type="button"
          onClick={() => toggleMedication(med.id)}
          className={`
            w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
            ${isSelected
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-background border-input hover:border-primary/40"
            }
          `}
        >
          <div
            className={`
              w-5 h-5 flex items-center justify-center rounded border
              ${isSelected ? "bg-white border-white" : "border-gray-300"}
            `}
          >
            {isSelected && (
              <span className="text-primary text-sm font-bold">✓</span>
            )}
          </div>

          <span className="text-sm font-medium">
            {med.label}
          </span>
        </button>
      );
    })}
  </div>
)} */}

        {errors.meds && (
          <p className="text-destructive text-center mt-4">{errors.meds}</p>
        )}
      </div>

      {/* HEIGHT & WEIGHT + BMI — only when not already on weight-loss meds */}
      {showBodyDetails && (
        <div>
          <h2 className="form-title">Your Body Details</h2>

          <p className="text-center text-muted-foreground mb-6">
            This helps us check eligibility and personalize your treatment plan.
          </p>

          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <label className="form-label form-label-required text-center block">
                What is your current weight?
              </label>
              <input
                type="number"
                value={data.weight || ""}
                onChange={(e) => onUpdate({ weight: e.target.value })}
                onBlur={() => onFieldBlur?.("weight", data.weight || null)}
                className="form-input text-center"
                placeholder="Enter weight (lbs)"
              />
            </div>

            {errors.weight && (
              <p className="text-destructive text-center mt-2">{errors.weight}</p>
            )}

            <div>
              <label className="form-label form-label-required text-center block">
                What is your height?
              </label>

              <div className="flex gap-4">
                <input
                  type="number"
                  value={data.heightFeet || ""}
                  onChange={(e) => onUpdate({ heightFeet: e.target.value })}
                  onBlur={() => onFieldBlur?.("heightFeet", data.heightFeet || null)}
                  className="form-input text-center"
                  placeholder="Feet"
                />

                <input
                  type="number"
                  value={data.heightInches || ""}
                  onChange={(e) => onUpdate({ heightInches: e.target.value })}
                  onBlur={() => onFieldBlur?.("heightInches", data.heightInches || null)}
                  className="form-input text-center"
                  placeholder="Inches"
                />
              </div>
            </div>

            {errors.height && (
              <p className="text-destructive text-center mt-2">{errors.height}</p>
            )}
          </div>
        </div>
      )}


      {/* BUTTONS */}
      <div ref={buttonsRef} className="flex justify-center gap-4 mb-3">
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

export default HealthBasicsStep;