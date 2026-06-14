# Workflow: profile-session-staging-transport-recovery

`[実装区分: 実装仕様書]`

## 概要

staging `/profile`（マイページ）で、ログイン済み会員（ユーザー提供スクショ 2026-06-11 では「ishida 会員」）に「セッション情報を取得できませんでした / 通信経路でセッション確認に失敗しました。時間をおいて再読み込みしてください。」が表示され、マイページ本体が描画されない。本ワークフローは、この staging 障害を**今回 1 サイクルのコード変更で復旧**し、再発時も staging ログだけでサブ原因を即特定できる状態にする実装仕様書群である。

表示文言「通信経路でセッション確認に失敗しました」は PR #1194（2026-06-10 dev マージ）で導入された **`MEMBER_SESSION_FAILED`（transport 失敗）専用文言**であり、これが staging に表示されている事実そのものが (a) staging bundle は新しい（旧 bundle 仮説の除外）(b) 410/5xx ではなく **`/me` fetch が HTTP 応答に至らず throw した** ことを確定させる。残るサブ原因は S1（transport 解決不能 throw）/ S2（localhost fallback 接続失敗）/ S3（service-binding fetch throw）/ S4（http fetch throw）の 4 つで、横断要因として F-A（`getAuthEnv` の all-or-nothing safeParse が無関係 field 不正で `INTERNAL_API_BASE_URL` ごと捨てる設計欠陥）と F-B（単一 transport 依存・フォールバック無し）がある。本 WF は **S1〜S4 のいずれであっても復旧する多層防御（F-A/F-B の根治 + 未マージ観測性ブランチの統合）** を today's fix とし、サブ原因の最終確定は deploy 後の Phase 11 検証（user-gated）で行う。

> 実装区分の根拠（CONST_004）: ユーザー要求は「対策して」= staging 復旧であり、コード変更（env 読み取り堅牢化・transport 多段フォールバック・診断拡張）なしでは達成不可能。よってデフォルト通り実装仕様書として作成する。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `fix/profile-session-staging-transport-recovery` |
| 起点 | `origin/dev` (986d5e669) |
| 種別 | recovery / bugfix（transport 多層防御 + 観測性統合） |
| 実装区分 | 実装仕様書 |
| implementation_mode | `edit`（既存 env/transport/fetch/診断スクリプトの編集） |
| taskType | implementation（復旧の最終証跡が staging `/profile` 正常描画 screenshot） |
| visualEvidence | VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済み。復旧後 staging runtime screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending`（local 実装・focused 検証済み。staging deploy / authenticated screenshot / commit / push / PR は user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・ユーザー報告 2026-06-11 21:43 JST） |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 確定事実 F-1〜F-6・サブ原因 S1〜S4・横断要因 F-A/F-B・AC-1〜9・inventory |
| 2 | `outputs/phase-2/phase-2.md` | 多層防御設計（T01〜T04）・fallback 判定規則・ログ設計・因果ループ |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー・Phase 4 進行判定・Phase 11 を復旧検証に特化する宣言 |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約（chain/getAuthEnv の契約表・fallback 判定マトリクス・RED 観点） |
| 5 | `outputs/phase-5/phase-5.md` + `task-01..04-*.md` | 実装手順インデックス + タスク仕様書本体（4 タスク・CONST_005 全項目） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（S1〜S4 × fallback × HTTP 非 fallback × method 制約） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロック限定） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング（resolve/chain の重複排除）+ rollback |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test/bash -n/apps-api 非接触 grep） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC-1〜9 充足・blocker・MINOR） |
| 11 | `outputs/phase-11/phase-11.md` / `manual-test-result.md` | staging 復旧検証手順（user-gated）+ sub-cause 確定フロー + screenshot 計画 |
| 12 | `outputs/phase-12/phase-12.md` / strict 7 | 実装ガイド・spec 同期・未タスク formalize・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（user-gated・`dev` base・観測性ブランチ成果同梱を明記） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で、byte-identical に保つ。設計の正本（SSOT）は `_shared-context.md`。

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/web` | NON_VISUAL | 直列（最初） | 未マージ観測性ブランチの必要成果を現行 branch に統合（`ApiTransportError`/`describeTransport`/`environmentExplicit` fail-closed/transport ログ） |
| T02 | `apps/web/src/lib/env.ts` | NON_VISUAL | T01 後・T03 と並列 | `getAuthEnv` field-tolerant 化（不正 field のみ drop・dropped key 名のみ warn・F-A 根治） |
| T03 | `apps/web/src/lib/fetch/` | NON_VISUAL | T01 後・T02 と並列 | transport 多段フォールバック chain（service-binding → INTERNAL → NEXT_PUBLIC。ApiTransportError かつ GET/HEAD のみ・F-B 根治） |
| T04 | `scripts/` | NON_VISUAL | 独立並列 | 診断スクリプト 2 系統 probe + data-cause 抽出 + deploy 版数（read-only・冪等） |

## 不変条件（CLAUDE.md / プロジェクト準拠）

- `/me` の path・shape・status 体系、`apps/api` 全体、D1 schema、Google Form 仕様、`/profile` UI 文言・分岐を変更しない（AC-7）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。
- env 参照はアクセサ経由のみ（`process.env` 直接参照禁止）。認証境界 fail-closed 維持（非 local で localhost に落ちない）。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`wrangler` 直叩き禁止（`bash scripts/cf.sh`）。secret/cookie/memberId 非転記。
- コミット・PR・push・deploy はユーザー指示があるまで実行禁止（CONST_002）。

## 既知のスコープ外

| 事象 | 理由 / 対応先 |
|------|------|
| API worker 側の根治（S3 確定時） | staging ログで S3 と確定した場合のみ着手可能（CONST_007 例外①）。`unassigned-task/task-api-worker-hard-error-root-fix.md` |
| 410 復帰フロー / 5xx 根治 / 管理者 `/profile` UX | 前身 WF の Issue #1189-#1191 が追跡中（本 WF と重複しない） |
| ブラウザ拡張由来のコンソールノイズ | 自社外 |

## 正本順位（衝突時）

1. `_shared-context.md`（SSOT）
2. 本 `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md` / `.claude/skills/aiworkflow-requirements/references/*`
