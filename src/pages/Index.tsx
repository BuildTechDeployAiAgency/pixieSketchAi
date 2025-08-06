import { useState, useEffect } from "react";
import { Upload, Sparkles, Wand2, CreditCard, History, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import { SketchGallery } from "@/components/SketchGallery";
import { CreditBalance } from "@/components/CreditBalance";
import { AuthSection } from "@/components/AuthSection";
import { useSketches } from "@/hooks/useSketches";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();

  // Use the profile hook and sketches hook
  const {
    profile,
    isLoading: isProfileLoading,
    updateCredits,
    refreshProfile
  } = useUserProfile();
  const sketchesData = useSketches();
  const {
    toast
  } = useToast();

  // Check authentication status on mount and listen for changes
  useEffect(() => {
    console.log('Setting up auth listener in Index...');

    // Check current session immediately
    const checkInitialAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const authenticated = !!session;
      console.log('Initial auth check:', authenticated);
      setIsAuthenticated(authenticated);
      setUserEmail(session?.user?.email || null);
      setIsAuthLoading(false);
    };
    checkInitialAuth();

    // Listen for auth changes with proper session management
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in Index:', event, !!session);
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setUserEmail(session?.user?.email || null);
      setIsAuthLoading(false);

      // Force a small delay to ensure all hooks are updated
      if (authenticated && event === 'SIGNED_IN') {
        console.log('User signed in - updating UI state');
      } else if (!authenticated && event === 'SIGNED_OUT') {
        console.log('User signed out - clearing UI state');
      }
    });
    return () => {
      console.log('Cleaning up auth subscription in Index');
      subscription.unsubscribe();
    };
  }, []);

  // Cache authentication status
  useEffect(() => {
    if (!isAuthLoading) {
      localStorage.setItem('isAuthenticated', isAuthenticated.toString());
    }
  }, [isAuthenticated, isAuthLoading]);

  // Load cached auth status
  useEffect(() => {
    const cachedAuth = localStorage.getItem('isAuthenticated');
    if (cachedAuth && !isAuthLoading) {
      setIsAuthenticated(cachedAuth === 'true');
    }
  }, [isAuthLoading]);

  // Log when sketch data changes for debugging
  useEffect(() => {
    console.log('📊 Index: Sketch data changed', {
      sketchCount: sketchesData.sketches.length,
      newCount: sketchesData.newSketchCount,
      isLoading: sketchesData.isLoading
    });
  }, [sketchesData.sketches, sketchesData.newSketchCount, sketchesData.isLoading]);

  const handleBuyCredits = async (amount: number, price: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive"
      });
      return;
    }
    setIsProcessingPayment(true);
    try {
      console.log('Initiating payment:', {
        amount,
        price
      });
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: price,
          credits: amount
        }
      });
      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Failed to initiate payment. Please try again.",
          variant: "destructive"
        });
        return;
      }
      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Opening Stripe checkout in a new tab..."
        });
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wand2 className="h-8 w-8 text-purple-600 animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PixieSketchAI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && profile && <CreditBalance credits={profile.credits} isAuthenticated={isAuthenticated} />}
              {isAuthenticated && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/payment-history')}
                    className="hidden sm:flex"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Payment History
                  </Button>
                  {userEmail === 'diogo@diogoppedro.com' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="hidden sm:flex border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                </>
              )}
              {isAuthenticated && userEmail && (
                <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{userEmail}</span>
                </div>
              )}
              <AuthSection isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-pink-400 rounded-full animate-bounce"></div>
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
            Bring Your Drawings to Life!
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your child's artwork and watch it transform into magical drawings with the power of AI ✨
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-lg py-2 px-4 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
              🎨 Any Drawing Style
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              ⚡ 2-Minute Results
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4 bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors">
              📱 Works on Any Device
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs - Only show when authenticated */}
        {isAuthenticated && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg border">
              <div className="flex space-x-1">
                <button 
                  onClick={() => setActiveTab('upload')} 
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === 'upload' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Upload Drawing</span>
                </button>
                <button 
                  onClick={() => setActiveTab('gallery')} 
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 relative ${
                    activeTab === 'gallery' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span className="font-medium">My Sketches</span>
                  {sketchesData.newSketchCount > 0 && (
                    <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center ml-1">
                      {sketchesData.newSketchCount}
                    </Badge>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          {isAuthenticated ? (
            // Show tabs content for authenticated users
            activeTab === 'upload' ? (
              <div className="space-y-8">
                <FileUpload 
                  credits={profile?.credits || 0} 
                  setCredits={updateCredits} 
                  isAuthenticated={isAuthenticated}
                  onCreditUpdate={refreshProfile} 
                />
                
                {/* How It Works and Pricing sections for authenticated users */}
                {/* How It Works */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-purple-800">How It Works</CardTitle>
                    <CardDescription className="text-lg">Transform your drawings in 3 simple steps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-lg">1. Upload</h3>
                        <p className="text-gray-600">Take a photo or upload your drawing (JPG/PNG)</p>
                      </div>
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <Sparkles className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg">2. Transform</h3>
                        <p className="text-gray-600">Our AI creates a magical drawing</p>
                      </div>
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                          <Wand2 className="h-8 w-8 text-pink-600" />
                        </div>
                        <h3 className="font-semibold text-lg">3. Enjoy</h3>
                        <p className="text-gray-600">Download and share your magical masterpiece</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="border-0 shadow-xl">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Simple Pricing</CardTitle>
                    <CardDescription>No subscriptions, pay as you create</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">Single Magic</CardTitle>
                          <div className="text-3xl font-bold text-purple-600">$1</div>
                          <CardDescription>Per transformation</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(1, 1)} disabled={isProcessingPayment}>
                            {isProcessingPayment ? "Processing..." : "Try One Transform"}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-purple-300 relative hover:border-purple-400 transition-colors">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-600 text-white">POPULAR</Badge>
                        </div>
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">Magic Pack</CardTitle>
                          <div className="text-3xl font-bold text-purple-600">$4.99</div>
                          <CardDescription>10 transformations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(10, 4.99)} disabled={isProcessingPayment}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isProcessingPayment ? "Processing..." : "Buy Credits"}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">Super Magic</CardTitle>
                          <div className="text-3xl font-bold text-purple-600">$9.99</div>
                          <CardDescription>25 transformations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(25, 9.99)} disabled={isProcessingPayment}>
                            {isProcessingPayment ? "Processing..." : "Best Value Pack"}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <SketchGallery key={`gallery-${sketchesData.sketches.length}-${sketchesData.newSketchCount}`} sketchesData={sketchesData} />
            )
          ) : (
            // Show informational sections only for non-authenticated users
            <div className="space-y-8">
              {/* How It Works */}
              <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-purple-800">How It Works</CardTitle>
                  <CardDescription className="text-lg">Transform your drawings in 3 simple steps</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg">1. Upload</h3>
                      <p className="text-gray-600">Take a photo or upload your drawing (JPG/PNG)</p>
                    </div>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">2. Transform</h3>
                      <p className="text-gray-600">Our AI creates a magical drawing</p>
                    </div>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <Wand2 className="h-8 w-8 text-pink-600" />
                      </div>
                      <h3 className="font-semibold text-lg">3. Enjoy</h3>
                      <p className="text-gray-600">Download and share your magical masterpiece</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Simple Pricing</CardTitle>
                  <CardDescription>No subscriptions, pay as you create</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">Single Magic</CardTitle>
                        <div className="text-3xl font-bold text-purple-600">$1</div>
                        <CardDescription>Per transformation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(1, 1)} disabled={isProcessingPayment}>
                          {isProcessingPayment ? "Processing..." : "Try One Transform"}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2 border-purple-300 relative hover:border-purple-400 transition-colors">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white">POPULAR</Badge>
                      </div>
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">Magic Pack</CardTitle>
                        <div className="text-3xl font-bold text-purple-600">$4.99</div>
                        <CardDescription>10 transformations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(10, 4.99)} disabled={isProcessingPayment}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isProcessingPayment ? "Processing..." : "Buy Credits"}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">Super Magic</CardTitle>
                        <div className="text-3xl font-bold text-purple-600">$9.99</div>
                        <CardDescription>25 transformations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleBuyCredits(25, 9.99)} disabled={isProcessingPayment}>
                          {isProcessingPayment ? "Processing..." : "Best Value Pack"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">Made with ❤️ for creative families</p>
            <p className="text-sm">Safe, secure, and COPPA-compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
