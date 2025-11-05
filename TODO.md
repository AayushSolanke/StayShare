## Host Management Feature TODO

- [ ] Update user seed data to flag landlords/hosts (schema now allows `role: 'landlord'`).
- [x] Expose host-specific API endpoints:
  - `GET /api/listings/owner/me` for the authenticated host's inventory.
  - `GET /api/bookings/landlord` to review incoming requests.
  - `PATCH /api/listings/:id/status` to mark as full/reopen.
  - `PUT /api/bookings/:id/status` to approve/decline requests.
- [ ] Extend booking/request models with any additional status metadata (timestamps, landlord notes).
- [x] Add host dashboard UI (`src/components/HostDashboard.jsx`) with tabs for Listings, Pending Requests, Schedule.
- [x] Integrate API service helpers for new endpoints.
- [x] Update routing/guarding and navigation to show dashboard only to host users.
- [x] Surface "Full" badges/disabled CTAs in listing detail when `isActive` is false.
- [ ] Add notifications/toasts after approve/decline or status changes.