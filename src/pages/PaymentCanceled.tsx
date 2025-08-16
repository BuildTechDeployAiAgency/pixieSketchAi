import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-0 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-800">
            Payment Canceled
          </CardTitle>
          <p className="text-gray-600">
            Your payment was canceled. No charges were made.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-orange-800 text-sm">
              You can try again anytime. Your cart is still waiting for you!
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Try Payment Again
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
      </Card>
    </div>
  );
};

export default PaymentCanceled;
