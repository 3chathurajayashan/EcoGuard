# EcoGuard Ranger Patrols

Mobile-first React 18/Vite client for managing Ranger patrols and Park Manager coverage. The client is an offline-first application: patrol state and GPS/manual waypoints are committed to IndexedDB before synchronization is attempted.

## Setup

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

Vite prints the local development URL (normally `http://localhost:5173`). The `client/` folder is self-contained and can be run independently of the Expo app in the parent directory.

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | REST API base URL |
| `VITE_GPS_INTERVAL_MS` | `10000` | GPS capture interval in milliseconds |
| `VITE_MAX_SYNC_ATTEMPTS` | `5` | Maximum automatic sync attempts per patrol |
| `VITE_RANGER_USER_ID` | `ranger-001` | Development Ranger's `X-User-Id` |
| `VITE_PARK_MANAGER_USER_ID` | `manager-001` | Development Park Manager's `X-User-Id` |

The role control in the header is a development-only identity selector, not authentication or authorization. The role's configured ID is sent using `X-User-Id`.

## Run and verify

```sh
npm run dev
npm test
npm run test:coverage
npm run lint
npm run build
```

Coverage is measured for the domain, controller, and services with line, function, branch, and statement thresholds of 80%.

## Offline demo

Toggle **Offline** in the header (or in the compact active-patrol header) to force health checks and sync requests to fail. GPS continues using the deterministic fake GPS strategy in Vite development mode. Patrol and waypoint writes remain local, the UI shows **Pending Sync**, and the browser-online handler, retry timer, and **Retry now** control provide retry paths. In a production build, `BrowserGpsService` uses browser geolocation. IndexedDB is retained across page reloads; an in-progress patrol is restored and its GPS tracking is resumed.

## Assumptions (the shared API contract was not included)

- The contract's placeholder did not provide enum strings; the client uses the frozen values `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `NOT_SYNCED`, `PENDING_SYNC`, `SYNCED`, `AUTOMATIC`, and `MANUAL`.
- Seeded user IDs were not available in this workspace; defaults `ranger-001` and `manager-001` are configurable in `.env`.
- The API exposes `POST /patrols/sync` (completed patrol JSON), `GET /health`, `GET /patrols`, `GET /coverage`, `GET /routes`, and `POST /assignments`. Sync success is any 2xx response; error responses need not use a specific JSON schema.
- `GET /patrols` returns either an array or `{ "patrols": [...] }`; report items contain `syncStatus`, optional `assignment.route.name`/`routeName`, `id`, and `completedAt`.
- `GET /coverage` returns a coverage value as `coveragePercent` or `coveragePercentage`, with optional `neglectedWaypoints`/`neglectedRoutePoints` and `routeWaypoints` coordinate arrays. `GET /routes` returns an array or `{ "routes": [...] }` with `id` and `name`.
- `POST /assignments` accepts `{ "routeId": string, "rangerId": string }`; route assignment succeeds on any 2xx response.
- The local developer preview route is static (`Yala Block I Wildlife Corridor`, Sri Lanka); production route assignment data is expected to come from the API. No credentials, login, or role enforcement are implemented.
- Vite development mode uses `FakeGpsService` so the flow can be previewed without granting location access; production builds use browser GPS. Tile-map imagery requires internet access, but GPS and patrol persistence do not.
- A sync retry count includes the initial attempt. Automatic retries use exponential delays starting at one second; **Retry now** can explicitly retry a still-pending patrol after automatic attempts are exhausted.
- “Coverage” is displayed as the API-provided percentage and neglected points are represented using the returned coordinates; matching, thresholds, and route analytics are server responsibilities.

## Screen to wireframe mapping

- **Assigned Route / Review & Start** — `/patrol` before a patrol starts; route name, planned distance/duration, expected waypoints, and route map.
- **Active Tracking** — `/patrol` while `IN_PROGRESS`; compact header, GPS warning, route map, distance/time/count metrics, waypoint actions, and end confirmation.
- **Add Waypoint** — `/patrol/add-waypoint`; draggable/clickable map pin, required description, and collapsed Advanced coordinate inputs.
- **Patrol Summary** — `/patrol/summary`; one sync state, optional retry, distance/time/waypoint recap, and patrol map.
- **Park Manager Reports** — `/reports`; synced patrol list, API coverage percentage, neglected-point map, and route assignment form.
- **Home, Map, Profile** — shared bottom navigation and explicit out-of-scope placeholders.
