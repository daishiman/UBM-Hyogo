# Client Boundary Decision

## Verdict

completed

`apps/web/src/components/ui/Toast.tsx` begins with `"use client";`, so `apps/web/app/layout.tsx` can import `ToastProvider` directly and render it as a client subtree under the server `RootLayout`.

## Adopted Import

```tsx
import { ToastProvider } from "@/components/ui/Toast";
```

No `ToastProviderClient.tsx` wrapper is needed.

