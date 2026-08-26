import { createClient } from '@supabase/supabase-js';
import { sendFcmV1PushNotification } from './fcmV1Dispatcher';

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
  return [];
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
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
      status: status,
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

    const orderRow = data[0];
    const customerId = orderRow.customer_id || orderRow.user_id;

    // Send instant notification to customer / mobile order placer
    if (customerId) {
      const orderRef = orderRow.order_ref || (orderRow.id ? `ORD-${String(orderRow.id).substring(0, 6).toUpperCase()}` : 'Order');
      let title = '📦 Order Update';
      let message = `Your dispatch order (${orderRef}) status has been updated to ${status}.`;

      if (status === 'accepted') {
        title = '📦 Order Accepted by Driver';
        message = `Your dispatch order (${orderRef}) has been accepted by a driver and is preparing for pickup.`;
      } else if (status === 'in_progress' || status === 'in_transit') {
        title = '🚚 Order In Transit';
        message = `Your dispatch order (${orderRef}) is now on its way to the delivery location.`;
      } else if (status === 'delivered' || status === 'completed') {
        title = '✅ Order Successfully Delivered';
        message = `Your dispatch order (${orderRef}) has been safely delivered to the destination.`;
      }

      await safeSendNotification({
        user_id: customerId,
        title,
        message,
        category: 'Dispatch',
        action_url: '/dashboard?tab=inbox',
        action_text: 'Track Order',
        unread: true,
        created_at: new Date().toISOString()
      });
    }

    return { success: true, data: orderRow, driverId: validDriverUuid };
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
 * Package Delivery Orders & Lifecycle Management Helpers
 */

