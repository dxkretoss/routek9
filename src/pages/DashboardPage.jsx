import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;
import { COURSES_DATA } from '../data/coursesData';
import { supabase } from '../lib/supabase';
import {
  Award,
  BookOpen,
  Download,
  ShieldCheck,
  Truck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Lock,
  User,
  Settings,
  Bell,
  Mail,
  Save,
  KeyRound,
  FileText,
  Clock,
  Sparkles,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ChevronDown,
  MapPin,
  ExternalLink
} from 'lucide-react';

const MOCK_INBOX_MESSAGES = [
  {
    id: 1,
    sender: "RouteK9 Contract Dispatch",
    title: "New VA Medical Specimen Contract in Baltimore, MD",
    snippet: "Solicitation #36C24524Q0189 match for your Cargo Van profile.",
    time: "2 hours ago",
    unread: true,
    category: "Contract Alert"
  },
  {
    id: 2,
    sender: "Master Contractor Masterclass",
    title: "Course Certificate Issued & Ready for Download",
    snippet: "Congratulations! Your official RouteK9 completion certificate has been verified.",
    time: "Yesterday",
    unread: false,
    category: "Training"
  },
  {
    id: 3,
    sender: "SAM.gov Federal Feed",
    title: "NAICS 492110 Weekly Opportunity Digest",
    snippet: "5 new federal courier bids posted in Texas and Nevada region.",
    time: "3 days ago",
    unread: false,
    category: "Gov Digest"
  }
];

