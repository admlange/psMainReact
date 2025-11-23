import { useState } from 'react';
import InspectionResultsList from './InspectionResultsList.jsx';
import InspectionResultDetail from './InspectionResultDetail.jsx';
import { useAuth } from './AuthContext.js';

export default function RemoteInspectionsPage(){
  const { token } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  return (
    <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start', flexWrap:'wrap' }}>
      <div style={{ flex:'1 1 420px', minWidth:320 }}>
        <InspectionResultsList onSelect={setSelectedId} token={token} />
      </div>
      <div style={{ flex:'2 1 640px', minWidth:420 }}>
        <InspectionResultDetail id={selectedId} token={token} />
      </div>
    </div>
  );
}
