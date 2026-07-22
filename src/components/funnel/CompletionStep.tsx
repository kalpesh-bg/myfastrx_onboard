import { FunnelData } from '@/types/funnel';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface CompletionStepProps {
  data: FunnelData;
}

const CompletionStep = ({ data }: CompletionStepProps) => {
  const treatmentName = data.selectedTreatment === 'semaglutide' ? 'Semaglutide' : 'Tirzepatide';

  return (
    <div className="form-section text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      <h1 className="form-title mb-4">
        Thank you, {data.firstName}! 🎉
      </h1>

      <p className="text-lg text-muted-foreground mb-8">
        Your request for <strong>{treatmentName}</strong> has been submitted successfully.
      </p>

      <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
        <h3 className="font-semibold mb-4">What happens next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <p className="text-muted-foreground">A licensed provider will review your information within 24-48 hours.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
            <p className="text-muted-foreground">You'll receive an email at <strong>{data.email}</strong> with your approval status.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
            <p className="text-muted-foreground">Once approved, your medication will be shipped directly to your home.</p>
          </div>
        </div>
      </div>

      <button className="btn-primary flex items-center justify-center gap-2 mx-auto">
        Return to Homepage <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CompletionStep;
