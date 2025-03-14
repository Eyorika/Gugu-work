import type { JobPost } from '../../lib/types';

interface JobStatsProps {
  jobs: JobPost[];
}

const JobStats = ({ jobs }: { jobs: JobPost[] }) => (
  <div className="grid grid-cols-3 gap-4 mb-8">
    <div className="stats-card">
      <h3>Total Jobs</h3>
      <p>{jobs.length}</p>
    </div>
    <div className="stats-card">
      <h3>Open Positions</h3>
      <p>{jobs.filter(j => j.status === 'open').length}</p>
    </div>
    <div className="stats-card">
      <h3>Total Applications</h3>
      <p>{jobs.reduce((acc, j) => acc + (j.application_count || 0), 0)}</p>
    </div>
  </div>
);

export default JobStats;