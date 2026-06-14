---
governance_mutation_user_gate: false
status: consumed
consumed_at: 2026-06-13
canonical_workflow: docs/30-workflows/completed-tasks/issue-1198-admin-audit-dead-table-css-cleanup/
parent_workflow: docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/
related_issue: 1198
created_at: 2026-06-10
visual_category: NON_VISUAL
recovery_note: |
  Issue #1198 は canonical workflow root が存在しないまま CLOSED された。
  本 unassigned-task ファイルは issue body の既存リンク整合のため保持する（削除しない）。
  Phase 1-13 の仕様は上記 canonical_workflow へ移行済み（後付け生成・implemented_local_evidence_captured）。
  local 実装は完了済み。commit/PR は user-gated（Refs #1198 のみ・reopen しない）。
---

# 未タスク: 監査ログのカード化で未使用化した旧テーブル系 dead CSS の削除

> 出自: workflow `admin-audit-log-ux-clarity-and-reduce-error-fix`（`/admin/audit` のカード型タイムライン化）の
> Phase 8 OOS-4「旧 `.admin-audit-table*` CSS 削除」判定が **残置（参照ありとの誤判定）** に倒れたため、
> 後続 cleanup 未タスクとして formalize する。

## 1. なぜ（背景）

`/admin/audit`（監査ログ）画面を 4 列テーブルからカード型タイムライン（`AuditLogCard.tsx` /
`.admin-audit-timeline` / `.admin-audit-card`）へ再設計した結果、旧テーブルレイアウト用の以下 3 CSS ブロックが
**コンポーネントから参照ゼロ**になった。しかし実装ターンでは削除されず globals.css に残置している（dead code）。

- `.admin-audit-filter`（旧フィルタフォーム grid。現行は `.admin-audit-applied-filters` に置換済み）
- `.admin-audit-table-scroll`（旧テーブル横スクロール）
- `.admin-audit-table`（旧 `<table>` レイアウト）

元タスクの Phase 12 `unassigned-task-detection.md` は OOS-4 を「Phase 8 判定依存」とし、検証コマンド
`grep -rn 'admin-audit-table' apps/web/src apps/web/app | grep .` で `[残置: 参照あり]` と判定して baseline 据え置きにした。
しかしこの grep は **CSS 定義ファイル（globals.css）自体のヒットを「参照」と誤カウント**しており、
`.tsx` / `.ts` に絞った再 grep ではコンポーネント参照は 0 件であることが 2 回の独立検証で確定した。
したがって OOS-4 は「ゼロ参照 → 削除可」が正しく、残置している分が cleanup 未タスクとなる。

## 2. 何を（対象）

- 対象ファイル: `apps/web/src/styles/globals.css`
- 削除対象: 行 1602-1618（`.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` の 3 ブロック）
  - **保持**: 直後の `.admin-audit-guide`（行 1620〜）以降の新規カード系 CSS（`.admin-audit-timeline` / `.admin-audit-card*` /
    `.admin-audit-glossary` / `.admin-audit-applied-filters` など）は現行 UI が使用中。**削除しない**。
- `.tbl`（汎用ユーティリティ）は audit 専用ではなく他画面で広く使われるため **触らない**（元 Phase 8 判定 §4 と同じ）。なお 2026-06-13 現行コードでは `.tbl` ヒット 0 件のため、canonical workflow では「変更しない」ではなく「復活させない」不変条件へ補正済み。

## 3. 苦戦箇所【記入必須】

- 対象: `apps/web/src/styles/globals.css:1602-1618` と 元タスク `outputs/phase-12/unassigned-task-detection.md`
- 症状: dead CSS 判定 grep `grep -rn 'admin-audit-table' apps/web/src apps/web/app | grep .` が
  **CSS 定義行（globals.css 自身）を「参照あり」と誤検出**し、未使用 CSS が「残置（参照あり）」へ誤分類された。
  正しくは「定義のみ存在・コンポーネント利用ゼロ」＝削除可。
