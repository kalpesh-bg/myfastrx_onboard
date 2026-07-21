import { useState, useEffect, useRef } from 'react';
import { FunnelData, initialFunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMarketingParams } from '@/hooks/useMarketingParams';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { generateUdi } from '@/services/leadCapture';
import { sendFormFill, getFormFillUnid, restoreFormFillUnid } from '@/services/formFillWebhook';
import {
  loadSavedProgress,
  saveFunnelProgress,
  type PlanId,
  type SavedFunnelProgress,
} from '@/lib/funnelPersistence';
import ProgressIndicator from './ProgressIndicator';
import BasicInfoStep from './BasicInfoStep';
import HealthBasicsStep from './HealthBasicsStep';
import SafetyScreeningStep from './SafetyScreeningStep';
import TreatmentStep from './TreatmentStep';
import CompletionStep from './CompletionStep';
import ExitIntentDialog from './ExitIntentDialog';
import logoImage from '@/assets/logo-myfastrx.png';

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Health Basics' },
  { id: 3, label: 'Safety Screening' },
  { id: 4, label: 'Treatment' },
];

const STEP_NAMES = ['Basic Info', 'Health Basics', 'Safety Screening', 'Treatment'];

const getInitialState = () => {
  const saved = loadSavedProgress();
  if (!saved) {
    return {
      currentStep: 1,
      data: initialFunnelData,
      udi: generateUdi(),
      sessionRestored: false,
    };
  }

  if (saved.formFillUnid) {
    restoreFormFillUnid(saved.formFillUnid);
  }

  return {
    currentStep: saved.step,
    data: saved.data,
    udi: saved.udi || generateUdi(),
    sessionRestored: true,
  };
};

const WeightLossFunnel = () => {
  const initialStateRef = useRef(getInitialState());
  const initialState = initialStateRef.current;

  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [data, setData] = useState<FunnelData>(initialState.data);
  const [isComplete, setIsComplete] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const skipNextStepAnalyticsRef = useRef(initialState.sessionRestored);
  const { trackFunnelStep, trackLead } = useAnalytics();
  const udiRef = useRef<string>(initialState.udi);

  useEffect(() => {
    window.history.replaceState({ step: initialState.currentStep }, '', window.location.pathname);
    isInitialLoad.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.step === 'number') {
        const step = event.state.step;
        if (step >= 1 && step <= 4 && step !== currentStep) {
          setCurrentStep(step);
          scrollToForm();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  const marketingParams = useMarketingParams();
  const { handleFieldBlur } = useLeadCapture(
    data,
    marketingParams,
    currentStep,
    udiRef.current,
    { sessionRestored: initialState.sessionRestored }
  );

  const persistProgress = (nextData: FunnelData, step: number, selectedPlanId?: PlanId | null) => {
    const progress: SavedFunnelProgress = {
      data: {
        ...nextData,
        selectedPlanId: selectedPlanId ?? nextData.selectedPlanId ?? null,
      },
      step,
      udi: udiRef.current,
      formFillUnid: getFormFillUnid(),
      selectedPlanId: selectedPlanId ?? nextData.selectedPlanId ?? null,
    };
    saveFunnelProgress(progress);
  };

  // Persist progress whenever data or step changes (skip on initial load)
  useEffect(() => {
    if (!isComplete && !isInitialLoad.current) {
      persistProgress(data, currentStep);
    }
  }, [data, currentStep, isComplete]);

  // Track step changes (skip once when restoring a saved session to avoid duplicate pixels)
  useEffect(() => {
    if (skipNextStepAnalyticsRef.current) {
      skipNextStepAnalyticsRef.current = false;
      return;
    }
    trackFunnelStep({ step: currentStep, stepName: STEP_NAMES[currentStep - 1] });
  }, [currentStep, trackFunnelStep]);

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const updateData = (newData: Partial<FunnelData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      sendFormFill(getFormFillUnid(), 'continue', STEP_NAMES[currentStep - 1], { currentStep }).catch(() => {});

      if (currentStep === 1) {
        sendFormFill(getFormFillUnid(), 'optin_sms_consent[]', data.smsConsent ? 'I agree.' : 'false', {
          currentStep: 1,
          q_name: 'q603_optin_sms_consent[]^input_603_0',
        }).catch(() => {});
        sendFormFill(getFormFillUnid(), '__email_opt_in[]', data.termsConsent ? 'I agree.' : 'false', {
          currentStep: 1,
          q_name: 'q201___email_opt_in[]^input_201_0',
        }).catch(() => {});
      }

      if (currentStep === 1) {
        trackLead({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        });
      }

      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      window.history.pushState({ step: newStep }, '', window.location.pathname);
      scrollToForm();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      window.history.pushState({ step: newStep }, '', window.location.pathname);
      scrollToForm();
    }
  };

  const handleBeforeCheckout = (updates: Partial<FunnelData>) => {
    const mergedData = { ...data, ...updates };
    setData(mergedData);
    persistProgress(mergedData, currentStep, updates.selectedPlanId ?? mergedData.selectedPlanId);
  };

  const handleComplete = () => {
    setIsComplete(true);
    scrollToForm();
    console.log('Funnel completed with data:', data);
  };

  const renderStep = () => {
    if (isComplete) {
      return <CompletionStep data={data} />;
    }

    switch (currentStep) {
      case 1:
        return <BasicInfoStep data={data} onUpdate={updateData} onNext={nextStep} onFieldBlur={handleFieldBlur} />;
      case 2:
        return (
          <HealthBasicsStep
            data={data}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
            onFieldBlur={handleFieldBlur}
          />
        );
      case 3:
        return (
          <SafetyScreeningStep
            data={data}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
            onFieldBlur={handleFieldBlur}
          />
        );
      case 4:
        return (
          <TreatmentStep
            data={data}
            onUpdate={updateData}
            onComplete={handleComplete}
            onBack={prevStep}
            onBeforeCheckout={handleBeforeCheckout}
            uniqueId={udiRef.current}
            onFieldBlur={handleFieldBlur}
          />
        );
      default:
        return null;
    }
  };

  const displayStep = currentStep;

  return (
    <>
      {/* <ExitIntentDialog isComplete={isComplete} /> */}
      <div className="funnel-container bg-sky-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <img src={logoImage} alt="MyFastRx" className="h-12 md:h-20 mx-auto" />
          </div>

          {!isComplete && <ProgressIndicator steps={STEPS} currentStep={displayStep} />}

          <div ref={formRef} className="animate-in fade-in duration-300 scroll-mt-4">
            {renderStep()}
          </div>
        </div>
      </div>
    </>
  );
};

export default WeightLossFunnel;
