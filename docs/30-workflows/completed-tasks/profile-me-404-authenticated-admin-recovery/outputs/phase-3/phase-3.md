# Phase 3: 設計レビュー

## メタ情報
- workflow: profile-me-404-authenticated-admin-recovery
- SSOT: `_shared-context.md`
- 判定: Phase 4 進行可否

## 目的
Phase 2 設計（T01〜T04）を 4 条件（価値性・実現性・整合性・運用性）で検証し、Phase 4 進行可否を判定する。

## 実行タスク

### 3.1 一次結論（4 条件評価）
| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ✅ | 認証済み管理者の `/me` 200 復旧（ユーザーの直接コスト除去）+ 再発時の data-cause 即特定（運用コスト恒久削減）。T02 は drift 起因の境界障害クラスを根治。 |
| 実現性 | ✅ | 4 タスクとも既存資産の延長（error-handler/safe-fetch/diagnose 編集、web-cd.yml を雛形に api-cd.yml 新設）。新規ライブラリ・新 endpoint・D1 変更なし。1 サイクルで完了可能（CONST_007）。 |
| 整合性 | ✅ | `/me` 契約・UI 文言・D1 schema・Google Form 不変（AC-6）。state ownership 混在なし（web=表示/transport、api=route/notFound、CI=deploy、script=診断）。fail-closed 維持（AC-7）。 |
| 運用性 | ✅ | T02 smoke gate が deploy 毎に認証 `/me` 200 を検証 → 回帰を CI で捕捉。T01/T04 が再発時診断を自動化。secret は boolean/status のみで非漏洩。 |

### 3.2 真の論点の確認
- 主問題（1 文）: 「認証済み管理者の server-side `GET /me` が staging で 404（route 未マッチ相当）になり、`/profile` 本体が出ない」。
- 複数案件の混在切り分け: 本 WF は **`/me`（session）404 の復旧** に限定。`/me/profile`（`PROFILE_UNAVAILABLE`）や admin 専用 UX（#1192）、environmentExplicit（#1234）は分離（index「既知のスコープ外」）。
- why now / why this way: #1237 で transport throw が解消 → 実 HTTP 応答に到達 → 404 が顕在化（why now）。route/deploy 層が真因クラスゆえ「観測性 + CD 根治 + web 診断」で多層に対処（why this way）。

### 3.3 依存・責務境界のレビュー
- T01 が最初（観測の土台）。T02/T03 は T01 後に並列。T04 は独立。依存は一方向で循環なし。
- 責務境界: notFound ログ（api）/ route-404 ログ（web）/ deploy gate（CI）/ 診断（script）が各々の状態のみ所有。重複なし。

### 3.4 価値とコストの不均衡チェック
- 最大価値: 認証 `/me` 200 復旧 + drift 根治（T01+T02）。
- 最大コスト部品: T02（CI/CD 新設 + smoke secret 依存）。ただし web-cd.yml 同型 + prereq skip で導入コストを抑制し、secret 未設定環境では skip して fail させない設計。初期価値（復旧・観測）と将来層（fully gated CD）を分離せず 1 サイクルに収める（CONST_007 整合）。

### 3.5 リスクと緩和
| リスク | 緩和 |
|--------|------|
| data-cause が実は 401/410（S3） | T01 のログで即判明。判明時は本 WF スコープ外として #1192/#1234 へ格下げ（unassigned-task 記録）。復旧の主経路（T02 CD）は S1/S2 に有効で無駄にならない。 |
| smoke secret 未設定で gate が無効 | prereq skip を `::notice::` で可視化。Phase 11 で secret 設定を user-gated タスク化。 |
| api-cd.yml paths フィルタ取りこぼし | `packages/shared/**` も対象に含め、shared 型変更経由の api 挙動変化も deploy 発火させる。 |

### 3.6 Phase 11 の特化宣言
Phase 11 は **staging 復旧検証 + data-cause 確定**（user-gated）に特化する。NON_VISUAL（4 タスクは UI 描画不変）だが、復旧の最終証跡は「staging `/profile` 正常描画 + 認証 `/me` 200」であり VISUAL_ON_EXECUTION（screenshot は復旧後・user-gated）。

## 完了条件
- [x] 4 条件すべて ✅ で Phase 4 進行可と判定。
- [x] 真の論点・依存・価値コスト・リスク緩和を記録。
- [x] Phase 11 を復旧/data-cause 確定に特化する宣言を記録。

## 成果物
- 本ファイル `outputs/phase-3/phase-3.md`

## 参照資料
- `_shared-context.md`（SSOT §1〜§6）
- `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md`

## 統合テスト連携
- Phase 4 で T01/T03 のログ payload を RED テストとして固定する方針を承認。
- Phase 9 で yaml 構文 / `bash -n` / redaction grep を直列実行する方針を承認。
