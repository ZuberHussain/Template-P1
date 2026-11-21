# Enterprise Angular Template (RTL Layout)

A scalable, maintainable, enterprise-grade Angular project boilerplate built with modern Angular (standalone components, signals reactivity, typed reactive forms, functional guards, and functional HTTP interceptors).

Features full **native Right-to-Left (RTL) layout**, English language typography, collapsible sidebar, left-side toast notifications, and a reusable generic Data Table with role-based permission controls.

---

## Architecture Overview

```text
src/
├── app/
│   ├── core/                        # Singleton services, global state, guards, interceptors, constants, models
│   │   ├── constants/               # Global constants (API endpoints, storage keys)
│   │   ├── guards/                  # Functional Route Guards (auth.guard, guest.guard)
│   │   ├── interceptors/            # Functional HTTP Interceptors (auth, error, logging)
│   │   ├── models/                  # Domain entity models (user, auth, api-response)
│   │   ├── services/                # Global services (auth, token, notification, storage, theme)
│   │   └── index.ts                 # Clean barrel export for @core
│   │
│   ├── shared/                      # Reusable UI components, directives, pipes, validators
│   │   ├── components/              # Presentational UI components
│   │   │   ├── alert/               # Left-side toast notifications container
│   │   │   ├── button/              # Enterprise button with variants & loading states
│   │   │   ├── card/                # Structural card container
│   │   │   ├── data-table/          # Reusable generic Data Table with search & permission dropdown
│   │   │   ├── modal/               # Reusable dialog modal component
│   │   │   ├── input/               # Reactive form input control
│   │   │   └── loading-spinner/     # Accessible SVG spinner
│   │   ├── directives/              # Custom directives (autofocus, click-outside, has-permission)
│   │   ├── pipes/                   # Custom utility pipes (truncate)
│   │   ├── validators/              # Custom form validators
│   │   └── index.ts                 # Clean barrel export for @shared
│   │
│   ├── layouts/                     # Application layout shells
│   │   ├── auth-layout/             # Clean shell for unauthenticated views (login/register)
│   │   └── main-layout/             # Enterprise RTL shell (collapsible sidebar, header, footer)
│   │
│   ├── features/                    # Business domain modules (lazy-loaded routes)
│   │   ├── auth/                    # Authentication feature (login page with demo autofill)
│   │   ├── dashboard/               # Authenticated enterprise overview dashboard (default page)
│   │   └── trips/                   # Trips feature with search, top-left Add Trip, and status transitions
│   │
│   ├── app.config.ts                # Application configuration & provider setup
│   ├── app.routes.ts                # Root route definitions with lazy loading & guards
│   ├── app.ts                       # Root application component
│   ├── app.html                     # Root outlet & toast alerts
│   └── app.scss
│
├── environments/                    # Environment configuration
└── styles/                          # Global SCSS architecture (tokens, resets, mixins)
```

---

## Key Features

1. **Native RTL Layout with English Text**:
   - `dir="rtl"` layout with English typography.
   - Collapsible right sidebar that can open and close smoothly.
   - Top-left positioned action buttons (e.g. "+ Add Trip").
   - **Left-Side Notifications**: Toast notifications appear on the top-left side with slide-in animation.

2. **Common Reusable Data Table (`app-data-table`)**:
   - Generic and reusable across any entity / API data source.
   - Built-in real-time search filtering across all visible fields.
   - Column sorting and record count indicators.
   - **Permission-Based Actions Dropdown (Last Column)**:
     - Dropdown button in the last column.
     - Each option enforces permission checks via `authService.hasPermission(action.permission)`.
     - Automatically hides options or displays a `Restricted` badge for unauthorized users.

3. **Trips Management Feature (`/trips`)**:
   - **Entity**: `name`, `year`, `status`, `note`.
   - **Add Trip Button at Top-Left**: Opens a modal dialog component (`app-trip-form-modal`) over the page (not a separate page).
   - **Extensible Status Lifecycle**:
     - Newly created trips have default status: `Draft`.
     - When `Draft` &rarr; action option displays `Open Trip`.
     - When `Open` &rarr; action option displays `Close Trip`.
     - When `Closed` &rarr; action option displays `Re-open Trip`.
     - Easily extensible in `trip.model.ts` for additional statuses.

4. **Live Permission Simulator**:
   - The top header includes a role switcher (`Admin (Full Access)` vs `User (Restricted Status)`).
   - Clicking it dynamically toggles permissions so you can immediately see the table status dropdown options appear or become restricted.

---

## Getting Started

```powershell
cd Template
npm start
```

Visit `http://localhost:4200/`. Sign in using the one-click demo credentials (`admin@enterprise.com` / `Enterprise@123`).
