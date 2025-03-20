import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../lib/types';
import { Link } from 'react-router-dom';

interface ProfileData {
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
  completion_percent: number;
  role: UserRole;
}

const Profile = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  if (loading) return <div className="text-center p-8">Loading profile...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;
  if (!profile) return <div className="p-8">No profile found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Profile Overview</h1>
        <Link
          to={role === UserRole.Employer ? "/employer/profile/edit" : "/worker/profile/edit"}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-3 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${profile.completion_percent}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Profile {profile.completion_percent}% Complete
        </p>
      </div>

      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
          {profile.photo_url ? (
            <img 
              src={profile.photo_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">?</span>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {profile.full_name}
          </h2>
          <p className="text-gray-600">@{profile.username}</p>
          <p className="text-gray-600 mt-2">{profile.bio}</p>
        </div>
      </div>

      {/* Common Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{profile.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{profile.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <IdCardIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">National ID: {profile.national_id}</span>
            </li>
          </ul>
        </div>

        {/* Role-Specific Information */}
        {profile.role === UserRole.Employer ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <BuildingIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{profile.company_name}</span>
              </li>
              <li className="flex items-center gap-2">
                <HashtagIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">TIN: {profile.tin_number}</span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Worker Details</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Co-signer: {profile.cosigner_email}</span>
              </li>
              <li className="flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Hourly Rate: ${profile.hourly_rate}</span>
              </li>
              {profile.skills && (
                <li className="flex items-start gap-2">
                  <SkillIcon className="w-5 h-5 text-gray-600 mt-1" />
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Verification Status */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-6 h-6 text-green-500" />
          <span className="text-gray-700">
            National ID Verified • TIN Verified • Phone Verified
          </span>
        </div>
      </div>
    </div>
  );
};

// Example icon components (replace with actual icons)
const PhoneIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const MapPinIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const IdCardIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const BuildingIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const HashtagIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const EnvelopeIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const CurrencyDollarIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const SkillIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;
const CheckCircleIcon = ({ className }: { className?: string }) => <svg className={className}>...</svg>;

export default Profile;