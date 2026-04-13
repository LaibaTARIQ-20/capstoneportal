# 🎓 Capstone Portal

A full-stack **Final Year Project (FYP) management portal** built with Next.js 16, TypeScript, Tailwind CSS v4, and Firebase. Supports two roles, **Admin** and **Faculty**, with Firebase authentication, role-based access control, a multi-phase project evaluation system, and bulk Excel import.

---

## 📸 Features

### Admin
- Login with email/password or Google OAuth
- View all projects with search and bulk selection
- Import projects from Excel (.xlsx) with duplicate detection and confirmation dialogue
- Bulk delete or individually delete projects with proper UI confirmation dialogs
- View, add, edit inline, and delete faculty members
- View individual faculty detail page

### Faculty
- Login with email/password or Google OAuth
- View all projects with evaluation status badges (Not Started / In Progress / Evaluated)
- View project detail and navigate to evaluation form
- **Phase-based evaluation system** (Synopsis → Progress → Demo → Final)
  - Phases unlock sequentially per student
  - Each student evaluated independently with per-student data stored separately
  - Rating questions (1–5 stars with colour-coded labels) and Grade questions (pill buttons)
  - Live progress tracking per student and per phase
- Dashboard with personal project stats
- Sidebar never reloads during navigation — only the content area updates

---

## 🏗️ Architecture

This project follows a strict **4-layer separation of concerns** introduced in the refactor.

```
Page  →  Hook  →  Service  →  Firestore
Page  ↓  renders  →  Component
```

| Layer | Folder | Responsibility |
|---|---|---|
| **Pages** | `app/` | Call one hook. Render one component. Zero Firestore. |
| **Hooks** | `hooks/` | Own domain state. Call services. Expose clean actions. |
| **Services** | `services/` | Pure async Firestore functions. Zero React. Zero state. |
| **Components** | `components/` | Receive props. Emit events. Never touch Firestore. |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Frontend framework with file-based routing |
| TypeScript 5 | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Firebase Auth | Email/password and Google authentication |
| Cloud Firestore | NoSQL database |
| react-hot-toast | Toast notifications |
| lucide-react | Icon library |
| xlsx (SheetJS) | Excel file parsing for bulk import |

---

## 📁 Project Structure

```
app/
    admin/
        layout.tsx                    # Auth guard + admin sidebar wrapper
        dashboard/
            page.tsx                  # Stats cards
        projects/
            page.tsx                  # All projects + Excel import
            [id]/
                page.tsx              # Project detail + delete
        faculty/
            page.tsx                  # Faculty table
            new/
                page.tsx              # Add faculty form
            [id]/
                page.tsx              # Edit faculty detail
    faculty/
        layout.tsx                    # Auth guard + faculty sidebar wrapper
        dashboard/
            page.tsx                  # Faculty stats
        projects/
            page.tsx                  # All projects + eval status badges
            [id]/
                page.tsx              # Project detail + evaluate button
                evaluate/
                    page.tsx          # Phase-based evaluation form
    login/
        page.tsx
    layout.tsx                        # Root layout + AuthProvider + Toaster
    page.tsx                          # Redirects to /login

components/
    ui/
        ConfirmDialog.tsx             # Reusable confirm modal (replaces browser alerts)
        SearchInput.tsx               # Search field with icon
        Spinner.tsx                   # InlineSpinner, PageSpinner, LoadingSpinner
        index.ts                      # Barrel export
    layout/
        AdminLayout.tsx               # Persistent admin sidebar (never reloads)
        FacultyLayout.tsx             # Persistent faculty sidebar (never reloads)
    projects/
        ProjectsTable.tsx             # Props-driven, zero Firestore
    faculty/
        FacultyTable.tsx              # Props-driven, zero Firestore
    ExcelUpload.tsx                   # Excel import modal with preview + duplicate detection

hooks/
    useProjects.ts                    # projects, remove, bulkRemove, changeStatus, refetch
    useFaculty.ts                     # faculty, add, update, remove, bulkRemove
    useStats.ts                       # totalProjects, totalFaculty
    useConfirm.ts                     # await confirm({ title, message })
    useSearch.ts                      # useSearch(items, ['field1', 'field2'])

services/
    projects/
        projects.service.ts           # getAllProjects, delete, bulkDelete, updateStatus
    faculty/
        faculty.service.ts            # getAllFaculty, addFaculty, update, delete
    evaluations/
        evaluations.service.ts        # getEvaluation, saveEvaluation, getAllEvaluations

types/
    index.ts                          # Barrel re-export
    project.types.ts                  # Project, ProjectStatus, ProjectFormData
    faculty.types.ts                  # UserProfile, UserRole, FacultyFormData
    evaluation.types.ts               # EvaluationRecord, EvalPhase

constants/
    index.ts                          # ROUTES, STATUS_LABELS, STATUS_COLORS, DESIGNATIONS

utils/
    index.ts                          # formatTimestamp, getInitials, getSdgColor

context/
    AuthContext.tsx                   # useAuth() hook + AuthProvider

lib/
    firebase.ts                       # Primary app + secondaryAuth for faculty creation
    auth.ts                           # loginWithEmail, loginWithGoogle, logout, onAuthChange
```

