import { useEffect } from 'react';
import { FunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import semaglutideBottle from '@/assets/bottle-semaglutide.png';
import tirzepatideBottle from '@/assets/bottle-tirzepatide.png';

const US_STATE_ABBREV: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

const formatShippingState = (stateName: string) => {
  const abbr = US_STATE_ABBREV[stateName];
  return abbr ? `${stateName} (${abbr})` : stateName;
};

const base64EncodeUtf8 = (input: string) => {
  // btoa only supports Latin1; encode to UTF-8 bytes first for safety.
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

interface TreatmentStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onComplete: () => void;
  onBack: () => void;
  uniqueId: string;
  onFieldBlur?: (fieldName: string, fieldValue: string | boolean | number | string[] | null) => void;
}

const TreatmentStep = ({ data, onUpdate, onComplete, onBack, uniqueId, onFieldBlur }: TreatmentStepProps) => {
  const { trackInitiateCheckout } = useAnalytics();

  // Trigger confetti on mount (when user is pre-approved)
  // useEffect(() => {
  //   const duration = 3000;
  //   const end = Date.now() + duration;

  //   const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#f59e0b'];

  //   const frame = () => {
  //     confetti({
  //       particleCount: 3,
  //       angle: 60,
  //       spread: 55,
  //       origin: { x: 0, y: 0.6 },
  //       colors: colors,
  //     });
  //     confetti({
  //       particleCount: 3,
  //       angle: 120,
  //       spread: 55,
  //       origin: { x: 1, y: 0.6 },
  //       colors: colors,
  //     });

  //     if (Date.now() < end) {
  //       requestAnimationFrame(frame);
  //     }
  //   };

  //   // Initial burst
  //   confetti({
  //     particleCount: 100,
  //     spread: 70,
  //     origin: { y: 0.6 },
  //     colors: colors,
  //   });

  //   frame();
  // }, []);

  const buildCheckoutUrl = (treatment: 'semaglutide' | 'tirzepatide') => {
    // Product codes for each treatment
    const productCodes = {
      semaglutide: 'Semaginj-CR1-1M',
      tirzepatide: 'Tirzinj-CR1-1M',
    };

    // Build the cdata parameter (base64 of a querystring where values are encodeURIComponent-encoded)
    // This matches the required format where spaces become %20 (not '+').
    const enc = (value: string) => encodeURIComponent(value ?? '');
    const shippingState = formatShippingState(data.state);
    const cdataRaw =
      `fname=${enc(data.firstName)}` +
      `&lname=${enc(data.lastName)}` +
      `&email=${enc(data.email)}` +
      `&phone=${enc(data.phone)}` +
      `&shipping_state=${enc(shippingState)}`;

    const cdata = base64EncodeUtf8(cdataRaw);

    // Build the checkout URL
    const checkoutUrl = new URL('https://checkout.myfastrx.com/wl_checkout/');

    // Existing parameters
    checkoutUrl.searchParams.set('product', treatment);
    checkoutUrl.searchParams.set('uniqueId', uniqueId);
    checkoutUrl.searchParams.set('udi', uniqueId); // Pass as udi parameter
    checkoutUrl.searchParams.append('product', productCodes[treatment]);
    checkoutUrl.searchParams.set('cdata', cdata);
    checkoutUrl.searchParams.set('rpage', 'https://www.myfastrx.com/preselection-weightloss/');

    // Step 1: Basic Info - All fields
    checkoutUrl.searchParams.set('state', enc(data.state));
    checkoutUrl.searchParams.set('firstName', enc(data.firstName));
    checkoutUrl.searchParams.set('lastName', enc(data.lastName));
    checkoutUrl.searchParams.set('email', enc(data.email));
    checkoutUrl.searchParams.set('phone', enc(data.phone));
    checkoutUrl.searchParams.set('smsConsent', data.smsConsent ? 'true' : 'false');
    checkoutUrl.searchParams.set('termsConsent', data.termsConsent ? 'true' : 'false');

    // Step 2: Health Basics - All fields
    checkoutUrl.searchParams.set('birthMonth', enc(data.birthMonth));
    checkoutUrl.searchParams.set('birthDay', enc(data.birthDay));
    checkoutUrl.searchParams.set('birthYear', enc(data.birthYear));
    checkoutUrl.searchParams.set('takingWeightLossMeds', data.takingWeightLossMeds === null ? '' : (data.takingWeightLossMeds ? 'true' : 'false'));
    checkoutUrl.searchParams.set('currentMedications', enc(data.currentMedications.join(',')));
    checkoutUrl.searchParams.set('heightFeet', enc(data.heightFeet));
    checkoutUrl.searchParams.set('heightInches', enc(data.heightInches));
    checkoutUrl.searchParams.set('weight', enc(data.weight));

    // Step 3: Safety Screening - All fields
    checkoutUrl.searchParams.set('safetyConditions', enc(data.safetyConditions.join(',')));

    // Step 4: Treatment Selection
    checkoutUrl.searchParams.set('selectedTreatment', treatment);

    return checkoutUrl.toString();
  };

  const handleComplete = (treatment: 'semaglutide' | 'tirzepatide') => {
    onUpdate({ selectedTreatment: treatment });
    onFieldBlur?.('selectedTreatment', treatment);

    // Track checkout initiation before redirect
    trackInitiateCheckout(treatment);

    // Redirect to checkout
    const checkoutUrl = buildCheckoutUrl(treatment);
    window.location.href = checkoutUrl;
  };

  return (
    <div className="form-section max-w-4xl">
      <div className="text-center mb-6 md:mb-10">
        <p className="text-primary text-lg md:text-xl mb-2 md:mb-3">
          {data.firstName}, You're Pre-Approved! 🎉
        </p>
        <h1 className="text-lg md:text-3xl font-bold text-foreground mb-3 md:mb-4 leading-tight">
          Start your personalized GLP-1 weight loss program today – fast approvals & home delivery.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          You're a great candidate for GLP-1 medication proven to help curb appetite and support real weight loss.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Semaglutide Card */}
        <div className="bg-[hsl(210,100%,97%)] border border-[hsl(210,100%,90%)] rounded-xl p-5 md:p-8 flex flex-col">
          <div className="flex justify-center mb-4 md:mb-6">
            <img
              src={semaglutideBottle}
              alt="Semaglutide vial"
              className="h-20 md:h-28 object-contain"
            />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-center text-foreground mb-3 md:mb-4">SEMAGLUTIDE</h3>
          <div className="text-center mb-3 md:mb-4">
            <p className="text-sm text-muted-foreground">Compounded medication</p>
            <p className="font-semibold text-foreground text-sm md:text-base">Lose up to 16% of Body Weight</p>
          </div>
          <p className="text-center text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 flex-grow">
            A weekly GLP-1 injection that curbs hunger, reduces cravings, and supports significant, sustainable weight loss.
          </p>
          <button
            onClick={() => handleComplete('semaglutide')}
            className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base py-3 md:py-4"
          >
            START MY TREATMENT <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Tirzepatide Card */}
        <div className="bg-[hsl(210,100%,97%)] border border-[hsl(210,100%,90%)] rounded-xl p-5 md:p-8 flex flex-col">
          <div className="flex justify-center mb-4 md:mb-6">
            <img
              src={tirzepatideBottle}
              alt="Tirzepatide vial"
              className="h-20 md:h-28 object-contain"
            />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-center text-foreground mb-3 md:mb-4">TIRZEPATIDE</h3>
          <div className="text-center mb-3 md:mb-4">
            <p className="text-sm text-muted-foreground">Compounded medication</p>
            <p className="font-semibold text-foreground text-sm md:text-base">Lose up to 22% of Body Weight</p>
          </div>
          <p className="text-center text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 flex-grow">
            A dual-action GLP-1/GIP medication shown to reduce appetite, improve fullness, and deliver greater weight-loss results – once weekly.
          </p>
          <button
            onClick={() => handleComplete('tirzepatide')}
            className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base py-3 md:py-4"
          >
            START MY TREATMENT <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[hsl(210,100%,97%)] border border-[hsl(210,100%,90%)] rounded-xl p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1 md:mb-2 text-sm md:text-base">Final dosage determined by your provider</h4>
            <p className="text-xs md:text-sm text-muted-foreground">
              During your medical intake, you can request any dosage from your doctor. Final dosage will be determined by your provider for your safety, based on your intake review. If you're not comfortable with the doctor's prescribed dosage, you can cancel.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs md:text-sm text-muted-foreground">
        <strong className="text-foreground">No obligation if it's not a fit.</strong> If your provider determines a treatment or dosage that you're not comfortable with, you may cancel for a <strong className="text-foreground">full refund</strong> before medication ships.
      </p>

      <div className="mt-8 flex justify-center">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
};

export default TreatmentStep;
