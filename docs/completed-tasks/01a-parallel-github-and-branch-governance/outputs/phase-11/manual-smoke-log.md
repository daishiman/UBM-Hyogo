# 手動 Smoke Test ログ

## 実施日

2026-04-23

## 前提確認

Phase 10 GO 判定: 確認済み（`outputs/phase-10/main.md` に記録）

## Smoke Test 実施結果

### ST-1: main branch protection 確認

**手順:** `gh api repos/daishiman/UBM-Hyogo/branches/main/protection`

**現状実測値:**
```json
{"message":"Branch not protected","status":"404"}
```

**期待結果:** reviewer 2 名・force push OFF

**判定:** PENDING（branch protection は GitHub UI 適用待ち）

**備考:** docs-only タスクのため runbook 記載済み。GitHub UI での適用は管理者が実施する。

---

### ST-2: dev branch protection 確認

**手順:** `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection`

**現状実測値:**
```json
{"message":"Branch not protected","status":"404"}
```

**期待結果:** reviewer 1 名・force push OFF

**判定:** PENDING（branch protection は GitHub UI 適用待ち）

---

### ST-3: production environment 確認

**手順:** `gh api repos/daishiman/UBM-Hyogo/environments`

**現状実測値:**
```json
{"total_count":0,"environments":[]}
```

**期待結果:** main only・reviewer 2 名

**判定:** PENDING（environment は GitHub UI 適用待ち）

---

### ST-4: staging environment 確認

**現状実測値:** total_count=0（ST-3 と同様）

**期待結果:** dev only・自動（reviewer なし）

**判定:** PENDING（environment は GitHub UI 適用待ち）

---

### ST-5: PR template 確認

**手順:** `.github/pull_request_template.md` の内容確認

**確認結果:**
- ファイル: **存在する**（Phase 5 で作成）
- True Issue 欄: **あり**
- Dependency 欄: **あり**
- 4条件チェック欄（価値性 / 実現性 / 整合性 / 運用性）: **全てあり**

**判定:** **PASS**

---

### ST-6: CODEOWNERS 確認

**手順:** `.github/CODEOWNERS` の内容確認

**確認結果:**
- ファイル: **存在する**（Phase 5 で作成）
- `*  @daishiman`（global fallback）: **あり**
- `doc/01a-*/ @daishiman`: **あり**
- `doc/01b-*/ @daishiman`: **あり**
- `doc/01c-*/ @daishiman`: **あり**
- `.github/ @daishiman`: **あり**
- task 責務との衝突: **なし**

**判定:** **PASS**

## Smoke Test 結果サマリー

| テスト # | シナリオ | 期待結果 | 実測値 | 判定 | 備考 |
| --- | --- | --- | --- | --- | --- |
| ST-1 | main branch protection | reviewer 2 名・force push OFF | 未設定（API 404） | PENDING | GitHub UI 適用待ち |
| ST-2 | dev branch protection | reviewer 1 名・force push OFF | 未設定（API 404） | PENDING | GitHub UI 適用待ち |
| ST-3 | production environment | main only・reviewer 2 名 | 未設定（total_count=0） | PENDING | GitHub UI 適用待ち |
| ST-4 | staging environment | dev only・自動 | 未設定（total_count=0） | PENDING | GitHub UI 適用待ち |
| ST-5 | PR template | true issue / dependency / 4条件欄あり | 全欄あり | **PASS** | .github/pull_request_template.md 作成済み |
| ST-6 | CODEOWNERS | @daishiman 設定・衝突なし | 全パターンあり | **PASS** | .github/CODEOWNERS 作成済み |

## 判定総括

docs-only タスクのため、branch protection と environments の実設定は管理者が runbook に従い GitHub UI で適用する。
ファイルで実装可能な成果物（PR template・CODEOWNERS）は PASS。

**Phase 12 進行判定:** GO（ST-5・ST-6 PASS、ST-1〜ST-4 は runbook 適用待ち）
