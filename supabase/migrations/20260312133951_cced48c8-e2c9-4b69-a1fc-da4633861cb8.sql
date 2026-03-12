CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(jobid bigint, schedule text, command text, jobname text, active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jobid, schedule, command, jobname, active
  FROM cron.job
  ORDER BY jobid;
$$;