import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

const AdvancedNotification = ({ 
  message, 
  type = 'success', 
  duration = 4000, 
  onClose,
  position = 'top-right',
  showProgress = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 50));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 50);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timer);
      };
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-white text-green-800 border-l-green-500 shadow-green-100';
      case 'error':
        return 'bg-white text-red-800 border-l-red-500 shadow-red-100';
      case 'warning':
        return 'bg-white text-yellow-800 border-l-yellow-500 shadow-yellow-100';
      case 'info':
        return 'bg-white text-blue-800 border-l-blue-500 shadow-blue-100';
      default:
        return 'bg-white text-green-800 border-l-green-500 shadow-green-100';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'top-center':
        return 'top-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-6 right-6';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed z-50 max-w-sm w-full mx-4 p-4 rounded-xl shadow-2xl border-l-4 
        ${getTypeClasses()} ${getPositionClasses()}
        ${isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right'}
      `}
      style={{
        animation: isVisible 
          ? 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          : 'slideOutRight 0.3s ease-in'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-5">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <X size={16} />
        </button>
      </div>
      
      {showProgress && duration > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-50 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Hook pour gérer les notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      ...options
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    const duration = options.duration || 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

// Composant conteneur pour afficher toutes les notifications
export const NotificationContainer = ({ notifications, onRemove, position = 'top-right' }) => {
  return (
    <div className="fixed z-50 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            marginBottom: index > 0 ? '12px' : '0'
          }}
        >
          <AdvancedNotification
            {...notification}
            position={position}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AdvancedNotification;
