# RouteK9 — Project Development Skill

---

## Metadata

```yaml
name: routek9-project
description: >
  Complete development guide for the RouteK9 delivery-route marketplace platform.
  Covers architecture, patterns, conventions, authentication, state management,
  API integration, admin panel, UI rules, and golden reference files.
  Every rule is grounded in actual existing code — not generic best practices.
```

---

## 1. What Is RouteK9?

RouteK9 is a **React + Vite + Supabase** web platform for the US independent delivery driver and courier industry. It lets:

- **Drivers** find open delivery routes, join companies, plan routes, take training courses, earn certifications, and claim dispatch orders.
- **Companies** post jobs, find drivers, and manage fleets.
- **Admins** manage all users, courses, revenue, gov contracts, dispatch orders, and vehicles via a separate internal admin panel.

---

## 2. Tech Stack (exact versions from `package.json`)

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.7 | UI framework |
| Vite | ^8.1.1 | Build tool & dev server |
| TailwindCSS v4 | ^4.3.3 | Styling (via `@tailwindcss/vite` plugin) |
| React Router DOM | ^7.18.1 | Client-side routing |
| Supabase JS | ^2.111.0 | Auth + database backend |
| Stripe React | ^6.8.0 | Embedded payment checkout |
| Framer Motion | ^12.42.2 | Animations |
| Lucide React | ^1.27.0 | Icons (exclusively used) |
| d3-geo + d3-scale | ^3.1.1 / ^4.0.2 | US map rendering |
| react-simple-maps | ^3.0.0 | US choropleth map |
| jsPDF | ^4.2.1 | PDF generation (route planner export) |
| leaflet | ^1.9.4 | Interactive map in RoutePlanner |
| react-phone-input-2 | ^2.15.1 | Phone number fields |
| clsx + tailwind-merge | ^2.1.1 / ^3.6.0 | Class merging utilities |
| oxlint | ^1.71.0 | Linting (run with `npm run lint`) |

> **CRITICAL**: TailwindCSS v4 is used via the Vite plugin `@tailwindcss/vite` — NOT the PostCSS/config method. The CSS entry is `@import "tailwindcss"` in `src/index.css`. There is NO `tailwind.config.js`.

---

## 3. Project Folder Structure

```
RouteK9/
├── .env                          # Supabase + Stripe + SAM.gov API keys
├── .agents/skills/routek9-project/SKILL.md  # This file
├── .oxlintrc.json
├── index.html                    # HTML entry point (Google Fonts loaded here)
├── vite.config.js                # Vite config with /api/samgov and /api/stripe proxies
├── package.json
└── src/
    ├── main.jsx                  # App entry: BrowserRouter wraps App
    ├── App.jsx                   # MASTER FILE — all routing, global state, auth logic
    ├── index.css                 # Global styles, CSS variables, font declarations
    ├── assets/                   # Static images
    ├── components/               # 27 shared UI components
    ├── pages/                    # Full page components (20 user pages)
    │   └── admin/                # Admin panel (14 pages + AdminLayout)
    │       └── components/       # Admin-only shared components (AdminComponents.jsx)
    ├── context/
    │   └── ToastContext.jsx       # Global toast notification system
    ├── data/                     # Static/mock data + vehicleTypes hook
    └── lib/                      # Supabase, Stripe, courses service files
```

---

## 4. Architecture

### 4.1 Entry Point Chain

```
main.jsx → BrowserRouter → App.jsx
```

`App.jsx` is the **single source of truth** for:
- `currentUser` (null = logged out)
- `purchasedCourses` (array of course IDs)
- `savedUserRoutes`
- All Supabase auth session sync
- All `<Route>` definitions
- Global handlers: `handleLogin`, `handleLogout`, `handleUpgradePro`, `handleUpdateProfile`

### 4.2 Three Routing Zones

