[実装区分: 実装仕様書]

# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 7（カバレッジ確認） |
| 下流 | Phase 9（品質保証） |
| 状態 | completed |
| タスク種別 | implementation（VISUAL） |

## 目的

Phase 7 で「未カバー AC ゼロ・既存 spec 追従済み」を確認した状態を前提に、**挙動を一切変えずに**コードの重複（duplicate）と命名 drift を削減する。具体的には (1) 各 component に散在していた英語ラベル直書き（`AuditLogPanel` の `label="action"` 等 / `AuditLogCard` の `auditId` / `auditAppliedFilters` の `label: "action"` 等）を `auditGlossary.ts` の describe helper / ラベルマップへ集約、(2) 操作コード・対象種別の表示変換ロジックの一元化（`item.action` 直表示 → `describeAuditAction(item.action)`）、(3) `globals.css` の `.admin-audit-glossary` / `.admin-audit-card__meta` の `minmax` 漂流値の整理、を `対象/Before/After/理由` テーブル（[Feedback RT-03]）で記録し、各行に「挙動不変であること」の確認方法を添える。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ方針（duplicate / 命名 drift 削減） |
| ドキュメント | outputs/phase-08/before-after.md | 対象/Before/After/理由/挙動不変確認 の 5 列テーブル |
| メタ | artifacts.json | Phase 8 を completed に維持 |

## 実行タスク

1. **英語ラベル直書きの集約**: `AuditLogPanel.tsx` の `FormField label` 直書き / `AuditLogCard.tsx` の `auditId` 直書き / `auditAppliedFilters.ts` の `label: "action"` 等を、すべて `describeAuditField` / `describeAuditAction` / `describeAuditTargetType` へ集約した前後を記録する。
2. **表示変換ロジックの一元化**: 操作コード・対象種別の「コード → 日本語」変換が 3 component（Panel datalist / Card / appliedFilters）で重複しないよう、`auditGlossary.ts` の helper を唯一の変換点とする方針を記す（duplicate 削減）。
3. **`globals.css` の minmax 整理**: `.admin-audit-glossary`（`minmax(170px,1fr)`）/ `.admin-audit-card__meta`（`minmax(150px,1fr)`）の漂流値を整列が破綻しない値へ整理し、`.chip-row` の wrap 重複定義（既存 L2189-2196 に存在）を再宣言しない方針を記録する。
4. **命名 drift の削減**: ラベルの正本が `auditGlossary.ts` の 3 マップに一本化され、component 側に日本語文字列リテラルが残らない（= 用語変更時の修正点が 1 箇所）ことを確認する。
5. **挙動不変の確認方法添付**: 各リファクタ行に「Phase 7 の TC 再実行で PASS」「testid（`audit-log-card` / `audit-applied-filters`）維持」「screenshot 差分なし（Phase 11）」等の確認手段を添える。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 変更後の対象ファイルと helper 集約先 |
| 必須 | outputs/phase-07/ac-matrix.md | 挙動不変担保 TC の特定 |
| 必須 | _shared-context.md §4 | C1（glossary 集約）/ C3（CSS 整列） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | リファクタの挙動不変担保パターン |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 既存 primitive 集約・新規 primitive 禁止（AC-10） |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 対象 | `apps/web/src/components/admin/auditGlossary.ts` | ラベル変換の唯一の正本（集約先） |
| 対象 | `apps/web/src/components/admin/AuditLogPanel.tsx` | label 直書き元 |
| 対象 | `apps/web/src/components/admin/AuditLogCard.tsx` | action/targetType/auditId 直書き元 |
| 対象 | `apps/web/src/components/admin/auditAppliedFilters.ts` | チップ label 直書き元 |
| 対象 | `apps/web/src/styles/globals.css`（`.admin-audit-*`） | minmax 漂流整理 |

## 実行手順

### ステップ 1: before-after テーブルの作成

