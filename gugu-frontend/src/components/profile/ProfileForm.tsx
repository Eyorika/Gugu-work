import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../lib/types';

interface ProfileFormData {
  full_name: string;
  username: string;
  phone: string;
  national_id: string;
  address: string;
  bio: string;
  photo_url?: string;
  company_name?: string;
  tin_number?: string;
  cosigner_email?: string;
  skills?: string[];
  hourly_rate?: number;
}

const ProfileForm = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    username: '',
    phone: '',
    national_id: '',
    address: '',
    bio: '',
    photo_url: '',
    company_name: '',
    tin_number: '',
    cosigner_email: '',
    skills: [],
    hourly_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validationSchema = Yup.object().shape({
    full_name: Yup.string().required('Full name is required'),
    username: Yup.string()
      .required('Username is required')
      .matches(/\.GUGU$/, 'Must end with .GUGU'),
    phone: Yup.string()
      .matches(/^\+251\d{9}$/, 'Invalid Ethiopian phone format')
      .required('Phone number is required'),
    national_id: Yup.string()
      .length(12, 'Must be 12 digits')
      .required('National ID is required'),
    address: Yup.string().required('Address is required'),
    bio: Yup.string().max(200, 'Bio cannot exceed 200 characters'),
    photo_url: Yup.string().nullable(),
    company_name: role === UserRole.Employer 
      ? Yup.string().required('Company name is required')
      : Yup.string().nullable(),
    tin_number: role === UserRole.Employer
      ? Yup.string()
          .length(10, 'TIN must be 10 digits')
          .required('TIN is required')
      : Yup.string().nullable(),
    cosigner_email: role === UserRole.Worker
      ? Yup.string()
          .email('Invalid email format')
          .required('Co-signer email is required')
      : Yup.string().nullable(),
    skills: Yup.array().of(Yup.string()),
    hourly_rate: role === UserRole.Worker
      ? Yup.number()
          .required('Hourly rate is required')
          .min(0, 'Hourly rate must be positive')
      : Yup.number().nullable()
  });

  useEffect(() => {
    console.log('ProfileForm - Component mounted');
    console.log('ProfileForm - User:', user);
    console.log('ProfileForm - Role:', role);
    
    const loadProfile = async () => {
      try {
        console.log('ProfileForm - Loading profile data...');
        if (!user?.id) {
          console.error('ProfileForm - No user ID available');
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('ProfileForm - Error loading profile:', error);
          throw error;
        }

        console.log('ProfileForm - Profile data loaded:', data);
        if (data) {
          const updatedFormData = {
            full_name: data.full_name || '',
            username: data.username || '',
            phone: data.phone || '',
            national_id: data.national_id || '',
            address: data.address || '',
            bio: data.bio || '',
            photo_url: data.photo_url || '',
            company_name: data.company_name || '',
            tin_number: data.tin_number || '',
            cosigner_email: data.cosigner_email || '',
            skills: data.skills || [],
            hourly_rate: data.hourly_rate || 0
          };
          console.log('ProfileForm - Setting form data:', updatedFormData);
          setFormData(updatedFormData);
          calculateProgress(updatedFormData);
        } else {
          console.log('ProfileForm - No existing profile data found');
        }
      } catch (err) {
        console.error('ProfileForm - Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        console.log('ProfileForm - Setting loading to false');
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, role]);

  const calculateProgress = (data: ProfileFormData) => {
    console.log('ProfileForm - Calculating progress...');
    const requiredFields = [
      'full_name', 'username', 'phone', 'national_id', 'address',
      ...(role === UserRole.Employer ? ['company_name', 'tin_number'] : ['cosigner_email'])
    ];
    
    const filled = requiredFields.filter(field => {
      const value = data[field as keyof ProfileFormData];
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      return false;
    }).length;

    const percent = Math.round((filled / requiredFields.length) * 100);
    console.log('ProfileForm - Progress:', percent + '%', { filled, total: requiredFields.length });
    setProgress(percent);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        console.log('ProfileForm - Starting photo upload...');
        setError(null);
        
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image file');
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }

        // First check if there's an existing photo to delete
        if (formData.photo_url) {
            const oldFileName = formData.photo_url.split('/').pop();
            if (oldFileName) {
                console.log('ProfileForm - Removing old photo:', oldFileName);
                const { error: removeError } = await supabase.storage
                    .from('avatars')
                    .remove([oldFileName]);
                
                if (removeError) {
                    console.warn('ProfileForm - Failed to remove old photo:', removeError);
                }
            }
        }

        // Upload new photo
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        console.log('ProfileForm - Uploading new photo:', filePath);
        const { error: uploadError, data: uploadData } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {  
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
    metadata: {
      description: 'User avatar',
      userId: user.id,
      uploadedAt: new Date().toISOString()
    }
  });

        if (uploadError) {
            console.error('ProfileForm - Upload error:', uploadError);
            if (uploadError.message.includes('storage')) {
                throw new Error('Storage service is not properly configured. Please contact support.');
            }
            throw new Error('Failed to upload photo: ' + uploadError.message);
        }

        if (!uploadData) {
            throw new Error('Upload failed without error details');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(uploadData.path);

        if (!urlData?.publicUrl) {
            throw new Error('Failed to get photo URL');
        }

        console.log('ProfileForm - Photo uploaded successfully, URL:', urlData.publicUrl);

        // Update profile with new photo URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                photo_url: urlData.publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('ProfileForm - Profile update error:', updateError);
            throw new Error('Failed to update profile with new photo');
        }

        // Update local state
        setFormData(prev => ({ ...prev, photo_url: urlData.publicUrl }));
        console.log('ProfileForm - Photo upload and profile update complete');
    } catch (err) {
        console.error('ProfileForm - Photo upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload photo');
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    const updatedSkills = [...(formData.skills || [])];
    if (!updatedSkills.includes(newSkill.trim())) {
      updatedSkills.push(newSkill.trim());
      setFormData(prev => ({ ...prev, skills: updatedSkills }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = formData.skills?.filter(skill => skill !== skillToRemove) || [];
    setFormData(prev => ({ ...prev, skills: updatedSkills }));
  };

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    console.log('ProfileForm - Field change:', field, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      calculateProgress(updated);
      return updated;
    });
    validateField(field, value);
  };

  const validateField = (field: keyof ProfileFormData, value: any) => {
    try {
      const fieldSchema = (validationSchema.fields as any)[field];
      if (fieldSchema && typeof fieldSchema.validateSync === 'function') {
        fieldSchema.validateSync(value);
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        setFieldErrors(prev => ({ ...prev, [field]: err.message }));
      }
    }
  };

  const handleSubmit = async () => {
    console.log('ProfileForm - Submitting form...');
    
    if (!user?.id) {
        console.error('ProfileForm - No user ID available for submission');
        setError('User not authenticated');
        return;
    }

    try {
        setSaving(true);
        setError(null);
        
        console.log('ProfileForm - Validating form data...');
        console.log('ProfileForm - Current form data:', formData);
        
        await validationSchema.validate(formData, { abortEarly: false });
        
        console.log('ProfileForm - Saving profile data:', formData);
        const { data, error: saveError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...formData,
                updated_at: new Date().toISOString(),
                completion_percent: progress
            }, { 
                onConflict: 'id'
            });

        if (saveError) {
            console.error('ProfileForm - Save error:', saveError);
            throw saveError;
        }

        console.log('ProfileForm - Profile saved successfully:', data);
        calculateProgress(formData);
        
        // Only navigate after successful save
        navigate(role === UserRole.Employer ? '/employer/profile' : '/worker/profile');
    } catch (err) {
        console.error('ProfileForm - Submit error:', err);
        if (err instanceof Yup.ValidationError) {
            console.log('ProfileForm - Validation errors:', err.inner.map(e => ({
                field: e.path,
                message: e.message
            })));
            const errors: Record<string, string> = {};
            err.inner.forEach(e => {
                if (e.path) errors[e.path] = e.message;
            });
            setFieldErrors(errors);
            setError('Please fix the validation errors');
        } else {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
        }
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-red-600">
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 px-8 py-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-4">Complete Your Profile</h1>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-white font-medium">{progress}%</span>
                </div>
                <p className="text-blue-100 mt-2">
                  {progress < 100 
                    ? 'Complete your profile to increase your visibility'
                    : 'Your profile is complete! 🎉'}
                </p>
              </div>
              <div className="relative">
                {formData.photo_url ? (
                  <img 
                    src={formData.photo_url} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl text-white font-medium">
                      {formData.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Photo Upload Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Photo</h2>
              <div className="text-sm text-gray-500">Recommended: Square image, 400x400px or larger</div>
            </div>
            <div className="flex items-center gap-8">
              <div className="relative group">
                {formData.photo_url ? (
                  <img 
                    src={formData.photo_url} 
                    alt="Profile" 
                    className="w-40 h-40 rounded-2xl object-cover shadow-md group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Change Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Upload a professional photo that clearly shows your face.</p>
                  <p>This helps build trust with potential employers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Information Card */}
          {role === UserRole.Employer ? (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name || ''}
                    onChange={(e) => handleFieldChange('company_name', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.company_name ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="Enter company name"
                  />
                  {fieldErrors.company_name && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.company_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TIN Number
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tin_number || ''}
                    onChange={(e) => handleFieldChange('tin_number', e.target.value)}
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.tin_number ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="Enter TIN number"
                  />
                  {fieldErrors.tin_number && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.tin_number}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Co-signer Email
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.cosigner_email || ''}
                      onChange={(e) => handleFieldChange('cosigner_email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        fieldErrors.cosigner_email ? 'border-red-300 ring-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="Enter co-signer email"
                    />
                    {fieldErrors.cosigner_email && (
                      <p className="mt-2 text-sm text-red-600">{fieldErrors.cosigner_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate ($)
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        value={formData.hourly_rate || ''}
                        onChange={(e) => handleFieldChange('hourly_rate', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className={`w-full pl-8 pr-4 py-3 rounded-xl border ${
                          fieldErrors.hourly_rate ? 'border-red-300 ring-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="0.00"
                      />
                    </div>
                    {fieldErrors.hourly_rate && (
                      <p className="mt-2 text-sm text-red-600">{fieldErrors.hourly_rate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type a skill and press Enter"
                    />
                    <button
                      onClick={handleAddSkill}
                      type="button"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-800 group hover:bg-blue-100 transition-colors"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleFieldChange('full_name', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.full_name ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="Enter your full name"
                  />
                  {fieldErrors.full_name && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.username ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="username.GUGU"
                  />
                  {fieldErrors.username && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.phone ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="+251XXXXXXXXX"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => handleFieldChange('national_id', e.target.value)}
                    maxLength={12}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.national_id ? 'border-red-300 ring-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="Enter national ID"
                  />
                  {fieldErrors.national_id && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.national_id}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.address ? 'border-red-300 ring-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  rows={3}
                  placeholder="Enter your address"
                />
                {fieldErrors.address && (
                  <p className="mt-2 text-sm text-red-600">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  maxLength={200}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.bio ? 'border-red-300 ring-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  rows={4}
                  placeholder="Tell us about yourself"
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {formData.bio.length}/200 characters
                  </p>
                  {fieldErrors.bio && (
                    <p className="text-sm text-red-600">{fieldErrors.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
                type="button"
                onClick={() => navigate(role === UserRole.Employer ? '/employer/profile' : '/worker/profile')}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                disabled={saving}
            >
                Cancel
            </button>
            <button
                onClick={handleSubmit}
                disabled={saving}
                className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                    saving 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
            >
                {saving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;