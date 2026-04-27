# WITS REGOLIA ORDER PROCESS (WROP) — MASTER PLAN v2
## For Claude Code

---

## 1. PROJECT OVERVIEW

**Project Name:** Wits Regolia Order Process (WROP)
**Purpose:** A multi-stakeholder web application that manages the full manufacturing pipeline for university apparel/merchandise orders. Universities track live order progress, upload documents, and approve key steps. Regolia manages and drives the process.

**Stack:**
- **Frontend:** React (Vite + React Router v6) — same pattern as suinventory
- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Hosting:** Firebase App Hosting
- **Language:** TypeScript throughout
- **Styling:** Tailwind CSS with Wits brand token overrides
- **Email:** SendGrid via Firebase Cloud Functions

> Note: React (web app), NOT React Native. React Native is for mobile apps. This is a web system identical in architecture to the existing suinventory.

---

## 2. BRAND & DESIGN SYSTEM

### Wits Colour Palette
```css
/* Core brand */
--wits-blue: #003DA5;        /* Primary — Wits official blue */
--wits-blue-light: #E6EEFF;  /* Blue tints for backgrounds */
--wits-blue-mid: #B5C8F4;    /* Blue for borders/dividers */
--wits-gold: #C9A84C;        /* Accent — Wits gold */
--wits-gold-light: #FBF4E3;  /* Gold tint backgrounds */
--wits-gold-mid: #F0D58A;    /* Gold borders */
--black: #111111;            /* Sidebar, headings */

/* Semantic */
--success: #3B6D11;
--success-bg: #EAF3DE;
--warning: #7A5A00;
--warning-bg: #FBF4E3;
--danger: #A32D2D;
--danger-bg: #FCEBEB;

/* Surface */
--surface: #F7F7F5;
--border: #E2E0D8;
```

### UI Rules
- Sidebar: black (`#111`) with gold left-border on active items
- Stat cards: white with `border-top: 3px solid --wits-blue` or `--wits-gold`
- Step tracker circles: completed = Wits blue filled, current = Wits gold filled, pending = light grey
- Order cards needing action: `border-left: 3px solid --wits-gold`
- Order cards in production: `border-left: 3px solid --wits-blue`
- All primary buttons: Wits blue background, white text
- Secondary/ghost buttons: white with Wits blue border and text
- Typography: Inter or system-ui; headings font-weight 500 only

---

## 3. USER ROLES

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `super_admin` | Regolia internal (you) | Full access: all orders, all users, step builder, skip/override steps |
| `admin` | University procurement officer | Create orders, approve Step 2 & Step 3, view all orders for their university |
| `university_staff` | Faculty department staff | View assigned orders, upload documents for Step 2, approve Step 2 only |
| `production` | Regolia production team | Update Steps 4 & 5, upload docs, mark steps complete |

**Critical rules:**
- No self-registration — accounts created by `super_admin` only via Firebase Admin
- New users receive a password-reset email to set their own password
- `university_staff` cannot approve Step 3 (design sign-off) — `admin` or higher only
- Users only see orders belonging to their own university
- `production` role sees all orders across all universities but cannot create orders

---

## 4. FIRESTORE DATA MODELS

### `users/{uid}`
```typescript
{
  uid: string
  email: string
  displayName: string
  role: 'super_admin' | 'admin' | 'university_staff' | 'production'
  universityId: string
  facultyId: string | null
  isActive: boolean
  createdAt: Timestamp
  createdBy: string  // uid of super_admin who created this user
}
```

### `universities/{universityId}`
```typescript
{
  name: string           // "University of the Witwatersrand"
  shortName: string      // "Wits"
  logoUrl: string
  primaryColour: string  // "#003DA5"
  accentColour: string   // "#C9A84C"
  createdAt: Timestamp
}
```

### `faculties/{facultyId}`
```typescript
{
  universityId: string
  name: string           // "Faculty of Engineering & Built Environment"
  contactEmail: string
}
```

