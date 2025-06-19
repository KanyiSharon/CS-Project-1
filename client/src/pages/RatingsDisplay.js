import React, { useState, useEffect } from 'react';
import { Star, Plus, Filter, Search, User, Calendar, MessageCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RatingsDisplay = () => {
  const [ratings, setRatings] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sacco_id: '',
    sort: 'newest',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRatings: 0,
    hasNext: false,
    hasPrev: false
  });

  // API configuration - adjust this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        sort: filters.sort
      });

      // Add optional filters
      if (filters.sacco_id) {
        queryParams.append('sacco_id', filters.sacco_id);
      }

      console.log('Making API call to:', `${API_BASE_URL}/api/ratings?${queryParams}`);

      // Make API call
      const response = await fetch(`${API_BASE_URL}/api/ratings?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API endpoint not found. Check if your backend server is running.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      setRatings(data.ratings || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRatings: 0,
        hasNext: false,
        hasPrev: false
      });

    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err.message || 'Failed to fetch ratings');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock data for development');
        const mockRatings = [
          {
            id: 1,
            commuter_firstname: 'John',
            commuter_lastname: 'Doe',
            sacco_name: 'City Express SACCO',
            cleanliness_rating: 4,
            safety_rating: 5,
            service_rating: 4,
            average_rating: 4.33,
            review_text: 'Great service overall! The vehicles are clean and the drivers are professional.',
            created_at: '2024-06-15T10:30:00Z'
          },
          {
            id: 2,
            commuter_firstname: 'Sarah',
            commuter_lastname: 'Johnson',
            sacco_name: 'Metro Transport',
            cleanliness_rating: 3,
            safety_rating: 4,
            service_rating: 3,
            average_rating: 3.33,
            review_text: 'Average experience. The buses are okay but could be cleaner.',
            created_at: '2024-06-14T14:20:00Z'
          }
        ];
        setRatings(mockRatings);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRatings: mockRatings.length,
          hasNext: false,
          hasPrev: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [filters.sort, filters.sacco_id, pagination.currentPage]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Handle filter changes with debouncing for search
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [filters.search]);

  // Client-side filtering for search (since backend doesn't support search yet)
  const filteredRatings = ratings.filter(rating => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        rating.sacco_name?.toLowerCase().includes(searchLower) ||
        rating.commuter_firstname?.toLowerCase().includes(searchLower) ||
        rating.commuter_lastname?.toLowerCase().includes(searchLower) ||
        rating.review_text?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleRetry = () => {
    setError(null);
    fetchRatings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">SACCO Ratings</h1>
            {error && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Backend URL: {API_BASE_URL}/api/ratings
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search ratings, SACCOs, or commuters..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredRatings.length === 0 ? (
          <div className="text-center py-12">
            {error ? (
              <div>
                <p className="text-gray-500 text-lg">Unable to load ratings</p>
                <p className="text-gray-400 mt-2">Please check your connection and try again</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-lg">No ratings found</p>
                <p className="text-gray-400 mt-2">Be the first to rate a SACCO!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRatings.map((rating) => (
              <div key={rating.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{rating.sacco_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-600">
                        {rating.commuter_firstname} {rating.commuter_lastname}
                      </span>
                      <Calendar size={16} className="text-gray-400 ml-2" />
                      <span className="text-gray-500 text-sm">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(rating.average_rating)}`}>
  {Number.isFinite(Number(rating.average_rating))
    ? Number(rating.average_rating).toFixed(1)
    : 'N/A'} ★
</div>
                  </div>
                </div>

                {/* Individual Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Cleanliness</span>
                    <div className="flex items-center gap-1">
                      {renderStars(rating.cleanliness_rating)}
                      <span className="text-sm text-gray-500 ml-1">({rating.cleanliness_rating})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Safety</span>
                    <div className="flex items-center gap-1">
                      {renderStars(rating.safety_rating)}
                      <span className="text-sm text-gray-500 ml-1">({rating.safety_rating})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Service</span>
                    <div className="flex items-center gap-1">
                      {renderStars(rating.service_rating)}
                      <span className="text-sm text-gray-500 ml-1">({rating.service_rating})</span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {rating.review_text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageCircle size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 text-sm leading-relaxed">{rating.review_text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && !error && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * 10) + 1} - {Math.min(pagination.currentPage * 10, pagination.totalRatings)} of {pagination.totalRatings} ratings
            </div>
          </div>
        )}
      </div>

      {/* Floating Plus Button */}
      <button
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 focus:ring-4 focus:ring-blue-300"
        onClick={() => navigate('/ratingform')}
        title="Add new rating"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default RatingsDisplay;