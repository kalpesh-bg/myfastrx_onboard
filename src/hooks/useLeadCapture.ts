import { useEffect, useRef, useCallback } from 'react';
import { FunnelData } from '@/types/funnel';
import { MarketingParams } from '@/types/leadCapture';
import {
  formatPhoneForApi,
  generateUdi,
  getUserIp,
  sendLeadsV2,
} from '@/services/leadCapture';
import { sendFormFill, getFormFillUnid } from '@/services/formFillWebhook';

type FieldValue = string | boolean | number | string[] | null;
type FieldMap = { [key: string]: FieldValue };

/**
 * Extract field values from FunnelData for comparison
 */
const extractFieldValues = (data: FunnelData): FieldMap => {
  // Combine birthday into single field (MM/DD/YYYY format)
  let birthday: string | null = null;
  if (data.birthMonth && data.birthDay && data.birthYear) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(data.birthMonth);
    if (monthIndex !== -1) {
      const month = String(monthIndex + 1).padStart(2, '0');
      const day = data.birthDay.padStart(2, '0');
      birthday = `${month}/${day}/${data.birthYear}`;
    }
  }

  return {
    state: data.state || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    email: data.email || null,
    phone: formatPhoneForApi(data.phone) || null,
    smsConsent: data.smsConsent,
    emailConsent: data.termsConsent,
    birthday,
    takingWeightLossMeds: data.takingWeightLossMeds,
    currentMedications: data.currentMedications.length > 0 ? [...data.currentMedications] : null,
    heightFeet: data.heightFeet || null,
    heightInches: data.heightInches || null,
    weight: data.weight || null,
    safetyConditions: data.safetyConditions.length > 0 ? [...data.safetyConditions] : null,
    selectedTreatment: data.selectedTreatment || null,
  };
};

