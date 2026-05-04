# Phase 8: rollback 手順 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

production deploy 後に問題が発生した場合の rollback 手順を定義する。

## rollback トリガー

- production `/privacy` `/terms` が 5xx
- ページ render が崩れている（必須セクション欠落）
- 法務指摘により**緊急で**当該文面を取り下げる必要が発生

## 手順

### 1. 直前バージョンへの rollback (Cloudflare Workers)

```bash
# 直前 deploy の version ID を確認
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production

# rollback 実行
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
```

### 2. URL 200 確認

```bash
curl -s -o /dev/null -w "privacy=%{http_code}\n" "$PROD_HOST/privacy"
curl -s -o /dev/null -w "terms=%{http_code}\n" "$PROD_HOST/terms"
```

### 3. OAuth consent screen 影響確認

Privacy/Terms URL が**404 を返さないこと**が重要（200 でない場合 OAuth verification status 影響）。404 の場合は consent screen の URL 欄を一時的に旧 URL（ある場合）に戻すか、空欄不可なので暫定文面ページに切り戻す。

### 4. git revert（コードレベル rollback が必要な場合）

```bash
git revert <commit-sha-of-page-changes>
git push origin <feature-branch>
gh pr create --base main --title "revert: privacy/terms emergency rollback"
```

`git push` / `gh pr create` は緊急 rollback でもユーザー承認後にのみ実行する。

## rollback 後の再開条件

- 失敗原因（build artifact / テスト漏れ / 法務指摘）が修正されている
- Phase 5 Step 4-8 を再実行し全 gate PASS

## 完了条件

- [ ] rollback 手順が連番で実行可能
- [ ] OAuth verification への影響観点が含まれている
- [ ] `outputs/phase-08/main.md` を作成する
