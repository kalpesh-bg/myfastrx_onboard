// Google gtag global
type GtagCommand = 'config' | 'event' | 'js' | 'set';

interface GtagEventParams {
  send_to?: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  [key: string]: unknown;
}

declare function gtag(
  command: 'event',
  eventName: string,
  params?: GtagEventParams
): void;
declare function gtag(
  command: 'config',
  targetId: string,
  params?: Record<string, unknown>
): void;
declare function gtag(command: 'js', date: Date): void;
declare function gtag(
  command: 'set',
  params: Record<string, unknown>
): void;

// Meta (Facebook) Pixel
type FbqCommand = 'init' | 'track' | 'trackCustom';

interface FbqEventParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  [key: string]: unknown;
}

interface Fbq {
  (command: 'init', pixelId: string, advancedMatching?: Record<string, string>): void;
  (command: 'track', eventName: string, params?: FbqEventParams): void;
  (command: 'trackCustom', eventName: string, params?: FbqEventParams): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: (...args: unknown[]) => void;
  loaded: boolean;
  version: string;
}

// Microsoft UET
interface UetqEvent {
  ec?: string;
  ea?: string;
  el?: string;
  ev?: number;
  gv?: number;
  gc?: string;
  [key: string]: unknown;
}

interface Uetq {
  push(event: string | UetqEvent): void;
}

declare global {
  interface Window {
    gtag: typeof gtag;
    fbq: Fbq;
    uetq: Uetq;
    dataLayer: unknown[];
  }
}

export {};
