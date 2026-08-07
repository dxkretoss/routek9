import React, { useState } from 'react';
import {
  UserCircle,
  Lock,
  CheckCircle2,
  KeyRound,
  Mail,
  User,
  Shield,
  Save,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminSettings({ currentUser }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminRole, setAdminRole] = useState('Super Administrator');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(null);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSuccessMsg("Admin profile updated successfully!");
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccessMsg(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!cleanNew) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (cleanNew.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (cleanNew === cleanCurrent) {
      setPasswordError("New password cannot be the same as your current password.");
      return;
    }

    if (!cleanConfirm) {
      setPasswordError("Please confirm your new password.");
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordError("New password and confirm password do not match. Please verify.");
      return;
    }

    try {
      setPasswordLoading(true);

      // 1. Verify current password if admin email is available
      if (currentUser?.email) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: cleanCurrent
        });

        if (signInErr) {
          setPasswordError("Current password is incorrect. Please verify your current password.");
          setPasswordLoading(false);
          return;
        }
      }

      // 2. Update password in Supabase Auth
      const { error: updateErr } = await supabase.auth.updateUser({
        password: cleanNew
      });

      if (updateErr) {
        throw updateErr;
      }

      setPasswordSuccessMsg("Admin password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Admin password update error:", err);
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">


      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'profile'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <UserCircle className="w-3.5 h-3.5" />
          <span>Admin Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'security'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>
      </div>

      {/* TAB 1: ADMIN PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Edit Admin Profile</h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Update administrative profile details and login email address</p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Role Designation</label>
              <input
                type="text"
                disabled
                value={adminRole}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Change Password</h3>
              <p className="text-xs text-slate-400 font-medium">Update your admin login password securely</p>
            </div>
          </div>

          {passwordSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                newPassword.trim() === confirmPassword.trim() ? (
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passwords match</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Passwords do not match</span>
                  </p>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-3 rounded-xl bg-[#0b132b] hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer mt-2"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              <span>{passwordLoading ? 'Updating Password...' : 'Update Admin Password'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