| Zone | Wrapper | Routes |
|---|---|---|
| **Auth pages** | None (full-screen) | `/login`, `/signup`, `/resetpass`, `/mobile-reset-password`, `/complete-profile` |
| **Admin panel** | `AdminLayout` | `/admin` (all subsections via `?section=` param) |
| **All other pages** | `Layout` (Navbar + Footer + Outlet) | `/`, `/pricing`, `/dashboard`, `/planner`, `/dispatch-orders`, etc. |

### 4.3 URL Conventions

- Page routes: `/training`, `/dispatch-orders`, `/certification` (kebab-case)
- Dashboard tabs: `/dashboard?tab=inbox` | `?tab=profile` | `?tab=settings`
- Admin sections: `/admin?section=drivers` | `?section=courses`
- Notifications: `/notifications` → `<Navigate to="/dashboard?tab=inbox" replace />`

---

## 5. Design System & Styling

### 5.1 Fonts

- **Body/UI text**: `Inter` — all `div`, `p`, `span`, `button`, `input`
- **Headings**: `Playfair Display` — all `h1`, `h2`, `h3` and `.font-serif-heading`

### 5.2 Brand Colors

| Token | Value | Use |
|---|---|---|
| Primary Dark | `#0b132b` | Dark backgrounds, sidebar, body text |
| Accent | `#e11d48` / `rose-600` | CTAs, active states, badges |
| PRO Gradient | `from-rose-600 to-amber-500` | Upgrade/PRO buttons |
| App Background | `#FAF9F6` | Main light background |
| Slate scale | `slate-200/400/500/700/900` | Borders, muted text |
| PRO Amber | `amber-400/500` | PRO crown icons, plan badges |
| Success | `emerald-500` | Verified, success states |

### 5.3 Custom CSS Classes (`src/index.css`)

```
.glass-card          — glassmorphism card (bg rgba, backdrop-blur, border)
.state-path          — US map SVG state styling
.state-path.selected — selected US state (red fill)
.font-serif-heading  — force Playfair Display on any element
.patriot             — route planner background context
.animate-toast-progress — toast progress bar shrink animation
```

### 5.4 TailwindCSS Conventions

- No `tailwind.config.js` — TailwindCSS v4 Vite plugin only
- Arbitrary values: `bg-[#0b132b]`, `text-[10px]`, `h-[72px]`
- Border radius: `rounded-xl` (inputs), `rounded-2xl` (cards), `rounded-3xl` (modals)
- Selection: `selection:bg-rose-600 selection:text-white`

---

## 6. State Management

**No global state library** — no Redux, Zustand, or MobX.

| Mechanism | What It Stores |
|---|---|
| `useState` in `App.jsx` | `currentUser`, `purchasedCourses`, `gateModalState` |
| Prop drilling | `currentUser`, `onLogout`, `onOpenPricing`, `onTriggerGateModal` |
| `ToastContext` | Toast notification queue (ONLY React Context in the app) |
| `useSearchParams` | Dashboard tabs + Admin sections |
| `localStorage` | Tab persistence (`routek9_dashboard_active_tab_v1`), vehicle cache |
| Cookie + localStorage | `routek9_user_session` (30-day), `routek9_purchased_courses` |

### 6.1 `currentUser` Object Shape

```js
{
  id: string,              // Supabase UUID
  name: string,
  email: string,
  role: 'driver' | 'company' | 'admin',
  vehicle: string,
  stateCode: string,
  city: string,
  phone: string,
  dotNumber: string,
  insurancePolicy: string,
  experience: string,
  availability: string,
  hasCDL: boolean,
  readyToWork: boolean,
  websiteUrl: string,
  avatarUrl: string,
  bio: string,
  isPro: boolean,
  subscriptionPlan: 'free' | 'pro' | 'yearly',
  subscribedAt: string | null,
  nextRenewal: string | null
}
```

---

## 7. Authentication

### 7.1 User Auth (Supabase)

- Email+password and Google OAuth via Supabase Auth
- Single listener: `supabase.auth.onAuthStateChange()` in `App.jsx`
- After every sign-in: `syncSupabaseProfile(session.user)` loads profile from `profiles` table
- Deactivated accounts (`status === 'INACTIVE'` or `is_active === false`) → immediate signout

