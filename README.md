# 🎓 Capstone Portal

A full-stack FYP (Final Year Project) management portal built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Firebase**. Supports two roles: Admin and Faculty with real-time data, authentication, and complete CRUD operations.

---

## 📸 Features

### Admin
- Login with email/password or Google
- View all projects with search and filtering
- Add new projects via a modal form
- Change project status (Pending → Under Review → Accepted → Rejected)
- Delete projects
- View all faculty members
- Add new faculty (creates Firebase Auth account + Firestore profile)
- Edit faculty info inline
- Delete faculty
- View individual faculty detail page with their supervised projects
<img width="330" height="330" alt="image" src="https://github.com/user-attachments/assets/90746a62-0e77-4d9d-9ae8-d5ccb6105713" />
<img width="512" height="256" alt="image" src="https://github.com/user-attachments/assets/2110e5a9-07e5-4ec0-a2f1-154b75c395cc" />
<img width="330" height="330" alt="image" src="https://github.com/user-attachments/assets/90780f28-46d1-4b60-b3c3-9442a864d5e1" />
<img width="512" height="232" alt="image" src="https://github.com/user-attachments/assets/1bfcb543-ce71-4638-aebf-81acca2a7bbb" />

### Faculty
- Login with email/password or Google
- View only their own supervised projects
- Dashboard with personal project stats
- See project status updates made by the admin
<img width="512" height="251" alt="image" src="https://github.com/user-attachments/assets/9a59d7de-c24a-4a9c-9e2a-610d2514bc93" />
<img width="512" height="245" alt="image" src="https://github.com/user-attachments/assets/41fbf7ab-be90-41e2-82b2-db45cd95f313" />

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Frontend framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Firebase Auth | Authentication |
| Cloud Firestore | Database |
| react-hot-toast | Toast notifications |
| lucide-react | Icons |

---

## 📁 Project Structure

```
capstoneportal/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx      # Admin dashboard with stats
│   │   ├── projects/page.tsx       # All projects + add project modal
│   │   ├── faculty/
│   │   │   ├── page.tsx            # Faculty list + add faculty modal
│   │   │   └── [id]/page.tsx       # Individual faculty detail page
│   │   └── seed/page.tsx           # Database seeder (run once)
│   ├── faculty/
│   │   ├── dashboard/page.tsx      # Faculty dashboard
│   │   └── projects/page.tsx       # Faculty's own projects
│   ├── login/page.tsx              # Login page
│   ├── layout.tsx                  # Root layout with AuthProvider
│   └── page.tsx                    # Redirects to /login
├── components/
│   ├── ProjectsTable.tsx           # Reusable projects table
│   └── FacultyTable.tsx            # Reusable faculty table with inline edit
├── context/
│   └── AuthContext.tsx             # Global auth state
├── lib/
│   ├── firebase.ts                 # Firebase initialization
│   └── auth.ts                     # Auth functions
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

- Go to [firebase.google.com](https://firebase.google.com)
- Create a new project
- Enable **Authentication** → Email/Password and Google providers
- Enable **Cloud Firestore** database
- Go to Project Settings → Web App → copy config

### 4. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Set Firestore rules

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
Service Cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 6. Create an admin account

In Firebase Console → Authentication → Add user:

```
Email:    admin@university.edu
Password: University@123
```

Then in Firestore → `users` collection → Add document with the admin UID:

```
name            → Admin User
email           → admin@university.edu
role            → admin
gender          → Female
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

### 8. Seed dummy data (optional)

After logging in as admin, go to:

```
http://localhost:3000/admin/seed
```

Click **Seed Database** to automatically create 4 faculty accounts and 10 sample projects.

---

## 👥 Default Accounts (after seeding)

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
```
uid             (document ID = Firebase Auth UID)
name            string
email           string
role            "admin" | "faculty"
gender          "Male" | "Female"
department      string
designation     string
phone           string
joinedAt        timestamp
profileComplete boolean
```

### `projects`
```
title           string
supervisor      string
supervisorId    string (Firebase Auth UID of faculty)
coSupervisor    string
students        array of strings
studentCount    number
industrialPartner string
sdg             string
status          "pending" | "under_review" | "accepted" | "rejected"
uploadedBy      string
uploadedAt      timestamp
updatedAt       timestamp
```

---

## 🔐 Role-Based Access

| Feature | Admin | Faculty |
|---|---|---|
| View all projects | ✅ | ❌ |
| View own projects | ✅ | ✅ |
| Add project | ✅ | ❌ |
| Change project status | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| View all faculty | ✅ | ❌ |
| Add faculty | ✅ | ❌ |
| Edit faculty | ✅ | ❌ |
| Delete faculty | ✅ | ❌ |
| View faculty detail | ✅ | ❌ |

---

## 📊 Project Status Flow

```
pending  →  under_review  →  accepted
                          →  rejected
```

Status is updated by admin only via the dropdown in the projects table.

---

## 🎨 Status Color Coding

| Status | Color |
|---|---|
| Pending | Gray |
| Under Review | Yellow |
| Accepted | Green |
| Rejected | Red |

---

## 📦 Key Dependencies

```json
{
  "next": "^15",
  "firebase": "^12",
  "react-hot-toast": "^2",
  "lucide-react": "^0.383",
  "tailwindcss": "^4"
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

---

