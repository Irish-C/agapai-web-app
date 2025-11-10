import React, { useState, useEffect } from 'react';

function CameraManagement() {
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // State for the "Add Camera" form
  const [camName, setCamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [locationId, setLocationId] = useState('');
  
  // --- Data Fetching ---

  // 1. Fetch all cameras and locations when the component loads
  useEffect(() => {
    fetchCameras();
    fetchLocations();
  }, []);

  // 2. Function to fetch cameras
  const fetchCameras = () => {
    fetch('/api/cameras')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCameras(data.cameras);
        }
      })
      .catch(err => console.error("Error fetching cameras:", err));
  };
  
  // 3. Function to fetch locations (for the dropdown)
  const fetchLocations = () => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setLocations(data.locations);
          // Set a default selection if locations exist
          if (data.locations.length > 0) {
            setLocationId(data.locations[0].id);
          }
        }
      })
      .catch(err => console.error("Error fetching locations:", err));
  };

  // --- Event Handlers ---

  // 4. Handle "Add Camera" form submission
  const handleAddCamera = (e) => {
    e.preventDefault();
    
    const newCamera = {
      cam_name: camName,
      stream_url: streamUrl,
      loc_id: parseInt(locationId)
    };

    fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCamera)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Camera added!');
        // Clear the form
        setCamName('');
        setStreamUrl('');
        // Refresh the camera list to show the new one
        fetchCameras();
      } else {
        alert('Error: 'D + data.message);
      }
    })
    .catch(err => console.error("Error adding camera:", err));
  };

  // 5. Handle "Remove" button click
  const handleDeleteCamera = (camId) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) {
      return;
    }

    fetch(`/api/cameras/${camId}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert(data.message);
        // Refresh the list by filtering the deleted camera out of state
        setCameras(prevCameras => 
          prevCameras.filter(camera => camera.id !== camId)
        );
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(err => console.error("Error deleting camera:", err));
  };

  // --- Render ---

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      
      {/* Section 1: Add Camera Form */}
      <div style={{ flex: 1 }}>
        <h3>Add New Camera</h3>
        <form onSubmit={handleAddCamera}>
          <div>
            <label>Camera Name: </label>
            <input 
              type="text" 
              value={camName}
              onChange={(e) => setCamName(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Stream URL (optional): </label>
            <input 
              type="text" 
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>
          <div>
            <label>Location: </label>
            <select 
              value={locationId} 
              onChange={(e) => setLocationId(e.target.value)} 
              required
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>
            Add Camera
          </button>
        </form>
      </div>

      {/* Section 2: Existing Camera List */}
      <div style={{ flex: 2 }}>
        <h3>Existing Cameras</h3>
        {cameras.length === 0 ? (
          <p>No cameras found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cameras.map(camera => (
              <li 
                key={camera.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px',
                  borderBottom: '1px solid #ccc'
                }}
              >
                <span>
                  <strong>{camera.name}</strong> (ID: {camera.id})
                  <br />
                  <small>Location: {camera.location_name || 'N/A'}</small>
                </span>
                <button 
                  onClick={() => handleDeleteCamera(camera.id)}
                  style={{ background: 'darkred', color: 'white' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

export default CameraManagement;