import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, Send, X, MapPin } from 'lucide-react';

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
    { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' }
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

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix to get just the base64 data
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.alert_type || !formData.title || !formData.description || !formData.location_name || !formData.poster_name) {
      setErrorMessage('Please fill in all required fields including your name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Prepare submission data
      const submitData = {
        // TODO: When authentication is implemented, use actual user ID
        // driver_id: currentUser.id,
        driver_id: null, // Will be set by backend based on authenticated user
        alert_type: formData.alert_type,
        title: formData.title,
        description: formData.description,
        location_name: formData.location_name,
        severity_level: formData.severity_level,
        expiry_time: formData.expiry_time || null,
        image_filename: formData.image_filename || null,
        image_mimetype: formData.image_mimetype || null,
        poster_name: formData.poster_name // Temporary field until auth is implemented
      };

      // Convert image to base64 if present
      if (formData.image) {
        const imageBase64 = await convertImageToBase64(formData.image);
        submitData.image_data = imageBase64;
      }
      
      console.log('Submitting alert:', submitData);
      
      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/driver-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        //   'Authorization': `Bearer ${userToken}` // Add your auth token
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit alert');
      }
      
      // Simulate successful submission
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('Alert submitted successfully! Your traffic alert has been posted and is under review.');
        
        // Reset form
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
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      setErrorMessage('Failed to submit alert. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Post Traffic Alert</h2>
        </div>
        <div className="text-sm text-gray-600">
          {currentUser.name ? (
            <>Posted by: <span className="font-medium">{currentUser.name}</span></>
          ) : (
            <span className="text-red-500">Please enter your name below</span>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Poster Name - Temporary until authentication is implemented */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            name="poster_name"
            value={formData.poster_name}
            onChange={handleInputChange}
            placeholder="Enter your name (e.g., John Kamau)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength="100"
          />
          <p className="text-xs text-gray-500 mt-1">This will be replaced with automatic user identification once authentication is implemented</p>
        </div>
        {/* Alert Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Type *
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {alertTypes.map((type) => (
              <label key={type.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="alert_type"
                  value={type.value}
                  checked={formData.alert_type === type.value}
                  onChange={handleInputChange}
                  className="mr-3"
                  required
                />
                <span className="mr-2">{type.icon}</span>
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief description of the situation"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength="255"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/255 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Provide more details about the situation, suggested alternative routes, etc."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              placeholder="e.g., Uhuru Highway near Nyayo Stadium, Nairobi"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength="255"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Be as specific as possible to help other drivers</p>
        </div>

        {/* Severity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {severityLevels.map((level) => (
              <label key={level.value} className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.severity_level === level.value ? level.bg : ''}`}>
                <input
                  type="radio"
                  name="severity_level"
                  value={level.value}
                  checked={formData.severity_level === level.value}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className={`text-sm font-medium ${level.color}`}>{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo (Optional)
          </label>
          <div className="space-y-3">
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload photo</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {formData.image_filename}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expiry Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Expiry (Optional)
          </label>
          <input
            type="datetime-local"
            name="expiry_time"
            value={formData.expiry_time}
            onChange={handleInputChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for alerts that don't expire automatically</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Alert
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All alerts are reviewed by administrators before being published</li>
              <li>Provide accurate information to help fellow drivers and commuters</li>
              <li>False or misleading alerts may result in account suspension</li>
              <li>Include photos when possible to help verify the situation</li>
              <li>Images are stored securely and will be used only for alert verification</li>
              <li>Name field is temporary - will be replaced with automatic user identification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAlertsForm;