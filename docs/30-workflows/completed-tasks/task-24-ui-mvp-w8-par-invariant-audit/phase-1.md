# Phase 1: 要件定義

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## タスク分類

- **種別**: NON_VISUAL / 監査タスク（read-only audit）
- **implementation_mode**: `verify_existing`
- **screenshots**: N/A（UI/UX 変更なし）
- **画面再描画**: なし

## スコープ

### IN
- task-01〜22 の仕様書および実装成果物の参照
- 不変条件 6 項目に対する遵守確認
- grep / static check による evidence 収集
- `22 task × 6 invariant` matrix レポート生成

### OUT
- 既存実装の修正・書き換え
- 新 endpoint / D1 schema / primitive の追加
- task-27 のリスク評価（下流タスクで実施）

## 受入条件

1. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` が存在し、22×6 matrix を含む
2. 各セルが `COMPLIANT` / `VIOLATION` / `N/A` のいずれかで埋まっている
3. `VIOLATION` セルには該当ファイル:行が引用されている
4. grep gate 実行結果が `outputs/phase-5/grep-evidence.txt` に保存されている
5. 既存ソースおよびタスク仕様書に書き換えがない（`git diff` で確認）

## 前提・制約

- 全 22 タスクが完了済み（completed-tasks ledger および各 task spec を参照）
- 既存 API endpoint surface は `apps/api/src/routes/` に閉じている
- OKLch トークン正本は `apps/web/src/styles/tokens.css` および `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本は `docs/00-getting-started-manual/claude-design-prototype/`
- D1 binding は `apps/api/wrangler.toml` にのみ存在し、`apps/web/wrangler.toml` には存在しないことが期待値

## 監査対象 task インベントリ

| Task | パス | Wave |
|------|------|------|
| task-01 | `01-scope/task-01-...` | W1 |
| task-02 | `02-runtime/task-02-...` | W2 |
| task-03 | `02-runtime/task-03-...` | W2 |
| task-04 | `02-runtime/task-04-...` | W3 |
| task-05 | `02-runtime/task-05-...` | W4 |
| task-06 | `03-spec-source/task-06-...` | W2 |
| task-07 | `03-spec-source/task-07-...` | W2 |
| task-08 | `03-spec-source/task-08-...` | W2 |
| task-09 | `04-design-system/task-09-...` | W3 |
| task-10 | `04-design-system/task-10-...` | W4 |
| task-11 | `05-screens-public/task-11-...` | W5 |
| task-12 | `05-screens-public/task-12-...` | W5 |
| task-13 | `06-screens-member/task-13-...` | W5 |
| task-14 | `06-screens-member/task-14-...` | W5 |
| task-15 | `07-screens-admin/task-15-...` | W5 |
| task-16 | `07-screens-admin/task-16-...` | W6 |
| task-17 | `07-screens-admin/task-17-...` | W6 |
| task-18 | `08-regression/task-18-...` | W7 |
| task-19 | `03-spec-source/task-19-...` | W2 |
| task-20 | `03-spec-source/task-20-...` | W2 |
| task-21 | `03-spec-source/task-21-...` | W2 |
| task-22 | `03-spec-source/task-22-...` | W2 |

## carry-over 確認

- 前タスクの成果物（直近 PR）: task-23/25/26 と並列 wave のため未マージの可能性あり。本タスクは read-only のため衝突しない。
- 命名規則: `INV-1` 〜 `INV-6` を invariant ID、`task-01` 〜 `task-22` を task ID として固定。

## 既存命名規則の分析

- ファイル拡張子: `.md` (docs), `.ts/.tsx` (apps/web), `.toml` (wrangler)
- design token: kebab-case (`--color-fg-primary`)
- API endpoint: `/api/...` (kebab-case)

## メタ情報
- Phase: 1 / 要件定義
- State: completed

## 目的
task-24 の read-only invariant audit 要件を固定する。

## 実行タスク
- task-01..22 と INV-1..6 の監査対象を定義する。
- NON_VISUAL と既存 apps/packages 変更禁止の境界を定義する。

## 参照資料
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/artifacts.json`

## 成果物
- `phase-1.md`

## 完了条件
- [x] 監査対象 task-01..22 が定義されている
- [x] INV-1..6 が定義されている
- [x] NON_VISUAL 境界が定義されている

## 統合テスト連携
Phase 5 の audit-runner 実行と Phase 11 NON_VISUAL evidence に接続する。
