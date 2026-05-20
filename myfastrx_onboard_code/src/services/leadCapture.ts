import { FunnelData } from '@/types/funnel';
import { LeadPayloadData, MarketingParams, LEAD_API_CONFIG } from '@/types/leadCapture';

/**
 * Generate a random unique ID for session tracking
 */
export const generateUdi = (): string => {
  // Generate a numeric-style ID (timestamp + random)
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

/**
 * Safe sessionStorage wrapper that handles cases where storage is unavailable (e.g., bots, private browsing)
 */
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage errors (e.g., quota exceeded, private browsing)
    }
  },
};

/**
 * Get or create a persistent udi for this session
 */
const SESSION_UDI_KEY = 'lead_capture_udi';

export const getSessionUdi = (): string => {
  let udi = safeSessionStorage.getItem(SESSION_UDI_KEY);
  if (!udi) {
    udi = generateUdi();
    safeSessionStorage.setItem(SESSION_UDI_KEY, udi);
  }
  return udi;
};

/**
 * Format phone from (555) 123-4567 to (555) 123-4567 (keep formatted for API)
 */
export const formatPhoneForApi = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return '';
};

/**
 * Calculate BMI from height (feet/inches) and weight (lbs)
 */
export const calculateBmi = (heightFeet: string, heightInches: string, weight: string): number | undefined => {
  const feet = parseInt(heightFeet, 10);
  const inches = parseInt(heightInches, 10);
  const weightLbs = parseFloat(weight);
  
  if (isNaN(feet) || isNaN(inches) || isNaN(weightLbs)) return undefined;
  
  const totalInches = feet * 12 + inches;
  if (totalInches <= 0 || weightLbs <= 0) return undefined;
  
  // BMI = (weight in lbs / (height in inches)²) × 703
  const bmi = (weightLbs / (totalInches * totalInches)) * 703;
  return Math.round(bmi * 10) / 10;
};

/**
 * Check if we have minimum data to send (email or phone)
 */
export const hasMinimumLeadData = (data: FunnelData): boolean => {
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const hasValidPhone = data.phone.replace(/\D/g, '').length === 10;
  return hasValidEmail || hasValidPhone;
};

/**
 * Get user's IP address using a public API
 */
let cachedIp: string | null = null;
let ipFetchPromise: Promise<string> | null = null;

export const getUserIp = async (): Promise<string> => {
  // Return cached IP if available
  if (cachedIp) {
    return cachedIp;
  }

  // Return existing promise if already fetching
  if (ipFetchPromise) {
    return ipFetchPromise;
  }

  // Fetch IP address
  ipFetchPromise = fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
      cachedIp = data.ip || 'unknown';
      return cachedIp;
    })
    .catch(error => {
      console.error('[LeadCapture] Failed to fetch IP:', error);
      return 'unknown';
    })
    .finally(() => {
      ipFetchPromise = null;
    });

  return ipFetchPromise;
};

/**
 * Send a single field update to send_leads_v2 (called after every input/field update).
 * Payload: { ip, unid, url, payload: [{ name, value }] }
 */
export const sendLeadsV2 = async (
  ip: string,
  unid: string,
  url: string,
  payload: Array<{ name: string; value: string }>
): Promise<void> => {
  if (payload.length === 0) return;
  try {
    await fetch(LEAD_API_CONFIG.sendLeadsV2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, unid, url, payload }),
    });
  } catch (err) {
    console.warn('[LeadCapture] send_leads_v2 failed:', err);
  }
};

/**
 * Send a single field update to the API in new format (called on input blur)
 */
