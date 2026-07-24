import { useState } from 'react';
import { FunnelData, US_STATES } from '@/types/funnel';
import { ChevronDown } from 'lucide-react';

interface BasicInfoStepProps {
  data: FunnelData;
  onUpdate: (data: Partial<FunnelData>) => void;
  onNext: () => void;
  onFieldBlur?: (fieldName: string, fieldValue: string | boolean | number | string[] | null) => void;
}

const BasicInfoStep = ({ data, onUpdate, onNext, onFieldBlur }: BasicInfoStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onUpdate({ phone: formatted });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.state) newErrors.state = 'Please select your state';
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!data.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (data.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!data.termsConsent) newErrors.termsConsent = 'You must agree to continue';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h1 className="form-title">Start your approval – tell us about you.</h1>

      <div className="space-y-6">
        {/* State Selection */}
        <div>
          <label className="form-label form-label-required">
            Which state do you live in?
          </label>
          <div className="relative">
            <select
              value={data.state}
              onChange={(e) => onUpdate({ state: e.target.value })}
              onBlur={() => onFieldBlur?.('state', data.state || null)}
              className={`form-select ${errors.state ? 'border-destructive' : ''}`}
              name="region"
              autoComplete="address-level1"
            >
              <option value="">Select your state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
          <p className="form-helper">
            This helps us connect you with a licensed provider in your state.
          </p>
          {errors.state && <p className="text-destructive text-sm mt-1">{errors.state}</p>}
        </div>

        {/* Name Fields */}
        <div>
          <label className="form-label form-label-required">What is your name?</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                value={data.firstName}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                onBlur={() => onFieldBlur?.('firstName', data.firstName || null)}
                className={`form-input ${errors.firstName ? 'border-destructive' : ''}`}
                placeholder=""
                name="firstName"
              />
              <p className="form-helper">First Name</p>
              {errors.firstName && <p className="text-destructive text-sm">{errors.firstName}</p>}
            </div>
            <div>
              <input
                type="text"
                value={data.lastName}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                onBlur={() => onFieldBlur?.('lastName', data.lastName || null)}
                className={`form-input ${errors.lastName ? 'border-destructive' : ''}`}
                placeholder=""
                name="lastName"
              />
              <p className="form-helper">Last Name</p>
              {errors.lastName && <p className="text-destructive text-sm">{errors.lastName}</p>}
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="form-label form-label-required">
            What is your email address?
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            onBlur={() => onFieldBlur?.('email', data.email || null)}
            className={`form-input ${errors.email ? 'border-destructive' : ''}`}
            placeholder=""
            name="email"
          />
          <p className="form-helper">example@example.com</p>
          {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="form-label form-label-required">
            Please enter the best phone number to reach you on just in case the doctor has any questions regarding your medical information.
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={handlePhoneChange}
            onBlur={() => onFieldBlur?.('phone', data.phone || null)}
            className={`form-input ${errors.phone ? 'border-destructive' : ''}`}
            placeholder="(000) 000-0000"
            name="phone"
          />
          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* SMS Consent */}
        <div>
          <label className="form-label form-label-required">
            Can we also send you text messages about your prescription including tracking information and refill information?
          </label>
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => {
                onUpdate({ smsConsent: true });
                onFieldBlur?.('smsConsent', true);
              }}
              className={`px-6 py-2 rounded-lg border transition-all ${
                data.smsConsent === true
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:border-primary/50'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate({ smsConsent: false });
                onFieldBlur?.('smsConsent', false);
              }}
              className={`px-6 py-2 rounded-lg border transition-all ${
                data.smsConsent === false
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:border-primary/50'
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>

       {/* Transactional SMS Consent */}
      <div className="bg-secondary/50 p-4 rounded-lg mt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.transactionalConsent || false}
              onChange={(e) => {
                onUpdate({ transactionalConsent: e.target.checked });
                onFieldBlur?.('transactionalConsent', e.target.checked);
              }}
              className="mt-1 w-5 h-5 rounded border-input accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              I agree to receive transactional text messages from MyFastRx at the number provided regarding appointment reminders, treatment updates, prescription notifications, and account alerts. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out. Reply HELP for help.
              <span className="text-destructive">*</span>
            </span>
          </label>
          {errors.transactionalConsent && (
            <p className="text-destructive text-sm mt-2">
              {errors.transactionalConsent}
            </p>
          )}
        </div>

          {/* Marketing SMS Consent */}
        <div className="bg-secondary/50 p-4 rounded-lg mt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.marketingConsent || false}
              onChange={(e) => {
                onUpdate({ marketingConsent: e.target.checked });
                onFieldBlur?.('marketingConsent', e.target.checked);
              }}
              className="mt-1 w-5 h-5 rounded border-input accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              I agree to receive recurring marketing text messages from MyFastRx at the number provided, including promotions and special offers. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out. Reply HELP for help.
              <span className="text-destructive">*</span>
            </span>
          </label>
          {errors.marketingConsent && (
            <p className="text-destructive text-sm mt-2">
              {errors.marketingConsent}
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground text-center pb-2 pt-2">
          Mobile information will not be sold or shared with third parties.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          <a
            href="https://www.myfastrx.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80"
          >
            Privacy Policy
          </a>
          {' | '}
          <a
            href="https://www.myfastrx.com/terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80"
          >
            Terms of Use
          </a>
          {' | '}
          <a
            href="https://www.myfastrx.com/sms-terms-and-conditions/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80"
          >
            SMS Terms and Conditions
          </a>
        </p>
      <div className="mt-8 flex justify-center mb-3">
        <button type="submit" className="btn-primary w-full md:w-auto">
          Next
        </button>
      </div>
    </form>
  );
};

export default BasicInfoStep;
