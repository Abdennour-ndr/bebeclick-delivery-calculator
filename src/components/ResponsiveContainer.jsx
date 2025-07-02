import React from 'react';
import { useResponsive, useDeviceType, useOrientation } from '../hooks/use-mobile';

/**
 * مكون حاوي متجاوب يتكيف مع جميع أحجام الشاشات
 */
function ResponsiveContainer({ children, className = '', ...props }) {
  const responsive = useResponsive();
  const deviceType = useDeviceType();
  const orientation = useOrientation();

  // إنشاء classes CSS ديناميكية
  const responsiveClasses = [
    className,
    `screen-${responsive.screenSize}`,
    `device-${deviceType.type}`,
    `orientation-${orientation}`,
    responsive.isMobile ? 'is-mobile' : 'is-desktop',
    responsive.isTablet ? 'is-tablet' : '',
    responsive.isSmallMobile ? 'is-small-mobile' : '',
    responsive.isVerySmallMobile ? 'is-very-small-mobile' : '',
    deviceType.isTouchDevice ? 'is-touch' : 'is-no-touch',
    deviceType.isIOS ? 'is-ios' : '',
    deviceType.isAndroid ? 'is-android' : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={responsiveClasses}
      data-screen-size={responsive.screenSize}
      data-device-type={deviceType.type}
      data-orientation={orientation}
      data-width={responsive.width}
      data-height={responsive.height}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * مكون للعرض الشرطي حسب حجم الشاشة
 */
export function ShowOn({ mobile, tablet, desktop, smallMobile, verySmallMobile, children }) {
  const responsive = useResponsive();

  const shouldShow = (
    (mobile && responsive.isMobile) ||
    (tablet && responsive.isTablet) ||
    (desktop && responsive.isDesktop) ||
    (smallMobile && responsive.isSmallMobile) ||
    (verySmallMobile && responsive.isVerySmallMobile)
  );

  return shouldShow ? children : null;
}

/**
 * مكون للإخفاء الشرطي حسب حجم الشاشة
 */
export function HideOn({ mobile, tablet, desktop, smallMobile, verySmallMobile, children }) {
  const responsive = useResponsive();

  const shouldHide = (
    (mobile && responsive.isMobile) ||
    (tablet && responsive.isTablet) ||
    (desktop && responsive.isDesktop) ||
    (smallMobile && responsive.isSmallMobile) ||
    (verySmallMobile && responsive.isVerySmallMobile)
  );

  return !shouldHide ? children : null;
}

/**
 * مكون للنص المتجاوب
 */
export function ResponsiveText({ 
  desktop, 
  tablet, 
  mobile, 
  smallMobile, 
  verySmallMobile, 
  className = '',
  ...props 
}) {
  const responsive = useResponsive();

  let text = desktop; // النص الافتراضي

  if (responsive.isVerySmallMobile && verySmallMobile) {
    text = verySmallMobile;
  } else if (responsive.isSmallMobile && smallMobile) {
    text = smallMobile;
  } else if (responsive.isMobile && mobile) {
    text = mobile;
  } else if (responsive.isTablet && tablet) {
    text = tablet;
  }

  return (
    <span className={className} {...props}>
      {text}
    </span>
  );
}

/**
 * مكون للأيقونات المتجاوبة
 */
export function ResponsiveIcon({ 
  icon: Icon, 
  desktopSize = 24, 
  tabletSize = 20, 
  mobileSize = 18, 
  smallMobileSize = 16,
  className = '',
  ...props 
}) {
  const responsive = useResponsive();

  let size = desktopSize;

  if (responsive.isVerySmallMobile || responsive.isSmallMobile) {
    size = smallMobileSize;
  } else if (responsive.isMobile) {
    size = mobileSize;
  } else if (responsive.isTablet) {
    size = tabletSize;
  }

  return (
    <Icon 
      size={size} 
      className={`responsive-icon ${className}`}
      {...props}
    />
  );
}

/**
 * مكون للشبكة المتجاوبة
 */
export function ResponsiveGrid({ 
  desktopCols = 3, 
  tabletCols = 2, 
  mobileCols = 1, 
  gap = '1rem',
  className = '',
  children,
  ...props 
}) {
  const responsive = useResponsive();

  let cols = desktopCols;

  if (responsive.isMobile) {
    cols = mobileCols;
  } else if (responsive.isTablet) {
    cols = tabletCols;
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: gap,
  };

  return (
    <div 
      className={`responsive-grid ${className}`}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * مكون للمسافات المتجاوبة
 */
export function ResponsiveSpacing({ 
  desktop = '2rem', 
  tablet = '1.5rem', 
  mobile = '1rem', 
  smallMobile = '0.75rem',
  type = 'padding', // 'padding' or 'margin'
  direction = 'all', // 'all', 'top', 'bottom', 'left', 'right', 'x', 'y'
  className = '',
  children,
  ...props 
}) {
  const responsive = useResponsive();

  let spacing = desktop;

  if (responsive.isSmallMobile || responsive.isVerySmallMobile) {
    spacing = smallMobile;
  } else if (responsive.isMobile) {
    spacing = mobile;
  } else if (responsive.isTablet) {
    spacing = tablet;
  }

  const getStyleProperty = () => {
    const prefix = type; // 'padding' or 'margin'
    
    switch (direction) {
      case 'top': return `${prefix}Top`;
      case 'bottom': return `${prefix}Bottom`;
      case 'left': return `${prefix}Left`;
      case 'right': return `${prefix}Right`;
      case 'x': return { [`${prefix}Left`]: spacing, [`${prefix}Right`]: spacing };
      case 'y': return { [`${prefix}Top`]: spacing, [`${prefix}Bottom`]: spacing };
      default: return prefix;
    }
  };

  const styleProperty = getStyleProperty();
  const style = typeof styleProperty === 'string' 
    ? { [styleProperty]: spacing }
    : styleProperty;

  return (
    <div 
      className={`responsive-spacing ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Hook pour obtenir les classes CSS responsives
 */
export function useResponsiveClasses(baseClass = '') {
  const responsive = useResponsive();
  const deviceType = useDeviceType();
  const orientation = useOrientation();

  return [
    baseClass,
    `screen-${responsive.screenSize}`,
    `device-${deviceType.type}`,
    `orientation-${orientation}`,
    responsive.isMobile ? 'mobile' : 'desktop',
    responsive.isTablet ? 'tablet' : '',
    responsive.isSmallMobile ? 'small-mobile' : '',
    responsive.isVerySmallMobile ? 'very-small-mobile' : '',
    deviceType.isTouchDevice ? 'touch' : 'no-touch',
  ].filter(Boolean).join(' ');
}

export default ResponsiveContainer;
