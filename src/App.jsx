import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MapSection from './components/MapSection';
import GovernmentContractsSection from './components/GovernmentContractsSection';
import OwnEstablishedRouteSection from './components/OwnEstablishedRouteSection';
import LocalCourierDirectorySection from './components/LocalCourierDirectorySection';
import ContractReadinessSection from './components/ContractReadinessSection';
import ProfitCalculator from './components/ProfitCalculator';
import WhosHiringSection from './components/WhosHiringSection';
import FAQSection from './components/FAQSection';
import RouteDetailModal from './components/RouteDetailModal';
import PostListingModal from './components/PostListingModal';
import PricingModal from './components/PricingModal';
import ProFeatureGateModal from './components/ProFeatureGateModal';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TrainingListPage from './pages/TrainingListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DriversPage from './pages/DriversPage';
import PlannerPage from './pages/PlannerPage';
import CompaniesPage from './pages/CompaniesPage';
// import GrowthPage from './pages/GrowthPage';
import CertificationPage from './pages/CertificationPage';
import DispatchOrdersPage from './pages/DispatchOrdersPage';
import AdminLayout from './pages/admin/AdminLayout';
import PricingPage from './pages/PricingPage';
import ProCheckoutPage from './pages/ProCheckoutPage';
import NotFoundPage from './pages/NotFoundPage';

import { US_STATES } from './data/statesData';
import { mockRoutes as initialRoutes } from './data/mockRoutes';
import { Truck, ShieldCheck, MapPin, DollarSign } from 'lucide-react';
import { supabase } from './lib/supabase';

// Cookie Helpers
const SESSION_COOKIE_NAME = 'routek9_user_session';
const COURSES_COOKIE_NAME = 'routek9_purchased_courses';

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return JSON.parse(decodeURIComponent(match[2]));
  } catch (e) {
    console.warn("Cookie parse error:", e);
  }
  return null;
};

const setCookie = (name, value, days = 30) => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn("Cookie set error:", e);
  }
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

