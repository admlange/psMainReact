import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import InspectionResultsList from './InspectionResultsList.jsx';
import InspectionResultDetail from './InspectionResultDetail.jsx';

function App(){
  const [selectedId, setSelectedId] = useState(null);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <InspectionResultsList onSelect={id => setSelectedId(id)} />
      <InspectionResultDetail id={selectedId} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
