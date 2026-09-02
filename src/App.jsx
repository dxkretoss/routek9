import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
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
import ResetPasswordPage from './pages/ResetPasswordPage';
import MobileResetPasswordPage from './pages/MobileResetPasswordPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';

import { requestFcmToken, listenToForegroundMessages, showBrowserDesktopNotification, playNotificationSound } from './lib/firebase';
import { DEFAULT_DISPATCH_RADIUS_MILES, calculateDistanceMiles } from './lib/dispatchConfig';

import { US_STATES } from './data/statesData';
import { mockRoutes as initialRoutes } from './data/mockRoutes';
import { Truck, ShieldCheck, MapPin, DollarSign, Loader2, Bell, X } from 'lucide-react';
import { supabase, updateDriverLocation, notifyNearbyDriversOnNewOrder } from './lib/supabase';

// Cookie Helpers
const SESSION_COOKIE_NAME = 'routek9_user_session';
const COURSES_COOKIE_NAME = 'routek9_purchased_courses';

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return JSON.parse(decodeURIComponent(match[2]));
    const lsVal = localStorage.getItem(name);
    if (lsVal) return JSON.parse(lsVal);
  } catch (e) {
    console.warn("Cookie parse error:", e);
  }
  return null;
};

const setCookie = (name, value, days = 30) => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
    localStorage.setItem(name, JSON.stringify(value));
  } catch (e) {
    console.warn("Cookie set error:", e);
  }
};

