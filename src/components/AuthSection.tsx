import { useState } from "react";
import { LogIn, LogOut, User, Mail, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface AuthSectionProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
}
export const AuthSection = ({
  isAuthenticated,
  setIsAuthenticated,
}: AuthSectionProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      if (data.user) {
        setIsAuthenticated(true);
        setIsOpen(false);
        setEmail("");
        setPassword("");
        toast({
          title: "Welcome back!",
          description: "You're now logged in and ready to create magic",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      if (data.user) {
        setIsAuthenticated(true);
        setIsOpen(false);
        setEmail("");
        setPassword("");
        toast({
          title: "Welcome to MagicSketch AI!",
          description: "Your account has been created successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        toast({
          title: "Google Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      // Note: The actual authentication will happen after redirect
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "Come back soon to create more magic!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="h-4 w-4 mr-2" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {isSignUp ? "Create Account" : "Welcome Back!"}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {isSignUp
              ? "Create your account to start creating magic"
              : "Sign in to your account"}
          </DialogDescription>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-4 p-0">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    isSignUp
                      ? "Create a password (min 6 characters)"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (isSignUp ? handleSignUp() : handleLogin())
                  }
                />
              </div>
            </div>

            <Button
              onClick={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                }}
                className="text-sm text-purple-600 hover:text-purple-700 underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Secure authentication for family use
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