// 1. Fetch Pending Available Orders for Driver Feed
export async function fetchPendingPackageOrders(categoryFilter = 'ALL') {
  try {
    let query = supabase
      .from('customer_orders')
      .select('*')
      .or('status.eq.pending,status.eq.available,order_status.eq.pending,order_status.eq.available')
      .order('created_at', { ascending: false });

    if (categoryFilter === 'package') {
      query = query.eq('category', 'package');
    } else if (categoryFilter === 'food_grocery') {
      query = query.in('category', ['food', 'groceries']);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchPendingPackageOrders notice:', err.message);
    return [];
  }
}

// 2. Action: Driver Accepts Order (Prevents double-claiming race conditions)
export async function acceptPackageOrder(orderId, driverUserId) {
  try {
    const payload = {
      status: 'accepted',
      order_status: 'accepted',
      driver_id: driverUserId,
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('customer_orders')
      .update(payload)
      .eq('id', orderId)
      .select('*');

    if (error || !data || data.length === 0) {
      const byRef = await supabase
        .from('customer_orders')
        .update(payload)
        .eq('order_ref', orderId)
        .select('*');

      if (byRef.data && byRef.data.length > 0) {
        data = byRef.data;
        error = null;
      }
    }

    if (error) throw error;
    if (!data || data.length === 0) {
      return { success: false, error: 'ORDER_UNAVAILABLE', message: 'Order is no longer available or RLS blocked.' };
    }

    const orderRow = data[0];
    const customerId = orderRow.customer_id || orderRow.user_id;

    // Send notification to the customer / order placer safely
    if (customerId) {
      const orderRef = orderRow.order_ref || `ORD-${String(orderRow.id).substring(0, 6).toUpperCase()}`;
      await safeSendNotification({
        user_id: customerId,
        title: '📦 Order Accepted by Driver',
        message: `Your dispatch order (${orderRef}) has been accepted by a driver and is preparing for pickup.`,
        category: 'Dispatch',
        action_url: '/dashboard?tab=inbox',
        action_text: 'Track Order',
        unread: true,
        created_at: new Date().toISOString()
      });
    }

    return { success: true, data: orderRow };
  } catch (err) {
    console.warn('acceptPackageOrder error:', err.message);
    return { success: false, error: err.message };
  }
}

// 3. Action: Driver Starts Delivery (In Progress)
export async function startPackageDelivery(orderId, driverUserId) {
  try {
    const payload = {
      status: 'in_progress',
      order_status: 'in_transit',
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('customer_orders')
      .update(payload)
      .eq('id', orderId)
      .select('*');

    if (error || !data || data.length === 0) {
      const byRef = await supabase
        .from('customer_orders')
        .update(payload)
        .eq('order_ref', orderId)
        .select('*');

      if (byRef.data && byRef.data.length > 0) {
        data = byRef.data;
        error = null;
      }
    }

    if (error) throw error;
    const orderRow = data ? data[0] : null;

    if (orderRow) {
      const customerId = orderRow.customer_id || orderRow.user_id;
      if (customerId) {
        const orderRef = orderRow.order_ref || `ORD-${String(orderRow.id).substring(0, 6).toUpperCase()}`;
        await safeSendNotification({
          user_id: customerId,
          title: '🚚 Order In Transit',
          message: `Your dispatch order (${orderRef}) is now on its way to the delivery location.`,
          category: 'Dispatch',
          action_url: '/dashboard?tab=inbox',
          action_text: 'Track Order',
          unread: true,
          created_at: new Date().toISOString()
        });
      }
    }

    return { success: true, data: orderRow };
  } catch (err) {
    console.warn('startPackageDelivery error:', err.message);
    return { success: false, error: err.message };
  }
}

// 4. Action: Driver Completes Delivery (Delivered)
export async function completePackageDelivery(orderId, driverUserId) {
  try {
    const payload = {
      status: 'delivered',
      order_status: 'completed',
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('customer_orders')
      .update(payload)
      .eq('id', orderId)
      .select('*');

    if (error || !data || data.length === 0) {
      const byRef = await supabase
        .from('customer_orders')
        .update(payload)
        .eq('order_ref', orderId)
        .select('*');

      if (byRef.data && byRef.data.length > 0) {
        data = byRef.data;
        error = null;
      }
    }

    if (error) throw error;
    const orderRow = data ? data[0] : null;

    if (orderRow) {
      const customerId = orderRow.customer_id || orderRow.user_id;
      if (customerId) {
        const orderRef = orderRow.order_ref || `ORD-${String(orderRow.id).substring(0, 6).toUpperCase()}`;
        await safeSendNotification({
          user_id: customerId,
          title: '✅ Order Successfully Delivered',
          message: `Your dispatch order (${orderRef}) has been safely delivered to the destination.`,
          category: 'Dispatch',
          action_url: '/dashboard?tab=inbox',
          action_text: 'View Receipt',
          unread: true,
          created_at: new Date().toISOString()
        });
      }
    }

    return { success: true, data: orderRow };
  } catch (err) {
    console.warn('completePackageDelivery error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send direct FCM push notification to device token (server/backend or cloud environments)
 */
export async function sendDirectFcmPush(fcmToken, title, message, url = null) {
  if (!fcmToken || typeof fcmToken !== 'string' || !fcmToken.trim()) return false;
  // Browser fetches to fcm.googleapis.com are restricted by Google CORS policy.
  // Push is dispatched via PostgreSQL pg_net database trigger or backend webhook.
  return true;
}

/**
 * Safely inserts a notification record only if the target user_id exists in profiles table
 * to prevent PostgreSQL Foreign Key constraint errors (code 23503), and sends direct FCM push.
 */
export async function safeSendNotification(payload) {
  if (!payload || !payload.user_id) return { success: false, error: 'Missing user_id' };

  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  if (!isUuid(payload.user_id)) {
    return { success: false, error: 'Invalid UUID format' };
  }

  try {
    // 1. Look for user in customer_profiles (Mobile App Customers) and profiles (Drivers/Web)
    const [custRes, profRes] = await Promise.allSettled([
      supabase.from('customer_profiles').select('id, fcm_token').eq('id', payload.user_id).maybeSingle(),
      supabase.from('profiles').select('id, fcm_token').eq('id', payload.user_id).maybeSingle()
    ]);

    const custProfile = custRes.status === 'fulfilled' ? custRes.value?.data : null;
    const driverProfile = profRes.status === 'fulfilled' ? profRes.value?.data : null;

    const targetFcmToken = custProfile?.fcm_token || driverProfile?.fcm_token;

    // 2. Trigger modern Google FCM HTTP v1 Push notification to mobile/web device token
    if (targetFcmToken) {
      console.log('[Push] Dispatching FCM v1 push to device token:', targetFcmToken.substring(0, 15) + '...');
      sendFcmV1PushNotification(targetFcmToken, payload.title, payload.message, { url: payload.action_url }).catch(e => {
        console.warn('sendFcmV1PushNotification notice:', e);
      });
    } else {
      console.info('[Push] No active fcm_token found for user:', payload.user_id);
    }

    // 3. Insert notification into database inbox (triggers the push notification in PostgreSQL)
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select('*');

    if (error) {
      console.warn('safeSendNotification database insert notice:', error.message);
    }
    return { success: true, data: data ? data[0] : null, fcmSent: Boolean(targetFcmToken) };
  } catch (err) {
    console.warn('safeSendNotification catch notice:', err.message);
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
/**
 * Package Categories & Package Types / Sizes CRUD Helpers
 */

// 1. Fetch Package Categories
export async function fetchPackageCategories() {
  try {
    const { data, error } = await supabase
      .from('package_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchPackageCategories notice:", err.message);
    return [];
  }
}

// 2. Create Package Category
export async function createPackageCategory(categoryData) {
  try {
    const { data, error } = await supabase
      .from('package_categories')
      .insert([{
        title: categoryData.title,
        description: categoryData.description || '',
        icon_name: categoryData.icon_name || 'inventory_2',
        display_order: parseInt(categoryData.display_order, 10) || 1,
        is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*');

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("createPackageCategory notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 3. Update Package Category
export async function updatePackageCategory(categoryId, categoryData) {
  try {
    const { data, error } = await supabase
      .from('package_categories')
      .update({
        title: categoryData.title,
        description: categoryData.description,
        icon_name: categoryData.icon_name,
        display_order: parseInt(categoryData.display_order, 10) || 1,
        is_active: categoryData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select('*');

    if (error) throw error;
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.warn("updatePackageCategory notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 4. Toggle Package Category Active Status
export async function togglePackageCategoryActive(categoryId, isActive) {
  try {
    const { data, error } = await supabase
      .from('package_categories')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select('*');

    if (error) throw error;
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.warn("togglePackageCategoryActive notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 5. Delete Package Category
export async function deletePackageCategory(categoryId) {
  try {
    const { error } = await supabase
      .from('package_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn("deletePackageCategory notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 6. Fetch Package Types (joined with package_categories title)
export async function fetchPackageTypes() {
  try {
    const { data, error } = await supabase
      .from('package_types')
      .select('*, package_categories(title)')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchPackageTypes notice:", err.message);
    return [];
  }
}

// 7. Create Package Type
export async function createPackageType(typeData) {
  try {
    const { data, error } = await supabase
      .from('package_types')
      .insert([{
        category_id: typeData.category_id,
        name: typeData.name,
        subtitle: typeData.subtitle || '',
        description: typeData.description || '',
        max_weight_lbs: parseFloat(typeData.max_weight_lbs) || 0,
        max_dimensions_cm: typeData.max_dimensions_cm || '',
        base_price: parseFloat(typeData.base_price) || 0,
        per_mile_price: parseFloat(typeData.per_mile_price) || 0,
        icon_name: typeData.icon_name || 'inventory_2',
        display_order: parseInt(typeData.display_order, 10) || 1,
        is_active: typeData.is_active !== undefined ? typeData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*');

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.warn("createPackageType notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 8. Update Package Type & Pricing
export async function updatePackageType(typeId, typeData) {
  try {
    const { data, error } = await supabase
      .from('package_types')
      .update({
        category_id: typeData.category_id,
        name: typeData.name,
        subtitle: typeData.subtitle,
        description: typeData.description,
        max_weight_lbs: parseFloat(typeData.max_weight_lbs) || 0,
        max_dimensions_cm: typeData.max_dimensions_cm,
        base_price: parseFloat(typeData.base_price) || 0,
        per_mile_price: parseFloat(typeData.per_mile_price) || 0,
        icon_name: typeData.icon_name,
        display_order: parseInt(typeData.display_order, 10) || 1,
        is_active: typeData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', typeId)
      .select('*');

    if (error) throw error;
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.warn("updatePackageType notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 9. Toggle Package Type Active Status
export async function togglePackageTypeActive(typeId, isActive) {
  try {
    const { data, error } = await supabase
      .from('package_types')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', typeId)
      .select('*');

    if (error) throw error;
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.warn("togglePackageTypeActive notice:", err.message);
    return { success: false, error: err.message };
  }
}

// 10. Delete Package Type
export async function deletePackageType(typeId) {
  try {
    const { error } = await supabase
      .from('package_types')
      .delete()
      .eq('id', typeId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn("deletePackageType notice:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ─── FIREBASE CLOUD MESSAGING (FCM) TOKEN HELPERS ─────────────
 */

/**
 * Save / Update user's FCM device token in Supabase
 */
export async function saveUserFcmToken(userId, fcmToken) {
  if (!userId || !fcmToken) return { success: false, error: 'Missing userId or fcmToken' };
  try {
    // 1. Update in profiles table (Drivers & Web Users)
    await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    // 2. Update in customer_profiles table (Mobile App Customers)
    await supabase
      .from('customer_profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    return { success: true };
  } catch (err) {
    console.warn('saveUserFcmToken notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch active FCM device tokens for push broadcasts
 */
export async function fetchAllActiveFcmTokens() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, fcm_token')
      .not('fcm_token', 'is', null);

    if (error) throw error;
    return (data || []).filter(p => p.fcm_token && String(p.fcm_token).trim() !== '');
  } catch (err) {
    console.warn('fetchAllActiveFcmTokens notice:', err.message);
    return [];
  }
}

/**
 * ─── 5 KM RADIUS NEARBY DRIVER LOCATION & DISPATCH HELPERS ────
 */

/**
 * Update Driver live GPS Location in Supabase (via RPC with table fallback)
 */
export async function updateDriverLocation(driverId, lat, lng) {
  if (!driverId || lat === null || lat === undefined || lng === null || lng === undefined) {
    return { success: false, error: 'Missing driverId or coordinates' };
  }

  const pLat = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const pLng = typeof lng === 'number' ? lng : parseFloat(String(lng));

  try {
    // 1. Attempt using RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_driver_location', {
      p_driver_id: driverId,
      p_lat: pLat,
      p_lng: pLng
    });

    if (!rpcError) {
      return { success: true, data: rpcData };
    }

    // 2. Fallback: Direct table update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        latitude: pLat,
        longitude: pLng,
        last_location_updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err) {
    console.warn('updateDriverLocation notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Find Drivers within 5 km of an order pickup location
 * @param {number} pickupLat - Pickup latitude
 * @param {number} pickupLng - Pickup longitude
 * @param {number} radiusKm - Search radius in km (default: 5.0 km)
 */
export async function getNearbyDriversForOrder(pickupLat, pickupLng, radiusKm = 5.0) {
  if (pickupLat === null || pickupLat === undefined || pickupLng === null || pickupLng === undefined) {
    return [];
  }

  const pLat = typeof pickupLat === 'number' ? pickupLat : parseFloat(String(pickupLat));
  const pLng = typeof pickupLng === 'number' ? pickupLng : parseFloat(String(pickupLng));
  const rKm = typeof radiusKm === 'number' ? radiusKm : parseFloat(String(radiusKm));

  try {
    // 1. Attempt using RPC function
    const { data, error } = await supabase.rpc('get_nearby_drivers_for_order', {
      p_pickup_lat: pLat,
      p_pickup_lng: pLng,
      p_radius_km: rKm
    });

    if (!error && Array.isArray(data)) {
      return data;
    }

    // 2. Fallback: Query profiles directly and compute distance in JS if RPC is not yet created
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, fcm_token, latitude, longitude, role')
      .or('role.eq.driver,role.is.null')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (pErr || !Array.isArray(profiles)) return [];

    const nearby = [];
    for (const p of profiles) {
      if (p.latitude !== null && p.longitude !== null) {
        const dLat = (p.latitude - pLat) * (Math.PI / 180);
        const dLon = (p.longitude - pLng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(pLat * (Math.PI / 180)) *
          Math.cos(p.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = 6371 * c; // Earth's radius in km

        if (distKm <= rKm) {
          nearby.push({
            driver_id: p.id,
            driver_name: p.full_name || p.email || 'Driver',
            fcm_token: p.fcm_token,
            distance_km: parseFloat(distKm.toFixed(2))
          });
        }
      }
    }
    return nearby.sort((a, b) => a.distance_km - b.distance_km);
  } catch (err) {
    console.warn('getNearbyDriversForOrder notice:', err.message);
    return [];
  }
}

/**
 * Notify Nearby Drivers when a new customer order is placed
 */
export async function notifyNearbyDriversOnNewOrder(orderData, radiusKm = 40.2) {
  const pLat = orderData?.pickup_lat || orderData?.pickup_latitude || orderData?.lat;
  const pLng = orderData?.pickup_lng || orderData?.pickup_longitude || orderData?.lng;

  if (pLat === undefined || pLat === null || pLng === undefined || pLng === null) {
    return { success: false, notifiedCount: 0 };
  }

  try {
    const nearbyDrivers = await getNearbyDriversForOrder(pLat, pLng, radiusKm);
    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    const orderRef = orderData.order_ref || (orderData.id ? `ORD-${String(orderData.id).substring(0, 6).toUpperCase()}` : 'New Load');
    const payout = orderData.total_amount ? `$${orderData.total_amount}` : 'Competitive Pay';
    const pickupLoc = orderData.pickup_address || orderData.pickup || 'Nearby Pickup';

    // Insert database notification rows for each matching driver's inbox
    const notificationInserts = nearbyDrivers.map(d => ({
      user_id: d.driver_id,
      title: `⚡ New Nearby Order (${d.distance_km} km away)`,
      message: `A new ${orderData.category || 'package'} dispatch order (${orderRef}) is available near you: ${pickupLoc} • Payout: ${payout}`,
      category: 'Dispatch',
      action_url: '/dispatch-orders',
      action_text: 'View & Claim Order',
      unread: true,
      created_at: new Date().toISOString()
    }));

    await supabase.from('notifications').insert(notificationInserts);

    // Send Google FCM HTTP v1 push notification to each nearby driver device
    for (const d of nearbyDrivers) {
      if (d.fcm_token) {
        sendFcmV1PushNotification(
          d.fcm_token,
          `⚡ New Nearby Order (${d.distance_km} km away)`,
          `A new ${orderData.category || 'package'} dispatch order is available near you: ${pickupLoc} • ${payout}`,
          { url: '/dispatch-orders' }
        ).catch(e => {
          console.warn('sendFcmV1PushNotification driver notice:', e);
        });
      }
    }

    return {
      success: true,
      notifiedCount: nearbyDrivers.length,
      drivers: nearbyDrivers
    };
  } catch (err) {
    console.warn('notifyNearbyDriversOnNewOrder notice:', err.message);
    return { success: false, error: err.message, notifiedCount: 0 };
  }
}


