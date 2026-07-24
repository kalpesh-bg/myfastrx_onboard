import { useState } from 'react';
import { FunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Lock,
  Info,
  Check,
  Circle,
  LockKeyhole,
} from 'lucide-react';
import semaglutideBottle from '@/assets/bottle-semaglutide.png';
import tirzepatideBottle from '@/assets/bottle-tirzepatide.png';

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
      <div className="flex justify-center mb-4 md:mb-2">
        <div className="inline-flex items-center gap-2 bg-blue-600 md:bg-[#e1f8e8] text-white md:text-[#2b6f29] px-2 py-1 md:px-4 md:py-1.5 rounded-full md:rounded-[8px] md:font-bold text-[13px] md:text-[16px] md:text-sm font-medium shadow-sm md:border md:border-border md:border-green">
          <span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white md:bg-transparent flex items-center justify-center">
            <Check className="w-3 h-3 md:w-5 md:h-5 text-primary md:text-[#2b6f29]" strokeWidth={3} />
          </span>
          You&apos;re eligible to continue
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-center text-3xl md:text-5xl font-bold mb-2 md:mb-0 leading-[30px] md:leading-tight">
        Choose Your<br className="md:hidden" /> <span className="text-blue-600">Medication</span> & Plan
      </h1>
      <p className="text-center  mb-1 font-medium md:text-[23px] text-[13px] max-w-xl mx-auto px-2">
        Choose the plan that fits your goals.
      </p>
      <p className="text-center text-primary mb-6 font-medium md:text-[18px] text-[13px] max-w-xl mx-auto px-2">
        Provider review, medication and shipping included.
      </p>

      {/* Medication selector */}
      <div className="bg-white md:bg-[#f5f8fd] rounded-[15px]  max-w-[75rem] mx-auto p-4 md:p-6 md:py-3 mb-4 md:mb-6 md:border md:border-border shadow-[0_1px_15px_rgba(0,0,0,0.18)] md:shadow-none">
        <div className="flex items-center gap-3 mb-3 gap-2 md:mb-4">
          <div className="w-1.5 h-6 md:w-1.5 md:h-7 bg-primary md:hidden rounded-full flex-shrink-0"></div>
          <h3 className="font-bold text-foreground text-lg md:text-xl">Choose Your Medication</h3>
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['semaglutide', 'tirzepatide'] as Treatment[]).map((t) => {
            const selected = treatment === t;
            const img = t === 'semaglutide' ? semaglutideBottle : tirzepatideBottle;
            const tag =
              t === 'tirzepatide'
                ? { label: 'Dual-Action', cls: 'bg-blue-200' }
                : { label: 'GLP-1 Option', cls: 'bg-blue-200 ' };
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTreatmentChange(t)}
                className={`relative rounded-[10px] md:rounded-[13px]  p-4 md:py-3 border-2 text-center transition-all shadow-[0_6px_11px_rgba(0,0,0,0.16)] md:shadow-none ${
                  selected ? 'border-primary md:bg-[#e6effe] ' : 'border-border bg-white'
                }`}
              >
                <div
                  className={`absolute top-3 md:top-[41%] left-3 md:left-7 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                    selected ? 'bg-primary' : 'border-2 border-gray-300 md:border-gray-800'
                  }`}
                >
                  {selected && 
                  <>
                  <Circle className="w-2 h-2 text-white bg-white rounded-full md:block hidden" strokeWidth={3} />
                  <Check className="w-3 h-3 text-white md:hidden" strokeWidth={3} />
                  </>
                  }
                </div>
                <div className='flex justify-center items-center md:flex-row flex-col md:gap-[1.5rem]'>
                  <img src={img} alt={t} className="h-20 md:h-[160px] mx-auto md:m-0 object-contain mb-2 " />
                  <div>
                    <div className="font-black md:font-bold text-[17px] md:text-lg capitalize leading-tight mb-2">{t}</div>
                    <span className={`inline-block text-[11px] md:text-xs px-2.5 md:px-3 md:py-1.5 py-1 rounded-sm font-medium ${tag.cls}`}>
                      {tag.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] md:text-[15px] text-primary mt-4 font-semibold ">
          Reviewed and prescribed by U.S.-licensed clinicians.
        </p>
      </div>

      {/* Plan selection */}
      <div className="bg-white md:bg-[#f5f8fd] rounded-[15px]  max-w-[75rem] mx-auto p-4 px-3 md:p-6 md:py-4 mb-4 md:border md:border-border shadow-[0_1px_15px_rgba(0,0,0,0.18)] md:shadow-none">
        <div className="flex items-center gap-3 mb-3 gap-2 md:mb-4">
          <div className="w-1.5 h-6 md:w-1.5 md:h-7 md:hidden bg-primary rounded-full flex-shrink-0"></div>
          <h3 className="font-bold text-foreground text-lg md:text-xl">Choose Your Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
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
                className={`relative text-left transition-all ${
                  selected
                    ? "border-primary"
                    : "border-border hover:border-gray-300"
                }`}
              >
                {/* ================= MOBILE (UNCHANGED) ================= */}
                <div
                  className={`md:hidden relative rounded-[10px] border-2 p-3 shadow-[0_6px_11px_rgba(0,0,0,0.16)] ${
                    selected
                      ? "border-primary bg-blue-50/50"
                      : "border-border bg-white "
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center md:items-start justify-between flex-row md:flex-col md:gap-2">
                    <div>
                      {/* Plan Name + Badge */}
                      <div className="flex items-center justify-between gap-3 md:mb-3 min-h-7 flex-row md:flex-col md:items-start">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0 ${
                              selected
                                ? "bg-primary"
                                : "border-2 border-gray-300 md:border-gray-800"
                            }`}
                          >
                            {selected && (
                              
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                              
                              
                            )}
                          </span>

                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{plan.label}</span>

                            {/* Monthly Offer */}
                            {isFirstMonthDeal && (
                              <span className="hidden md:inline-flex mt-1 bg-amber-100 text-amber-800 border border-amber-500 text-[10px] font-bold px-2 py-1 rounded-md w-fit">
                                MY50 FIRST-MONTH OFFER
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Popular / Best Badge */}
                        {(plan.badge === "popular" || plan.badge === "best") && (
                          <span
                            className={`hidden md:inline-flex absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-md whitespace-nowrap ${
                              plan.badge === "popular"
                                ? "bg-primary text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {plan.badge === "popular"
                              ? "Most Popular"
                              : "Best Value"}
                          </span>
                        )}

                        {/* Mobile Badge (existing position) */}
                        <span
                          className={`md:hidden shrink-0 text-[9px] font-bold px-2 py-1 rounded-sm whitespace-nowrap absolute left-[133px] ${
                            planBadge ? planBadge.cls : "invisible"
                          }`}
                        >
                          {planBadge?.text ?? "placeholder"}
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-end justify-between gap-3 pl-7">
                        <div className="min-h-11 flex flex-col justify-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[30px] md:text-2xl font-black md:font-bold text-foreground">
                              {fmt(plan.monthly)}
                            </span>

                            <span className="text-xs md:text-sm text-foreground md:text-muted-foreground">
                              {isFirstMonthDeal ? "first month" : "/mo"}
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

                    {/* Save Badge */}
                    <div className="md:pl-7">
                      <div className="bg-[#e1f8e8] text-green-700 border border-green-700 text-xs font-medium px-2.5 py-1.5 rounded-md shrink-0">
                        Save {fmt(plan.savings)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= DESKTOP (NEW DESIGN) ================= */}
                <div
                  className={`hidden md:flex relative rounded-2xl border-2 bg-white p-5 pt-7 h-[210px]  flex-col justify-between ${
                    selected
                      ? "border-blue-600 shadow-md md:bg-[#e6effe]"
                      : "border-border "
                  }`}
                >
                  {/* Floating badge */}
                  {(plan.badge === "popular" || plan.badge === "best") && (
                    <div
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 px-5 py-2 rounded-md text-xs font-bold shadow-md ${
                        plan.badge === "popular"
                          ? "bg-blue-600 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {plan.badge === "popular"
                        ? "Most Popular"
                        : "Best Value"}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            selected
                              ? "bg-primary"
                              : "border-2 border-gray-400"
                          }`}
                        >
                          {selected && (
                            <circle
                              className="w-2 h-2 text-white bg-white rounded-full"
                              strokeWidth={3}
                            />
                          )}
                        </span>

                        <span className="font-bold text-lg">
                          {plan.label}
                        </span>
                      </div>

                      {/* Monthly Offer ONLY */}
                      {isFirstMonthDeal && (
                        <div className="mt-3">
                          <span className="inline-flex rounded bg-green-100 border border-green-300 text-green-700 font-bold text-[11px] px-2 py-1">
                            MY50 FIRST-MONTH OFFER
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Save badge */}
                    <div className="bg-green-100 text-green-700 border border-green-300 rounded-md px-2 py-1 text-xs font-semibold absolute right-[1rem] top-[38px]">
                      Save {fmt(plan.savings)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[47px] font-black leading-[60px]">
                        {fmt(plan.monthly)}
                      </span>

                      <span className=" text-lg text-gray-600">
                        {isFirstMonthDeal
                          ? "first month"
                          : "/mo"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {isFirstMonthDeal
                        ? `Then $${plan.ongoingMonthly}/mo`
                        : `${fmt(plan.total)} due today`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="max-w-[75rem] md:bg-white md:p-3 md:rounded-[11px] md:border md:border-border mx-auto  flex  items-center justify-center md:justify-start gap-2 text-[11px] font-semibold  md:text-[15px] text-primary mt-3 px-1">
          <Info className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0 mt-0.5" />
          <p>
            <span className="md:font-black text-blue-600">Important dosage note:</span>{' '}
            Higher doses may require documentation.
          </p>
        </div>
      </div>

      {/* Dosage note */}
      {/* <div className="max-w-5xl mx-auto hidden md:flex items-start gap-2 text-xs md:text-sm text-muted-foreground mb-6 px-1">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-foreground">Important dosage note:</span>{' '}
          Higher doses may require documentation.
        </p>
      </div> */}

      <div className="flex justify-center mb-28 md:mb-6">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-2 left-3 right-3 md:bottom-4 md:left-4 md:right-4 bg-white border border-border rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.30)] md:shadow-[0_10px_14px_rgba(0,0,0,0.30)] z-50 max-w-[81rem] mx-auto">
        <div className="w-full md:w-[90%] mx-auto px-4 py-1 pb-0 md:py-3  md:py-4 md:flex justify-between">
          <div className="flex items-center justify-center gap-0  md:w-[65%] mb-[4px] md:mb-0">
            <div className="flex-1 text-start pr-4 pl-5 md:pl-0">
              <div className="text-[11px] font-semibold  md:text-sm tracking-wide md:mb-0.5">Selected Plan</div>
              <div className="font-bold text-sm md:text-xl">{selectedPlan.label}</div>
            </div>
            <div className="w-[1px] h-6 md:h-12 md:w-[2px]  bg-primary md:bg-gray-300" />
            <div className="flex-1 text-start pl-6 md:pl-[16%]">
              <div className="text-[11px] font-semibold  md:text-sm tracking-wide md:mb-0.5">Due Today</div>
              <div className="font-bold  text-sm md:text-xl">{fmt(dueToday)}</div>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full md:w-[35%] bg-primary hover:bg-primary/90 text-white font-bold md:font-semibold py-2 md:py-0 px-4 rounded-[4px] md:rounded-md flex items-center justify-center gap-2 text-sm md:text-xl"
          >
            <LockKeyhole className="w-4 h-4 md:w-6 md:h-6" />
            Continue Secure Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreatmentStep;