function HomePage({ currentUser, onLogout, onOpenPricing, onTriggerGateModal }) {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedBuyState, setSelectedBuyState] = useState(null);
  const [routes, setRoutes] = useState(initialRoutes);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('All Vehicles');

  // Modals
  const [activeRouteModal, setActiveRouteModal] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handleSelectState = (stateObj) => {
    if (stateObj && stateObj.code && US_STATES[stateObj.code]) {
      setSelectedState(US_STATES[stateObj.code]);
    } else {
      setSelectedState(stateObj);
    }
  };

  const handleFilterCategory = (categoryType, stateObj) => {
    setActiveCategory(categoryType);

    let resolvedState = stateObj;
    if (stateObj && stateObj.code && US_STATES[stateObj.code]) {
      resolvedState = US_STATES[stateObj.code];
    }
    setSelectedState(resolvedState);

    let targetId = 'find-a-route-section';
    if (categoryType === 'business-hiring') {
      targetId = 'local-courier-section';
    } else if (categoryType === 'gov-contracts') {
      targetId = 'government-contracts-section';
    } else if (categoryType === 'for-sale') {
      targetId = 'buy-a-route-section';
      setSelectedBuyState(resolvedState);
    }

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (queryOverride) => {
    const term = typeof queryOverride === 'string' ? queryOverride : searchQuery;
    if (term) {
      const q = term.trim().toLowerCase();
      const matchingState = Object.values(US_STATES).find(
        (st) =>
          st.code.toLowerCase() === q ||
          st.name.toLowerCase().includes(q) ||
          (st.topCities && st.topCities.some((c) => c.toLowerCase().includes(q)))
      );
      if (matchingState) {
        setSelectedState(matchingState);
      }
    }

    const routesElement = document.getElementById('map-section');
    if (routesElement) {
      routesElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddRoute = (newRoute) => {
    setRoutes((prev) => [newRoute, ...prev]);
    if (US_STATES[newRoute.stateCode]) {
      US_STATES[newRoute.stateCode].openRoutes += 1;
    }
  };

  return (
    <>
      {/* Main App Body */}
      <main className="flex-1">

        {/* 1. Hero Section */}
        <Hero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          onSearch={handleSearchSubmit}
        />

        {/* 2. Route Profitability Calculator — PROMOTED to top */}
        <ProfitCalculator />

        {/* 3. Interactive Map Section */}
        <MapSection
          selectedState={selectedState}
          onSelectState={handleSelectState}
          onFilterCategory={handleFilterCategory}
        />


        {/* 5. Federal Courier Contracts — NAICS 492110 */}
        <GovernmentContractsSection currentUser={currentUser} onOpenPricing={onOpenPricing} onTriggerGateModal={onTriggerGateModal} />

        {/* 6. Buy A Route — Own an established route — all 50 states */}
        <OwnEstablishedRouteSection
          selectedState={selectedBuyState}
          onSelectState={setSelectedBuyState}
        />

        {/* 7. Local Courier Directory Section */}
        <LocalCourierDirectorySection selectedState={selectedState} />

        {/* 8. Contract Readiness & Vehicle Qualifications — merged */}
        <ContractReadinessSection />

        {/* 9. Who's Hiring Section — Delivery Apps & Regional Couriers */}
        <WhosHiringSection />

        {/* 10. FAQ Accordion Section */}
        <FAQSection />

      </main>

      {/* Modals */}
      {activeRouteModal && (
        <RouteDetailModal
          route={activeRouteModal}
          onClose={() => setActiveRouteModal(null)}
        />
      )}

      {isPostModalOpen && (
        <PostListingModal
          onClose={() => setIsPostModalOpen(false)}
          onAddRoute={handleAddRoute}
        />
      )}

    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  // Read initial user from session cookie (DEFAULT IS NULL - LOGGED OUT!)
  const [currentUser, setCurrentUser] = useState(() => getCookie(SESSION_COOKIE_NAME) || null);
  const [purchasedCourses, setPurchasedCourses] = useState([]);

  useEffect(() => {
    async function loadPurchasedCourses() {
      if (currentUser?.id) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*');

          if (data && !error) {
            const courseIds = data
              .filter(tx => String(tx.user_id) === String(currentUser.id) && tx.status === 'Succeeded')
              .map(tx => tx.course_id)
              .filter(Boolean);
            if (courseIds.length > 0) {
              setPurchasedCourses(courseIds);
              return;
            }
          }
        } catch (err) {
          console.warn("Error loading purchased courses from DB:", err);
        }
        // Fallback to cookie for local testing or if DB columns don't exist yet
        const cookieCourses = getCookie(COURSES_COOKIE_NAME) || [];
        setPurchasedCourses(cookieCourses);
      } else {
        setPurchasedCourses([]);
      }
    }
    loadPurchasedCourses();
  }, [currentUser]);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [savedUserRoutes, setSavedUserRoutes] = useState([]);

  const handleSaveUserRoute = (newRoute) => {
    setSavedUserRoutes(prev => [newRoute, ...prev.filter(r => r.id !== newRoute.id)]);
  };

  // PRO Feature Gate Popup State
  const [gateModalState, setGateModalState] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Supabase Auth Session Listener & Profile Sync
  useEffect(() => {
    // 1. Check current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    });

    // 2. Subscribe to auth state changes (Google OAuth login, Email confirmation, Sign in, Sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const isActive = await syncSupabaseProfile(session.user);
        // Navigate to dashboard only if user account is active and verified!
        if (isActive && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/signup') {
            navigate('/dashboard');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        deleteCookie(SESSION_COOKIE_NAME);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncSupabaseProfile = async (supabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Deactivation Enforcement Check
      const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]').map(i => String(i).toLowerCase());
      const lowerEmail = (supabaseUser.email || '').toLowerCase();
      const userIdStr = String(supabaseUser.id).toLowerCase();

      const isDeactivated =
        profile?.status === 'INACTIVE' ||
        profile?.status === 'DEACTIVATED' ||
        profile?.is_active === false ||
        profile?.isactive === false ||
        deactivatedList.includes(lowerEmail) ||
        deactivatedList.includes(userIdStr);

      if (isDeactivated) {
        console.warn("Account deactivated by administrator. Signing out immediately.");
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (soErr) {
          console.warn("Local signout notice:", soErr);
        }
        setCurrentUser(null);
        deleteCookie(SESSION_COOKIE_NAME);
        if (window.location.pathname === '/dashboard') {
          navigate('/login');
        }
        return false;
      }

      const userRole = profile?.role || supabaseUser.user_metadata?.role || 'driver';
      let userName = profile?.full_name || supabaseUser.user_metadata?.full_name || (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'User');
      if (userName === 'Jane A. Driver' && supabaseUser.email && supabaseUser.email !== 'driver@routek9.com') {
        userName = supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0];
      }

      // Create profile row if it doesn't exist yet (e.g. Google OAuth)
      if (!profile) {
        try {
          await supabase.from('profiles').upsert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: userName,
            role: userRole,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("RLS notice: profile insert skipped, using user metadata instead.", e);
        }
      }

      setCurrentUser((prev) => {
        const updated = {
          ...(prev || {}),
          id: supabaseUser.id,
          name: profile?.full_name || userName,
          email: profile?.email || supabaseUser.email,
          role: userRole,
          vehicle: profile?.vehicle || prev?.vehicle || (userRole === 'driver' ? 'Cargo Van' : 'Company Fleet'),
          stateCode: profile?.state_code || prev?.stateCode || '',
          city: profile?.city || prev?.city || '',
          phone: profile?.phone || prev?.phone || '',
          dotNumber: profile?.dot_number || prev?.dotNumber || '',
          insurancePolicy: profile?.insurance_policy || prev?.insurancePolicy || '',
          isPro: prev?.isPro || false,
          subscriptionPlan: prev?.subscriptionPlan || 'free'
        };
        setCookie(SESSION_COOKIE_NAME, updated, 30);
        return updated;
      });
    } catch (err) {
      console.error("Error syncing Supabase user profile:", err);
    }
  };

  const handleTriggerGateModal = ({ title, message }) => {
    setGateModalState({
      isOpen: true,
      title: title || "Unlock Route K9 PRO",
      message: message || "This feature requires an active Route K9 PRO Membership."
    });
  };

  const handleLogin = (userObj) => {
    const session = userObj || {
      name: "Jane A. Driver",
      email: "driver@routek9.com",
      vehicle: "Cargo Van",
      stateCode: "TX",
      city: "Houston",
      isPro: false,
      subscriptionPlan: 'free'
    };
    setCurrentUser(session);
    setCookie(SESSION_COOKIE_NAME, session, 30);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout warning:", e);
    }
    setCurrentUser(null);
    deleteCookie(SESSION_COOKIE_NAME);
    navigate('/');
  };

  const handleOpenPricing = () => {
    navigate('/pricing');
  };

  const handleUpgradePro = (subscriptionObj) => {
    const updatedUser = {
      ...(currentUser || {
        name: "Jane A. Driver",
        email: "driver@routek9.com",
        vehicle: "Cargo Van",
        stateCode: "TX",
        city: "Houston"
      }),
      isPro: true,
      subscriptionPlan: 'pro',
      planName: 'Route K9 PRO Membership',
      ...(typeof subscriptionObj === 'object' ? subscriptionObj : { billingCycle: subscriptionObj })
    };
    setCurrentUser(updatedUser);
    setCookie(SESSION_COOKIE_NAME, updatedUser, 30);
  };

  const handleDowngradePro = () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      isPro: false,
      subscriptionPlan: 'free',
      planName: 'Free Starter'
    };
    setCurrentUser(updatedUser);
    setCookie(SESSION_COOKIE_NAME, updatedUser, 30);
  };

  const handleCompletePurchase = (courseId, certName) => {
    const nextCourses = Array.from(new Set([...purchasedCourses, courseId]));
    setPurchasedCourses(nextCourses);
    setCookie(COURSES_COOKIE_NAME, nextCourses, 60);

    if (currentUser) {
      const updatedUser = { ...currentUser, name: certName || currentUser.name };
      setCurrentUser(updatedUser);
      setCookie(SESSION_COOKIE_NAME, updatedUser, 30);
    }
  };

  const handleUpdateProfile = async (updatedProfile) => {
    let userId = currentUser?.id;
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
    }

    const updatedUser = {
      ...(currentUser || {}),
      ...updatedProfile,
      vehicle: updatedProfile.vehicle || updatedProfile.vehicleClass || currentUser?.vehicle,
      city: updatedProfile.city || updatedProfile.cityName || currentUser?.city,
      stateCode: updatedProfile.stateCode || updatedProfile.state_code || currentUser?.stateCode,
      dotNumber: updatedProfile.dotNumber || updatedProfile.dot_number || currentUser?.dotNumber,
      insurancePolicy: updatedProfile.insurancePolicy || updatedProfile.insurance_policy || currentUser?.insurancePolicy
    };

    if (userId) updatedUser.id = userId;

    setCurrentUser(updatedUser);
    setCookie(SESSION_COOKIE_NAME, updatedUser, 30);

    if (userId) {
      try {
        const payload = {
          id: userId,
          email: updatedUser.email || '',
          full_name: updatedUser.name || updatedUser.fullName || '',
          role: updatedUser.role || 'driver',
          vehicle: updatedUser.vehicle || '',
          city: updatedUser.city || '',
          state_code: updatedUser.stateCode || '',
          phone: updatedUser.phone || '',
          dot_number: updatedUser.dotNumber || '',
          insurance_policy: updatedUser.insurancePolicy || '',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('profiles').upsert(payload);

        if (error) {
          console.error("Supabase profile save error:", error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err) {
        console.error("Supabase profile save catch:", err);
        return { success: false, error: err.message || "Failed to save profile" };
      }
    }
    return { success: true };
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth pages — no shared layout (own full-screen designs) */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />

        {/* Admin — has its own AdminLayout */}
        <Route path="/admin" element={<AdminLayout currentUser={currentUser} onLogout={handleLogout} />} />

        {/* All other pages — wrapped in shared Layout (Navbar + Footer) */}
        <Route element={<Layout currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} />}>
          <Route path="/" element={<HomePage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/pricing" element={<PricingPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/pro-checkout" element={<ProCheckoutPage currentUser={currentUser} onLogout={handleLogout} onUpgradePro={handleUpgradePro} />} />
          <Route path="/training" element={<TrainingListPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/training/:courseId" element={<CourseDetailPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/checkout/:courseId" element={<CheckoutPage currentUser={currentUser} onLogout={handleLogout} onCompletePurchase={handleCompletePurchase} />} />
          <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} onLogout={handleLogout} purchasedCourses={purchasedCourses} savedUserRoutes={savedUserRoutes} onUpdateProfile={handleUpdateProfile} onOpenPricing={handleOpenPricing} />} />
          <Route path="/profile" element={<ProfilePage currentUser={currentUser} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} onOpenPricing={handleOpenPricing} />} />
          <Route path="/notifications" element={<NotificationsPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/drivers" element={<DriversPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/companies" element={<CompaniesPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/planner" element={<PlannerPage currentUser={currentUser} onLogout={handleLogout} onSaveRoute={handleSaveUserRoute} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/dispatch-orders" element={<DispatchOrdersPage currentUser={currentUser} onLogout={handleLogout} />} />
          {/* <Route path="/growth" element={<GrowthPage currentUser={currentUser} onLogout={handleLogout} />} /> */}
          <Route path="/certification" element={<CertificationPage currentUser={currentUser} onLogout={handleLogout} />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* PRO Feature Gate Lock Modal Popup */}
      <ProFeatureGateModal
        isOpen={gateModalState.isOpen}
        onClose={() => setGateModalState(prev => ({ ...prev, isOpen: false }))}
        title={gateModalState.title}
        message={gateModalState.message}
        onGoToPricing={() => {
          setGateModalState(prev => ({ ...prev, isOpen: false }));
          navigate('/pricing');
        }}
      />
    </>
  );
}
