import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { ApplicationStatus } from '../../../lib/types';

interface Props {
  jobId: string;
}

export default function ApplicationStatus({ jobId }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', jobId)
        .eq('worker_id', user.id)
        .single();

      if (!error && data) {
        setStatus(data.status);
      }
      setLoading(false);
    };

    fetchApplication();
  }, [jobId, user?.id]);

  if (loading) return <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />;
  if (!status) return null;

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status].color}`}>
      {statusConfig[status].label}
    </span>
  );
}