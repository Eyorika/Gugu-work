import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost, Application } from '../../../lib/types';
import { useAuth } from '../../../contexts/AuthContext';

export default function WorkerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
      fetchApplications();
    }
  }, [user]);

 
 
  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open');

    if (!error && data) {
      setJobs(data);
    }
  };

  const fetchApplications = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('worker_id', user.id);

    if (!error && data) {
      setApplications(data);
    }
  };

  const applyForJob = async (jobId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('applications')
      .insert([{
        job_id: jobId,
        worker_id: user.id,
        status: 'pending'
      }]);

    if (!error) {
      fetchApplications();
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

    function withdrawApplication(id: string): void {
        throw new Error('Function not implemented.');
    }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Worker Dashboard</h1>
      
      {/* Job Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Available Jobs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
            <p className="text-gray-600 mb-2">{job.location}</p>
            <p className="text-primary font-medium mb-4">{job.salary_range}</p>
            <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
            <button
              onClick={() => job.id && applyForJob(job.id)}
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
              disabled={applications.some(app => app.job_id === job.id)}
            >
              {applications.some(app => app.job_id === job.id) ? 'Applied' : 'Apply Now'}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">My Applications</h2>
        <div className="grid gap-4">
          {applications.map(application => (
            <div key={application.id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{jobs.find(j => j.id === application.job_id)?.title}</h3>
                  <p className={`text-sm ${
                    application.status === 'accepted' ? 'text-green-600' :
                    application.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Status: {application.status}
                  </p>
                </div>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => application.id && withdrawApplication(application.id)}
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}