# Phase 11: 手動テスト結果（NON_VISUAL・implemented_local_evidence_captured・結果欄はlocal present/staging pending / user-gated）

## NON_VISUAL 宣言

| 項目 | 値 |
|------|------|
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更は apps/api `/me` 系のエラーハンドリング（fail-soft 統一・`UBM-5001` 分類）・構造化ログ・契約テストのみ。UI 表現（文言・色・レイアウト・DOM）を変更しない。apps/web 非接触（AC-6） |
| 代替証跡 | focused vitest（TC-1〜TC-4）+ grep gate（#11）+ diff 証跡 + staging 実機ログ（`UBM-5001` + scope） |
| workflow_state | `implemented_local_evidence_captured`（本ファイルは実装後に実行する手動確認**手順**と結果欄。local は present、staging は user-gated pending） |

> **本ファイルのローカル実結果は present。staging deploy と staging 実機確認のみ user-gated とする。

## 1. ローカル確認手順（本サイクルで実行）

### MT-1: focused vitest（TC-1〜TC-4・AC-1/AC-2/AC-3/AC-8）

| 項目 | 内容 |
|------|------|
| 前提 | T01〜T03 実装済み（`apps/api/src/routes/me/index.ts` / `session-guard.ts` / 既存 `index.contract.spec.ts` への追記） |
| コマンド | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/me/index.contract.spec.ts -t issue-1190` / `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/me/index.contract.spec.ts` |
| 期待結果 | issue-focused 6 PASS、full `/me` contract spec 34/34 PASS |
| 実結果 | **present（本サイクルで取得）** |

### MT-2: typecheck / lint（AC-8）

| 項目 | 内容 |
|------|------|
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/api lint` |
| 期待結果 | いずれも exit 0 |
| 実結果 | **present（本サイクルで取得）** |

### MT-3: 非接触 diff 証跡（AC-6 / AC-7）

| 項目 | 内容 |
|------|------|
| コマンド | `git diff --stat -- apps/web`（空）/ `git status --porcelain \| grep -v docs/`（migrations・新規 route なし） |
| 期待結果 | apps/web diff 空・D1 migrations / 新規 endpoint なし |
| 実結果 | **present（本サイクルで取得）** |

### MT-4: 不変条件 #11 grep gate（AC-5）

| 項目 | 内容 |
|------|------|
| コマンド | `rg -n 'type Me.*DatabaseScope\|toMeDatabaseError\\(\"me-(session-guard\|profile-builder)\"\|scope: \"me-pending-requests\"' apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts` |
| 期待結果 | helper scope 型が literal union、call site が `me-session-guard` / `me-profile-builder` literal、pendingRequests が `me-pending-requests` literal。memberId / email を含む動的値の混入なし |
| 実結果 | **present（本サイクルで取得）** |

## 2. staging 実機確認手順（user-gated・実装 + deploy 後）

> Cloudflare 系 CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止）。MT-5〜MT-6 の実行・スケジュールはユーザー承認後（Phase 13 G4）。

### MT-5: staging へ deploy（user-gated）

| 項目 | 内容 |
|------|------|
| 前提 | MT-1〜MT-4 全緑。commit / push 済み（Phase 13 G2 承認後） |
| コマンド | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` |
| 期待結果 | staging API worker が T01/T02 を含む新 bundle で稼働する。deploy 版数（version id）を控える |
| 実結果 | **pending（user-gated）** |

### MT-6: staging `/me` の実機確認（user-gated）

| 項目 | 内容 |
|------|------|
| 前提 | MT-5 完了。staging にログイン可能なアカウントがある |
| 手順 | (1) `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` でログを stream する。(2) 別ブラウザで staging `/profile` を開く（web → service-binding 経由で `GET /me`・`GET /me/profile` が発火する）。(3) 正常時: 200 で profile が表示され、エラーログが出ないことを確認。(4) 5xx 再発時: tail に `UBM-5001` + `context.scope`（`me-session-guard` / `me-profile-builder` / `me-pending-requests` のいずれか）が出力され、**ログ 1 件で発生 scope を確定できる**ことを確認。(5) ログに memberId / email が含まれないこと（#11）を目視確認 |
| 期待結果 | 正常時 200 維持。異常時は scope 付き `UBM-5001` ログで即時切り分け可能。pendingRequests 系の失敗では 200 + `pendingRequests: {}` に degrade し全体 500 にならない（AC-1） |
| 実結果 | **pending（user-gated）** |

## 3. 実行記録（サマリ）

| 区分 | 項目 | 状態 |
|------|------|------|
| 自動テスト | MT-1 focused vitest（TC-1〜TC-4） | **present（本サイクルで取得）** |
| gate | MT-2 typecheck / lint | **present（本サイクルで取得）** |
| gate | MT-3 非接触 diff（apps/web 空・migrations なし） | **present（本サイクルで取得）** |
| gate | MT-4 #11 grep gate | **present（本サイクルで取得）** |
| 実機 | MT-5 staging deploy（`cf.sh deploy`） | **pending（user-gated）** |
| 実機 | MT-6 staging `/me` 確認（`cf.sh tail` + `/profile` 発火） | **pending（user-gated）** |
| 外部運用 | commit / push / PR / Issue #1190 mutation | **pending（user-gated・AC-10）** |
| 視覚証跡 | スクリーンショット | **n/a（NON_VISUAL・取得しない）** |

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言と「local present / staging user-gated pending」を明記した。
- [x] ローカル確認手順（MT-1〜MT-4）を「コマンド / 前提 / 期待結果 / 実結果」形式で記録した。
- [x] staging `/me` の user-gated 実機確認手順（MT-5〜MT-6）を記録した。
- [x] スクリーンショット n/a（NON_VISUAL）を明記した。

## 成果物
- `outputs/phase-11/manual-test-result.md`（本ファイル）

## 参照資料
- `phase-11.md`（証跡計画）
- `../phase-2/phase-2.md` §7（TC-1〜TC-4 期待値）/ §9（validation path）
- `../../_shared-context.md` §4（AC-1〜AC-10）/ §6（検証コマンド）

## 統合テスト連携
MT-1〜MT-4 の全緑が AC-1〜AC-8 の証跡正本、MT-5〜MT-6 が staging 実機での運用確認（user-gated）。取得後に Phase 12 compliance check の Phase 11 evidence inventory を pending → present へ更新し、Phase 13 PR 本文へ反映する。
