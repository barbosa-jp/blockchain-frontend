import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import IssuePage from './pages/IssuePage';
import VerifyPage from './pages/VerifyPage';
import MyCertificatesPage from './pages/MyCertificatesPage';
import ManagePage from './pages/ManagePage';
import GovernancePage from './pages/GovernancePage';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/issue" element={<IssuePage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/my-certificates" element={<MyCertificatesPage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/governance" element={<GovernancePage />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;