# Capstone Portal — Comprehensive Technical Architecture Document

## 1. System Overview

The Capstone Portal is an enterprise-grade Final Year Project (FYP) management platform. It facilitates the coordination, administration, and grading of capstone projects involving students, supervising faculty, and industrial partners.

### 1.1 Core Technology Stack
- **Framework**: Next.js 16 (React 19, Server Components & Client Boundaries)
- **Language**: TypeScript 5 (Strict Mode enforced)
- **Styling**: Tailwind CSS v4 (Utility-first, structured CSS variables)
- **Forms & State**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Data Parsing**: SheetJS (`xlsx`) for bulk data operations
- **Backend-as-a-Service (BaaS)**: Firebase (Auth, Firestore DB)

---

## 2. Authentication & Authorization Flow

The platform relies on **Firebase Authentication** coupled with a custom React Context provider to handle session persistence and Role-Based Access Control (RBAC).

### 2.1 The Authentication Lifecycle
1. **Login Trigger**: A user logs in via `app/login/page.tsx` using either Email/Password or Google OAuth (handled inside `lib/auth.ts`).
2. **Session Persistence**: Firebase initializes securely on the client and parses the stored IndexedDB session. The `onAuthStateChanged` listener in `AuthContext.tsx` fires upon detecting the session.
3. **Hydration & RBAC**: The listener takes the raw Firebase `User` object (which only contains a UID and Email), and immediately executes a Firestore fetch to the `users/{uid}` collection.
4. **Context Provision**: The fetched document contains custom metadata: `role`, `department`, `name`. The context merges the Firebase Auth object and the Firestore Document into a unified `GlobalUser` payload that propagates down the React tree.

### 2.2 Dual Firebase Application Instances
A deeply complex edge-case arises when an `Admin` attempts to manually create a new `Faculty` account using `createUserWithEmailAndPassword`:
- **Default Firebase Behavior**: The SDK forcefully signs the *current user* (the Admin) out, replacing their session with the newly created Faculty account.
- **The Solution (`lib/firebase.ts`)**: We bootstrap *two* Firebase Application instances. 
  1. Primary App: Handles the Admin's active session and database writes.
  2. Secondary App (`secondaryAuth`): Used *exclusively* for invoking `createUserWithEmailAndPassword`. This bypasses the primary app, allowing the admin to create infinite faculty accounts without disrupting their active login session. Note: the secondary app immediately forces a `signOut()` upon creation to prevent memory leaks.

---

## 3. The Backend Architecture (Database)

The portal uses **Cloud Firestore**, a NoSQL document database. It is optimized for high-read, low-write ratios.

### 3.1 Data Schema

#### `users` Collection
Stores metadata for all human actors.
- **Fields**: `uid` (string), `email` (string), `role` (`admin` | `faculty`), `name` (string), `designation`, `department`, `joinedAt` (Timestamp).

#### `projects` Collection
Stores the project definition.
- **Fields**: `title`, `supervisor`, `supervisorId` (linking to `users`), `coSupervisor`, `industrialPartner`, `students` (array), `sdg`, `status` (pending|review|accepted).

#### `evaluations` Collection
Stores the grading logic. Note that it specifically avoids duplicating relational data like "Project Title" or "Faculty Name" to ensure zero stale data during lookups.
- **Schema**:
```json
{
  "projectId": "id123",
  "facultyId": "uid456",
  "synopsis": {
    "Student 1": { "q1": 5, "q2": 4 },
    "Student 2": { "q1": 3, "q2": 3 }
  },
  "progress": { ... }
}
```