export default function DashboardPage({ currentUser, onLogout, purchasedCourses = [], savedUserRoutes: propSavedRoutes = [], onUpdateProfile, onOpenPricing }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Protected Route Guard: If user is deactivated or logged out, redirect immediately to /login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Helper to determine initial active tab from URL query params
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (searchParams.has('changepass') || tabParam === 'changepass' || tabParam === 'settings') {
      return 'settings';
    }
    if (tabParam === 'inbox') return 'inbox';
    if (tabParam === 'profile') return 'profile';
    if (tabParam === 'routes') return 'routes';
    return 'courses';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [savedUserRoutes, setSavedUserRoutes] = useState(propSavedRoutes);
  const [routeStatuses, setRouteStatuses] = useState({});

  // Sync propSavedRoutes into state when prop changes
  useEffect(() => {
    if (propSavedRoutes && propSavedRoutes.length > 0) {
      setSavedUserRoutes(prev => {
        const map = new Map();
        propSavedRoutes.forEach(item => map.set(item.id, item));
        prev.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        return Array.from(map.values());
      });
    }
  }, [propSavedRoutes]);

  // Fetch saved routes dynamically from Supabase database
  useEffect(() => {
    async function loadSupabaseRoutes() {
      try {
        const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            title: r.title || 'Saved Courier Route',
            driverName: r.driver_name || 'Driver',
            stopsCount: r.stops_count || (r.stops_data ? r.stops_data.length : 0),
            distanceMiles: r.distance_miles || 0,
            durationMinutes: r.duration_minutes || 0,
            status: r.status || 'ACTIVE',
            stops: r.stops_data || [],
            createdAt: r.created_at
          }));

          setSavedUserRoutes(prev => {
            const map = new Map();
            formatted.forEach(item => map.set(item.id, item));
            prev.forEach(item => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("Could not fetch Supabase routes:", err);
      }
    }
    loadSupabaseRoutes();
  }, []);

  // Sync activeTab if URL searchParams change
  useEffect(() => {
    if (searchParams.has('changepass') || searchParams.get('tab') === 'changepass' || searchParams.get('tab') === 'settings') {
      setActiveTab('settings');
    } else if (searchParams.get('tab') === 'inbox') {
      setActiveTab('inbox');
    } else if (searchParams.get('tab') === 'profile') {
      setActiveTab('profile');
    } else if (searchParams.get('tab') === 'routes') {
      setActiveTab('routes');
    } else if (searchParams.get('tab') === 'courses') {
      setActiveTab('courses');
    }
  }, [searchParams]);

  // Handler to switch tabs and update URL parameters
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setSearchParams({ tab: 'changepass' }, { replace: true });
    } else if (tab === 'courses') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tab }, { replace: true });
    }
  };

  // Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Profile State
  const [fullName, setFullName] = useState(currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : ''));
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [accountRole, setAccountRole] = useState(currentUser?.role || 'driver'); // 'driver' or 'company'
  const [vehicleClass, setVehicleClass] = useState(currentUser?.vehicle || 'Cargo Van');
  const [stateCode, setStateCode] = useState(currentUser?.stateCode || '');
  const [cityName, setCityName] = useState(currentUser?.city || '');
  const [dotNumber, setDotNumber] = useState(currentUser?.dotNumber || '');
  const [insurancePolicy, setInsurancePolicy] = useState(currentUser?.insurancePolicy || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [downloadToast, setDownloadToast] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : ''));
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAccountRole(currentUser.role || 'driver');
      setVehicleClass(currentUser.vehicle || 'Cargo Van');
      setStateCode(currentUser.stateCode || '');
      setCityName(currentUser.city || '');
      setDotNumber(currentUser.dotNumber || '');
      setInsurancePolicy(currentUser.insurancePolicy || '');
    }
  }, [currentUser]);

  const enrolledCourses = COURSES_DATA.filter((c) => purchasedCourses.includes(c.id));

  const handleDownloadCertificate = (courseTitle) => {
    setDownloadToast(`📜 Downloading RouteK9 Completion Certificate for "${courseTitle}"`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // 1. Validation: Field presence check
    if (!currentPassword || !currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || !newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (!confirmPassword || !confirmPassword.trim()) {
      setPasswordError("Please confirm your new password.");
      return;
    }

    // 2. Validation: Length check
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    // 3. Validation: Match check
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match!");
      return;
    }

    // 4. Validation: Same as current check
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    try {
      setPasswordLoading(true);

      // 5. Verify current password via Supabase Auth re-authentication
      const { data: { user } } = await supabase.auth.getUser();
      const targetEmail = user?.email || currentUser?.email;

      if (targetEmail) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: currentPassword
        });

        if (verifyErr) {
          setPasswordError("Current password is incorrect. Please verify your password.");
          setPasswordLoading(false);
          return;
        }
      }

      // 6. Update password in Supabase Auth
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        throw updateErr;
      }

      // 7. Reset form & display success message
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);

    if (onUpdateProfile) {
      const res = await onUpdateProfile({
        name: fullName,
        email,
        phone,
        role: accountRole,
        vehicle: vehicleClass,
        stateCode,
        city: cityName,
        dotNumber,
        insurancePolicy
      });

      if (res && res.success === false) {
        setPasswordError(res.error || "Failed to update profile.");
      } else {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 4000);
      }
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    }
  };

  return (
    <>
      {/* Floating Toast Notifications */}
      {downloadToast && (
        <Toast
          message={downloadToast}
          type="info"
          duration={4000}
          onClose={() => setDownloadToast(null)}
        />
      )}
      {passwordError && (
        <Toast
          message={passwordError}
          type="error"
          duration={5000}
          onClose={() => setPasswordError(null)}
        />
      )}
      {passwordSuccess && (
        <Toast
          message="Password updated successfully!"
          type="success"
          duration={4000}
          onClose={() => setPasswordSuccess(false)}
        />
      )}
      {profileSuccess && (
        <Toast
          message="Dashboard profile saved successfully!"
          type="success"
          duration={4000}
          onClose={() => setProfileSuccess(false)}
        />
      )}

      {/* Hero Welcome Header */}
      <section className="bg-[#0b132b] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{accountRole === 'company' ? 'Company Member Dashboard' : 'Driver Member Dashboard'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
            Welcome back, <span className="text-rose-500">{fullName}</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl">
            Access your purchased training courses, inbox notifications, security settings, and driver authority profile.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
              <div className="text-2xl font-extrabold text-white">{enrolledCourses.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Purchased Courses</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
              <div className="text-2xl font-extrabold text-emerald-400">{MOCK_INBOX_MESSAGES.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Inbox Messages</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
              <div className="text-2xl font-extrabold text-rose-400">12,400+</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Active Routes Access</div>
            </div>

            <button
              onClick={onOpenPricing}
              className="bg-white/10 hover:bg-white/15 border border-white/20 p-3.5 rounded-2xl text-center transition-all cursor-pointer group text-left sm:text-center"
            >
              <div className="text-xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{currentUser?.isPro ? 'PRO Member' : 'Free Member'}</span>
              </div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase mt-0.5 underline group-hover:text-amber-300">
                {currentUser?.isPro ? 'Manage Plan →' : 'Upgrade to PRO ($29) →'}
              </div>
            </button>
          </div>

          {/* Active PRO Membership Summary Strip */}
          {currentUser?.isPro && (
            <div className="pt-2">
              <div className="bg-amber-400/10 border border-amber-400/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-300">Route K9 PRO Active: </span>
                    <span className="text-slate-300">Subscribed on {currentUser.subscribedAt || 'July 29, 2026'} • Next Renewal: {currentUser.nextRenewal || 'August 29, 2026'}</span>
                  </div>
                </div>

                <button
                  onClick={onOpenPricing}
                  className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-extrabold text-[11px] border border-amber-400/40 transition-colors shrink-0 cursor-pointer"
                >
                  Subscription Details →
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <div className="sticky top-20 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">

          <button
            onClick={() => handleTabChange('courses')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'courses'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Purchased Courses ({enrolledCourses.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('routes')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'routes'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Planned Routes ({savedUserRoutes.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('inbox')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'inbox'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox ({MOCK_INBOX_MESSAGES.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'settings'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Lock className="w-4 h-4" />
            <span>Change Password & Settings</span>
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'profile'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            {accountRole === 'company' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
            <span>{accountRole === 'company' ? 'Company Profile' : 'Driver Profile'}</span>
          </button>

        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* TAB 1: Purchased Courses */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    Purchased Courses & Certificates
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Self-paced training with downloadable RouteK9 completion certificates.
                  </p>
                </div>

                <Link
                  to="/training"
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <span>Browse All Courses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center space-y-4">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-[#0b132b]">No purchased courses yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Explore our self-paced courier training courses to scale your delivery business, earn certifications, and win prime contracts.
                  </p>
                  <Link
                    to="/training"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
                  >
                    <span>Explore Training Library ($49)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                            Active Enrollment • 100% Progress
                          </span>
                          <Award className="w-6 h-6 text-amber-500" />
                        </div>

                        <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                          {course.title}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {course.subtitle}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          onClick={() => handleDownloadCertificate(course.title)}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Certificate</span>
                        </button>

                        <Link
                          to={`/training/${course.id}`}
                          className="text-xs font-extrabold text-slate-700 hover:text-rose-600 transition-colors"
                        >
                          Review Lessons →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: My Saved & Planned Routes */}
          {activeTab === 'routes' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    My Saved & Planned Routes
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Routes optimized in Route Planner and tracked in your driver account.
                  </p>
                </div>

                <Link
                  to="/planner"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>+ Plan New Route</span>
                </Link>
              </div>

              {savedUserRoutes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-16 text-center space-y-4 shadow-sm">
                  <Truck className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-lg font-bold text-[#0b132b]">No planned routes saved yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                    Use our AI-powered Route Planner to add stop addresses, optimize your route, and click "Save Route".
                  </p>
                  <Link
                    to="/planner"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <span>Go to Route Planner →</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedUserRoutes.map(route => (
                    <div key={route.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              {route.id}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">{route.title}</h4>
                          </div>
                          {/* Status dropdown (only when logged in) */}
                          {currentUser && (
                            <div className="relative">
                              <select
                                value={routeStatuses[route.id] || route.status || 'ACTIVE'}
                                onChange={e => setRouteStatuses(prev => ({ ...prev, [route.id]: e.target.value }))}
                                className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none ${(routeStatuses[route.id] || route.status) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    (routeStatuses[route.id] || route.status) === 'ONGOING' ? 'bg-amber-50  text-amber-700  border-amber-200' :
                                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="ONGOING">Ongoing</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                              <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                            </div>
                          )}
                        </div>

                        {/* Stats Badges */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Stops</span>
                            <span className="font-extrabold text-[#0b132b]">{route.stopsCount} stops</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance</span>
                            <span className="font-extrabold text-[#0b132b]">{route.distanceMiles} mi</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Drive Time</span>
                            <span className="font-extrabold text-[#0b132b]">{route.durationMinutes} min</span>
                          </div>
                        </div>

                        {/* Stops List */}
                        {route.stops && route.stops.length > 0 && (
                          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stops List:</span>
                            <ul className="space-y-1 max-h-28 overflow-y-auto">
                              {route.stops.map((s, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold">{s.step || idx + 1}</span>
                                  <span className="truncate">{s.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Saved on {new Date(route.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/planner?load=${route.id}`}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View in Planner</span>
                          </Link>
                          <a
                            href={`https://www.google.com/maps/dir/${route.stops ? route.stops.map(s => encodeURIComponent(s.label)).join('/') : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>GPS Maps</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Inbox & Notifications */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    Inbox & Platform Alerts
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Contract notifications, SAM.gov opportunity matches, and dispatcher updates.
                  </p>
                </div>

                <Link
                  to="/notifications"
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {MOCK_INBOX_MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${msg.unread ? 'bg-rose-50/20' : 'hover:bg-slate-50/50'
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                          {msg.category}
                        </span>
                        {msg.unread && (
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                        )}
                        <span className="text-xs font-bold text-slate-900">{msg.sender}</span>
                      </div>
                      <h4 className="text-base font-bold text-[#0b132b] font-serif-heading">
                        {msg.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {msg.snippet}
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 font-semibold shrink-0">
                      {msg.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Change Password & Security Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                  Security & Password Settings
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Change your password and manage notification preferences.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-lg space-y-6">

                {passwordSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password updated successfully in Supabase!</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4" autoComplete="off">
                  {/* Dummy inputs to prevent browser aggressive autofill */}
                  <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />
                  <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="new-password" />

                  {/* Current Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        name="settings_current_pw_nofill"
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        name="settings_new_pw_nofill"
                        required
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        name="settings_confirm_pw_nofill"
                        required
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-75 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Notifications Toggles */}
                {/* <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="text-sm font-bold text-[#0b132b]">Notification Preferences</h4>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-700 font-semibold">Email Contract Match Digest</span>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-700 font-semibold">SMS Instant Dispatch Alerts</span>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                </div> */}

              </div>
            </div>
          )}

          {/* TAB 4: Driver & Fleet Profile */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                  {accountRole === 'company' ? 'Company & Fleet Profile' : 'Driver & Authority Profile'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Manage your credentials, operating authority details, and account classification.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-lg space-y-8">

                {profileSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{accountRole === 'company' ? 'Company profile updated successfully!' : 'Driver profile updated successfully!'}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">

                  {/* Account Member Type Selector */}
                  {/* <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Account Member Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountRole('driver')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          accountRole === 'driver'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Driver Member</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountRole('company')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          accountRole === 'company'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Company Member</span>
                      </button>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {accountRole === 'company' ? 'Company / Business Name' : 'Full Name (Certificate & Bids)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number & USDOT / MC Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Phone Number
                      </label>
                      <div className="relative">
                        <PhoneInput
                          country={'us'}
                          value={phone}
                          onChange={(val) => setPhone(val)}
                          inputStyle={{
                            width: '100%',
                            height: '46px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.75rem',
                            paddingLeft: '48px',
                            color: '#1e293b'
                          }}
                          buttonStyle={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            borderTopLeftRadius: '0.75rem',
                            borderBottomLeftRadius: '0.75rem',
                            paddingLeft: '4px'
                          }}
                          dropdownStyle={{
                            borderRadius: '0.75rem',
                            zIndex: 1000
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        USDOT / MC Number (Optional)
                      </label>
                      <div className="relative">
                        {/* <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /> */}
                        <input
                          type="text"
                          value={dotNumber}
                          onChange={(e) => setDotNumber(e.target.value)}
                          placeholder="e.g. 3849120"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Vehicle Class & Home State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Primary Vehicle Class
                      </label>
                      <select
                        value={vehicleClass}
                        onChange={(e) => setVehicleClass(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                        <option value="Minivan / SUV">Minivan / SUV</option>
                        <option value="Cargo Van">Cargo Van</option>
                        <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                        <option value="16ft Box Truck">16ft Box Truck</option>
                        <option value="26ft Box Truck">26ft Box Truck</option>
                        <option value="Company Fleet">Company Fleet / Multi-Vehicle</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Home State
                      </label>
                      <input
                        type="text"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Operating Metro / City
                      </label>
                      <input
                        type="text"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Insurance & Compliance Policy
                    </label>
                    <input
                      type="text"
                      value={insurancePolicy}
                      onChange={(e) => setInsurancePolicy(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{accountRole === 'company' ? 'Save Company Profile' : 'Save Driver Profile'}</span>
                  </button>

                </form>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0b132b] text-white shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-slideUp">
          <Download className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}
    </>
  );
}
