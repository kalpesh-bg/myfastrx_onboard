/**
 * Form-fill webhook: sends each input/checkbox/continue action to whitelabel API.
 * Payload matches working format: unid, name, q_name, value, max_step, url
 * - max_step: total number of steps in the funnel (all fields count)
 */

const FORM_FILL_WEBHOOK_URL = 'https://api.whitelabelmd.com/webhook/form-fill/247/253006256181955/';

/** Total steps in the funnel flow (used as max_step in payload) */
export const MAX_FUNNEL_STEPS = 20;
// export const MAX_FUNNEL_STEPS = 4;

/** Alphanumeric set for unid (uppercase, lowercase, digits) - format like DSzPH7Q0Yp */
const UNID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

let formFillUnid: string | null = null;

/**
 * Generate a new form-fill unid (10 chars, mixed case + digits).
 * New on each page load/refresh; same for entire session.
 */
export function generateFormFillUnid(): string {
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += UNID_CHARS.charAt(Math.floor(Math.random() * UNID_CHARS.length));
  }
  return id;
}

/**
 * Get the session form-fill unid. Creates one on first use (new on page refresh).
 */
export function getFormFillUnid(): string {
  if (!formFillUnid) {
    formFillUnid = generateFormFillUnid();
  }
  return formFillUnid;
}

/** Restore a persisted form-fill unid (same session after refresh / checkout return). */
export function restoreFormFillUnid(unid: string): void {
  if (unid) {
    formFillUnid = unid;
  }
}

export type FormFillValue = string | boolean | number | string[] | null;

function formatFormFillValue(value: FormFillValue): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export interface FormFillPayloadItem {
  unid: string;
  name: string;
  q_name: string;
  value: string;
  max_step: number;
  url: string;
}

export interface SendFormFillOptions {
  /** Current step number (1-based) for building q_name */
  currentStep: number;
  /** Optional field index within the step (default 0) */
  fieldIndex?: number;
  /** Override q_name (e.g. q201___email_opt_in[]^input_201_0); when set, currentStep/fieldIndex are not used for q_name */
  q_name?: string;
}

/**
 * Build q_name in format: q{step}_{name}^input_{step}_{index}
 * e.g. q2___haveConditionsListed[]^input_2_0
 */
function buildQName(name: string, currentStep: number, fieldIndex: number): string {
  return `q${currentStep}_${name}^input_${currentStep}_${fieldIndex}`;
}

/**
 * Send a single form-fill event to the webhook (input, checkbox, or continue button).
 * Payload: unid, name, q_name, value, max_step, url.
 */
export async function sendFormFill(
  unid: string,
  name: string,
  value: FormFillValue,
  options: SendFormFillOptions
): Promise<void> {
  const valueStr = typeof value === 'string' ? value : formatFormFillValue(value);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const { currentStep, fieldIndex = 0, q_name: qNameOverride } = options;
  const q_name = qNameOverride ?? buildQName(name, currentStep, fieldIndex);

  const payload: FormFillPayloadItem[] = [
    {
      unid,
      name,
      q_name,
      value: valueStr,
      max_step: MAX_FUNNEL_STEPS,
      url,
    },
  ];

  try {
    const response = await fetch(FORM_FILL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn('[FormFill] Webhook returned', response.status, name);
    }
  } catch (err) {
    console.warn('[FormFill] Failed to send', name, err);
  }
}
