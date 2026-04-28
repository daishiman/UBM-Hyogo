# Phase 9: シークレット衛生チェックリスト

## 1. 管理場所方針 (CLAUDE.md より)

| 種別 | 管理場所 |
| --- | --- |
| ランタイムシークレット | Cloudflare Secrets (`wrangler secret put`) |
| CI/CD シークレット | GitHub Secrets |
| 非機密設定値 | GitHub Variables |
| ローカル秘密情報の正本 | 1Password Environments |

## 2. チェック項目

### 2.1 リポジトリ

- [ ] `.env` (平文) が repo にコミットされていないこと (`git ls-files | grep -E '^\.env'` で確認)
- [ ] `apps/api/wrangler.toml` の `[vars]` に Secrets 相当の値が入っていないこと
- [ ] `apps/web/wrangler.toml` の `[vars]` に Secrets 相当の値が入っていないこと
- [ ] `outputs/` 配下に実 token / API キー / 実 Secrets 値が記載されていないこと
- [ ] バックアップ SQL (`backup-*.sql`) が `.gitignore` 対象であること

### 2.2 Cloudflare Secrets

- [ ] `wrangler secret list --config apps/api/wrangler.toml --env production` で必要 secret 名が揃っていること
- [ ] `wrangler secret list --config apps/web/wrangler.toml --env production` で必要 secret 名が揃っていること
- [ ] secret 名のみ outputs に記載 (値は記載しない)

### 2.3 GitHub Secrets / Variables

- [ ] CI/CD で利用する CLOUDFLARE_API_TOKEN 等が GitHub Secrets に配置済
- [ ] 非機密設定値 (環境名等) は GitHub Variables に分離

### 2.4 1Password

- [ ] ローカル開発用の `.env` の正本が 1Password Environments に存在
- [ ] チームメンバーは 1Password 経由でのみ取得 (Slack / Email 等での共有禁止)

## 3. 本タスク (docs-only) での確認結果

| 項目 | 結果 |
| --- | --- |
| outputs/ に実 Secrets 値の混入なし | PASS (全テンプレでプレースホルダ化) |
| outputs/ に実 database_id 直書きなし | PASS (`<PROD_D1_DATABASE_ID>` 等で抽象化) |
| バックアップファイル混入なし | PASS (本タスクで取得していない) |

## 4. 違反検知時のアクション

1. 該当ファイルを repo から除去 (`git rm` 後 commit)
2. 漏洩した secret を即座にローテーション (Cloudflare / Google / Auth.js など)
3. インシデント記録を `outputs/phase-06/abnormal-case-matrix.md` に追記
4. 再発防止策を `documentation-changelog.md` に反映

## 5. 実行時最終確認

実行直前に下記コマンドで再確認:

```bash
# repo に .env が紛れていないか
git ls-files | grep -E '^\\.env' || echo "OK: no .env in repo"

# wrangler.toml の [vars] が Secrets 相当を含んでいないか目視
grep -E "(secret|password|token|key)" apps/api/wrangler.toml apps/web/wrangler.toml || echo "OK: no secret-like keys in [vars]"
```
