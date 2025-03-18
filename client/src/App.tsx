// file: client/src/App.tsx
// description: Main App component with routing
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import { Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { RootLayout } from './components/layout/RootLayout';
import LandingPage from './pages/Landing';

// Lazy-loaded components to improve initial load time
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const TodoHomePage = React.lazy(() => import('./pages/Todo/Home'));
const TodoDetailPage = React.lazy(() => import('./pages/Todo/Detail'));
const LoginPage = React.lazy(() => import('./pages/Auth/Login'));
const RegisterPage = React.lazy(() => import('./pages/Auth/Register'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-primary">Loading...</div>
  </div>
);

function App() {
  return (
    <RootLayout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingFallback />}>
            <RegisterPage />
          </Suspense>
        } />
        
        {/* Protected routes - will be enhanced with auth protection later */}
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="/todos" element={
          <Suspense fallback={<LoadingFallback />}>
            <TodoHomePage />
          </Suspense>
        } />
        <Route path="/todos/:id" element={
          <Suspense fallback={<LoadingFallback />}>
            <TodoDetailPage />
          </Suspense>
        } />
        
        {/* Not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RootLayout>
  );
}

// Simple NotFound component - will be enhanced later
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg">Page not found</p>
      <a href="/" className="mt-4 text-primary hover:underline">
        Go back home
      </a>
    </div>
  );
}

export default App;