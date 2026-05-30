# Unassigned Task Detection

## Result

Unassigned task count: `0`.

## Reviewed Candidates

| Candidate | Decision |
| --- | --- |
| Generalize `AdminSidebarNavItem` with `dataRole` | Rejected. One dedicated footer-adjacent anchor is simpler and avoids shared primitive churn. |
| Migrate to `SidebarShell` | Rejected for this workflow. Covered by existing `unified-sidebar-shell-public-and-admin`. |
| Replace anchor with Next.js `Link` | Rejected. Admin-to-public route group transition is acceptable as native `<a href="/">`. |