### 7.2 Onboarding Guard

- After signup: redirect to `/complete-profile` if `!profile.onboarding_completed` and profile lacks `phone` + `city`
- Admin users skip onboarding

### 7.3 Admin Auth (Two-Layer, Separate)

1. Supabase Auth: must have `profiles.role = 'admin'`
2. Session token: `rk9_adm_tok_*` in `sessionStorage` (8-hour expiry)

```js
// sessionStorage keys used by admin:
'routek9_admin_auth'   // 'true'
'routek9_admin_token'  // 'rk9_adm_tok_...'
'routek9_admin_exp'    // timestamp
```

Token validated every 30 seconds by `validateAdminToken()` in `AdminLayout.jsx`.

### 7.4 User Roles

| Role | Value | Access |
|---|---|---|
| Driver | `'driver'` | All user pages including Dispatch Orders |
| Company | `'company'` | Companies page, no Dispatch Orders |
| Admin | `'admin'` | Admin panel only |

```js
const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
const isCompany = currentUser?.role?.toLowerCase() === 'company';
const isDriver = currentUser?.role?.toLowerCase() === 'driver';
```

### 7.5 PRO Feature Gating

```jsx
// In any page that has PRO-gated features:
function MyPage({ currentUser, onTriggerGateModal }) {
  const handleProAction = () => {
    if (!currentUser?.isPro) {
      onTriggerGateModal({ title: "Unlock X", message: "Requires PRO." });
      return;
    }
    // proceed
  };
}
```

`ProFeatureGateModal` is rendered globally in `App.jsx` and always mounted.

---

## 8. Supabase Integration Patterns

### 8.1 Client Import

```js
// Always use this import — never create a new client
import { supabase } from '../lib/supabase';        // from components/pages
import { supabase } from '../../lib/supabase';     // from admin pages
```

### 8.2 Standard Read Helper

```js
export async function fetchSomething(param) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('column', param)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchSomething notice:", err.message);
    return [];   // always return empty array on failure
  }
}
```

### 8.3 Standard Write Helper

```js
export async function writeSomething(data) {
  try {
    const { data: result, error } = await supabase
      .from('table').insert([data]).select('*');
    if (error) throw error;
    return { success: true, data: result[0] };
  } catch (err) {
    console.warn("writeSomething notice:", err.message);
    return { success: false, error: err.message };
  }
}
```

### 8.4 Profile Upsert Pattern

```js
// Correct way to save user profile:
const { error } = await supabase.from('profiles').upsert({
  id: userId,
  full_name: ...,
  phone: ...,
  state_code: ...,   // DB uses snake_case
  updated_at: new Date().toISOString()
});
```

### 8.5 Field Name Mapping

When reading profile data, always check both conventions:
```js
profile.dot_number || profile.dotNumber
profile.state_code || profile.stateCode
profile.avatar_url || profile.avatarUrl || profile.avatar
profile.full_name   // DB write column
```

### 8.6 Supabase Tables Reference

| Table | Purpose |
|---|---|
| `profiles` | User data (main) |
| `driver_profiles` | Extended driver data |
| `company_profiles` | Extended company data |
| `driver_certifications` | Certification records |
| `route_bids` | Driver route applications |
| `notifications` | In-app notifications |
| `transactions` | Payments (courses + PRO subs) |
| `customer_orders` | Dispatch order marketplace |
| `vehicle_types` | Dynamic vehicle list |
| `saved_routes` | Routes saved in planner |
| `courses` | Training course catalog |

### 8.7 Error Logging Convention

```js
console.warn("functionName notice:", err.message);    // non-critical soft errors
console.error("functionName error:", err);             // critical/unexpected errors only
```

---

## 9. Stripe Payment Integration

### 9.1 Files

- `src/lib/stripe.js` — `getStripe()` (lazy singleton), `getStripeEnvironment()`
- `src/lib/payments.functions.js` — `createCertificationCheckout({ data })`
- `src/components/StripeEmbeddedCheckout.jsx` — full UI component

