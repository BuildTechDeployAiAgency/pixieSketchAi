
import { useState } from "react";
import { CreditCard, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export const PaymentModal = ({ isOpen, onClose, isAuthenticated }: PaymentModalProps) => {
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBuyCredits = async (amount: number, price: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    const buttonId = `${amount}-credits`;
    setLoadingButtonId(buttonId);
    
    try {
      console.log('Initiating payment:', { amount, price });
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: price,
          credits: amount,
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Opening Stripe checkout in a new tab...",
        });
        // Close modal after initiating payment
        onClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingButtonId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Choose Your Magic Pack</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Single Magic - 1 Credit */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Single Magic</h3>
              <div className="text-2xl font-bold text-blue-600">$1.00</div>
              <p className="text-gray-600">1 transformation</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleBuyCredits(1, 1.00)}
                disabled={loadingButtonId === '1-credits'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loadingButtonId === '1-credits' ? "Processing..." : "Buy 1 Credit"}
              </Button>
            </div>
          </div>

          {/* Magic Pack - 10 Credits */}
          <div className="border-2 border-purple-300 rounded-lg p-6 relative bg-gradient-to-br from-purple-50 to-pink-50">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
              POPULAR
            </Badge>
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Magic Pack</h3>
              <div className="text-3xl font-bold text-purple-600">$4.99</div>
              <p className="text-gray-600">10 transformations</p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleBuyCredits(10, 4.99)}
                disabled={loadingButtonId === '10-credits'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loadingButtonId === '10-credits' ? "Processing..." : "Buy 10 Credits"}
              </Button>
            </div>
          </div>

          {/* Super Magic Pack - 25 Credits */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-pink-600" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Super Magic Pack</h3>
              <div className="text-3xl font-bold text-purple-600">$9.99</div>
              <p className="text-gray-600">25 transformations</p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleBuyCredits(25, 9.99)}
                disabled={loadingButtonId === '25-credits'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loadingButtonId === '25-credits' ? "Processing..." : "Best Value Pack"}
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            Secure payment powered by Stripe
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