### `stepTemplates/{templateId}` ← NEW: Step Builder
```typescript
{
  universityId: string | null  // null = global default template (applies to all)
  name: string                 // "Wits Default Process"
  isDefault: boolean
  steps: StepTemplate[]
  createdBy: string            // super_admin uid
  updatedAt: Timestamp
}

StepTemplate {
  stepNumber: number           // display order, can be reordered
  title: string                // e.g. "Design Sign-Off"
  description: string          // shown to university users
  requiresApproval: boolean
  canBeSkipped: boolean
  allowedUploaders: Role[]
  allowedApprovers: Role[]
  uploadTypes: string[]        // labels shown in UI e.g. ["CAD Files", "Mockups"]
  notifyRoles: Role[]          // who gets emailed when this step is activated
  colour: string               // hex for this step's visual accent in the tracker
}
```

### `orders/{orderId}` (CORE)
```typescript
{
  orderNumber: string          // "WROP-2026-0014"
  universityId: string
  facultyId: string
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  currentStepIndex: number     // index into steps array (0-based)
  title: string
  
  // Step template snapshot (copied from template at order creation)
  // This means step template changes don't retroactively alter existing orders
  stepTemplateId: string
  steps: OrderStep[]           // snapshot of template steps + runtime state
  
  // PO info
  poNumber: string
  poDocumentUrl: string
  orderItems: OrderItem[]
  notes: string
  estimatedDelivery: Timestamp | null
}

OrderItem {
  description: string          // "Grey Unisex Hoodie"
  quantity: number
  colour: string
  size: string | null          // null = assorted/mixed sizes
}

OrderStep {
  // From template (snapshot)
  stepNumber: number
  title: string
  description: string
  requiresApproval: boolean
  canBeSkipped: boolean
  allowedUploaders: Role[]
  allowedApprovers: Role[]
  uploadTypes: string[]
  notifyRoles: Role[]
  colour: string
  
  // Runtime state
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'approved' | 'skipped' | 'rejected'
  startedAt: Timestamp | null
  completedAt: Timestamp | null
  approvedBy: string | null    // uid
  approvedAt: Timestamp | null
  rejectionReason: string | null
  skippedBy: string | null
  skippedAt: Timestamp | null
  attachments: Attachment[]
  notes: string
}

Attachment {
  name: string
  url: string                  // Firebase Storage path
  fileType: string             // 'pdf' | 'image' | 'doc'
  uploadedBy: string           // uid
  uploadedByName: string
  uploadedAt: Timestamp
  sizeBytes: number
}
```

### `orders/{orderId}/activity/{activityId}` (Audit log)
```typescript
{
  type: 'order_created' | 'step_started' | 'document_uploaded' | 
        'step_approved' | 'step_rejected' | 'step_skipped' | 
        'note_added' | 'order_completed' | 'order_on_hold'
  stepIndex: number | null
  stepTitle: string | null
  message: string              // human-readable description
  performedBy: string          // uid
  performedByName: string
  performedByRole: Role
  timestamp: Timestamp
  metadata: Record<string, any> // extra context (e.g. rejection reason, file name)
}
```

---

## 5. THE STEP SYSTEM (Configurable)

### Default 5-Step Template (pre-loaded on first run)

| # | Title | Approval Required | Can Skip | Who Approves | Who Uploads |
|---|-------|-------------------|----------|--------------|-------------|
| 1 | Order confirmed | No | No | — | super_admin, admin |
| 2 | Sample & fit range | Yes | Yes | admin, university_staff | production, super_admin |
| 3 | Design sign-off | Yes | No | admin, super_admin | production, super_admin |
| 4 | Fabric & CMT | No | No | — | production, super_admin |
| 5 | Print, embroidery & QC | No | No | — | production, super_admin |

### Step Builder (super_admin only)

Located at `/admin/step-builder`. Allows super_admin to:

- **Add a step** — set title, description, toggle approval required, toggle skippable, select who can upload and who can approve, set notification targets
- **Remove a step** — cannot remove if any active order is currently on that step
- **Reorder steps** — drag and drop to change sequence (updates `stepNumber` values)
- **Edit step details** — change title, description, colours, notification rules
- **Create named templates** — e.g. "Wits Standard", "Wits Rush Order" (fewer steps), "Wits Reorder" (skip sample/fit)
- **Assign template to university** — a university can have a custom template or use the global default
- **Per-order step overrides** — super_admin can add or skip specific steps on an individual order without changing the template

**Important:** Editing a template does NOT retroactively affect existing active orders. Orders capture a snapshot of the template at creation time.

---

## 6. EMAIL NOTIFICATION SYSTEM