### 9.2 Checkout Creation Flow

```
createCertificationCheckout({ data: { priceId, fullName, returnUrl, priceAmount, productName } })
  1. Try direct Stripe API with sk_live_ key (if present)
  2. Fallback: POST to /api/stripe/v1/checkout/sessions (Vite proxy → Lovable Gateway)
  → returns { clientSecret } or { error }
```

### 9.3 Vite Proxies (dev only)

```js
// vite.config.js
'/api/samgov' → https://api.sam.gov
'/api/stripe' → https://connector-gateway.lovable.dev/stripe
```

### 9.4 PRO Subscription IDs

```
Monthly: course_id = 'pro-monthly'  ($29/mo, valid 30 days)
Yearly:  course_id = 'pro-yearly'   ($299/yr, valid 365 days)
```

---

## 10. Component Patterns

### 10.1 Shared Components Catalog

| Component | Location | Purpose |
|---|---|---|
| `Toast` | `src/components/Toast.jsx` | Types: `error|success|warning|info` |
| `ToastProvider` / `useToast` | `src/context/ToastContext.jsx` | Global toast system |
| `ProFeatureGateModal` | `src/components/ProFeatureGateModal.jsx` | PRO upsell popup |
| `StripeEmbeddedCheckout` | `src/components/StripeEmbeddedCheckout.jsx` | Stripe embedded UI |
| `ScrollToTop` | `src/components/ScrollToTop.jsx` | Scroll reset on route change |
| `PaymentTestModeBanner` | `src/components/PaymentTestModeBanner.jsx` | Test mode warning |
| `RouteCard` | `src/components/RouteCard.jsx` | Route listing card |
| `RouteDetailModal` | `src/components/RouteDetailModal.jsx` | Route detail popup |
| `USMap` | `src/components/USMap.jsx` | US choropleth map |

### 10.2 Admin Shared Components (`src/pages/admin/components/AdminComponents.jsx`)

```js
export function formatPhoneNumber(phone)   // Formats phone to standard format
export function ConfirmModal(...)          // Confirmation dialog for destructive actions
export function StatCardSkeleton()        // Loading skeleton for stat cards
```

### 10.3 Standard Page Props

```jsx
// Inside Layout (user pages):
<PageName currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} />

// With PRO gating:
<PageName currentUser={currentUser} onLogout={handleLogout} onOpenPricing={handleOpenPricing} onTriggerGateModal={handleTriggerGateModal} />

// Auth pages (standalone):
<LoginPage onLogin={handleLogin} />
```

### 10.4 Modal Pattern

```jsx
// Render pattern:
{isOpen && <MyModal onClose={() => setIsOpen(false)} />}
// or early return:
if (!isOpen) return null;

// Modal container:
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md p-6">
    {/* close button: absolute top-3 right-3 */}
  </div>
</div>
```

### 10.5 Loading State Pattern

```jsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
  </div>
) : (
  /* content */
)}

// Button:
<button disabled={loading} className="... disabled:opacity-75">
  {loading
    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
    : <span>Submit</span>
  }
</button>
```

---

## 11. Admin Panel

### 11.1 Architecture

Single route `/admin`, all navigation via `?section=key` query params. No sub-routes. `AdminLayout.jsx` is the entire admin shell.

### 11.2 Section Registry (SIDEBAR_ITEMS in AdminLayout.jsx)

```
dashboard, drivers, customers, companies, gov_contracts,
dispatch_orders, vehicles, courses, exam_questions, revenue, settings
```

### 11.3 Adding a New Admin Section

1. Add entry to `SIDEBAR_ITEMS` in `AdminLayout.jsx`
2. Create `src/pages/admin/AdminNewSection.jsx`
3. Import it in `AdminLayout.jsx`
4. Add `case 'new_section': return <AdminNewSection />;` in `renderSection()`

### 11.4 Shared Admin Data Props (`listProps`)

