import React, { useEffect } from 'react';
import { useResponsive, useDeviceType } from '../hooks/use-mobile';

/**
 * مكون لتحسينات الهواتف التلقائية
 */
function MobileOptimizations({ children }) {
  const responsive = useResponsive();
  const deviceType = useDeviceType();

  useEffect(() => {
    // تحسينات للهواتف
    if (responsive.isMobile) {
      // منع التكبير عند التركيز على الحقول
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }

      // إضافة فئات CSS للجسم
      document.body.classList.add('mobile-device');
      
      if (responsive.isSmallMobile) {
        document.body.classList.add('small-mobile');
      }
      
      if (responsive.isVerySmallMobile) {
        document.body.classList.add('very-small-mobile');
      }
    }

    // تحسينات للأجهزة اللمسية
    if (deviceType.isTouchDevice) {
      document.body.classList.add('touch-device');
    }

    // تحسينات لـ iOS
    if (deviceType.isIOS) {
      document.body.classList.add('ios-device');
      
      // إصلاح مشكلة الارتفاع في Safari
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);
      
      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }

    // تحسينات لـ Android
    if (deviceType.isAndroid) {
      document.body.classList.add('android-device');
    }

    // تنظيف الفئات عند إلغاء التحميل
    return () => {
      document.body.classList.remove(
        'mobile-device', 
        'small-mobile', 
        'very-small-mobile',
        'touch-device',
        'ios-device',
        'android-device'
      );
    };
  }, [responsive, deviceType]);

  // تحسين الأداء للهواتف
  useEffect(() => {
    if (responsive.isMobile) {
      // تقليل الرسوم المتحركة على الهواتف البطيئة
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        document.body.classList.add('reduced-motion');
      }

      // تحسين التمرير
      document.body.style.overscrollBehavior = 'contain';
      
      // تحسين اللمس
      document.body.style.touchAction = 'manipulation';
    }
  }, [responsive.isMobile]);

  return children;
}

/**
 * مكون لتحسين الحقول على الهواتف
 */
export function MobileInputEnhancer({ children, type = 'text' }) {
  const responsive = useResponsive();
  const deviceType = useDeviceType();

  if (!responsive.isMobile) {
    return children;
  }

  // تحسينات خاصة بنوع الحقل
  const getInputMode = () => {
    switch (type) {
      case 'number':
      case 'tel':
        return 'numeric';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'search':
        return 'search';
      default:
        return 'text';
    }
  };

  const getAutoComplete = () => {
    switch (type) {
      case 'tel':
        return 'tel';
      case 'email':
        return 'email';
      case 'address':
        return 'street-address';
      default:
        return 'off';
    }
  };

  return React.cloneElement(children, {
    inputMode: getInputMode(),
    autoComplete: getAutoComplete(),
    autoCapitalize: type === 'email' || type === 'url' ? 'none' : 'sentences',
    autoCorrect: type === 'email' || type === 'url' ? 'off' : 'on',
    spellCheck: type === 'email' || type === 'url' || type === 'number' ? 'false' : 'true',
    ...(deviceType.isIOS && { 
      style: { 
        ...children.props.style,
        fontSize: '16px' // منع التكبير في iOS
      }
    })
  });
}

/**
 * مكون لتحسين الأزرار على الهواتف
 */
export function MobileButtonEnhancer({ children, haptic = false }) {
  const responsive = useResponsive();
  const deviceType = useDeviceType();

  const handleClick = (originalOnClick) => (event) => {
    // إضافة ردود فعل لمسية (إذا كانت متاحة)
    if (haptic && deviceType.isTouchDevice && navigator.vibrate) {
      navigator.vibrate(10); // اهتزاز خفيف
    }

    // تشغيل الحدث الأصلي
    if (originalOnClick) {
      originalOnClick(event);
    }
  };

  if (!responsive.isMobile) {
    return children;
  }

  return React.cloneElement(children, {
    onClick: handleClick(children.props.onClick),
    style: {
      ...children.props.style,
      minHeight: '44px', // الحد الأدنى للمس
      minWidth: '44px',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }
  });
}

/**
 * مكون لتحسين التمرير على الهواتف
 */
export function MobileScrollEnhancer({ children, momentum = true, bounce = false }) {
  const responsive = useResponsive();

  if (!responsive.isMobile) {
    return children;
  }

  const scrollStyle = {
    WebkitOverflowScrolling: momentum ? 'touch' : 'auto',
    overscrollBehavior: bounce ? 'auto' : 'contain',
    scrollBehavior: 'smooth'
  };

  return React.cloneElement(children, {
    style: {
      ...children.props.style,
      ...scrollStyle
    }
  });
}

/**
 * مكون لتحسين الصور على الهواتف
 */
export function MobileImageEnhancer({ 
  children, 
  lazy = true, 
  quality = 'auto',
  placeholder = true 
}) {
  const responsive = useResponsive();
  const [loaded, setLoaded] = React.useState(false);

  if (!responsive.isMobile) {
    return children;
  }

  const handleLoad = () => {
    setLoaded(true);
  };

  const imageProps = {
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
    onLoad: handleLoad,
    style: {
      ...children.props.style,
      transition: 'opacity 0.3s ease',
      opacity: loaded || !placeholder ? 1 : 0.5
    }
  };

  // إضافة placeholder للصور غير المحملة
  if (placeholder && !loaded) {
    return (
      <div style={{ 
        position: 'relative',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        {React.cloneElement(children, imageProps)}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#999',
          fontSize: '12px'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return React.cloneElement(children, imageProps);
}

/**
 * Hook لتحسين الأداء على الهواتف
 */
export function useMobilePerformance() {
  const responsive = useResponsive();
  const deviceType = useDeviceType();

  const [performanceMode, setPerformanceMode] = React.useState('normal');

  React.useEffect(() => {
    if (responsive.isMobile) {
      // تحديد وضع الأداء بناءً على الجهاز
      if (responsive.isVerySmallMobile || deviceType.type === 'android') {
        setPerformanceMode('low');
      } else if (responsive.isSmallMobile) {
        setPerformanceMode('medium');
      } else {
        setPerformanceMode('normal');
      }
    }
  }, [responsive, deviceType]);

  return {
    performanceMode,
    shouldReduceAnimations: performanceMode === 'low',
    shouldOptimizeImages: responsive.isMobile,
    shouldLazyLoad: responsive.isMobile,
    maxConcurrentRequests: performanceMode === 'low' ? 2 : 4
  };
}

export default MobileOptimizations;
