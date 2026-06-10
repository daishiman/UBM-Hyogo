# Phase 11 — 手動テスト

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

## 1. 区分

visualEvidence: **VISUAL_ON_EXECUTION**（公開詳細ページ `/members/[id]` が全 public 項目を full/all-fields/edge データで描画する様子を staging で目視確認するのが成果）。

本仕様書は **implemented_local_evidence_captured** のため、実スクリーンショットは未取得（PNG 0 件）。staging への seed apply（`scripts/seed-test-accounts.sh --env staging --action apply`）と authenticated staging スクリーンショット撮影は **user-gated**。今回のlocal実装およびユーザー明示承認後に実行する。各 TC には取得予定のスクリーンショット canonical 名を予約し、capture metadata は `status=staging_visual_pending_user_gate` とする。

## 2. 実施環境（実行は user-gated）

- staging: `https://ubm-hyogo-web-staging.daishimanju.workers.dev`（catalog 拡充 + seed 再生成 + staging D1 apply 後）
- 対象 URL（公開掲載 5 件）:
  - `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/TEST-MEM-06`（ユーザー目視対象・フル）
  - `.../members/TEST-MEM-01`（フル）
  - `.../members/TEST-MEM-07`（フル + タグ多数）
  - `.../members/TEST-MEM-09`（全項目入力・本人写真あり）
  - `.../members/TEST-MEM-10`（エッジ: 長文 / 絵文字 / 特殊文字 / 全 SNS）
- ローカル代替（任意・実行は user-gated）: `AUTH_SECRET=playwright-e2e-auth-secret-32-bytes mise exec -- pnpm --filter @ubm-hyogo/web exec next dev --hostname 127.0.0.1 --port 3010`（local D1 seed 適用後）。

## 3. 手動テストケース（staging 適用後・user-gated 実行）

> いずれも「公開詳細ページは visibility=public 項目のみ表示（現状維持）」を前提とする。member/admin 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent）は **公開ページに出ないことを確認**する（データは投入済だが非表示）。

| ID | 対象 | 操作 | 期待 | 予約スクリーンショット名 |
|----|------|------|------|--------------------------|
| TC-01 | TEST-MEM-06 | guest で `/members/TEST-MEM-06` を開く | Hero（fullName / nickname / location / occupation / hometown chip / ubmZone badge / ubmMembershipType badge）+ ビジネス概要（businessOverview / skills / canProvide）+ タグ + SNS/Web リンク + パーソナル（hobbies / recentInterest / motto / otherActivities）+ メッセージ（selfIntroduction）の 5 セクションが全描画される | `member-detail-test-mem-06-full.png` |
| TC-02 | TEST-MEM-06 | 同ページで member/admin 項目の非表示を確認 | 生年月日 / UBM参加時期 / 現在の課題 / 掲載同意 / 規約同意 / メールアドレス / タイムスタンプが **どこにも表示されない** | `member-detail-test-mem-06-visibility-guard.png` |
| TC-03 | TEST-MEM-01 | guest で `/members/TEST-MEM-01` を開く | 全 public 項目フル描画（TC-01 同等の網羅）。理想会員の基準形 | `member-detail-test-mem-01-full.png` |
| TC-04 | TEST-MEM-07 | guest で `/members/TEST-MEM-07` を開く | フル項目に加え **タグが多数（全 6 カテゴリ）描画**され、タグ密集時もレイアウト破綻なし | `member-detail-test-mem-07-tags-dense.png` |
| TC-05 | TEST-MEM-09 | guest で `/members/TEST-MEM-09` を開く | **全項目入力 + 本人写真あり**で、public 項目・リンク・写真領域がレイアウト破綻なく描画される | `member-detail-test-mem-09-full-data.png` |
| TC-06 | TEST-MEM-10 | guest で `/members/TEST-MEM-10` を開く | **エッジ値**（長文日本語 businessOverview の折返し / 絵文字 `🌊⚓️` / 特殊文字 `%#&<>` のエスケープ / 全 URL 系キーの SNS pill）が崩れず安全に描画される | `member-detail-test-mem-10-edge.png` |
| TC-07 | TEST-MEM-09 | TC-05 で SNS/Web セクションの空挙動を確認 | 投入された SNS のみ pill 描画され、未投入 URL は pill が出ない（条件付き非表示） | `member-detail-test-mem-09-links-conditional.png` |
| TC-08 | 一覧 | guest で `/members` を開く | 公開掲載 5 件（01/06/07/09/10）がカード掲載され、非掲載 5 件（02/03/04/05/08）が一覧に出ない | `members-list-public-listed.png` |

## 4. 取得予定 evidence（implemented_local_evidence_captured・pending）

| ID | ファイル（予約・未取得） | 内容 | status |
|----|--------------------------|------|--------|
| EV-01 | `outputs/phase-11/evidence/member-detail-test-mem-06-full.png` | TC-01 | staging_visual_pending_user_gate |
| EV-02 | `outputs/phase-11/evidence/member-detail-test-mem-06-visibility-guard.png` | TC-02 | staging_visual_pending_user_gate |
| EV-03 | `outputs/phase-11/evidence/member-detail-test-mem-01-full.png` | TC-03 | staging_visual_pending_user_gate |
| EV-04 | `outputs/phase-11/evidence/member-detail-test-mem-07-tags-dense.png` | TC-04 | staging_visual_pending_user_gate |
| EV-05 | `outputs/phase-11/evidence/member-detail-test-mem-09-full-data.png` | TC-05 | staging_visual_pending_user_gate |
| EV-06 | `outputs/phase-11/evidence/member-detail-test-mem-10-edge.png` | TC-06 | staging_visual_pending_user_gate |
| EV-07 | `outputs/phase-11/evidence/member-detail-test-mem-09-links-conditional.png` | TC-07 | staging_visual_pending_user_gate |
| EV-08 | `outputs/phase-11/evidence/members-list-public-listed.png` | TC-08 | staging_visual_pending_user_gate |
| EV-09 | `outputs/phase-11/manual-test-result.md` | TC-01..08 の合否を記録（実行後） | present（本 wave で骨子作成） |

> 本 wave では `outputs/phase-11/evidence/` 配下に画像を配置しない（implemented_local_evidence_captured・PNG 0）。capture metadata は全件 `status=staging_visual_pending_user_gate`。staging apply とスクリーンショット撮影が user-gated 実行された後に EV-01..08 を取得し、manual-test-result.md を更新する。

## 5. 完了条件

- implemented_local_evidence_captured 時点: TC-01..08 を定義し、各 TC に予約スクリーンショット canonical 名と `status=staging_visual_pending_user_gate` を割り当てた（本 Phase の責務）。
- 実行後（user-gated）: TC-01..08 が pass、EV-01..08 取得、staging dev/runtime log に `/members/TEST-MEM-*` 由来の 500 がないこと。
