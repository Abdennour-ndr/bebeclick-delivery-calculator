import React, { useState, useEffect } from 'react';
import { getRateLimiterStats, logRateLimiterStats, resetRateLimiter } from '../services/apiRateLimiter';

function APIRateLimiterMonitor() {
  const [stats, setStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    updateStats();
    
    if (autoRefresh) {
      const interval = setInterval(updateStats, 1000); // Mise à jour chaque seconde
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const updateStats = () => {
    const currentStats = getRateLimiterStats();
    setStats(currentStats);
  };

  const handleLogStats = () => {
    logRateLimiterStats();
  };

  const handleReset = () => {
    if (confirm('Réinitialiser les compteurs du rate limiter ?')) {
      resetRateLimiter();
      updateStats();
    }
  };

  if (!stats) {
    return <div>Chargement des statistiques...</div>;
  }

  const getStatusColor = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return '#f44336'; // Rouge
    if (percentage >= 70) return '#ff9800'; // Orange
    return '#4CAF50'; // Vert
  };

  return (
    <div className="api-rate-limiter-monitor">
      <div className="monitor-header">
        <h3>🛡️ Moniteur Rate Limiter API</h3>
        <div className="monitor-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={updateStats} className="refresh-button">
            🔄 Actualiser
          </button>
          <button onClick={handleLogStats} className="log-button">
            📊 Log Stats
          </button>
          <button onClick={handleReset} className="reset-button">
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Statistiques par seconde */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>Par Seconde</h4>
            <span className="stat-limit">Limite: {stats.perSecond.limit}</span>
          </div>
          <div className="stat-content">
            <div className="stat-number" style={{ color: getStatusColor(stats.perSecond.current, stats.perSecond.limit) }}>
              {stats.perSecond.current}
            </div>
            <div className="stat-bar">
              <div 
                className="stat-fill"
                style={{ 
                  width: `${(stats.perSecond.current / stats.perSecond.limit) * 100}%`,
                  backgroundColor: getStatusColor(stats.perSecond.current, stats.perSecond.limit)
                }}
              ></div>
            </div>
            <div className="stat-remaining">
              Restant: {stats.perSecond.remaining}
            </div>
          </div>
        </div>

        {/* Statistiques par minute */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>Par Minute</h4>
            <span className="stat-limit">Limite: {stats.perMinute.limit}</span>
          </div>
          <div className="stat-content">
            <div className="stat-number" style={{ color: getStatusColor(stats.perMinute.current, stats.perMinute.limit) }}>
              {stats.perMinute.current}
            </div>
            <div className="stat-bar">
              <div 
                className="stat-fill"
                style={{ 
                  width: `${(stats.perMinute.current / stats.perMinute.limit) * 100}%`,
                  backgroundColor: getStatusColor(stats.perMinute.current, stats.perMinute.limit)
                }}
              ></div>
            </div>
            <div className="stat-remaining">
              Restant: {stats.perMinute.remaining}
            </div>
          </div>
        </div>

        {/* Queue des requêtes */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>Queue</h4>
            <span className="stat-limit">En attente</span>
          </div>
          <div className="stat-content">
            <div className="stat-number" style={{ color: stats.queueLength > 0 ? '#ff9800' : '#4CAF50' }}>
              {stats.queueLength}
            </div>
            <div className="stat-status">
              {stats.isProcessing ? (
                <span className="processing">🔄 En traitement</span>
              ) : (
                <span className="idle">⏸️ Inactif</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {stats.perSecond.current >= stats.perSecond.limit * 0.9 && (
        <div className="alert alert-warning">
          ⚠️ Limite par seconde presque atteinte!
        </div>
      )}
      
      {stats.perMinute.current >= stats.perMinute.limit * 0.9 && (
        <div className="alert alert-warning">
          ⚠️ Limite par minute presque atteinte!
        </div>
      )}

      {stats.queueLength > 5 && (
        <div className="alert alert-info">
          ℹ️ Queue importante: {stats.queueLength} requêtes en attente
        </div>
      )}

      {/* Informations */}
      <div className="info-section">
        <h4>ℹ️ Informations</h4>
        <ul>
          <li><strong>Limite par seconde:</strong> {stats.perSecond.limit} requêtes</li>
          <li><strong>Limite par minute:</strong> {stats.perMinute.limit} requêtes</li>
          <li><strong>Protection:</strong> Les requêtes sont automatiquement mises en queue si les limites sont dépassées</li>
          <li><strong>Sécurité:</strong> Limites plus strictes que Google (5/sec, 50/min) pour éviter les erreurs</li>
        </ul>
      </div>

      <style jsx>{`
        .api-rate-limiter-monitor {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 20px 0;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .monitor-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .monitor-controls button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-button {
          background: #4CAF50;
          color: white;
        }

        .log-button {
          background: #2196F3;
          color: white;
        }

        .reset-button {
          background: #ff9800;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .stat-header h4 {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .stat-limit {
          font-size: 11px;
          color: #666;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
        }

        .stat-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .stat-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .stat-remaining {
          font-size: 12px;
          color: #666;
          text-align: center;
        }

        .stat-status {
          text-align: center;
          font-size: 12px;
          margin-top: 5px;
        }

        .processing {
          color: #ff9800;
        }

        .idle {
          color: #4CAF50;
        }

        .alert {
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .alert-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .alert-info {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
        }

        .info-section {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #2196F3;
        }

        .info-section h4 {
          margin: 0 0 10px 0;
          color: #1976d2;
        }

        .info-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .info-section li {
          margin-bottom: 5px;
          font-size: 13px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .monitor-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default APIRateLimiterMonitor;
