import { Dispatch, SetStateAction } from 'react';

export interface Filters {
  search: string;
  location: string;
  minSalary: string;
  sort: 'newest' | 'oldest';
}

interface JobFiltersProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
}

const JobFilters = ({ filters, setFilters }: JobFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <input
        type="text"
        placeholder="Search jobs..."
        value={filters.search}
        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
      />
      
      <input
        type="text"
        placeholder="Location"
        value={filters.location}
        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
      />
      
      <input
        type="number"
        placeholder="Min Salary"
        value={filters.minSalary}
        onChange={(e) => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        min="0"
      />
      
      <select
        value={filters.sort}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          sort: e.target.value as 'newest' | 'oldest'
        }))}
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  );
};

export default JobFilters;