# 🎓 Capstone Portal

A full-stack **Final Year Project (FYP) management portal** built with Next.js 15, TypeScript, Tailwind CSS v4, and Firebase. Supports two roles, **Admin** and **Faculty**, with real-time data, Firebase authentication, role-based access control, project evaluation system, and bulk Excel import.

---

## 📸 Features

### Admin
- Login with email/password or Google OAuth
- View all projects with search and bulk selection
- Import projects from Excel (.xlsx) with duplicate detection and conflict resolution dialogue
- Change project status (Pending → Under Review → Accepted → Rejected)
- Bulk delete or individually delete projects — all with proper UI confirmation dialogues (no browser alerts)
- View, add, edit, and delete faculty members
- View individual faculty detail page with their supervised projects

### Faculty
- Login with email/password or Google OAuth
- View all assigned projects with search
- View and evaluate projects — separate screens for each
- **Phase-based evaluation system** (Synopsis → Progress → Demo → Final)
  - Phases unlock sequentially — must complete each phase for ALL students before advancing
  - Each student was evaluated independently, with per-student data stored separately
  - Rating questions (1–5 scale with colour-coded labels) and Grade questions (Approved/Excellent/Redo, etc.)
  - Live progress tracking per student and per phase
  - Auto-navigation to the next student/phase on completion
- Dashboard with personal project stats
- Sidebar never reloads during navigation — only the content area updates

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Frontend framework with file-based routing |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Firebase Auth | Email/password and Google authentication |
| Cloud Firestore | NoSQL real-time database |
| react-hot-toast | Toast notifications |
| lucide-react | Icon library |
| xlsx (SheetJS) | Excel file parsing for bulk import |

---

## 📁 Project Structure

```
capstoneportal/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Admin route guard + sidebar wrapper
│   │   ├── dashboard/page.tsx      # Admin dashboard with stats
│   │   ├── projects/
│   │   │   ├── page.tsx            # All projects + Excel import
│   │   │   └── [id]/page.tsx       # Project detail + delete
│   │   ├── faculty/
│   │   │   ├── page.tsx            # Faculty list + add/delete
│   │   │   ├── new/page.tsx        # Add new faculty form
│   │   │   └── [id]/page.tsx       # Edit faculty detail
│   │
│   │   
│   ├── faculty/
│   │   ├── dashboard/page.tsx      # Faculty dashboard with stats
│   │   └── projects/
│   │       ├── page.tsx            # Faculty's projects (view + evaluate)
│   │       └── [id]/
│   │           ├── page.tsx        # Project detail view
│   │           └── evaluate/
│   │               └── page.tsx    # Phase-based evaluation form
│   ├── login/page.tsx              # Login page
│   ├── layout.tsx                  # Root layout with AuthProvider + Toaster
│   └── page.tsx                    # Redirects to /login
├── components/
│   ├── AdminLayout.tsx             # Persistent sidebar layout (never reloads)
│   ├── ConfirmDialog.tsx           # Reusable UI confirm dialog (replaces browser alerts)
│   ├── ProjectsTable.tsx           # Reusable projects table (admin + faculty)
│   ├── ExcelUpload.tsx             # Excel import modal with duplicate detection
│   ├── FacultyExcelUpload.tsx      # Faculty bulk import modal
│   └── FacultyTable.tsx            # Faculty table with inline edit
├── context/
│   └── AuthContext.tsx             # Global auth state
├── lib/
│   ├── firebase.ts                 # Firebase init (primary + secondary app)
│   └── auth.ts                     # Auth helper functions
├── types/
│   └── index.ts                    # TypeScript interfaces
└── .env.local                      # Firebase config (not committed)
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/capstoneportal.git
cd capstoneportal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a Firebase project
1. Go to [firebase.google.com](https://firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password and Google providers
4. Enable **Cloud Firestore** database
5. Go to Project Settings → Web App → copy the config

### 4. Set up environment variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Set Firestore security rules
In Firebase Console → Firestore → Rules:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /evaluations/{evalId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Create an admin account
In Firebase Console → Authentication → Add user:
- **Email:** `admin@university.edu`
- **Password:** `University@123`

Then in Firestore → `users` collection → Add document with the admin's Auth UID:
```
name            → Admin User
email           → admin@university.edu
role            → admin
gender          → Male
department      → Administration
designation     → System Admin
phone           → 03001234567
profileComplete → true (boolean)
```

### 7. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 8. Import real project data (Excel)
1. Go to **Admin → Projects → Import from Excel** to upload projects

---

## 👥 Default Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | admin@university.edu | University@123 | Admin |
| Dr. Ayesha Malik | ayesha.malik@university.edu | University@123 | Faculty |
| Dr. Imran Khalid | imran.khalid@university.edu | University@123 | Faculty |
| Dr. Khalid Mehmood | khalid.mehmood@university.edu | University@123 | Faculty |
| Dr. Sana Javed | sana.javed@university.edu | University@123 | Faculty |

---

## 🗄️ Firestore Collections

### `users`
| Field | Type | Description |
|---|---|---|
| uid | string | Document ID = Firebase Auth UID |
| name | string | Full name |
| email | string | Login email |
| role | string | `"admin"` or `"faculty"` |
| gender | string | `"Male"` or `"Female"` |
| department | string | Department name |
| designation | string | Professor / Associate Professor etc. |
| phone | string | Contact number |
| joinedAt | timestamp | Account creation date |
| profileComplete | boolean | Profile setup status |

### `projects`
| Field | Type | Description |
|---|---|---|
| title | string | Project title |
| supervisor | string | Faculty name (denormalised) |
| supervisorId | string | Firebase Auth UID of supervisor |
| coSupervisor | string | Co-supervisor name or `"None"` |
| students | array | List of student names |
| studentCount | number | Length of students array |
| industrialPartner | string | Company name or `"None"` |
| sdg | string | e.g. `"SDG 4"`, `"SDG 11"` |
| status | string | `pending` / `under_review` / `accepted` / `rejected` |
| uploadedBy | string | UID of creator or `"excel_import"` |
| uploadedAt | timestamp | Creation date |
| updatedAt | timestamp | Last update date |

### `evaluations`
| Field | Type | Description |
|---|---|---|
| projectId | string | Reference to project document |
| projectTitle | string | Cached project title |
| facultyId | string | UID of evaluating faculty |
| facultyName | string | Name of evaluating faculty |
| synopsis | object | `{ studentName: { questionId: value } }` |
| progress | object | Same structure as synopsis |
| demo | object | Same structure as synopsis |
| final | object | Same structure as synopsis |
| updatedAt | timestamp | Last save timestamp |

---

## 🔐 Role-Based Access Control

| Feature | Admin | Faculty |
|---|---|---|
| View all projects | ✅ | ❌ |
| View own assigned projects | ✅ | ✅ |
| Add / import projects | ✅ | ❌ |
| Change project status | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Evaluate projects (per-student, per-phase) | ❌ | ✅ |
| View all faculty | ✅ | ❌ |
| Add / import faculty | ✅ | ❌ |
| Edit faculty profile | ✅ | ❌ |
| Delete faculty | ✅ | ❌ |
| Fix/Sync utility | ✅ | ❌ |

---

## 📊 Project Status Flow

```
pending  →  under_review  →  accepted
                          →  rejected
