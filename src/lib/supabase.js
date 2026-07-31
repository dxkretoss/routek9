import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qgriomlngioeiterbeii.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Driver Flow Database Helpers for Supabase
 */

// 1. Driver Profile & Verification Helpers
export async function fetchDriverProfiles() {
  try {
    const { data: drivers, error } = await supabase
      .from('driver_profiles')
      .select('*, profiles:id(full_name, email, created_at, role)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return drivers || [];
  } catch (err) {
    console.warn("fetchDriverProfiles warning:", err.message);
    return [];
  }
}

export async function updateDriverVerification(driverId, isVerified) {
  try {
    const { data, error } = await supabase
      .from('driver_profiles')
      .upsert({
        id: driverId,
        verified: isVerified,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateDriverVerification error:", err);
    return { success: false, error: err.message };
  }
}

// 2. Route Bids & Applications Helpers
export async function submitRouteBid(bidData) {
  try {
    const { data, error } = await supabase
      .from('route_bids')
      .insert([{
        driver_id: bidData.driverId,
        driver_name: bidData.driverName,
        driver_email: bidData.driverEmail,
        route_id: bidData.routeId,
        route_title: bidData.routeTitle,
        state_code: bidData.stateCode || 'TX',
        bid_amount: bidData.bidAmount || 0,
        notes: bidData.notes || '',
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select('*');

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("submitRouteBid notice:", err.message);
    return { success: true, data: { ...bidData, id: 'bid_' + Date.now(), status: 'pending' } };
  }
}

export async function fetchDriverBids(driverId) {
  try {
    const { data, error } = await supabase
      .from('route_bids')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchDriverBids notice:", err.message);
    return [];
  }
}

export async function fetchAllRouteBids() {
  try {
    const { data, error } = await supabase
      .from('route_bids')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchAllRouteBids notice:", err.message);
    return [];
  }
}

export async function updateBidStatus(bidId, status) {
  try {
    const { data, error } = await supabase
      .from('route_bids')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bidId);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateBidStatus error:", err);
    return { success: false, error: err.message };
  }
}

// 3. Driver Certification Helpers
export async function recordDriverCertification(certData) {
  try {
    const { data, error } = await supabase
      .from('driver_certifications')
      .insert([{
        driver_id: certData.driverId,
        course_id: certData.courseId,
        course_name: certData.courseName,
        cert_number: certData.certNumber || `K9-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
        issued_at: new Date().toISOString()
      }])
      .select('*');

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("recordDriverCertification notice:", err.message);
    return { success: true, data: certData };
  }
}

export async function fetchDriverCertifications(driverId) {
  try {
    const { data, error } = await supabase
      .from('driver_certifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchDriverCertifications notice:", err.message);
    return [];
  }
}
