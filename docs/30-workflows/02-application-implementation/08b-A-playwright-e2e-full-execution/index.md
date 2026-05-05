# 08b-A-playwright-e2e-full-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 8b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL |

## purpose

08b scaffolding-only の Playwright を full execution に昇格し、実 screenshot / axe / report を取得する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

08b は page objects と skipped specs の scaffold までで閉じており、実 screenshot、real axe report、Playwright report、CI gate が未完了である。

## scope in / out

### Scope In
- `test.describe.skip` の解除計画
- Auth.js 互換 fixture または UI login helper 方針
- D1 seed/reset 方針
- desktop/mobile screenshot evidence
- Playwright HTML/JSON report と axe report
- PR/push CI gate 昇格条件
- **admin 二段防御 E2E シナリオ**（`06-member-auth.md`, `11-admin-management.md` 由来）
  - 非 admin session で `/admin/*` 直接アクセス → UI gate (middleware) で 403 もしくは redirect
  - 非 admin session で `/api/admin/*` 直接呼び出し → API gate (require-admin) で 403
  - admin session でも他人本文の編集 endpoint は 403（invariants #11）
  - UI gate を bypass しても API gate 単独で防御が成立することの evidence（UI を介さない direct fetch test）

### Scope Out
- production 負荷テスト
- visual regression baseline の全面導入
- 09a staging deploy 本体
- 新規 UI 機能追加

## dependencies

### Depends On
- 06a public pages
- 08a-B public `/members` search/filter coverage（q / zone / status / tag / sort / density runtime evidence contract）
- 06b member pages
- 06c admin pages
- 07a/07b/07c admin ops

### Blocks
- 09a staging deploy smoke

## refs

- docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md
- docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/
- docs/00-getting-started-manual/specs/09-ui-ux.md
- .claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md

## AC

- skipped spec が 0 件になる条件が定義される
- `/members` search/filter 9 screenshot、6 curl scenario、axe report を 08a-B Phase 11 contract に沿って取得する
- 実 Playwright report が保存される
- real axe report が保存される
- desktop/mobile screenshot が保存される
- CI gate 昇格前の secret hygiene が明記される
- admin UI gate / API gate の独立性 E2E が PASS（UI を bypass した direct API call も 403 であること）
- 非 admin による `/admin/*` および `/api/admin/*` 双方の 403/redirect evidence が保存される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #5 public/member/admin boundary
- #8 localStorage/GAS prototype を正本にしない
- #9 /no-access 専用画面に依存しない

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
