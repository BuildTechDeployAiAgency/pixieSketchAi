import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, isLoading, user } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      // Not authenticated at all, redirect to home
      navigate("/");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access this area.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-2">
              You don't have admin privileges.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current user: {user.email}
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
