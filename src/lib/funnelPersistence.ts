import { FunnelData, initialFunnelData } from '@/types/funnel';

export const FUNNEL_STORAGE_KEY = 'myfastrx_funnel_progress';

export type PlanId = '1mo' | '3mo' | '6mo' | '12mo';

export interface SavedFunnelProgress {
  data: FunnelData;
  step: number;
  udi: string;
  formFillUnid: string;
  selectedPlanId?: PlanId | null;
}

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
      // Ignore storage errors
    }
  },
};

const parseBoolParam = (value: string | null): boolean | null => {
  if (value === null || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const parseListParam = (value: string | null): string[] => {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const isValidPlanId = (value: string | null): value is PlanId =>
  value === '1mo' || value === '3mo' || value === '6mo' || value === '12mo';

const isValidTreatment = (value: string | null): value is FunnelData['selectedTreatment'] =>
  value === 'semaglutide' || value === 'tirzepatide';

const parseCdata = (cdata: string | null): Partial<FunnelData> => {
  if (!cdata) return {};
  try {
    const decoded = decodeURIComponent(
      atob(cdata)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const params = new URLSearchParams(decoded);
    const shippingState = params.get('shipping_state') ?? '';
    const stateName = shippingState.replace(/\s*\([A-Z]{2}\)$/, '').trim();
    return {
      firstName: params.get('fname') ?? '',
      lastName: params.get('lname') ?? '',
      email: params.get('email') ?? '',
      phone: params.get('phone') ?? '',
      state: stateName || shippingState,
    };
  } catch {
    return {};
  }
};

/** Parse checkout return URL params (change plan redirect). */
export const parseCheckoutReturnParams = (
  searchParams: URLSearchParams
): Partial<SavedFunnelProgress> | null => {
  const hasCheckoutReturn =
    searchParams.has('plan') ||
    searchParams.has('selectedTreatment') ||
    searchParams.has('udi') ||
    searchParams.has('uniqueId') ||
    searchParams.has('cdata') ||
    (searchParams.has('email') && searchParams.has('firstName'));

  if (!hasCheckoutReturn) return null;

  const data: Partial<FunnelData> = {
    ...parseCdata(searchParams.get('cdata')),
  };

  const assign = <K extends keyof FunnelData>(key: K, value: FunnelData[K] | undefined) => {
    if (value !== undefined && value !== null && value !== '') {
      data[key] = value;
    }
  };

  assign('state', searchParams.get('state') ?? undefined);
  assign('firstName', searchParams.get('firstName') ?? undefined);
  assign('lastName', searchParams.get('lastName') ?? undefined);
  assign('email', searchParams.get('email') ?? undefined);
  assign('phone', searchParams.get('phone') ?? undefined);
  assign('birthMonth', searchParams.get('birthMonth') ?? undefined);
  assign('birthDay', searchParams.get('birthDay') ?? undefined);
  assign('birthYear', searchParams.get('birthYear') ?? undefined);
  assign('heightFeet', searchParams.get('heightFeet') ?? undefined);
  assign('heightInches', searchParams.get('heightInches') ?? undefined);
  assign('weight', searchParams.get('weight') ?? undefined);

  const smsConsent = parseBoolParam(searchParams.get('smsConsent'));
  if (smsConsent !== null) data.smsConsent = smsConsent;

  const termsConsent = parseBoolParam(searchParams.get('termsConsent'));
  if (termsConsent !== null) data.termsConsent = termsConsent;

  const takingWeightLossMeds = parseBoolParam(searchParams.get('takingWeightLossMeds'));
  if (takingWeightLossMeds !== null) data.takingWeightLossMeds = takingWeightLossMeds;

  const currentMedications = parseListParam(searchParams.get('currentMedications'));
  if (currentMedications.length > 0) data.currentMedications = currentMedications;

  const safetyConditions = parseListParam(searchParams.get('safetyConditions'));
  if (safetyConditions.length > 0) data.safetyConditions = safetyConditions;

  const selectedTreatment = searchParams.get('selectedTreatment');
  if (isValidTreatment(selectedTreatment)) data.selectedTreatment = selectedTreatment;

  const udi = searchParams.get('udi') || searchParams.get('uniqueId') || undefined;
  const plan = searchParams.get('plan');

  return {
    data,
    step: 4,
    udi,
    selectedPlanId: isValidPlanId(plan) ? plan : undefined,
  };
};

const mergeFunnelData = (base: FunnelData, patch: Partial<FunnelData>): FunnelData => ({
  ...base,
  ...patch,
  currentMedications: patch.currentMedications ?? base.currentMedications,
  safetyConditions: patch.safetyConditions ?? base.safetyConditions,
});

export const loadSavedProgress = (): SavedFunnelProgress | null => {
  let saved: SavedFunnelProgress | null = null;

  try {
    const raw = safeLocalStorage.getItem(FUNNEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedFunnelProgress;
      if (parsed?.data && typeof parsed.step === 'number') {
        saved = {
          data: { ...initialFunnelData, ...parsed.data },
          step: Math.min(Math.max(parsed.step, 1), 4),
          udi: parsed.udi ?? '',
          formFillUnid: parsed.formFillUnid ?? '',
          selectedPlanId: parsed.selectedPlanId ?? parsed.data.selectedPlanId ?? null,
        };
      }
    }
  } catch {
    saved = null;
  }

  if (typeof window === 'undefined') return saved;

  const urlRestore = parseCheckoutReturnParams(new URLSearchParams(window.location.search));
  if (!urlRestore) return saved;

  const mergedData = mergeFunnelData(saved?.data ?? initialFunnelData, urlRestore.data ?? {});
  const selectedPlanId =
    urlRestore.selectedPlanId ?? saved?.selectedPlanId ?? mergedData.selectedPlanId ?? null;

  return {
    data: {
      ...mergedData,
      selectedPlanId,
    },
    step: Math.max(saved?.step ?? 1, urlRestore.step ?? 1, 4),
    udi: urlRestore.udi || saved?.udi || '',
    formFillUnid: saved?.formFillUnid || '',
    selectedPlanId,
  };
};

export const saveFunnelProgress = (progress: SavedFunnelProgress): void => {
  try {
    safeLocalStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not save funnel progress', e);
  }
};

export const clearFunnelProgress = (): void => {
  try {
    safeLocalStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};
