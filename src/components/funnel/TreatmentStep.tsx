import { useState } from 'react';
import { FunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Lock,
  Info,
  Check,
} from 'lucide-react';
import semaglutideBottle from '@/assets/bottle-semaglutide.jpeg';
import tirzepatideBottle from '@/assets/bottle-tirzepatide.jpeg';

type Treatment = 'semaglutide' | 'tirzepatide';
type PlanId = '1mo' | '3mo' | '6mo' | '12mo';

interface PlanDef {
  id: PlanId;
  label: string;
  months: number;
  monthly: number;
  total: number;
  originalMonthly?: number;
  savings: number;
  firstMonthOff?: number;
  ongoingMonthly?: number;
  badge?: 'popular' | 'best';
  delivered3mo?: boolean;
}

const AUTO_COUPON_CODE = 'MY50';

const PLANS: Record<Treatment, PlanDef[]> = {
  semaglutide: [
    { id: '1mo', label: 'Monthly Plan', months: 1, monthly: 89, total: 89, savings: 50, firstMonthOff: 50, ongoingMonthly: 139 },
    { id: '3mo', label: '3 Month Plan', months: 3, monthly: 99, total: 297, savings: 120, badge: 'popular' },
    { id: '6mo', label: '6 Month Plan', months: 6, monthly: 89, total: 534, savings: 300, delivered3mo: true },
    { id: '12mo', label: '12 Month Plan', months: 12, monthly: 79, total: 948, savings: 720, badge: 'best', delivered3mo: true },
  ],
  tirzepatide: [
    { id: '1mo', label: 'Monthly Plan', months: 1, monthly: 149, total: 149, savings: 50, firstMonthOff: 50, ongoingMonthly: 199 },
    { id: '3mo', label: '3 Month Plan', months: 3, monthly: 166, total: 498, savings: 99, badge: 'popular' },
    { id: '6mo', label: '6 Month Plan', months: 6, monthly: 149, total: 894, savings: 300, delivered3mo: true },
    { id: '12mo', label: '12 Month Plan', months: 12, monthly: 124, total: 1488, savings: 900, badge: 'best', delivered3mo: true },
  ],
};

const US_STATE_ABBREV: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI',
  Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
};

const formatShippingState = (stateName: string) => {
  const abbr = US_STATE_ABBREV[stateName];
  return abbr ? `${stateName} (${abbr})` : stateName;
};

const base64EncodeUtf8 = (input: string) => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

interface TreatmentStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onComplete: () => void;
  onBack: () => void;
  onBeforeCheckout: (updates: Partial<FunnelData>) => void;
  uniqueId: string;
  onFieldBlur?: (fieldName: string, fieldValue: string | boolean | number | string[] | null) => void;
}

