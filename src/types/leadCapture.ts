export const LEAD_API_CONFIG = {
  endpoint: 'https://panel.ravinimavat.com/myfastrx/api/send_leads',
  sendLeadsV2: 'https://panel.ravinimavat.com/myfastrx/api/send_leads_v2',
  // endpoint: 'https://lightgoldenrodyellow-okapi-586794.hostingersite.com/vyverx/api/send_leads',
} as const;

/**
 * Lead payload structure - simple object with udi for session tracking
 */
export interface LeadPayloadData {
  udi: string;
  // Basic info
  state?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emailConsent?: boolean;
  smsConsent?: boolean;
  // DOB (combined format MM/DD/YYYY)
  birthday?: string;
  // Health data
  heightFeet?: string;
  heightInches?: string;
  weight?: string;
  bmi?: number;
  // Medications
  takingWeightLossMeds?: boolean;
  currentMedications?: string[];
  // Safety
  safetyConditions?: string[];
  // Treatment
  selectedTreatment?: string;
  // Meta
  maxStep?: number;
}

export interface MarketingParams {
  utm_medium?: string;
  utm_source?: string;
  utm_term?: string;
  utm_campaign?: string;
  utm_content?: string;
  fbclid?: string;
  google_click_id?: string;
  msclkid?: string;
}
