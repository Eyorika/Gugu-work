import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { JobPost } from '../../lib/types';
import { JobWithStatus } from '../dashboard/worker/WorkerDashboard';

interface CosignerInfo {
  name: string;
  email: string;
  address: string;
}

interface ApplicationFormData {
  coverletter: string;
  resume: File | null;
  cosigner: CosignerInfo;
  agreement: boolean;
}

interface Props {
  job: JobPost | JobWithStatus;
  onClose: () => void;
  onSubmit: () => void;
}

const ApplicationForm = ({ job, onClose, onSubmit }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    coverletter: '',
    resume: null,
    cosigner: {
      name: '',
      email: '',
      address: ''
    },
    agreement: false
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [agreementPdf, setAgreementPdf] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Application details, 2: Agreement

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfileData(data);
      
      // Pre-fill cosigner email if available
      if (data?.cosigner_email) {
        setFormData(prev => ({
          ...prev,
          cosigner: {
            ...prev.cosigner,
            email: data.cosigner_email
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('cosigner.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        cosigner: {
          ...prev.cosigner,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
      setResumeFileName(file.name);
    }
  };

  const generateAgreement = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just create a simple HTML representation
    const agreementText = `
      <div class="p-6 bg-white rounded-lg">
        <h2 class="text-2xl font-bold mb-4">Job Application Agreement</h2>
        <p class="mb-4">This agreement is between:</p>
        <p class="mb-2"><strong>Worker:</strong> ${profileData?.full_name || 'Worker'}</p>
        <p class="mb-4"><strong>Co-signer:</strong> ${formData.cosigner.name}</p>
        
        <p class="mb-4">For the position of: <strong>${job.title}</strong> at <strong>${job.employer?.company_name || 'Employer'}</strong></p>
        
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Terms and Conditions:</h3>
          <ol class="list-decimal pl-5 space-y-2">
            <li>The co-signer agrees to vouch for the worker's credentials and character.</li>
            <li>The co-signer acknowledges they may be contacted by the employer for verification.</li>
            <li>The worker confirms all information provided in this application is accurate and complete.</li>
            <li>Both parties understand that false information may result in termination of employment.</li>
          </ol>
        </div>
        
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Signatures:</h3>
          <div class="flex flex-col space-y-4">
            <div>
              <p class="font-medium">Worker Signature:</p>
              <div class="h-20 border border-gray-300 rounded-md mb-2"></div>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div>
              <p class="font-medium">Co-signer Signature:</p>
              <div class="h-20 border border-gray-300 rounded-md mb-2"></div>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    setAgreementPdf(agreementText);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('You must be logged in to apply');
      }

      if (!formData.coverletter) {
        throw new Error('Cover letter is required');
      }

      if (!formData.cosigner.name || !formData.cosigner.email || !formData.cosigner.address) {
        throw new Error('All cosigner information is required');
      }

      if (!formData.agreement) {
        throw new Error('You must agree to the terms');
      }

      // Upload resume if provided
      let resumeUrl = null;
      if (formData.resume) {
        const fileExt = formData.resume.name.split('.').pop();
        const filePath = `resumes/${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('applications')
          .upload(filePath, formData.resume, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = supabase.storage
          .from('applications')
          .getPublicUrl(filePath);

        resumeUrl = data.publicUrl;
      }

      // Create application record
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          worker_id: user.id,
          status: 'pending',
          cover_letter: formData.coverletter,
          resume_url: resumeUrl,
          cosigner_name: formData.cosigner.name,
          cosigner_email: formData.cosigner.email,
          cosigner_address: formData.cosigner.address,
          agreement_accepted: formData.agreement,
          created_at: new Date().toISOString()
        });

      if (applicationError) throw applicationError;

      // Send email to cosigner (in a real implementation)
      // This would be handled by a server function
      console.log('Sending email to cosigner:', formData.cosigner.email);

      // Update user profile with cosigner email if it's not already saved
      if (!profileData?.cosigner_email || profileData.cosigner_email !== formData.cosigner.email) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ cosigner_email: formData.cosigner.email })
          .eq('id', user.id);

        if (profileError) console.error('Error updating profile:', profileError);
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderApplicationForm = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="coverletter" className="block text-sm font-medium text-gray-700 mb-1">
          Cover Letter <span className="text-red-500">*</span>
        </label>
        <textarea
          id="coverletter"
          name="coverletter"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Tell the employer why you're a good fit for this position..."
          value={formData.coverletter}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
          Resume (PDF, DOC, DOCX)
        </label>
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span>Upload File</span>
            <input
              type="file"
              id="resume"
              name="resume"
              className="sr-only"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>
          {resumeFileName && (
            <span className="text-sm text-gray-500">{resumeFileName}</span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Co-signer Information</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cosigner.name" className="block text-sm font-medium text-gray-700 mb-1">
              Co-signer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cosigner.name"
              name="cosigner.name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.cosigner.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="cosigner.email" className="block text-sm font-medium text-gray-700 mb-1">
              Co-signer Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="cosigner.email"
              name="cosigner.email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.cosigner.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="cosigner.address" className="block text-sm font-medium text-gray-700 mb-1">
              Co-signer Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cosigner.address"
              name="cosigner.address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formData.cosigner.address}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="agreement"
            name="agreement"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            checked={formData.agreement}
            onChange={handleCheckboxChange}
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="agreement" className="font-medium text-gray-700">
            I agree to the terms and conditions <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500">By checking this box, you agree that all information provided is accurate and that your co-signer will be contacted for verification.</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={generateAgreement}
          disabled={!formData.coverletter || !formData.cosigner.name || !formData.cosigner.email || !formData.cosigner.address || !formData.agreement || loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Continue to Agreement'}
        </button>
      </div>
    </div>
  );

  const renderAgreementView = () => (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg overflow-auto max-h-96" dangerouslySetInnerHTML={{ __html: agreementPdf || '' }} />
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
        <div className="border border-gray-300 rounded-md h-40 mb-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500 text-center">Sign here using your mouse or touch screen<br/>(Feature coming soon)</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? 'Apply for Job' : 'Review & Sign Agreement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Application Submitted!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your application has been submitted successfully. Your co-signer will receive an email notification.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                    1
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Application Details</h3>
                  </div>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                    2
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Review & Sign</h3>
                  </div>
                </div>
                <div className="mt-1 hidden sm:block">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div style={{ width: step === 1 ? '50%' : '100%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.employer?.company_name || 'Company'} • {job.location}</p>
                  <p className="text-sm text-primary font-medium">${job.salary} / hour</p>
                </div>

                {step === 1 ? renderApplicationForm() : renderAgreementView()}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;