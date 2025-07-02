import React from 'react';
import { useResponsive, useDeviceType, useOrientation } from '../hooks/use-mobile';
import { Monitor, Smartphone, Tablet, RotateCcw } from 'lucide-react';

/**
 * مكون لعرض معلومات الجهاز (للتطوير فقط)
 */
function DeviceInfo({ show = false }) {
  const responsive = useResponsive();
  const deviceType = useDeviceType();
  const orientation = useOrientation();

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getDeviceIcon = () => {
    if (responsive.isMobile) return Smartphone;
    if (responsive.isTablet) return Tablet;
    return Monitor;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#4CAF50'
      }}>
        <DeviceIcon size={16} />
        Device Info
      </div>
      
      <div style={{ display: 'grid', gap: '4px' }}>
        <div>
          <strong>Screen:</strong> {responsive.screenSize}
        </div>
        <div>
          <strong>Device:</strong> {deviceType.type}
        </div>
        <div>
          <strong>Size:</strong> {responsive.width}×{responsive.height}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RotateCcw size={12} />
          <strong>Orient:</strong> {orientation}
        </div>
        
        <div style={{ 
          marginTop: '8px', 
          paddingTop: '8px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '11px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div>Mobile: {responsive.isMobile ? '✅' : '❌'}</div>
            <div>Tablet: {responsive.isTablet ? '✅' : '❌'}</div>
            <div>Small: {responsive.isSmallMobile ? '✅' : '❌'}</div>
            <div>Tiny: {responsive.isVerySmallMobile ? '✅' : '❌'}</div>
            <div>Touch: {deviceType.isTouchDevice ? '✅' : '❌'}</div>
            <div>iOS: {deviceType.isIOS ? '✅' : '❌'}</div>
          </div>
        </div>

        {deviceType.isAndroid && (
          <div style={{ 
            marginTop: '4px', 
            color: '#81C784',
            fontSize: '11px'
          }}>
            🤖 Android Device
          </div>
        )}

        {deviceType.isIOS && (
          <div style={{ 
            marginTop: '4px', 
            color: '#81C784',
            fontSize: '11px'
          }}>
            🍎 iOS Device
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * مكون لعرض إحصائيات الأداء
 */
export function PerformanceInfo({ show = false }) {
  const [stats, setStats] = React.useState({
    memory: 0,
    timing: 0
  });

  React.useEffect(() => {
    if (!show || process.env.NODE_ENV !== 'development') return;

    const updateStats = () => {
      // معلومات الذاكرة (إذا كانت متاحة)
      if (performance.memory) {
        setStats(prev => ({
          ...prev,
          memory: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // معلومات التوقيت
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setStats(prev => ({
          ...prev,
          timing: loadTime
        }));
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '150px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ 
        fontWeight: 'bold',
        color: '#FF9800',
        marginBottom: '8px'
      }}>
        ⚡ Performance
      </div>
      
      <div style={{ display: 'grid', gap: '4px' }}>
        {stats.memory > 0 && (
          <div>
            <strong>Memory:</strong> {stats.memory}MB
          </div>
        )}
        {stats.timing > 0 && (
          <div>
            <strong>Load:</strong> {stats.timing}ms
          </div>
        )}
        <div>
          <strong>FPS:</strong> 60
        </div>
      </div>
    </div>
  );
}

/**
 * مكون لعرض معلومات الشبكة
 */
export function NetworkInfo({ show = false }) {
  const [networkInfo, setNetworkInfo] = React.useState({
    online: navigator.onLine,
    connection: null
  });

  React.useEffect(() => {
    if (!show || process.env.NODE_ENV !== 'development') return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        online: navigator.onLine,
        connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
      });
    };

    updateNetworkInfo();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, [show]);

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '150px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ 
        fontWeight: 'bold',
        color: networkInfo.online ? '#4CAF50' : '#F44336',
        marginBottom: '8px'
      }}>
        🌐 Network
      </div>
      
      <div style={{ display: 'grid', gap: '4px' }}>
        <div>
          <strong>Status:</strong> {networkInfo.online ? 'Online' : 'Offline'}
        </div>
        {networkInfo.connection && (
          <>
            <div>
              <strong>Type:</strong> {networkInfo.connection.effectiveType || 'Unknown'}
            </div>
            {networkInfo.connection.downlink && (
              <div>
                <strong>Speed:</strong> {networkInfo.connection.downlink}Mbps
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DeviceInfo;
