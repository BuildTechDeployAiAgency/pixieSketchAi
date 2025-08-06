
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
        return;
      }

      // If profile doesn't exist, create it
      if (!data) {
        const credits = 10; // Standard starting credits for all new users
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              credits
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return;
        }

        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCredits = async (newCredits: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating credits:', error);
        toast({
          title: "Error",
          description: "Failed to update credits",
          variant: "destructive",
        });
        return;
      }

      setProfile(prev => prev ? { ...prev, credits: newCredits } : null);
    } catch (error) {
      console.error('Error updating credits:', error);
    }
  };

  useEffect(() => {
    // Initial profile fetch
    fetchProfile();

    // Listen for auth changes and refetch profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useUserProfile:', event, !!session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Delay to ensure session is fully established
        setTimeout(() => {
          fetchProfile();
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoading(false);
      }
    });

    // Set up real-time subscription for profile changes
    let profileSubscription: any = null;
    
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        profileSubscription = supabase
          .channel(`profile-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              console.log('Profile updated via realtime:', payload.new);
              setProfile(payload.new as UserProfile);
            }
          )
          .subscribe();
      }
    };

    setupRealtimeSubscription();

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, []);

  return {
    profile,
    isLoading,
    updateCredits,
    refreshProfile: fetchProfile
  };
};
