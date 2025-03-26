import { motion } from 'framer-motion';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiDollarSign, FiFilter, FiX, FiCheck } from 'react-icons/fi';

export interface Filters {
  search: string;
  location: string;
  minSalary: string;
  sort: 'newest' | 'oldest';
}

interface JobFiltersProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  className?: string;
  compact?: boolean;
}

const JobFilters = ({ filters, setFilters, className = '', compact = false }: JobFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
    setIsDirty(false);
  }, [filters]);

  useEffect(() => {
    const hasChanges = 
      localFilters.search !== filters.search ||
      localFilters.location !== filters.location ||
      localFilters.minSalary !== filters.minSalary ||
      localFilters.sort !== filters.sort;
    setIsDirty(hasChanges);
  }, [localFilters, filters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(localFilters);
  };

  const handleClear = () => {
    const defaultFilters = {
      search: '',
      location: '',
      minSalary: '',
      sort: 'newest' as const
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-100 p-3 ${className}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={localFilters.search}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-5 transition-all duration-300 hover:shadow-sm ${className} ${compact ? 'w-full' : ''}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Search Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
            <FiSearch className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={localFilters.search}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
            aria-label="Search jobs"
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300 placeholder-gray-400 text-gray-700"
          />
        </div>
        
        {/* Location Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
            <FiMapPin className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="Location"
            value={localFilters.location}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, location: e.target.value }))}
            aria-label="Location"
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300 placeholder-gray-400 text-gray-700"
          />
        </div>
        
        {/* Salary Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
            <FiDollarSign className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          </div>
          <input
            type="number"
            placeholder="Min Salary"
            value={localFilters.minSalary}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, minSalary: e.target.value }))}
            aria-label="Minimum salary"
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300 placeholder-gray-400 text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="0"
          />
        </div>
        
        {/* Sort Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
            <FiFilter className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          </div>
          <select
            value={localFilters.sort}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              sort: e.target.value as 'newest' | 'oldest'
            }))}
            aria-label="Sort order"
            className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300 text-gray-700 appearance-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiAjdjEwMTcyMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1rem"
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Action Buttons */}
      <motion.div 
        className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          type="button"
          onClick={handleClear}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-lg hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2"
        >
          <FiX className="w-4 h-4" />
          Clear
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-xs hover:shadow-sm flex items-center justify-center gap-2 ${
            isDirty 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          disabled={!isDirty}
        >
          <FiCheck className="w-4 h-4" />
          Apply Filters
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default JobFilters;