const TreatmentStep = ({
  data,
  onUpdate,
  onComplete,
  onBack,
  onBeforeCheckout,
  uniqueId,
  onFieldBlur,
}: TreatmentStepProps) => {
  const { trackInitiateCheckout } = useAnalytics();
  const [treatment, setTreatment] = useState<Treatment>(data.selectedTreatment ?? 'semaglutide');
  const [planId, setPlanId] = useState<PlanId>((data.selectedPlanId as PlanId) ?? '3mo');

  const plans = PLANS[treatment];
  const selectedPlan = plans.find((p) => p.id === planId)!;
  const dueToday = selectedPlan.id === '1mo' ? selectedPlan.monthly : selectedPlan.total;

  const buildCheckoutUrl = () => {
    const productCodes = {
      semaglutide: 'Semaginj-CR1-1M',
      tirzepatide: 'Tirzinj-CR1-1M',
    };
    const enc = (value: string) => encodeURIComponent(value ?? '');
    const shippingState = formatShippingState(data.state);
    const cdataRaw =
      `fname=${enc(data.firstName)}` +
      `&lname=${enc(data.lastName)}` +
      `&email=${enc(data.email)}` +
      `&phone=${enc(data.phone)}` +
      `&shipping_state=${enc(shippingState)}`;
    const cdata = base64EncodeUtf8(cdataRaw);

    const checkoutUrl = new URL('https://checkout.myfastrx.com/wl_checkout/');
    checkoutUrl.searchParams.set('product', treatment);
    checkoutUrl.searchParams.set('uniqueId', uniqueId);
    checkoutUrl.searchParams.set('udi', uniqueId);
    checkoutUrl.searchParams.append('product', productCodes[treatment]);
    checkoutUrl.searchParams.set('cdata', cdata);
    checkoutUrl.searchParams.set('rpage', 'https://www.myfastrx.com/preselection-weightloss/');
    checkoutUrl.searchParams.set('plan', planId);
    checkoutUrl.searchParams.set('planMonths', String(selectedPlan.months));
    checkoutUrl.searchParams.set('planTotal', String(selectedPlan.total));
    checkoutUrl.searchParams.set('planMonthly', String(selectedPlan.monthly));
    checkoutUrl.searchParams.set('coupon_code', AUTO_COUPON_CODE);

    checkoutUrl.searchParams.set('state', enc(data.state));
    checkoutUrl.searchParams.set('firstName', enc(data.firstName));
    checkoutUrl.searchParams.set('lastName', enc(data.lastName));
    checkoutUrl.searchParams.set('email', enc(data.email));
    checkoutUrl.searchParams.set('phone', enc(data.phone));
    checkoutUrl.searchParams.set('smsConsent', data.smsConsent ? 'true' : 'false');
    checkoutUrl.searchParams.set('termsConsent', data.termsConsent ? 'true' : 'false');
    checkoutUrl.searchParams.set('birthMonth', enc(data.birthMonth));
    checkoutUrl.searchParams.set('birthDay', enc(data.birthDay));
    checkoutUrl.searchParams.set('birthYear', enc(data.birthYear));
    checkoutUrl.searchParams.set('takingWeightLossMeds', data.takingWeightLossMeds === null ? '' : (data.takingWeightLossMeds ? 'true' : 'false'));
    checkoutUrl.searchParams.set('currentMedications', enc(data.currentMedications.join(',')));
    checkoutUrl.searchParams.set('heightFeet', enc(data.heightFeet));
    checkoutUrl.searchParams.set('heightInches', enc(data.heightInches));
    checkoutUrl.searchParams.set('weight', enc(data.weight));
    checkoutUrl.searchParams.set('safetyConditions', enc(data.safetyConditions.join(',')));
    checkoutUrl.searchParams.set('selectedTreatment', treatment);
    return checkoutUrl.toString();
  };

  const handleCheckout = () => {
    const updates = { selectedTreatment: treatment, selectedPlanId: planId };
    onBeforeCheckout(updates);
    onFieldBlur?.('selectedTreatment', treatment);
    trackInitiateCheckout(treatment);
    window.location.href = buildCheckoutUrl();
  };

  const handleTreatmentChange = (nextTreatment: Treatment) => {
    setTreatment(nextTreatment);
    setPlanId('3mo');
    onUpdate({ selectedTreatment: nextTreatment, selectedPlanId: '3mo' });
  };

  const handlePlanChange = (nextPlanId: PlanId) => {
    setPlanId(nextPlanId);
    onUpdate({ selectedPlanId: nextPlanId });
  };

  return (
    <div className="w-full pb-44 md:pb-28">
      {/* Eligibility banner */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
          <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
            <Check className="w-3 h-3 text-primary" strokeWidth={3} />
          </span>
          You&apos;re eligible to continue
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-center text-3xl md:text-5xl font-bold mb-2 leading-tight">
        Choose Your<br className="md:hidden" /> <span className="text-primary">Weight Loss</span> Plan
      </h1>
      <p className="text-center  mb-1 font-medium md:text-[16px] text-[13px] max-w-xl mx-auto px-2">
        Choose the plan that fits your goals.
      </p>
      <p className="text-center text-primary mb-6 font-medium md:text-[15px] text-[13px] max-w-xl mx-auto px-2">
        Provider review, medication and shipping included.
      </p>

      {/* Medication selector */}
      <div className="bg-white rounded-[15px] md:rounded-lg max-w-5xl mx-auto p-4 md:p-6 mb-4 md:mb-6 md:border md:border-border shadow-[0_1px_15px_rgba(0,0,0,0.18)] md:shadow-sm">
        <div className="flex items-center gap-3 mb-3 gap-2 md:mb-4">
          <div className="w-1.5 h-6 md:w-1.5 md:h-7 bg-primary rounded-full flex-shrink-0"></div>
          <h3 className="font-medium md:font-bold text-foreground text-base md:text-xl">Choose Your Medication</h3>
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['semaglutide', 'tirzepatide'] as Treatment[]).map((t) => {
            const selected = treatment === t;
            const img = t === 'semaglutide' ? semaglutideBottle : tirzepatideBottle;
            const tag =
              t === 'tirzepatide'
                ? { label: 'Dual-Action', cls: 'bg-[#e1f8e8] text-green-700' }
                : { label: 'GLP-1 Option', cls: 'bg-blue-100 text-primary' };
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTreatmentChange(t)}
                className={`relative bg-white rounded-[10px] md:rounded-md p-4 border-2 text-center transition-all shadow-[0_6px_11px_rgba(0,0,0,0.16)]  ${
                  selected ? 'border-primary ' : 'border-border'
                }`}
              >
                <div
                  className={`absolute top-3 left-3 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                    selected ? 'bg-primary' : 'border-2 border-gray-300'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className='flex justify-center items-center md:flex-row flex-col'>
                  <img src={img} alt={t} className="h-20 md:h-[145px] mx-auto md:m-0 object-contain mb-2" />
                  <div>
                    <div className="font-bold text-base md:text-lg capitalize leading-tight mb-2">{t}</div>
                    <span className={`inline-block text-[11px] md:text-xs px-2.5 py-1 rounded-sm font-medium ${tag.cls}`}>
                      {tag.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] md:text-sm text-primary mt-4 font-semibold ">
          Reviewed and prescribed by U.S.-licensed clinicians.
        </p>
      </div>

      {/* Plan selection */}
      <div className="bg-white rounded-[15px] md:rounded-lg max-w-5xl mx-auto p-4 px-3 md:p-6 mb-4 md:border md:border-border shadow-[0_1px_15px_rgba(0,0,0,0.18)] md:shadow-sm">
        <div className="flex items-center gap-3 mb-3 gap-2 md:mb-4">
          <div className="w-1.5 h-6 md:w-1.5 md:h-7 bg-primary rounded-full flex-shrink-0"></div>
          <h3 className="font-medium md:font-bold text-foreground text-base md:text-xl">Choose Your Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
          {plans.map((plan) => {
            const selected = planId === plan.id;
            const isFirstMonthDeal = !!plan.firstMonthOff;
            const planBadge =
              plan.badge === 'popular'
                ? { text: 'Most Popular', cls: 'bg-primary text-white' }
                : plan.badge === 'best'
                  ? { text: 'Best Value', cls: 'bg-green-600 text-white' }
                  : isFirstMonthDeal
                    ? { text: 'MY50 FIRST-MONTH OFFER', cls: 'bg-amber-100 text-foreground border border-amber-600' }
                    : null;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => handlePlanChange(plan.id)}
                className={`relative text-left rounded-[10px] md:rounded-md border-2 p-3 md:p-4 transition-all shadow-[0_6px_11px_rgba(0,0,0,0.16)] md:shadow-sm  ${
                  selected
                    ? 'border-primary bg-blue-50/50'
                    : 'border-border hover:border-gray-300 bg-white'
                }`}
              >
                {/* Header row — always same height across all cards */}
                <div className='flex items-center md:items-start justify-between flex-row md:flex-col md:gap-2 '>
                  <div>
                    <div className="flex items-center justify-between gap-3 md:mb-3 min-h-7 flex-row md:flex-col md:items-start">
                      <div className="flex items-center  gap-2.5 min-w-0">
                        <span
                          className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0 ${
                            selected ? 'bg-primary' : 'border-2 border-gray-300'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3  text-white" strokeWidth={3} />}
                        </span>
                        <span className="font-medium text-sm">{plan.label}</span>
                      </div>
                      {/* Badge slot — always rendered so header row height is identical */}
                      <span
                        className={`shrink-0 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-sm md:rounded-md whitespace-nowrap absolute left-[133px] md:static md:left-auto md:ml-7 ${
                          planBadge ? planBadge.cls : 'invisible'
                        }`}
                      >
                        {planBadge?.text ?? 'placeholder'}
                      </span>
                    </div>
                    {/* Pricing row — identical structure and font size on every card */}
                    <div className="flex items-end justify-between gap-3 pl-7">
                      <div className="min-h-11 flex flex-col justify-end">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[26px] md:text-2xl font-bold text-foreground">{fmt(plan.monthly)}</span>
                          <span className="text-xs md:text-sm text-foreground md:text-muted-foreground">
                            {isFirstMonthDeal ? 'first month' : '/mo'}
                          </span>
                        </div>
                        <p className="text-[11px] md:text-xs text-foreground md:text-muted-foreground mt-1">
                          {isFirstMonthDeal
                            ? `Then $${plan.ongoingMonthly}/mo`
                            : `${fmt(plan.total)} due today`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='md:pl-7'>
                    <div className="bg-[#e1f8e8] text-green-700 border border-green-700 text-xs font-medium px-2.5 py-1.5 rounded-md shrink-0">
                        Save {fmt(plan.savings)}
                      </div>
                  </div>
                </div>

                
              </button>
            );
          })}
        </div>
        <div className="max-w-5xl mx-auto  flex md:hidden  items-center justify-center gap-2 text-[11px] font-semibold  md:text-sm text-primary mt-3 px-1">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            <span className="">Important dosage note:</span>{' '}
            Higher doses may require documentation.
          </p>
        </div>
      </div>

      {/* Dosage note */}
      <div className="max-w-5xl mx-auto hidden md:flex items-start gap-2 text-xs md:text-sm text-muted-foreground mb-6 px-1">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-foreground">Important dosage note:</span>{' '}
          Higher doses may require documentation.
        </p>
      </div>

      <div className="flex justify-center mb-28 md:mb-6">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 bg-white border border-border rounded-lg shadow-[0_-8px_24px_rgba(0,0,0,0.12),0_-20px_56px_rgba(0,0,0,0.20)] z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-center gap-0 mb-3">
            <div className="flex-1 text-center pr-4">
              <div className="text-[11px] md:text-muted-foreground md:uppercase tracking-wide mb-0.5">Selected Plan</div>
              <div className="font-bold text-sm md:text-base">{selectedPlan.label}</div>
            </div>
            <div className="w-px h-10 bg-primary" />
            <div className="flex-1 text-center pl-4">
              <div className="text-[11px] md:text-muted-foreground md:uppercase tracking-wide mb-0.5">Due Today</div>
              <div className="font-bold md:text-primary text-lg md:text-xl">{fmt(dueToday)}</div>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Lock className="w-4 h-4" />
            Continue Secure Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreatmentStep;
