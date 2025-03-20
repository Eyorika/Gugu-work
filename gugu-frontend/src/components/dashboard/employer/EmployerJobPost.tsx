import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { JobPost } from '../../../lib/types';
import JobPostForm from '../../jobs/JobPostForm';

export default function EmployerJobPost() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [user?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data);
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
      console.error(err);
    }
  };

  const handlePostSuccess = () => {
    setSelectedJob(null);
    fetchJobs();
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Job Posts</h1>
        <button
          onClick={() => setSelectedJob({} as JobPost)}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Create New Job
        </button>
      </div>

      {selectedJob && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {selectedJob.id ? 'Edit Job' : 'Create New Job'}
          </h2>
          <JobPostForm 
            job={selectedJob}
            onPost={handlePostSuccess}
            onCancel={() => setSelectedJob(null)}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <span className={`badge-${job.status}`}>{job.status}</span>
            </div>
            <p className="text-gray-600 mb-2">{job.location}</p>
            <p className="text-primary font-medium mb-4">{job.salary}</p>
            <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}