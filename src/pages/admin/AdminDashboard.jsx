import React, { useState, useEffect } from 'react';
import {
  Truck,
  Building2,
  BookOpen,
  DollarSign,
  Loader2,
  TrendingUp,
  Users
} from 'lucide-react';
import { getCourses } from '../../lib/courses';
import { supabase } from '../../lib/supabase';
import {
  StatCard,
  StatCardSkeleton,
  TableSkeleton,
  UserTable,
  CourseCard
} from './components/AdminComponents';

export default function AdminDashboard({ drivers = [], companies = [], allUsers = [], loading, error, onNavigate }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [adminSavedRoutes, setAdminSavedRoutes] = useState([]);

  useEffect(() => {
    async function loadDashboardCourses() {
      try {
        const data = await getCourses();
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to load courses on admin dashboard:", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    async function loadSupabaseAdminRoutes() {
      try {
        const { data } = await supabase.from('routes').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            title: r.title || 'Saved Courier Route',
            driverName: r.driver_name || 'Driver',
            vehicle: 'Cargo Van',
            stopsCount: r.stops_count || (r.stops_data ? r.stops_data.length : 0),
            distanceMiles: r.distance_miles || 0,
            durationMinutes: r.duration_minutes || 0,
            status: r.status || 'ACTIVE',
            stops: r.stops_data || [],
            createdAt: r.created_at
          }));
          setAdminSavedRoutes(prev => {
            const map = new Map();
            formatted.forEach(item => map.set(item.id, item));
            prev.forEach(item => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("Could not fetch Supabase admin routes:", err);
      }
    }
    loadDashboardCourses();
    loadSupabaseAdminRoutes();
  }, []);

  const totalDrivers = drivers.length;
  const totalCompanies = companies.length;
  const totalCourses = courses.length;
  const recentRegistrations = drivers.concat(companies).slice(0, 5);
  const displayedCourses = courses.slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Key Performance Indicators (KPI Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Drivers"
              value={totalDrivers}
              subtext="Registered contract couriers"
              icon={Truck}
              color="blue"
              onClick={() => onNavigate('drivers')}
            />
            <StatCard
              label="Total Companies"
              value={totalCompanies}
              subtext="Hiring logistics partners"
              icon={Building2}
              color="emerald"
              onClick={() => onNavigate('companies')}
            />
            <StatCard
              label="Total Courses"
              value={totalCourses}
              subtext="Active training modules"
              icon={BookOpen}
              color="amber"
              onClick={() => onNavigate('courses')}
            />
            <StatCard
              label="Total Revenue"
              value="$18,450 USD"
              subtext="Course & subscription sales"
              icon={DollarSign}
              color="rose"
              onClick={() => onNavigate('revenue')}
            />
          </>
        )}
      </div>

      {/* Main Grid: Available Courses + Recent Registrations */}
      <div className="space-y-8">

        {/* Available Courses Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden space-y-4 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Available Platform Courses</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Training courses and certifications available for contract drivers</p>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage Courses ({totalCourses})</span>
              <span>→</span>
            </button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              <div className="h-36 bg-slate-100 rounded-2xl" />
              <div className="h-36 bg-slate-100 rounded-2xl" />
              <div className="h-36 bg-slate-100 rounded-2xl" />
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No active courses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedCourses.map(course => (
                <CourseCard key={course.id} course={course} detailed />
              ))}
            </div>
          )}
        </div>

        {/* Recent User Registrations Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Recent User Registrations</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Latest drivers and companies registered in Supabase</p>
            </div>
            <button onClick={() => onNavigate('drivers')} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
              View All Users →
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton rows={4} />
            ) : error ? (
              <div className="p-8 text-center text-xs text-rose-600 font-bold">{error}</div>
            ) : recentRegistrations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">No registrations found in database.</div>
            ) : (
              <div className="overflow-x-auto">
                <UserTable users={recentRegistrations} compact />
              </div>
            )}
          </div>
        </div>

        {/* Saved Driver Routes Monitor Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Saved Driver Routes Monitor</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Live routes optimized & saved by drivers in Route Planner</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
              {adminSavedRoutes.length} Saved Routes
            </span>
          </div>

          {adminSavedRoutes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No driver routes saved yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-extrabold text-[10px]">
                    <th className="py-3 px-4">Route ID</th>
                    <th className="py-3 px-4">Driver Name</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Stops</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Drive Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {adminSavedRoutes.map(r => {
                    const routeStops = r.stops || [];
                    const completedCount = routeStops.filter(s => s.status === 'complete').length;
                    const ongoingCount = routeStops.filter(s => s.status === 'ongoing').length;
                    const allComplete = routeStops.length > 0 && completedCount === routeStops.length;
                    const anyOngoing = ongoingCount > 0 || completedCount > 0;
                    const overallStatus = allComplete ? 'complete' : anyOngoing ? 'ongoing' : 'pending';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-rose-600">{r.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.driverName}</td>
                        <td className="py-3 px-4">{r.vehicle}</td>
                        <td className="py-3 px-4 font-bold">{r.stopsCount} stops</td>
                        <td className="py-3 px-4">{r.distanceMiles} mi</td>
                        <td className="py-3 px-4">{r.durationMinutes} min</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            overallStatus === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            overallStatus === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {overallStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
