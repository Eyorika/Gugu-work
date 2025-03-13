import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost } from '../../../lib/types';
import JobPostForm from '../../dashboard/employer/PostJobForm';
export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [] = useState({
    title: '',
    description: '',
    location: '',
    salary: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id);

    if (!error) setJobs(data || []);
  };


  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Employer Dashboard</h1>
      
      {/* Create Job Form */}
      <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-4">Post New Job</h2>
  <JobPostForm onPost={fetchJobs} />
</div>

      {/* Job Listings */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Job Postings</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
              <p className="text-gray-600 mb-2">{job.location}</p>
              <p className="text-primary font-medium mb-4">{job.salary}</p>
              <p className="text-gray-700 mb-4">{job.description}</p>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
                <button className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}