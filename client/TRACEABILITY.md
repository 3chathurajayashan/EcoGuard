# Flow and HCI traceability

The referenced revised scenario/sequence diagram and HCI review were not attached. The labels below are mapped to the behaviors explicitly stated in the request; where numbered HCI detail was not supplied, the implementation maps the nine listed interface requirements in order.

## Scenario flows and exceptions

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Main — assigned route, start, timed GPS, immediate local save, reload resume, complete and sync | `src/controller/PatrolController.js`; `src/services/IndexedDbLocalDatabase.js`; `src/ui/pages/PatrolPage.jsx` | `src/controller/PatrolController.test.js`; `src/services/IndexedDbLocalDatabase.test.js` |
| A1 — manual waypoint, prefilled last position, movable map pin, Advanced coordinates, required description, no type selector | `src/ui/pages/AddWaypointPage.jsx`; `src/ui/components/MapView.jsx`; `src/controller/PatrolController.js` | `src/ui/pages/pages.test.jsx`; `src/controller/PatrolController.test.js` |
| A2 — persistent GPS warning and recovery; manual capture when GPS is unavailable | `src/controller/PatrolController.js`; `src/ui/components/GpsBanner.jsx`; `src/ui/pages/PatrolPage.jsx` | `src/controller/PatrolController.test.js`; `src/ui/components/components.test.jsx` |
| A3 — offline sync failure preserves record and pending message/state | `src/controller/PatrolController.js`; `src/services/HttpSyncGateway.js`; `src/ui/pages/PatrolPage.jsx` | `src/controller/PatrolController.test.js`; `src/services/HttpSyncGateway.test.js` |
| A4 — online/timed/manual retry and exponential automatic backoff | `src/controller/PatrolController.js`; `src/ui/PatrolContext.jsx`; `src/ui/pages/PatrolPage.jsx` | `src/controller/PatrolController.test.js`; `src/ui/pages/pages.test.jsx` |
| A5 — synced patrol report, coverage, neglected route map, assignment form | `src/ui/pages/ReportsPage.jsx`; `src/ui/components/MapView.jsx` | Reports are API-backed; API integration test requires the API service |
| E1 — `NO_ASSIGNED_ROUTE` and disabled start | `src/controller/PatrolController.js`; `src/ui/pages/PatrolPage.jsx` | `src/controller/PatrolController.test.js` |
| E2 — neither GPS nor manual position means no point is created | `src/controller/PatrolController.js`; `src/ui/pages/AddWaypointPage.jsx` | `src/controller/PatrolController.test.js` |
| E3 — local persistence failure is surfaced without success state | `src/services/IndexedDbLocalDatabase.js`; `src/controller/PatrolController.js` | `src/services/IndexedDbLocalDatabase.test.js`; `src/controller/PatrolController.test.js` |
| E4 — sync failure retains local pending record for retry | `src/controller/PatrolController.js`; `src/services/IndexedDbLocalDatabase.js` | `src/controller/PatrolController.test.js`; `src/services/IndexedDbLocalDatabase.test.js` |

## HCI requirements

| HCI item | Implementation | Verification |
| --- | --- | --- |
| HCI-1 Mobile-first layout and large touch targets | `src/styles/tokens.css`; `src/styles/app.css` | Build and manual responsive browser check |
| HCI-2 Nature palette with one CSS token file | `src/styles/tokens.css`; `src/styles/app.css` | Build |
| HCI-3 Single shared five-destination bottom nav | `src/ui/components/BottomNav.jsx`; `src/ui/App.jsx` | App routes and component render |
| HCI-4 Active patrol collapses decorative header | `src/ui/App.jsx`; `src/styles/app.css` | App state-derived render |
| HCI-5 Summary presents exactly one sync state; retry only while pending | `src/ui/components/SyncState.jsx`; `src/ui/pages/PatrolPage.jsx` | `src/ui/components/components.test.jsx`; `src/ui/pages/pages.test.jsx` |
| HCI-6 Pending sync remains visible from Patrol navigation | `src/ui/components/BottomNav.jsx`; `src/ui/pages/PatrolPage.jsx`; `src/ui/App.jsx` | Pending state render |
| HCI-7 Accessible labels and visible keyboard focus | `src/ui/components/ConfirmDialog.jsx`; `src/ui/components/BottomNav.jsx`; `src/styles/app.css` | Component tests |
| HCI-8 Status uses icon and label as well as color | `src/ui/components/StatusBadge.jsx`; `src/ui/components/SyncState.jsx` | `src/ui/components/components.test.jsx` |
| HCI-9 Loading, GPS error, and user-facing save/sync feedback | `src/ui/pages/ReportsPage.jsx`; `src/ui/components/GpsBanner.jsx`; `src/controller/PatrolController.js` | `src/ui/components/components.test.jsx`; `src/controller/PatrolController.test.js` |
