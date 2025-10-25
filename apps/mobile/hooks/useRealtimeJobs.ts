import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

interface Job {
  id: number;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  input: any;
  output?: any;
  error?: string;
}

export function useRealtimeJobs() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    // Fetch initial jobs
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setJobs(data || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `created_by=eq.${user.id}`,
        },
        (payload) => {
          console.log('Job update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as Job, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => 
              prev.map(job => 
                job.id === payload.new.id ? payload.new as Job : job
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => 
              prev.filter(job => job.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase]);

  const getJobById = (id: number) => {
    return jobs.find(job => job.id === id);
  };

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  const getJobsByType = (type: string) => {
    return jobs.filter(job => job.type === type);
  };

  const getRecentJobs = (limit: number = 5) => {
    return jobs.slice(0, limit);
  };

  const getProcessingJobs = () => {
    return jobs.filter(job => job.status === 'processing');
  };

  const getFailedJobs = () => {
    return jobs.filter(job => job.status === 'failed');
  };

  const getCompletedJobs = () => {
    return jobs.filter(job => job.status === 'done');
  };

  return {
    jobs,
    loading,
    getJobById,
    getJobsByStatus,
    getJobsByType,
    getRecentJobs,
    getProcessingJobs,
    getFailedJobs,
    getCompletedJobs,
  };
}
