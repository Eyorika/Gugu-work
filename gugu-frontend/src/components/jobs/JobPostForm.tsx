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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        hourly_rate: '',
        status: 'draft' as 'draft' | 'open' | 'closed'
    });

    useEffect(() => {
        console.log('JobPostForm - Job data received:', job);
        if (job) {
            console.log('JobPostForm - Setting form data from job');
            setFormData({
                title: job.title || '',
                description: job.description || '',
                location: job.location || '',
                hourly_rate: job.hourly_rate?.toString() || '',
                status: job.status || 'draft'
            });
        } else {
            console.log('JobPostForm - No job data, using default form data');
        }
    }, [job]);

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Job title is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Job description is required');
            return false;
        }
        if (!formData.location.trim()) {
            setError('Job location is required');
            return false;
        }
        if (!formData.hourly_rate || isNaN(Number(formData.hourly_rate)) || Number(formData.hourly_rate) <= 0) {
            setError('Valid hourly rate is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            if (!validateForm()) {
                setLoading(false);
                return;
            }

            if (!user?.id) {
                setError('Authentication required!');
                setLoading(false);
                return;
            }

            console.log('JobPostForm - Submitting job data:', {
                ...formData,
                id: job?.id,
                employer_id: user.id
            });

            const { error: submitError } = await supabase
                .from('jobs')
                .upsert({
                    ...(job?.id ? { id: job.id } : {}),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    location: formData.location.trim(),
                    hourly_rate: Number(formData.hourly_rate),
                    employer_id: user.id,
                    status: formData.status,
                    updated_at: new Date().toISOString(),
                    ...(job?.id ? {} : { created_at: new Date().toISOString() })
                });

            if (submitError) throw submitError;

            console.log('JobPostForm - Job saved successfully');
            onPost();

            if (!job?.id) {
                setFormData({
                    title: '',
                    description: '',
                    location: '',
                    hourly_rate: '',
                    status: 'draft'
                });
            }
        } catch (err) {
            console.error('JobPostForm - Error saving job:', err);
            setError(err instanceof Error ? err.message : 'Failed to save job post');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job Title *</label>
                    <input
                        type="text"
                        placeholder="Enter job title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        minLength={3}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location *</label>
                    <input
                        type="text"
                        placeholder="Enter location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        minLength={3}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate (ETB) *</label>
                    <input
                        type="number"
                        placeholder="Enter hourly rate"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'open' | 'closed'})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job Description *</label>
                    <textarea
                        placeholder="Enter detailed job description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={4}
                        required
                        minLength={20}
                    />
                </div>

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
                        disabled={loading}
                    >
                        {job?.id ? 'Update Job' : 'Post Job'}
                    </button>
                </div>
            </div>
        </form>
    );
}