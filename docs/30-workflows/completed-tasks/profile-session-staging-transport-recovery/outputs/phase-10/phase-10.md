# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 10 / 13 |
| taskType | implementation |
| implementation_mode | edit |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

AC-1〜AC-9 の充足を、各 AC を担保するタスク・テスト・検査・検証手順と対応付けて最終確認し、blocker の有無を判定する。**本サイクルは `implemented_local_runtime_pending`（local 実装・focused 検証済み）のため、判定は local 実装・focused evidence・full typecheck/lint の取得済み結果と、user-gated な staging runtime 境界を分離して行う。**

## 実行タスク

### 10.1 AC-1〜9 充足判定表

| AC | 内容（要約） | 担保タスク / 手段 | 充足エビデンス（実装時に取得） | 判定（implemented_local_runtime_pending） |
|----|--------------|------------------|--------------------------------|------|
| AC-1 | 観測性成果統合（`ApiTransportError`/`describeTransport`/`getEnvironmentResolution`/safe-fetch transport ログ）+ 既存テスト green | T01 | Phase 9 L-3（`safe-fetch.spec.ts` ほか既存テスト PASS） | local PASS — implemented_local_runtime_pending |
| AC-2 | `getAuthEnv` field-tolerant 化 + 「無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` が消える」回帰ケースの spec 固定 | T02 | Phase 9 L-3（`env.spec.ts`） | local PASS — implemented_local_runtime_pending |
| AC-3 | service-binding throw → `INTERNAL_API_BASE_URL` fallback で `/me` 取得成功（GET/HEAD のみ）。HTTP エラー Response 非 fallback・status 体系回帰なし | T03 | Phase 9 L-3（`transport.spec.ts` / `authed.spec.ts`） | local PASS — implemented_local_runtime_pending |
| AC-4 | 非 local で localhost transport に絶対に落ちない（`ENVIRONMENT` 明示 local のみ fallback・fail-closed 維持） | T01 + T03 | Phase 9 L-3（`transport.spec.ts` fail-closed ケース） | local PASS — implemented_local_runtime_pending |
| AC-5 | fallback 発生時 `api_transport_fallback {from, to, path}` 構造化 warn。memberId・cookie・secret 非出力 | T03 | Phase 9 L-3（`authed.spec.ts`）+ G-5 | local PASS — implemented_local_runtime_pending |
| AC-6 | 診断スクリプトが web `/api/me` + API direct `/me` の 2 系統 probe + `data-cause` 抽出 + deploy 版数手順。read-only・冪等・`bash -n` PASS | T04 | Phase 9 L-4（`bash -n`）+ Phase 11 RT-B | local PASS — implemented_local_runtime_pending |
| AC-7 | `/me` shape・path・status 体系、`apps/api` 全体、D1 schema、Google Form 仕様、`/profile` UI 文言・分岐を一切変更しない | T01〜T04 共通の非接触規約 | Phase 9 G-1（`git diff dev --name-only \| grep '^apps/api/'` 空）/ Q-1・Q-2 | local PASS — implemented_local_runtime_pending |
| AC-8 | `mise exec -- pnpm typecheck` / `pnpm lint` / 対象 focused vitest 全 PASS | T01〜T04 | Phase 9 L-1 / L-2 / L-3 | local PASS — implemented_local_runtime_pending |
| AC-9 | Phase 11 に staging 復旧の実機検証手順（user-gated: deploy → diagnose → `/profile` 正常描画 screenshot → 新ログ transportKind/baseHost で S1〜S4 確定）が記載され、判定フローが S1〜S4 を排他的に切り分ける | Phase 11（RT-A〜RT-D + 判定フロー） | `outputs/phase-11/manual-test-result.md`（本 wave で生成済・手順は present・実結果 pending） | **充足（本 wave で確認）** — 手順定義は local wave で確定済み |

### 10.2 blocker 判定

| 観点 | blocker か | 根拠 |
|------|-----------|------|
| 多層防御の網羅性（S1〜S4） | 非 blocker | Phase 3 §3.5 で「S1/S3/S4→chain・S2→fail-closed+chain」の対応を 4 条件 PASS で確認済。サブ原因がどれでも復旧する設計（SSOT §1） |
| fallback の契約侵襲（AC-3/AC-7） | 非 blocker（実装時に要厳格確認） | `ApiTransportError` のみ・GET/HEAD のみ・HTTP Response 非介入の判定規則が Phase 2 §2.3 / Phase 4 契約表で固定済。崩れたら blocker → Phase 9 L-3 / Q-3 で検知 |
| 認証境界 fail-closed（AC-4・NO-GO 条件） | 実装時に要厳格確認 | 非 local で localhost に落ちたら blocker。`transport.spec.ts` の fail-closed ケースと G-2/G-3 で検知 |
| apps/api 非接触（AC-7・NO-GO 条件） | 実装時に要厳格確認 | apps/api に diff が出たら blocker。Phase 9 G-1 で検知し revert |
| サブ原因の未確定 | 非 blocker | 本 WF は「S1〜S4 のいずれであっても復旧する」設計のため、確定は Phase 11 RT-D（user-gated）に置いても復旧は止まらない（前身 WF の停滞教訓を反映） |

判定: **blocker 0 件**。実装着手後は AC-7（apps/api 非接触）と AC-4（fail-closed）を最優先で監視し、Phase 9 の L-1〜L-4 全 PASS + G/Q 違反 0 をもって AC-2〜AC-8 充足、Phase 11 の RT-A〜RT-D 完了をもって AC-9 の実結果（復旧 + サブ原因確定）とする。

### 10.3 MINOR 追跡テーブル

| ID | MINOR 指摘（Phase 3 §3.6 起源） | 区分 | 追跡 |
|----|--------------------------------|------|------|
| MINOR-1 | `fetchViaApiTransport`（単発）と chain の共存は一時的な重複 | リファクタリング | Phase 8 で chain の内部要素として整理（単発 resolve を chain の先頭要素として再定義 or 互換 wrapper 化）。local 実装で互換 wrapper として許容 |
| MINOR-2 | 診断スクリプトの旧 probe（web `/me`）は route 不在で常に 404 系になる誤誘導出力 | T04 で是正必須 | `outputs/phase-5/task-04-diagnose-script-extension.md` で web `/api/me` + API direct `${API_BASE}/me` の 2 系統 probe へ是正（AC-6）。Phase 11 RT-B で出力確認 |

> MINOR は 2 件とも追跡先が仕様書内で確定しており、blocker ではない。

### 10.4 VISUAL エビデンス取扱い

- 現象 screenshot は**ユーザー提供済み**（2026-06-11 21:43 JST・staging `/profile`・サイドバーに「ishida 会員」表示のままエラーバナー）。Phase 11 で文中参照する（リポジトリには配置しない）。
- コード変更自体は transport/env 層で UI 外観は不変（SSOT §0）。実装時の一次証跡は focused vitest（jsdom）。
- 復旧後の staging runtime screenshot `outputs/phase-11/screenshots/profile-session-recovery-staging.png` は認証必須のため **user-gated**（implemented_local_runtime_pending では未取得・pending）。

## 完了条件

- [x] AC-1〜AC-9 を担保タスク・手段・充足エビデンスと対応付け（implemented_local_runtime_pending 判定 = local 実装・focused evidence captured）
- [x] blocker 判定（blocker 0 件）と NO-GO 監視対象（AC-7 apps/api 非接触 / AC-4 fail-closed）を明示
- [x] MINOR 追跡テーブル（MINOR-1: Phase 8 / MINOR-2: task-04）を設置
- [x] VISUAL エビデンス（現象=ユーザー提供 / 復旧後 staging runtime=user-gated pending）の取扱いを記録

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | AC-4 fail-closed・401/410 境界根拠 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | AC-7 の shape / path 不変基準 |

- `_shared-context.md` §4（AC-1〜9 正本）/ §1（F-1〜F-6・S1〜S4・F-A/F-B）
- `outputs/phase-3/phase-3.md` §3.6（MINOR-1/2 起源）
- `outputs/phase-9/phase-9.md`（L/G/Q ゲート）

## 統合テスト連携

AC-9 を担保する Phase 11 の staging 復旧検証（RT-A〜RT-D・user-gated）が復旧結論とサブ原因確定の正本。AC-2〜AC-8 の focused 自動テスト PASSと合わせ、Phase 12 で実装ガイド・未タスク formalize（S3 確定時の API worker 根治）・compliance へ引き継ぐ。
