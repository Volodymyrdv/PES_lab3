import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './components/App/App';
import LabThreeResult from './components/LabThreeResult/LabThreeResult';
import SessionProvider from './context/SessionContext';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/lab3' element={<LabThreeResult />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);