const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    localStorage.removeItem(name);
  } catch (e) {
    console.warn("Cookie delete error:", e);
  }
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
          currentUser={currentUser}
        />

        {/* 7. Local Courier Directory Section */}
        <LocalCourierDirectorySection selectedState={selectedState} />

        {/* 8. Contract Readiness & Vehicle Qualifications — merged */}
        <ContractReadinessSection currentUser={currentUser} />

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
        let dbSucceeded = false;
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('course_id, status, user_id, email')
            .eq('user_id', currentUser.id)
            .limit(50);

          if (data && !error) {
            const courseIds = data
              .filter(tx => tx.status === 'Succeeded')
              .map(tx => tx.course_id)
              .filter(Boolean);
            setPurchasedCourses(courseIds);
            dbSucceeded = true;
          }
        } catch (err) {
          console.warn("Error loading purchased courses from DB:", err);
        }

        if (!dbSucceeded) {
          // Fallback to cookie only if DB query failed
          const cookieCourses = getCookie(COURSES_COOKIE_NAME) || [];
          setPurchasedCourses(cookieCourses);
        }
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
    // Sync dynamic vehicle types from Supabase
    supabase
      .from('vehicle_types')
      .select('*')
      .order('vehicle_name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          localStorage.setItem('routek9_vehicle_types', JSON.stringify(data));
        }
      });

    // 1. Check current session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const syncResult = await syncSupabaseProfile(session.user);
        if (syncResult?.role !== 'admin' && syncResult?.needsOnboarding && window.location.pathname !== '/complete-profile') {
          navigate('/complete-profile', { replace: true });
        }
      } else if (currentUser?.email || currentUser?.id) {
        syncSupabaseProfile({ id: currentUser.id, email: currentUser.email });
      }
    });

    const isMobileResetPage = typeof window !== 'undefined' && window.location.pathname === '/mobile-reset-password';
    const isWebResetPage = typeof window !== 'undefined' && window.location.pathname === '/resetpass';

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      if (!isWebResetPage && !isMobileResetPage) {
        navigate('/resetpass', { replace: true });
      }
    }

    // 2. Subscribe to auth state changes (Google OAuth login, Email confirmation, Sign in, Sign out, Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isMobileReset = typeof window !== 'undefined' && window.location.pathname === '/mobile-reset-password';
      const isWebReset = typeof window !== 'undefined' && window.location.pathname === '/resetpass';
      const isRecovery = event === 'PASSWORD_RECOVERY' || (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || isWebReset || isMobileReset));

      if (isMobileReset) {
        return;
      }

      if (isRecovery) {
        if (!isWebReset) {
          navigate('/resetpass', { replace: true });
        }
        return;
      }

      if (session?.user) {
        const syncResult = await syncSupabaseProfile(session.user);
        if (syncResult?.isActive) {
          const isRec = event === 'PASSWORD_RECOVERY' || (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || window.location.pathname === '/resetpass'));
          if (isRec) {
            if (!isMobileReset && !isWebReset) {
              navigate('/resetpass', { replace: true });
            }
            return;
          }
          const hasHash = typeof window !== 'undefined' && (
            window.location.hash.includes('access_token=') ||
            window.location.hash.includes('type=signup') ||
            window.location.hash.includes('type=recovery')
          );
          if (syncResult.needsOnboarding && syncResult.role !== 'admin') {
            if (window.location.pathname !== '/complete-profile') {
              if (window.location.hash) {
                window.history.replaceState(null, '', window.location.origin + '/complete-profile' + window.location.search);
              }
              navigate('/complete-profile', { replace: true });
            }
            return;
          }

          // Only auto-redirect on explicit SIGNED_IN event (user clicked login button / OAuth)
          // Do NOT auto-login/redirect from /login or /signup on INITIAL_SESSION from cookies/localStorage
          if (event === 'SIGNED_IN' || hasHash) {
            const currentPath = window.location.pathname;
            if (hasHash || currentPath === '/login' || currentPath === '/signup') {
              const role = (syncResult.role || '').toLowerCase();
              const isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin';
              const targetPath = isAdmin ? '/admin' : '/dashboard';
              if (window.location.hash) {
                window.history.replaceState(null, '', window.location.origin + targetPath + window.location.search);
              }
              navigate(targetPath, { replace: true });
            }
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
      const userEmail = (supabaseUser.email || '').trim().toLowerCase();
      const userIdStr = String(supabaseUser.id || '').toLowerCase();

      let profile = null;
      if (supabaseUser.id) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        profile = pData;
      }
      if (!profile && userEmail) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle();
        profile = pData;
      }

      // Deactivation Enforcement Check (from Supabase profile)
      const isDeactivated =
        profile?.status === 'INACTIVE' ||
        profile?.status === 'DEACTIVATED' ||
        profile?.is_active === false ||
        profile?.isactive === false;

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
        return { isActive: false, role: null };
      }

      const userRole = profile?.role || supabaseUser.user_metadata?.role || null;
      let userName = profile?.full_name || supabaseUser.user_metadata?.full_name || (userEmail ? userEmail.split('@')[0] : 'User');
      if (userName === 'Jane A. Driver' && userEmail && userEmail !== 'driver@routek9.com') {
        userName = supabaseUser.user_metadata?.full_name || userEmail.split('@')[0];
      }

      let isPro = Boolean(profile?.is_pro || profile?.ispro || profile?.isPro);
      let subscriptionPlan = isPro ? 'pro' : 'free';
      let subscribedAt = null;
      let nextRenewal = null;

      try {
        const { data: txs } = await supabase
          .from('transactions')
          .select('course_id, status, user_id, email, created_at, amount, description')
          .eq('user_id', profile?.id || currentUser?.id)
          .limit(20);

        if (txs && txs.length > 0) {
          const userSubs = txs.filter(tx =>
            tx.status === 'Succeeded' &&
            (tx.course_id === 'pro-monthly' || tx.course_id === 'pro-yearly' || tx.course_id?.includes('pro')) &&
            ((tx.user_id && String(tx.user_id).toLowerCase() === userIdStr) || (tx.email && userEmail && tx.email.toLowerCase() === userEmail))
          );

          if (userSubs.length > 0) {
            userSubs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const latestSub = userSubs[0];
            const createdTime = new Date(latestSub.created_at).getTime();
            const isYearly = latestSub.course_id === 'pro-yearly' || latestSub.description?.toLowerCase().includes('yearly') || latestSub.amount?.includes('299');
            const validityPeriod = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

            if (Date.now() - createdTime < validityPeriod) {
              isPro = true;
              subscriptionPlan = isYearly ? 'yearly' : 'pro';
              subscribedAt = new Date(createdTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              nextRenewal = new Date(createdTime + validityPeriod).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
          }
        }
      } catch (txErr) {
        console.warn("Transaction check notice during sync:", txErr);
      }

      setCurrentUser((prev) => {
        const isSameUser = prev && (String(prev.id) === String(supabaseUser.id) || String(prev.email || '').toLowerCase() === userEmail);

        const updated = {
          id: supabaseUser.id || profile?.id || (isSameUser ? prev?.id : null),
          name: profile?.full_name || userName,
          email: profile?.email || userEmail,
          role: userRole,
          vehicle: profile ? (profile.vehicle || '') : (isSameUser ? prev?.vehicle || '' : ''),
          stateCode: profile ? (profile.state_code || profile.stateCode || '') : (isSameUser ? prev?.stateCode || '' : ''),
          city: profile ? (profile.city || '') : (isSameUser ? prev?.city || '' : ''),
          phone: profile ? (profile.phone || '') : (isSameUser ? prev?.phone || '' : ''),
          dotNumber: profile ? (profile.dot_number || profile.dotNumber || '') : (isSameUser ? prev?.dotNumber || '' : ''),
          insurancePolicy: profile ? (profile.insurance_policy || profile.insurancePolicy || '') : (isSameUser ? prev?.insurancePolicy || '' : ''),
          experience: profile ? (profile.experience || '') : (isSameUser ? prev?.experience || '' : ''),
          availability: profile ? (profile.availability || '') : (isSameUser ? prev?.availability || '' : ''),
          hasCDL: profile?.has_cdl !== undefined ? profile.has_cdl : (isSameUser ? prev?.hasCDL || false : false),
          readyToWork: (profile?.ready_to_work === true || profile?.readyToWork === true),
          websiteUrl: profile ? (profile.website_url || profile.website || '') : (isSameUser ? prev?.websiteUrl || '' : ''),
          avatarUrl: profile ? (profile.avatar_url || profile.avatarUrl || '') : (isSameUser ? prev?.avatarUrl || '' : ''),
          bio: profile ? (profile.bio || '') : (isSameUser ? prev?.bio || '' : ''),
          latitude: profile?.latitude !== undefined && profile?.latitude !== null ? profile.latitude : (isSameUser ? prev?.latitude || null : null),
          longitude: profile?.longitude !== undefined && profile?.longitude !== null ? profile.longitude : (isSameUser ? prev?.longitude || null : null),
          isPro: isPro || (isSameUser ? prev?.isPro || false : false),
          subscriptionPlan: subscriptionPlan || (isSameUser ? prev?.subscriptionPlan || 'free' : 'free'),
          subscribedAt: subscribedAt || (isSameUser ? prev?.subscribedAt || null : null),
          nextRenewal: nextRenewal || (isSameUser ? prev?.nextRenewal || null : null)
        };
        setCookie(SESSION_COOKIE_NAME, updated, 30);
        return updated;
      });
      // Check if user has completed onboarding details in DB profiles table
      const profileExistsInDb = Boolean(profile && profile.id);
      const dbRole = profile?.role || null;
      const dbOnboarded = profile?.onboarding_completed === true;
      const hasCompletedDetails = Boolean(profile?.phone && (profile?.city || profile?.state_code));

      // User is onboarded if:
      // 1) profile.onboarding_completed === true
      // 2) OR profile has phone & city/state filled out
      // 3) OR profile is admin
      const isAlreadyOnboarded = Boolean(
        profileExistsInDb && (
          dbOnboarded ||
          hasCompletedDetails ||
          dbRole === 'admin'
        )
      );

      const isAdminUser = dbRole === 'admin' || supabaseUser.user_metadata?.role === 'admin';
      const needsOnboarding = !isAdminUser && !isAlreadyOnboarded;

      // Automatically capture GPS location and request FCM push token
      if (supabaseUser?.id) {
        captureUserLocation(supabaseUser.id);
        requestFcmToken(supabaseUser.id);
      }

      return { isActive: true, role: dbRole || userRole, needsOnboarding };
    } catch (err) {
      console.error("Error syncing Supabase user profile:", err);
      return { isActive: false, role: null, needsOnboarding: false };
    }
  };

  const handleTriggerGateModal = ({ title, message }) => {
    setGateModalState({
      isOpen: true,
      title: title || "Unlock Route K9 PRO",
      message: message || "This feature requires an active Route K9 PRO Membership."
    });
  };

  // Initialize Firebase Cloud Messaging push listeners on mount
  useEffect(() => {
    let unsubscribe = null;
    listenToForegroundMessages((payload) => {
      // If user session is active, the Supabase real-time notification stream is already handling delivery
      if (currentUser?.id) return;

      const title = payload.notification?.title || payload.data?.title || 'RouteK9 Notification';
      const body = payload.notification?.body || payload.data?.body || 'You have a new update in RouteK9.';
      const url = payload.data?.url || payload.data?.click_action || null;
      const orderRef = payload.data?.orderRef || null;
      playNotificationSound();
      showBrowserDesktopNotification(title, { body, url, tag: orderRef ? `order-${orderRef}` : undefined });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.id]);

  // Request FCM Push permission and automatically sync live GPS coordinates to Supabase profiles
  useEffect(() => {
    if (currentUser?.id) {
      requestFcmToken(currentUser.id);
      captureUserLocation(currentUser.id);
    }
  }, [currentUser?.id]);

  // Real-time notifications listener for active logged-in user (triggers native browser desktop notification)
  useEffect(() => {
    if (!currentUser?.id) return;

    const notifChannel = supabase
      .channel(`user-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        async (payload) => {
          if (payload.new) {
            const title = payload.new.title || 'RouteK9 Notification';
            const body = payload.new.message || 'You have a new update in RouteK9.';
            const url = payload.new.action_url || '/dashboard?tab=inbox';

            // Extract order reference for universal single-trigger guarantee
            const combinedText = `${title} ${body}`;
            const orderMatch = combinedText.match(/RK-[A-Za-z0-9]+|ORD-[A-Za-z0-9]+/i);
            const dedupKey = orderMatch ? `order-${orderMatch[0].toUpperCase()}` : `notif-${payload.new.id}`;

            const now = Date.now();
            try {
              const lastKey = `routek9_alert_barrier_${dedupKey}`;
              const prev = localStorage.getItem(lastKey);
              if (prev && (now - Number(prev) < 30000)) {
                console.log('[Notification Guard] Suppressed duplicate alert/sound for:', dedupKey);
                return;
              }
              localStorage.setItem(lastKey, String(now));
            } catch (e) {}

            // Strict live proximity check against driver's browser coordinates (e.g. India)
            if (currentUser?.latitude && currentUser?.longitude && payload.new.category === 'Dispatch') {
              const uLat = typeof currentUser.latitude === 'number' ? currentUser.latitude : parseFloat(String(currentUser.latitude));
              const uLng = typeof currentUser.longitude === 'number' ? currentUser.longitude : parseFloat(String(currentUser.longitude));
              
              if (!isNaN(uLat) && !isNaN(uLng)) {
                const orderRef = orderMatch ? orderMatch[0].toUpperCase() : null;
                if (orderRef) {
                  try {
                    const { data: orderRow } = await supabase
                      .from('customer_orders')
                      .select('pickup_lat, pickup_latitude, pickup_lng, pickup_longitude')
                      .or(`order_ref.eq.${orderRef},id.eq.${orderRef.replace('ORD-', '')}`)
                      .maybeSingle();

                    if (orderRow) {
                      const pLat = orderRow.pickup_lat || orderRow.pickup_latitude;
                      const pLng = orderRow.pickup_lng || orderRow.pickup_longitude;
                      const dist = calculateDistanceMiles(uLat, uLng, pLat, pLng);
                      if (dist !== null && dist > DEFAULT_DISPATCH_RADIUS_MILES) {
                        console.log(`[Notification Guard] Suppressed distant alert (${dist.toFixed(1)} mi > ${DEFAULT_DISPATCH_RADIUS_MILES} mi limit)`);
                        return;
                      }
                    }
                  } catch (e) {}
                }
              }
            }

            playNotificationSound();
            showBrowserDesktopNotification(title, { body, url, tag: dedupKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [currentUser?.id]);

  // Global real-time listener for newly placed customer orders to notify nearby drivers
  // Uses web navigator.locks so that even if the driver has 10 browser tabs open, ONLY 1 TAB processes the order
  useEffect(() => {
    const ordersChannel = supabase
      .channel('global-customer-orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_orders'
        },
        async (payload) => {
          if (payload.new) {
            const orderId = payload.new.id || payload.new.order_ref;
            if (typeof navigator !== 'undefined' && 'locks' in navigator) {
              navigator.locks.request(`routek9-notify-${orderId}`, { ifAvailable: true }, async (lock) => {
                if (!lock) return; // Another open tab is already handling this order
                console.log('[Orders] Processing new customer order broadcast:', orderId);
                // Dispatch only to nearby drivers within default dispatch radius
                await notifyNearbyDriversOnNewOrder(payload.new, DEFAULT_DISPATCH_RADIUS_MILES);
              });
            } else {
              await notifyNearbyDriversOnNewOrder(payload.new, DEFAULT_DISPATCH_RADIUS_MILES);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const captureUserLocation = (userId) => {
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, latitude: lat, longitude: lng };
            setCookie(SESSION_COOKIE_NAME, updated, 30);
            return updated;
          });

          if (userId) {
            await updateDriverLocation(userId, lat, lng);
          }
        },
        (error) => {
          console.warn("Geolocation prompt notice:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
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
    captureUserLocation(session?.id);
    if (session?.id) {
      requestFcmToken(session.id);
    }
  };

  const handleLogout = async () => {
    const wasAdmin = (currentUser?.role === 'admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout warning:", e);
    }
    setCurrentUser(null);
    deleteCookie(SESSION_COOKIE_NAME);
    deleteCookie(COURSES_COOKIE_NAME);
    if (wasAdmin) {
      navigate('/admin', { replace: true });
    } else {
      navigate('/');
    }
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
          experience: updatedUser.experience || '',
          availability: updatedUser.availability || '',
          has_cdl: updatedUser.hasCDL !== undefined ? updatedUser.hasCDL : false,
          ready_to_work: updatedUser.readyToWork !== undefined ? updatedUser.readyToWork : false,
          website_url: updatedUser.websiteUrl || updatedUser.website || '',
          avatar_url: updatedUser.avatarUrl || updatedUser.avatar_url || updatedUser.avatar || '',
          bio: updatedUser.bio || '',
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

  const isResetFlowPage = typeof window !== 'undefined' && (
    window.location.pathname === '/mobile-reset-password' ||
    window.location.pathname === '/resetpass'
  );

  const hasAuthHash = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('type=signup') ||
    window.location.hash.includes('type=recovery')
  );

  if (!currentUser && hasAuthHash && !isResetFlowPage) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shadow-xl">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-black font-serif-heading">Verifying Email & Authenticating...</h2>
          <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-sm">
            Please wait a moment while we confirm your email and load your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth pages — no shared layout (own full-screen designs) */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
        <Route path="/resetpass" element={<ResetPasswordPage />} />
        <Route path="/mobile-reset-password" element={<MobileResetPasswordPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage currentUser={currentUser} onComplete={(updated) => { setCurrentUser(updated); setCookie(SESSION_COOKIE_NAME, updated, 30); }} />} />

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
          <Route path="/notifications" element={<Navigate to="/dashboard?tab=inbox" replace />} />
          <Route path="/drivers" element={<DriversPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/companies" element={<CompaniesPage currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/planner" element={<PlannerPage currentUser={currentUser} onLogout={handleLogout} onSaveRoute={handleSaveUserRoute} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />} />
          <Route path="/dispatch-orders" element={<DispatchOrdersPage currentUser={currentUser} onLogout={handleLogout} />} />
          {/* <Route path="/growth" element={<GrowthPage currentUser={currentUser} onLogout={handleLogout} />} /> */}
          <Route path="/certification" element={<CertificationPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/terms" element={<TermsPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/terms-and-conditions" element={<TermsPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/privacy" element={<PrivacyPage currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/privacy-policy" element={<PrivacyPage currentUser={currentUser} onLogout={handleLogout} />} />
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
