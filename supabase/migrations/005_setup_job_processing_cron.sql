-- Enable required extensions for automated job processing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant permissions to use extensions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Create a helper function to trigger the cron-tick edge function
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
    -- Get configuration from vault or secrets (you'll need to set these)
    -- For now, we'll use pg_settings or environment
    -- NOTE: In production, use Supabase Vault to store secrets securely

    -- You can set these values in your Supabase dashboard under Database > Extensions > pg_cron
    -- Or use vault: SELECT vault.create_secret('your-secret-value', 'secret-name');

    -- Get the Supabase URL (you'll need to configure this)
    SELECT current_setting('app.settings.supabase_url', true) INTO supabase_url;
    SELECT current_setting('app.settings.cron_secret', true) INTO cron_secret;
    SELECT current_setting('app.settings.service_role_key', true) INTO service_role_key;

    -- If settings are not configured, log and exit
    IF supabase_url IS NULL OR cron_secret IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'Job worker trigger skipped: Required settings not configured. Please set app.settings.supabase_url, app.settings.cron_secret, and app.settings.service_role_key';
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

-- Schedule the job to run every minute
-- This will process up to 5 jobs per minute
-- Adjust the schedule as needed (every 30 seconds: '*/30 * * * * *', every 5 minutes: '*/5 * * * *')
SELECT cron.schedule(
    'process-queued-jobs',           -- Job name
    '* * * * *',                     -- Every minute (cron format: minute hour day month weekday)
    'SELECT trigger_job_worker();'   -- SQL to execute
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION trigger_job_worker() TO postgres;

-- Create a view to monitor cron job status
CREATE OR REPLACE VIEW job_processing_status AS
SELECT
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobid IN (SELECT jobid FROM cron.job_run_details WHERE status = 'failed' ORDER BY start_time DESC LIMIT 10) as has_recent_failures
FROM cron.job
WHERE jobname = 'process-queued-jobs';

-- Grant access to the view
GRANT SELECT ON job_processing_status TO authenticated, service_role;

-- Add a helper function to manually trigger job processing (for testing/debugging)
CREATE OR REPLACE FUNCTION manual_process_jobs(iterations INT DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..iterations LOOP
        PERFORM trigger_job_worker();
        -- Small delay between iterations
        PERFORM pg_sleep(0.5);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'iterations', iterations,
        'message', 'Manually triggered job processing'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION manual_process_jobs(INT) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION trigger_job_worker() IS 'Triggers the cron-tick edge function to process queued jobs. Called automatically by pg_cron every minute.';
COMMENT ON FUNCTION manual_process_jobs(INT) IS 'Manually trigger job processing for testing/debugging. Usage: SELECT manual_process_jobs(5);';
COMMENT ON VIEW job_processing_status IS 'Monitor the status of the automated job processing cron job.';
