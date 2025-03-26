import { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification, NotificationType } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { FaEnvelope, FaFileAlt, FaCheckCircle, FaBullhorn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';

interface NotificationsPanelProps {
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <FaEnvelope className="text-blue-500" />;
      case 'application':
        return <FaFileAlt className="text-green-500" />;
      case 'job_match':
        return <FaCheckCircle className="text-purple-500" />;
      case 'system':
      default:
        return <FaBullhorn className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'message' && notification.related_id) {
      navigate(role === UserRole.Employer ? '/employer/messages' : '/worker/messages');
    } else if (notification.type === 'application' && notification.data?.job_id) {
      if (role === UserRole.Employer) {
        navigate(`/employer/jobs/${notification.data.job_id}/applications`);
      } else {
        navigate('/worker/applications');
      }
    } else if (notification.type === 'job_match' && notification.data?.job_id) {
      navigate(`/jobs/${notification.data.job_id}`);
    }

    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-[80vh] flex flex-col">
      <div className="p-3 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-medium text-gray-700">Notifications</h3>
        {notifications.length > 0 && (
          <button 
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-grow">
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-2 border-t bg-gray-50 sticky bottom-0">
        <button 
          onClick={onClose}
          className="w-full py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;