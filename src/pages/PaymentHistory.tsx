import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PaymentRecord {
  id: string;
  stripe_session_id: string;
  amount_dollars: number;
  currency: string;
  credits_purchased: number;
  package_name: string;
  payment_status: string;
  status_display: string;
  created_at: string;
}

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("user_payment_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPayments(data || []);

      // Calculate totals
      const completedPayments =
        data?.filter((p) => p.payment_status === "completed") || [];
      const spent = completedPayments.reduce(
        (sum, p) => sum + p.amount_dollars,
        0,
      );
      const credits = completedPayments.reduce(
        (sum, p) => sum + p.credits_purchased,
        0,
      );

      setTotalSpent(spent);
      setTotalCredits(credits);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const getStatusBadge = (status: string, statusDisplay: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-800 hover:bg-green-100",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      failed: "bg-red-100 text-red-800 hover:bg-red-100",
      refunded: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {statusDisplay}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadReceipt = async (sessionId: string, packageName: string) => {
    try {
      // Generate a simple receipt
      const payment = payments.find((p) => p.stripe_session_id === sessionId);
      if (!payment) return;

      const receiptText = `
PixieSketchAI - Payment Receipt
================================

Transaction ID: ${sessionId}
Date: ${formatDate(payment.created_at)}
Package: ${payment.package_name}
Credits: ${payment.credits_purchased}
Amount: $${payment.amount_dollars.toFixed(2)} ${payment.currency.toUpperCase()}
Status: ${payment.status_display}

Thank you for your purchase!
Visit https://pixiesketch.com to start creating magic.
      `.trim();

      const blob = new Blob([receiptText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pixiesketchai-receipt-${sessionId.slice(-8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Receipt Downloaded",
        description: "Your receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              Please log in to view your payment history.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment History
              </h1>
              <p className="text-gray-600">
                View your purchase history and download receipts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalSpent.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {totalCredits}
                  </p>
                  <p className="text-sm text-gray-600">Credits Purchased</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {payments.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {profile.credits}
                  </p>
                  <p className="text-sm text-gray-600">Current Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Transaction History</CardTitle>
            <Button
              variant="outline"
              onClick={fetchPaymentHistory}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">Loading payment history...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No payment history found</p>
                <Button onClick={() => navigate("/")}>
                  Start by purchasing credits
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(payment.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {payment.stripe_session_id.slice(-8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.package_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {payment.credits_purchased}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${payment.amount_dollars.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.currency.toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            payment.payment_status,
                            payment.status_display,
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadReceipt(
                                payment.stripe_session_id,
                                payment.package_name,
                              )
                            }
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentHistory;
