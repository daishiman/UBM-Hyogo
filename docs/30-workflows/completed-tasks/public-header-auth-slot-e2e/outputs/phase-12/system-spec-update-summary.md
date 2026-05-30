# Phase 12 — System Spec Update Summary

## 1. 波及対象 spec ファイル

| ファイル | 更新内容 | 必要性 |
|---------|----------|--------|
| `docs/00-getting-started-manual/specs/02-auth.md` | DOM 契約属性 `data-auth-state` / `data-role` の current implementation evidence を追記候補として明確化 | 親 workflow Task A-F が契約 owner。本 workflow は同契約を local implementation + E2E evidence で検証 |
| `docs/00-getting-started-manual/claude-design-prototype/` | プロトタイプ DOM 契約への参照 | 既存資産、変更なし |
| `CLAUDE.md` | 不変条件 #8（`*.spec.ts` のみ）を再確認 | 既存遵守、変更なし |

## 2. 本 workflow による spec / 正本導線変更

| spec パス | 変更 |
|-----------|------|
| `.claude/skills/aiworkflow-requirements/references/workflow-public-header-auth-slot-e2e-artifact-inventory.md` | 本 workflow の artifact inventory を新規登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow として登録 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Progressive Disclosure 導線を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 目的 / scope / planned targets / gate 境界を登録 |
| `.claude/skills/aiworkflow-requirements/changelog/20260528-public-header-auth-slot-e2e.md` | dated changelog を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドラインへ追加 |

API / D1 schema / Auth.js provider 設定は変更しない。実装上の auth guard 挙動として、non-admin `/admin` は `403` ではなく `/login?gate=forbidden` redirect に統一した。変更対象は workflow 正本導線、artifact inventory、apps/web の DOM/auth guard 実装である。

## 3. CONST_006（spec 変更は親 workflow へ集約）遵守

- DOM 契約属性の正本（`data-auth-state` の 3 値、`data-role` の 4 値）は **親 workflow `public-header-logged-in-nav-cleanup`** で確立される。
- 本 workflow はこの契約を **実装して検証する側** であり、契約 owner は親 workflow に集約される。
- 親 workflow が `specs/02-auth.md` を更新した時点で、本 workflow の TC は自動的にその新契約を検証する形になる。

## 4. 関連 docs/30-workflows/ への波及

| workflow | 影響 |
|----------|------|
| `public-header-logged-in-nav-cleanup` | 本 workflow がその検証層として後続。dependencies で明示済み |
| `task-18-w7-verify-tokens-and-playwright-smoke` | 既存 19-route smoke と並走。`needs: smoke` で順序保証 |
| `admin-visual-baseline-admin-routes-task-e` | 別 viewport / 別目的（visual baseline）のため独立 |

## 5. 結論

本 workflow は API / D1 / Auth.js provider 設定の **system spec 変更を伴わない**。ただし、DOM/auth guard 契約は apps/web に実装済みで、task-specification-creator / aiworkflow-requirements の same-wave sync 原則により、workflow 正本導線も本 wave で更新済み。Phase 13 PR は commit / push / PR / remote Actions の user-gated 境界のみを残す。