### Provider
**SendGrid** via Firebase Cloud Functions (Firestore `onDocumentUpdated` triggers)

### All 7 Email Triggers

| # | Trigger | Recipients | Subject |
|---|---------|------------|---------|
| 1 | Order created | University admin | "New order confirmed — WROP-{num}" |
| 2 | Step 2 activated (samples ready) | University admin + assigned university_staff | "Samples ready for your review — {order name}" |
| 3 | Step 3 activated (CADs uploaded) | University admin | "URGENT: Design approval required — {order name}" |
| 4 | Step 3 approved | Regolia production team inbox | "Design approved — clear to proceed — {order name}" |
| 5 | Step 3 rejected | Regolia production team inbox | "Design rejected — revision required — {order name}" (includes rejection reason) |
| 6 | Step 4 activated (in production) | University admin | "Your order is now in production — {order name}" |
| 7 | Order complete / delivered | University admin | "Order delivered — {order name}" (includes delivery note attachment) |

> Step Builder note: when a custom step is added, the `notifyRoles` field on that step controls who gets emailed when it activates. The Cloud Function reads this dynamically — no hardcoding of step numbers.

### Email Templates (SendGrid Dynamic Templates)
Each email includes:
- Wits blue header with WROP logo/wordmark
- Order reference number and title
- Current step and visual progress summary (text-based, not image)
- Direct deep link to the order page
- Action button if approval is needed ("Review & Approve →")
- Regolia contact footer

### Cloud Functions Structure
```
functions/
  src/
    index.ts
    triggers/
      onOrderCreated.ts       # Listens: orders onCreate
      onOrderStepUpdated.ts   # Listens: orders onUpdate → diffs currentStepIndex & step statuses
    email/
      sendgridClient.ts       # Initialised with SENDGRID_API_KEY secret
      templates.ts            # Template IDs per email type
      buildEmailData.ts       # Builds dynamic template data per email type
    utils/
      getUsersForRoles.ts     # Fetches user emails by role + universityId
```

### Production Team Email
All production-facing emails go to a **shared Regolia production inbox** (e.g. `production@regolia.co.za`). This is stored as an env var `PRODUCTION_TEAM_EMAIL` — not hardcoded.

---

## 7. PROJECT STRUCTURE (React + Vite)

```
wits-regolia/
├── src/
│   ├── main.tsx
│   ├── App.tsx                        # Router setup
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Orders/
│   │   │   ├── OrdersList.tsx
│   │   │   ├── OrderNew.tsx           # Create order + PO upload
│   │   │   ├── OrderDetail.tsx        # Live step tracker + activity log
│   │   │   └── OrderStep.tsx          # Step detail — upload, approve, reject
│   │   ├── Admin/
│   │   │   ├── Users.tsx
│   │   │   ├── UserNew.tsx
│   │   │   ├── StepBuilder.tsx        # super_admin only
│   │   │   └── Universities.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Black sidebar, gold accents, role-aware nav
│   │   │   ├── Topbar.tsx
│   │   │   └── ProtectedRoute.tsx     # Auth + role guard
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx          # Card with step tracker strip
│   │   │   ├── StepTracker.tsx        # Horizontal 5-dot progress component
│   │   │   ├── StepPanel.tsx          # Full step detail: docs, actions, notes
│   │   │   ├── DocumentUploader.tsx   # Drag-drop + file type validation
│   │   │   ├── ApprovalActions.tsx    # Approve / Reject buttons + reason modal
│   │   │   └── OrderItemsTable.tsx
│   │   ├── stepBuilder/
│   │   │   ├── StepBuilderCanvas.tsx  # Drag-drop step list
│   │   │   ├── StepCard.tsx           # Individual step config card
│   │   │   └── StepModal.tsx          # Add/edit step form
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── FilePreview.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                 # Auth state + role
│   │   ├── useOrder.ts                # Real-time order listener (onSnapshot)
│   │   ├── useOrders.ts               # Filtered orders list
│   │   └── useStepTemplate.ts
│   ├── lib/
│   │   ├── firebase.ts                # Client SDK init
│   │   ├── firestore.ts               # Typed read/write helpers
│   │   ├── storage.ts                 # Upload helpers
│   │   └── auth.ts                    # Login, logout, password reset
│   ├── utils/
│   │   ├── orderNumber.ts             # Generate WROP-YYYY-XXXX
│   │   ├── roleChecks.ts              # canApproveStep(), canUpload() etc
│   │   └── formatters.ts
│   └── types/
│       └── index.ts                   # All TypeScript interfaces
├── functions/                         # Firebase Cloud Functions (email)
├── firestore.rules
├── storage.rules
├── .env.local
└── firebase.json
```