```js
const listProps = {
  loading, error, searchQuery, setSearchQuery,
  onRefresh: fetchSupabaseData,
  sortField, setSortField, sortDir, setSortDir
};
// Used as: <AdminDriverList users={filteredDrivers} {...listProps} />
```

---

## 12. Data Files

### 12.1 `src/data/statesData.js`

```js
US_STATES['TX']   // object with code, name, topCities, openRoutes
US_STATES_LIST    // [{ code, name }] for dropdowns
```

### 12.2 `src/data/vehicleTypes.js` (CRITICAL)

```js
// ALWAYS use this hook for vehicle dropdowns:
const vehicleClasses = useVehicleClasses(); // reads Supabase + localStorage cache
export const COMPANY_FLEET_OPTION = "Company Fleet / Multi-Vehicle";
```

**Never hardcode vehicle arrays.** The hook fetches from `vehicle_types` Supabase table.

### 12.3 Mock Data

Located in `src/data/mock*.js`. Used as static seed data for initial UI state — NOT as database replacements. Real data always comes from Supabase.

---

## 13. Icons

**Only `lucide-react`** — no other icon library is used anywhere in the project.

```js
import { Truck, MapPin, Loader2, Crown, CheckCircle2 } from 'lucide-react';
```

Standard sizes: `w-4 h-4` (inline), `w-5 h-5` (feature), `w-6 h-6` (prominent), `w-[18px] h-[18px]` (nav)
Loading: Always `<Loader2 className="w-4 h-4 animate-spin" />`

---

## 14. Error Handling & Validation

### 14.1 Form Error Pattern

```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    // work
  } catch (err) {
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

// Error display:
{error && (
  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-fadeIn">
    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
    <span className="text-xs font-bold text-rose-300">{error}</span>
  </div>
)}
```

### 14.2 Toast Usage

```js
// Direct (for page-level toasts):
const [toast, setToast] = useState(null);
setToast({ message: "Saved!", type: "success" });
{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

// Context (for components):
const { showToast } = useToast();
showToast("Profile saved!", "success");
showToast("Failed to load", "error");
showToast("Payment required", "warning");
showToast("New message", "info");
```

---

## 15. Naming Conventions

### Files

- Pages: `PascalCase` + `Page` suffix → `DashboardPage.jsx`
- Admin pages: `Admin` prefix → `AdminCourses.jsx`
- Components: `PascalCase` → `ProFeatureGateModal.jsx`
- Lib files: `camelCase.js` → `supabase.js`, `payments.functions.js`
- Data files: `camelCase.js` → `mockRoutes.js`, `statesData.js`

### Functions

- Handlers: `handle` prefix → `handleLogin`, `handleAdminLogout`
- DB helpers: `verb + noun` → `fetchDriverProfiles`, `updateBidStatus`
- Booleans: `is`/`has`/`show` prefix → `isAdmin`, `isPro`, `hasLoadedRef`

### State Variables

- Data lists: plural nouns → `drivers`, `orders`
- Active selections: `active`/`selected` prefix → `activeTab`, `selectedState`
- Modal state: `<Name>ModalState` or `is<Name>Open`

---

## 16. Business Logic Rules

### PRO Membership

- Monthly: `$29/mo`, `course_id = 'pro-monthly'`, valid 30 days
- Yearly: `$299/yr`, `course_id = 'pro-yearly'`, valid 365 days
- Re-verified from `transactions` table on every session load

### Dispatch Orders Status Flow

```
AVAILABLE → ACCEPTED → IN_TRANSIT → COMPLETED
```
Both `order_status` and `status` columns updated on every status change.

### Account Deactivation

Checked in `syncSupabaseProfile`:
```js
profile.status === 'INACTIVE' || profile.status === 'DEACTIVATED'
|| profile.is_active === false || profile.isactive === false
```
→ `supabase.auth.signOut()` called immediately.

---

## 17. Golden Reference Files

