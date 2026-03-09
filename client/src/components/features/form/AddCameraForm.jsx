// src/components/AddCameraForm.jsx
import React, { useState, useEffect } from 'react';

function AddCameraForm({ onCameraAdded }) {
  const [locations, setLocations] = useState([]);
  const [camName, setCamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [locationId, setLocationId] = useState('');

  // 1. Fetch locations on component mount
  useEffect(() => {
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
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newCamera = {
      cam_name: camName,
      stream_url: streamUrl,
      loc_id: parseInt(locationId) // Make sure ID is a number
    };

    // 2. Send the POST request to your API
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
        // (Optional) Call a prop to tell the parent component to refresh its list
        if (onCameraAdded) {
          onCameraAdded(data.camera); 
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(err => console.error("Error adding camera:", err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Camera</h3>
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
      <button type="submit">Add Camera</button>
    </form>
  );
}

export default AddCameraForm;