export interface FunnelData {
  marketingConsent: boolean;
  transactionalConsent: boolean;
  // Step 1: Basic Info
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  termsConsent: boolean;

  // Step 2: Health Basics
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  takingWeightLossMeds: boolean | null;
  currentMedications: string[];
  heightFeet: string;
  heightInches: string;
  weight: string;

  // Step 3: Safety Screening
  safetyConditions: string[];

  // Step 4: Treatment Selection
  selectedTreatment: 'semaglutide' | 'tirzepatide' | null;
}

export const initialFunnelData: FunnelData = {
  state: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  smsConsent: true,
  termsConsent: true,
  birthMonth: '',
  birthDay: '',
  birthYear: '',
  takingWeightLossMeds: null,
  currentMedications: [],
  heightFeet: '',
  heightInches: '',
  weight: '',
  safetyConditions: [],
  selectedTreatment: null,
};

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SAFETY_CONDITIONS = [
  { id: 'none', label: 'NONE OF THE BELOW APPLY TO ME', bold: true },
  { id: 'pregnant', label: 'Currently or possibly pregnant, or trying to become pregnant' },
  { id: 'breastfeeding', label: 'Breastfeeding or bottle-feeding with breast milk' },
  { id: 'kidney', label: 'End-stage kidney disease (on or about to be on dialysis)' },
  { id: 'type1', label: 'Type 1 diabetes' },
  { id: 'type2-insulin', label: 'Type 2 diabetes on insulin' },
  { id: 'eating-disorder', label: 'Current or prior eating disorder (anorexia / bulimia)' },
  { id: 'suicidal', label: 'Current suicidal thoughts and/or prior suicide attempt' },
  { id: 'cancer', label: 'Active cancer, cancer under treatment, or remission <5 years' },
  { id: 'transplant', label: 'History of organ transplant on anti-rejection medication' },
  { id: 'gi-condition', label: 'Severe gastrointestinal condition (gastroparesis, blockage, inflammatory bowel disease)' },
  { id: 'heart-stroke', label: 'Heart attack or stroke in the past 12 months' },
  { id: 'thyroid', label: 'Personal or family history of thyroid cancer (MTC), thyroid cyst/nodule, or MEN2' },
  { id: 'pancreatitis', label: 'History of or current pancreatitis' },
  { id: 'retinopathy', label: 'Diabetic retinopathy (diabetic eye disease)' },
];

export const CURRENT_MEDICATIONS = [
  { id: 'none', label: 'I am not currently taking any weight-loss medications' },
  { id: 'semaglutide', label: 'Semaglutide (Ozempic, Wegovy, Rybelsus)' },
  { id: 'tirzepatide', label: 'Tirzepatide (Mounjaro, Zepbound)' },
  { id: 'liraglutide', label: 'Liraglutide (Saxenda, Victoza)' },
  { id: 'other', label: 'Other weight-loss medication' },
];
