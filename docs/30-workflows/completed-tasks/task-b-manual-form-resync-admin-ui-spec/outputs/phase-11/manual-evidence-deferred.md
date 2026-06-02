# Deferred Runtime Visual Evidence

## Reason

`/admin/sync-status` requires an authenticated admin session. The manual sync endpoint also depends on server-side `SYNC_ADMIN_TOKEN` injection. Capturing browser screenshots without those external prerequisites would produce misleading evidence.

## Deferred Items

| Screenshot | Status | Reason |
|---|---|---|
| `manual-form-resync-panel-idle.png` | pending | admin authenticated runtime required |
| `manual-form-resync-panel-result.png` | pending | sync execution requires token-backed endpoint |
| `manual-form-resync-panel-confirm.png` | pending | browser interaction required |
| `manual-form-resync-panel-inprogress.png` | pending | controlled 409/runtime fixture required |

## Promotion Rule

After user approval for admin runtime capture, place PNGs under `outputs/phase-11/screenshots/` and promote visual state from `runtime_visual_pending_user_gate` to runtime evidence captured. Until then, local deterministic evidence remains the only claimed PASS.
