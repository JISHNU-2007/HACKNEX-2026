import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { MonitorPage } from './pages/MonitorPage';
import { ConfigurePage } from './pages/ConfigurePage';
import { InvestigatePage } from './pages/InvestigatePage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/monitor" replace />} />
          <Route path="monitor" element={<MonitorPage />} />
          <Route path="configure" element={<ConfigurePage />} />
          <Route path="investigate" element={<InvestigatePage />} />
          <Route path="investigate/:id" element={<IncidentDetailPage />} />
          <Route path="*" element={<Navigate to="/monitor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
