# Phase 11 — 手動テスト

## 判定

- status: `local_visual_captured_staging_pending`
- reason: local code, focused specs, grep gate, local visual screenshots, and prototype browser capture are complete. Staging runtime smoke still requires user-gated deployment/runtime access.

## 成果物

| 種別 | パス | 状態 |
| ---- | ---- | ---- |
| checklist | `outputs/phase-11/manual-test-checklist.md` | 作成済み |
| result | `outputs/phase-11/manual-test-result.md` | local visual captured / staging pending |
| discovered issues | `outputs/phase-11/discovered-issues.md` | open issues なし |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | 作成済み |
| screenshot metadata | `outputs/phase-11/screenshots/phase11-capture-metadata.json` | captured_local_runtime |

## 境界

この Phase 11 は staging full PASS ではない。Phase 12 の判定は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし、local visual evidence は `outputs/phase-11/screenshots/*.png` で取得済み、staging `/login` visual capture と magic-link staging curl は後続の user-gated runtime 証跡で更新する。