- 罠: 「参照」を数える grep は **定義ファイルを除外**（`--include='*.tsx' --include='*.ts'` で .css を外す、
  または `grep -v globals.css`）しないと、自分自身の定義をカウントして永久に「参照あり」になる。
  同種の CSS dead-code 判定は必ず「定義 1 件はノイズ」として割り引くこと。
- 参照:
  - 元 Phase 8 判定: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-8-refactor.md` §2（OOS-4 判定手順）
  - 元未タスク検出: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/outputs/phase-12/unassigned-task-detection.md`（OOS-4）

## 4. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 削除した CSS を実は他 admin 画面が参照していて視覚崩れ | 中 | 削除前に `grep -rn 'admin-audit-filter\|admin-audit-table' apps/web/src apps/web/app --include='*.tsx' --include='*.ts'` を実行し **0 件**を証跡化する |
| `.admin-audit-guide` 以降の新規カード系 CSS まで巻き込み削除 | 高 | 削除範囲を `.admin-audit-filter`〜`.admin-audit-table`（1602-1618）に厳密限定。`.admin-audit-guide`（1620〜）以降は保持。削除後に `pnpm verify:tokens` と `/admin/audit` の視覚確認 |
| `.tbl` 汎用クラス前提を誤読し stale な保護対象として扱う | 中 | 2026-06-13 現行コードでは `.tbl` ヒット 0 件。canonical workflow 側では「復活させない」不変条件として扱う |
| OKLch トークン正本逸脱（HEX 直書き混入） | 低 | 削除のみで追加なし。`mise exec -- pnpm verify:tokens` で 0 違反を確認 |

## 5. 検証方法

### 単体検証（削除前のゼロ参照証跡）

```bash
# コンポーネント参照が 0 件であることを証跡化（定義ファイル .css は対象外）
grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app \
  --include="*.tsx" --include="*.ts"
```

期待: 出力 0 行（コンポーネント参照ゼロ）。

### 削除後検証

```bash
# 旧クラス定義が globals.css から消えたこと
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css

# 新規カード系 CSS は残っていること
grep -n "admin-audit-timeline\|admin-audit-card\|admin-audit-guide\|admin-audit-applied-filters" apps/web/src/styles/globals.css

mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

期待:
- 旧 3 クラスの grep が 0 件（削除完了）
- 新規カード系 CSS の grep がヒット（保持確認）
- typecheck / lint / verify:tokens すべて PASS（HEX 0 違反）
- 監査ログ関連 Vitest 全 PASS（カード描画への regression なし）

### 統合検証（任意・staging）

```bash
# /admin/audit を staging で目視し、フィルタ・タイムライン表示が崩れていないこと
# （screenshot は user-gated runtime）
```

期待: カードタイムライン・適用フィルタ表示が削除前と同一。

## 6. スコープ

### 含む

- `apps/web/src/styles/globals.css` 行 1602-1618 の旧 audit テーブル系 dead CSS 3 ブロック削除
- 削除前ゼロ参照証跡の取得
- 削除後の typecheck / lint / verify:tokens / 監査ログ Vitest 緑確認

### 含まない

- `.tbl` 汎用クラスの追加・復活（2026-06-13 現行コードではヒット 0 件。audit cleanup に便乗して復活させない）
- `.admin-audit-guide` 以降の新規カード系 CSS の変更（現行 UI 使用中）
- 監査ログ total 件数表示（→ baseline OOS-1。API が cursor pagination で total を返さない＝ apps/api 変更必要・別 Issue）
- 監査ログ CSV/JSON エクスポート（→ baseline OOS-2。新規 endpoint または client 大規模機能・別 Issue）
- `apps/api` / D1 / Google Form の変更（不変条件: apps/web 表現層のみ）

## 7. 参照

- 親 workflow: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/`
- Phase 8 判定手順: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-8-refactor.md` §2
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/outputs/phase-12/unassigned-task-detection.md`（OOS-4）
- 不変条件: `CLAUDE.md` 「UI prototype alignment / MVP recovery」§不変条件 2（OKLch トークン正本化）/ §不変条件 1（既存 API のみ接続）
