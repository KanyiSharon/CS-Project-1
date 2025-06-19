import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, Send, X, MapPin, CheckCircle } from 'lucide-react';

const DriverAlertsForm = () => {
  // TODO: Replace with actual authentication context
  // const { currentUser } = useAuth(); // Will use this when auth is implemented
  const [currentUser, setCurrentUser] = useState({
    id: null,
    name: '',
    role: 'driver'
  });

  const [formData, setFormData] = useState({
    alert_type: '',
    title: '',
    description: '',
    location_name: '',
    severity_level: 'medium',
    image: null,
    image_filename: '',
    image_mimetype: '',
    expiry_time: '',
    poster_name: '' // Temporary field for manual name entry
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file.');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB.');
        return;
      }

      setErrorMessage('');
      
      setFormData(prev => ({
        ...prev,
        image: file,
        image_filename: file.name,
        image_mimetype: file.type
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      image_filename: '',
      image_mimetype: ''
    }));
    setImagePreview(null);
  };

  // Mock API function to simulate backend submission
  const mockApiSubmission = async (formData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo purposes
        // In reality, this would always succeed or fail based on actual conditions
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        if (success) {
          resolve({
            success: true,
            message: 'Alert submitted successfully! It will be reviewed by administrators before being published.',
            alertId: 'ALERT-' + Date.now()
          });
        } else {
          reject(new Error('Server temporarily unavailable. Please try again.'));
        }
      }, 2000); // Simulate 2 second delay
    });
  };

  const resetForm = () => {
    setFormData({
      alert_type: '',
      title: '',
      description: '',
      location_name: '',
      severity_level: 'medium',
      image: null,
      image_filename: '',
      image_mimetype: '',
      expiry_time: '',
      poster_name: ''
    });
    setImagePreview(null);
  };

  // Real API submission function (commented out for now)
  
  const handleSubmit= async () => {
    // Basic validation
    if (!formData.alert_type || !formData.title || !formData.description || !formData.location_name || !formData.poster_name) {
      setErrorMessage('Please fill in all required fields including your name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Prepare FormData for multipart/form-data
      const form = new FormData();
      form.append('alert_type', formData.alert_type);
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('location_name', formData.location_name);
      form.append('severity_level', formData.severity_level);
      if (formData.expiry_time) form.append('expiry_time', formData.expiry_time);
      form.append('poster_name', formData.poster_name);
      if (formData.image) {
        form.append('image', formData.image, formData.image_filename);
      }

      const response = await fetch('/api/driver-alerts', {
        method: 'POST',
        body: form
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit alert');
      }

      const result = await response.json();
      setSuccessMessage(result.message || 'Alert submitted successfully!');
      setIsSubmitting(false);
      resetForm();
      
    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      setErrorMessage(error.message || 'Failed to submit alert. Please try again.');
    }
  };

  // CSS Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0033 0%, #0f0f23 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px'
    },
    gridOverlay: {
      position: 'absolute',
      inset: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v1H0zM0 0v100h1V0z' fill='%2300d4ff' fill-opacity='0.1'/%3E%3C/svg%3E")`,
      animation: 'pulse 3s infinite'
    },
    particle: {
      position: 'absolute',
      width: '4px',
      height: '4px',
      backgroundColor: '#00d4ff',
      borderRadius: '50%',
      animation: 'pulse 3s infinite'
    },
    formCard: {
      maxWidth: '800px',
      margin: '0 auto',
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)',
      position: 'relative',
      zIndex: 10
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      fontFamily: 'Monaco, monospace',
      background: 'linear-gradient(45deg, #00d4ff, #39ff14, #ff1493)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      marginBottom: '8px'
    },
    subtitle: {
      color: 'rgba(224, 247, 255, 0.7)',
      fontSize: '0.9rem',
      fontFamily: 'Monaco, monospace'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      color: '#e0f7ff',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0, 212, 255, 0.1)',
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.9rem'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      color: '#e0f7ff',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0, 212, 255, 0.1)',
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.9rem',
      resize: 'vertical',
      minHeight: '100px'
    },
    label: {
      display: 'block',
      fontSize: '0.8rem',
      fontWeight: '500',
      color: '#00d4ff',
      marginBottom: '8px',
      fontFamily: 'Monaco, monospace',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '16px 32px',
      background: 'linear-gradient(45deg, #00d4ff, #39ff14)',
      color: '#000',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontFamily: 'Monaco, monospace',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
      fontSize: '0.9rem'
    },
    buttonDisabled: {
      background: 'rgba(102, 102, 102, 0.3)',
      color: 'rgba(224, 247, 255, 0.5)',
      cursor: 'not-allowed',
      boxShadow: '0 4px 16px rgba(102, 102, 102, 0.2)'
    },
    statusCard: {
      padding: '16px',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.8rem'
    },
    successCard: {
      backgroundColor: 'rgba(57, 255, 20, 0.1)',
      border: '1px solid rgba(57, 255, 20, 0.3)',
      color: '#39ff14',
      boxShadow: '0 4px 16px rgba(57, 255, 20, 0.2)'
    },
    errorCard: {
      backgroundColor: 'rgba(255, 68, 68, 0.1)',  
      border: '1px solid rgba(255, 68, 68, 0.3)',
      color: '#ff4444',
      boxShadow: '0 4px 16px rgba(255, 68, 68, 0.2)'
    },
    radioGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px'
    },
    radioCard: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0, 212, 255, 0.1)'
    },
    radioCardSelected: {
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      border: '1px solid rgba(0, 212, 255, 0.5)',
      boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)'
    },
    radioInput: {
      marginRight: '12px',
      accentColor: '#00d4ff'
    },
    radioLabel: {
      color: '#e0f7ff',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    imageUpload: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '120px',
      border: '2px dashed rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease'
    },
    imagePreview: {
      position: 'relative',
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(0, 212, 255, 0.3)'
    },
    removeImageBtn: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '4px',
      backgroundColor: 'rgba(255, 68, 68, 0.8)',
      color: '#fff',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease'
    },
    infoCard: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: 'rgba(0, 212, 255, 0.05)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)'
    },
    infoList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    infoItem: {
      color: 'rgba(224, 247, 255, 0.8)',
      fontSize: '0.7rem',
      fontFamily: 'Monaco, monospace',
      marginBottom: '4px',
      paddingLeft: '16px',
      position: 'relative'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(0, 0, 0, 0.3)',
      borderTop: '2px solid #000',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '8px'
    }
  };

  // Animation styles
  const animationStyles = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .input-focus:focus {
      border-color: #00d4ff !important;
      box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2) !important;
    }
    .button-hover:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 12px 48px rgba(0, 212, 255, 0.5) !important;
    }
    .radio-hover:hover {
      background-color: rgba(0, 212, 255, 0.05) !important;
      transform: scale(1.02);
    }
    .upload-hover:hover {
      background-color: rgba(0, 212, 255, 0.05) !important;
      border-color: rgba(0, 212, 255, 0.5) !important;
    }
  `;

  return (
    <div style={styles.container}>
      <style>{animationStyles}</style>
      <div style={styles.gridOverlay}></div>
      
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.particle,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}

      <div style={styles.formCard}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertTriangle style={{ width: '32px', height: '32px', color: '#ff4444', marginRight: '12px' }} />
            <div>
              <h2 style={styles.title}>Post Traffic Alert</h2>
              <p style={styles.subtitle}>Share real-time traffic information with fellow drivers</p>
            </div>
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(224, 247, 255, 0.7)',
            fontFamily: 'Monaco, monospace'
          }}>
            {currentUser.name ? (
              <>Posted by: <span style={{ color: '#00d4ff' }}>{currentUser.name}</span></>
            ) : (
              <span style={{ color: '#ff4444' }}>Please enter your name below</span>
            )}
          </div>
        </div>

        {successMessage && (
          <div style={{...styles.statusCard, ...styles.successCard}}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{...styles.statusCard, ...styles.errorCard}}>
            <AlertTriangle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Poster Name - Temporary until authentication is implemented */}
          <div>
            <label style={styles.label}>
              Your Name <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <input
              type="text"
              name="poster_name"
              value={formData.poster_name}
              onChange={handleInputChange}
              placeholder="Enter your name (e.g., John Kamau)"
              style={styles.input}
              className="input-focus"
              required
              maxLength="100"
            />
            <p style={{ 
              fontSize: '0.7rem', 
              color: 'rgba(224, 247, 255, 0.5)', 
              marginTop: '4px',
              fontFamily: 'Monaco, monospace'
            }}>
              This will be replaced with automatic user identification once authentication is implemented
            </p>
          </div>

          {/* Alert Type */}
          <div>
            <label style={styles.label}>
              Alert Type <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <div style={styles.radioGrid}>
              {alertTypes.map((type) => (
                <label 
                  key={type.value} 
                  style={{
                    ...styles.radioCard,
                    ...(formData.alert_type === type.value ? styles.radioCardSelected : {})
                  }}
                  className="radio-hover"
                >
                  <input
                    type="radio"
                    name="alert_type"
                    value={type.value}
                    checked={formData.alert_type === type.value}
                    onChange={handleInputChange}
                    style={styles.radioInput}
                    required
                  />
                  <span style={styles.radioLabel}>
                    <span>{type.icon}</span>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={styles.label}>
              Alert Title <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief description of the situation"
              style={styles.input}
              className="input-focus"
              required
              maxLength="255"
            />
            <p style={{ 
              fontSize: '0.7rem', 
              color: 'rgba(224, 247, 255, 0.5)', 
              marginTop: '4px',
              fontFamily: 'Monaco, monospace'
            }}>
              {formData.title.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={styles.label}>
              Detailed Description <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide more details about the situation, suggested alternative routes, etc."
              style={styles.textarea}
              className="input-focus"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label style={styles.label}>
              Location <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '12px', 
                width: '16px', 
                height: '16px', 
                color: 'rgba(224, 247, 255, 0.5)' 
              }} />
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleInputChange}
                placeholder="e.g., Uhuru Highway near Nyayo Stadium, Nairobi"
                style={{...styles.input, paddingLeft: '40px'}}
                className="input-focus"
                required
                maxLength="255"
              />
            </div>
            <p style={{ 
              fontSize: '0.7rem', 
              color: 'rgba(224, 247, 255, 0.5)', 
              marginTop: '4px',
              fontFamily: 'Monaco, monospace'
            }}>
              Be as specific as possible to help other drivers
            </p>
          </div>

          {/* Severity Level */}
          <div>
            <label style={styles.label}>
              Severity Level <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {severityLevels.map((level) => (
                <label 
                  key={level.value} 
                  style={{
                    ...styles.radioCard,
                    ...(formData.severity_level === level.value ? {
                      ...styles.radioCardSelected,
                      backgroundColor: `${level.color}15`,
                      borderColor: `${level.color}50`
                    } : {})
                  }}
                  className="radio-hover"
                >
                  <input
                    type="radio"
                    name="severity_level"
                    value={level.value}
                    checked={formData.severity_level === level.value}
                    onChange={handleInputChange}
                    style={styles.radioInput}
                  />
                  <span style={{...styles.radioLabel, color: level.color, fontWeight: 'bold'}}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label style={styles.label}>
              Photo (Optional)
            </label>
            <div>
              {!imagePreview ? (
                <label style={styles.imageUpload} className="upload-hover">
                  <Camera style={{ width: '32px', height: '32px', color: 'rgba(224, 247, 255, 0.5)', marginBottom: '8px' }} />
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'rgba(224, 247, 255, 0.7)',
                    fontFamily: 'Monaco, monospace',
                    textAlign: 'center'
                  }}>
                    Click to upload photo
                  </p>
                  <p style={{ 
                    fontSize: '0.7rem', 
                    color: 'rgba(224, 247, 255, 0.5)',
                    fontFamily: 'Monaco, monospace'
                  }}>
                    PNG, JPG up to 5MB
                  </p>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              ) : (
                <div style={styles.imagePreview}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={styles.removeImageBtn}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#e0f7ff',
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontFamily: 'Monaco, monospace'
                  }}>
                    {formData.image_filename}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expiry Time */}
          <div>
            <label style={styles.label}>
              Alert Expiry (Optional)
            </label>
            
            <input
              type="datetime-local"
              name="expiry_time"
              value={formData.expiry_time}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              style={styles.input}
              className="input-focus"
            />
            <p style={{ 
              fontSize: '0.7rem', 
              color: 'rgba(224, 247, 255, 0.5)', 
              marginTop: '4px',
              fontFamily: 'Monaco, monospace'
            }}>
              Leave empty for alerts that don't expire automatically
            </p>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
              className="button-hover"
            >
              {isSubmitting ? (
                <>
                  <div style={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Post Alert
                </>
              )}
            </button>
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <AlertTriangle style={{ 
              width: '20px', 
              height: '20px', 
              color: '#00d4ff', 
              marginTop: '2px', 
              marginRight: '8px',
              flexShrink: 0
            }} />
            <div>
              <p style={{ 
                color: '#00d4ff', 
                fontFamily: 'Monaco, monospace', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Important Notes:
              </p>
              <ul style={styles.infoList}>
                <li style={styles.infoItem}>• All alerts are reviewed by administrators before being published</li>
                <li style={styles.infoItem}>• Provide accurate information to help fellow drivers and commuters</li>
                <li style={styles.infoItem}>• False or misleading alerts may result in account suspension</li>
                <li style={styles.infoItem}>• Include photos when possible to help verify the situation</li>
                <li style={styles.infoItem}>• Currently using mock API for demo - replace with real backend when ready</li>
                
            </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  

export default DriverAlertsForm;