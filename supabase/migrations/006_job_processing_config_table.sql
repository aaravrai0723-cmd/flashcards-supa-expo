-- Create a configuration table for job processing settings
CREATE TABLE IF NOT EXISTS job_processing_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON job_processing_config TO postgres;
GRANT ALL ON job_processing_config TO service_role;

-- Update the trigger function to read from config table
CREATE OR REPLACE FUNCTION trigger_job_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url TEXT;
    cron_secret TEXT;
    service_role_key TEXT;
    response http_response;
BEGIN
    -- Get configuration from the config table
    SELECT value INTO supabase_url FROM job_processing_config WHERE key = 'supabase_url';
    SELECT value INTO cron_secret FROM job_processing_config WHERE key = 'cron_secret';
    SELECT value INTO service_role_key FROM job_processing_config WHERE key = 'service_role_key';

    -- If settings are not configured, log and exit
    IF supabase_url IS NULL OR cron_secret IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'Job worker trigger skipped: Required settings not configured in job_processing_config table';
        RETURN;
    END IF;

    -- Make HTTP request to cron-tick function
    SELECT * INTO response FROM http((
        'POST',
        supabase_url || '/functions/v1/cron-tick',
        ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('x-cron-secret', cron_secret),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{"iterations": 5, "delay": 500}'
    )::http_request);

    -- Log the response
    IF response.status >= 200 AND response.status < 300 THEN
        RAISE NOTICE 'Job worker triggered successfully: %', response.content;
    ELSE
        RAISE WARNING 'Job worker trigger failed with status %: %', response.status, response.content;
    END IF;
END;
$$;

-- Add helper function to set configuration
CREATE OR REPLACE FUNCTION set_job_processing_config(config_key TEXT, config_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO job_processing_config (key, value, updated_at)
    VALUES (config_key, config_value, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION set_job_processing_config(TEXT, TEXT) TO service_role;

COMMENT ON TABLE job_processing_config IS 'Configuration settings for automatic job processing with pg_cron';
COMMENT ON FUNCTION set_job_processing_config(TEXT, TEXT) IS 'Helper function to set job processing configuration. Usage: SELECT set_job_processing_config(''supabase_url'', ''https://...'');';
