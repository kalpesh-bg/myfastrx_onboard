import { useState, useEffect, useRef } from 'react';
// react-router removed; using window.location directly
import { FunnelData, initialFunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMarketingParams } from '@/hooks/useMarketingParams';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { generateUdi, getUserIp, sendLeadsV2 } from '@/services/leadCapture';
import { sendFormFill, getFormFillUnid } from '@/services/formFillWebhook';
import ProgressIndicator from './ProgressIndicator';
import BasicInfoStep from './BasicInfoStep';
import HealthBasicsStep from './HealthBasicsStep';
import SafetyScreeningStep from './SafetyScreeningStep';
import TreatmentStep from './TreatmentStep';
import CompletionStep from './CompletionStep';
import ExitIntentDialog from './ExitIntentDialog';
import logoImage from '@/assets/logo-myfastrx.png';

const STORAGE_KEY = 'myfastrx_funnel_progress';

/**
 * Safe localStorage wrapper that handles cases where storage is unavailable (e.g., bots, private browsing)
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage errors (e.g., quota exceeded, private browsing)
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage errors
    }
  },
};

const saveProgress = (data: FunnelData, step: number) => {
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
  } catch (e) {
    console.warn('Could not save funnel progress', e);
  }
};

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Health Basics' },
  { id: 3, label: 'Safety Screening' },
  { id: 4, label: 'Treatment' },
];

const STEP_NAMES = ['Basic Info', 'Health Basics', 'Safety Screening', 'Treatment'];

const WeightLossFunnel = () => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<FunnelData>(initialFunnelData);
  const [isComplete, setIsComplete] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const { trackFunnelStep, trackLead } = useAnalytics();

  // Generate fresh UDI on every page refresh/reload
  const udiRef = useRef<string>(generateUdi());

  // On page load/reload: clear saved progress so all fields start empty
  useEffect(() => {
    safeLocalStorage.removeItem(STORAGE_KEY);
    setData(initialFunnelData);
    setCurrentStep(1);
    setIsComplete(false);
    udiRef.current = generateUdi();
    window.history.replaceState({ step: 1 }, '', window.location.pathname);
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

  // Lead capture - get blur handler for form inputs
  const marketingParams = useMarketingParams();
  const { handleFieldBlur } = useLeadCapture(data, marketingParams, currentStep, udiRef.current);

  // Persist progress whenever data or step changes (skip on initial load)
  useEffect(() => {
    if (!isComplete && !isInitialLoad.current) {
      saveProgress(data, currentStep);
    }
  }, [data, currentStep, isComplete]);

  // Track step changes
  useEffect(() => {
    trackFunnelStep({ step: currentStep, stepName: STEP_NAMES[currentStep - 1] });
  }, [currentStep, trackFunnelStep]);

  const scrollToForm = () => {
    // Small delay to allow DOM to update before scrolling
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const updateData = (newData: Partial<FunnelData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      // Form-fill webhook: send continue button click (name, q_name, value, max_step, url)
      sendFormFill(getFormFillUnid(), 'continue', STEP_NAMES[currentStep - 1], { currentStep }).catch(() => { });

      // On Basic Info (step 1) Next: send consent fields with API names and "I agree." when true
      if (currentStep === 1) {
        sendFormFill(getFormFillUnid(), 'optin_sms_consent[]', data.smsConsent ? 'I agree.' : 'false', {
          currentStep: 1,
          q_name: 'q603_optin_sms_consent[]^input_603_0',
        }).catch(() => { });
        sendFormFill(getFormFillUnid(), '__email_opt_in[]', data.termsConsent ? 'I agree.' : 'false', {
          currentStep: 1,
          q_name: 'q201___email_opt_in[]^input_201_0',
        }).catch(() => { });
        // send_leads_v2: same unid as form-fill webhook
        // TEMPORARILY COMMENTED OUT
        // getUserIp().then((ip) =>
        //   sendLeadsV2(ip, getFormFillUnid(), window.location.href, [
        //     { name: 'optin_sms_consent[]', value: data.smsConsent ? 'I agree.' : 'false' },
        //     { name: '__email_opt_in[]', value: data.termsConsent ? 'I agree.' : 'false' },
        //   ])
        // ).catch(() => {});
      }

      // Track analytics lead when completing step 1
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
      // Update browser history for back button support
      window.history.pushState({ step: newStep }, '', window.location.pathname);
      scrollToForm();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      // Update browser history for back button support
      window.history.pushState({ step: newStep }, '', window.location.pathname);
      scrollToForm();
    }
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
      <div className="funnel-container bg-[#f0f8ff45]">
        <div className="max-w-7xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-6 md:mb-8">
            <img
              src={logoImage}
              alt="MyFastRx"
              className="h-12 md:h-20 mx-auto"
            />
          </div>

          {/* Progress Indicator - hide on completion */}
          {!isComplete && (
            <ProgressIndicator steps={STEPS} currentStep={displayStep} />
          )}

          {/* Step Content */}
          <div ref={formRef} className="animate-in fade-in duration-300 scroll-mt-4">
            {renderStep()}
          </div>
        </div>
      </div>
    </>
  );
};

export default WeightLossFunnel;
