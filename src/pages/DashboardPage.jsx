import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;
import { getCourses } from '../lib/courses';
import { supabase, fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotificationRecord } from '../lib/supabase';
import {
  Award,
  BookOpen,
  Download,
  ShieldCheck,
  Truck,
  Building2,
  CheckCircle2,
  CheckCheck,
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
  AlertTriangle,
  Camera,
  Upload,
  Trash2,
  ChevronDown,
  MapPin,
  ExternalLink,
  Users,
  UserCheck,
  Filter,
  RotateCcw,
  X
} from 'lucide-react';



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
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [savedUserRoutes, setSavedUserRoutes] = useState(propSavedRoutes);
  const [routeStatuses, setRouteStatuses] = useState({});
  const [activeDriverModal, setActiveDriverModal] = useState(null);

  function getFriendlyZoneName(stop, stopsList = []) {
    if (!stop) return '';
    if (stop.zoneName) return stop.zoneName;
    if (!stop.zoneId) return '';
    if (stop.zoneId.startsWith('zone-')) {
      return stop.zoneId.replace('zone-', 'Zone ');
    }
    const uniqueZoneIds = Array.from(new Set(stopsList.map(s => s.zoneId).filter(Boolean)));
    const index = uniqueZoneIds.indexOf(stop.zoneId);
    return index >= 0 ? `Zone ${index + 1}` : 'Zone';
  }

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

  // Fetch saved routes dynamically from Supabase database for this user only
  useEffect(() => {
    async function loadSupabaseRoutes() {
      if (!currentUser?.id) return;
      try {
        const isCompany = currentUser?.role === 'company' || currentUser?.role === 'Company';
        let query = supabase.from('routes').select('*');

        if (isCompany) {
          query = query.or(`user_id.eq.${currentUser.id},company_id.eq.${currentUser.id}`);
        } else {
          query = query.eq('user_id', currentUser.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

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
  const [experience, setExperience] = useState(currentUser?.experience || '1-3 Years');
  const [availability, setAvailability] = useState(currentUser?.availability || 'Immediate');
  const [hasCDL, setHasCDL] = useState(currentUser?.hasCDL || false);
  const [readyToWork, setReadyToWork] = useState(currentUser?.readyToWork ?? true);
  const [websiteUrl, setWebsiteUrl] = useState(currentUser?.websiteUrl || currentUser?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.avatar_url || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [downloadToast, setDownloadToast] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile completion calculation for Driver and Company accounts
  const requiredProfileFields = accountRole === 'company'
    ? [fullName, email, phone, stateCode, cityName, vehicleClass, websiteUrl, bio]
    : [fullName, email, phone, vehicleClass, stateCode, cityName, experience, bio];
  const filledProfileFields = requiredProfileFields.filter(f => f && String(f).trim().length > 0).length;
  const profileCompletionPercentage = Math.round((filledProfileFields / requiredProfileFields.length) * 100);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : ''));
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAccountRole(currentUser.role || 'driver');
      setVehicleClass(currentUser.vehicle || (currentUser.role === 'company' ? 'Medical Specimen, Scheduled Routes' : 'Cargo Van'));
      setStateCode(currentUser.stateCode || '');
      setCityName(currentUser.city || '');
      setDotNumber(currentUser.dotNumber || '');
      setInsurancePolicy(currentUser.insurancePolicy || '');
      setExperience(currentUser.experience || '1-3 Years');
      setAvailability(currentUser.availability || 'Immediate');
      setHasCDL(currentUser.hasCDL || false);
      setReadyToWork(currentUser.readyToWork ?? true);
      setWebsiteUrl(currentUser.websiteUrl || currentUser.website || '');
      setAvatarUrl(currentUser.avatarUrl || currentUser.avatar_url || '');
      setBio(currentUser.bio || '');
    }
  }, [currentUser]);

  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Dynamic Company Fleet Drivers State
  const getInitialFleetDrivers = () => {
    try {
      const stored = localStorage.getItem(`rk9_company_fleet_${currentUser?.id || 'default'}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Error reading fleet drivers from localStorage:", e);
    }
    return [];
  };

  const [fleetDrivers, setFleetDrivers] = useState(getInitialFleetDrivers);
  const [connectedCompanies, setConnectedCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverForm, setNewDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle: 'Cargo Van',
    city: 'Houston',
    state: 'TX',
    cdl: false
  });

  // Load Connected Companies for Driver
  const fetchDriverConnectedCompanies = async () => {
    if (!currentUser) return;
    setLoadingCompanies(true);
    try {
      const userEmail = (currentUser.email || '').trim().toLowerCase();

      let query = supabase
        .from('company_drivers')
        .select('*')
        .eq('status', 'ACTIVE');

      if (currentUser.id) {
        query = query.or(`driver_id.eq.${currentUser.id},email.ilike.${userEmail}`);
      } else {
        query = query.ilike('email', userEmail);
      }

      const { data: driverRecords, error } = await query;
      if (!error && driverRecords && driverRecords.length > 0) {
        const companyIds = Array.from(new Set(driverRecords.map(r => r.company_id).filter(Boolean)));

        const { data: companyProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', companyIds);

        const profileMap = (companyProfiles || []).reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});

        const connected = driverRecords.map(r => {
          const comp = profileMap[r.company_id] || {};
          return {
            recordId: r.id,
            companyId: r.company_id,
            companyName: comp.full_name || comp.company_name || 'Logistics Company',
            companyEmail: comp.email || '',
            companyPhone: comp.phone || r.phone || '',
            city: comp.city || r.city || 'Houston',
            state: comp.state_code || r.state_code || 'TX',
            contractTypes: comp.contract_types || comp.vehicle || 'Courier & Freight',
            joinedAt: r.created_at
          };
        });

        setConnectedCompanies(connected);
      } else {
        setConnectedCompanies([]);
      }
    } catch (err) {
      console.warn("Could not fetch connected companies for driver:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchDriverConnectedCompanies();

    const handleFleetSync = () => {
      fetchDriverConnectedCompanies();
    };

    window.addEventListener('rk9_fleet_updated', handleFleetSync);
    return () => {
      window.removeEventListener('rk9_fleet_updated', handleFleetSync);
    };
  }, [currentUser?.id, currentUser?.email]);

  const [endContractModalCompany, setEndContractModalCompany] = useState(null);
  const [isEndingContract, setIsEndingContract] = useState(false);

  const confirmEndFleetContract = async () => {
    if (!endContractModalCompany) return;
    const company = endContractModalCompany;
    setIsEndingContract(true);

    try {
      const driverName = currentUser?.name || currentUser?.full_name || 'Driver';
      const driverEmail = (currentUser?.email || '').trim().toLowerCase();

      // 1. Immediately update UI local state & close modal popup
      setConnectedCompanies(prev =>
        prev.filter(c => c.companyId !== company.companyId && c.recordId !== company.recordId)
      );
      setEndContractModalCompany(null);

      // 2. Delete from Supabase database company_drivers table
      try {
        if (company.recordId) {
          await supabase
            .from('company_drivers')
            .delete()
            .eq('id', company.recordId);
        }
        if (company.companyId && driverEmail) {
          await supabase
            .from('company_drivers')
            .delete()
            .eq('company_id', company.companyId)
            .ilike('email', driverEmail);
        }
        if (currentUser?.id && company.companyId) {
          await supabase
            .from('company_drivers')
            .delete()
            .eq('company_id', company.companyId)
            .eq('driver_id', currentUser.id);
        }
      } catch (dbErr) {
        console.warn("Supabase company_drivers delete notice:", dbErr);
      }

      // 3. Send notification to company informing them that driver left fleet
      try {
        if (company.companyId) {
          await createNotification({
            userId: company.companyId,
            companyId: company.companyId,
            title: `⚠️ Driver Turned Off Fleet Contract`,
            message: `${driverName} (${driverEmail}) has ended their fleet contract and disconnected from your company fleet.`,
            category: 'Fleet',
            unread: true,
            important: true
          });
        }
      } catch (notifErr) {
        console.warn("Notification send notice:", notifErr);
      }

      // 4. Broadcast global fleet sync event & auto-refresh list
      window.dispatchEvent(new Event('rk9_fleet_updated'));
      await fetchDriverConnectedCompanies();

      setToast({ show: true, message: `Contract ended. You are disconnected from ${company.companyName}.`, type: 'info' });
    } catch (err) {
      console.warn("Error ending fleet contract:", err);
    } finally {
      setIsEndingContract(false);
      setEndContractModalCompany(null);
    }
  };

  // Load Fleet Drivers from Supabase database & Local Storage
  useEffect(() => {
    async function fetchFleetFromSupabase() {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('company_drivers')
          .select('*')
          .eq('company_id', currentUser.id)
          .neq('status', 'DECLINED')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(d => ({
            id: d.id,
            name: d.full_name || d.name,
            phone: d.phone,
            email: d.email,
            vehicle: d.vehicle_type || d.vehicle || 'Cargo Van',
            city: d.city || 'Houston',
            state: d.state_code || d.state || 'TX',
            cdl: Boolean(d.has_cdl ?? d.cdl),
            status: d.status || 'ACTIVE'
          }));
          setFleetDrivers(mapped);
          localStorage.setItem(`rk9_company_fleet_${currentUser.id}`, JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn("Supabase company_drivers fetch notice:", err.message || err);
      }
    }

    fetchFleetFromSupabase();

    window.addEventListener('rk9_fleet_updated', fetchFleetFromSupabase);
    return () => {
      window.removeEventListener('rk9_fleet_updated', fetchFleetFromSupabase);
    };
  }, [currentUser?.id]);

  const saveFleetDrivers = (newList) => {
    setFleetDrivers(newList);
    try {
      localStorage.setItem(`rk9_company_fleet_${currentUser?.id || 'default'}`, JSON.stringify(newList));
      window.dispatchEvent(new Event('rk9_fleet_updated'));
    } catch (e) {
      console.warn("Error saving fleet drivers to localStorage:", e);
    }
  };

  const handleAddFleetDriverSubmit = async (e) => {
    e.preventDefault();
    if (!newDriverForm.name.trim()) return;

    const enteredEmail = (newDriverForm.email || '').trim().toLowerCase();

    // ── 1. VALIDATION: Check if email is registered as a Company account ───────
    if (enteredEmail) {
      try {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id, role, full_name, email')
          .eq('email', enteredEmail)
          .maybeSingle();

        if (profileCheck && (profileCheck.role === 'company' || profileCheck.role === 'Company')) {
          alert(`Invalid Driver Email: "${enteredEmail}" belongs to a registered Company account.`);
          return;
        }

        // ── 2. VALIDATION: Check if email belongs to a Registered Driver ──────────
        const isRegisteredDriver = profileCheck && (profileCheck.role === 'driver' || profileCheck.role === 'Driver');

        if (isRegisteredDriver) {
          const companyName = currentUser?.name || currentUser?.company_name || 'Courier Logistics';

          // Insert pending invitation in company_drivers
          await supabase.from('company_drivers').insert([{
            company_id: currentUser?.id || null,
            driver_id: profileCheck.id,
            full_name: newDriverForm.name.trim() || profileCheck.full_name,
            phone: newDriverForm.phone.trim() || profileCheck.phone || '',
            email: enteredEmail,
            vehicle_type: newDriverForm.vehicle,
            city: newDriverForm.city.trim() || 'Houston',
            state_code: newDriverForm.state.trim() || 'TX',
            has_cdl: newDriverForm.cdl,
            status: 'PENDING_APPROVAL',
            created_at: new Date().toISOString()
          }]);

          // Send Inbox Notification to Driver
          await createNotification({
            userId: profileCheck.id,
            companyId: currentUser?.id || null,
            title: `Fleet Join Invitation from ${companyName}`,
            message: `${companyName} has invited you to join their company fleet as a registered driver. Please respond to this invitation in your inbox.`,
            category: 'FLEET_INVITE',
            unread: true,
            important: true,
            actionUrl: '/dashboard?tab=inbox',
            actionText: 'View Invitation'
          });

          alert(`📩 Fleet Join Invitation sent to registered driver (${enteredEmail})! They will appear in your fleet list as soon as they accept in their Inbox.`);
          setIsAddDriverModalOpen(false);
          setNewDriverForm({ name: '', phone: '', email: '', vehicle: 'Cargo Van', city: 'Houston', state: 'TX', cdl: false });
          return;
        }
      } catch (err) {
        console.warn("Validation check notice:", err);
      }
    }

    // ── 3. OFFLINE / NEW DRIVER: Direct Add ────────────────────────────────────
    const newId = `fleet_${Date.now()}`;
    const created = {
      id: newId,
      name: newDriverForm.name.trim(),
      phone: newDriverForm.phone.trim() || '+1 (555) 000-0000',
      email: enteredEmail || 'driver@company.com',
      vehicle: newDriverForm.vehicle,
      city: newDriverForm.city.trim() || 'Houston',
      state: newDriverForm.state.trim() || 'TX',
      cdl: newDriverForm.cdl
    };

    const updated = [created, ...fleetDrivers];
    saveFleetDrivers(updated);
    setIsAddDriverModalOpen(false);

    try {
      const payload = {
        company_id: currentUser?.id || null,
        full_name: created.name,
        phone: created.phone,
        email: created.email,
        vehicle_type: created.vehicle,
        city: created.city,
        state_code: created.state,
        has_cdl: created.cdl,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('company_drivers').insert([payload]);
      if (!error && data && data[0]?.id) {
        const synced = updated.map(d => d.id === newId ? { ...d, id: data[0].id } : d);
        saveFleetDrivers(synced);
      }
    } catch (dbErr) {
      console.warn("Supabase database fleet driver save warning:", dbErr);
    }

    setNewDriverForm({
      name: '',
      phone: '',
      email: '',
      vehicle: 'Cargo Van',
      city: 'Houston',
      state: 'TX',
      cdl: false
    });
  };

  const handleDeleteFleetDriver = async (driverId) => {
    const targetDriver = fleetDrivers.find(d => d.id === driverId);

    // 1. Immediately update UI state & localStorage
    const updated = fleetDrivers.filter(d => d.id !== driverId);
    saveFleetDrivers(updated);

    // 2. Broadcast fleet sync event
    window.dispatchEvent(new Event('rk9_fleet_updated'));

    // 3. Delete from Supabase Database
    try {
      if (driverId && !driverId.startsWith('fleet_')) {
        await supabase.from('company_drivers').delete().eq('id', driverId);
      }
      if (targetDriver?.email && currentUser?.id) {
        await supabase
          .from('company_drivers')
          .delete()
          .eq('company_id', currentUser.id)
          .eq('email', targetDriver.email);
      }
    } catch (dbErr) {
      console.warn("Supabase database delete warning:", dbErr);
    }
  };

  const handleAcceptFleetInvite = async (notif) => {
    const driverName = currentUser?.name || currentUser?.full_name || 'Driver';
    const driverEmail = (currentUser?.email || '').trim().toLowerCase();

    // 1. Optimistically update local Inbox UI immediately
    setInboxNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, status: 'ACCEPTED', unread: false } : n)
    );

    try {
      // 2. Update company_drivers status to ACTIVE in Supabase
      try {
        if (driverEmail) {
          await supabase
            .from('company_drivers')
            .update({ status: 'ACTIVE' })
            .ilike('email', driverEmail);
        }
        if (currentUser?.id) {
          await supabase
            .from('company_drivers')
            .update({ status: 'ACTIVE' })
            .eq('driver_id', currentUser.id);
        }
      } catch (cdErr) {
        console.warn("company_drivers update notice:", cdErr);
      }

      const compId = notif.companyId;

      // 3. Update notification status for driver
      try {
        await supabase
          .from('notifications')
          .update({ unread: false, status: 'ACCEPTED' })
          .eq('id', notif.id);
      } catch (notifErr) {
        console.warn("notification update notice:", notifErr);
      }

      // 4. Send acceptance notification back to the Company!
      try {
        if (compId) {
          await createNotification({
            userId: compId,
            companyId: compId,
            title: `Driver Invitation Accepted!`,
            message: `${driverName} (${driverEmail}) has accepted your fleet invitation! They are now added to your company fleet drivers list.`,
            category: 'Fleet',
            unread: true,
            important: true,
            actionUrl: '/dashboard?tab=fleet',
            actionText: 'View Fleet Drivers'
          });
        }
      } catch (createErr) {
        console.warn("createNotification notice:", createErr);
      }

      // 5. Update local fleet state & refresh connected companies list
      setFleetDrivers(prev =>
        prev.map(d => {
          if ((d.email && d.email.toLowerCase() === driverEmail) || d.id === currentUser?.id) {
            return { ...d, status: 'ACTIVE' };
          }
          return d;
        })
      );

      window.dispatchEvent(new Event('rk9_fleet_updated'));
      await fetchDriverConnectedCompanies();

      setToast({ show: true, message: 'You have accepted the fleet invitation! You are now added to the company fleet.', type: 'success' });
    } catch (err) {
      console.warn("Error accepting fleet invite:", err);
    }
  };

  const handleDeclineFleetInvite = async (notif) => {
    const driverName = currentUser?.name || currentUser?.full_name || 'Driver';
    const driverEmail = (currentUser?.email || '').trim().toLowerCase();

    // 1. Optimistically update local Inbox UI immediately
    setInboxNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, status: 'DECLINED', unread: false } : n)
    );

    try {
      // 2. Update company_drivers status to DECLINED in Supabase
      try {
        if (driverEmail) {
          await supabase
            .from('company_drivers')
            .update({ status: 'DECLINED' })
            .ilike('email', driverEmail);
        }
        if (currentUser?.id) {
          await supabase
            .from('company_drivers')
            .update({ status: 'DECLINED' })
            .eq('driver_id', currentUser.id);
        }
      } catch (cdErr) {
        console.warn("company_drivers decline notice:", cdErr);
      }

      const compId = notif.companyId;

      // 3. Update notification status for driver
      try {
        await supabase
          .from('notifications')
          .update({ unread: false, status: 'DECLINED' })
          .eq('id', notif.id);
      } catch (notifErr) {
        console.warn("notification update notice:", notifErr);
      }

      // 4. Send decline notification back to Company
      try {
        if (compId) {
          await createNotification({
            userId: compId,
            companyId: compId,
            title: `✕ Driver Invitation Declined`,
            message: `${driverName} (${driverEmail}) declined your invitation to join your company fleet.`,
            category: 'Fleet',
            unread: true,
            important: false
          });
        }
      } catch (createErr) {
        console.warn("createNotification notice:", createErr);
      }

      // 5. Update local fleet state & refresh connected companies list
      setFleetDrivers(prev =>
        prev.map(d => {
          if ((d.email && d.email.toLowerCase() === driverEmail) || d.id === currentUser?.id) {
            return { ...d, status: 'DECLINED' };
          }
          return d;
        })
      );

      window.dispatchEvent(new Event('rk9_fleet_updated'));
      await fetchDriverConnectedCompanies();

      setToast({ show: true, message: 'Fleet invitation declined.', type: 'info' });
    } catch (err) {
      console.warn("Error declining fleet invite:", err);
    }
  };

  // Dynamic Inbox Notifications State
  const [inboxNotifications, setInboxNotifications] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [inboxCategoryFilter, setInboxCategoryFilter] = useState('All');
  const [inboxUnreadOnly, setInboxUnreadOnly] = useState(false);

  const handleMarkAllInboxAsRead = async () => {
    setInboxNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      await markAllNotificationsRead(currentUser?.id);
    } catch (err) {
      console.warn("Error marking all inbox as read:", err);
    }
    setToast({ show: true, message: 'All notifications marked as read', type: 'success' });
  };

  const handleToggleInboxRead = async (id) => {
    const target = inboxNotifications.find(n => n.id === id);
    const nextUnread = !target?.unread;
    setInboxNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: nextUnread } : n));
    try {
      await markNotificationRead(id, nextUnread);
    } catch (err) {
      console.warn("Error toggling notification read:", err);
    }
  };

  const handleDeleteInboxNotification = async (id) => {
    setInboxNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotificationRecord(id);
    } catch (err) {
      console.warn("Error deleting notification record:", err);
    }
    setToast({ show: true, message: 'Notification removed', type: 'info' });
  };

  useEffect(() => {
    async function loadInbox() {
      setLoadingInbox(true);
      try {
        const dbNotifs = await fetchNotifications(currentUser?.id);
        if (dbNotifs && dbNotifs.length > 0) {
          const formatted = dbNotifs.map((n) => ({
            id: n.id,
            title: n.title,
            snippet: n.message,
            sender: n.title?.includes('Inquiry') || n.title?.includes('Contract') ? 'Company Dispatch Inquiry' : 'RouteK9 Platform',
            time: new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            unread: Boolean(n.unread),
            status: n.status || 'PENDING',
            category: n.category || 'Dispatch Inquiry',
            companyId: n.company_id,
            actionUrl: n.action_url,
            actionText: n.action_text
          }));
          setInboxNotifications(formatted);
        } else {
          setInboxNotifications([]);
        }
      } catch (err) {
        console.warn("Could not load inbox notifications from Supabase:", err);
        setInboxNotifications([]);
      } finally {
        setLoadingInbox(false);
      }
    }

    if (currentUser?.id) {
      loadInbox();
    } else {
      setLoadingInbox(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    async function loadEnrolled() {
      const data = await getCourses();
      setEnrolledCourses((data || []).filter((c) => purchasedCourses.includes(c.id)));
    }
    loadEnrolled();
  }, [purchasedCourses]);

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
        insurancePolicy,
        experience,
        availability,
        hasCDL,
        readyToWork,
        websiteUrl,
        avatarUrl,
        bio
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

          <div className="flex items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{accountRole === 'company' ? 'Company Member Dashboard' : 'Driver Member Dashboard'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
                Welcome back, <span className="text-rose-500">{fullName}</span>
              </h1>
            </div>
          </div>

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
              <div className="text-2xl font-extrabold text-emerald-400">{inboxNotifications.length}</div>
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
            onClick={() => handleTabChange('routes')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'routes'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Planned Routes ({savedUserRoutes.length})</span>
          </button>

          {accountRole === 'company' ? (
            <button
              onClick={() => handleTabChange('fleet')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'fleet'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>My Fleet & Drivers ({fleetDrivers.length})</span>
            </button>
          ) : (
            <button
              onClick={() => handleTabChange('fleets')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'fleets'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Connected Companies ({connectedCompanies.length})</span>
            </button>
          )}

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
            onClick={() => handleTabChange('profile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'profile'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            {accountRole === 'company' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
            <span>{accountRole === 'company' ? 'Company Profile' : 'Driver Profile'}</span>
          </button>

          <button
            onClick={() => handleTabChange('inbox')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'inbox'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox ({inboxNotifications.length})</span>
            {inboxNotifications.some(n => n.unread) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
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

        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Incomplete Driver/Company Profile Alert Banner */}
          {profileCompletionPercentage < 100 && (
            <div className="mb-8 bg-amber-50/90 border border-amber-300 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-700 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-serif-heading">
                    <h4 className="text-sm font-extrabold text-amber-900">
                      Incomplete Profile Warning — Action Required
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                      {profileCompletionPercentage}% Complete
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {accountRole === 'company'
                      ? 'Your company profile is missing key details (City, State, Contract Types, Bio). Complete your profile so independent drivers can find and contact your business on the RouteK9 Companies Directory.'
                      : 'Your driver profile is missing key details (City, State, Experience, Bio). Complete your profile so courier & logistics companies can find and hire you directly on the RouteK9 Drivers Directory.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTabChange('profile')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>{accountRole === 'company' ? 'Complete Company Profile Now' : 'Complete Profile Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {route.stops.map((s, idx) => (
                                <li key={idx} className="flex items-start justify-between gap-2 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-2 rounded-lg border border-slate-200/60">
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">{s.step || idx + 1}</span>
                                    <div className="min-w-0 flex-1">
                                      <span className="truncate block" title={s.label}>{s.label}</span>
                                      {(s.zoneName || s.zoneId || s.driverName) && (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                          {(s.zoneName || s.zoneId) && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-bold text-rose-700 border border-rose-100">
                                              {getFriendlyZoneName(s, route.stops || [])}
                                            </span>
                                          )}
                                          {s.driverName && (
                                            <button
                                              type="button"
                                              onClick={() => setActiveDriverModal({ name: s.driverName, phone: s.driverPhone })}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 text-[9px] font-bold text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                              title="Click to view driver contact details"
                                            >
                                              {s.driverName}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${s.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    s.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {s.status || 'pending'}
                                  </span>
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

          {/* TAB 2: Inbox & Notifications (Unified Inbox) */}
          {activeTab === 'inbox' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    Inbox & Notifications
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Contract invitations, dispatch inquiries, SAM.gov opportunity matches, and platform updates.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllInboxAsRead}
                    disabled={!inboxNotifications.some(n => n.unread)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Mark All as Read</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls & Categories */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {['All', 'Fleet Invites', 'Dispatch Inquiries', 'System & Alerts'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInboxCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${inboxCategoryFilter === cat
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer self-start sm:self-auto px-2">
                  <input
                    type="checkbox"
                    checked={inboxUnreadOnly}
                    onChange={(e) => setInboxUnreadOnly(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                  <span>Unread Only</span>
                </label>
              </div>

              {(() => {
                const filteredInboxNotifications = inboxNotifications.filter(msg => {
                  if (inboxUnreadOnly && !msg.unread) return false;
                  if (inboxCategoryFilter === 'Fleet Invites') {
                    return msg.category === 'FLEET_INVITE' || msg.category === 'Fleet' || (msg.title || '').toLowerCase().includes('invite');
                  }
                  if (inboxCategoryFilter === 'Dispatch Inquiries') {
                    return (msg.category || '').toLowerCase().includes('inquiry') || (msg.category || '').toLowerCase().includes('dispatch');
                  }
                  if (inboxCategoryFilter === 'System & Alerts') {
                    return (msg.category || '').toLowerCase().includes('system') || (msg.category || '').toLowerCase().includes('alert');
                  }
                  return true;
                });

                if (loadingInbox) {
                  return (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-600">Loading inbox messages from database...</p>
                    </div>
                  );
                }

                if (filteredInboxNotifications.length === 0) {
                  return (
                    <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
                      <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No Messages Found</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        {inboxCategoryFilter !== 'All'
                          ? `No notifications found under "${inboxCategoryFilter}".`
                          : inboxUnreadOnly
                            ? "No unread notifications in your inbox."
                            : "When courier companies or dispatchers contact you, their route inquiries and contract proposals will appear here in real time."}
                      </p>
                      {(inboxCategoryFilter !== 'All' || inboxUnreadOnly) && (
                        <button
                          type="button"
                          onClick={() => { setInboxCategoryFilter('All'); setInboxUnreadOnly(false); }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Filters to View All</span>
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {filteredInboxNotifications.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${msg.unread ? 'bg-rose-50/30 border-l-4 border-l-rose-600' : 'hover:bg-slate-50/50'
                          }`}
                      >
                        <div className="space-y-2 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                              {msg.category}
                            </span>
                            {msg.unread && (
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            )}
                            <span className="text-xs font-bold text-slate-900">{msg.sender}</span>
                          </div>
                          <h4 className="text-base font-bold text-[#0b132b] font-serif-heading">
                            {msg.title}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                            {msg.snippet}
                          </p>

                          {(msg.category === 'FLEET_INVITE' || msg.category === 'Fleet' || (msg.title || '').toLowerCase().includes('invitation')) &&
                            msg.status !== 'ACCEPTED' && msg.status !== 'DECLINED' && (
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptFleetInvite(msg)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                  <span>✓ Accept Fleet Invitation</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineFleetInvite(msg)}
                                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs border border-slate-200 cursor-pointer transition-all"
                                >
                                  <span>Decline</span>
                                </button>
                              </div>
                            )}

                          {msg.status === 'ACCEPTED' && (
                            <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                              ✓ Invitation Accepted
                            </div>
                          )}

                          {msg.status === 'DECLINED' && (
                            <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold text-[11px] border border-rose-200">
                              ✕ Invitation Declined
                            </div>
                          )}

                          {msg.actionUrl &&
                            msg.actionUrl !== '/dashboard?tab=inbox' &&
                            msg.actionUrl !== '/notifications' &&
                            msg.category !== 'FLEET_INVITE' &&
                            msg.category !== 'Fleet' &&
                            !msg.title?.toLowerCase().includes('invitation') && (
                              <div className="pt-1">
                                <Link
                                  to={msg.actionUrl}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                                >
                                  <span>{msg.actionText || 'View Details'} →</span>
                                </Link>
                              </div>
                            )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                          <div className="text-[11px] text-slate-400 font-semibold">
                            {msg.time}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleInboxRead(msg.id)}
                              title={msg.unread ? "Mark as Read" : "Mark as Unread"}
                              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${msg.unread
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              {msg.unread ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInboxNotification(msg.id)}
                              title="Delete notification"
                              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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

                {accountRole === 'driver' && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0b132b]">
                      <span>Directory Listing Completion Status</span>
                      <span className={profileCompletionPercentage === 100 ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>
                        {profileCompletionPercentage}% Complete {profileCompletionPercentage === 100 ? '✓ Fully Verified' : '• Incomplete'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${profileCompletionPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        style={{ width: `${profileCompletionPercentage}%` }}
                      />
                    </div>
                    {profileCompletionPercentage < 100 && (
                      <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                        💡 <strong>Action Needed:</strong> Fill in your City, State, Experience, and Bio below so courier companies can discover and hire you directly on the RouteK9 Drivers Directory.
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">

                  {profileSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{accountRole === 'company' ? 'Company profile updated successfully!' : 'Driver profile updated successfully! Directory listing updated.'}</span>
                    </div>
                  )}

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

                  {/* Profile Photo / Avatar Upload Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile Avatar"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#0b132b] text-white font-extrabold text-2xl flex items-center justify-center border-2 border-slate-300 shadow-md">
                          {(fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label className="absolute -bottom-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110">
                        <Camera className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <h4 className="text-sm font-extrabold text-[#0b132b]">
                        {accountRole === 'company' ? 'Company Logo / Profile Photo' : 'Driver Profile Photo'}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Upload a photo or company logo. Saved directly to your database profile and shown on the directory.
                      </p>

                      <div className="flex items-center gap-3 pt-1.5 justify-center sm:justify-start">
                        <label className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

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

                  {/* Primary Vehicle Class / Contract Types & Company Website */}
                  <div className={`grid grid-cols-1 ${accountRole === 'company' ? 'sm:grid-cols-2' : ''} gap-4`}>
                    <div className={`space-y-1.5 ${accountRole === 'company' ? '' : 'sm:col-span-2'}`}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {accountRole === 'company' ? 'Primary Contract Types Offered' : 'Primary Vehicle Class'}
                      </label>
                      {accountRole === 'company' ? (
                        <input
                          type="text"
                          value={vehicleClass}
                          onChange={(e) => setVehicleClass(e.target.value)}
                          placeholder="e.g. Medical Specimen, Pharmaceuticals, Scheduled Routes"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      ) : (
                        <select
                          value={vehicleClass}
                          onChange={(e) => setVehicleClass(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                        >
                          <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                          <option value="Minivan / SUV">Minivan / SUV</option>
                          <option value="Cargo Van">Cargo Van</option>
                          <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                          <option value="16ft Box Truck">16ft Box Truck</option>
                          <option value="26ft Box Truck">26ft Box Truck</option>
                          <option value="Company Fleet">Company Fleet / Multi-Vehicle</option>
                        </select>
                      )}
                    </div>

                    {accountRole === 'company' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Company Website URL
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="e.g. https://apexmedical.com"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Home State & Operating City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Operating State Code
                      </label>
                      <input
                        type="text"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        placeholder="e.g. TX"
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
                        placeholder="e.g. Houston"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Contract Types/Experience & Service Region/Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {accountRole === 'company' ? 'Contract Key Requirements' : 'Driving Experience'}
                      </label>
                      <input
                        type="text"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder={accountRole === 'company' ? 'e.g. Owner-Operators with Cargo Vans' : 'e.g. 5 Years'}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {accountRole === 'company' ? 'Service Area / Operating Region' : 'Dispatch Availability'}
                      </label>
                      <input
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder={accountRole === 'company' ? 'e.g. Texas Medical Center & Gulf Coast' : 'e.g. Immediate, Mon - Fri'}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Ready to Find Routes & Listed on Directory Toggle */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#0b132b]">
                          {accountRole === 'company' ? 'Actively Hiring & Listed on Companies Directory' : 'Ready to Accept Routes & Listed on Directory'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${readyToWork ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                          {readyToWork ? 'Publicly Listed' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {accountRole === 'company'
                          ? 'Check this box to display your company profile on the Companies Directory for drivers to find and contact you. Uncheck to hide your business.'
                          : 'Check this box if you are looking for routes. Uncheck if you do not want courier companies to see your details.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={readyToWork}
                      onChange={(e) => setReadyToWork(e.target.checked)}
                      className="w-5 h-5 accent-rose-600 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* CDL Certification Toggle (Drivers Only) */}
                  {accountRole === 'driver' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#0b132b]">Commercial Driver (CDL Holder)</p>
                        <p className="text-[11px] text-slate-500 font-medium">Highlight your CDL certification badge on the Drivers Directory for high-value contracts.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasCDL}
                        onChange={(e) => setHasCDL(e.target.checked)}
                        className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Driver / Company Overview & Bio */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {accountRole === 'company' ? 'Company Overview & Contracting Pitch (Directory Summary)' : 'Driver Bio & Equipment Summary (Directory Listing Pitch)'}
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={accountRole === 'company' ? 'e.g. Apex specializes in prompt, temp-controlled medical deliveries for laboratory networks and hospitals...' : 'e.g. Reliable owner-operator specialized in medical courier routes and TSA-approved secure cargo deliveries...'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                    />
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

          {/* TAB: My Fleet & Drivers (For Companies) */}
          {activeTab === 'fleet' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    My Company Fleet & Drivers
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Manage your company's drivers to assign them directly to routes in the Route Planner.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>+ Add Fleet Driver</span>
                </button>
              </div>

              {fleetDrivers.length === 0 ? (
                <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No Fleet Drivers Added Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Add your company's drivers here so you can assign them to optimized routes and dispatches in the Route Planner.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddDriverModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    + Add Your First Driver
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fleetDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between transition-all ${driver.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-50/30 border-amber-200 shadow-amber-100/20'
                        : 'bg-white border-slate-200/90'
                        }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl font-extrabold flex items-center justify-center border shrink-0 ${driver.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-[#0b132b]">{driver.name}</h3>
                              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{driver.city}, {driver.state}</span>
                              </div>
                            </div>
                          </div>

                          {driver.cdl && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200">
                              CDL
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Vehicle Class:</span>
                            <span className="text-slate-800 font-bold">{driver.vehicle}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Phone:</span>
                            <span className="text-slate-800 font-bold">{driver.phone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Email:</span>
                            <span className="text-slate-800 font-bold truncate max-w-[160px]">{driver.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {driver.status === 'PENDING_APPROVAL' ? (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            <span>⏳ Pending Driver Approval</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ● Ready for Route Assignment
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteFleetDriver(driver.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Connected Fleets & Companies (For Drivers) */}
          {activeTab === 'fleets' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                    My Connected Companies & Fleets
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Courier & logistics companies you are connected with. You can turn off your contract at any time.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200 self-start sm:self-auto">
                  {connectedCompanies.length} Connected Companies
                </span>
              </div>

              {loadingCompanies ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading connected company contracts...</p>
                </div>
              ) : connectedCompanies.length === 0 ? (
                <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No Connected Fleets Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    When courier companies invite you to join their fleet, accept their invitation in your Inbox to connect and receive route dispatches!
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('inbox')}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Check Inbox Messages →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connectedCompanies.map((company) => (
                    <div
                      key={company.recordId || company.companyId}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center border border-rose-200 shrink-0 text-sm">
                              {company.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-[#0b132b]">{company.companyName}</h3>
                              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{company.city}, {company.state}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Contact Email:</span>
                            <span className="text-slate-800 font-bold truncate max-w-[160px]">{company.companyEmail || 'N/A'}</span>
                          </div>
                          {company.companyPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Company Phone:</span>
                              <span className="text-slate-800 font-bold">{company.companyPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Contract Type:</span>
                            <span className="text-slate-800 font-bold">{company.contractTypes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>● Active Fleet Contract</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setEndContractModalCompany(company)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="Turn off contract and disconnect from this company fleet"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Turn Off Contract</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Custom End Contract Confirmation Modal Popup */}
      {endContractModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 sm:p-7 text-left space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <button
                type="button"
                onClick={() => setEndContractModalCompany(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">
                Turn Off Fleet Contract?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Are you sure you want to turn off contract and disconnect from <strong className="text-slate-900 font-extrabold">{endContractModalCompany.companyName}</strong>?
              </p>
              <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 text-[11px] text-rose-800 font-semibold space-y-1">
                <p>⚠️ You will be removed from their company driver fleet list and will no longer receive route dispatches from this company.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isEndingContract}
                onClick={() => setEndContractModalCompany(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isEndingContract}
                onClick={confirmEndFleetContract}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {isEndingContract ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <span>Yes, Turn Off Contract</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fleet Driver Modal */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-6 p-6 sm:p-7 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Add Company Fleet Driver</h3>
                <p className="text-xs text-slate-400 font-medium">Register a driver to assign to routes in the Route Planner</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDriverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFleetDriverSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  value={newDriverForm.name}
                  onChange={(e) => setNewDriverForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Phone Number</label>
                  <PhoneInput
                    country={'us'}
                    value={newDriverForm.phone}
                    onChange={(val) => setNewDriverForm(prev => ({ ...prev, phone: val }))}
                    inputStyle={{
                      width: '100%',
                      height: '38px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      paddingLeft: '44px',
                      color: '#1e293b'
                    }}
                    buttonStyle={{
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      borderTopLeftRadius: '0.75rem',
                      borderBottomLeftRadius: '0.75rem',
                      paddingLeft: '2px'
                    }}
                    dropdownStyle={{
                      borderRadius: '0.75rem',
                      zIndex: 1000
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. driver@company.com"
                    value={newDriverForm.email}
                    onChange={(e) => setNewDriverForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Vehicle Class</label>
                <select
                  value={newDriverForm.vehicle}
                  onChange={(e) => setNewDriverForm(prev => ({ ...prev, vehicle: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="Cargo Van">Cargo Van</option>
                  <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                  <option value="16ft Box Truck">16ft Box Truck</option>
                  <option value="26ft Box Truck">26ft Box Truck</option>
                  <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                  <option value="Minivan / SUV">Minivan / SUV</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Houston"
                    value={newDriverForm.city}
                    onChange={(e) => setNewDriverForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">State Code</label>
                  <input
                    type="text"
                    placeholder="e.g. TX"
                    value={newDriverForm.state}
                    onChange={(e) => setNewDriverForm(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cdlCheck"
                  checked={newDriverForm.cdl}
                  onChange={(e) => setNewDriverForm(prev => ({ ...prev, cdl: e.target.checked }))}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
                <label htmlFor="cdlCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Driver holds CDL Certification
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Fleet Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Driver Info Modal Popup */}
      {activeDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0b132b] uppercase tracking-wider">Driver Contact Details</h3>
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base">
                👤
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{activeDriverModal.name}</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Contract Driver</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                <span className="font-extrabold text-slate-800 text-xs">{activeDriverModal.phone || 'No phone number provided'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {activeDriverModal.phone && (
                <a
                  href={`tel:${activeDriverModal.phone}`}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Call Driver</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