export const useLeadCapture = (
  data: FunnelData,
  marketingParams: MarketingParams,
  currentStep: number,
  udi?: string,
  options?: { sessionRestored?: boolean }
) => {
  // Use object refs that we can mutate
  const lastSentValuesRef = useRef<FieldMap>({});
  const maxStepRef = useRef<number>(currentStep);
  const currentStepRef = useRef<number>(currentStep);
  const dataRef = useRef<FunnelData>(data);
  const marketingParamsRef = useRef<MarketingParams>(marketingParams);
  const skipAutofillWebhooksRef = useRef<boolean>(options?.sessionRestored ?? false);
  // Use provided UDI or generate fresh one on every page refresh/reload
  const udiRef = useRef<string>(udi || generateUdi());

  currentStepRef.current = currentStep;

  // Update UDI if provided (fresh on every page refresh)
  useEffect(() => {
    if (udi) {
      udiRef.current = udi;
      console.log('[LeadCapture] UDI updated from parent:', udiRef.current);
    } else {
      udiRef.current = generateUdi();
      console.log('[LeadCapture] Fresh UDI generated on page refresh:', udiRef.current);
    }
  }, [udi]);

  // Keep refs in sync
  dataRef.current = data;
  marketingParamsRef.current = marketingParams;

  // Track the maximum step reached
  useEffect(() => {
    if (currentStep > maxStepRef.current) {
      maxStepRef.current = currentStep;
    }
  }, [currentStep]);

  // Function to send field update on blur
  const handleFieldBlur = useCallback(async (fieldName: string, fieldValue: string | boolean | number | string[] | null) => {
    // Skip if value is empty
    if (fieldValue === null || fieldValue === '' || 
        (Array.isArray(fieldValue) && fieldValue.length === 0)) {
      return;
    }

    // Skip if value hasn't changed
    const lastSent = lastSentValuesRef.current;
    if (lastSent[fieldName] === fieldValue) {
      return;
    }

    // Form-fill webhook: every input/checkbox sends (unid, name, q_name, value, max_step, url)
    const step = currentStepRef.current;
    let v2Name = fieldName;
    let v2Value: string;
    if (fieldName === 'emailConsent') {
      v2Name = '__email_opt_in[]';
      v2Value = fieldValue === true ? 'I agree.' : 'false';
      sendFormFill(getFormFillUnid(), v2Name, v2Value, {
        currentStep: step,
        q_name: 'q201___email_opt_in[]^input_201_0',
      }).catch(() => {});
    } else if (fieldName === 'smsConsent') {
      v2Name = 'optin_sms_consent[]';
      v2Value = fieldValue === true ? 'I agree.' : 'false';
      sendFormFill(getFormFillUnid(), v2Name, v2Value, {
        currentStep: step,
        q_name: 'q603_optin_sms_consent[]^input_603_0',
      }).catch(() => {});
    } else {
      v2Value = Array.isArray(fieldValue)
        ? fieldValue.join(', ')
        : typeof fieldValue === 'boolean'
          ? fieldValue
            ? 'true'
            : 'false'
          : String(fieldValue);
      sendFormFill(getFormFillUnid(), fieldName, fieldValue, { currentStep: step }).catch(() => {});
    }

    // send_leads_v2: same unid as form-fill webhook, same field (ip, unid, url, payload)
    // getUserIp().then((ip) =>
    //   sendLeadsV2(ip, getFormFillUnid(), window.location.href, [{ name: v2Name, value: v2Value }])
    // ).catch(() => {});

    // send_leads (original) disabled for now
    // try {
    //   const success = await sendFieldUpdate(
    //     udiRef.current,
    //     fieldName,
    //     fieldValue,
    //     maxStepRef.current
    //   );
    //   if (success) lastSentValuesRef.current[fieldName] = fieldValue;
    // } catch (error) {
    //   console.error('[LeadCapture] Error sending field update on blur:', error);
    // }
    lastSentValuesRef.current[fieldName] = fieldValue;
  }, []);

  // Function to check and send webhooks for any fields that have values but haven't been sent yet
  const checkAndSendAutofilledFields = useCallback(() => {
    const currentValues = extractFieldValues(dataRef.current);
    const lastSent = lastSentValuesRef.current;

    // Check each field and send webhook if it has a value that hasn't been sent
    Object.keys(currentValues).forEach((fieldName) => {
      const fieldValue = currentValues[fieldName];
      
      // Skip if value is empty
      if (fieldValue === null || fieldValue === '' || 
          (Array.isArray(fieldValue) && fieldValue.length === 0)) {
        return;
      }

      // Skip if value hasn't changed from what we've already sent
      if (lastSent[fieldName] === fieldValue) {
        return;
      }

      // Send webhook for this field
      handleFieldBlur(fieldName, fieldValue);
    });
  }, [handleFieldBlur]);

  // Immediate send function for page exit (send_leads API disabled for now)
  const sendImmediately = useCallback(() => {
    // if (!hasMinimumLeadData(dataRef.current)) return;
    // const payload = buildLeadPayload(
    //   dataRef.current,
    //   marketingParamsRef.current,
    //   maxStepRef.current,
    //   udiRef.current
    // );
    // const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    // navigator.sendBeacon(LEAD_API_CONFIG.endpoint, blob);
  }, []);

  // Listen for page exit events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendImmediately();
      }
    };

    const handleBeforeUnload = () => {
      sendImmediately();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [sendImmediately]);

  // Detect autofilled values: Check after mount and when data changes
  useEffect(() => {
    if (skipAutofillWebhooksRef.current) {
      // Restored session: mark existing values as sent without re-firing webhooks
      lastSentValuesRef.current = extractFieldValues(dataRef.current);
      skipAutofillWebhooksRef.current = false;
      return;
    }

    // Check immediately when data changes (catches autofill that happens after mount)
    checkAndSendAutofilledFields();

    // Also check after delays to catch autofill that happens asynchronously
    const timeout1 = setTimeout(() => {
      checkAndSendAutofilledFields();
    }, 100); // Check after 100ms

    const timeout2 = setTimeout(() => {
      checkAndSendAutofilledFields();
    }, 500); // Check after 500ms

    const timeout3 = setTimeout(() => {
      checkAndSendAutofilledFields();
    }, 1000); // Check after 1 second

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [data, checkAndSendAutofilledFields]);

  // Listen for autofill animation events (browsers trigger this when autofill occurs)
  useEffect(() => {
    const handleAutofill = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart' || e.animationName === 'autofill') {
        // Small delay to ensure values are populated
        setTimeout(() => {
          checkAndSendAutofilledFields();
        }, 50);
      }
    };

    // Add CSS animation to detect autofill (only add once)
    let style = document.getElementById('autofill-detection-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'autofill-detection-style';
      style.textContent = `
        @keyframes onAutoFillStart {
          from { opacity: 0; }
          to { opacity: 0; }
        }
        input:-webkit-autofill {
          animation-name: onAutoFillStart;
          animation-duration: 0.001s;
        }
      `;
      document.head.appendChild(style);
    }

    // Use event delegation on the document to catch autofill on any input
    const handleAnimationStart = (e: Event) => {
      const animationEvent = e as AnimationEvent;
      handleAutofill(animationEvent);
    };

    document.addEventListener('animationstart', handleAnimationStart, true);

    return () => {
      document.removeEventListener('animationstart', handleAnimationStart, true);
    };
  }, [checkAndSendAutofilledFields]);

  // Listen for input events as a fallback (catches autofill that doesn't trigger blur)
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        // Small delay to ensure the value is updated in React state
        setTimeout(() => {
          checkAndSendAutofilledFields();
        }, 50);
      }
    };

    // Use event delegation on the document to catch input events on any form element
    document.addEventListener('input', handleInput, true);

    return () => {
      document.removeEventListener('input', handleInput, true);
    };
  }, [checkAndSendAutofilledFields]);

  // Return the blur handler function for form components to use
  return { handleFieldBlur };
};
