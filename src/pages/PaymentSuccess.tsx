import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useUserProfile();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  const sessionId = searchParams.get("session_id");
  const credits = searchParams.get("credits");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Invalid payment session",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "verify-payment",
          {
            body: { sessionId },
          },
        );

        if (error) {
          throw error;
        }

        setVerificationResult(data);
        setPurchaseDetails(data.purchaseDetails);

        if (data.success) {
          // Refresh user profile to get updated credits
          await refreshProfile();

          toast({
            title: "Payment Successful!",
            description: `Your account has been credited with ${data.addedCredits || credits} credits.`,
          });
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
        toast({
          title: "Verification Failed",
          description: "Unable to verify payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, credits, toast, navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-0 shadow-xl">
        <CardHeader className="space-y-4">
          {isVerifying ? (
            <>
              <div className="flex justify-center">
                <Sparkles className="h-16 w-16 text-purple-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl text-purple-800">
                Verifying Payment...
              </CardTitle>
              <p className="text-gray-600">
                Please wait while we confirm your payment
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Payment Successful!
              </CardTitle>
              <p className="text-gray-600">Thank you for your purchase</p>
            </>
          )}
        </CardHeader>

        {!isVerifying && verificationResult && (
          <CardContent className="space-y-6">
            {/* Purchase Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3 text-center">
                Purchase Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-medium">
                    {purchaseDetails?.packageName ||
                      `${verificationResult.addedCredits || credits} Credits`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    ${(purchaseDetails?.amount || 0) / 100}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {purchaseDetails?.paymentMethod || "Card"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs">
                    {sessionId?.slice(-8) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Credits Added */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  Credits Added to Your Account
                </span>
              </div>
              <div className="text-center">
                <Badge className="bg-green-100 text-green-700 text-xl py-3 px-6">
                  +{verificationResult.addedCredits || credits} Credits
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Total Credits: {verificationResult.credits || "Loading..."}
                </p>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2 text-center">
                What's Next?
              </h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Upload your drawings to transform them</li>
                <li>
                  • Choose from 3 magical styles: Cartoon, Pixar, or Realistic
                </li>
                <li>• Each transformation uses 1 credit</li>
                <li>• Download and share your magical creations!</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Creating Magic
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
