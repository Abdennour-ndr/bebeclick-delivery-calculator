import React from 'react';
import { Spinner } from './AdvancedLoading';

const AdvancedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  glow = false,
  className = '',
  onClick,
  ...props
}) => {
  // Variants de base
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variants de couleur
  const variantClasses = {
    primary: gradient 
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-lg hover:shadow-xl'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
    
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300',
    
    success: gradient
      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg hover:shadow-xl'
      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    
    danger: gradient
      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-lg hover:shadow-xl'
      : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    
    warning: gradient
      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 focus:ring-yellow-500 shadow-lg hover:shadow-xl'
      : 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 shadow-sm hover:shadow-md',
    
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
    
    glass: 'bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 text-gray-800 hover:bg-opacity-30'
  };

  // Tailles
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  // Effets spéciaux
  const effectClasses = {
    glow: glow ? 'hover:shadow-2xl hover:shadow-blue-500/25' : '',
    lift: 'hover:-translate-y-1',
    scale: 'hover:scale-105 active:scale-95'
  };

  // Classes finales
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    glow ? effectClasses.glow : '',
    'hover:-translate-y-0.5',
    loading ? 'cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  // Taille de l'icône selon la taille du bouton
  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  };

  const iconSize = iconSizes[size];

  const handleClick = (e) => {
    if (loading || disabled) return;
    onClick && onClick(e);
  };

  return (
    <button
      className={buttonClasses}
      disabled={loading || disabled}
      onClick={handleClick}
      {...props}
    >
      {/* Icône à gauche */}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon size={iconSize} />
      )}
      
      {/* Spinner de chargement */}
      {loading && (
        <Spinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} color="white" />
      )}
      
      {/* Contenu du bouton */}
      <span className={loading ? 'opacity-75' : ''}>
        {children}
      </span>
      
      {/* Icône à droite */}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon size={iconSize} />
      )}
    </button>
  );
};

// Bouton avec effet de brillance
export const GlowButton = ({ children, ...props }) => (
  <AdvancedButton 
    {...props} 
    glow={true}
    gradient={true}
    className="relative overflow-hidden group"
  >
    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></span>
    {children}
  </AdvancedButton>
);

// Bouton avec effet de verre
export const GlassButton = ({ children, ...props }) => (
  <AdvancedButton 
    {...props} 
    variant="glass"
    className="backdrop-blur-lg"
  >
    {children}
  </AdvancedButton>
);

// Bouton flottant (FAB)
export const FloatingButton = ({ 
  children, 
  position = 'bottom-right',
  size = 'lg',
  ...props 
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <AdvancedButton
      {...props}
      size={size}
      gradient={true}
      glow={true}
      className={`${positionClasses[position]} rounded-full shadow-2xl z-50 ${props.className || ''}`}
    >
      {children}
    </AdvancedButton>
  );
};

// Groupe de boutons
export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal',
  className = '' 
}) => {
  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col'
  };

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let additionalClasses = '';
          
          if (orientation === 'horizontal') {
            if (!isFirst && !isLast) {
              additionalClasses = 'rounded-none border-l-0';
            } else if (isFirst) {
              additionalClasses = 'rounded-r-none';
            } else if (isLast) {
              additionalClasses = 'rounded-l-none border-l-0';
            }
          } else {
            if (!isFirst && !isLast) {
              additionalClasses = 'rounded-none border-t-0';
            } else if (isFirst) {
              additionalClasses = 'rounded-b-none';
            } else if (isLast) {
              additionalClasses = 'rounded-t-none border-t-0';
            }
          }

          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${additionalClasses}`.trim()
          });
        }
        return child;
      })}
    </div>
  );
};

// Bouton avec badge
export const BadgeButton = ({ 
  children, 
  badge, 
  badgeColor = 'red',
  ...props 
}) => {
  const badgeColors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="relative inline-flex">
      <AdvancedButton {...props}>
        {children}
      </AdvancedButton>
      {badge && (
        <span className={`
          absolute -top-2 -right-2 inline-flex items-center justify-center 
          px-2 py-1 text-xs font-bold leading-none text-white 
          ${badgeColors[badgeColor]} rounded-full
        `}>
          {badge}
        </span>
      )}
    </div>
  );
};

export default AdvancedButton;