---

## 8. KEY SCREENS

### Login (`/login`)
- Email + password only
- Wits blue header, WROP wordmark
- No registration link

### Dashboard (`/dashboard`)
- Stat cards: Active orders, Awaiting your action (gold), In production, Completed
- Order cards list — sorted by urgency (approval needed first)
- Each card shows: order ref, name, faculty, item chips, step tracker strip, status badge

### Order Detail (`/orders/:orderId`)
- Full horizontal step tracker at top (each step circle is clickable)
- Active step panel below — shows documents, upload button (if allowed), approve/reject (if allowed)
- Right sidebar: order info, PO reference, item breakdown, estimated delivery
- Activity log at bottom — full audit trail with timestamps and actor names
- Real-time via Firestore `onSnapshot`

### Order New (`/orders/new`) — admin/super_admin only
- University + faculty selector
- PO number input + PO document upload (PDF/Word)
- Order items builder — add rows (description, quantity, colour, size)
- Notes field
- On submit: generates order number, creates Firestore doc, triggers email #1

### Step Builder (`/admin/step-builder`) — super_admin only
- List of step templates (global + per-university)
- Each template shows its steps as a visual strip
- Click a template → open editor
- Editor: drag-to-reorder steps, add step button, click step to edit
- Step edit form: title, description, approval toggle, skip toggle, uploader roles checkboxes, approver roles checkboxes, notification targets, colour picker
- Save → updates `stepTemplates` Firestore doc

### Users (`/admin/users`) — super_admin only
- Table: name, email, role badge, university, status (active/inactive)
- New user button → form: name, email, role, university, faculty
- Creates Firebase Auth user + Firestore doc, sends password reset email
- Deactivate toggle (sets `isActive: false` — does not delete)

---