- `outputs/phase-08/before-after.md` に `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブルを作る（[Feedback RT-03]）。
- 最低限の 4 行（英語ラベル直書き → glossary helper 集約 / action 直表示 → describeAuditAction 一元化 / appliedFilters 英語 label → describe helper / globals.css minmax 整理）を必ず含める。

### ステップ 2: リファクタ方針の確定

- `outputs/phase-08/main.md` に「duplicate（ラベル変換の 3 箇所重複）と命名 drift の削減方針」を書く。
- 命名 drift = 日本語ラベル文字列が複数 component に散らばるリスク。`auditGlossary.ts` の 3 マップへ集約する方針を記す。

### ステップ 3: 挙動不変の機械確認

- Phase 7 の TC を再実行し、全 PASS を確認する（リファクタで失敗が出れば挙動が変わった証拠）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

- testid（`audit-log-card` / `audit-applied-filters`）が維持されていることを grep で確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | リファクタ前の TC 全 PASS を不変基準として参照 |
| Phase 9 | 整理後の `globals.css` を token-audit（HEX ゼロ）の対象にする |
| Phase 11 | screenshot 差分なし（挙動不変）を visual で確認 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装後の対象ファイルと手順をリファクタ対象へ接続 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/failure-cases.md` | 異常系ケースを挙動不変確認に接続 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | 挙動不変担保 TC の特定 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| ラベル変換の一元化 | AC-4 / AC-6 | コード → 日本語の変換が `auditGlossary.ts` の helper 1 箇所に集約され、component に重複しない |
| 英語キー名ゼロ | AC-4 | リファクタ後も英語キー名露出が増えない（grep ゼロ） |
| CSS 整列 | AC-7 | `.admin-audit-glossary` / `.admin-audit-card__meta` の minmax が整理され、`.chip-row` を再宣言しない |
| 挙動不変 | AC-12 | 全リファクタ行に確認方法が添えられ、TC 全 PASS で挙動不変が担保される |
| 新規 primitive 非増加 | AC-10 | 集約で `components/ui/` に新規追加が発生しない |
| API/D1/shared 不変 | AC-9 | リファクタが表現層に閉じ、`<input name>` / query param キーを変えない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 英語ラベル直書き → glossary helper 集約 | 8 | completed | before-after.md 行 1 |
| 2 | action 直表示 → describeAuditAction 一元化 | 8 | completed | before-after.md 行 2 |
| 3 | appliedFilters 英語 label → describe helper | 8 | completed | before-after.md 行 3 |
| 4 | globals.css minmax 整理 | 8 | completed | before-after.md 行 4 |
| 5 | 挙動不変の確認方法添付 | 8 | completed | 各行に確認手段 |

## 完了条件

- [ ] `outputs/phase-08/main.md` に duplicate（ラベル変換 3 箇所重複）と命名 drift の削減方針が書かれている
- [ ] `outputs/phase-08/before-after.md` が `対象/Before/After/理由` テーブル形式である（[Feedback RT-03]）
- [ ] テーブルに最低 4 行（英語ラベル集約 / action 一元化 / appliedFilters 日本語化 / globals.css minmax 整理）が含まれる
- [ ] 各行に「挙動不変であること」の確認方法が添えられている
- [ ] リファクタ後も Phase 7 の TC が全 PASS する方針が記されている
- [ ] 新規 primitive 追加ゼロ・HEX 非増加（AC-8/AC-10）がリファクタで維持される

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-08/{main,before-after}.md` が配置済み
- [ ] before-after テーブルの全行に挙動不変の確認方法がある（AC-12）
- [ ] testid（`audit-log-card` / `audit-applied-filters`）を破壊しない
- [ ] リファクタが表現層に閉じ、API/D1/shared 型に触れない（AC-9）
- [ ] artifacts.json の Phase 8 ステータスが completed に整合している

## 次Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項: before-after テーブル / 整理後の globals.css / 挙動不変 TC 全 PASS
- ブロック条件: リファクタで Phase 7 の TC が 1 件でも FAIL する場合は挙動が変わったため差し戻す
