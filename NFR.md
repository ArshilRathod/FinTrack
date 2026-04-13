# Non-Functional Requirements (Active)

This document defines the **active** non-functional requirements for FinTrack.  
Each requirement includes a verification status and a target.  
Status options: `Planned` | `In Progress` | `Implemented` | `Verified`

---

## Performance
- [ ] Page load under **2s** on average 4G. (Status: Planned)
- [ ] API responses under **300ms** for standard queries. (Status: Planned)
- [ ] Diary detail renders under **1s** for up to **500** transactions. (Status: Planned)

## Availability & Reliability
- [ ] **99.5%** uptime for API. (Status: Planned)
- [ ] Graceful degradation if notifications/analytics fail. (Status: Planned)
- [ ] Critical operations are **idempotent** on retry. (Status: Planned)

## Security
- [x] All user data isolated by **userId** in every query. (Status: Implemented)
- [x] Passwords stored with **strong hashing**. (Status: Implemented)
- [x] All API routes require **auth** except login/signup. (Status: Implemented)
- [x] **Rate limiting** on auth endpoints. (Status: Implemented)

## Data Integrity
- [ ] Expense/diary operations are **ACID**. (Status: Planned)
- [ ] Paid/unpaid member updates are **atomic**. (Status: Planned)
- [ ] Monetary values stored as numeric with **consistent rounding**. (Status: Planned)

## Scalability
- [ ] Supports **10k users** and **1M transactions** without redesign. (Status: Planned)
- [ ] Pagination required beyond **500** records. (Status: In Progress)

## Usability
- [ ] Forms are **keyboard navigable**. (Status: Planned)
- [ ] Errors are **actionable** and human-readable. (Status: Planned)
- [ ] Loading states for all async actions. (Status: Planned)

## Maintainability
- [ ] **80%** of business logic covered by tests. (Status: Planned)
- [ ] API routes and DB models documented. (Status: Planned)
- [ ] Linting + formatting enforced in CI. (Status: Planned)

## Logging & Monitoring
- [x] Log failed API requests with **request ID**. (Status: Implemented)
- [ ] Critical flow errors are **captured + alertable**. (Status: Planned)

## Compatibility
- [ ] Works on latest **Chrome/Firefox/Safari**. (Status: Planned)
- [ ] Mobile responsive down to **360px** width. (Status: Planned)

---

### How to activate these
- Move each requirement to **In Progress** when a ticket is started.
- Mark **Implemented** once code is merged.
- Mark **Verified** once tested (manual/automated).
