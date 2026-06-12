# Workflow: profile-session-transport-observability-fail-closed

`[実装区分: 実装仕様書]`（NON_VISUAL / fetch・transport 層の観測性強化 + localhost fail-closed）

## 概要

staging `/profile` の「セッション情報を取得できません」エラーについて、ユーザーから「ローカル環境（127.0.0.1）を見に行っていないか」という疑問が出た。コード読解の結論は **「アプリは localhost を参照していない（コンソールの `127.0.0.1:8888` はブラウザ拡張機能由来・アプリのフォールバック値は 8787 でポートも違う・サーバー側 fetch は service-binding 経由）」**。真の失敗原因は staging 実機の HTTP ステータス依存で、現状ログでは「どの transport で・どの host を叩いたか」が記録されず確定できない。本ワークフローは、この **transport 解決先の可視化（観測性強化）** と **ENVIRONMENT 未注入時の暗黙 local 化による localhost フォールバックの fail-closed 化** を、今回 1 サイクルで完結させる実装仕様書群である。

> 実装区分の根拠（CONST_004）: ユーザー依頼「localhost 参照を確認 → 直す」の達成には、確認結果を**実機ログで証明可能にし**、誤って localhost を叩く経路を**構造的に塞ぐ**コード変更が必須のため、純 docs-only ではなく実装仕様書として作成する。確定後の本格修正は真因が staging 実機で確定するまで方針を決められない（CONST_007 例外①）ため Phase 12 で未タスク化する。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `fix/profile-session-staging-localhost-endpoint` |
| 起点 | `origin/dev` (d0dd40069) |
| 種別 | observability + fail-closed（fetch/transport 層のコード変更） |
| 実装区分 | 実装仕様書（NON_VISUAL） |
| implementation_mode | `new`（新規コード + 新規/拡張テスト） |
| taskType | NON_VISUAL（UI メッセージ・色変更なし。ログ・transport 層のみ） |
| visualEvidence | NON_VISUAL（UI 表現変更なし。証跡は focused tests + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused tests 完了。staging deploy・commit・PR は user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点 / 既存 #1189-1192 と重複チェック） |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 観測事象・調査結論・真因仮説（C1-C5）・受入条件（AC-1〜9）・inventory・命名規則 |
| 2 | `outputs/phase-2/phase-2.md` | レーン設計（A/B/C）・状態所有権・因果ループ・fail-closed 設計・validation path |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー・4条件評価・Phase 4 進行判定 |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約（transport descriptor・ログ shape・テスト期待値表） |
| 5 | `outputs/phase-5/phase-5.md` + `task-01..04-*.md` | 実装手順インデックス + タスク本体（T01-T04） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（fail path / 回帰 guard） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロックの line/branch） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング（診断メタ生成の純関数化）+ rollback |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test・verify-no-localhost-bake・apps/api 非接触） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC 充足・blocker・MINOR 追跡） |
| 11 | `outputs/phase-11/phase-11.md` / `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言 + staging 実機ログ確認手順（真因確定） |
| 12 | `outputs/phase-12/phase-12.md` / `outputs/phase-12/*`（strict 6+） | 実装ガイド・SSOT 同期・未タスク（本格修正の formalize）・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（多段ゲート、`dev` base、user-gated） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で byte-identical に保つ。設計の正本（SSOT）は `_shared-context.md`。

## 調査結論（ユーザー疑問への回答 / 要約）

| 問い | 回答 | 根拠 |
|------|------|------|
| アプリは 127.0.0.1 を見に行っているか | **No** | アプリの fallback は 8787・`8888` はコード 0 件・サーバー fetch は service-binding |
| コンソールの `127.0.0.1:8888` は何か | ブラウザ拡張機能（Sentry/content.js/service-worker-loader.js が証拠） | `index.md` §概要 |
| では何が失敗しているか | API が 410/5xx を返す or transport 失敗（実機ログ依存） | `_shared-context.md` §3 |

## 真因仮説マトリクス（要約 / 詳細は phase-1）

| ID | 仮説 | 症状一致 | 観測強化での切り分け |
|----|------|------|------|
| C1 | 410（is_deleted=1）→ `MEMBER_SESSION_410` | ✓ | status=410 + transportKind |
| C2 | 5xx → `MEMBER_SESSION_5xx` | ✓ | status=5xx + baseHost |
| C3 | transport 失敗 → `MEMBER_SESSION_FAILED` | ✓ | ApiTransportError + transportKind |
| C4 | localhost 参照 | ✗（否定済） | baseHost が localhost でないことをログで証明 |
| C5 | 401 | ✗（redirect） | — |

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | レーン | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/web/src/lib/fetch`（transport/errors/authed） | NON_VISUAL | A | fail-closed + describeTransport + 診断メタ + ApiTransportError |
| T02 | `apps/web/src/lib`（env） | NON_VISUAL | A（前段） | `getEnvironmentResolution` 追加 |
| T03 | `apps/web/src/lib/server-fetch`（safe-fetch） | NON_VISUAL | B | ログに transportKind/baseHost 追加 |
| T04 | `scripts/`（diagnose 拡張） | NON_VISUAL | C | transport 確認手順 echo（read-only） |

本格的な根本修正（410 復帰 / 5xx 根治 / transport 運用是正）は真因確定後でないと方針を決められないため Phase 12 で未タスク化（先送りではなく仕様分岐の合意待ち = CONST_007 例外①）。

## 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface（`/me` path・shape・status 体系）を変更しない。apps/api 非接触（diff 空が DoD）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。
- env 参照は `apps/web/src/lib/env.ts` アクセサ経由のみ。認証境界は fail-closed。
- `127.0.0.1`/`localhost`/`8787`/`8888` の新規リテラル焼き込み禁止（`verify-no-localhost-bake` gate）。既存 `localhost-allow:local-fallback` コメント規約を維持。
- 不変条件 #11: memberId を response/ログに露出しない。ログは host とステータスのみ。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`wrangler` 直叩き禁止（`scripts/cf.sh` 経由）。

## 既知のスコープ外

| 事象 | 理由 / 対応先 |
|------|------|
| `[Sentry] You cannot use Sentry.init() in a browser extension` / `content.js POST 127.0.0.1:8888` | ブラウザ拡張由来・自社外（`sentry-extension-noise-filter-spec` WF が別途存在） |
| 真因確定後の本格修正（410 復帰 / 5xx 根治 / transport 運用是正） | 真因が実機で確定するまで方針未定。Phase 12 で未タスク化（CONST_007 例外①）。#1189-1192 と重複チェック |
| 既存 profile-session WF の commit / deploy | user-gated（CONST_007 例外②） |

## 正本順位（衝突時）

1. `_shared-context.md`（SSOT）
2. 本 `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md`（`02-auth.md` / `13-mvp-auth.md`）
