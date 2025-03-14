import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { JobPost } from '../../lib/types';

interface Props {
    job?: JobPost | null;
    onPost: () => void;
    onCancel: () => void;
}

export default function JobPostForm({ job, onPost, onCancel }: Props) {
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        salary: ''
    });

    useEffect(() => {
        if (job) {
            setFormData({
                title: job.title || '',
                description: job.description || '',
                location: job.location || '',
                salary: job.salary || ''
            });
        }
    }, [job]);

    const validateForm = () => {
        const requiredFields = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            location: formData.location.trim()
        };

        if (!requiredFields.title) {
            setError('Job title is required');
            return false;
        }
        if (!requiredFields.description) {
            setError('Job description is required');
            return false;
        }
        if (!requiredFields.location) {
            setError('Job location is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validateForm()) return;

        try {
            if (!user?.id) {
                setError('Authentication required!');
                return;
            }

            const { error: submitError } = await supabase
                .from('jobs')
                .upsert({
                    ...(job?.id && { id: job.id }),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    location: formData.location.trim(),
                    salary: formData.salary.trim(),
                    employer_id: user.id,
                    status: 'open',
                    updated_at: new Date().toISOString()
                });

            if (submitError) throw submitError;

            onPost();

            if (!job?.id) {
                setFormData({ title: '', description: '', location: '', salary: '' });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save job post');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Job Title *"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={3}
                />
                <input
                    type="text"
                    placeholder="Location *"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={3}
                />
                <input
                    type="text"
                    placeholder="Salary Range"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <textarea
                    placeholder="Job Description *"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="p-2 border rounded col-span-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={4}
                    required
                    minLength={20}
                />
                <div className="col-span-2 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                    >
                        {job?.id ? 'Update Job' : 'Post Job'}
                    </button>
                </div>
            </div>
        </form>
    );
}