import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const allowedOrigins = [
  'http://localhost:8080',
  'https://pixie-sketch-ai.vercel.app',
  'https://pixiesketch.com'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : null;
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

const ADMIN_EMAIL = 'diogo@diogoppedro.com';

// Utility function to check if user is admin
async function isAdmin(supabase: any): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    return user.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// Log admin actions for audit trail
async function logAdminAction(
  supabase: any, 
  action: string, 
  targetUserId?: string, 
  targetEmail?: string, 
  details?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        details
      });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    // Create client with user's auth for admin check
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    // Create service client for admin operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin access
    if (!await isAdmin(supabaseAuth)) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operation, ...params } = await req.json()

    console.log('Admin operation requested:', operation, params)

    switch (operation) {
      case 'reset_password': {
        const { email } = params
        
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Send password reset email
        const { error } = await supabaseService.auth.resetPasswordForEmail(email, {
          redirectTo: `${new URL(req.url).origin}/reset-password`
        })

        if (error) {
          console.error('Password reset error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log the action
        await logAdminAction(supabaseAuth, 'password_reset', null, email, { email })

        return new Response(
          JSON.stringify({ success: true, message: `Password reset email sent to ${email}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_credits': {
        const { userId, creditChange } = params
        
        if (!userId || creditChange === undefined) {
          return new Response(
            JSON.stringify({ error: 'userId and creditChange are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get current user profile
        const { data: profile, error: fetchError } = await supabaseService
          .from('profiles')
          .select('email, credits')
          .eq('id', userId)
          .single()

        if (fetchError || !profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const newCredits = Math.max(0, profile.credits + creditChange) // Ensure credits don't go negative

        // Update credits
        const { error: updateError } = await supabaseService
          .from('profiles')
          .update({ 
            credits: newCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Credit update error:', updateError)
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log the action
        await logAdminAction(supabaseAuth, 'credit_update', userId, profile.email, {
          previous_credits: profile.credits,
          credit_change: creditChange,
          new_credits: newCredits
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Credits updated for ${profile.email}`,
            previous_credits: profile.credits,
            new_credits: newCredits
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_all_credits': {
        // Reset all user credits to 0
        const { error } = await supabaseService
          .from('profiles')
          .update({ 
            credits: 0,
            updated_at: new Date().toISOString()
          })
          .neq('id', '00000000-0000-0000-0000-000000000000') // Update all real users

        if (error) {
          console.error('Mass credit reset error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log the action
        await logAdminAction(supabaseAuth, 'mass_credit_reset', null, null, {
          action: 'reset_all_credits_to_zero'
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'All user credits have been reset to 0'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_stats': {
        // Get comprehensive admin statistics
        const { data: stats, error } = await supabaseService
          .rpc('admin_get_stats')

        if (error) {
          console.error('Stats fetch error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, stats }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_audit_log': {
        const { limit = 50 } = params

        // Get recent admin actions
        const { data: auditLog, error } = await supabaseService
          .from('admin_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Audit log fetch error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, audit_log: auditLog }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_budget_stats': {
        // Get comprehensive budget statistics
        const { data: stats, error } = await supabaseService
          .rpc('admin_get_budget_stats')

        if (error) {
          console.error('Budget stats fetch error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, budget_stats: stats }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_budget_period': {
        const { 
          periodName, 
          totalLimit, 
          periodStart, 
          periodEnd, 
          alertThreshold, 
          hardLimitEnabled 
        } = params

        if (!periodName || !totalLimit || !periodStart || !periodEnd) {
          return new Response(
            JSON.stringify({ error: 'periodName, totalLimit, periodStart, and periodEnd are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create new budget period
        const { data: result, error } = await supabaseService
          .rpc('admin_create_budget_period', {
            p_period_name: periodName,
            p_total_limit: totalLimit,
            p_period_start: periodStart,
            p_period_end: periodEnd,
            p_alert_threshold: alertThreshold,
            p_hard_limit_enabled: hardLimitEnabled || false
          })

        if (error) {
          console.error('Budget period creation error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log the action
        await logAdminAction(supabaseAuth, 'budget_period_created', null, null, {
          period_name: periodName,
          total_limit: totalLimit,
          period_start: periodStart,
          period_end: periodEnd
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Budget period "${periodName}" created successfully`,
            data: result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_budget_settings': {
        const { 
          periodId, 
          totalLimit, 
          alertThreshold, 
          hardLimitEnabled 
        } = params

        if (!periodId) {
          return new Response(
            JSON.stringify({ error: 'periodId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateFields: any = { updated_at: new Date().toISOString() }
        if (totalLimit !== undefined) updateFields.total_limit = totalLimit
        if (alertThreshold !== undefined) updateFields.alert_threshold = alertThreshold
        if (hardLimitEnabled !== undefined) updateFields.hard_limit_enabled = hardLimitEnabled

        // Update budget period settings
        const { error } = await supabaseService
          .from('credit_limits')
          .update(updateFields)
          .eq('id', periodId)

        if (error) {
          console.error('Budget settings update error:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log the action
        await logAdminAction(supabaseAuth, 'budget_settings_updated', null, null, {
          period_id: periodId,
          updated_fields: updateFields
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Budget settings updated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})