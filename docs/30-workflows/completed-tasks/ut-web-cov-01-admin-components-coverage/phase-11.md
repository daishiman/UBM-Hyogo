# Phase 11: 手動 smoke / 実測 evidence — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクとしての実測 evidence を取得し、`outputs/phase-11/` 配下に確定形で保存する。screenshot は不要。Vitest の実行ログと coverage 抽出データを正本とする。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 新規 | evidence index |
| `outputs/phase-11/vitest-run.log` | 新規 | `pnpm --filter @ubm-hyogo/web test:coverage` の生ログ |
| `outputs/phase-11/coverage-target-files.txt` | 新規 | 対象 7 ファイルのみを抽出した coverage-summary 抜粋 |
| `outputs/phase-11/coverage-summary.snapshot.json` | 新規 | `apps/web/coverage/coverage-summary.json` の凍結コピー |
| `outputs/phase-11/manual-smoke-log.md` | 新規 | 手動 smoke の実施範囲と「visual smoke は NON_VISUAL のため N/A」明記 |
| `outputs/phase-11/link-checklist.md` | 新規 | index.md / artifacts.json / 各 phase からのリンク整合チェック |

> production code / test の変更は行わない。

## 関数・型・モジュール構造

evidence 取得スクリプト（インライン）のみ。新規モジュールなし。

## 入出力・副作用

- 入力: `apps/web/coverage/coverage-summary.json`（Phase 9 で生成）
- 出力: `outputs/phase-11/` 配下 6 ファイル
- 副作用: なし（読み取り＋ファイル生成のみ）

## evidence 取得手順

```bash
# 1. coverage 再実測（Phase 9 で生成済みなら再実行不要だが確実性のため再取得）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage 2>&1 \
  | tee docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/vitest-run.log

# 2. coverage-summary を凍結
cp apps/web/coverage/coverage-summary.json \
  docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-summary.snapshot.json

# 3. 対象 7 ファイル抽出
node -e "
const j = require('./apps/web/coverage/coverage-summary.json');
const targets = ['MembersClient','TagQueuePanel','AdminSidebar','SchemaDiffPanel','MemberDrawer','MeetingPanel','AuditLogPanel'];
for (const [k, v] of Object.entries(j)) {
  for (const t of targets) {
    if (k.includes(t)) console.log(t, JSON.stringify(v));
  }
}" > docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-target-files.txt
```

## テスト方針

- Vitest 実行ログを正本とする。再現性のために `vitest-run.log` を必ず保存する。
- coverage-summary.json は CI 環境差を排除するためスナップショット保存する。
- 対象 7 ファイルの行は `coverage-target-files.txt` で人間可読な形式に集約する。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

evidence ディレクトリへの保存は前述の `tee` / `cp` / `node -e` 三段で実行。

## 完了条件 (DoD)

- [x] `outputs/phase-11/vitest-run.log` に PASS サマリ（21 files / 196 tests）が記録されている
- [x] `coverage-summary.snapshot.json` が存在し、Phase 9 で生成された値と一致
- [x] `coverage-target-files.txt` に 7 ファイル全てが含まれ、Stmts/Lines/Funcs ≥85 / Branches ≥80 を満たす
- [x] `manual-smoke-log.md` に visual smoke = NON_VISUAL N/A、Vitest run = PASS が明記
- [x] `link-checklist.md` で artifacts.json の phase-11 entry とのパス一致を確認
- [x] `outputs/phase-11/main.md` が evidence index として完成

## 参照資料

- artifacts.json の phase-11 entry
- Phase 9 outputs/phase-09/main.md
- `apps/web/vitest.config.ts`

## サブタスク管理

- [x] vitest-run.log 取得
- [x] coverage-summary 凍結
- [x] target ファイル抽出
- [x] manual-smoke-log.md / link-checklist.md / main.md 作成

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`
- `outputs/phase-11/coverage-summary.snapshot.json`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## タスク100%実行確認

- [x] 必須セクション充足
- [x] visual smoke を未実施のまま PASS にしていない（NON_VISUAL 明記）
- [x] 実装・deploy・PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ skill index / artifact inventory / unassigned-task 検出を引き継ぐ。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
