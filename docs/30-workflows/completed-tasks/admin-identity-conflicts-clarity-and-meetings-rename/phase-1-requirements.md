# Phase 1 — 要件定義

## 目的

`/admin/identity-conflicts`（会員の重複確認）と管理サイドバーを非エンジニア向けに整え、重複候補の操作を staging で体験できる仮データを用意するための、scope・受入条件・既存命名規則・inventory を固定する。

## タスク分類

- **UI task（VISUAL）**: concern 1（サイドバー命名）/ 2（UI/UX）/ 3（用語平易化）。
- **NON_VISUAL task**: concern 4（staging seed）。
- 全体として VISUAL task として扱い、Phase 11 で screenshot 計画を持つ（implemented_local_evidence_captured のため実体は pending_implementation）。

## 背景・真因

- 真因1（concern 1）: サイドバー `shell-config.ts:86` の label が `開催日` 固定。ページ実態は「開催日登録＋出席者の確認・入力」（タイトル `開催日 / 出席管理`）であり、ナビ名が機能を表していない。
- 真因2（concern 2/3）: `/admin/identity-conflicts` は英語・技術用語が大量に露出（`Identity`, `merge`, `source`, `target`, `email`, `matched`, `name`, `affiliation`, `conflict`, `canonical 解決テーブル`, `PII`, `redaction`）。非エンジニア管理者には「何ができる画面か」が伝わらない。
- 真因3（concern 4）: 重複候補が 0 件（実データに重複なし）のため、管理者が操作（統合 / 別人として確定）を体験できない。検出条件に合う仮データが無い。

> 詳細な決定事項・文言マッピング・seed 仕様は [shared-context.md](./shared-context.md) を正本とする。

## 既存命名規則の確認（FB-01 / FB-SDK-07-4）

- サイドバー nav 項目: `ShellNavItem { id, href, label, icon }`（`shell-config.ts`）。`id`/`href`/`icon` は kebab/lower の安定キー、`label` のみ表示文言。→ **label のみ変更、id/href/icon は不変**。
- admin component: `apps/web/src/components/admin/` は PascalCase コンポーネント。glossary は `xxxGlossary.ts`（先行: `dashboardGlossary.ts` / `tagManagementGlossary.ts`）に倣う → `identityConflictGlossary.ts`。
- guide component: 先行 `TagManagementGuide.tsx` に倣い `IdentityConflictGuide.tsx`。
- seed: `apps/api/src/testing/<dataset>/{catalog,build-seed-sql}.ts` + `scripts/gen-<dataset>-seed.mjs` + `scripts/seed-<dataset>.sh` + `apps/api/migrations/seed/<dataset>-*.sql` + contract spec（先行: `test-accounts`）。

## P50 前提確認

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | No（implemented_local_evidence_captured。実装は後続 03.実装.md） |
| upstream にマージ済みか | No |
| 前提タスク完了済みか | 依存なし（origin/dev 同期済・main より 700 先行） |
| implementation_mode | `new`（RED/GREEN で新規実装） |

## 受入条件（Acceptance Criteria）

- AC-1: サイドバーの `開催日` が `開催・出席管理` に変わり、`id="meeting"`/`href="/admin/meetings"`/`icon="meeting"` は不変。`shell-config.spec.ts` のラベルアサートが更新され緑。
- AC-2: サイドバーの `Identity重複` が `会員の重複確認` に変わり、`id="identity"`/`href`/`icon` は不変。
- AC-3: `/admin/identity-conflicts` の eyebrow/title/description/empty/card/breadcrumb/aria-label が [shared-context §5.2](./shared-context.md) の日本語へ置換。
- AC-4: `IdentityConflictRow` の英語・技術用語（merge/source/target/email/matched/name/affiliation/canonical/PII/redaction/conflict）が [§5.3](./shared-context.md) の平易日本語へ置換。`matchedFields` は glossary 経由で `氏名`/`職業` 表示。
- AC-5: ページ冒頭に `IdentityConflictGuide`（このページで何ができるかを 3 点で平易説明）が表示される。
- AC-6: `identityConflictGlossary.ts`（`matchedFieldLabel` は未登録値を原文 fallback・throw しない）が新設され単体テスト緑。
- AC-7: アナウンス文言が [§5.6](./shared-context.md) の日本語へ更新（aria-live 機能は維持）。
- AC-8: **API 非変更**: `apps/api/src/routes/admin/identity-conflicts.ts`・`packages/shared` の identity-conflict 型・レスポンス shape は無変更。`git diff -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared` が空（concern 4 の `apps/api/src/testing` と `migrations/seed` を除く）。
- AC-9: concern 4 seed: `gen-identity-conflict-seed.mjs` 実行で `identity-conflict-staging-seed.sql` / `identity-conflict-cleanup.sql` が生成され、contract test（drift 0 / idempotent / 行数）が緑。
- AC-10: seed 適用後の `/admin/identity-conflicts` で**ちょうど 5 組**の重複候補が表示される（既存 TEST-MEM-01..10 と非衝突）。各組が異なるパターン（完全一致 / NFKC / trim / 別ゾーン / 同姓同名）。
- AC-11: `seed-identity-conflicts.sh` は local/staging 限定（production ガードあり）。既存 TEST-MEM-01..10 を巻き込まず cleanup できる。
- AC-12: 色は `var(--ubm-color-*)` のみ（`verify:tokens` 緑）。HEX/任意色直書きなし。
- AC-13: `pnpm typecheck` / `pnpm lint` 緑。focused vitest（shell-config / IdentityConflictRow / Guide / glossary / seed contract）緑。

## inventory（現状ファイル）

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/shell/shell-config.ts` | サイドバー nav SSOT（L86 meeting, L91 identity） |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | nav テスト（11 項目アサート） |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 重複候補ページ本体 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 候補行（merge/dismiss UX） |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | aria-live 文言 |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | aria-live container（変更なし） |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 検出 pure function（参照のみ・不変） |
| `apps/api/src/repository/identity-conflict.ts` | 候補一覧/dismiss（参照のみ・不変） |
| `apps/api/src/testing/test-accounts/{catalog,build-seed-sql}.ts` | 既存 seed（参照テンプレ・不変） |
| `scripts/seed-test-accounts.sh` | 既存 seed wrapper（参照テンプレ・不変） |

## targeted test ファイル（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` は重いため、focused 指定（ルートからフルパス）を [shared-context §8](./shared-context.md) に列挙済。

## 統合テスト連携

- focused vitest: shell-config / IdentityConflictRow / IdentityConflictGuide / identityConflictGlossary / identity-conflict-seed.contract を `--root=. --config=vitest.config.ts apps/...` で実行。
- seed の機能検証: local D1 へ apply → `listIdentityConflicts` 相当の repository query または手動 `wrangler d1 execute` で候補 5 件を確認（Phase 11 で手順化）。
- jsdom は CSS 非評価のため、視覚（色・余白）は構造/文言 contract で検証し、最終視覚は staging screenshot（user-gated）。

## 完了条件

- [ ] scope / AC-1〜13 / inventory / 命名規則を固定した。
- [ ] 文言マッピング・seed 仕様を shared-context.md に集約した。
- [ ] implementation_mode = new を記録した。
