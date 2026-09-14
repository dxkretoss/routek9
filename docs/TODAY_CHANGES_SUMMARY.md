# RouteK9 Web Platform - Authentication & Role Flow Changes

## Date: September 14, 2026

---

## 1. Overview & Architecture Separation

The platform now enforces a strict separation between **Web Platform Users** and **Mobile App Customers**:

| Entity / User Type | Target Table | Platform | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Driver / Courier** | `profiles` | Web Platform | Web Login & Web Registration |
| **Dispatch Company** | `profiles` & `company_profiles` | Web Platform | Web Login & Web Registration |
| **Admin / Dispatcher** | `profiles` | Web Platform | Web Login & Admin Console |
| **Customer / Sender** | `customer_profiles` | Mobile App | Mobile App Only (Blocked on Web) |

---

## 2. Key Changes Made in Web Codebase

### A. [`src/lib/supabase.js`](file:///d:/RouteK9/src/lib/supabase.js)
- **Updated `verifyUserPlatformRole`**:
  - Checks the `profiles` table first. If a valid Driver, Company, or Admin record is found, the user is immediately authenticated as a web platform user.
  - If the user does not exist in `profiles`, it checks `customer_profiles`. If found only in `customer_profiles` (or metadata `role: 'customer'`), access is rejected from the web platform.
  - If the user exists in neither table (new registration), registration is allowed to proceed.

### B. [`src/pages/SignupPage.jsx`](file:///d:/RouteK9/src/pages/SignupPage.jsx)
- **Pre-Registration Checks**:
  1. Checks `profiles` to prevent duplicate driver/company accounts.
  2. Checks `customer_profiles` to prevent mobile customers from registering as drivers/companies with the same email.
- **Supabase Auth Registration**:
  - Explicitly sends `role`, `user_role`, `user_type`, `account_type`, and `app_platform: 'web'` in `options.data` when calling `supabase.auth.signUp()`.
- **Database Upsert**:
  - Inserts exclusively into the `profiles` table with `role: 'driver'` or `role: 'company'`.
  - Removes any accidental ghost rows created in `customer_profiles`.

### C. [`src/pages/LoginPage.jsx`](file:///d:/RouteK9/src/pages/LoginPage.jsx)
- **Pre-Auth Check**:
  - Prevents pure mobile customer accounts from logging into the web.
  - Allows valid Drivers, Companies, and Admins to authenticate smoothly.
- **Password Reset**:
  - Verifies that the email belongs to a registered web platform user (`profiles`) before triggering the reset email.
- **Post-Auth Profile Fetching**:
  - Uses resilient `.maybeSingle()` with email fallback to ensure newly created profiles load without throwing unhandled exceptions.

### D. [`src/pages/admin/AdminCustomerList.jsx`](file:///d:/RouteK9/src/pages/admin/AdminCustomerList.jsx)
- **Customer Directory Filtering**:
  - Cross-references all loaded customer profiles with `profiles` and `company_profiles`.
  - Actively filters out any account that is registered as a Driver or Company.
  - Removed in-memory component cache to guarantee fresh live data on every load.

---

## 3. Required Supabase Database Trigger Update (SQL)

Run the following SQL in your **Supabase Dashboard -> SQL Editor** to ensure database triggers do not copy web users into `customer_profiles`:

```sql
-- 1. Update the database trigger to ONLY insert Customers (with phone and fcm_token)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  user_role := LOWER(COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'user_role',
    NEW.raw_user_meta_data->>'user_type',
    NEW.raw_user_meta_data->>'account_type',
    ''
  ));

  -- ONLY insert into customer_profiles if the user registered as a 'customer' (Mobile App)
  IF user_role = 'customer' THEN
    INSERT INTO public.customer_profiles (id, email, full_name, phone, fcm_token)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
      COALESCE(NEW.raw_user_meta_data->>'fcm_token', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone),
      full_name = COALESCE(EXCLUDED.full_name, customer_profiles.full_name),
      fcm_token = COALESCE(EXCLUDED.fcm_token, customer_profiles.fcm_token);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop any legacy triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_customer_profile_trigger ON auth.users;

-- 3. Attach clean trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Clean up any driver/company records currently in customer_profiles
DELETE FROM public.customer_profiles 
WHERE id IN (
  SELECT id FROM public.profiles WHERE role::text IN ('driver', 'company', 'admin')
)
OR email IN (
  SELECT email FROM public.profiles WHERE role::text IN ('driver', 'company', 'admin')
);
```
