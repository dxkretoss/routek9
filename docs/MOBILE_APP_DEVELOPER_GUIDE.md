# RouteK9 - Mobile App Developer Integration Guide

## Purpose
This document specifies the required setup and conventions for the **RouteK9 Mobile Customer App** to ensure seamless synchronization with the Supabase database and prevent cross-platform authentication conflicts with the Web Platform (Drivers & Companies).

---

## 1. User Registration (Mobile Sign Up)

When registering a new customer via the Mobile App using Supabase Auth, you **must** pass `role: 'customer'` inside the `options.data` payload.

### Example (React Native / Flutter / JS SDK):

```javascript
import { supabase } from './supabaseClient';

const handleCustomerSignup = async (email, password, fullName, phone) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: 'customer',           // REQUIRED: Identifies user as a Mobile Customer
        user_role: 'customer',      // Fallback identifier
        account_type: 'customer',   // Fallback identifier
        app_platform: 'mobile',     // Identifies registration source
        phone: phone || ''
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
};
```

---

## 2. Table Structure & Data Separation

| Entity | Relevant Table | Notes |
| :--- | :--- | :--- |
| **Mobile Customers** | `customer_profiles` | Mobile app users store profile details here. |
| **Customer Orders** | `customer_orders` | Linked to customer via `customer_id` (`auth.uid()`). |
| **Drivers & Companies** | `profiles` | **DO NOT** query or write to `profiles` for mobile customers. |

### Customer Profile Record in `customer_profiles`:
If your app performs a manual profile insert or update after sign-up / phone verification:
```javascript
const { error } = await supabase
  .from('customer_profiles')
  .upsert({
    id: userId,
    full_name: fullName,
    email: email,
    phone: phone,
    fcm_token: fcmToken,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString()
  });
```

---

## 3. Mobile Customer Login Verification

When a customer logs into the Mobile App, ensure you verify that they are a Customer and not a Driver/Company account trying to log into the mobile app:

```javascript
const handleCustomerLogin = async (email, password) => {
  // 1. Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password
  });

  if (error) throw error;

  const user = data.user;
  const userRole = (user?.user_metadata?.role || '').toLowerCase();

  // 2. Reject Drivers & Companies from Customer Mobile App
  if (userRole === 'driver' || userRole === 'company' || userRole === 'admin') {
    await supabase.auth.signOut();
    throw new Error("This account is registered as a Driver/Company on the Web Platform. Please use the RouteK9 Driver/Company web portal.");
  }

  // 3. Fetch Customer Profile
  const { data: customerProfile, error: profileErr } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { user, customerProfile };
};
```

---

## 4. Summary Checklist for Mobile Developer:
- [ ] Ensure `role: 'customer'` is passed in `options.data` during `supabase.auth.signUp()`.
- [ ] Ensure customer data is queried from and written to `customer_profiles` (not `profiles`).
- [ ] Block accounts with `role: 'driver'` or `role: 'company'` from accessing the customer mobile app.
