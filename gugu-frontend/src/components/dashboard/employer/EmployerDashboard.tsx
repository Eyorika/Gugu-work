import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost } from '../../../lib/types';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    salary: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', (await supabase.auth.getUser()).data.user?.id);

    if (!error) setJobs(data || []);
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        ...newJob,
        employer_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'open'
      }]);

    if (!error) {
      setJobs([...jobs, ...(data || [])]);
      setNewJob({ title: '', description: '', location: '', salary: '' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Employer Dashboard</h1>
      
      {/* Create Job Form */}
      <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Post New Job</h2>
        <form onSubmit={createJob} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Job Title"
            value={newJob.title}
            onChange={(e) => setNewJob({...newJob, title: e.target.value})}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={newJob.location}
            onChange={(e) => setNewJob({...newJob, location: e.target.value})}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Salary Range"
            value={newJob.salary}
            onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
            className="p-2 border rounded"
            required
          />
          <textarea
            placeholder="Job Description"
            value={newJob.description}
            onChange={(e) => setNewJob({...newJob, description: e.target.value})}
            className="p-2 border rounded col-span-2"
            rows={4}
            required
          />
          <button
            type="submit"
            className="col-span-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
          >
            Post Job
          </button>
        </form>
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