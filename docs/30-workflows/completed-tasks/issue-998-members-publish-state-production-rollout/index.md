# issue-998-members-publish-state-production-rollout

`[実装区分: 実装仕様書 + runtime-ops runbook ハイブリッド / workflow_state: implemented_local_runtime_pending]`

本ファイル群は GitHub Issue #998（CLOSED）の根本問題「Google Form 回答済み会員が `/members` 公開ページに表示されない」を **production まで根本解決**するための実装仕様書である。原 issue #998 の scope（staging runtime 検証）を包含し、さらに production flag enablement（コード変更）と production runtime ops を加えた拡張スコープで構成する。Issue は CLOSED のため、PR 文脈は `Refs #998` のみを使用する。

> **実装区分の判定根拠（CONST_004 / CONST_005）**
>
> - 親ワークフロー `members-not-displaying-form-sync-investigation`（`completed-tasks/` 配置・`implemented_local_runtime_pending`）で診断 API / auto-publish policy / backfill endpoint / ops scripts は**既にローカル実装済み**（Gate-A / Gate-B PASSED）。よって本タスクの大半は `implementation_mode: "verify_existing"`（既実装の回帰確認）である。
> - 一方、根本問題の真の解決には **production の `MEMBERS_AUTO_PUBLISH_ON_CONSENT` を `false`→`true` へ切り替える `apps/api/wrangler.toml` のコード変更**が必須であり、本サイクルで完了済み（CONST_007 準拠）。ユーザー選択により production 展開を含むため `[実装区分: 実装仕様書]` とする。
> - staging / production への deploy・D1 backfill apply・browser smoke は **user-gated runtime ops**（Cloudflare secret + D1 mutation を伴う）であり、本サイクルでは runbook として手順を確定するが、**実行はユーザーの明示承認後**に行う（CONST_002 / CONST_006）。原 issue #998 frontmatter の `governance_mutation_user_gate: true` を継承する。

## Issue 現状（調査結果 / 2026-05-30）

| 項目 | 値 |
|------|-----|
| GitHub Issue | #998 — **CLOSED**（PR 文脈は `Refs #998` のみ） |
| コード実装 | ✅ 完了（auto-publish policy / diagnostics / backfill endpoint / ops scripts すべて存在・router 登録済み・focused tests green） |
| staging flag | `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`（`apps/api/wrangler.toml:162`） |
| production flag | local config は `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`（`apps/api/wrangler.toml:72`）。production deploy 未実行のため runtime 反映は Gate-C pending |
| staging runtime | 未検証（deploy / backfill apply / browser smoke 未実行 = 原 issue #998 Gate-C） |
| production runtime | 未検証（local flag は ON 済みだが deploy / backfill apply / browser smoke 未実行） |

> **「不要」判定の境界**: 原 issue #998 が要求していた**アプリ実装作業は不要**（完了済み）。ただし根本問題は (a) production flag の deploy 未反映 と (b) 既存 record の `publish_state='member_only'` 滞留 の 2 点で runtime レベルに残存しており、**issue 自体は依然有効**。本ワークフローは issue を現在のコードに最適化し、production rollout まで根本解決する。

## 真の論点（要件レビュー）

1. **真の論点**: `/members` に form 回答済み会員が出ない根因は「公開フィルタ `publish_state='public'` を満たす record が存在しない」こと。local code では production flag を `true` にしたが、(a) production deploy まで runtime は旧設定のまま、(b) 既存 record は backfill apply しない限り `member_only` のまま。
2. **依存関係・責務境界**: コード変更（`wrangler.toml` prod flag）は実装サイクル内。runtime ops（deploy / backfill / smoke）は user-gated。**staging で安全性を実証してから production に進む**安全順序を強制する（Task B → Task C 直列）。
3. **価値とコストの不均衡**: 価値=本番公開ディレクトリ復旧。最大コスト=本番 D1 mutation（`member_status.publish_state` UPDATE）のリスク（admin override された hidden member の誤公開）。`decidePublishState` の admin override 保護（`hidden` / 非 `system:*` `updated_by` を上書きしない）と dry-run 必須・approval marker で緩和する。
4. **改善優先順位**: ① production flag コード変更 + 既実装回帰確認（実装サイクル内）→ ② staging runtime 検証（user-gated）→ ③ production runtime 検証（user-gated, staging evidence 後）。
5. **4条件評価**: 価値性○（本番会員可視化）/ 実現性○（コードは実装済み・変更は flag 1 行）/ 整合性○（auto-publish policy が admin override を保護・公開フィルタ不変）/ 運用性○（dry-run + approval marker + redaction grep で監査運用が閉じる）。

## 強化ループ / バランスループ

- **強化ループ（価値）**: flag ON → consent 済 member_only が public へ昇格 → `/members` 可視 member 増加 → フォーム回答の動機向上。
- **バランスループ（安全）**: 本番 mutation リスク → dry-run + approval marker + admin override 保護 → 誤公開抑制 → 段階的 rollout（staging→production）で影響範囲を限定。

## 既存資産（再掲・current facts）

