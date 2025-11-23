import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

function renderApp(){
  const el = document.getElementById('root');
  if(!el){
    console.error('[Bootstrap] #root not found');
    return;
  }
  try {
    console.log('[Bootstrap] Rendering React application');
    createRoot(el).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (e) {
    console.error('[Bootstrap] React render failed:', e);
    el.innerHTML = `<pre style="color:#b00020">Render error: ${e?.message || e}</pre>`;
  }
}

// Global error instrumentation
window.addEventListener('error', (ev) => {
  console.error('[GlobalError]', ev.error || ev.message);
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[GlobalRejection]', ev.reason);
});

renderApp();
