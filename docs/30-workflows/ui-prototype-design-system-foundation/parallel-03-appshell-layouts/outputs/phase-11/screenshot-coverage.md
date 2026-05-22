# Screenshot Coverage

| target | route | status | evidence |
| --- | --- | --- | --- |
| public-shell | `/members` | captured | `outputs/phase-11/screenshots/public-shell.png` |
| admin-shell | `/admin` | deferred-to-serial-07 | requires authenticated admin session fixture |
| member-shell | `(member route group)` | deferred-to-serial-07 | current `/login` and `/profile` are root routes |

`public-shell.png` exists and covers the `(public)` layout data hook contract. Admin/member full runtime captures remain delegated to serial-07 because they require an authenticated admin fixture or future child route under `(member)`.