| Pattern | File |
|---|---|
| All DB helpers | `src/lib/supabase.js` |
| Auth + session management | `src/App.jsx` (`syncSupabaseProfile`) |
| Full page with DB + tabs | `src/pages/DispatchOrdersPage.jsx` |
| Admin section with multi-tabs | `src/pages/admin/AdminDriverList.jsx` |
| Admin layout + sidebar | `src/pages/admin/AdminLayout.jsx` |
| Admin login form | `src/pages/admin/AdminLoginPage.jsx` |
| Onboarding flow | `src/pages/CompleteProfilePage.jsx` |
| Stripe checkout | `src/components/StripeEmbeddedCheckout.jsx` |
| Toast system | `src/context/ToastContext.jsx` + `src/components/Toast.jsx` |
| PRO gate modal | `src/components/ProFeatureGateModal.jsx` |
| Admin shared utilities | `src/pages/admin/components/AdminComponents.jsx` |
| Vehicle types hook | `src/data/vehicleTypes.js` |
| Course data formatting | `src/lib/courses.js` |
| Tab-based dashboard | `src/pages/DashboardPage.jsx` |

---

## 18. Rules for Adding New Features

### New User Page

1. Create `src/pages/NewPage.jsx` with `export default function NewPage({ currentUser, onLogout })`
2. Import + add route in `App.jsx` (inside `<Route element={<Layout ...>}>` for Navbar+Footer)
3. Add nav link in `Navbar.jsx` if user-accessible
4. Handle PRO gating with `onTriggerGateModal` if needed

### New Admin Section

1. Add to `SIDEBAR_ITEMS` in `AdminLayout.jsx`
2. Create `src/pages/admin/AdminNewSection.jsx`
3. Import + add `case` in `renderSection()` switch

### New Supabase Helper

1. Add to `src/lib/supabase.js` as named export
2. Use try/catch, return `data || []` for reads, `{ success, error }` for writes
3. Use `console.warn("funcName notice:", err.message)`

### New Form

1. `loading` + `error` state
2. Error display with `AlertCircle` + rose colors
3. Submit button with `disabled={loading}` + `Loader2 animate-spin`
4. Phone field → `react-phone-input-2`
5. Vehicle dropdown → `useVehicleClasses()` hook

### New PRO-Gated Feature

1. Accept `onTriggerGateModal` prop
2. Check `currentUser?.isPro` before action
3. Call `onTriggerGateModal({ title, message })` for free users

---

## 19. What NOT To Do

| Do Not | Reason |
|---|---|
| Add Redux/Zustand/MobX | State flows through App.jsx props |
| Use React Context for user state | User lives in App.jsx useState |
| Hardcode vehicle type arrays | Use `useVehicleClasses()` hook |
| Create per-component CSS files | Use Tailwind utility classes only |
| Make direct Stripe API calls | Use `payments.functions.js` + proxy |
| Add `tailwind.config.js` | TailwindCSS v4 uses Vite plugin |
| Use any icon library other than lucide-react | Project standardizes on lucide-react |
| Create admin sub-routes (`/admin/drivers`) | Admin uses single route + `?section=` |
| Show raw Supabase errors to users | Map to friendly messages |
| Use `console.error` for soft DB notices | Use `console.warn` with "notice:" suffix |
| Add routes outside `App.jsx` | All routes declared in one place |

---

## 20. Validate Any Change Against

- Works with `currentUser === null` (logged out)?
- Works for all roles: `driver`, `company`, `admin`?
- Works with `currentUser.isPro === false` (free plan)?
- Supabase errors handled → returns empty data + user-friendly message?
- Colors follow brand palette (rose/slate/amber/emerald, not plain red/blue)?
- All icons from `lucide-react`?
- Loading states use `Loader2 animate-spin`?
- New DB field mappings handle both `snake_case` and `camelCase` variants?

---

## 21. Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (proxies active)
npm run lint     # Run oxlint
npm run build    # Build for production
npm run preview  # Preview production build
```

*Auto-generated from RouteK9 codebase analysis. Last updated: 2026-08-19.*
