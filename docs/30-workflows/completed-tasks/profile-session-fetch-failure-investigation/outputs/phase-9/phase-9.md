# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | VISUAL |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

T01〜T03（`/profile` エラー分岐の区別表示 / `/me` 失敗時の構造化ログ / 診断スクリプト）の実装が AC-7（`mise exec -- pnpm typecheck` / `pnpm lint` / 対象 vitest 全 PASS）と AC-6（`/me` 契約・D1 schema・Google Form 仕様不変 = **apps/api 非接触**）を満たすことを保証するため、実行コマンドと期待 exit code を層ごとに固定する。本サイクルは `implemented_local_evidence_captured` のため、各コマンドは「実装時に PASS させるべき品質ゲート」として確定し、実行は user-gated とする。vitest はルートからではなく対象 spec に限定実行する。

## 実行タスク

### 9.1 品質保証 層

| 層 | コマンド | 期待 exit | AC 紐付け |
|----|---------|-----------|-----------|
| L-1 typecheck | `mise exec -- pnpm typecheck` | 0 | AC-7 |
| L-2 lint | `mise exec -- pnpm lint` | 0 | AC-7 |
| L-3a vitest (web profile page) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/(member)/profile/page.spec.tsx"` | 0（PF-1〜PF-5 PASS） | AC-3 |
| L-3b vitest (web safe-fetch ログ) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/server-fetch/safe-fetch.spec.ts` | 0（SF-1〜SF-4 PASS） | AC-4 |
| L-3c vitest (web SectionError) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/member/__tests__/SectionError.spec.tsx` | 0（SE-1〜SE-4 PASS） | AC-3 |

### 9.2 対象 vitest 一括実行

web workspace 内でまとめて流す場合のコマンド（CI 個別検証と等価）:

```bash
# web（T01 / T02）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "app/(member)/profile/page.spec.tsx" \
  src/lib/server-fetch/safe-fetch.spec.ts \
  src/components/member/__tests__/SectionError.spec.tsx
```

期待: exit 0。`*.test.*` 形式の新規ファイルが存在しないこと（lefthook `block-test-suffix` / CI `verify-test-suffix` PASS）。T03（診断スクリプト）は read-only シェルスクリプトのため vitest 対象外で、後続 Phase 11 の手動テストで挙動確認する。

### 9.3 トークン / 不変条件 静的検査

| ID | 検査 | 期待 |
|----|------|------|
| Q-1 | T01 の `/profile` エラー分岐 UI 変更に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が無い（`verify-design-tokens` 相当）。`data-*` 属性による原因コード可視化は class に色を持ち込まない | 検出 0 / HEX 0 |
| Q-2 | `apps/web` の env 参照が `process.env` 直接でなく `getEnv()` / `getAuthEnv()` 等アクセサ経由（safe-fetch ログ追加分 / 診断スクリプト連携） | 違反 0 |
| Q-3 | `apps/web` から D1 binding 直接アクセスが無い（不変条件 #5）。調査の D1 参照は `bash scripts/cf.sh d1` 経由 read-only に閉じる | 違反 0 |
| Q-4 | **apps/api 非接触**: `/me` の path・レスポンス shape・status 体系（401/410/5xx）、`apps/api/src/**`、D1 schema、Google Form 仕様の変更が diff に無い（AC-6）。`git diff --name-only dev...HEAD -- apps/api` が空 | 変更 0（diff 空） |
| Q-5 | T02 のログに memberId 等の個人情報が出ない（不変条件 #11）。出力は `status`/`code`/`path` のみ。技術文字列をユーザー画面へ露出しない | 違反 0 |

### 9.4 apps/api 非接触確認（AC-6 の中核）

本タスクは観測性向上のみで API surface を一切変更しない。実装時に以下を確認する。

```bash
# apps/api に diff が無いこと（空出力を期待）
git diff --name-only dev...HEAD -- apps/api
# D1 migrations に diff が無いこと（空出力を期待）
git diff --name-only dev...HEAD -- "apps/api/migrations" "packages/**/migrations"
```

- `apps/api/src/routes/me/index.ts` / `apps/api/src/middleware/session-guard.ts` / `apps/api/src/middleware/me-session-resolver.ts` は **read-only 調査対象**であり編集しない。
- 実装の変更面は `apps/web`（T01/T02）と `scripts/`（T03）に閉じる。
- これにより `/me` の status 体系（401 redirect / 410 / 5xx）は不変で、web 側は表示と観測のみを所有する（fail-closed 維持）。

### 9.5 自動修復方針（失敗時）

- L-1 typecheck fail → unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正し再実行。
- L-2 lint fail → `mise exec -- pnpm lint --fix` を先に試し、残違反のみ手修正。
- L-3 vitest fail → Phase 8 の rollback / マッピング純関数の境界に従い該当 spec を切り分け、実装側を修正（テスト期待値は AC を正本とし安易に緩めない）。
- Q-4（apps/api diff）違反検出 → 直ちに該当変更を revert。API surface 変更は本タスクのスコープ外（CONST_007 で未タスク化済み）。
- 最大 3 回まで自動修復を試み、修復差分はタスク単位でコミットする（commit は user-gated）。

## 完了条件

- [x] L-1 / L-2 / L-3a〜L-3c のコマンドと期待 exit を固定
- [x] 対象 vitest 一括実行コマンドを web 別に確定
- [x] トークン / 不変条件の静的検査（Q-1〜Q-5）を列挙
- [x] **apps/api 非接触確認**（Q-4 + §9.4 diff 空想定）を明示
- [x] 失敗時の自動修復方針（最大 3 回）を明示

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape（Q-4 / AC-6 検査基準） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（L-3a の期待根拠） |

- `_shared-context.md` §8（検証コマンド）
- `outputs/phase-6/phase-6.md`（テストケース）
- `outputs/phase-7/phase-7.md`（カバレッジ対象）
- `outputs/phase-8/phase-8.md`（rollback / マッピング純関数）

## 統合テスト連携

L-3a〜L-3c 全 PASS と Q-1〜Q-5 違反 0（特に Q-4 apps/api diff 空）を Phase 10 の AC-6 / AC-7 充足判定へ引き継ぐ。
