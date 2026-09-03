# RouteK9 — Stripe Payment System Architecture & Integration Guide

This document outlines the complete, production-ready payment flow across **RouteK9 Frontend** (React / Vite) and **RouteK9 Backend** (Node.js / Express / Stripe SDK).

---

## 1. System Architecture Overview

```
[ User Browser / React App ]
      │
      │ 1. Request Checkout Session
      ▼
[ Node.js Backend (Port 5000) ] ── (Secret Key `sk_...`) ──► [ Stripe API ]
      │                                                           │
      │ 2. Returns `clientSecret`                                 │ 3. Generates Session
      ▼                                                           ▼
[ Stripe Embedded Checkout Iframe ] ◄── (Public Token `pk_...`) ─┘
      │
      │ 4. User Enters Card & Clicks "Pay"
      ▼
[ Stripe Gateway Charges Card ]
      │
      │ 5. Redirects to `return_url?session_id=cs_...`
      ▼
[ React Page Detects `session_id` ]
      │
      │ 6. Syncs Database (Supabase `transactions`, `profiles`, `driver_certifications`)
      ▼
[ Unlocks Feature / Shows Confirmation / Syncs Admin Dashboard ]
```

---

## 2. Payment Flows Breakdown

### A. Route K9 PRO Membership (Monthly & Yearly Subscriptions)
* **Pages**: `/pricing`, `/pro-checkout`
* **Stripe Mode**: `subscription`
* **Backend Price Mapping**:
  - **Monthly ($29.00/mo)**: `price_1UBCfECjtUNWPqGvQmM7HqCL`
  - **Yearly ($299.00/yr)**: `price_1UBCfxCjtUNWPqGvAgJkM7A5`
* **Flow**:
  1. User selects plan on `/pricing` and is routed to `/pro-checkout?cycle=monthly` (or `yearly`).
  2. Backend looks up or creates the permanent Stripe Customer ID.
  3. Stripe Embedded Checkout generates a recurring subscription session.
  4. Upon successful payment, Stripe redirects to `return_url` with `session_id`.
  5. The system records the transaction into Supabase `transactions` and sets `is_pro: true` & `membership: 'Pro'` in `profiles`.
  6. The user gains access to PRO features across the platform (Bid access, direct messaging, gold **`★ Pro`** badge).

---

### B. Training Course Purchases ($49.00 One-Time)
* **Pages**: `/training`, `/training/:courseId`, `/checkout/:courseId`
* **Stripe Mode**: `payment`
* **Flow**:
  1. User browses courses on `/training` (e.g. *Master Contractor Training*).
  2. Clicks **"Enroll in Course ($49)"** -> Navigates to `/checkout/:courseId`.
  3. Backend creates a one-time payment session for `$49.00 USD`.
  4. User enters payment details via Stripe's embedded iframe.
  5. Upon return, `transactions` is updated with `course_id: ':courseId'` and `status: 'Succeeded'`.
  6. The course is added to `purchasedCourses` and unlocked in the driver's learning dashboard.

---

### C. HIPAA & Bloodborne Pathogens Certification ($25.00 One-Time)
* **Pages**: `/certification`
* **Stripe Mode**: `payment`
* **Flow**:
  1. Driver takes the 25-question exam on `/certification`.
  2. Upon scoring 80%+, reaches **Stage 4 (Checkout)**.
  3. Backend creates a one-time session for `$25.00 USD` (`planId: 'hipaa_certificate'`).
  4. Upon payment completion, the receipt is stored in `transactions`, and a unique credential (e.g. `K9-CERT-728192`) is issued in `driver_certifications`.
  5. Driver advances to **Stage 5 (Paid)** to instantly download their official PDF certificate.
  6. Driver profile is awarded the verified **"HIPAA Certified"** credential in the Admin Console.

---

## 3. Backend Endpoints (`RouteK9_Backend`)

### `POST /api/v1/payments/create-checkout-session`
* **Description**: Creates a secure Stripe Checkout Session with embedded UI mode.
* **Request Body**:
  ```json
  {
    "planId": "pro_monthly",
    "email": "driver@routek9.com",
    "fullName": "Jane Driver",
    "productName": "Route K9 PRO Membership (Monthly)",
    "amountInCents": 2900,
    "returnUrl": "http://localhost:5173/pro-checkout?cycle=monthly&session_id={CHECKOUT_SESSION_ID}"
  }
  ```
* **Response**:
  ```json
  {
    "clientSecret": "cs_live_..._secret_...",
    "sessionId": "cs_live_..."
  }
  ```

---

## 4. Database Schema Relationships

| Table | Primary Columns | Purpose |
|---|---|---|
| **`transactions`** | `id` (`session_id`), `user_id`, `email`, `course_id`, `description`, `amount`, `status`, `created_at` | Financial ledger of all completed payments. |
| **`profiles`** | `id`, `email`, `full_name`, `role`, `is_pro`, `membership`, `subscription_plan` | User account details and active PRO membership status. |
| **`driver_certifications`** | `id`, `driver_id`, `course_id`, `course_name`, `cert_number`, `issued_at` | Issued exam certificates with verification numbers. |

---

## 5. Customer Management & Re-subscription Deduplication

To ensure clean customer records and avoid duplicate accounts when expired or returning users buy plans again, the backend executes a 3-step customer lookup (`customer.service.js`):

1. **Supabase Profile Lookup**:
   - Checks the user's `profiles` table for an existing `stripe_customer_id` (`cus_...`).
2. **Stripe Email Match**:
   - If not found in the database, queries Stripe API by customer email:
     ```javascript
     stripe.customers.list({ email: cleanEmail, limit: 1 })
     ```
3. **Customer Reuse**:
   - If a customer record exists in Stripe, it attaches the new subscription/checkout session to the **same Customer ID**.
   - If no customer exists, it creates a new Stripe Customer and persists `stripe_customer_id` to Supabase.
   - **Result**: Expired users re-purchasing a plan, upgrading to yearly, or buying courses will **never create duplicate customer accounts** in Stripe. All invoices remain under one unified customer profile.

---

## 6. Security & Best Practices

1. **PCI-DSS Compliance**:
   - Zero raw credit card data touches RouteK9 servers. Card details are transmitted directly to Stripe via iframe tokenization.
2. **Backend-Enforced Pricing**:
   - Subscription price IDs (`price_1UBC...`) are hardcoded / environment-bound on the backend, preventing client-side price tampering.
3. **Session Deduplication**:
   - Global promise caching in the frontend prevents duplicate simultaneous API requests during component re-renders.
4. **Test Mode vs. Live Mode Separation**:
   - Admin Revenue metrics strictly filter out test sandbox payments from real income analytics.

---

## 7. Going Live Checklist

1. **Stripe Keys**:
   - In `D:\RouteK9_Backend\.env`: Set `STRIPE_SECRET_KEY=sk_live_...`
   - In `d:\RouteK9\.env`: Set `VITE_PAYMENTS_CLIENT_TOKEN=pk_live_...`
2. **Bank Account Details**:
   - Verify active payout bank account in the Stripe Dashboard (**Settings > Bank accounts and scheduling**).
3. **Price IDs**:
   - Ensure the live Price IDs match in `D:\RouteK9_Backend\src\config\env.js`:
     - `STRIPE_PRICE_MONTHLY=price_1UBCfECjtUNWPqGvQmM7HqCL`
     - `STRIPE_PRICE_YEARLY=price_1UBCfxCjtUNWPqGvAgJkM7A5`