### 3.2 Firebase Security Rules
Data security is enforced at the database level, preventing malicious API calls from bypassing UI protections.
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} { allow read, write: if request.auth != null; }
    match /users/{userId} {       allow read, write: if request.auth != null; }
    match /evaluations/{evalId} { allow read, write: if request.auth != null; }
  }
}
```
*Future Enhancement Note: Security rules should be tightened to ensure `if request.auth.token.role == "admin"` for destruction commands.*

### 3.3 Batching and API Limits
Firestore restricts batch writes (atomic operations) to 500 documents per batch.
When bulk-deleting (`bulkDeleteProjects`) or bulk-importing (`bulkImportProjects`) datasets exceeding this threshold, the Service Layer algorithm arrays into mathematical chunks of **490**.
```typescript
for (let i = 0; i < payload.length; i += 490) {
  const batch = writeBatch(db);
  // queue 490 operations
  await batch.commit(); // flush
}
```

---

## 4. Frontend Application Layer

The repository implements a strict **5-Layer Architecture**. Direct access from one layer to an isolated inner-layer is strictly forbidden to ensure testability and prevent cyclic dependencies.

### 4.1 The 5 Separation Layers
1. **Presentation / Pages (`app/`)**: Next.js App Router endpoints. They hold *zero* domain state. They invoke Hooks and pass data to View components. Routing relies entirely on the file hierarchy (`/admin/projects/[id]`).
2. **Domain State / Hooks (`hooks/`)**: Custom React hooks (`useProjects`, `useFaculty`). These manage component lifecycles, error boundaries, loading states, cache invalidation, and React side-effects (`useEffect`). They act as the bridge between React and the Service layer.
3. **Service Layer / Database (`services/`)**: Pure, async TypeScript functions acting as the sole interface to Firebase/Firestore. No `react` imports are allowed here.
4. **Utilities (`utils/`)**: Pure, synchronous functions completely ignorant of business logic or React state. (e.g. `excelParser.ts`, string formatting).
5. **UI Primitives (`components/ui/`)**: A heavily generic, composable internal component library ensuring visual consistency. These components must never import business logic or services.

### 4.2 State Management & Performance

#### The `DataTable<T>` Architecture
Instead of mapping over standard `<table>` elements and duplicating search and pagination states globally, the portal provides a fully generic `DataTable<T>` abstraction.
- **Inherent Generics**: `function DataTable<T extends Record<string, any>>` handles strictly typed datasets.
- **Isolated Re-renders**: Rendering 100 rows containing 5 form fields each forces React to track 500 inputs. Updating a single character triggers massive application lag. `DataTable` solves this via `<EditableRow>`.
- **React Hook Form Isolation**: When a row enters "edit mode", `<EditableRow>` spawns a completely isolated `useForm` instance locally scoped to that single `<tr>`. The parent table tree is completely detached from the keystrokes, operating flawlessly at 60fps regardless of dataset size.

---

## 5. Excel Import Pipeline Flow

The bulk import system (`ExcelUpload.tsx`) operates purely on the client-side to eliminate complex lambda endpoints and server costs.

1. **Parser & Buffer (`utils/excelParser.ts`)**: Accepts a local machine ArrayBuffer. Passes data to `xlsx` to parse sheets into memory-efficient JSON nodes.
2. **Constraints Mapping**: Before mapping, the pipeline suspends to execute two highly parallel Firestore reads via `Promise.all`:
   - It fetches the active Faculty Directory (to map supervisor strings to UIDs).
   - It fetches all existing Project Titles to feed a Javascript `Set()`.
3. **Data Hydration**: The parser cross-references Excel rows against the Constraints Map. Missing required fields throw string errors onto an internal array (`errors: []`); duplicate titles trip the `isDuplicate` boolean flag.
4. **Injection**: Valid, non-duplicate schemas are piped via Props to the `services` layer, chunked, and pushed to Firestore.

---

## 6. Evaluation Logic & Grading Phases

The evaluation engine supports disjointed, multi-phase states across complex groups.
- **Flow**: `Synopsis → Progress → Demo → Final`
- **Dynamic Unlocking**: Forms are disabled natively. A phase form unlocks **only** if the preceding phase object for that specific student possesses all required validation keys. This means Student A may be cleared for "Demo" while Student B in the same group is locked at "Progress".
- **Visual Propagation**: Using Lucide Icons inside conditional components, the evaluation badges on the dashboards compute their labels (`Not Started`, `In Progress`, `Complete`) based on recursively traversing the database schemas for length counts.
