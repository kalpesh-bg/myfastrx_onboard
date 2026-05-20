import { useEffect, useState } from 'react';
import { MarketingParams } from '@/types/leadCapture';

export const useMarketingParams = (): MarketingParams => {
  const [params, setParams] = useState<MarketingParams>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const marketingParams: MarketingParams = {};
    
    // UTM parameters
    const utmMedium = urlParams.get('utm_medium');
    const utmSource = urlParams.get('utm_source');
    const utmTerm = urlParams.get('utm_term');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    
    if (utmMedium) marketingParams.utm_medium = utmMedium;
    if (utmSource) marketingParams.utm_source = utmSource;
    if (utmTerm) marketingParams.utm_term = utmTerm;
    if (utmCampaign) marketingParams.utm_campaign = utmCampaign;
    if (utmContent) marketingParams.utm_content = utmContent;
    
    // Click IDs
    const fbclid = urlParams.get('fbclid');
    const gclid = urlParams.get('gclid') || urlParams.get('google_click_id');
    const msclkid = urlParams.get('msclkid');
    
    if (fbclid) marketingParams.fbclid = fbclid;
    if (gclid) marketingParams.google_click_id = gclid;
    if (msclkid) marketingParams.msclkid = msclkid;
    
    setParams(marketingParams);
    
    if (Object.keys(marketingParams).length > 0) {
      console.log('[Marketing] Captured URL parameters:', marketingParams);
    }
  }, []);

  return params;
};