export const sendFieldUpdate = async (
  udi: string,
  fieldName: string,
  fieldValue: string | boolean | number | string[],
  maxStep: number
): Promise<boolean> => {
  // Get IP address
  const ip = await getUserIp();
  
  // Get current URL
  const url = window.location.href;
  
  // Convert field value to string for the API
  let valueString: string;
  if (Array.isArray(fieldValue)) {
    valueString = fieldValue.join(', ');
  } else if (typeof fieldValue === 'boolean') {
    valueString = fieldValue ? 'true' : 'false';
  } else {
    valueString = String(fieldValue);
  }

  const payload = {
    ip,
    unid: udi,
    url,
    payload: [
      { name: fieldName, value: valueString },
    ],
  };

  console.log('[LeadCapture] Sending field update on blur:', {
    endpoint: LEAD_API_CONFIG.endpoint,
    fieldName,
    fieldValue: valueString,
    payload,
  });

  try {
    const response = await fetch(LEAD_API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[LeadCapture] Field update sent successfully:', fieldName);
      return true;
    } else {
      console.error('[LeadCapture] API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[LeadCapture] Failed to send field update:', error);
    return false;
  }
};

/**
 * Build the full payload for page exit or checkout
 */
export const buildLeadPayload = (
  data: FunnelData,
  marketingParams: MarketingParams,
  maxStep: number,
  udi: string
): LeadPayloadData => {
  const payload: LeadPayloadData = {
    udi,
    maxStep,
  };

  // Basic info
  if (data.firstName) payload.firstName = data.firstName;
  if (data.lastName) payload.lastName = data.lastName;
  if (data.email) payload.email = data.email;
  if (data.state) payload.state = data.state;
  
  // Phone
  const formattedPhone = formatPhoneForApi(data.phone);
  if (formattedPhone) payload.phone = formattedPhone;
  
  // Consents
  payload.emailConsent = data.termsConsent;
  payload.smsConsent = data.smsConsent;
  
  // Birthday (combined as MM/DD/YYYY)
  if (data.birthMonth && data.birthDay && data.birthYear) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(data.birthMonth);
    if (monthIndex !== -1) {
      const month = String(monthIndex + 1).padStart(2, '0');
      const day = data.birthDay.padStart(2, '0');
      payload.birthday = `${month}/${day}/${data.birthYear}`;
    }
  }
  
  // Health data
  if (data.heightFeet) payload.heightFeet = data.heightFeet;
  if (data.heightInches) payload.heightInches = data.heightInches;
  if (data.weight) payload.weight = data.weight;
  
  // BMI
  const bmi = calculateBmi(data.heightFeet, data.heightInches, data.weight);
  if (bmi) payload.bmi = bmi;
  
  // Medications
  if (data.takingWeightLossMeds !== null) {
    payload.takingWeightLossMeds = data.takingWeightLossMeds;
  }
  
  if (data.currentMedications.length > 0) {
    payload.currentMedications = data.currentMedications;
  }
  
  // Safety screening
  if (data.safetyConditions.length > 0) {
    payload.safetyConditions = data.safetyConditions;
  }
  
  // Treatment selection
  if (data.selectedTreatment) {
    payload.selectedTreatment = data.selectedTreatment;
  }

  return payload;
};

/**
 * Build basic info payload (Step 1 fields only)
 */
export const buildBasicInfoPayload = (
  data: FunnelData,
  maxStep: number,
  udi: string
): LeadPayloadData => {
  const payload: LeadPayloadData = {
    udi,
    maxStep,
  };

  // Basic info fields only
  if (data.firstName) payload.firstName = data.firstName;
  if (data.lastName) payload.lastName = data.lastName;
  if (data.email) payload.email = data.email;
  if (data.state) payload.state = data.state;
  
  // Phone
  const formattedPhone = formatPhoneForApi(data.phone);
  if (formattedPhone) payload.phone = formattedPhone;
  
  // Consents
  payload.emailConsent = data.termsConsent;
  payload.smsConsent = data.smsConsent;

  return payload;
};

/**
 * Send combined basic info to the API (when completing step 1)
 */
export const sendBasicInfoLead = async (
  data: FunnelData,
  maxStep: number,
  udi: string
): Promise<boolean> => {
  const payload = buildBasicInfoPayload(data, maxStep, udi);
  
  console.log('[LeadCapture] Sending combined basic info to API:', {
    endpoint: LEAD_API_CONFIG.endpoint,
    udi,
    maxStep,
    payload,
  });

  try {
    const response = await fetch(LEAD_API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[LeadCapture] Basic info sent successfully');
      return true;
    } else {
      console.error('[LeadCapture] API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[LeadCapture] Failed to send basic info:', error);
    return false;
  }
};

/**
 * Send full lead data to the API (for page exit)
 */
export const sendLeadData = async (
  data: FunnelData,
  marketingParams: MarketingParams,
  maxStep: number,
  udi: string
): Promise<boolean> => {
  const payload = buildLeadPayload(data, marketingParams, maxStep, udi);
  
  console.log('[LeadCapture] Sending full data to API:', {
    endpoint: LEAD_API_CONFIG.endpoint,
    udi,
    maxStep,
    payload,
  });

  try {
    // Prefer sendBeacon for reliability on page exit
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon(LEAD_API_CONFIG.endpoint, blob);
      if (ok) {
        console.log('[LeadCapture] Successfully queued lead data (beacon)');
        return true;
      }
    }

    // Fallback: POST request
    const response = await fetch(LEAD_API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[LeadCapture] Lead data sent (fetch)');
    return response.ok;
  } catch (error) {
    console.error('[LeadCapture] Failed to send data:', error);
    return false;
  }
};