```
Status is updated by the admin only via the dropdown in the projects table.

---

## 📝 Evaluation Phase Flow

```
Synopsis  →  Progress  →  Demo  →  Final
```
- Each phase unlocks only when the previous phase is **100% complete for ALL students**
- Each student is evaluated independently — answers are not shared across group members
- Save is disabled until all questions in the current phase are answered for the active student
- Auto-navigation guides faculty from student to student, then phase to phase

---

## 🎨 Status Colour Coding

| Status | Colour |
|---|---|
| Pending | Gray |
| Under Review | Yellow/Amber |
| Accepted | Green |
| Rejected | Red |

---

## 🔧 Key Technical Notes

- **Sidebar never reloads** — `AdminLayout` is rendered inside `app/admin/layout.tsx` which persists across all admin routes. Only the `<main>` content area re-renders on navigation.
- **No browser alerts** — All confirmation dialogs (`confirm()`, `alert()`) have been replaced with a custom `ConfirmDialog` component with proper UI, backdrop, and animation.
- **Firestore long-polling** — `experimentalForceLongPolling: true` is enabled to resolve connectivity issues on high-latency networks.
- **Fuzzy name matching** — Faculty projects are matched by UID, name (with/without Dr./Prof. prefix), or email to handle various import formats.
- **Batch writes** — Bulk deletes and project linking use Firestore `writeBatch` with automatic splitting at 490 operations to stay within the 500-operation limit.

---

## 📦 Key Dependencies

```json
{
  "next": "^15",
  "firebase": "^12",
  "react-hot-toast": "^2",
  "lucide-react": "^0.383",
  "tailwindcss": "^4",
  "xlsx": "^0.18"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

This project is for academic purposes. All rights reserved.
