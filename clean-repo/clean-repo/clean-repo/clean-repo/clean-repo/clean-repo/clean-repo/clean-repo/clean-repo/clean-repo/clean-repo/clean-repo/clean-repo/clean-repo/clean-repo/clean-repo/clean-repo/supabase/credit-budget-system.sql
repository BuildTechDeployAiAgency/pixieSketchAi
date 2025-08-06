-- Credit Budget System Setup
-- This script creates tables and functions for controlling total credit usage and operational budget

-- Create credit_limits table to track budget periods and limits
CREATE TABLE IF NOT EXISTS credit_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_name VARCHAR(255) NOT NULL DEFAULT 'Monthly Budget',
    total_limit INTEGER NOT NULL DEFAULT 1000, -- Maximum credits available for this period
    used_credits INTEGER NOT NULL DEFAULT 0, -- Running total of credits used
    period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    alert_threshold INTEGER NOT NULL DEFAULT 800, -- Alert when 80% of budget is used
    hard_limit_enabled BOOLEAN NOT NULL DEFAULT false, -- If true, block credit usage when limit is reached
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_credit_limits_active ON credit_limits(is_active, period_start, period_end);

-- Create credit_usage_log table to track individual credit usage events
CREATE TABLE IF NOT EXISTS credit_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_used INTEGER NOT NULL,
    operation_type VARCHAR(50) NOT NULL DEFAULT 'sketch_generation', -- Type of operation
    sketch_id UUID, -- Optional reference to sketches table
    budget_period_id UUID REFERENCES credit_limits(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_user ON credit_usage_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_period ON credit_usage_log(budget_period_id, created_at);

-- Insert default budget period (1000 credits per month)
INSERT INTO credit_limits (period_name, total_limit, used_credits, alert_threshold, hard_limit_enabled)
VALUES ('Monthly Budget - August 2025', 1000, 0, 800, false)
ON CONFLICT DO NOTHING;

-- Function to get current active budget period
CREATE OR REPLACE FUNCTION get_active_budget_period()
RETURNS credit_limits AS $$
DECLARE
    active_period credit_limits;
BEGIN
    SELECT * INTO active_period
    FROM credit_limits
    WHERE is_active = true
      AND period_start <= NOW()
      AND period_end >= NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active period, create one
    IF active_period.id IS NULL THEN
        INSERT INTO credit_limits (
            period_name,
            total_limit,
            used_credits,
            period_start,
            period_end,
            is_active
        ) VALUES (
            'Auto-created Monthly Budget',
            1000,
            0,
            date_trunc('month', NOW()),
            date_trunc('month', NOW()) + INTERVAL '1 month',
            true
        )
        RETURNING * INTO active_period;
    END IF;
    
    RETURN active_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if credit usage is allowed within budget
CREATE OR REPLACE FUNCTION check_budget_limit(credits_to_use INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
    current_period credit_limits;
    remaining_credits INTEGER;
    result JSONB;
BEGIN
    -- Get current active budget period
    current_period := get_active_budget_period();
    
    -- Calculate remaining credits
    remaining_credits := current_period.total_limit - current_period.used_credits;
    
    -- Build result
    result := jsonb_build_object(
        'allowed', true,
        'remaining_credits', remaining_credits,
        'total_limit', current_period.total_limit,
        'used_credits', current_period.used_credits,
        'period_id', current_period.id,
        'period_name', current_period.period_name,
        'alert_threshold', current_period.alert_threshold,
        'approaching_limit', current_period.used_credits >= current_period.alert_threshold
    );
    
    -- Check if hard limit is enabled and would be exceeded
    IF current_period.hard_limit_enabled AND (current_period.used_credits + credits_to_use) > current_period.total_limit THEN
        result := jsonb_set(result, '{allowed}', 'false'::jsonb);
        result := jsonb_set(result, '{reason}', '"Budget limit exceeded"'::jsonb);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log credit usage and update budget
CREATE OR REPLACE FUNCTION log_credit_usage(
    p_user_id UUID,
    p_credits_used INTEGER,
    p_operation_type VARCHAR DEFAULT 'sketch_generation',
    p_sketch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_period credit_limits;
    log_result JSONB;
BEGIN
    -- Get current active budget period
    current_period := get_active_budget_period();
    
    -- Log the usage
    INSERT INTO credit_usage_log (
        user_id,
        credits_used,
        operation_type,
        sketch_id,
        budget_period_id
    ) VALUES (
        p_user_id,
        p_credits_used,
        p_operation_type,
        p_sketch_id,
        current_period.id
    );
    
    -- Update the budget period usage
    UPDATE credit_limits
    SET 
        used_credits = used_credits + p_credits_used,
        updated_at = NOW()
    WHERE id = current_period.id;
    
    -- Return updated status
    RETURN check_budget_limit(0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin to create new budget period
CREATE OR REPLACE FUNCTION admin_create_budget_period(
    p_period_name VARCHAR,
    p_total_limit INTEGER,
    p_period_start TIMESTAMP WITH TIME ZONE,
    p_period_end TIMESTAMP WITH TIME ZONE,
    p_alert_threshold INTEGER DEFAULT NULL,
    p_hard_limit_enabled BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    new_period_id UUID;
BEGIN
    -- Set default alert threshold to 80% of limit
    IF p_alert_threshold IS NULL THEN
        p_alert_threshold := FLOOR(p_total_limit * 0.8);
    END IF;
    
    -- Deactivate overlapping periods
    UPDATE credit_limits
    SET is_active = false
    WHERE is_active = true
      AND (
          (period_start <= p_period_end AND period_end >= p_period_start)
      );
    
    -- Create new period
    INSERT INTO credit_limits (
        period_name,
        total_limit,
        used_credits,
        period_start,
        period_end,
        alert_threshold,
        hard_limit_enabled,
        is_active
    ) VALUES (
        p_period_name,
        p_total_limit,
        0,
        p_period_start,
        p_period_end,
        p_alert_threshold,
        p_hard_limit_enabled,
        true
    ) RETURNING id INTO new_period_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'period_id', new_period_id,
        'message', 'Budget period created successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin to get budget statistics
CREATE OR REPLACE FUNCTION admin_get_budget_stats()
RETURNS JSONB AS $$
DECLARE
    current_period credit_limits;
    stats JSONB;
    recent_usage INTEGER;
    top_users JSONB;
BEGIN
    -- Get current period
    current_period := get_active_budget_period();
    
    -- Get usage in last 24 hours
    SELECT COALESCE(SUM(credits_used), 0) INTO recent_usage
    FROM credit_usage_log
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND budget_period_id = current_period.id;
    
    -- Get top users by credit usage
    SELECT jsonb_agg(
        jsonb_build_object(
            'user_id', user_id,
            'credits_used', credits_used
        )
    ) INTO top_users
    FROM (
        SELECT 
            user_id,
            SUM(credits_used) as credits_used
        FROM credit_usage_log
        WHERE budget_period_id = current_period.id
        GROUP BY user_id
        ORDER BY credits_used DESC
        LIMIT 10
    ) t;
    
    -- Build comprehensive stats
    stats := jsonb_build_object(
        'current_period', jsonb_build_object(
            'id', current_period.id,
            'name', current_period.period_name,
            'total_limit', current_period.total_limit,
            'used_credits', current_period.used_credits,
            'remaining_credits', current_period.total_limit - current_period.used_credits,
            'usage_percentage', ROUND((current_period.used_credits::DECIMAL / current_period.total_limit::DECIMAL) * 100, 2),
            'alert_threshold', current_period.alert_threshold,
            'hard_limit_enabled', current_period.hard_limit_enabled,
            'period_start', current_period.period_start,
            'period_end', current_period.period_end
        ),
        'recent_usage_24h', recent_usage,
        'top_users', COALESCE(top_users, '[]'::jsonb)
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write credit_limits
CREATE POLICY "Admins can manage credit limits" ON credit_limits
    FOR ALL USING (auth.email() = 'diogo@diogoppedro.com');

-- Users can only see their own credit usage logs, admins can see all
CREATE POLICY "Users can view own credit usage" ON credit_usage_log
    FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'diogo@diogoppedro.com');

-- Only system can insert credit usage logs
CREATE POLICY "System can log credit usage" ON credit_usage_log
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON credit_limits TO authenticated;
GRANT SELECT ON credit_usage_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_budget_period() TO authenticated;
GRANT EXECUTE ON FUNCTION check_budget_limit(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_credit_usage(UUID, INTEGER, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_budget_period(VARCHAR, INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_budget_stats() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE credit_limits IS 'Manages budget periods and credit limits for operational cost control';
COMMENT ON TABLE credit_usage_log IS 'Logs individual credit usage events for audit and budget tracking';
COMMENT ON FUNCTION check_budget_limit(INTEGER) IS 'Checks if credit usage is allowed within current budget period';
COMMENT ON FUNCTION log_credit_usage(UUID, INTEGER, VARCHAR, UUID) IS 'Logs credit usage and updates budget tracking';
COMMENT ON FUNCTION admin_get_budget_stats() IS 'Returns comprehensive budget statistics for admin dashboard';