## 9. FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function role() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role; }
    function isSuperAdmin() { return isSignedIn() && role() == 'super_admin'; }
    function isAdmin() { return isSignedIn() && (role() == 'admin' || role() == 'super_admin'); }
    function isProduction() { return isSignedIn() && (role() == 'production' || role() == 'super_admin'); }
    function sameUni(universityId) {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.universityId == universityId;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isSuperAdmin());
      allow create, update, delete: if isSuperAdmin();
    }

    match /universities/{id} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }

    match /faculties/{id} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }

    match /stepTemplates/{id} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();  // only super_admin can modify templates
    }

    match /orders/{orderId} {
      allow read: if isSignedIn() && (
        isSuperAdmin() || isProduction() ||
        sameUni(resource.data.universityId)
      );
      allow create: if isAdmin();
      allow update: if isSignedIn() && (
        isSuperAdmin() || isProduction() ||
        (isAdmin() && sameUni(resource.data.universityId)) ||
        (role() == 'university_staff' && sameUni(resource.data.universityId))
      );
      allow delete: if isSuperAdmin();

      match /activity/{activityId} {
        allow read: if isSignedIn() && (
          isSuperAdmin() || isProduction() ||
          sameUni(get(/databases/$(database)/documents/orders/$(orderId)).data.universityId)
        );
        allow create: if isSignedIn();
        allow update, delete: if isSuperAdmin();
      }
    }
  }
}
```

---

## 10. STORAGE RULES

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /orders/{orderId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 20 * 1024 * 1024  // 20MB max
        && (request.resource.contentType.matches('application/pdf')
            || request.resource.contentType.matches('image/.*')
            || request.resource.contentType.matches('application/vnd.openxmlformats.*')
            || request.resource.contentType.matches('application/msword'));
    }
    match /universities/{universityId}/logo/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 11. AUTHENTICATION FLOW

1. `super_admin` creates user via `/admin/users/new` using Firebase Admin SDK
2. System calls `admin.auth().createUser({email, displayName})` + creates Firestore `users` doc
3. System calls `admin.auth().generatePasswordResetLink(email)` → sends via SendGrid
4. User clicks link → sets their password → lands on login page
5. User logs in → Firebase Auth token issued → stored in `localStorage` (Firebase handles this)
6. On app load: `onAuthStateChanged` listener checks token → fetches user doc from Firestore → sets role in React context
7. `ProtectedRoute` component checks auth + role on every protected page → redirects to `/login` if invalid

---

## 12. ENVIRONMENT VARIABLES

```bash
# Firebase Client (safe to expose — prefixed VITE_)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase Functions env (set via firebase functions:secrets:set)
SENDGRID_API_KEY=
PRODUCTION_TEAM_EMAIL=production@regolia.co.za
APP_URL=https://your-domain.web.app
```

---

## 13. DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "typescript": "^5.4.0",
    "firebase": "^10.12.0",
    "tailwindcss": "^3.4.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.383.0",
    "react-hot-toast": "^2.4.0",
    "react-dropzone": "^14.2.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 14. SECURITY CHECKLIST

- [ ] No Firebase Admin SDK usage in client-side code — admin SDK only in Cloud Functions
- [ ] All role checks enforced in Firestore rules (not just UI)
- [ ] File upload size capped at 20MB, MIME types whitelisted in Storage rules
- [ ] Users only query orders filtered by their `universityId`
- [ ] `university_staff` cannot approve Step 3 — enforced in `roleChecks.ts` AND Firestore rules
- [ ] Step template edits do NOT affect existing active orders (snapshot pattern)
- [ ] `isActive: false` users are blocked at auth context level — blocked from accessing any page
- [ ] SendGrid API key stored in Firebase Secret Manager, never in client bundle
- [ ] PRODUCTION_TEAM_EMAIL stored as secret — not hardcoded
- [ ] Password reset flow only — no user sets their own password initially
- [ ] All file download URLs are signed Firebase Storage URLs (not public)
- [ ] Input sanitised with Zod on all form submissions
- [ ] Activity log written on every state-changing action (non-deletable by non-super_admin)

---

## 15. IMPLEMENTATION ORDER FOR CLAUDE CODE

Build in this exact sequence:

1. Firebase project setup — init, Auth, Firestore, Storage, deploy rules
2. Vite + React scaffold — TypeScript, Tailwind, router, folder structure
3. Wits design tokens — Tailwind config with brand colours
4. Auth system — login page, `onAuthStateChanged`, auth context, `ProtectedRoute`
5. User management — super_admin creates users, password reset email via SendGrid
6. Step template system — seed default 5-step template, `stepTemplates` collection
7. Order creation (Step 1) — PO upload, item builder, order number generation
8. Dashboard — stat cards, order list with step tracker strip, role-filtered
9. Order detail — real-time `onSnapshot`, step tracker, active step panel
10. Document upload flow — drag-drop, Storage upload, Firestore attachment write
11. Approval / rejection flow — role-gated buttons, rejection reason modal
12. Step advancement logic — auto-advance on approval, notify next step actors
13. Step Builder UI — drag-reorder, add/edit/remove steps, template management
14. Cloud Functions — SendGrid email triggers for all 7 notification types
15. Activity log — audit trail component on order detail page
16. Universities & Faculties admin — settings pages
17. Polish — loading states, empty states, error boundaries, toast notifications

---

## 16. DESIGN NOTES FOR CLAUDE CODE

- Sidebar is always **black (`#111`)**, never white or grey
- Active nav item has **gold left border** (`border-left: 3px solid #C9A84C`) and white text
- Order cards needing action get **gold left border**
- Order cards in production get **Wits blue left border**
- Step tracker circles: **Wits blue = completed**, **Wits gold = current/attention needed**, **light grey = pending**
- Completed steps show a **white checkmark** inside the blue circle
- Stat cards use `border-top: 3px solid` accent (blue or gold depending on context)
- All primary CTAs: `background: #003DA5; color: white`
- "Approve" button: Wits blue
- "Reject" button: red/danger
- "Skip step" button: ghost/outline only — not prominent
- University logos should appear on university-specific cards where space allows
- The step builder should use `@dnd-kit` for drag-and-drop — same library pattern to keep consistent

---

*WROP Master Plan v2 — confirmed stack: React + Firebase*
*Colours: Wits blue (#003DA5) + gold (#C9A84C) + black (#111) on white*
*Email: SendGrid via Cloud Functions*
*Step builder: super_admin only, dynamic templates, snapshot on order creation*
