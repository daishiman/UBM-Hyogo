# Issue #1190 コメント草稿（T04・現行コード最適化）

> **user-gated 注記（最重要）**: 本ファイルは Issue [#1190](https://github.com/daishiman/UBM-Hyogo/issues/1190) へ投稿する**草稿**である。**コメント投稿・ラベル変更・close を含む一切の GitHub mutation は user-gated であり、本サイクルでは実行しない**（AC-10 / Phase 13 G3）。投稿はユーザー承認後、本サイクル（T01-T03）完了を確認してから行うことを推奨する。

---

## 投稿本文（ここから下をコメントとして使用）

### 現行コード最適化（2026-06-12・HEAD 52ade3866 監査による再定義）

本 Issue は起票時（2026-06-09）、`deferred_pending_root_cause` として「真因が H4（5xx）と確定し、例外箇所が特定されてから着手」とされていました。**このブロッカーは現行コードの静的監査により解消しました。** staging 実機での真因確定を待たずに、5xx を発生させる例外箇所はコード監査で特定済みです。

#### 1. deferred ブロッカー解消の根拠 = 5xx 発生経路マップ（P1-P8）

| # | 経路 | ファイル:行 | 現状 | 例外時の結果 |
|---|------|-------------|------|--------------|
| P1 | `sessionGuard` → `Promise.all([findIdentityByMemberId, getStatus])` | `apps/api/src/middleware/session-guard.ts:84-87` | try/catch なし | onError → 500 `UBM-5000`（`/me/*` 全 endpoint 共倒れ） |
| P2 | `sessionGuard` → `findAdminByEmail` | `apps/api/src/middleware/session-guard.ts:105` | try/catch なし | 同上 |
| P3 | `GET /me/profile` → `buildMemberProfile` | `apps/api/src/routes/me/index.ts:170-175` | try/catch なし | onError → 500 `UBM-5000` |
| P4 | `GET /me/profile` → `getPendingRequestsForMember` | `apps/api/src/routes/me/index.ts:181` | try/catch なし | onError → 500 `UBM-5000`（**二次データなのに全体 500**） |
| P5 | `GET /me/profile` → `resolveEditResponseUrl` | `apps/api/src/routes/me/services.ts:152-163` | fail-soft 済（try/catch → null） | 200 維持 |
| P6 | `GET /me/profile` → `resolveMyPhotoUrl` | `apps/api/src/routes/me/index.ts:183-185` | fail-soft 済（`.catch(() => undefined)`） | 200 維持 |
| P7 | `me-session-resolver` → `validateAuthSecretEnv` | `apps/api/src/middleware/me-session-resolver.ts:53-63` | 防御済（try/catch → null → 401） | 401 |
| P8 | `me-session-resolver` → `verifySessionJwt` | `apps/api/src/middleware/me-session-resolver.ts:65` | 失敗時 null（throw しない設計） | 401 |

行番号は 2026-06-12 に実コード Read で全件検証済み。改修対象は P1-P4 のみ（P5-P8 は既存防御を維持）。

また、起票時に前提とされていなかった事実として、グローバル構造化エラーハンドラ（`apps/api/src/index.ts:195` の `app.onError(errorHandler)` → problem+json + 構造化 `logError`）は**既設**であり、「5xx が不透明」という問題は worker ログレベルでは半分解消済みです。

#### 2. 根本問題の再定義（F-1〜F-3）

起票時の「session-resolver / API worker / D1 の 5xx 根治」は、現行コードでは次の 3 つに具体化されます。

| ID | 問題 | 種別 |
|----|------|------|
| F-1 | `/me/profile` の二次データ fail-soft 不統一：`getPendingRequestsForMember`（P4）だけ fail-hard で、二次データの D1 例外が**マイページ全体を 500 にする**（photoUrl / editResponseUrl は fail-soft 済み） | バグ（回避可能な 5xx） |
| F-2 | 一次データ D1 例外の分類不足：P1-P3 の例外が汎用 `UBM-5000` に丸まり発生 scope を特定不能。`UBM-5001`（Database Error / 500）は定義済みなのに `/me` 系で未使用 | 可観測性ギャップ |
| F-3 | `/me` 系 5xx の契約テスト不在：D1 例外注入時のレスポンス shape / status / fail-soft 挙動を固定するテストがない | テストギャップ |

F-1〜F-3 は**真因（H3/H4/H5）がどれであっても現行コードに実在する**欠陥／ギャップです。解消すれば (a) 真因が H4 なら根治、(b) H4 でなくても再発時に worker ログ 1 件（`UBM-5001` + `context.scope`）で発生箇所を即時確定できます。

#### 3. 対応ワークフロー（実装仕様書）

本 Issue の根治は次のワークフローで仕様化済みです（Phase 1-13・NON_VISUAL・existing-hardening）。

- **正本**: `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/`（SSOT: `_shared-context.md`）
- **タスク**: T01（P4 fail-soft 統一・200 + `pendingRequests: {}`）/ T02（P1-P3 を `UBM-5001` + `context.scope` で分類 rethrow・status 体系不変）/ T03（D1 例外注入の契約テスト TC-1〜TC-4）/ T04（本コメント）
- **不変条件**: `/me` の path・shape・status 体系（200/401/404/410/5xx）不変、D1 schema 不変、apps/web 非接触、memberId/email のログ・response 非露出（#11）

---

## 投稿本文ここまで

### 投稿時の運用メモ（草稿外・投稿しない）

- 投稿タイミング: 本サイクル（T01-T03）の focused vitest 全緑確認後を推奨（投稿する場合は本サイクルの実装・検証完了を明示すること）。
- ラベル: `status:unassigned` の変更・close 判断はユーザーに委ねる（本 WF からは提案しない）。
- 本草稿の出典: `_shared-context.md` §1-2 / `outputs/phase-1/phase-1.md`（行番号実測検証）。
