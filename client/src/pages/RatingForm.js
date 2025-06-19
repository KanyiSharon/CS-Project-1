import { useState } from 'react';
import { Star, Send, AlertCircle, CheckCircle } from 'lucide-react';

const RatingForm = () => {
  const [formData, setFormData] = useState({
    commuter_id: '',
    sacco_id: '',
    cleanliness_rating: 0,
    safety_rating: 0,
    service_rating: 0,
    review_text: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.commuter_id) {
      newErrors.commuter_id = 'Commuter ID is required';
    }
    
    if (!formData.sacco_id) {
      newErrors.sacco_id = 'Sacco ID is required';
    }
    
    if (formData.cleanliness_rating < 1 || formData.cleanliness_rating > 5) {
      newErrors.cleanliness_rating = 'Please select a cleanliness rating';
    }
    
    if (formData.safety_rating < 1 || formData.safety_rating > 5) {
      newErrors.safety_rating = 'Please select a safety rating';
    }
    
    if (formData.service_rating < 1 || formData.service_rating > 5) {
      newErrors.service_rating = 'Please select a service rating';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      [category]: rating
    }));
    
    // Clear error when user selects rating
    if (errors[category]) {
      setErrors(prev => ({
        ...prev,
        [category]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    const submitData = {
      commuter_id: parseInt(formData.commuter_id),
      sacco_id: parseInt(formData.sacco_id),
      cleanliness_rating: parseInt(formData.cleanliness_rating),
      safety_rating: parseInt(formData.safety_rating),
      service_rating: parseInt(formData.service_rating),
      review_text: formData.review_text.trim() || null
    };
    
    console.log('Data being sent to API:', submitData);
    
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Rating submitted successfully!' });
        // Reset form
        setFormData({
          commuter_id: '',
          sacco_id: '',
          cleanliness_rating: 0,
          safety_rating: 0,
          service_rating: 0,
          review_text: ''
        });
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to submit rating' });
      }
    } catch (error) {
      console.error('Network error:', error);
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, label, error }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className={`p-1 rounded-full transition-colors ${
                star <= rating
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star
                size={24}
                fill={star <= rating ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Sacco Experience</h2>
        <p className="text-gray-600">Share your feedback to help improve public transport services</p>
      </div>

      {submitStatus && (
        <div className={`mb-6 p-4 rounded-md flex items-center space-x-3 ${
          submitStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitStatus.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{submitStatus.message}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="commuter_id" className="block text-sm font-medium text-gray-700 mb-2">
              Commuter ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="commuter_id"
              name="commuter_id"
              value={formData.commuter_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.commuter_id ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your commuter ID"
            />
            {errors.commuter_id && (
              <p className="mt-1 text-sm text-red-600">{errors.commuter_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="sacco_id" className="block text-sm font-medium text-gray-700 mb-2">
              Sacco ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="sacco_id"
              name="sacco_id"
              value={formData.sacco_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.sacco_id ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter sacco ID"
            />
            {errors.sacco_id && (
              <p className="mt-1 text-sm text-red-600">{errors.sacco_id}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <StarRating
            rating={formData.cleanliness_rating}
            onRatingChange={(rating) => handleRatingChange('cleanliness_rating', rating)}
            label="Cleanliness Rating"
            error={errors.cleanliness_rating}
          />

          <StarRating
            rating={formData.safety_rating}
            onRatingChange={(rating) => handleRatingChange('safety_rating', rating)}
            label="Safety Rating"
            error={errors.safety_rating}
          />

          <StarRating
            rating={formData.service_rating}
            onRatingChange={(rating) => handleRatingChange('service_rating', rating)}
            label="Service Rating"
            error={errors.service_rating}
          />
        </div>

        <div>
          <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 mb-2">
            Review (Optional)
          </label>
          <textarea
            id="review_text"
            name="review_text"
            value={formData.review_text}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your detailed experience..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Submit Rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingForm;