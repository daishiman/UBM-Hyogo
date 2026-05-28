---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 4
phase_name: テスト計画
created_at: 2026-05-27
---

# Phase 4: テスト計画

[実装区分: 実装仕様書]

## 1. 撮影 matrix（最大 48 PNG）

| # | route | mobile | tablet | desktop | wide | env-gate |
|---|---|---|---|---|---|---|
| 1 | `/admin` | ○ | ○ | ○ | ○ | — |
| 2 | `/admin/dashboard/attendance` | ○ | ○ | ○ | ○ | — |
| 3 | `/admin/members` | ○ | ○ | ○ | ○ | — |
| 4 | `/admin/members/[id]` | ○ | ○ | ○ | ○ | `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` |
| 5 | `/admin/tags` | ○ | ○ | ○ | ○ | — |
| 6 | `/admin/meetings` | ○ | ○ | ○ | ○ | — |
| 7 | `/admin/meetings/[id]` | ○ | ○ | ○ | ○ | `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` |
| 8 | `/admin/schema` | ○ | ○ | ○ | ○ | — |
| 9 | `/admin/schema/history` | ○ | ○ | ○ | ○ | — |
| 10 | `/admin/requests` | ○ | ○ | ○ | ○ | — |
| 11 | `/admin/identity-conflicts` | ○ | ○ | ○ | ○ | — |
| 12 | `/admin/audit` | ○ | ○ | ○ | ○ | — |

- CI 既定: env-gated 2 routes は skip → **40 PNG**
- seed ID 両方注入時: **48 PNG**
- 中間値 44 PNG: **禁止運用**

---

## 2. test 構造（list 検証）

`pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --list` で

- required 10 spec × 4 project = **40 test**
- env-gated 2 spec × 4 project = **8 test**（未設定時 skip）

合計 **48 test entry** が list されることを Phase 9 で確認する。

---

## 3. regression detection 検証（dry-run）

目的: AC-5（regression が CI で確実に検出される）を保証する。

手順:
1. `apps/web/src/styles/tokens.css` の `--color-surface` を一時的に改変（例: `oklch(98% 0 0)` → `oklch(80% 0 0)`）
2. CI で `admin-visual` job を回し、baseline と diff が出る（fail する）ことを確認
3. revert（commit しない or revert commit）

dry-run は **必須**。Phase 11 evidence に「regression dry-run 結果」を含める。

---

## 4. 既存 unit test との関係

- `_helpers.ts` の `waitAdminPageReady` / `freezeAnimations` は playwright 依存のため unit test 不要
- 既存 vitest スイートには影響なし（spec 追加のみ）
