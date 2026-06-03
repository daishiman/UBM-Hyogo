# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

T01〜T03 の実装が AC-8（typecheck / lint / 対象 vitest 全 PASS）を満たすことを保証するため、実行コマンドと期待 exit code を層ごとに固定する。vitest はルートからではなく `--filter` で対象 workspace を指定し、本サイクルで触れる spec ファイルに限定実行する。

## 実行タスク

### 9.1 品質保証 層

| 層 | コマンド | 期待 exit | AC 紐付け |
|----|---------|-----------|-----------|
| L-1 typecheck | `mise exec -- pnpm typecheck` | 0 | AC-8 |
| L-2 lint | `mise exec -- pnpm lint` | 0 | AC-8 |
| L-3a vitest (api unit) | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/middleware/__tests__/trailing-slash.spec.ts` | 0（TS-1〜TS-6 PASS） | AC-4 |
| L-3b vitest (api 統合) | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/__tests__/me-route-mount.integration.spec.ts` | 0（MM-1〜MM-5 PASS） | AC-5 |
| L-3c vitest (web proxy) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/api/me/[...path]/route.route.spec.ts"` | 0（PX-1〜PX-5 PASS） | AC-6 |
| L-3d vitest (web page) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/(member)/profile/page.spec.tsx"` | 0（PF-1〜PF-4 PASS） | AC-1 / AC-2 / AC-3 |
| L-3e vitest (web SectionError) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/member/__tests__/SectionError.spec.tsx` | 0（SE-1〜SE-4 PASS） | AC-1 |

### 9.2 対象 vitest 一括実行

各 workspace 内でまとめて流す場合のコマンド（CI 個別検証と等価）:

```bash
# api（T01）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/middleware/__tests__/trailing-slash.spec.ts \
  src/__tests__/me-route-mount.integration.spec.ts

# web（T02 / T03）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "app/api/me/[...path]/route.route.spec.ts" \
  "app/(member)/profile/page.spec.tsx" \
  src/components/member/__tests__/SectionError.spec.tsx
```

期待: 両コマンドとも exit 0。`*.test.*` 形式の新規ファイルが存在しないこと（lefthook `block-test-suffix` / CI `verify-test-suffix` PASS）。

### 9.3 トークン / 不変条件 静的検査

| ID | 検査 | 期待 |
|----|------|------|
| Q-1 | T03 UI 変更に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が無い（`verify-design-tokens` 相当） | 検出 0 |
| Q-2 | `apps/web` の env 参照が `process.env` 直接でなくアクセサ経由（proxy / page の追加コード） | 違反 0 |
| Q-3 | `apps/web` から D1 binding 直接アクセスが無い | 違反 0 |
| Q-4 | `/me` の path / レスポンス shape / D1 schema / Google Form 仕様の変更が diff に無い（AC-7） | 変更 0 |

### 9.4 自動修復方針（失敗時）

- L-1 typecheck fail → unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正し再実行。
- L-2 lint fail → `mise exec -- pnpm lint --fix` を先に試し、残違反のみ手修正。
- L-3 vitest fail → Phase 8 の E-1〜E-10 に従い該当 spec を切り分け、実装側を修正（テスト期待値は AC を正本とし安易に緩めない）。
- 最大 3 回まで自動修復を試み、修復差分はタスク単位でコミットする。

## 完了条件

- [x] L-1 / L-2 / L-3a〜L-3e のコマンドと期待 exit を固定
- [x] 対象 vitest 一括実行コマンドを api / web 別に確定
- [x] トークン / 不変条件の静的検査（Q-1〜Q-4）を列挙
- [x] 失敗時の自動修復方針（最大 3 回）を明示

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape（Q-4 / AC-7 検査基準） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（L-3d の期待根拠） |

- `outputs/phase-6/phase-6.md`（テストケース）
- `outputs/phase-7/phase-7.md`（カバレッジ対象）
- `outputs/phase-8/phase-8.md`（自動修復の E-1〜E-10）

## 統合テスト連携

L-3b（MM-1〜MM-5）が AC-5 の統合テスト正本。L-1〜L-3 全 PASS と Q-1〜Q-4 違反 0 を Phase 10 の AC-8 充足判定へ引き継ぐ。
