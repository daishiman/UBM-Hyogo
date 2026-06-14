# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 7 / 13（カバレッジ確認） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

本タスクで変更したファイルとブロックに限定したカバレッジを確認する。全体一律のしきい値ではなく、新規追加した純粋関数 `formatJstDate` と、文言・revisionId 非表示で変更した描画分岐の line / branch カバレッジを到達目標として明記する。変更しないファイルはカバレッジ対象外として除外し、検証範囲を絞る。

## 実行タスク

1. `formatJstDate` の line / branch カバレッジ 100% を目標とする（`!iso` 分岐 / `Number.isNaN` 分岐 / 正常 format パスの 3 分岐を Phase 4・6 のケースで網羅）。
2. CurrentRevisionCard の `capturedAt` 有効 / 無効による「取得:」行の描画 / 非描画分岐の両方が covered であることを確認する。
3. 文言置換した描画行（page.tsx ヘッダー / REVISIONS / ALIAS HISTORY、SchemaDiffPanel、SchemaAlertCard、KpiGrid）が、対応する spec の文字列 assert で実行パスとして covered であることを確認する。
4. 変更しないファイル（用語集 SSOT 3ファイル、API、データ取得ロジック、Playwright runner）をカバレッジ目標の対象外として明示する。
5. focused カバレッジ計測コマンドを記載する（変更ファイルに `--coverage` を絞って実行し、全体 80% gate とは別の局所確認とする）。

## 参照資料

- [shared-context.md](../../shared-context.md) — §3 helper / §4 変更ファイル一覧
- [phase-4.md](../phase-4/phase-4.md) — テストケース・AC 対応表
- [phase-6.md](../phase-6/phase-6.md) — 境界値・回帰ガード
- `apps/web/src/lib/format/datetime.ts` — `formatJstDate` カバレッジ対象

## 成果物

- カバレッジ到達目標表（変更ブロック限定）
- カバレッジ対象外ファイル一覧
- focused カバレッジ計測コマンド

### カバレッジ到達目標（変更ブロック限定）

| 対象 | 目標 line | 目標 branch | 供給テスト |
|------|----------|------------|-----------|
| `formatJstDate`（datetime.ts 新規追加分） | 100% | 100% | Phase 4 7 ケース + Phase 6 境界値 |
| CurrentRevisionCard 描画分岐（取得行 有/無） | 変更行 covered | fail-soft 両分岐 covered | T1-c〜T1-f |
| RevisionAndAliasHistory 文言行 | 変更行 covered | — | T1-g, T1-h |
| SchemaDiffPanel 文言行 | 変更行 covered | — | T5-a, T5-b |
| SchemaAlertCard 文言行 | 変更行 covered | count 分岐 covered | T6-a, T6-b |
| KpiGrid 文言行 | 変更行 covered | — | T6-c |

### カバレッジ対象外（変更しないファイル）

- 用語集 SSOT 3ファイル（schemaGlossary.ts / schemaReviewTerms.ts / schemaHistoryGlossary.ts）— §2-10 据置
- `apps/api` 配下すべて（AC-11 非接触）
- データ取得ロジック（`safeServerFetch<FullDiff>`・`diff` 構造）— 不変
- 既存 `formatJstDateTime`（不変・既存カバレッジ維持）
- Playwright runner（本サイクル非実行）

### focused カバレッジ計測コマンド

> ルートからフルパス指定が必須（別 worktree の node_modules 混入を防ぐ）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage \
  "apps/web/src/lib/format/datetime.spec.ts" \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
```

## 統合テスト連携

- 局所カバレッジは全体 80% gate を置き換えるものではなく、変更ブロックの未到達分岐を検出する補助確認とする。
- `formatJstDate` の 3 分岐が 100% でないときは Phase 6 境界値ケースの不足を意味するため、Phase 6 へ差し戻す。
- 文言行 covered の確認は、対応 spec の assert が実際に描画パスを通っている証跡となる。

## 完了条件

- [ ] `formatJstDate` の line / branch 100% が到達目標として明記されている
- [ ] CurrentRevisionCard の fail-soft 両分岐が covered 目標に含まれている
- [ ] 変更しないファイル（用語集 3 / API / データ取得 / Playwright）が対象外として明示されている
- [ ] 全体一律でなく変更ブロック限定のカバレッジ確認である旨が明記されている
- [ ] focused カバレッジ計測コマンドが記載されている
