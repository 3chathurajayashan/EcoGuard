# EcoGuard

Wildlife conservation system for SE3070 (Case Studies in Software Engineering). One Expo app runs on Android, iOS and the web; it talks to the REST API in the `ecoGuard-backEnd` repository.

## Who sees what

| Role | Layout | Screens |
|---|---|---|
| Park Ranger | Phone tabs | Home, Report incident (with photos, works offline), Patrol (route, GPS tracking, waypoints, sync), Conflict alerts (acknowledge, respond, close), Map, My reports, Notifications, Profile |
| Community Liaison Officer | Phone tabs | Home, Alerts, Verify community reports, Map, Profile |
| Villager | Phone tabs | Report a sighting, My reports, Profile |
| Park Manager | Dashboard (sidebar) | Dashboard, Analytics & Reports (export PDF/CSV/Excel), Patrol operations (assign routes), Wildlife monitoring, Incident management, Community engagement, Settings |
| Conservation Researcher | Dashboard (sidebar) | The same pages, read only |

Routes are guarded by role in `src/app/_layout.tsx`, and the backend checks the role again on every request.

## Run the whole system

1. Start the backend (see the backend README): `npm run seed -- --reset` then `npm run serve`. It listens on port 5001.
2. In this folder: `npm install`, then `npx expo start`.
   - Press `w` for the web version (manager and researcher dashboards look best here).
   - On a phone, open the project with Expo Go. The app finds the backend on the same machine automatically; set `EXPO_PUBLIC_API_URL=http://<your-ip>:5001/api` to point somewhere else.
3. Sign in with a demo account (password `Eco@12345`), or tap a role on the login screen: `ranger@`, `liaison@`, `manager@`, `researcher@`, `villager@` + `ecoguard.lk`.

Try the whole conflict story: sign in as the villager and report a sighting; as the liaison officer verify it in the Verify tab; as the assigned ranger acknowledge the alert, respond with photos and close it; as the manager open Analytics and export the report. As the manager you can also open Wildlife Monitoring and move a collar into a risk zone to see an alert raised automatically.

On the Patrol screen, "Demo mode" simulates GPS movement along the route, so a patrol can be shown without walking.

## Folders

```
src/app/(auth)       login and sign-up
src/app/(tabs)       phone layout: home, patrol/, alerts, community, sightings, map, reports, profile
src/app/(admin)      dashboard layout: dashboard, analytics/, patrol-operations, monitoring, ...
src/app/conflicts    wildlife conflict alert screens
src/app/incidents    incident reporting screens
src/utils            API client, session, roles and one module per feature
src/components       shared UI, maps and charts
screenshots          screens of the conflict alert part
```

## Checks

```
npx tsc --noEmit
npx expo lint
```

`client/` is the earlier standalone web patrol prototype. The patrol feature in this app replaces it and is built on the same rules (waypoint types, offline sync, 50 m coverage).

## Troubleshooting

"No development build (com.anonymous.ecoguard) for this project is installed" when pressing `i`: press `s` in the terminal running `npx expo start` to switch back to Expo Go, then press `i` again.
