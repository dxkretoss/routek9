import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qgriomlngioeiterbeii.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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

export async function createNotification(notifData) {
  try {
    const payload = {
      user_id: notifData.userId || null,
      title: notifData.title,
      message: notifData.message,
      category: notifData.category || 'System',
      unread: notifData.unread ?? true,
      important: notifData.important ?? false,
      action_url: notifData.actionUrl || null,
      action_text: notifData.actionText || null,
      created_at: new Date().toISOString()
    };

    if (notifData.companyId) {
      payload.company_id = notifData.companyId;
    }

    let { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select('*');

    if (error && (error.code === 'PGRST204' || error.message?.includes('company_id'))) {
      delete payload.company_id;
      const res = await supabase
        .from('notifications')
        .insert([payload])
        .select('*');
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.warn("createNotification notice:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.warn("createNotification notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function fetchNotifications(userId) {
  try {
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchNotifications notice:", err.message);
    return [];
  }
}

export async function markNotificationRead(notifId, isUnread = false) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ unread: isUnread })
      .eq('id', notifId)
      .select('*');

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("markNotificationRead notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function markAllNotificationsRead(userId) {
  try {
    const query = supabase
      .from('notifications')
      .update({ unread: false });

    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.is('user_id', null);
    }

    const { data, error } = await query.select('*');
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn("markAllNotificationsRead notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteNotificationRecord(notifId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notifId)
      .select('*');

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn("deleteNotificationRecord notice:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save user checklist state (readiness_checklist / diligence_checklist) directly to Supabase DB
 */
export async function saveUserChecklistToDb(userId, checklistKey, checkedItemsMap) {
  if (!userId) return { success: false, error: 'User not logged in' };

  try {
    const updateObj = {};
    updateObj[checklistKey] = checkedItemsMap;

    // 1. Update Supabase Auth User Metadata (persisted in auth.users)
    await supabase.auth.updateUser({ data: updateObj });

    // 2. Also attempt updating profiles table in Supabase
    try {
      await supabase
        .from('profiles')
        .update(updateObj)
        .eq('id', userId);
    } catch {
      // Column notice ignored if schema doesn't match
    }

    return { success: true };
  } catch (err) {
    console.warn(`Error saving ${checklistKey} to Supabase DB:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Load user checklist state directly from Supabase DB
 */
export async function loadUserChecklistFromDb(userId, checklistKey) {
  if (!userId) return {};

  try {
    // 1. Load from Supabase Auth User Metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.[checklistKey]) {
      return user.user_metadata[checklistKey];
    }

    // 2. Fallback to profiles table in Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.[checklistKey]) {
      return profile[checklistKey];
    }
  } catch (err) {
    console.warn(`Error loading ${checklistKey} from Supabase DB:`, err);
  }

  return {};
}

/**
 * Fetch Customer Orders from Supabase database
 */
export async function fetchCustomerOrdersFromDb() {
  try {
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchCustomerOrdersFromDb notice:', err.message);
    return [];
  }
}

/**
 * Update Customer Order status in Supabase database
 */
export async function updateCustomerOrderStatusInDb(orderId, status, driverId = null) {
  try {
    // Validate or generate valid UUID format for Postgres UUID column driver_id
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    let validDriverUuid = driverId;

    if (!isUuid(validDriverUuid)) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        validDriverUuid = crypto.randomUUID();
      } else {
        validDriverUuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
      }
    }

    const payload = {
      order_status: status,
      driver_id: validDriverUuid,
      updated_at: new Date().toISOString()
    };

    // 1. Try update matching primary key UUID `id`
    let { data, error } = await supabase
      .from('customer_orders')
      .update(payload)
      .eq('id', orderId)
      .select('*');

    // 2. Fallback: Try update matching `order_ref` (e.g. 'RK-4C5D4')
    if (error || !data || data.length === 0) {
      const resultByRef = await supabase
        .from('customer_orders')
        .update(payload)
        .eq('order_ref', orderId)
        .select('*');

      if (resultByRef.data && resultByRef.data.length > 0) {
        data = resultByRef.data;
        error = resultByRef.error;
      }
    }

    if (error) {
      console.warn('updateCustomerOrderStatusInDb warning:', error.message);
    }

    if (!data || data.length === 0) {
      console.warn('updateCustomerOrderStatusInDb notice: 0 rows modified. RLS policies likely blocking update.');
      return {
        success: false,
        error: 'RLS_BLOCKED',
        message: 'RLS Blocked: 0 rows modified in Supabase.',
        driverId: validDriverUuid
      };
    }

    return { success: true, data: data[0], driverId: validDriverUuid };
  } catch (err) {
    console.warn('updateCustomerOrderStatusInDb catch notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update the 'status' column in 'customer_orders' table
 */
export async function updateCustomerStatusColumnInDb(orderId, dbStatusValue) {
  try {
    // Map driver status to order_status
    let orderStatusValue = 'pending';
    if (dbStatusValue === 'delivered') {
      orderStatusValue = 'completed';
    } else if (dbStatusValue === 'ongoing') {
      orderStatusValue = 'in_transit';
    } else if (dbStatusValue === 'pending') {
      orderStatusValue = 'accepted';
    }

    const payload = {
      status: dbStatusValue,
      order_status: orderStatusValue,
      updated_at: new Date().toISOString()
    };

    // 1. Try update matching primary key UUID `id`
    let { data, error } = await supabase
      .from('customer_orders')
      .update(payload)
      .eq('id', orderId)
      .select('*');

    // 2. Fallback: Try update matching `order_ref`
    if (error || !data || data.length === 0) {
      const resultByRef = await supabase
        .from('customer_orders')
        .update(payload)
        .eq('order_ref', orderId)
        .select('*');

      if (resultByRef.data && resultByRef.data.length > 0) {
        data = resultByRef.data;
        error = resultByRef.error;
      }
    }

    if (error) {
      console.warn('updateCustomerStatusColumnInDb warning:', error.message);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'RLS_BLOCKED' };
    }

    return { success: true, data: data[0] };
  } catch (err) {
    console.warn('updateCustomerStatusColumnInDb catch notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * CPR & Notary Services Database Helpers for Supabase
 */

export async function fetchCprNotaryServices() {
  try {
    const { data, error } = await supabase
      .from('cpr_notary_services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchCprNotaryServices notice:", err.message);
    return [];
  }
}

export async function createCprNotaryService(serviceData) {
  try {
    const category = serviceData.category || 'cpr';
    const priceUnitToSave = serviceData.price_unit || (category === 'cpr' ? 'per person' : 'per signature');

    const payload = {
      category: category,
      title: serviceData.title,
      subtitle: serviceData.subtitle || '',
      description: serviceData.description || '',
      icon_name: serviceData.icon_name || 'health_and_safety',
      base_price: parseFloat(serviceData.base_price) || 0.0,
      per_unit_price: parseFloat(serviceData.per_unit_price) || 0.0,
      price_unit: priceUnitToSave,
      is_active: Boolean(serviceData.is_active),
      dynamic_fields: Array.isArray(serviceData.dynamic_fields) ? serviceData.dynamic_fields : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cpr_notary_services')
      .insert([payload])
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
      return { success: false, error: 'Insert returned 0 rows. Check Supabase RLS policies on cpr_notary_services table.' };
    }
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("createCprNotaryService notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function updateCprNotaryService(serviceId, serviceData) {
  try {
    const category = serviceData.category || 'cpr';
    const priceUnitToSave = serviceData.price_unit || (category === 'cpr' ? 'per person' : 'per signature');

    const payload = {
      category: category,
      title: serviceData.title,
      subtitle: serviceData.subtitle || '',
      description: serviceData.description || '',
      icon_name: serviceData.icon_name || 'health_and_safety',
      base_price: parseFloat(serviceData.base_price) || 0.0,
      per_unit_price: parseFloat(serviceData.per_unit_price) || 0.0,
      price_unit: priceUnitToSave,
      is_active: Boolean(serviceData.is_active),
      dynamic_fields: Array.isArray(serviceData.dynamic_fields) ? serviceData.dynamic_fields : [],
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('cpr_notary_services')
      .update(payload)
      .eq('id', serviceId)
      .select('*');

    if (error) {
      console.warn("updateCprNotaryService update warning:", error.message);
    }

    if (!data || data.length === 0) {
      const { data: upsertData, error: upsertErr } = await supabase
        .from('cpr_notary_services')
        .upsert({ id: serviceId, ...payload })
        .select('*');

      if (upsertErr) {
        return {
          success: false,
          error: error?.message || upsertErr.message || 'Supabase RLS Blocked: 0 rows modified. Enable UPDATE policy on cpr_notary_services table.'
        };
      }
      data = upsertData;
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Supabase RLS Blocked: 0 rows modified. Please check table permissions in Supabase dashboard.'
      };
    }

    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("updateCprNotaryService notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function toggleCprNotaryServiceStatus(serviceId, isActive) {
  try {
    const payload = {
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('cpr_notary_services')
      .update(payload)
      .eq('id', serviceId)
      .select('*');

    if (error) {
      console.warn("toggleCprNotaryServiceStatus update warning:", error.message);
    }

    if (!data || data.length === 0) {
      const { data: upsertData, error: upsertErr } = await supabase
        .from('cpr_notary_services')
        .upsert({ id: serviceId, ...payload })
        .select('*');

      if (upsertErr) {
        return {
          success: false,
          error: error?.message || upsertErr.message || 'Supabase RLS Blocked: 0 rows modified. Enable UPDATE policy on cpr_notary_services table.'
        };
      }
      data = upsertData;
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Supabase RLS Blocked: 0 rows modified. Please check table permissions in Supabase dashboard.'
      };
    }

    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("toggleCprNotaryServiceStatus catch notice:", err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteCprNotaryService(serviceId) {
  try {
    const { data, error } = await supabase
      .from('cpr_notary_services')
      .delete()
      .eq('id', serviceId)
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
      const { error: delErr } = await supabase
        .from('cpr_notary_services')
        .delete()
        .eq('id', serviceId);
      if (delErr) throw delErr;
    }
    return { success: true, data };
  } catch (err) {
    console.warn("deleteCprNotaryService notice:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch CPR & Notary Customer Bookings (Read Only)
 */
export async function fetchCprNotaryBookings() {
  try {
    let { data, error } = await supabase
      .from('cpr_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const fallback = await supabase
        .from('cpr_notary_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchCprNotaryBookings notice:", err.message);
    return [];
  }
}



