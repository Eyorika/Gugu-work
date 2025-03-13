import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function JobPostForm({ onPost }: { onPost: () => void }) {
  const { user } = useAuth();
  const [job, setJob] = useState({
    title: '',
    description: '',
    location: '',
    salary: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    const { error } = await supabase
      .from('jobs')
      .insert([{
        ...job,
        employer_id: user.id,
        status: 'open'
      }]);

    if (!error) {
      onPost();
      setJob({ title: '', description: '', location: '', salary: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Job Title"
        value={job.title}
        onChange={(e) => setJob({...job, title: e.target.value})}
        className="p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Location"
        value={job.location}
        onChange={(e) => setJob({...job, location: e.target.value})}
        className="p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Salary Range"
        value={job.salary}
        onChange={(e) => setJob({...job, salary: e.target.value})}
        className="p-2 border rounded"
        required
      />
      <textarea
        placeholder="Job Description"
        value={job.description}
        onChange={(e) => setJob({...job, description: e.target.value})}
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
  );
}