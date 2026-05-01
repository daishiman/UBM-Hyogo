# Builder Injection Design

## Selected Option

Add an optional `attendanceProvider?: AttendanceProvider` dependency to the builder input.

## Rationale

- Preserves existing 02a call sites.
- Avoids repository-wide Hono context coupling.
- Avoids introducing a DI container for one read path.

## Fallback

If `attendanceProvider` is absent, keep `attendance: []` only as a compatibility fallback. Tests must cover the injected route paths so the fallback is not mistaken for completion.
