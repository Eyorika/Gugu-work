import { useState, useEffect, useRef } from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp, FaLink, FaTimes } from 'react-icons/fa';

interface ShareOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url?: string; // If not provided, will use current URL
}

const ShareOverlay: React.FC<ShareOverlayProps> = ({
  isOpen,
  onClose,
  title,
  description = 'Check out this job on GUGU Work!',
  url = window.location.href,
}) => {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  const shareData = {
    title,
    text: description,
    url,
  };

  const handleShare = async (platform: string) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedDescription}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedDescription}%20${encodedUrl}`;
        break;
      case 'native':
        try {
          if (navigator.share) {
            await navigator.share(shareData);
            return;
          }
        } catch (error) {
          console.error('Error sharing:', error);
        }
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        ref={overlayRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all animate-scale-in"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Share</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6 line-clamp-2">{description}</p>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button 
            onClick={() => handleShare('facebook')} 
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FaFacebook className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-xs text-gray-600">Facebook</span>
          </button>
          
          <button 
            onClick={() => handleShare('twitter')} 
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FaTwitter className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-xs text-gray-600">Twitter</span>
          </button>
          
          <button 
            onClick={() => handleShare('linkedin')} 
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FaLinkedin className="w-8 h-8 text-blue-700 mb-2" />
            <span className="text-xs text-gray-600">LinkedIn</span>
          </button>
          
          <button 
            onClick={() => handleShare('whatsapp')} 
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FaWhatsapp className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-xs text-gray-600">WhatsApp</span>
          </button>
        </div>
        
        <div className="relative">
          <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
            <input 
              type="text" 
              value={url} 
              readOnly 
              className="flex-grow p-3 bg-transparent text-sm text-gray-600 focus:outline-none"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-primary text-white p-3 hover:bg-primary-dark transition-colors"
            >
              {copied ? 'Copied!' : <FaLink className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {typeof navigator.share === 'function' && (
          <button 
            onClick={() => handleShare('native')} 
            className="w-full mt-4 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Use device sharing
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareOverlay;