# 🚀 Data Table API Integration Guide & Template

This project is fully architected to connect any backend REST API to your data tables with enterprise-grade features:
- **Instant Mock / Real API Toggle** (`useMockApi: false | true`)
- **Automatic Loading States** (spinner overlay & skeleton placeholders)
- **Error Handling & Retry** (visual error banner with retry triggers)
- **Automatic Auth Token Injection** (`authInterceptor` attaches `Bearer <token>` to all HTTP requests)
- **Two Flexible Integration Modes**:
  - **Mode A: Client-Side Mode** (API loads all records once; filtering, sorting, pagination happen instantly in browser)
  - **Mode B: Server-Side Mode** (Pagination, search, and sorting send query parameters directly to backend)
- **A Ready-to-Use Template Service**: Located at [`src/app/core/templates/api-data-table-service.template.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/core/templates/api-data-table-service.template.ts)

---

## ⚡ Quick Start: Connect Your Real API in 3 Steps

### Step 1: Set Your Backend API Base URL & Switch Off Mock Mode
Open [`src/environments/environment.development.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/environments/environment.development.ts):

```typescript
export const environment = {
  production: false,
  // 🔌 Point this to your backend server URL (e.g. Node.js, Spring Boot, Laravel, .NET, FastAPI)
  apiUrl: 'http://localhost:3000/api/v1',
  appName: 'Enterprise Template [Dev]',
  version: '1.0.0-dev',

  // 💡 Flip to false to send real HTTP requests:
  useMockApi: false
};
```

---

### Step 2: Define Your REST Endpoints
Open [`src/app/core/constants/api.constants.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/core/constants/api.constants.ts) and define your routes:

```typescript
export const API_ENDPOINTS = {
  // Existing endpoints (AUTH, USERS, etc.)
  TRIPS: {
    BASE: '/trips',
    GET_ALL: '/trips',
    GET_BY_ID: (id: string | number) => `/trips/${id}`,
    CREATE: '/trips',
    UPDATE: (id: string | number) => `/trips/${id}`,
    UPDATE_STATUS: (id: string | number) => `/trips/${id}/status`,
    DELETE: (id: string | number) => `/trips/${id}`
  }
} as const;
```

---

### Step 3: Consume in Your Component
In your component (e.g., [`src/app/features/trips/pages/trips-list/trips-list.component.html`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/features/trips/pages/trips-list/trips-list.component.html)):

```html
<app-data-table
  [data]="trips()"
  [columns]="columns"
  [actions]="tableActions"
  [loading]="isLoading()"
  [errorMessage]="error()"
  (refresh)="onRefresh()"
  (retry)="onRefresh()"
  searchPlaceholder="Search records..."
  rowIdKey="id"
></app-data-table>
```

And in TypeScript ([`trips-list.component.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/features/trips/pages/trips-list/trips-list.component.ts)):

```typescript
readonly trips = this.tripService.trips;
readonly isLoading = this.tripService.isLoading;
readonly error = this.tripService.error;

onRefresh(): void {
  this.tripService.loadTrips().subscribe();
}
```

---

## 🛠️ Understanding the Integration Modes

### Mode A: Client-Side Mode (Default)
Ideal when your API returns a list of items (e.g. hundreds or low thousands of records):
- Angular `HttpClient` calls `GET /api/v1/trips`.
- `DataTableComponent` handles real-time searching across columns, column sorting, and pagination instantaneously without server roundtrips.

```html
<app-data-table
  [data]="trips()"
  [columns]="columns"
  [loading]="isLoading()"
  [errorMessage]="error()"
  (refresh)="onRefresh()"
  (retry)="onRefresh()"
></app-data-table>
```

---

### Mode B: Server-Side Mode (Large Datasets)
When your backend database has thousands of records and you want the database to handle pagination, sorting, and search:
1. Set `[serverSide]="true"`
2. Pass `[totalItems]="totalCount()"`
3. Listen to `(queryChange)="onQueryChange($event)"` (which automatically debounces search input by 350ms):

```html
<app-data-table
  [data]="trips()"
  [columns]="columns"
  [serverSide]="true"
  [totalItems]="totalCount()"
  [loading]="isLoading()"
  [errorMessage]="error()"
  (queryChange)="onQueryChange($event)"
  (refresh)="onRefresh()"
  (retry)="onRefresh()"
></app-data-table>
```

In your component:
```typescript
onQueryChange(params: TableQueryParams): void {
  // params contains: { page: 1, pageSize: 10, search: '...', sortBy: 'name', sortDirection: 'asc' }
  this.tripService.loadTrips(params).subscribe();
}
```

---

## 📦 How to Add a New Table for Any Future Entity

To add a new API-connected table (e.g., Products, Users, Invoices, Customers):

1. **Copy the Template Service**:
   Copy [`src/app/core/templates/api-data-table-service.template.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/core/templates/api-data-table-service.template.ts) to your feature directory (e.g. `src/app/features/products/services/product.service.ts`).

2. **Define your Model**:
   ```typescript
   export interface Product {
     id: string;
     name: string;
     price: number;
     status: 'in_stock' | 'out_of_stock';
     category: string;
   }
   ```

3. **Set the Base URL**:
   ```typescript
   private readonly baseUrl = `${environment.apiUrl}/products`;
   ```

4. **Define Columns in your Page Component**:
   ```typescript
   readonly columns: TableColumn<Product>[] = [
     { key: 'name', header: 'Product Name', sortable: true },
     { key: 'category', header: 'Category', sortable: true },
     { key: 'price', header: 'Price ($)', sortable: true, align: 'end' },
     {
       key: 'status',
       header: 'Stock Status',
       cellType: 'badge',
       badgeClass: (p) => p.status === 'in_stock' ? 'badge-success' : 'badge-danger'
     }
   ];
   ```

5. **Drop in `<app-data-table>`** in your HTML template — you're done!

---

## 🔒 Authentication & Headers
You don't need to manually attach authentication headers!
The template includes an `authInterceptor` ([`src/app/core/interceptors/auth.interceptor.ts`](file:///c:/Users/zuber/Music/Projects/Test/Template/src/app/core/interceptors/auth.interceptor.ts)) that automatically attaches:
```
Authorization: Bearer <your-jwt-token>
```
to every outgoing HTTP request whenever a user is logged in.
