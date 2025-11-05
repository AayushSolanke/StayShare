import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './components/Landing';
import { LoginSignup } from './components/LoginSignup';
import { UserProfile } from './components/UserProfile';
import { Listings } from './components/Listings';
import { ListingDetails } from './components/ListingDetails';
import { Booking } from './components/Booking';
import { MyBookings } from './components/MyBookings';
import { RoommatesListing } from './components/RoommatesListing';
import { RoommateProfile } from './components/RoommateProfile';
import { PostRoommateRequest } from './components/PostRoommateRequest';
import { Navbar } from './components/Navbar';
import { CreateListing } from './components/CreateListing';
import HostDashboard from './components/HostDashboard';
import apiService from './services/api';

// Auth Context
const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLandlord = user?.role === 'landlord';

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // If token is invalid, remove it
        apiService.setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      updateUser,
      isLoading,
      isLandlord
    }}>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<LoginSignup />} />
            <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/auth" />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route
              path="/create-listing"
              element={
                isAuthenticated
                  ? <CreateListing />
                  : <Navigate to="/auth" />
              }
            />
            <Route
              path="/host"
              element={
                isAuthenticated
                  ? isLandlord
                    ? <HostDashboard />
                    : <Navigate to="/" />
                  : <Navigate to="/auth" />
              }
            />
            <Route path="/booking/:id" element={isAuthenticated ? <Booking /> : <Navigate to="/auth" />} />
            <Route path="/my-bookings" element={isAuthenticated ? <MyBookings /> : <Navigate to="/auth" />} />
            <Route path="/roommates" element={<RoommatesListing />} />
            <Route path="/roommate/:id" element={<RoommateProfile />} />
            <Route path="/post-roommate" element={isAuthenticated ? <PostRoommateRequest /> : <Navigate to="/auth" />} />
            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;