| Artifact | Path | 状態 |
|----------|------|------|
| auto-publish policy | `apps/api/src/lib/policies/auto-publish.ts`（`decidePublishState` / `isAdminOverrideStatus` / `normalizePublishState`） | 実装済み |
| sync 統合 | `apps/api/src/jobs/sync-forms-responses.ts`（flag 有効時 `decidePublishState` 適用・`updated_by='system:sync'`） | 実装済み |
| backfill endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.ts`（`POST /admin/sync/backfill-publish-state?dryRun=...`・`runBackfillPublishState`） | 実装済み・`index.ts:287` 登録 |
| diagnostics endpoint | `apps/api/src/routes/admin/sync-diagnostics.ts`（`GET /admin/sync/diagnostics/forms-pipeline`） | 実装済み・`index.ts:284` 登録 |
| 公開フィルタ | `apps/api/src/_shared/public-filter.ts`（builder 経由 `WHERE public_consent='consented' AND publish_state='public' AND is_deleted=0`） | 既存・不変 |
| ops scripts | `scripts/diagnose-members-pipeline.sh` / `scripts/backfill-publish-state.sh` | 実装済み |
| production flag | `apps/api/wrangler.toml:72` `MEMBERS_AUTO_PUBLISH_ON_CONSENT="true"` | 本タスクで変更済み。deploy は user-gated |

## スコープ（タスク分割 / CONST_007 準拠）

| Task | 概要 | 実装区分 | スコープ |
|------|------|---------|---------|
| [Task A](tasks/task-a-production-flag-enablement.md) | production flag enablement + 既実装回帰確認 | 実装仕様書（コード変更 1 点 + verify_existing） | `apps/api/wrangler.toml:72` を `"true"` へ変更 + 既実装の typecheck/build/focused tests 回帰確認 |
| [Task B](tasks/task-b-staging-runtime-verification.md) | staging runtime 検証 runbook（原 issue #998 Gate-C） | 実装仕様書（runtime-ops runbook / user-gated） | staging deploy → diagnose-pre → backfill dry-run → approval → apply → diagnose-post → `/members` browser smoke |
| [Task C](tasks/task-c-production-runtime-rollout.md) | production runtime rollout runbook | 実装仕様書（runtime-ops runbook / user-gated） | production deploy（flag=true 反映）→ diagnose-pre → backfill dry-run → approval → apply → diagnose-post → `/members` browser smoke + rollback 手順 |

> **CONST_007 準拠**: Task A のコード変更（`wrangler.toml` 1 行）は実装サイクル内で完了する。Task B/C の runtime ops は user-gated だが、原 issue #998 でも明示された境界であり「先送り」ではなく「本質的な user-gated 分離」である。runbook は本サイクルで確定し、実行のみ承認待ちとする。
>
> **直列依存**: Task A（コード変更）→ Task B（staging 検証）→ Task C（production rollout）。Task C は Task B の staging evidence で安全性が確認できた後にのみ実行する。

## Phase 1-13

| Phase | File | 担当 |
|-------|------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | 要件 |
| 2 | [phase-02-architecture.md](phase-02-architecture.md) | アーキ |
| 3 | [phase-03-task-breakdown.md](phase-03-task-breakdown.md) | タスク分割 |
| 4 | [phase-04-data-contract.md](phase-04-data-contract.md) | データ契約 |
| 5 | [phase-05-implementation-guide.md](phase-05-implementation-guide.md) | 実装ガイド |
| 6 | [phase-06-test-strategy.md](phase-06-test-strategy.md) | テスト戦略 |
| 7 | [phase-07-quality-gates.md](phase-07-quality-gates.md) | 品質ゲート |
| 8 | [phase-08-dod.md](phase-08-dod.md) | DoD |
| 9 | [phase-09-risks.md](phase-09-risks.md) | リスク |
| 10 | [phase-10-local-verification.md](phase-10-local-verification.md) | ローカル検証 |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | エビデンス |
| 12 | [phase-12-compliance.md](phase-12-compliance.md) | 適合性 |
| 13 | [phase-13-commit-pr-draft.md](phase-13-commit-pr-draft.md) | commit/PR draft |

## 不変条件（本ワークフロー固有）

1. 公開フィルタ（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）は**不変**。UI / 公開 API の表示条件を変更しない。
2. D1 schema 変更・migration 追加・Google Form schema 変更・新 endpoint 追加は**禁止**（既存 endpoint surface のみ使用）。
3. backfill は必ず `dryRun=true` を先に実行し、approval marker 作成後にのみ `dryRun=false`（apply）を実行する。
4. admin override（`publish_state='hidden'` / 非 `system:*` `updated_by`）は backfill で上書きしない（`decidePublishState` の保護を信頼し、apply 後に spot check する）。
5. evidence JSON / log に `SYNC_ADMIN_TOKEN` 等の secret を残さない（保存後 redaction grep 必須）。
6. Cloudflare 操作は必ず `bash scripts/cf.sh` 経由（`wrangler` 直呼び禁止）。
7. commit / push / PR は user の明示承認後のみ。Issue #998 は CLOSED 維持。
