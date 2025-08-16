import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "./PaymentModal";

interface CreditBalanceProps {
  credits: number;
  isAuthenticated?: boolean;
}

export const CreditBalance = ({
  credits,
  isAuthenticated = false,
}: CreditBalanceProps) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
          <CreditCard className="h-4 w-4 mr-1" />
          {credits} Credits
        </Badge>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Buy Credits
        </Button>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
};
