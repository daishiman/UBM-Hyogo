# task-03a-stablekey-literal-lint-001

## Metadata

| Field | Value |
| --- | --- |
| Source | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Status | consumed_by_enforced_dry_run |
| Priority | Medium |
| Owner candidate | wave 8b lint config |

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-03a-stablekey-literal-lint-001 |
| タスク名     | stableKey 文字列リテラルの ESLint カスタムルール導入 |
| 分類         | セキュリティ・品質（sec/imp） |
| 対象機能     | 静的検証（lint） / AC-7 enforcement |
| 優先度       | 中 |
| 見積もり規模 | 小規模 |
| ステータス   | consumed（`docs/30-workflows/03a-stablekey-literal-lint-enforcement/` に引き継ぎ済み） |
| 発見元       | Phase 12（unassigned-task-detection / AC-7） |
| 発見日       | 2026-04-28 |

## Problem

03a AC-7 requires lint-level detection for direct stableKey literals in application code. Current implementation avoids literals by convention and tests, but there is no CI/static rule that rejects future drift.

## Canonical Status (2026-05-01)

This legacy unassigned task has been consumed by `docs/30-workflows/03a-stablekey-literal-lint-enforcement/`.

Current state is `enforced_dry_run`: `scripts/lint-stablekey-literal.mjs`, focused unit tests, `package.json` scripts, and Phase 11 warning/strict-mode evidence exist. It is not `fully enforced` because strict mode still reports legacy violations and GitHub Actions does not yet run the strict gate as required.

Continuation tasks:

- `docs/30-workflows/unassigned-task/task-03a-stablekey-literal-legacy-cleanup-001.md`
- `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md`

## Required Work

- Define the allowed stableKey source modules, including `packages/shared/src/zod/field.ts` and `packages/integrations/google/src/forms/mapper.ts`.
- Add a lint or static check that rejects hard-coded stableKey values outside allowed modules and fixtures.
- Document the exception policy for tests and migration seed data.

## Acceptance Criteria

- CI fails when a stableKey string literal is added to disallowed app code.
- Existing 03a implementation passes without suppressions.
- AC-7 can be marked fully enforced rather than convention-only.

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

不変条件 #1「stableKey 直書き禁止」は 03a AC-7 として明示されているが、現状は規約とユニットテストでの間接的担保にとどまり、新規 PR で違反コードが入るリスクがある。

### 1.2 問題点・課題

- 静的に検出できないため、レビュー漏れで drift が発生する余地がある。
- `packages/shared/src/zod/field.ts` 等の正本以外でリテラルが使われても CI で気づけない。

### 1.3 放置した場合の影響

- stableKey の二重定義 → schema sync 時の差分誤検知。
- 不変条件違反が積み上がり、03a/03b の sync 結果に乖離。

## 2. 何を達成するか（What）

### 2.1 目的

stableKey 文字列リテラルが許可モジュール外に現れた場合に CI を fail させる lint ルールを導入する。

### 2.2 最終ゴール

`packages/shared/src/zod/field.ts` および `packages/integrations/google/src/forms/mapper.ts` 等の正本のみを allow-list とし、それ以外でのリテラル出現を CI で検出可能。

### 2.3 スコープ

- 含む: ESLint custom rule または ts-morph 静的チェックの追加、allow-list 設定、例外（test/fixture/seed）ポリシー文書化
- 含まない: ランタイム検証、03b 側の追加対応（同等ルールが共通基盤化される場合は 03b も自動適用）

### 2.4 成果物

- ESLint custom rule または scripts ベースの静的検査
- allow-list 設定ファイル
- 例外ポリシードキュメント

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03a 完了済み（本タスクで合意済み）
- stableKey 正本モジュール一覧の確定

### 3.2 依存タスク

- wave 8b lint config

### 3.3 必要な知識

- ESLint custom rule（`@typescript-eslint/utils` AST）
- monorepo lint 設定の伝播

### 3.4 推奨アプローチ

ESLint custom rule で `Literal` ノードが既知 stableKey パターン（例: `/^[a-z][a-z0-9_]+$/` の特定 prefix）に一致する場合、ファイルパスが allow-list 外なら error 報告。test/fixture は override で許可。

## 4. 実行手順

1. stableKey 正本モジュールを allow-list として確定。
2. ESLint custom rule（または scripts/check-stablekey-literals.ts）を実装。
3. `apps/*` `packages/*` のうち allow-list 外で違反が無いことを確認。
4. CI ワークフローに組み込み。
5. 例外ポリシーを doc に追記。

## 5. 完了条件チェックリスト

- [ ] CI で違反 PR が fail する
- [ ] 既存 03a 実装が suppression 無しで PASS
- [ ] AC-7 を「規約のみ」から「lint enforced」へ更新
- [ ] 例外ポリシー（tests / fixtures / seed）が明文化

## 6. 検証方法

- 故意に違反コードを入れた dry-run PR で CI が fail することを確認
- 既存 03a コードベースで lint が clean

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| 誤検知（false positive） | 中 | 中 | 正本モジュール allow-list と test override を整備 |
| 既存 fixture が大量 hit | 低 | 中 | fixtures ディレクトリは override で除外 |

## 8. 参照情報

- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md`（Part 2 禁止事項 / AC-7）
- 不変条件 #1（CLAUDE.md / specs）

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 03a 実装中、AC-7 を「規約 + ユニットテスト」で担保するに留まり、静的に enforce する手段が用意できなかった。 |
| 原因 | monorepo の ESLint custom rule 基盤が wave 8b 待ちで、03a スコープに lint インフラ整備を含めるとスコープ膨張する。 |
| 対応 | 規約 + テストで暫定担保し、本未タスクとして wave 8b に引き継ぎ。 |
| 再発防止 | 不変条件を AC に落とす際は「静的検査の owner」を Phase 1 で同時に決め、欠如時は未タスクを即時起票する。 |

### 補足事項

- 元 detection 行: `unassigned-task-detection.md` 表「ESLint custom rule（stableKey 直書き禁止の静的検証）」。
