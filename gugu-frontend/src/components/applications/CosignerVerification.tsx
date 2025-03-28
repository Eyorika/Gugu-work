import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ApplicationData {
  id: string;
  job_title: string;
  employer_name: string;
  worker_name: string;
  cosigner_name: string;
  cosigner_email: string;
  created_at: string;
}

const CosignerVerification = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState(1); // 1: Verification, 2: Agreement, 3: Success
  const [agreementPdf, setAgreementPdf] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify the token
      const { data: verificationData, error: verificationError } = await supabase
        .from('cosigner_verifications')
        .select('*')
        .eq('verification_token', token)
        .single();

      if (verificationError) throw verificationError;
      if (!verificationData) throw new Error('Invalid verification token');

      // If already verified
      if (verificationData.verified) {
        setVerified(true);
        setStep(3);
        return;
      }

      // Get application data
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          cosigner_name,
          cosigner_email,
          jobs!job_id(title, employer:profiles!employer_id(company_name)),
          worker:profiles!worker_id(full_name)
        `)
        .eq('id', verificationData.application_id)
        .single();

      if (applicationError) throw applicationError;
      if (!applicationData) throw new Error('Application not found');

      // Format application data
      const formattedData: ApplicationData = {
        id: applicationData.id,
        job_title: applicationData.jobs?.[0]?.title || 'Unknown Job',
        employer_name: applicationData.jobs?.[0]?.employer?.[0]?.company_name || 'Unknown Employer',
        worker_name: applicationData.worker?.[0]?.full_name || 'Unknown Worker',
        cosigner_name: applicationData.cosigner_name || '',
        cosigner_email: applicationData.cosigner_email || '',
        created_at: applicationData.created_at || ''
      };

      setApplicationData(formattedData);
      generateAgreement(formattedData);
    } catch (err) {
      console.error('Error verifying token:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const generateAgreement = (data: ApplicationData) => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just create a simple HTML representation
    const agreementText = `
      <div class="p-6 bg-white rounded-lg">
        <h2 class="text-2xl font-bold mb-4">Job Application Co-signer Agreement</h2>
        <p class="mb-4">This agreement is between:</p>
        <p class="mb-2"><strong>Worker:</strong> ${data.worker_name}</p>
        <p class="mb-4"><strong>Co-signer:</strong> ${data.cosigner_name} (${data.cosigner_email})</p>
        
        <p class="mb-4">For the position of: <strong>${data.job_title}</strong> at <strong>${data.employer_name}</strong></p>
        
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Terms and Conditions:</h3>
          <ol class="list-decimal pl-5 space-y-2">
            <li>As a co-signer, I agree to vouch for the worker's credentials and character.</li>
            <li>I acknowledge I may be contacted by the employer for verification.</li>
            <li>I confirm that I know the worker personally and can attest to their reliability.</li>
            <li>I understand that false information may result in termination of the worker's employment.</li>
          </ol>
        </div>
        
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Co-signer Signature:</h3>
          <div class="h-20 border border-gray-300 rounded-md mb-2"></div>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
    setAgreementPdf(agreementText);
  };



  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token || !applicationData) {
        throw new Error('Missing required information');
      }

      // Update verification record
      const { error: updateError } = await supabase
        .from('cosigner_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('verification_token', token);

      if (updateError) throw updateError;

      // Update application with signature
      if (signature) {
        const { error: applicationError } = await supabase
          .from('applications')
          .update({
            cosigner_verified: true,
            cosigner_verified_at: new Date().toISOString(),
            cosigner_signature_url: signature // In a real implementation, this would be a URL to the stored signature
          })
          .eq('id', applicationData.id);

        if (applicationError) throw applicationError;
      }

      setVerified(true);
      setStep(3);
    } catch (err) {
      console.error('Error verifying application:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify application');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAgreement = () => {
    // In a real implementation, this would download the PDF
    // For now, we'll just show an alert
    alert('PDF download functionality will be implemented in the future.');
  };

  if (loading && step === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full">
        {step === 1 && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verify Co-signer Request</h2>
            {applicationData && (
              <div className="mt-4 text-left">
                <p className="text-gray-600 mb-2"><span className="font-medium">Worker:</span> {applicationData.worker_name}</p>
                <p className="text-gray-600 mb-2"><span className="font-medium">Job:</span> {applicationData.job_title}</p>
                <p className="text-gray-600 mb-2"><span className="font-medium">Employer:</span> {applicationData.employer_name}</p>
                <p className="text-gray-600 mb-2"><span className="font-medium">Application Date:</span> {new Date(applicationData.created_at).toLocaleDateString()}</p>
              </div>
            )}
            <p className="mt-4 text-gray-600">
              You have been requested to be a co-signer for this job application. By proceeding, you agree to verify the applicant's credentials and character.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue to Agreement
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Co-signer Agreement</h2>
            <div className="border border-gray-200 rounded-lg overflow-auto max-h-96 mb-6" dangerouslySetInnerHTML={{ __html: agreementPdf || '' }} />
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
              <div className="border border-gray-300 rounded-md h-40 mb-4 bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500 text-center">Sign here using your mouse or touch screen<br/>(Feature coming soon)</p>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handleDownloadAgreement}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Download Agreement
                </button>
                <button
                  onClick={handleVerify}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {loading ? 'Processing...' : 'Verify & Sign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Complete</h2>
            <p className="mt-2 text-gray-600">
              Thank you for verifying this application. The employer has been notified of your verification.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CosignerVerification;