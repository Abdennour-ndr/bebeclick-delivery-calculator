import React from 'react';

// Spinner de base
export const Spinner = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-200 border-t-blue-600',
    green: 'border-green-200 border-t-green-600',
    red: 'border-red-200 border-t-red-600',
    purple: 'border-purple-200 border-t-purple-600',
    gray: 'border-gray-200 border-t-gray-600'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-4 rounded-full animate-spin
      `}
    />
  );
};

// Points de chargement
export const LoadingDots = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Vagues de chargement
export const LoadingWave = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-1 h-4',
    md: 'w-2 h-8',
    lg: 'w-3 h-12'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            rounded-sm
          `}
          style={{
            animation: `wave 1.4s ease-in-out infinite both`,
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Anneaux pulsants
export const LoadingPulseRing = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {[0, 1].map((index) => (
        <div
          key={index}
          className={`
            absolute border-4 rounded-full opacity-75
            ${colorClasses[color]}
          `}
          style={{
            animation: `pulse-ring 1s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
            animationDelay: `${index * 0.5}s`
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Loader
export const SkeletonLoader = ({ 
  lines = 3, 
  avatar = false, 
  button = false,
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-start space-x-4">
        {avatar && (
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        )}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`h-4 bg-gray-200 rounded ${
                index === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
          {button && (
            <div className="h-8 w-24 bg-gray-200 rounded mt-4"></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Chargement de page complète
export const FullPageLoading = ({ 
  message = 'Chargement...', 
  type = 'spinner',
  overlay = true 
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots size="lg" />;
      case 'wave':
        return <LoadingWave size="lg" />;
      case 'pulse':
        return <LoadingPulseRing size="lg" />;
      default:
        return <Spinner size="xl" />;
    }
  };

  return (
    <div className={`
      fixed inset-0 z-50 flex flex-col items-center justify-center
      ${overlay ? 'bg-white bg-opacity-90 backdrop-blur-sm' : 'bg-white'}
    `}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          {renderLoader()}
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Chargement de contenu
export const ContentLoading = ({ 
  message = 'Chargement...', 
  type = 'spinner',
  size = 'md',
  className = '' 
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots size={size} />;
      case 'wave':
        return <LoadingWave size={size} />;
      case 'pulse':
        return <LoadingPulseRing size={size} />;
      default:
        return <Spinner size={size} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="mb-4">
        {renderLoader()}
      </div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

// Chargement de bouton
export const ButtonLoading = ({ 
  loading = false, 
  children, 
  type = 'spinner',
  size = 'sm',
  ...props 
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots size={size} color="white" />;
      default:
        return <Spinner size={size} color="white" />;
    }
  };

  return (
    <button 
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${props.className || ''} 
        ${loading ? 'cursor-not-allowed opacity-75' : ''}
        flex items-center justify-center gap-2
      `}
    >
      {loading && renderLoader()}
      {children}
    </button>
  );
};

// CSS pour les animations personnalisées
const LoadingStyles = () => (
  <style jsx>{`
    @keyframes wave {
      0%, 80%, 100% {
        transform: scaleY(0.4);
      }
      40% {
        transform: scaleY(1);
      }
    }

    @keyframes pulse-ring {
      0% {
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      100% {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transform: translate(0, 0);
      }
    }
  `}</style>
);

export default {
  Spinner,
  LoadingDots,
  LoadingWave,
  LoadingPulseRing,
  SkeletonLoader,
  FullPageLoading,
  ContentLoading,
  ButtonLoading,
  LoadingStyles
};
