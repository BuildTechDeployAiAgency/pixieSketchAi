import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  RefreshCw, 
  DollarSign, 
  Gift,
  Key,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  History,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminRoute } from '@/components/AdminRoute';

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  stripe_session_id: string;
  customer_email: string;
  amount: number;
  credits_purchased: number;
  package_name: string;
  payment_status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'budget'>('users');
  
  // Dialog states
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: UserProfile | null }>({ open: false, user: null });
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; user: UserProfile | null; amount: string }>({ open: false, user: null, amount: '' });
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCredits: 0,
    totalRevenue: 0,
    successfulPayments: 0
  });

  // Budget state
  const [budgetStats, setBudgetStats] = useState<any>(null);
  const [budgetDialog, setBudgetDialog] = useState<{ 
    open: boolean; 
    type: 'create' | 'update'; 
    data?: any 
  }>({ open: false, type: 'create' });

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    console.log('🔍 Admin: Starting data fetch...');
    
    let usersData = [];
    let paymentsData = [];
    
    try {
      // Fetch users
      console.log('🔍 Admin: Fetching users...');
      const { data: userData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Admin: Users fetch error:', usersError);
        // Don't throw, just log and continue
      } else {
        usersData = userData || [];
        console.log('✅ Admin: Users fetched:', usersData.length, 'users');
      }

      // Fetch payments (but don't let this break the whole process)
      console.log('🔍 Admin: Fetching payments...');
      try {
        const { data: paymentData, error: paymentsError } = await supabase
          .from('payment_history')
          .select('*')
          .order('created_at', { ascending: false });

        if (paymentsError) {
          console.error('❌ Admin: Payments fetch error:', paymentsError);
          console.log('⚠️ Admin: Continuing without payment data...');
          paymentsData = [];
        } else {
          paymentsData = paymentData || [];
          console.log('✅ Admin: Payments fetched:', paymentsData.length, 'payments');
        }
      } catch (paymentError) {
        console.error('❌ Admin: Payment fetch exception:', paymentError);
        paymentsData = [];
      }

      // Update state with whatever data we got
      setUsers(usersData);
      setPayments(paymentsData);

      // Calculate stats
      const totalUsers = usersData.length;
      const totalCredits = usersData.reduce((sum, user) => sum + (user.credits || 0), 0);
      const successfulPayments = paymentsData.filter(p => p.payment_status === 'completed');
      const totalRevenue = successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100;

      console.log('📊 Admin: Calculated stats:', {
        totalUsers,
        totalCredits,
        totalRevenue,
        successfulPayments: successfulPayments.length
      });

      setStats({
        totalUsers,
        totalCredits,
        totalRevenue,
        successfulPayments: successfulPayments.length
      });

      console.log('✅ Admin: Data fetch completed successfully');

    } catch (error) {
      console.error('❌ Admin: Unexpected error in fetchData:', error);
      
      // Even if there's an error, try to show what we can
      setUsers(usersData);
      setPayments(paymentsData);
      
      const totalUsers = usersData.length;
      const totalCredits = usersData.reduce((sum, user) => sum + (user.credits || 0), 0);
      
      setStats({
        totalUsers,
        totalCredits,
        totalRevenue: 0,
        successfulPayments: 0
      });
      
      toast({
        title: "Partial Load",
        description: `Loaded ${totalUsers} users. Payment data unavailable.`,
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Health check for admin operations
  const checkAdminHealth = async () => {
    console.log('🏥 Admin: Checking Edge Function health...');
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'health'
        }
      });

      if (error) {
        console.error('❌ Admin: Health check error:', error);
        toast({
          title: "Edge Function Error",
          description: "Admin operations Edge Function is not responding. Please check deployment.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Admin: Health check passed:', data);
      return true;
    } catch (error) {
      console.error('❌ Admin: Health check exception:', error);
      toast({
        title: "Connection Error",
        description: "Cannot connect to admin operations. Please check your connection.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Fetch budget statistics
  const fetchBudgetStats = async () => {
    console.log('🔍 Admin: Fetching budget stats...');
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'get_budget_stats'
        }
      });

      console.log('📥 Admin: Budget stats response:', { data, error });

      if (error) {
        console.error('❌ Admin: Budget stats error:', error);
        // Don't throw, just log and continue
        return;
      }
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error fetching budget stats';
        console.error('❌ Admin: Budget stats failed:', errorMsg);
        // Don't throw, just log and continue
        return;
      }

      console.log('✅ Admin: Budget stats fetched successfully');
      setBudgetStats(data.budget_stats);
    } catch (error: any) {
      console.error('❌ Admin: Budget stats exception:', error);
      // Don't show error toast here, it's not critical
    }
  };

  // Reset user password via admin function
  const handleResetPassword = async (email: string) => {
    console.log('🔄 Admin: Resetting password for:', email);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'reset_password',
          email
        }
      });

      console.log('📥 Admin: Password reset response:', { data, error });

      if (error) {
        console.error('❌ Admin: Password reset error:', error);
        throw error;
      }
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error';
        console.error('❌ Admin: Password reset failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Admin: Password reset successful');
      toast({
        title: "Password Reset Sent",
        description: data.message,
      });

      setResetPasswordDialog({ open: false, user: null });
    } catch (error: any) {
      console.error('❌ Admin: Password reset exception:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  // Give credits to user via admin function
  const handleGiveCredits = async (userId: string, amount: number) => {
    console.log('🔄 Admin: Updating credits for userId:', userId, 'amount:', amount);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'update_credits',
          userId,
          creditChange: amount
        }
      });

      console.log('📥 Admin: Credit update response:', { data, error });

      if (error) {
        console.error('❌ Admin: Credit update error:', error);
        throw error;
      }
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error';
        console.error('❌ Admin: Credit update failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Admin: Credit update successful');
      toast({
        title: "Credits Updated",
        description: data.message,
      });

      setCreditDialog({ open: false, user: null, amount: '' });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('❌ Admin: Credit update exception:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update credits",
        variant: "destructive",
      });
    }
  };

  // Reset all credits via admin function
  const handleResetAllCredits = async () => {
    if (!confirm('Are you sure you want to reset ALL user credits to 0? This cannot be undone.')) {
      return;
    }

    console.log('🔄 Admin: Starting reset all credits operation...');

    try {
      // Add loading state
      setIsLoading(true);

      console.log('🔄 Admin: Invoking admin-operations function...');
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'reset_all_credits'
        }
      });

      console.log('📥 Admin: Function response:', { data, error });

      if (error) {
        console.error('❌ Admin: Edge Function error:', error);
        throw new Error(`Edge Function Error: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        console.error('❌ Admin: No data returned from function');
        throw new Error('No response data from Edge Function');
      }

      if (!data.success) {
        console.error('❌ Admin: Function returned error:', data.error);
        throw new Error(data.error || 'Unknown function error');
      }

      console.log('✅ Admin: Credits reset successful');
      toast({
        title: "Credits Reset",
        description: data.message || "All user credits have been reset to 0",
      });

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('❌ Admin: Reset all credits failed:', error);
      
      const errorMessage = error.message || "Failed to reset credits";
      const errorDetails = error.details || error.hint || '';
      
      toast({
        title: "Reset Failed",
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      // First check if Edge Function is healthy
      const isHealthy = await checkAdminHealth();
      
      // Always fetch basic data (users, payments)
      await fetchData();
      
      // Only fetch budget stats if Edge Function is healthy
      if (isHealthy) {
        fetchBudgetStats();
      }
    };
    
    initializeAdmin();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter payments based on search
  const filteredPayments = payments.filter(payment => 
    payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripe_session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to App
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">PixieSketch Administration</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={fetchData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    console.log('🔍 Testing admin function...');
                    try {
                      const { data, error } = await supabase.rpc('is_admin');
                      console.log('✅ Admin function result:', data, 'Error:', error);
                      if (error) {
                        toast({
                          title: "Admin Function Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: "Admin Function Test",
                          description: `is_admin() returned: ${data}`,
                        });
                      }
                    } catch (err) {
                      console.error('❌ Admin function test failed:', err);
                    }
                  }}
                >
                  Test Admin
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalCredits}</p>
                    <p className="text-sm text-gray-600">Total Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.successfulPayments}</p>
                    <p className="text-sm text-gray-600">Successful Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg border">
              <div className="flex space-x-1">
                <button 
                  onClick={() => setActiveTab('users')} 
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === 'users' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Users</span>
                </button>
                <button 
                  onClick={() => setActiveTab('payments')} 
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === 'payments' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span className="font-medium">Payments</span>
                </button>
                <button 
                  onClick={() => setActiveTab('budget')} 
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === 'budget' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Budget</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {activeTab === 'users' 
                    ? 'User Management' 
                    : activeTab === 'payments' 
                    ? 'Payment History' 
                    : 'Budget Management'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'users' 
                    ? 'Manage user accounts, credits, and passwords' 
                    : activeTab === 'payments' 
                    ? 'View all payment transactions and status'
                    : 'Monitor and control operational credit budgets'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                {activeTab === 'users' && (
                  <Button 
                    variant="outline" 
                    onClick={handleResetAllCredits}
                    className="text-red-600 hover:text-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reset All Credits
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'users' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {user.credits}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>{formatDate(user.updated_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResetPasswordDialog({ open: true, user })}
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Reset Password
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCreditDialog({ open: true, user, amount: '' })}
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Credits
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Session ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.customer_email}</TableCell>
                          <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.credits_purchased}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.package_name}</TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell>{formatDate(payment.created_at)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.stripe_session_id.slice(-8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Budget Management Content
                <div className="space-y-6">
                  {budgetStats ? (
                    <>
                      {/* Budget Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="text-2xl font-bold text-blue-600">
                                  {budgetStats.current_period?.used_credits || 0}
                                </p>
                                <p className="text-sm text-gray-600">Credits Used</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-8 w-8 text-green-600" />
                              <div>
                                <p className="text-2xl font-bold text-green-600">
                                  {budgetStats.current_period?.remaining_credits || 0}
                                </p>
                                <p className="text-sm text-gray-600">Credits Remaining</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-8 w-8 text-purple-600" />
                              <div>
                                <p className="text-2xl font-bold text-purple-600">
                                  {budgetStats.recent_usage_24h || 0}
                                </p>
                                <p className="text-sm text-gray-600">Usage (24h)</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Current Budget Period */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5" />
                            <span>Current Budget Period</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Period Name:</span>
                              <span>{budgetStats.current_period?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Limit:</span>
                              <Badge variant="outline" className="font-mono">
                                {budgetStats.current_period?.total_limit || 0} credits
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Usage:</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant={
                                  (budgetStats.current_period?.usage_percentage || 0) > 80 
                                    ? "destructive" 
                                    : (budgetStats.current_period?.usage_percentage || 0) > 60 
                                    ? "default" 
                                    : "secondary"
                                }>
                                  {budgetStats.current_period?.usage_percentage || 0}%
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  ({budgetStats.current_period?.used_credits || 0} / {budgetStats.current_period?.total_limit || 0})
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Hard Limit:</span>
                              <Badge variant={budgetStats.current_period?.hard_limit_enabled ? "destructive" : "secondary"}>
                                {budgetStats.current_period?.hard_limit_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Period:</span>
                              <span className="text-sm">
                                {budgetStats.current_period?.period_start && 
                                  formatDate(budgetStats.current_period.period_start)} - {' '}
                                {budgetStats.current_period?.period_end && 
                                  formatDate(budgetStats.current_period.period_end)}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Budget Usage</span>
                              <span>{budgetStats.current_period?.usage_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  (budgetStats.current_period?.usage_percentage || 0) > 80 
                                    ? 'bg-red-600' 
                                    : (budgetStats.current_period?.usage_percentage || 0) > 60 
                                    ? 'bg-yellow-600' 
                                    : 'bg-green-600'
                                }`}
                                style={{ 
                                  width: `${Math.min(budgetStats.current_period?.usage_percentage || 0, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBudgetDialog({ open: true, type: 'update', data: budgetStats.current_period })}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Update Settings
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBudgetDialog({ open: true, type: 'create' })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              New Period
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchBudgetStats}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refresh
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Budget statistics unavailable</p>
                      <p className="text-sm text-gray-500 mb-4">
                        This feature requires the budget system database schema. 
                        Please apply the SQL schema from supabase/credit-budget-system.sql
                      </p>
                      <Button
                        variant="outline"
                        onClick={fetchBudgetStats}
                        className="mt-4"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>
                Send a password reset email to {resetPasswordDialog.user?.email}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordDialog({ open: false, user: null })}>
                Cancel
              </Button>
              <Button onClick={() => resetPasswordDialog.user && handleResetPassword(resetPasswordDialog.user.email)}>
                Send Reset Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Give Credits Dialog */}
        <Dialog open={creditDialog.open} onOpenChange={(open) => setCreditDialog({ open, user: null, amount: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Credits</DialogTitle>
              <DialogDescription>
                Current credits for {creditDialog.user?.email}: {creditDialog.user?.credits}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Credits to add/remove (use negative number to remove)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount (e.g., 10 or -5)"
                  value={creditDialog.amount}
                  onChange={(e) => setCreditDialog(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog(prev => ({ ...prev, amount: '1' }))}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  +1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog(prev => ({ ...prev, amount: '10' }))}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  +10
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog(prev => ({ ...prev, amount: '25' }))}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  +25
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog(prev => ({ ...prev, amount: '-1' }))}
                  size="sm"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  -1
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreditDialog({ open: false, user: null, amount: '' })}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const amount = parseInt(creditDialog.amount);
                  if (creditDialog.user && !isNaN(amount)) {
                    handleGiveCredits(creditDialog.user.id, amount);
                  }
                }}
                disabled={!creditDialog.amount || isNaN(parseInt(creditDialog.amount))}
              >
                Update Credits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;