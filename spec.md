# Specification

## Summary
**Goal:** Fix the vendor approval flow so that admins can successfully approve or reject vendor requests, with changes persisted in the backend and reflected correctly in the frontend.

**Planned changes:**
- Fix backend approval logic so that approving or rejecting a vendor correctly updates and persists the vendor's status in the backend state.
- Fix the ApprovalDashboard to correctly call approve/reject backend mutations, show success or error toast notifications, and refresh the approval list after each action.
- Ensure vendor-gated pages (VendorDashboard, VendorProducts) correctly read the updated approval status and grant or block access accordingly without requiring a page reload.

**User-visible outcome:** Admins can approve or reject pending vendors from the ApprovalDashboard without errors, see the list update immediately, and approved vendors gain access to vendor pages while pending/rejected vendors remain blocked.
