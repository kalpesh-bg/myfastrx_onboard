import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExitIntentDialogProps {
  isComplete: boolean;
}

const ExitIntentDialog = ({ isComplete }: ExitIntentDialogProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if funnel is complete or already shown
    if (isComplete || hasShown) return;

    // Desktop: detect mouse leaving viewport (top of page)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setShowDialog(true);
        setHasShown(true);
      }
    };

    // Mobile: detect back button or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !hasShown) {
        // We can't show a dialog when hidden, but we can set flag
        // The dialog will show if they come back
      }
    };

    // Handle browser back button
    const handlePopState = (e: PopStateEvent) => {
      if (!hasShown) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setShowDialog(true);
        setHasShown(true);
      }
    };

    // Push initial state for back button detection
    window.history.pushState(null, '', window.location.href);

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isComplete, hasShown]);

  const handleStay = () => {
    setShowDialog(false);
  };

  const handleLeave = () => {
    setShowDialog(false);
    // Allow the user to leave - they confirmed
    window.history.back();
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-center">
            Wait! Don't miss out! 🎉
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <p className="text-base">
              Your exclusive coupon code has been applied:
            </p>
            <div className="bg-primary/10 border-2 border-primary border-dashed rounded-lg py-4 px-6">
              <span className="text-2xl font-bold text-primary tracking-wider">
                MY50
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete your application now to lock in this special discount!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={handleLeave}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Leave anyway
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleStay}
            className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90"
          >
            Continue & Save $50
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExitIntentDialog;
