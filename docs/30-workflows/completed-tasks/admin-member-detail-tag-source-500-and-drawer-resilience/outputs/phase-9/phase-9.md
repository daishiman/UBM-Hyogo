# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

Lane A / Lane B の実装が type / lint / focused test / UI token guard を満たすことを保証するため、実行コマンドと実測 exit code を層ごとに記録する。vitest は実際に通した config / file path を正本とし、root config で除外される API repository spec は D1 config で実行する。full lint と UI 変更に対する `verify:no-inline-style`、shared/api/web typecheck は完了済み。

## 実行タスク

### 9.1 品質保証 層

| 層 | コマンド | 実測 exit | AC 紐付け |
|----|---------|-----------|-----------|
| L-1a typecheck (shared) | `pnpm --filter @ubm-hyogo/shared typecheck` | 0 | AC-2 / AC-3 / AC-7 |
| L-1b typecheck (api) | `pnpm --filter @ubm-hyogo/api typecheck` | 0 | AC-1 / AC-4 |
| L-1c typecheck (web) | `pnpm --filter @ubm-hyogo/web typecheck` | 0 | AC-5 |
| L-2 lint | `pnpm lint` | 0 | AC-7 |
| L-2b UI token guard | `pnpm verify:no-inline-style` | 0 | AC-7 |
| L-3a vitest (shared zod + type contract) | `pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts` | 0（2 files / 30 tests PASS） | AC-2 / AC-3 |
| L-3b vitest (api builder 回帰) | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts` | 0（1 file / 35 tests PASS） | AC-1 / AC-4 |
| L-3c vitest (web drawer 回復) | `pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 0（1 file / 5 tests PASS） | AC-5 |
| L-4 Phase 12 compliance | `pnpm verify:phase12-compliance` | 0（status=pass。対象 root は script 検出範囲の `profile-reload-session-404-fix`） | skill gate 補助 |

> **vitest 実行注意（repo root 由来）**: web/api/shared の vitest config は repo root を root とするため、ファイル指定時はフルパス指定 + 必要に応じ `--root` を付ける。web は `cd apps/web && vitest run src/... --root ../..` の前例に従う（でないと `No test files` で exit 1 になる）。shared / api も `--filter` で対象 workspace を指定したうえで repo root 相対のフルパスを渡す。

### 9.2 対象 vitest 一括実行

本実装サイクルで実走した focused command:

```bash
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts
pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts
pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
pnpm --filter @ubm-hyogo/shared typecheck
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/web typecheck
pnpm lint
pnpm verify:no-inline-style
pnpm verify:phase12-compliance
```

結果: 各コマンドとも exit 0。API repository spec は root config では対象外のため D1 config を正とする。

### 9.3 命名 / トークン / 不変条件 静的検査

| ID | 検査 | 期待 |
|----|------|------|
| Q-1 | Lane B の retry UI に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が無い（`verify-design-tokens` 相当） | 検出 0 |
| Q-2 | 既存 `*.spec.{ts,tsx}` へ追記し、新規 `*.test.*` を追加していない（lefthook `block-test-suffix` / CI `verify-test-suffix` 相当） | 違反 0 |
| Q-3 | `apps/web` から D1 binding 直接アクセスが無い（Lane B は既存 fetch 踏襲・mutation 非該当） | 違反 0 |
| Q-4 | `TagSource` union（3 値）が拡張されていない・endpoint surface / response shape / D1 schema / migration / seed / Form の変更が diff に無い（AC-6 / AC-7） | 変更 0 |
| Q-5 | ファイル削除・stub 化が無い（本サイクルは全て編集 + 新規追加のみ） | 削除 0 / stub 0 |

### 9.4 自動修復方針（失敗時）

- L-1 typecheck fail → unused import / null 許容 / 型注釈漏れ（`normalizeTagSource` 戻り値型）/ export-import 不整合を最小差分で修正し再実行。
- L-2 lint fail → `pnpm lint --fix` を先に試し、残違反のみ手修正。
- L-3 vitest fail → Phase 8 の E-1〜E-10 に従い該当 spec を切り分け、実装側を修正（テスト期待値は AC を正本とし安易に緩めない）。
- 最大 3 回まで自動修復を試み、修復差分は Lane 単位でコミットする。

## 完了条件

- [x] L-1a〜L-1c（shared/api/web typecheck）/ L-2（lint + UI token guard）/ L-3a〜L-3c（対象 vitest）のコマンドと実測 exit を記録
- [x] vitest の repo root 由来注意（フルパス + `--root`）を明記
- [x] 対象 vitest 実行コマンドを shared / api / web 別に確定
- [x] 命名（`*.spec.*`）/ トークン（HEX 0）/ 不変条件 / ファイル削除なしの静的検査（Q-1〜Q-5）を列挙
- [x] 失敗時の自動修復方針（最大 3 回）を明示
- [x] 実測 exit 値は本実装サイクルで取得済み（staging runtime screenshot は user-gated として Phase 11/13 に分離）

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | response shape / status（Q-4 / AC-6 検査基準） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` ドロワー（L-3c の文脈） |
| 設計トークン | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` | HEX 0（Q-1 検査基準） |

- `outputs/phase-7/phase-7.md`（カバレッジ対象ブロック）
- `outputs/phase-8/phase-8.md`（自動修復の E-1〜E-10）
- `_shared-context.md §4`（テストファイル一覧・vitest 実行注意）

## 統合テスト連携

L-3b（BD-1/BD-2）が seed source による 500 回帰の検知正本。L-1〜L-3 全 PASS と Q-1〜Q-5 違反 0 を Phase 10 の AC 充足判定へ引き継ぐ。
