import { useState } from 'react';
import { FunnelData } from '@/types/funnel';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  ShieldCheck,
  Tag,
  DollarSign,
  Truck,
  ChevronDown,
  Lock,
  Info,
  Check,
  CircleDollarSign,
  ChevronRight,
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

const PLANS: Record<Treatment, PlanDef[]> = {
  semaglutide: [
    { id: '1mo', label: 'Monthly Plan', months: 1, monthly: 69, total: 69, originalMonthly: 169, savings: 100, firstMonthOff: 100, ongoingMonthly: 169 },
    { id: '3mo', label: '3 Month Plan', months: 3, monthly: 99, total: 297, savings: 210, badge: 'popular' },
    { id: '6mo', label: '6 Month Plan', months: 6, monthly: 89, total: 534, savings: 480, delivered3mo: true },
    { id: '12mo', label: '12 Month Plan', months: 12, monthly: 79, total: 948, savings: 1080, badge: 'best', delivered3mo: true },
  ],
  tirzepatide: [
    { id: '1mo', label: '1 Month Plan', months: 1, monthly: 149, total: 149, originalMonthly: 249, savings: 100, firstMonthOff: 100, ongoingMonthly: 249 },
    { id: '3mo', label: '3 Month Plan', months: 3, monthly: 166, total: 498, savings: 249, badge: 'popular' },
    { id: '6mo', label: '6 Month Plan', months: 6, monthly: 149, total: 894, savings: 600, delivered3mo: true },
    { id: '12mo', label: '12 Month Plan', months: 12, monthly: 124, total: 1488, savings: 1500, badge: 'best', delivered3mo: true },
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
  const [noteOpen, setNoteOpen] = useState(false);

  const plans = PLANS[treatment];
  const selectedPlan = plans.find((p) => p.id === planId)!;

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

  const trustBadges = [
    { icon: ShieldCheck, l1: 'Licensed', l2: 'U.S. Providers' },
    { icon: Tag, l1: 'Same Price', l2: 'At Any Dose' },
    { icon: CircleDollarSign, l1: 'No Hidden', l2: 'Fees' },
    { icon: Truck, l1: 'Fast 2-Day', l2: 'Shipping' },
  ];

  const bottle = treatment === 'semaglutide' ? semaglutideBottle : tirzepatideBottle;

  return (
    <div className="w-full pb-56 md:pb-28">
      {/* Pre-approved pill */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-2 bg-[#e1f8e8] text-green-700 px-4 py-1.5 rounded-[10px] text-xs md:text-sm font-medium">
          <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
          You're Pre-Approved!
        </div>
      </div>

      {/* Doctor prescribed badge */}
      {/* <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-1.5 rounded-[10px] text-xs md:text-sm font-bold tracking-wide">
          <ShieldCheck className="w-4 h-4" />
          DOCTOR PRESCRIBED WEIGHT LOSS
        </div>
      </div> */}

      {/* Headline */}
      <h1 className="text-center text-3xl md:text-5xl font-bold mb-2 leading-tight">
        Choose Your <span className="text-primary block md:inline">Weight Loss Plan</span>
      </h1>
      <p className="text-center text-muted-foreground mb-6 font-medium md:text-[16px] text-sm">Choose the plan that fits your goals.</p>

      {/* Trust badges row */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-1 md:gap-4 mb-6 max-w-3xl mx-auto">
        {trustBadges.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-[5px] md:gap-3 border border-border rounded-[7px] md:rounded-[10px] px-1 md:px-3 py-2.5 bg-white"
          >
            <b.icon
              className={`w-4 h-4 sm:w-8 sm:h-8 text-primary flex-shrink-0 ${
                b.icon === Tag ? "-scale-x-100" : ""
              }`}
            />

            <div className="text-[9px] md:text-xs leading-tight">
              <div className="font-semibold text-black md:mb-[4px] ">
                {b.l1}
              </div>
              <div className="text-black font-semibold">{b.l2}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Medication selector */}
      
      <div className="bg-blue-50/60 rounded-2xl max-w-5xl mx-auto p-4 md:py-3.5 md:px-7 mb-4 md:mb-6 border-1 border-border">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-foreground text-lg md:text-xl">Choose Your Medication</h3>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">You can compare both options anytime.</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['tirzepatide', 'semaglutide'] as Treatment[]).map((t) => {
            const selected = treatment === t;
            const img = t === 'semaglutide' ? semaglutideBottle : tirzepatideBottle;
            const tag = t === 'tirzepatide'
              ? { label: 'More Effective', cls: 'bg-[#e1f8e8] text-green-700' }
              : { label: 'Lower Cost', cls: 'bg-blue-100 text-primary' };
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTreatmentChange(t)}
                className={`relative bg-white rounded-xl p-3 md:p-2 border-2 text-left transition-all ${
                  selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <div className={`absolute md:top-2 md:left-2 top-[4px] left-[4px] md:w-6 md:h-6 w-4 h-4 rounded-full flex items-center justify-center ${
                  selected ? 'bg-primary' : 'border-2 border-gray-300'
                }`}>
                  {selected && <Check className="md:w-4 md:h-4 w-3 h-3  text-white" strokeWidth={3} />}
                </div>
                <div className="flex items-center gap-2 md:gap-[2rem] md:gap-3 md:pl-6 justify-center">
                  <img
                    src={img}
                    alt={t}
                    className="h-14 md:h-[95px] md:w-[75px] object-cover flex-shrink-0 "
                  />

                  <div className="flex flex-col justify-center h-full md:w-[48%]">
                    <div className="font-bold text-base md:text-lg capitalize leading-tight">
                      {t}
                    </div>

                    <span
                      className={`inline-block w-fit text-[10px] md:text-xs px-2 py-[3px] md:py-1 rounded-full md:rounded-[6px] md:leading-[14px] mt-2 md:mt-2.5 font-medium ${tag.cls}`}
                    >
                      {tag.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center font-semibold text-black gap-1.5 md:leading-[14px]"><span className="w-2 h-2 rounded-full bg-blue-500" />Compounded</span>
          <span className="flex items-center font-semibold text-black gap-1.5 md:leading-[14px]"><span className="w-2 h-2 rounded-full bg-blue-500" />Doctor Prescribed</span>
        </div>
      </div>

      {/* Plan selection */}
      <h3 className="font-bold text-lg md:text-xl mb-1">Choose Your Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-3 gap-y-6 mb-6 md:mt-1.5">
        {plans.map((plan) => {
          const selected = planId === plan.id;
          const isFirstMonthDeal = !!plan.firstMonthOff;
          const badge = plan.badge === 'popular'
            ? { text: '🔥 MOST POPULAR', cls: 'bg-primary text-white' }
            : plan.badge === 'best'
              ? { text: '🏆 BEST VALUE', cls: 'bg-green-600 text-white' }
              : null;

          const billedAmount = isFirstMonthDeal ? plan.monthly : plan.total;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => handlePlanChange(plan.id)}
              className={`relative text-left  rounded-xl border-1 px-2 py-3 md:px-2 transition-all flex flex-col ${
                selected
                  ? 'border-primary bg-blue-50/40'
                  : 'border-border hover:border-gray-300 bg-white'
              }`}
            >
              {badge && (
                <span className={`absolute -top-[13px] md:-top-[20px] left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold pr-3 pl-2 py-1 rounded-md whitespace-nowrap ${badge.cls}`}>
                  {badge.text}
                </span>
              )}

              {/* Row 1: radio + plan name */}
              <div className="flex justify-between  md:mb-3 mb-2">
                <div className="flex items-center gap-2 md:gap-6">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    selected ? (isFirstMonthDeal ? 'bg-primary' : 'bg-primary') : 'border-2 border-gray-300'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  {/* {selected ? (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-primary">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 shrink-0" />
                  )} */}
                  <span className="font-bold text-foreground text-xs md:text-sm leading-tight">{plan.label}</span>
                </div>
                <div>
                  <ChevronRight className='w-5 h-5'/>
                </div>
              </div>

              {/* Row 2: price (left) + savings box (right) */}
              <div className='md:block flex justify-between'>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2 md:mb-3 pl-5">
                    <div className="flex items-baseline justify-between gap-2">
      
                      {/* Left side original price only for 1 month */}
                      {plan.id === '1mo' && plan.originalMonthly ? (
                        <span className="text-muted-foreground/70 line-through text-base md:text-2xl font-bold leading-none block">
                          ${plan.originalMonthly}
                        </span>
                      ) : (
                        <span className="block h-4" />
                      )}

                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-0.5 flex-wrap">
                          <span
                            className={`text-xl md:text-2xl font-bold leading-none ${
                              isFirstMonthDeal ? 'text-green-600' : 'text-primary'
                            }`}
                          >
                            {fmt(plan.monthly)}
                          </span>

                          <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other plans original price below /mo */}
                        {plan.id !== '1mo' && plan.originalMonthly && (
                          <span className="text-xs text-muted-foreground/70 line-through pl-5">
                            ${plan.originalMonthly}/mo
                          </span>
                        )}

                  {/* Row 3: deal info or totals — flex-1 keeps Billed Today anchored below */}
                  <div className='flex items-center md:pr-2'>
                    <div className="flex flex-col flex-1 justify-between  pl-5">
                      <div>
                        {isFirstMonthDeal ? (
                          <>
                            <span className="inline-block bg-[#e1f8e8] text-green-700 text-[10px]  font-bold px-2 py-1 rounded w-fit leading-snug mb-2 md:mb-3">
                              ${plan.firstMonthOff} OFF YOUR FIRST MONTH
                            </span>
                            <div className='flex justify-between md:mb-3 mb-2'>
                              <p className="text-[10px] md:text-xs text-muted-foreground">Then ${plan.ongoingMonthly}/month thereafter</p>
                              
                            </div>
                          </>
                        ) : (
                          <div className='flex justify-between md:mb-3 mb-2'>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              ${plan.total.toLocaleString()} Total {plan.months} Months
                            </p>
                            
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] md:text-xs text-primary font-semibold ">
                          <span className="">Billed Today</span> {fmt(billedAmount)}
                        </p>
                        
                      </div>
                      
                    </div>
                    <div className='hidden md:block'>
                      <div className="bg-[#e1f8e8] border   border-green-100 rounded-[5px] px-2 py-2 text-center shrink-0 min-w-[68px] md:mb-[1rem]">
                        <div className="text-[9px] md:text-[10px] text-black font-medium leading-tight mb-1">Total Savings</div>
                        <div className="font-bold text-green-700 text-xs md:text-sm">{fmt(plan.savings)}</div>
                      </div>
                    </div>

                    
                  </div> 
                </div>
                {/* <div className='md:hidden block pr-[3rem]'>
                    <div className="bg-[#e1f8e8] border   border-green-100 rounded-[5px] px-3 py-2 text-center shrink-0 min-w-[68px] md:mb-[1rem]">
                        <div className="text-[10px] md:text-[10px] text-black font-medium leading-tight mb-1">Total Savings</div>
                        <div className="font-bold text-green-700 text-xs md:text-sm">{fmt(plan.savings)}</div>
                      </div>
                </div>  */}

                <div className="md:hidden block pr-[3rem] md:pr-0">

                  <div className="bg-[#e1f8e8] border border-green-100 rounded-[5px] px-3 py-2 text-center shrink-0 min-w-[68px]">
                    <div className="text-[10px] text-black font-medium leading-tight mb-1">
                      Total Savings
                    </div>

                    <div className="font-bold text-green-700 text-xs md:text-sm">
                      {fmt(plan.savings)}
                    </div>
                    {plan.id === '3mo' && (
                      <p className="text-[10px] text-primary font-semibold text-center mb-2">
                                            
                      {/* <div className="font-bold text-green-700 text-[9px] md:text-sm p-1 rounded-full bg-[#00800047] mt-1.5">
                      Best Value
                      </div> */}
                    </p>
                  )}
                  </div>
                </div>

              </div>
              {/* Mobile-only inline Select button for selected card */}
                {selected && (
                  <div
                    role="button"
                    onClick={(e) => { e.stopPropagation(); handleCheckout(); }}
                    className="md:hidden mt-2 md:mt-3 w-full bg-primary text-white text-center font-bold py-2 rounded-lg text-xs"
                  >
                    Select This Plan
                  </div>
                )}

              {plan.delivered3mo
                ? <p className="text-[10px] md:text-xs text-muted-foreground mt-1 text-center">Delivered in 3 month increments</p>
                : <span className="block h-0 mt-1" />
                }
            </button>
          );
        })}
      </div>

      {/* Dosage note */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mb-28 md:mb-6">
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          className="w-full flex items-start gap-3 text-left"
        >
          <Info className="w-5 h-5 md:w-9 md:h-9 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs md:text-sm">
            <span className="font-bold">Important dosage note:</span>{' '}
            <span className="text-muted-foreground md:leading-[22px]">
              If you request a dose higher than the standard starting dose, your provider may require additional documentation,<br/> such as a prior prescription or medication bottle, before approval.
            </span>
            {noteOpen && (
              <p className="text-muted-foreground mt-2">
                Final dosage will be determined by your provider based on your medical intake. If you're not comfortable with the prescribed dosage, you may cancel for a full refund before medication ships.
              </p>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${noteOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex justify-center mb-28 md:mb-6">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 bg-white border border-border rounded-2xl shadow-[0_-6px_20px_rgba(0,0,0,0.1),0_-16px_48px_rgba(0,0,0,0.18)] z-50">
        <div className="max-w-[81rem] mx-auto px-3 py-5 md:px-0 !md:py-3">
          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="flex gap-2 items-center mb-2">
              <div className="w-[45%] flex items-center gap-2">
                <img src={bottle} alt="" className="h-10 md:h-[95px] object-contain flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground">Selected Plan</div>
                  <div className="font-bold text-sm leading-tight">{selectedPlan.label}</div>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-[5px] font-medium ${
                  treatment === 'tirzepatide' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-primary'
                }`}>
                  {treatment === 'tirzepatide' ? 'More Effective' : 'Lower Cost'}
                </span>
                </div>
              </div>
              <div className="text-center w-[27.5%]">
                <div className="text-[10px] text-muted-foreground">Due Today</div>
                <div className="font-bold text-primary text-base">
                  {fmt(selectedPlan.id === '1mo' ? selectedPlan.monthly : selectedPlan.total)}
                </div>
              </div>
              <div className="text-center w-[27.5%]">
                <div className="text-[10px] text-muted-foreground">Total Savings</div>
                <div className="font-bold text-green-600 text-base">{fmt(selectedPlan.savings)}</div>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <Lock className="w-4 h-4" />
              Continue Secure Checkout
            </button>
            {/* <p className="text-[10px] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure 256-bit encrypted checkout
            </p> */}
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex gap-4 items-center">
            <div className="md:w-[25%] flex items-center gap-5 border-r h-[77px]">
              <img src={bottle} alt="" className="h-14 md:h-[95px] md:w-[75px] object-cover flex-shrink-0 " />
              <div className='space-y-1'>
                <div className="text-[11px] md:text-[13px] text-muted-foreground">Selected Medication</div>
                <div className="font-bold text-base capitalize">{treatment}</div>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-[5px] font-medium ${
                  treatment === 'tirzepatide' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-primary'
                }`}>
                  {treatment === 'tirzepatide' ? 'More Effective' : 'Lower Cost'}
                </span>
              </div>
            </div>
            <div className="md:w-[18%] border-r text-center space-y-1 md:h-[79.7px] pr-[16px]">
              <div className="text-[13px] text-muted-foreground">Selected Plan</div>
              <div className="font-bold text-base">{selectedPlan.label}</div>
            </div>
            <div className="md:w-[18%] border-r text-center space-y-1.5 md:h-[79.7px] pr-[16px]">
              <div className="text-[13px] text-muted-foreground">Due Today</div>
              <div className="font-bold text-primary text-xl">
                {fmt(selectedPlan.id === '1mo' ? selectedPlan.monthly : selectedPlan.total)}
              </div>
              {selectedPlan.firstMonthOff && (
                <div className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded mt-0.5">
                  You Save ${selectedPlan.firstMonthOff} Today
                </div>
              )}
            </div>
            <div className="md:w-[13%] border-r text-center space-y-1.5 md:h-[79.7px] pr-[16px]">
              <div className="text-[13px] text-muted-foreground">Total Savings</div>
              <div className="font-bold text-green-600 text-xl">{fmt(selectedPlan.savings)}</div>
            </div>
            <div className="md:w-[32%] pr-4">
              <button
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base"
              >
                <Lock className="w-4 h-4" />
                Continue Secure Checkout
              </button>
              {/* <p className="text-[10px] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1 mt-2">
                <ShieldCheck className="w-3 h-3" /> Secure 256-bit encrypted checkout
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentStep;
