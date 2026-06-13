# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 9 / 13 |
| taskType | implementation |
| implementation_mode | edit |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T01〜T04（観測性成果統合 / `getAuthEnv` field-tolerant 化 / transport 多段フォールバック chain / 診断スクリプト拡張）の実装が AC-8（`mise exec -- pnpm typecheck` / `pnpm lint` / 対象 focused vitest 全 PASS）・AC-6（`bash -n` PASS・read-only・冪等）・AC-7（apps/api 非接触・`/me` 契約不変）・不変条件（localhost 焼き込み禁止）を満たすことを保証するため、実行コマンド・期待 exit code・grep ゲートを層ごとに固定する。**本サイクルは `implemented_local_runtime_pending`（local 実装・focused 検証済み）のため、本 Phase の各コマンドは「local 実装で PASS させた品質ゲート」として確定し、実行済みの focused gate と未実行の full gate を分離して記録する。**

## 実行タスク

### 9.1 品質保証 層（SSOT §8 検証コマンド一式）

| 層 | コマンド | 期待 exit | AC 紐付け | 実行タイミング |
|----|---------|-----------|-----------|----------------|
| L-0a 仕様書構造検証 | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery` | 0 | （仕様書ゲート） | 仕様書サイクル |
| L-0b 全仕様検証 | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery` | 0 | （仕様書ゲート） | 仕様書サイクル |
| L-0c phase12 compliance | `mise exec -- pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery` | 0（ok:true） | （仕様書ゲート） | 仕様書サイクル |
| L-0d gate metadata | `mise exec -- pnpm gate-metadata:validate` | 0（当該 ERROR 0） | （仕様書ゲート） | 仕様書サイクル |
| L-1 typecheck | `pnpm typecheck` | 0 | AC-8 | PASS |
| L-2 lint | `pnpm lint` | 0 | AC-8 | PASS |
| L-3 focused vitest 一括 | §9.2 の focused subset | 0 | AC-2/3/4/5/8 | PASS（5 files / 72 tests・2026-06-12 再検証） |
| L-4 シェル構文 | `bash -n scripts/diagnose-profile-session.sh` | 0 | AC-6 | PASS |
| L-5 復旧検証（user-gated） | `bash scripts/diagnose-profile-session.sh` | 0 | AC-9 | pending（deploy 後・user-gated） |

### 9.2 対象 focused vitest 一括実行

SSOT §8 のコマンドを逐語で正とする（`apps/web` package 内から `--root=../..` 形式で実行する。include glob が monorepo root 基準のため、直 path 指定では "No test files found" になる既知の罠）。

```bash
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
```

期待: exit 0。対象 5 spec の内訳と AC 対応:

| spec | 検証対象 | AC |
|------|----------|----|
| `env.spec.ts` | T02 field-tolerant（不正 field のみ drop / dropped key 名のみ warn / 値非出力） | AC-2 |
| `transport.spec.ts` | T03 chain 構成（service-binding → INTERNAL → NEXT_PUBLIC）・fail-closed・`ApiTransportError` | AC-3 / AC-4 |
| `authed.spec.ts` | T03 fallback 成功 / HTTP エラー Response 非 fallback / GET・HEAD 限定 / `api_transport_fallback` warn | AC-3 / AC-5 |
| `safe-fetch.spec.ts` | T01 統合の transport descriptor ログ（`server_fetch_failed {transportKind, baseHost}`）回帰 | AC-1 |
| `page.spec.tsx` | `/profile` 分岐・文言不変の回帰（401 redirect / 404 CTA / 410・5xx・FAILED バナー） | AC-7 |

