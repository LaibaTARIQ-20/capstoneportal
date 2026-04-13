# Capstone Portal — Technical Architecture Document

## Overview
The Capstone Portal is a robust, highly modular Next.js application designed to manage the lifecycle of final year projects (FYP). The architecture is defined by strict type safety, a composable design system, and multi-layered separation of concerns.

This document serves as the developer contract for extending, modifying, and understanding the codebase.

---

## 1. Core Architecture Pattern

The repository implements a strict **5-Layer Architecture**. Direct access from one layer to an isolated inner-layer is forbidden to ensure absolute testability.

### The 5 Layers
1. **Presentation / Pages (`app/`)**: Next.js App Router endpoints. They hold *zero* domain state. They invoke Hooks and pass data to View components.
2. **Domain State / Hooks (`hooks/`)**: Custom React hooks (`useProjects`, `useFaculty`). These manage component lifecycles, error boundaries, loading states, and side-effects. They act as the bridge between React and the Service layer.
3. **Service Layer / Database (`services/`)**: Pure, async TypeScript functions acting as the sole interface to Firebase/Firestore. No `react` imports are allowed here.
4. **Utilities (`utils/`)**: Pure, synchronous functions completely ignorant of business logic or React state. (e.g. `excelParser.ts`, string formatting).
5. **UI Primitives (`components/ui/`)**: A heavily generic, composable internal component library ensuring visual consistency. These components must never import business logic or services.

---

## 2. Advanced Component Abstractions

### 2.1 The `DataTable<T>` Architecture
Instead of mapping over standard `<table>` elements and re-writing search, sort, and selection logic, the portal provides a fully generic `DataTable<T>` component.

#### Implementation Details
- **Generic Constraints**: `function DataTable<T extends Record<string, any>>` handles strictly typed datasets.
- **Column Definitions (`ColumnDef`)**: Follows a standard accessor pattern. 
- **Isolated Re-renders**: To solve the performance nightmare of rendering complex form-fields in a 500-row table, `DataTable` maps rows through an internal `<EditableRow>` component. 
- **React Hook Form Injection**: When a row enters "edit mode", `<EditableRow>` spawns a completely isolated `useForm` instance locally scoped to that single `<tr>`. The parent table state is completely unaware of the active keystrokes, ensuring that editing one row out of a large dataset runs at 60fps without lag.

```tsx
// Example Column Definition
const columns: ColumnDef<Faculty>[] = [
  {
    key: "name",
    header: "Full Name",
    sortable: true,
    cell: (row) => row.name,
    // The inner EditableRow passes the react-hook-form handle
    editCell: (row, form) => <Input {...form.register("name")} />
  }
];
```

### 2.2 Global State via Context
- **`AuthContext.tsx`**: Listens to Firebase `onAuthStateChanged`. Hydrates the user object with `role` via a cross-reference lookup in the `users` Firestore collection to enforce Role-Based Access Control (RBAC).

---

## 3. Database Operations & Firebase Integrity

### 3.1 Batch Process limits
Firestore imposes a strict 500-operation limit per atomic batch.
Bulk operations (`bulkDeleteProjects`, `bulkImportProjects`) utilize chunking algorithms wrapped in `writeBatch(db)`. 
The operations break arrays into chunks of 490 to ensure absolute safety.

### 3.2 Dual Authentication Instances
A critical problem exists when an Admin creates a new Faculty tracking account: Firebase default behaviour logs the current Admin out and logs the newly created Faculty account in.
- **Solution**: The portal utilizes a secondary, initialized Firebase App instance (`secondaryAuth` in `lib/firebase.ts`) strictly for `createUserWithEmailAndPassword`. This bypasses the primary app instance, keeping the Admin safely logged in.

---

## 4. Bulk Data Processing (Excel)

The `ExcelUpload.tsx` pipeline is segmented into 3 strict phases purely running client-side to mitigate server costs:

1. **Parsing (`utils/excelParser.ts`)**: Accepts an ArrayBuffer. Leverages `xlsx` (SheetJS) to convert sheets to a JSON array. 
2. **Validation (In-Memory)**: 
   - A concurrent `Promise.all` fetches the current Faculty directory and all existing Project Titles.
   - The parser checks row data against required field constraints, validates faculty string matching (casing agnostic), and sets an `isDuplicate` flag if the project title already exists to prevent duplication.
3. **Batch Writing**: Valid rows are dispatched to `services/projects/projects.service.ts` to be chunked into atomic batches and flushed to the database.

---

## 5. Phase-Based Evaluation Logic

The `evaluations/` directory manages a complex document schema.

```json
{
  "projectId": "id123",
  "facultyId": "fac456",
  "synopsis": {
    "John Doe": {
      "question1": 4,   // Star Rating
      "question2": "A"  // Grade
    }
  }
}
```

- Evaluations are fundamentally keyed by the **Student Name** inside the phase object. This is due to real-world edge cases where groups fracture or perform asynchronously.
- Phase locking is calculated dynamically on the client by checking if all required keys (`question1`, `question2`, etc.) exist in the student's inner object for the preceding phase.

---

## 6. Styling Guidelines

- The portal enforces **Tailwind Utility CSS**. Custom stylesheets are forbidden unless absolutely necessary for complex animations.
- All primary colors derive from the `blue-600` core scale. Success states map to `green-600` and destructive commands map to `red-600`. 
- Global UI classes (e.g. standard inputs) must use exported constant strings (`inputCls`, `labelCls` inside `FormField.tsx`) instead of copying strings globally.