---
<img width="512" height="511" alt="image" src="https://github.com/user-attachments/assets/e1446366-044e-4d75-a926-4617f086cdee" />

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
name            →  Admin User
email           →  admin@university.edu
role            →  admin
gender          →  Male
department      →  Administration
designation     →  System Admin
phone           →  03001234567
profileComplete →  true (boolean)
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Import project data

Go to **Admin → Projects → Import from Excel** to bulk upload projects.

---

## 👥 Default Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | admin@university.edu | University@123 | Admin |
| Dr. Ayesha Malik | ayesha.malik@university.edu | University@123 | Faculty |
| Dr. Imran Khalid | imran.khalid@university.edu | University@123 | Faculty |

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
| joinedAt | Timestamp | Account creation date |
| profileComplete | boolean | Profile setup status |

### `projects`

| Field | Type | Description |
|---|---|---|
| title | string | Project title |
| supervisor | string | Faculty name |
| supervisorId | string | Firebase Auth UID of supervisor |
| coSupervisor | string | Co-supervisor name or `"None"` |
| students | string[] | List of student names |
| studentCount | number | Length of students array |
| industrialPartner | string | Company name or `"None"` |
| sdg | string | e.g. `"SDG 4"`, `"SDG 11"` |
| status | string | `pending` / `under_review` / `accepted` / `rejected` |
| uploadedBy | string | UID or `"excel_import"` |
| uploadedAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update date |

### `evaluations`

| Field | Type | Description |
|---|---|---|
| projectId | string | Reference to project — ID only |
| facultyId | string | UID of evaluating faculty — ID only |
| synopsis | object | `{ studentName: { questionId: value } }` |
| progress | object | Same structure as synopsis |
| demo | object | Same structure as synopsis |
| final | object | Same structure as synopsis |
| updatedAt | Timestamp | Last save timestamp |

> **Important:** `facultyName` and `projectTitle` are **never stored** in evaluation documents. Names are always resolved at read time from their collections to prevent stale denormalized data.

---

## 🔐 Role-Based Access Control

| Feature | Admin | Faculty |
|---|---|---|
| View all projects | ✅ | ✅ |
| Import projects from Excel | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Evaluate projects | ❌ | ✅ |
| View all faculty | ✅ | ❌ |
| Add / edit / delete faculty | ✅ | ❌ |

---

## 📊 Project Status Flow

```
pending  →  under_review  →  accepted
                          →  rejected
```

Status is updated by the admin only.

---

## 📝 Evaluation Phase Flow

```
Synopsis  →  Progress  →  Demo  →  Final
```

- Each phase unlocks only when the previous phase is complete for the active student
- Each student is evaluated independently
- Progress is tracked visually per student and per phase

---

## 🔧 Key Technical Notes

- **Sidebar never reloads** — layout components persist across all routes. Only the `<main>` content area re-renders on navigation.
- **No browser alerts** — all confirmations use a custom `ConfirmDialog` component with backdrop and animation.
- **`useConfirm` hook** — replaces repeated dialog state boilerplate with a clean Promise-based API: `const ok = await confirm({ title, message })`.
- **Secondary Firebase app** — `secondaryAuth` is used when creating faculty accounts so the admin session is never interrupted.
- **Batch writes** — bulk deletes use Firestore `writeBatch` split into chunks of 490 to stay within the 500-operation limit.
- **Props-driven components** — `ProjectsTable` and `FacultyTable` have zero Firestore imports and are fully reusable across admin and faculty views.

---

## 📦 Key Dependencies

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "typescript": "^5",
  "tailwindcss": "^4",
  "firebase": "^12.10.0",
  "react-hot-toast": "^2.6.0",
  "lucide-react": "^0.577.0",
  "xlsx": "^0.18.5"
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
````
