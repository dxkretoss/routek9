import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotificationRecord } from '../lib/supabase';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  Clock,
  Sparkles,
  DollarSign,
  Award,
  FileText,
  AlertCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export default function NotificationsPage({ currentUser, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const dbNotifs = await fetchNotifications(currentUser?.id);
        
        // Map database fields to front-end keys
        const mappedDb = (dbNotifs || []).map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          category: n.category || 'System',
          time: new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(n.created_at).toLocaleDateString('en-US'),
          unread: n.unread,
          important: n.important,
          actionUrl: n.action_url,
          actionText: n.action_text,
          badgeColor: n.category === 'Certification' ? 'indigo' : n.category === 'Earnings' ? 'emerald' : 'slate',
          isDbRecord: true
        }));
        
        setNotifications(mappedDb);
      } catch (err) {
        console.warn("Could not load database notifications:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadNotifications();
  }, [currentUser]);

  const categories = ['All', 'Route Match', 'SAM Bids', 'Earnings', 'Dispatch Alert', 'Certification', 'System'];

  const handleMarkAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );

    const target = notifications.find(n => n.id === id);
    if (target?.isDbRecord) {
      try {
        await markNotificationRead(id, false);
      } catch (err) {
        console.warn("Could not update notification in DB:", err);
      }
    }
    showToast('Notification marked as read');
  };

  const handleToggleRead = async (id) => {
    const target = notifications.find(n => n.id === id);
    const nextUnread = !target?.unread;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: nextUnread } : n))
    );

    if (target?.isDbRecord) {
      try {
        await markNotificationRead(id, nextUnread);
      } catch (err) {
        console.warn("Could not toggle notification in DB:", err);
      }
    }
  };

  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const target = notifications.find(n => n.id === id);
    if (target?.isDbRecord) {
      try {
        await deleteNotificationRecord(id);
      } catch (err) {
        console.warn("Could not delete notification from DB:", err);
      }
    }
    showToast('Notification removed');
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

    try {
      await markAllNotificationsRead(currentUser?.id);
    } catch (err) {
      console.warn("Could not mark all notifications as read in DB:", err);
    }
    showToast('All notifications marked as read');
  };

  const handleResetNotifications = async () => {
    setLoading(true);
    try {
      const dbNotifs = await fetchNotifications(currentUser?.id);
      const mappedDb = (dbNotifs || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category || 'System',
        time: new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(n.created_at).toLocaleDateString('en-US'),
        unread: n.unread,
        important: n.important,
        actionUrl: n.action_url,
        actionText: n.action_text,
        badgeColor: n.category === 'Certification' ? 'indigo' : n.category === 'Earnings' ? 'emerald' : 'slate',
        isDbRecord: true
      }));
      setNotifications(mappedDb);
      showToast('Notifications updated');
    } catch (err) {
      console.warn("Could not reload database notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const categoryMatch = activeCategory === 'All' || n.category === activeCategory;
    const unreadMatch = !unreadOnly || n.unread;
    return categoryMatch && unreadMatch;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;
  const importantCount = notifications.filter((n) => n.important).length;

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Route Match':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SAM Bids':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Earnings':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatch Alert':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Certification':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'System':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      {/* Header Banner */}
      <section className="bg-[#0b132b] text-white py-12 sm:py-16 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <BellRing className="w-4 h-4 text-rose-400" />
            <span>RouteK9 Live Notification Center</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
                Notifications & Alerts
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl mt-1">
                Real-time updates on high-paying routes, SAM.gov federal contract solicitations, settlement deposits, and vehicle compliance alerts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
              <button
                onClick={handleResetNotifications}
                title="Reset notifications"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center backdrop-blur-xs">
              <div className="text-2xl font-extrabold text-white">{notifications.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Total Notifications</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center backdrop-blur-xs">
              <div className="text-2xl font-extrabold text-rose-400 flex items-center justify-center gap-1.5">
                <span>{unreadCount}</span>
                {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Unread Alerts</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center backdrop-blur-xs">
              <div className="text-2xl font-extrabold text-amber-400">{importantCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">High Priority</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center backdrop-blur-xs">
              <div className="text-2xl font-extrabold text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Real-time Feed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Controls Bar: Category Filter Pills & Unread Toggle */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#0b132b] text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Toggle */}
            <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
                <span>Show Unread Only ({unreadCount})</span>
              </label>
            </div>
          </div>

          {/* Notifications Feed */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <Bell className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No notifications found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You don't have any notifications under the selected filters.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setUnreadOnly(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    notif.unread
                      ? 'bg-white border-rose-200 shadow-md ring-1 ring-rose-100'
                      : 'bg-white/80 border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Left content block */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status dot / Icon */}
                    <div className="mt-1 shrink-0">
                      {notif.unread ? (
                        <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wide ${getCategoryBadgeClass(
                            notif.category
                          )}`}
                        >
                          {notif.category}
                        </span>

                        {notif.important && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Priority
                          </span>
                        )}

                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {notif.time}
                        </span>
                      </div>

                      {/* Notification Header Title */}
                      <h3
                        className={`text-base sm:text-lg font-bold font-serif-heading tracking-tight ${
                          notif.unread ? 'text-[#0b132b]' : 'text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h3>

                      {/* Message Content */}
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    {/* Primary Link Button */}
                    {notif.actionUrl && (
                      <a
                        href={notif.actionUrl}
                        className="px-4 py-2 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>{notif.actionText || 'View Details'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                      </a>
                    )}

                    {/* Toggle Read/Unread */}
                    <button
                      onClick={() => handleToggleRead(notif.id)}
                      title={notif.unread ? 'Mark as read' : 'Mark as unread'}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        notif.unread
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      title="Delete notification"
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0b132b] text-white shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-slideUp">
          <Bell className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
