# Phase 1 Requirements

The UI must render the first `/me/profile` attendance page (default 50 records) and let the member fetch additional `/api/me/attendance` pages with an opaque cursor.

Accepted decisions:

- Initial fetch stays in `apps/web/app/profile/page.tsx`.
- Additional fetch stays in `AttendanceList` Client Component.
- The cursor is never decoded in the frontend.
- Error recovery keeps the button usable after the failed request settles.

