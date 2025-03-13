import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost } from '../../../lib/types';
<<<<<<< HEAD
import JobPostForm from '../../dashboard/employer/PostJobForm';
export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [] = useState({
=======

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [newJob, setNewJob] = useState({
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
    title: '',
    description: '',
    location: '',
    salary: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
<<<<<<< HEAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id);
=======
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', (await supabase.auth.getUser()).data.user?.id);
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548

    if (!error) setJobs(data || []);
  };

<<<<<<< HEAD
=======
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
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Employer Dashboard</h1>
      
      {/* Create Job Form */}
      <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
<<<<<<< HEAD
  <h2 className="text-xl font-semibold mb-4">Post New Job</h2>
  <JobPostForm onPost={fetchJobs} />
</div>
=======
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
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548

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