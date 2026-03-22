# CalSync — Senior Frontend Assignment

**Live Deployment:** [https://calendar-scheduling-app-1bln.vercel.app]

## 🚀 Setup Instructions
1. Clone the repository
2. Run `npm install` (Uses React 19 / Next.js 15)
3. Run `npm run dev` to start the local server at `http://localhost:3000`
4. Run `npm run vitest` to execute the pure logic unit tests.

---

## 📋 Evaluation Criteria Alignment

This project was built to explicitly address the assignment's core evaluation areas.

### 1. Component Architecture
- **Single Source of Truth**: The app uses `zustand` to maintain a globally synchronized `useTaskStore`. Whether you add a task in the Day timeline, Month grid, or via the global Create button, the UI updates instantly across all views simultaneously.
- **Separation of Concerns**: UI components are strictly presentational. Complex business logic (like date math and recurrence) lives exclusively in isolated `/lib/` utility functions and the centralized store.
- **Strict TypeScript**: End-to-end type safety achieved via shared `Task` interfaces mapping exact DB schemas recursively into UI props.

### 2. Feature Completeness
All core features deliver end-to-end:
1. **Views**: Day Timeline, 35-day Month Grid, and 12-Month Year View all exist with correct routing and dynamic layout bounding.
2. **Operations**: Create, Update, and Delete are fully functional across standard and recurring events.
3. **Filtering**: The global header dropdown seamlessly filters the Zustand store memory by priority tag instantly.

### 3. Code Quality & Performance
- **O(1) Recurrence Engine**: The recurrence rule mathematical evaluator (`taskRecurrence.ts`) was optimized using a strictly immutable `WeakMap<Task, string>` cache to store date parses. This drops rendering overhead from O(Days * Tasks) to essentially zero rendering-loop latency.
- **Isolated Testing**: Recurrence logic and boundary checks are fully isolated and tested independently via Vitest without needing heavy DOM abstractions.

### 4. Interaction Quality
- **Quick → Expanded Flow**: The `DayTimeline` features an inline "Draft" quick-entry input. Clicking a timeslot opens a fast text field. If more power is needed, clicking the 'Expand' icon seamlessly pushes the user into the fully featured `TaskEditorModal`.
- **Keyboard Friendly**: Esc/Enter bindings are heavily utilized for rapid fluid commitments.

### 5. UI & Edge Cases
- **Overlapping Task Algorithm**: Rather than relying on Z-index stacking (which becomes unreadable), the Day view uses a custom Fractional Column layout. If 5 tasks share the same hour block, it automatically calculates and partitions `colW / numCols` to cleanly arrange them side-by-side.
- **Tailwind V4**: Built on the bleeding-edge Tailwind v4 engine. Utilizing semantic color pills (`bg-blue-100 text-blue-800`), strict 64px/hour modular spacing, and global `Geist Sans` Vercel typography for maximum legibility.
- **Missed Reminders**: Expanded the reminder engine logic to cache acknowledgments in `localStorage` and strictly flag past-due reminders with an orange 'Missed Reminder' UI alert upon app refresh.

### 6. Decisions & AI Usage
- **Trade-off (Zustand vs Redux/Context)**: Chose Zustand for global state management to avoid the massive boilerplate of Redux and the rendering bottlenecks of raw React Context. This allowed for seamless optimistic UI updates—simulating zero-latency network requests instantly across all views.
- **AI Tooling**: AI assistance (Claude/Cursor) was utilized primarily as an implementation accelerator:
  - Scaffolding standard Shadcn-styled accessible modals and inputs.
  - Generating boilerplates for Tailwind inline 24-hour style configurations.
  - Actively architecting and refining the O(1) performance logic within the `isTaskOnDate` filtering engine.

## 🔮 What I'd Tackle Next
If given another 8 hours:
1. **Drag and Drop**: Integrating `@dnd-kit/core` to allow users to intuitively slide tasks down the `DayTimeline` or across the `MonthGrid` to effortlessly reschedule them.
2. **Power-User Keyboard Navigation**: Implementing global hotkey listeners (e.g., `c` to create, `t` to jump to today, `m`/`d`/`y` for view switching) to mimic Google Calendar's rapid keyboard-centric workflow.
3. **E2E Visual Testing**: Scaling beyond basic unit tests into full Cypress E2E visual regression tests to validate the complex dynamic CSS layout math for overlapping events across viewports.
