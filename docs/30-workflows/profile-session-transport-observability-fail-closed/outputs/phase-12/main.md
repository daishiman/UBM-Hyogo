# Phase 12: メイン

## メタ情報
正本: `outputs/phase-12/main.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| visualEvidence | NON_VISUAL（証跡は focused tests + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_mode | `new`（新規コード + 拡張テスト） |
| 想定 PR base | `dev` |

## 1. サマリ

staging `/profile`「セッション情報を取得できません」エラーについて、ユーザー疑問「アプリが localhost（127.0.0.1）を見に行っていないか」への確定回答は **No**（app fallback は 8787・8888 はコード 0 件・server fetch は service-binding）。本ワークフローはこの結論を **(1) 実機ログで証明可能化**（`server_fetch_failed` ログに `transportKind`/`baseHost` を追加）し、**(2) localhost フォールバックを構造的に不可能化**（`ENVIRONMENT` 未注入時の暗黙 local 化を staging/production で fail-closed throw）する観測性強化 + fail-closed の実装仕様書群である。

真因の本格修正（410 復帰 / 5xx の apps/api 根治 / transport 運用是正）は staging 実機で真因が確定するまで方針を決められない（CONST_007 例外①）ため、本サイクルでは未タスク化し、既存 Issue #1189-1192（profile-session-fetch-failure-investigation 由来）に統合する。

## 2. 変更ファイル分類

| 分類 | ファイル | 状態 |
|------|----------|---------------------|
| 実装対象（app code） | `apps/web/src/lib/fetch/transport.ts` / `errors.ts` / `authed.ts`、`apps/web/src/lib/env.ts` / `result.ts`、`apps/web/src/lib/server-fetch/safe-fetch.ts`、route proxy 5 箇所 | implemented |
| 実装対象（script） | `scripts/diagnose-profile-session.sh`（transport 確認 echo 拡張・read-only） | implemented |
| テスト対象 | `transport.spec.ts` / `__tests__/transport-select.spec.ts` / `authed.spec.ts` / `__tests__/safe-fetch.spec.ts` / `__tests__/env.spec.ts` | focused Vitest 5 files / 70 tests PASS |
| apps/api（非接触） | `apps/api/src/**`（`/me` route・session-guard・resolver） | 非接触（diff 空が DoD・AC-9） |
| 前提（不変） | `apps/api/src/middleware/trailing-slash.ts` / `apps/web/app/api/me/[...path]/route.ts` / `session-error-display.ts` | dev 取込済・本タスクで触らない |
| workflow spec | `docs/30-workflows/profile-session-transport-observability-fail-closed/**` | implemented_local_evidence_captured |

## 3. 観測性強化の新規価値（既存にない差分のみ）

1. **transport 解決先の可視化** — `server_fetch_failed` ログに「service-binding か http か」（`transportKind`）と「base host」（`baseHost`）を追加。「localhost を叩いていない」ことを実機ログで証明可能にする。
2. **localhost fail-closed** — `ENVIRONMENT` が enum 3値以外（未注入/typo）で暗黙 `local` 化し localhost フォールバックに到達する経路を、staging/production では構造的に禁止（throw）する。

## 4. user-gated 境界

本 wave で実施済み: 仕様書（Phase 1〜13）・I/O 契約（phase-4）・strict Phase 12 成果物・実コード（T01〜T04）・focused Vitest・system spec sync・aiworkflow sync。

依然 user-gated（本 wave で未実施）:

- staging deploy（`bash scripts/cf.sh deploy`）
- `wrangler tail`（`bash scripts/cf.sh tail`）での `server_fetch_failed` 実機観測（MT-A〜MT-D）
- commit / push / PR

## 完了条件
- [x] サマリ・変更ファイル分類・新規価値・user-gated 境界を記録した。

## 成果物
- `outputs/phase-12/main.md`（本ファイル）

## 参照資料
- `../../_shared-context.md`（SSOT §2 既存資産との関係 / §4 変更対象）
- `implementation-guide.md` / `unassigned-task-detection.md`

## 統合テスト連携
Phase 11 の証跡計画（T1〜T5 + MT-A〜MT-D）と Phase 13 の PR 計画を引き継ぐ。