新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` は lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）。

### 9.3 grep ゲート（不変条件の機械検証）

| ID | 検査 | コマンド | 期待 |
|----|------|----------|------|
| G-1 | **apps/api 非接触**（AC-7 の中核） | `git diff dev --name-only \| grep '^apps/api/'` | **空出力**（exit 1 = ヒット 0 件） |
| G-2 | **localhost 焼き込み禁止** | `grep -rn '127.0.0.1:8888' apps/web/src` | **空出力**（ヒット 0 件） |
| G-3 | localhost fallback コメント規約 | `grep -n 'localhost-allow:local-fallback' apps/web/src/lib/fetch/transport.ts` | 1 件以上（`LOCAL_API_FALLBACK_BASE_URL` に規約コメント維持） |
| G-4 | `process.env` 直接参照禁止 | T02/T03 の変更ファイルで `process.env` 直接参照が増えていない（env アクセサ経由のみ） | 違反 0 |
| G-5 | PII 非出力 | 新ログ 2 イベント（`auth_env_field_dropped` / `api_transport_fallback`）の出力 key に memberId・cookie・secret 値が無い（spec で固定） | 違反 0 |

> G-1 は SSOT §3 不変条件（D1 直接アクセスは `apps/api` に閉じる・本 WF は `apps/api` 非接触）の機械検証。本 wave で diff が出た場合は直ちに revert する（AC-7 違反・スコープ外は `unassigned-task/task-api-worker-hard-error-root-fix.md` が受け皿）。

### 9.4 静的検査（設計不変点）

| ID | 検査 | 期待 |
|----|------|------|
| Q-1 | `/me` の path・レスポンス shape・status 体系（401/404/410/5xx）が diff に無い | 変更 0 |
| Q-2 | `/profile` page.tsx のエラー分岐・`session-error-display.ts` 文言・`SectionError` が無変更（回帰テストのみ追加） | 変更 0 |
| Q-3 | fallback chain が HTTP エラー Response で fallback しない（`AuthRequiredError` 挙動不変）ことが spec で固定されている | spec 固定済 |
| Q-4 | 非冪等 method（POST 等）で fallback しないことが spec で固定されている | spec 固定済 |
| Q-5 | `wrangler` 直叩きが無い（`bash scripts/cf.sh` 経由のみ・T04 / Phase 11 手順） | 違反 0 |

### 9.5 自動修復方針（失敗時）

- L-1 typecheck fail → unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正し再実行。
- L-2 lint fail → `mise exec -- pnpm lint --fix` を先に試し、残違反のみ手修正。
- L-3 vitest fail → Phase 8 の rollback 方針（chain と単発 resolve の境界）に従い該当 spec を切り分け、実装側を修正（テスト期待値は AC を正本とし安易に緩めない）。
- G-1（apps/api diff）違反 → 直ちに該当変更を revert（CONST_007 例外①により S3 確定前の apps/api 接触は禁止）。
- 最大 3 回まで自動修復を試み、修復差分はタスク単位でコミットする（commit は user-gated）。

## 完了条件

- [x] SSOT §8 の検証コマンド一式（L-0a〜L-5）と期待 exit を層ごとに固定
- [x] focused vitest 一括コマンド（5 spec・`--root=../..` 形式）と AC 対応を確定
- [x] grep ゲート G-1（apps/api 非接触: `git diff dev --name-only | grep '^apps/api/'` 空）/ G-2（`127.0.0.1:8888` が apps/web/src に無い）を明示
- [x] 静的検査 Q-1〜Q-5 と自動修復方針（最大 3 回）を明示
- [x] `implemented_local_runtime_pending` のため「focused 実行済み・full gate と runtime は境界分離」と明記

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape（Q-1 / AC-7 検査基準） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界・fail-closed（Q-3 の期待根拠） |

- `_shared-context.md` §8（検証コマンド・本 Phase の正本）/ §3（不変条件）
- `outputs/phase-6/phase-6.md`（テストケース）
- `outputs/phase-7/phase-7.md`（カバレッジ対象）
- `outputs/phase-8/phase-8.md`（rollback / chain と単発 resolve の重複排除）

## 統合テスト連携

L-1〜L-4 全 PASS と G-1〜G-5 / Q-1〜Q-5 違反 0（特に G-1 apps/api diff 空・G-2 localhost 焼き込み 0）を Phase 10 の AC-1〜AC-9 充足判定へ引き継ぐ。L-5（復旧検証）は Phase 11 の RT-A〜RT-D（user-gated）として実施する。
