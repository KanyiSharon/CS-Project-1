import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LostAndFound = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ 
    lostitem: '', 
    route: '', 
    date: '', 
    sacco: '', 
    description: '', 
    image: null 
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data
        try {
          const userRes = await fetch('http://localhost:5000/api/me', { 
            credentials: 'include' 
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          } else {
            console.log('Not logged in, redirecting...');
            navigate('/');
            return;
          }
        } catch (userErr) {
          console.log('User fetch failed, redirecting...', userErr);
          navigate('/');
          return;
        }

        // Fetch lost items
        try {
          const itemsRes = await fetch('http://localhost:5000/api/lost-items');
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            // Ensure we always have an array
            setItems(Array.isArray(itemsData) ? itemsData : []);
          } else {
            console.error('Failed to fetch items:', itemsRes.status, itemsRes.statusText);
            setError('Failed to load lost items');
            setItems([]); // Ensure it's an array
          }
        } catch (itemsErr) {
          console.error('Error fetching items:', itemsErr);
          setError('Error loading lost items');
          setItems([]); // Ensure it's an array
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.lostitem || !form.route || !form.date || !form.sacco) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) payload.append(key, value);
    });

    try {
      const res = await fetch('http://localhost:5000/api/lost-item', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Report submitted successfully!');
        // Reset form
        setForm({ 
          lostitem: '', 
          route: '', 
          date: '', 
          sacco: '', 
          description: '', 
          image: null 
        });
        // Refresh the items list
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed to submit report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error submitting report. Please try again.');
    }
  };

  const handleFoundItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/found-item/${itemId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Item marked as found!');
        window.location.reload();
      } else {
        alert('Failed to mark item as found');
      }
    } catch (err) {
      console.error('Error marking item as found:', err);
      alert('Error marking item as found');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="auth-box">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="auth-box">
        <h2 style={{ textAlign: 'center' }}>Lost & Found</h2>
        
        {error && (
          <div style={{ 
            color: 'red', 
            backgroundColor: '#ffe6e6', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        {user?.role === 'Driver' && (
          <>
            <h3>Report Lost Item</h3>
            <form onSubmit={handleSubmit} className="post-form">
              <input 
                type="text" 
                name="lostitem" 
                placeholder="Item Description (e.g. Phone, ID)" 
                value={form.lostitem}
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="route" 
                placeholder="Route (e.g. CBD to Westlands)" 
                value={form.route}
                onChange={handleChange} 
                required 
              />
              <input 
                type="date" 
                name="date" 
                value={form.date}
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="sacco" 
                placeholder="SACCO (e.g. City Hoppa)" 
                value={form.sacco}
                onChange={handleChange} 
                required 
              />
              <textarea 
                name="description" 
                placeholder="Additional details..." 
                value={form.description}
                onChange={handleChange} 
              />
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleChange} 
              />
              <button type="submit">Report Lost Item</button>
            </form>
          </>
        )}

        <h3 style={{ marginTop: '30px' }}>Recent Items</h3>
        
        {items.length === 0 && !loading && (
          <p>No lost items reported yet.</p>
        )}
        
        {Array.isArray(items) && items.map((item, idx) => (
          <div key={item.id || idx} style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            marginBottom: '10px', 
            borderRadius: '8px' 
          }}>
            <strong>
              {item.description && item.description.toLowerCase().includes('found') ? 'Found:' : 'Lost:'}
            </strong> {item.lostitem}<br />
            <strong>Route:</strong> {item.route}<br />
            <strong>Date:</strong> {new Date(item.date).toLocaleDateString()}<br />
            <strong>SACCO:</strong> {item.sacco}<br />
            {item.description && (
              <>
                <strong>Details:</strong> {item.description}<br />
              </>
            )}
            {item.image_url && (
              <img 
                src={`http://localhost:5000${item.image_url}`} 
                alt="Item" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  borderRadius: '5px',
                  marginTop: '10px' 
                }} 
              />
            )}
            
            <div style={{ marginTop: '10px' }}>
              {item.description && item.description.toLowerCase().includes('found') ? (
                <button 
                  style={{ marginRight: '10px' }}
                  onClick={() => navigate('/claim', { state: { itemId: item.id } })}
                >
                  This Is Mine
                </button>
              ) : (
                <button 
                  onClick={() => handleFoundItem(item.id)}
                >
                  I Found This
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LostAndFound;