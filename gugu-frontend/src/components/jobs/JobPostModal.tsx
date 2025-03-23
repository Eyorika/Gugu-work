import { useEffect, useState } from 'react';
import { JobPost } from '../../lib/types';
import JobPostForm from './JobPostForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job?: JobPost | null;
  onPost: () => void;
}

export default function JobPostModal({ isOpen, onClose, job, onPost }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Add a small delay before fully removing the modal from DOM to allow for animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform ${isOpen ? 'scale-100' : 'scale-95'} transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-between items-center bg-white p-4 border-b z-10">
          <h2 className="text-xl font-semibold">
            {job?.id ? 'Edit Job' : 'Create New Job'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <JobPostForm 
            job={job}
            onPost={() => {
              onPost();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}