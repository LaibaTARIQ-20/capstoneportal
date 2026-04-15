# 📝 Capstone Portal - Comprehensive Clean Code & Architecture Standards

This document serves as the single source of truth for the coding standards, project architecture, naming conventions, and structural best practices adopted across the Capstone Portal repository. Adhering to these patterns ensures maximum maintainability, robust testability, and a consistent developer experience for all contributors.

---

## 🏗️ 1. Architectural Standards (5-Layer Pattern)
The application strictly enforces a **5-layer separation of concerns**. Bypassing layers (e.g., calling services directly from UI components without a hook) or introducing cyclic dependencies is structurally strictly forbidden.

1. **Pages (`app/`)**: Define the Next.js routing hierarchy and layout structures. Pages manage **zero** domain state and perform **zero** direct database calls. They act purely as conductors that call domain hooks and pass props down to UI components.
2. **Domain State / Hooks (`hooks/`)**: Abstract business logic, state management, and side-effects (loading states, error handling, fetching via services). Examples: `useProjects`, `useFaculty`, `useStats`.
3. **Services (`services/`)**: Pure, asynchronous TypeScript functions responsible for interacting with the data layer (Firestore/Firebase). **No React imports (`react`, `react-dom`) are allowed here**. Services ingest plain objects and respond with standardized payload maps.
4. **Utilities (`utils/`)**: Pure, synchronous operations entirely ignorant of React and external state. E.g., `excelParser.ts`, data formatters, and logic calculators.
5. **UI Primitives (`components/ui/`)**: Reusable, highly composable presentation components. They must remain globally generic and completely decoupled from domain logic. E.g., `Button`, `DataTable<T>`, `FormField`. Feature-specific components belong in domain folders like `components/faculty/` or `components/projects/`.

---

## 🏷️ 2. Naming Conventions

Consistent naming is critical for codebase navigation and automated tooling.

- **React Components**: `PascalCase` syntax (e.g., `DataTable.tsx`, `FormField.tsx`, `PageHeader.tsx`).
- **Interfaces / Types**: `PascalCase` syntax. Must append `Props` for component arguments (e.g., `ButtonProps`, `ColumnDef`). Domain models should map clearly (e.g., `Project`, `UserProfile`).
- **Custom Hooks**: `camelCase` syntax prefixed with `use` (e.g., `useProjects.ts`, `useConfirm.ts`).
- **Services**: File names should indicate their domain and layer in `camelCase` (e.g., `projects.service.ts`). Functions inside should be declarative of the action (`getAllProjects`, `bulkDeleteProjects`).
- **Utilities / Helper Functions**: `camelCase` syntax (e.g., `excelParser.ts`, `formatTimestamp.ts`).
- **Constants / Configurations**: Use fully capitalized `UPPER_SNAKE_CASE` for global constant variables (e.g., `MAX_BATCH_SIZE = 490`).

---

## 💻 3. TypeScript Best Practices

- **Strict Mode Enabled**: `tsconfig.json` enforces `strict: true`. The codebase relies on deterministic types. Using `any` type fallbacks is strongly discouraged.
- **Centralized Domain Entities**: The `types/` directory acts as the central source of truth for business domain interfaces, mapping exactly to Firestore document schemas.
- **Generic Component Design**: Rely heavily on `Generics` when creating reusable structural boundaries. For instance, `DataTable<T>` securely defines column configurations referencing strictly typed underlying fields of type `T`.
- **Explicit Service Returns**: Service functions explicitly declare their `Promise` return payloads (e.g., `Promise<Project[]>`), guaranteeing runtime structural alignment with frontend consumers.

---

## ⚛️ 4. React Patterns & Performance

- **Custom Hook Encapsulation**: Moving `useState` / `useEffect` blocks out of page components into dedicated hooks abstracts domain complexity away from JSX formatting, drastically improving readability.
- **Isolated Form Context**: When dealing with heavy arrays or list interactions, state logic must prevent whole-DOM recalculations. 
  - *Example:* The `DataTable` spawns localized `react-hook-form` isolated instances per row (`EditableRow.tsx`) to handle inline editing natively. This prevents the entire table from re-rendering on a single keystroke.
- **Callback Memoization**: The implementation heavily utilizes `useCallback` when returning modifier functions from hooks (e.g., passing a `refetch` or `remove` function down from `useProjects`) to ensure that pure UI components down the tree maintain shallow parity comparisons and avoid unnecessary renders.
- **Concurrent Firebase Operations**: When performing operations against external data constraints, use `Promise.all` localized parallel fetching instead of waterfall await cascades.

---

## 🎨 5. Styling & CSS Architecture (Tailwind v4)

- **Utility Mapping over Inline Strings**: Massive nested inline conditional Tailwind strings must be replaced by constant configuration dictionary objects, separating visual states securely.

```tsx
// ✅ Preferred Clean Approach extracted from components/ui/Button.tsx
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center",
};
```

- **Conditional Class Joining**: Merge dynamic classes mapped to boolean expressions via structured array formatting and filter operations instead of dense nested ternary strings. 
  - *Clean Approach*: `[baseClasses, variantClasses[type], isLoading && "opacity-50"].filter(Boolean).join(" ")`
- **Global Component First**: When building a new feature UI, developers must combine standardized `.components/ui` elements (e.g., `Card`, `Badge`, `FormField`) rather than writing manual `div` wrappers with custom inline Tailwind classes.

---

## 🗄️ 6. Firebase & Service Integrity

- **Batch Processing Resiliency**: Firestore mandates strict limitations (maximum 500 documents per batch update).
  - The service layer mitigates limits natively by injecting resilient chunk partitioning algorithms (parsing operations into sequential sets of 490 objects per `writeBatch()`).
- **Multi-Instance Bootstrapping**: Authentication flows use isolated contexts to handle privilege escalation smoothly. The codebase uses parallel Firebase instances (`secondaryAuth`) strictly for administrative user-creation flows, preventing the SDK from erroneously signing out the primary admin.
- **Normalized Evaluating Schemas**: Database documents are structured to minimize duplicate dependency strings. `evaluations/` relies strictly on string IDs joining projects & users rather than duplicating array titles locally to prevent stale data drift.

---

## 🚀 7. Workflow & Contribution Checklist

Before submitting PRs or finalizing modules, ensure you run through this validation logic:

1. **Did I add `use client` where necessary?** Remember that Next.js defaults to Server Components, ensure interactive UI hooks declare client environments.
2. **Did I put state in the View layer?** If yes, refactor it out into a custom hook. 
3. **Am I importing a Service directly into a Page?** Move the fetch logic and Loading variables to a hook in `hooks/`.
4. **Is this component re-usable?** If a section wrapper appears multiple places, abstract it into `components/ui/` with strict `Props`.
5. **No Any Types**: Check parameters and return maps for type determinism before deployment.
