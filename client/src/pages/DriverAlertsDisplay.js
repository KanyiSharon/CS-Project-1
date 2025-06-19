import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, ChevronLeft, ChevronRight, Filter, X, Search, Info, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverAlertsDisplay = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    alert_type: '',
    severity_level: '',
    location: '',
    active_only: true,
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_alerts: 0,
    has_next: false,
    has_prev: false
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const alertTypes = [
    { value: 'traffic_jam', label: 'Traffic Jam', icon: '🚗' },
    { value: 'accident', label: 'Accident', icon: '⚠️' },
    { value: 'road_closure', label: 'Road Closure', icon: '🚧' },
    { value: 'weather_warning', label: 'Weather Warning', icon: '🌧️' },
    { value: 'police_checkpoint', label: 'Police Checkpoint', icon: '👮' },
    { value: 'route_diversion', label: 'Route Diversion', icon: '↩️' },
    { value: 'other', label: 'Other', icon: '📢' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: '#39ff14' },
    { value: 'medium', label: 'Medium', color: '#ffd700' },
    { value: 'high', label: 'High', color: '#ff6b00' },
    { value: 'critical', label: 'Critical', color: '#ff4444' }
  ];

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      
      if (filters.alert_type) params.append('alert_type', filters.alert_type);
      if (filters.severity_level) params.append('severity_level', filters.severity_level);
      if (filters.location) params.append('location', filters.location);
      params.append('active_only', filters.active_only);
      
      if (searchQuery) params.append('location', searchQuery);

      const response = await fetch(`/api/driver-alerts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/driver-alerts/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alert details');
      }

      const data = await response.json();
      setSelectedAlert(data);
    } catch (err) {
      console.error('Error fetching alert details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setFilters({
      alert_type: '',
      severity_level: '',
      location: '',
      active_only: true,
      page: 1,
      limit: 10
    });
    setSearchQuery('');
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now - then) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  useEffect(() => {
    fetchAlerts();
  }, [filters, searchQuery]);

  // CSS Styles
  const styles = {
     fabButton: {
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#00d4ff',
      color: '#000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)',
      transition: 'all 0.3s ease',
      zIndex: 100,
      border: 'none'
    },
    fabButtonHover: {
      transform: 'scale(1.1)',
      boxShadow: '0 8px 24px rgba(0, 212, 255, 0.5)'
    },
    headerButtons: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0033 0%, #0f0f23 50%, #000000 100%)',
      padding: '24px 16px',
      color: '#e0f7ff',
      fontFamily: 'Monaco, monospace'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(45deg, #00d4ff, #39ff14)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textTransform: 'uppercase',
      letterSpacing: '2px'
    },
    searchContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px'
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      color: '#e0f7ff',
      backdropFilter: 'blur(8px)',
      outline: 'none',
      fontFamily: 'Monaco, monospace'
    },
    filterButton: {
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      color: '#e0f7ff',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontFamily: 'Monaco, monospace'
    },
    filterPanel: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      backdropFilter: 'blur(8px)'
    },
    filterRow: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    filterGroup: {
      flex: 1,
      minWidth: '200px'
    },
    filterLabel: {
      display: 'block',
      fontSize: '0.8rem',
      marginBottom: '8px',
      color: '#00d4ff'
    },
    filterSelect: {
      width: '100%',
      padding: '8px 12px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '4px',
      color: '#e0f7ff',
      fontFamily: 'Monaco, monospace'
    },
    filterCheckbox: {
      marginRight: '8px',
      accentColor: '#00d4ff'
    },
    clearButton: {
      padding: '8px 16px',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      border: '1px solid rgba(255, 68, 68, 0.3)',
      borderRadius: '4px',
      color: '#ff4444',
      cursor: 'pointer',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.8rem'
    },
    alertList: {
      display: 'grid',
      gap: '16px'
    },
    alertCard: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(8px)'
    },
    alertCardCritical: {
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      border: '1px solid rgba(255, 68, 68, 0.5)'
    },
    alertCardHigh: {
      backgroundColor: 'rgba(255, 107, 0, 0.1)',
      border: '1px solid rgba(255, 107, 0, 0.5)'
    },
    alertCardMedium: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      border: '1px solid rgba(255, 215, 0, 0.5)'
    },
    alertCardLow: {
      backgroundColor: 'rgba(57, 255, 20, 0.1)',
      border: '1px solid rgba(57, 255, 20, 0.5)'
    },
    alertHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    alertType: {
      fontSize: '0.8rem',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: 'rgba(0, 212, 255, 0.1)'
    },
    alertSeverity: {
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    alertTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    alertLocation: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      fontSize: '0.9rem',
      color: 'rgba(224, 247, 255, 0.8)'
    },
    alertTime: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.8rem',
      color: 'rgba(224, 247, 255, 0.6)'
    },
    alertFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '12px',
      fontSize: '0.8rem'
    },
    alertPoster: {
      color: '#00d4ff'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '24px'
    },
    pageButton: {
      padding: '8px 16px',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    currentPage: {
      padding: '8px 16px',
      backgroundColor: 'rgba(0, 212, 255, 0.2)',
      borderRadius: '4px'
    },
    alertDetail: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      backdropFilter: 'blur(8px)'
    },
    detailCard: {
      maxWidth: '800px',
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      padding: '24px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    detailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    detailClose: {
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 68, 68, 0.1)'
    },
    detailImage: {
      width: '100%',
      maxHeight: '300px',
      objectFit: 'cover',
      borderRadius: '8px',
      margin: '16px 0'
    },
    detailDescription: {
      margin: '16px 0',
      lineHeight: '1.6'
    },
    detailMeta: {
      display: 'flex',
      gap: '16px',
      marginTop: '16px',
      fontSize: '0.9rem'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(0, 212, 255, 0.3)',
      borderTop: '4px solid #00d4ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    error: {
      padding: '16px',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      border: '1px solid rgba(255, 68, 68, 0.3)',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    emptyState: {
      padding: '40px',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px dashed rgba(0, 212, 255, 0.3)',
      borderRadius: '8px'
    }
  };

  // Animation styles
  const animationStyles = `
    @ @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .alert-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 212, 255, 0.1);
    }
    .fab-hover:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.5);
    }
  `;

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical': return styles.alertCardCritical;
      case 'high': return styles.alertCardHigh;
      case 'medium': return styles.alertCardMedium;
      case 'low': return styles.alertCardLow;
      default: return {};
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff6b00';
      case 'medium': return '#ffd700';
      case 'low': return '#39ff14';
      default: return '#e0f7ff';
    }
  };

  return (
    <div style={styles.container}>
      <style>{animationStyles}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Driver Alerts</h1>
        <button 
          style={styles.filterButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
        {/* Add the FAB button */}
            <button
                style={styles.fabButton}
                className="fab-hover"
                onClick={() => navigate('/driveralertsform')}
                title="Create New Alert"
            >
                <Plus size={24} />
            </button>
      {error && (
        <div style={styles.error}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by location..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showFilters && (
        <div style={styles.filterPanel}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Alert Type</label>
              <select
                name="alert_type"
                value={filters.alert_type}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">All Types</option>
                {alertTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Severity Level</label>
              <select
                name="severity_level"
                value={filters.severity_level}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">All Levels</option>
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.filterRow}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="active_only"
                checked={filters.active_only}
                onChange={handleFilterChange}
                style={styles.filterCheckbox}
              />
              Show only active alerts
            </label>
            
            <button 
              style={styles.clearButton}
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
        </div>
      ) : alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <Info size={32} style={{ marginBottom: '16px', color: '#00d4ff' }} />
          <h3>No alerts found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <>
          <div style={styles.alertList}>
            {alerts.map(alert => (
              <div 
                key={alert.id}
                style={{
                  ...styles.alertCard,
                  ...getSeverityStyle(alert.severity_level),
                }}
                className="alert-hover"
                onClick={() => fetchAlertDetails(alert.id)}
              >
                <div style={styles.alertHeader}>
                  <span style={styles.alertType}>
                    {alertTypes.find(t => t.value === alert.alert_type)?.icon} {alertTypes.find(t => t.value === alert.alert_type)?.label}
                  </span>
                  <span style={{ 
                    ...styles.alertSeverity,
                    color: getSeverityColor(alert.severity_level)
                  }}>
                    {alert.severity_level.toUpperCase()}
                  </span>
                </div>
                
                <h3 style={styles.alertTitle}>{alert.title}</h3>
                
                <div style={styles.alertLocation}>
                  <MapPin size={16} />
                  <span>{alert.location_name}</span>
                </div>
                
                <p style={{ 
                  fontSize: '0.9rem',
                  color: 'rgba(224, 247, 255, 0.7)',
                  marginBottom: '12px'
                }}>
                  {alert.description.length > 100 
                    ? `${alert.description.substring(0, 100)}...` 
                    : alert.description}
                </p>
                
                <div style={styles.alertFooter}>
                  <div style={styles.alertTime}>
                    <Clock size={14} />
                    <span>{getTimeSince(alert.created_at)}</span>
                  </div>
                  <div style={styles.alertPoster}>
                    Posted by: {alert.firstname} {alert.lastname}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={styles.pagination}>
            <button
              style={{
                ...styles.pageButton,
                ...(!pagination.has_prev && styles.pageButtonDisabled)
              }}
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={!pagination.has_prev}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <span style={styles.currentPage}>
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            
            <button
              style={{
                ...styles.pageButton,
                ...(!pagination.has_next && styles.pageButtonDisabled)
              }}
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
      
      {selectedAlert && (
        <div style={styles.alertDetail}>
          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <h2 style={{ 
                ...styles.title, 
                fontSize: '1.5rem',
                margin: 0
              }}>
                {selectedAlert.title}
              </h2>
              <div 
                style={styles.detailClose}
                onClick={() => setSelectedAlert(null)}
              >
                <X size={20} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fontSize: '0.8rem'
              }}>
                {alertTypes.find(t => t.value === selectedAlert.alert_type)?.icon} {alertTypes.find(t => t.value === selectedAlert.alert_type)?.label}
              </span>
              
              <span style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: getSeverityColor(selectedAlert.severity_level)
              }}>
                {selectedAlert.severity_level.toUpperCase()}
              </span>
            </div>
            
            <div style={styles.alertLocation}>
              <MapPin size={18} />
              <span>{selectedAlert.location_name}</span>
            </div>
            
            <div style={styles.alertTime}>
              <Clock size={16} />
              <span>Posted {formatDate(selectedAlert.created_at)}</span>
              {selectedAlert.expiry_time && (
                <>
                  <span>•</span>
                  <span>Expires {formatDate(selectedAlert.expiry_time)}</span>
                </>
              )}
            </div>
            
            {selectedAlert.has_image && (
              <img
                src={`/api/driver-alerts/${selectedAlert.id}/image`}
                alt={selectedAlert.title}
                style={styles.detailImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            
            <div style={styles.detailDescription}>
              {selectedAlert.description}
            </div>
            
            <div style={styles.detailMeta}>
              <div>
                <div style={{ color: '#00d4ff', fontSize: '0.8rem' }}>Posted By</div>
                <div>{selectedAlert.firstname} {selectedAlert.lastname}</div>
              </div>
              
              <div>
                <div style={{ color: '#00d4ff', fontSize: '0.8rem' }}>Username</div>
                <div>@{selectedAlert.username}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverAlertsDisplay;