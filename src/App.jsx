import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import PricingPage from './pages/PricingPage';
import ProCheckoutPage from './pages/ProCheckoutPage';

import { US_STATES } from './data/statesData';
import { mockRoutes as initialRoutes } from './data/mockRoutes';
import { Truck, ShieldCheck, MapPin, DollarSign } from 'lucide-react';

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

  const handleSearchSubmit = () => {
    if (searchQuery) {
      const matchingState = Object.values(US_STATES).find(
        (st) =>
          st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.code.toLowerCase() === searchQuery.toLowerCase()
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans antialiased selection:bg-rose-600 selection:text-white">

      {/* Clean Navbar Header */}
      <Navbar currentUser={currentUser} onLogout={onLogout} onOpenPricing={onOpenPricing} />

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

      {/* Footer */}
      <Footer onSelectState={handleSelectState} />

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

    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  // Read initial user from session cookie (DEFAULT IS NULL - LOGGED OUT!)
  const [currentUser, setCurrentUser] = useState(() => getCookie(SESSION_COOKIE_NAME) || null);
  const [purchasedCourses, setPurchasedCourses] = useState(() => getCookie(COURSES_COOKIE_NAME) || []);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // PRO Feature Gate Popup State
  const [gateModalState, setGateModalState] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

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

  const handleLogout = () => {
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
    const updated = Array.from(new Set([...purchasedCourses, courseId]));
    setPurchasedCourses(updated);
    setCookie(COURSES_COOKIE_NAME, updated, 60);

    if (currentUser) {
      const updatedUser = { ...currentUser, name: certName || currentUser.name };
      setCurrentUser(updatedUser);
      setCookie(SESSION_COOKIE_NAME, updatedUser, 30);
    }
  };

  const handleUpdateProfile = (updatedProfile) => {
    const updatedUser = { ...currentUser, ...updatedProfile };
    setCurrentUser(updatedUser);
    setCookie(SESSION_COOKIE_NAME, updatedUser, 30);
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
        <Route path="/pricing" element={<PricingPage currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/pro-checkout" element={<ProCheckoutPage currentUser={currentUser} onLogout={handleLogout} onUpgradePro={handleUpgradePro} />} />
        <Route path="/training" element={<TrainingListPage currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/training/:courseId" element={<CourseDetailPage currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/checkout/:courseId" element={<CheckoutPage currentUser={currentUser} onLogout={handleLogout} onCompletePurchase={handleCompletePurchase} />} />
        <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} onLogout={handleLogout} purchasedCourses={purchasedCourses} onUpdateProfile={handleUpdateProfile} onOpenPricing={handleOpenPricing} />} />
        <Route path="/profile" element={<ProfilePage currentUser={currentUser} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} onOpenPricing={handleOpenPricing} />} />
        <Route path="/notifications" element={<NotificationsPage currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/drivers" element={<DriversPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
        <Route path="/companies" element={<CompaniesPage currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/planner" element={<PlannerPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
        {/* <Route path="/growth" element={<GrowthPage currentUser={currentUser} onLogout={handleLogout} />} /> */}
        <Route path="/certification" element={<CertificationPage currentUser={currentUser} onLogout={handleLogout} />} />
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
