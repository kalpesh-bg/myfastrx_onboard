import { useCallback } from 'react';

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface FunnelStepData {
  step: number;
  stepName: string;
}

export const useAnalytics = () => {
  /**
   * Track funnel step progression
   */
  const trackFunnelStep = useCallback(({ step, stepName }: FunnelStepData) => {
    // Google Analytics / Google Ads
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'funnel_step', {
        event_category: 'Funnel',
        event_label: stepName,
        value: step,
      });
    }

    // Meta (Facebook) Pixel
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'ViewContent', {
        content_name: stepName,
        content_category: 'Funnel Step',
        value: step,
      });
    }

    // Microsoft UET
    if (window.uetq) {
      window.uetq.push({
        ec: 'Funnel',
        ea: 'step_view',
        el: stepName,
        ev: step,
      });
    }
  }, []);

  /**
   * Track lead generation (Step 1 completion)
   */
  const trackLead = useCallback(({ firstName, lastName, email, phone }: LeadData) => {
    // Google Analytics / Google Ads
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        event_category: 'Lead',
        event_label: 'Weight Loss Funnel',
      });
    }

    // Meta (Facebook) Pixel with advanced matching
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'Weight Loss Funnel',
        content_category: 'Lead',
      });
    }

    // Microsoft UET
    if (window.uetq) {
      window.uetq.push({
        ec: 'Lead',
        ea: 'submit',
        el: 'Weight Loss Funnel',
      });
    }

    console.log('[Analytics] Lead tracked:', { firstName, lastName, email: email.substring(0, 3) + '***' });
  }, []);

  /**
   * Track treatment selection / checkout initiation
   */
  const trackInitiateCheckout = useCallback((treatment: 'semaglutide' | 'tirzepatide') => {
    const treatmentValue = treatment === 'semaglutide' ? 399 : 597;

    // Google Analytics / Google Ads
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'begin_checkout', {
        event_category: 'Ecommerce',
        event_label: treatment,
        value: treatmentValue,
        currency: 'USD',
        content_type: 'product',
        content_ids: [treatment],
      });
    }

    // Meta (Facebook) Pixel
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_name: treatment,
        content_category: 'Weight Loss Treatment',
        content_ids: [treatment],
        content_type: 'product',
        value: treatmentValue,
        currency: 'USD',
        num_items: 1,
      });
    }

    // Microsoft UET
    if (window.uetq) {
      window.uetq.push({
        ec: 'Ecommerce',
        ea: 'checkout',
        el: treatment,
        gv: treatmentValue,
        gc: 'USD',
      });
    }

    console.log('[Analytics] Checkout initiated:', treatment);
  }, []);

  return {
    trackFunnelStep,
    trackLead,
    trackInitiateCheckout,
  };
};
