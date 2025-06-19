import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const RatingForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    cleanliness_rating: initialData?.cleanliness_rating || 0,
    safety_rating: initialData?.safety_rating || 0,
    service_rating: initialData?.service_rating || 0,
    review_text: initialData?.review_text || ''
  });
  const [hoveredRating, setHoveredRating] = useState({
    cleanliness: null,
    safety: null,
    service: null
  });
  const [errors, setErrors] = useState({});

  const handleRatingChange = (category, value) => {
    setFormData({
      ...formData,
      [`${category}_rating`]: value
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.cleanliness_rating < 1 || formData.cleanliness_rating > 5) {
      newErrors.cleanliness_rating = 'Please rate cleanliness';
    }
    
    if (formData.safety_rating < 1 || formData.safety_rating > 5) {
      newErrors.safety_rating = 'Please rate safety';
    }
    
    if (formData.service_rating < 1 || formData.service_rating > 5) {
      newErrors.service_rating = 'Please rate service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderStarRating = (category, currentRating) => {
    return (
      <div className="flex mb-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="mr-1 focus:outline-none"
            onClick={() => handleRatingChange(category, star)}
            onMouseEnter={() => setHoveredRating({...hoveredRating, [category]: star})}
            onMouseLeave={() => setHoveredRating({...hoveredRating, [category]: null})}
          >
            <FaStar
              className={`text-2xl ${
                (hoveredRating[category] || formData[`${category}_rating`]) >= star 
                  ? 'text-yellow-500' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Edit Rating' : 'Add Rating'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cleanliness
            </label>
            {renderStarRating('cleanliness', formData.cleanliness_rating)}
            {errors.cleanliness_rating && (
              <p className="text-red-500 text-xs mt-1">{errors.cleanliness_rating}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety
            </label>
            {renderStarRating('safety', formData.safety_rating)}
            {errors.safety_rating && (
              <p className="text-red-500 text-xs mt-1">{errors.safety_rating}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service
            </label>
            {renderStarRating('service', formData.service_rating)}
            {errors.service_rating && (
              <p className="text-red-500 text-xs mt-1">{errors.service_rating}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review (optional)
            </label>
            <textarea
              name="review_text"
              value={formData.review_text}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {initialData ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingForm;