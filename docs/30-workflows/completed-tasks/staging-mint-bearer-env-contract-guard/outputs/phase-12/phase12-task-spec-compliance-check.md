# Phase 12 Task Spec Compliance Check — staging-mint-bearer-env-contract-guard

## Summary verdict

`implemented_local_evidence_captured`。TASK-STAGING-MINT-BEARER-ENV-CONTRACT-GUARD-001「staging runtime smoke の mint env 契約 drift 再発防止」を、Phase 1-13 実装仕様書から実コードへ同一サイクルで反映した。4 対策（A: mint script の role-scoping / B: 新規 `verify-mint-env-contract` 静的 drift gate / C: `provision-staging-secrets.sh` の JWT-mint secret 集合への整合 / D: staging 限定 degrade）は実装済み。focused Vitest 27 tests PASS、`verify-mint-env-contract` PASS、`bash -n` / shellcheck PASS、actionlint PASS。staging deploy・実 secret 投入・commit/push/PR・required status check 登録のみ user-gated。

## Changed-files classification

| 分類 | パス | 状態 |
| --- | --- | --- |
| spec（新規） | `docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/**` | 本サイクルで作成（index.md / phase-1..13 / phase-12 strict 7 / artifacts.json） |
| 実装（編集） | `scripts/smoke/mint-staging-bearers.mts` | 実装済み（role-scoping / degrade /後方互換） |
| 実装（新規） | `scripts/smoke/verify-mint-env-contract.mts` | 実装済み |
| 実装（編集） | `.github/workflows/runtime-smoke-staging.yml` | 実装済み（bulk admin-only `--roles admin` / degrade marker skip） |
| 実装（新規） | `.github/workflows/verify-mint-env-contract.yml` | 実装済み |
| 実装（編集） | `scripts/smoke/provision-staging-secrets.sh` | 実装済み（JWT-mint secret 集合） |
| 実装（編集） | `scripts/smoke/README.md` | 実装済み |
| test（編集） | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 実装済み（18 tests PASS） |
| test（新規） | `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | 実装済み（8 tests PASS） |

> 本タスクは実装区分=実装仕様書だが、CONST_004/005 に従い実コードまで同一サイクルで反映済み。`apps/*` のランタイムコードは変更していない。

## `workflow_state` and phase status consistency

- `artifacts.json.status` = `implemented_local_evidence_captured`。`metadata.workflow_state` = `implemented_local_evidence_captured`。両者一致。
- Phase 1-12 status = `completed`（仕様書作成完了）、Phase 13 = `pending_user_approval`。
- Gate-A = `passed`（spec creation）、Gate-B = `passed`（実装 + focused test + actionlint）、Gate-C = `pending`（commit/push/PR = user-gated）。
- staging runtime PASS は主張しない。runtime deploy / real secret / real D1 mutation は user-gated。

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| screenshot evidence（NON_VISUAL） | outputs/phase-11/manual-test-result.md | n/a |
| 手動テスト証跡メタ（NON_VISUAL 主証跡） | outputs/phase-11/manual-test-result.md | present |
| Phase 11 ledger | outputs/phase-11/phase-11.md | present |
| 最終レビュー（AC 判定・代替証跡） | outputs/phase-10/phase-10.md | present |
| mint role-scope 自動テスト log（vitest） | outputs/phase-11/evidence/mint-role-scope-test.log | present |
| drift gate actionlint log | outputs/phase-11/evidence/verify-mint-env-contract-actionlint.log | present |

> NON_VISUAL（CI workflow / Node script / shell）のため screenshot / axe は対象外。代替証跡（自動テスト log / actionlint log / 手動テスト証跡メタ / Phase 11 ledger）は `present`。

## Phase 12 strict 7 file inventory

| # | ファイル | 存在 | 本文量 / key sections |
| - | -------- | ---- | --------------------- |
| 1 | main.md | あり | タスク要約 / 成果物 / 実装対象（実装済み）/ 状態 |
| 2 | implementation-guide.md | あり | Part 1（例え話の背景 / 対策 4 点 / 変更ファイル / 実行コマンド / 既知制限）+ Part 2（型・シグネチャ・main フロー・使用例・workflow 差分・provision 整合・設定値一覧・エラー処理 / 視覚証跡）。各 Part 実体付き・heading-only でない |
| 3 | system-spec-update-summary.md | あり | Step 1-A（完了記録）/ 1-B（implemented local 実装状況）/ 1-C（関連タスク）/ Step 2 = N/A（理由明記） |
| 4 | documentation-changelog.md | あり | 全 Step 結果 / 作成ファイル / validator / current vs baseline / 変更理由 |
| 5 | unassigned-task-detection.md | あり | current（M-1 gating）/ baseline（M-2/M-3/M-4 + 既存 issue #916）分離 / 関連タスク差分確認 |
| 6 | skill-feedback-report.md | あり | FB-1/FB-2 + no-op reason + evidence path |
| 7 | phase12-task-spec-compliance-check.md | あり | 本ファイル（canonical 9 見出し逐語） |

> implementation-guide.md は Part 1 / Part 2 とも見出しだけでなく実体（型定義・関数シグネチャ・main フロー・bash 差分・設定値表）を持ち、heading-only reject gate に非該当。

## Skill/reference/system spec same-wave sync

- 本タスクは `scripts/smoke/**` / `.github/workflows/**` / 仕様書のみが対象で、**skill 本体（`.claude/skills/**`）のファイルを増減しない**。`.claude` 正本 / `.agents` mirror parity は本タスクで自明にクリーン（差分なし・symlink mirror）。
- ドメイン契約（API endpoint schema / D1 schema / IPC / UI route / auth / Cloudflare Secret 正本）への新規影響なし（system-spec-update-summary.md Step 2 = N/A）。mint script の新 env（`MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE`）と新 CLI 契約（`--roles`）は CI/script 層の派生物で、documentation-changelog.md に記録。
- 本仕様書は既存 skill 規約（canonical 9 見出し / strict 7 / Phase 11 evidence inventory テーブル / 3-state verdict）に準拠して作成済み。新規ルールの即時追加は skill-feedback-report.md の FB として記録（即時 skill 改変はしない）。

## Runtime or user-gated boundary

| 項目 | 境界 |
| ---- | ---- |
| Phase 1-13 実装仕様書（index / phase-1..13 / strict 7 / artifacts parity） | 本サイクルで作成完了 |
| コード実装（mint role-scoping / drift gate / provision 更新 / degrade / workflow） | 本サイクルで完了 |
| focused test 実行 / actionlint / shellcheck / typecheck / lint | 本サイクルで実行 |
| 実 Cloudflare staging deploy + 実 secret 投入 + 実 D1 mutation | user-gated（index.md §2 スコープ外） |
| commit / push / PR | user-gated（Gate-C / Phase 13） |
| required status check（`verify-mint-env-contract / verify`）の dev/main 登録 | user 明示承認必須（CLAUDE.md ブランチ戦略・gating。先送りではない・§10.6 / unassigned-task-detection M-1） |

> staging real D1 実走・実 secret 投入・required status check 登録は user-gated。実コード実装は先送りせず完了。

## Archive/delete stale-reference gate

- 本サイクルで削除・移動した root は無し（新規作成のみ）。本タスク root は **active**（`completed-tasks/` へは未移動・close-out 移動は実装完了後に判断）。
- 関連 baseline 未タスク `unassigned-task/runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation.md`（issue #916・`STAGING_AUTH_SECRET` 投入と mint path 有効化）は本タスクと境界分離（本タスクは契約 drift gate の実装仕様化・#916 は実 secret 投入の infra-ops 実行）。本サイクルでは消費・変更しない（unassigned-task-detection.md baseline に記録）。
- live inventory / active workflow / consumed trace / quick-reference / resource-map / task-workflow を破壊する削除は無し。

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_evidence_captured` と Gate-A/B passed・Gate-C pending の境界が一致。runtime / delivery PASS は未主張 |
| 漏れなし | PASS | Phase 1-13 + strict 7 + artifacts.json + Phase 11 NON_VISUAL 証跡 + AC-1〜AC-12 の検証結果を生成 |
| 整合性あり | PASS | 用語（`MintRole` / `ROLE_REQUIRED_ENV` / `parseRoles` / `MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE`）・env 名・JSON metadata（implemented local / Gate-A,B passed・C pending）・evidence_path が一致 |
| 依存関係整合 | PASS | 親 `issue-1081-bulk-tag-real-d1-runtime-smoke`（本 drift fix の起点 job）/ baseline issue #916（実 secret 投入・別関心）/ 既存 `verify-hook-integrity.yml`（gate 構造踏襲）の関係を明記。削除 root なし |
