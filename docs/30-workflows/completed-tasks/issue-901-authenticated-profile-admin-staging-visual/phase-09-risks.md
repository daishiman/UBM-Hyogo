---
phase: 9
title: Risks
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 9 — Risks

[実装区分: 実装仕様書]

## 1. リスク一覧と対策

| ID | リスク | 影響 | 確率 | 対策 |
|---|---|---|---|---|
| R-01 | storageState の cookie 失効（TTL=600s）で baseline 取得中に expire | spec fail / flake | 低 | CI step タイムアウト ≤ 8min（mint→test 完了）。再 mint を teardown 前に行わず setup project 直後に走らせる |
| R-02 | staging seed に admin / member アカウントが不在で `/admin` `/profile` が guard redirect | baseline 取得不能 | 中 | spec 内 `expect(page).toHaveURL(/admin\|profile/)` で early fail させ、seed 不在を即可視化。事前 Phase 10 §2 で `bash scripts/cf.sh d1 ... 'select count(*) from admin_users where active=1'` で確認 |
| R-03 | SSR データ揺れ（件数 / 最新日付）で visual diff > 5% | flake | 中 | `mask` で揺れ領域除外。`maxDiffPixelRatio: 0.05` 維持。データ揺れが構造的に大きい場合は spec 内で `--update-snapshots` を空コミット手順で再生成 |
| R-04 | cookie 値 / JWT 値が log / screenshot / storageState path に混入し commit される | secret leak | 中 | `.gitignore` 強制 + grep gate (Phase 7 L-08) + CI artifact upload 時の path 除外 |
| R-05 | `apps/web` (Auth.js cookie 検証) / `apps/api` (`verifySessionJwt`) の `AUTH_SECRET` drift | session 無効 / 401 / guard redirect | 低 | Phase 10 §2 で `bash scripts/cf.sh secret list --env staging` で両 Worker の `AUTH_SECRET` 存在確認。値比較は不能だが、両方を同一 1Password item から `secret put` する運用手順を `outputs/phase-11/storagestate-generation.md` に明記 |
| R-06 | `__Secure-` prefix 付き cookie 名が staging で要求されるが mint が plain name | session 無効 | 中 | Phase 10 §3 で `bash scripts/cf.sh tail` の Set-Cookie を一次根拠とし、mint CLI の cookie name を確定。不一致なら CLI に `--cookie-name-prefix=__Secure-` option を追加 |
| R-07 | `signSessionJwt` の claim 構造（iss/aud）が `apps/web` の verify 期待値と不一致 | 401 | 低 | `verifySessionJwt` 既存 unit test を一次根拠に同 issuer / audience を mint。不一致が出たら mint CLI 側を verifier に合わせる |
| R-08 | CI workflow secrets 不在 / 設定漏れ | job fail (skip ではなく fail) | 中 | mint CLI が env 不在で exit 1 + env 名 stderr 出力するため即可視化。`gh secret list` で事前確認手順を Phase 10 §1 に明記 |

## 2. 非採用案（再掲・改めて却下理由）

| 案 | 不採用理由 |
|---|---|
| Magic Link 完走 / OAuth テストアカウント実フロー | CI 自動化困難・メール / OAuth provider 依存 |
| storageState を git に commit（値 mask） | mask 後でも JWT 構造 grep で false positive 多発・revert で漏洩リスク |
| `staging-visual` project を改造して認証後を相乗 | baseline namespace 衝突。既存 UT-DSF-07 PNG を破壊する |
| TTL=24h（Auth.js 既定）採用 | runtime smoke / mint-staging-bearers の TTL=600s と不統一・freshness gate と不整合 |

## 3. 残留リスク（Out of Scope / Follow-up 候補）

| 項目 | 扱い |
|---|---|
| Magic Link / OAuth の実フロー E2E | 別タスク（本タスクは認証後 visual に限定） |
| 認証後 members-list / member-detail / tags / meetings / audit 等の他 admin 画面 baseline | フォロー候補（本タスクは profile + admin dashboard root に限定） |
| KV ベース session revocation 導入時の binding 対応 | 該当機能導入時に別タスク化 |

これら残留は Phase 12 `unassigned-task-detection.md` で「FU-901-001 など」として明示。本タスクは unassigned=0 を目標とするが、明確に out-of-scope の項目は FU 化候補として記録（実 FU 発行は別判断）。

## 4. ロールバック計画

| 障害 | アクション |
|---|---|
| visual job が連続 flake | 認証後 spec の `test.skip()` を一時付与 → 既存 `staging-visual` 4 spec の green を維持 |
| mint CLI が壊れる | revert PR 1 本で 7 新規 + 7 編集ファイルを巻き戻し可能（PNG は別 commit に分離） |
| baseline PNG drift | `--update-snapshots` で再生成し空コミットで required check 再トリガー（visual-baseline-update GitHub-token 既知問題は MEMORY `feedback_visual_baseline_github_token_retrigger.md` 参照） |
