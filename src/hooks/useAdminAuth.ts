import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SUPER_USER_EMAIL = 'diogo@diogoppedro.com';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  user: any;
}

export const useAdminAuth = () => {
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    user: null
  });
  const { toast } = useToast();

  const checkAdminAccess = async () => {
    try {
      setAdminState(prev => ({ ...prev, isLoading: true }));

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Admin auth error:', error);
        setAdminState({ isAdmin: false, isLoading: false, user: null });
        return;
      }

      const isAdmin = user?.email === SUPER_USER_EMAIL;
      
      setAdminState({
        isAdmin,
        isLoading: false,
        user
      });

      if (user && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Admin check error:', error);
      setAdminState({ isAdmin: false, isLoading: false, user: null });
    }
  };

  useEffect(() => {
    checkAdminAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAdminState({ isAdmin: false, isLoading: false, user: null });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAdminAccess();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...adminState,
    refreshAdminAuth: checkAdminAccess
  };
};