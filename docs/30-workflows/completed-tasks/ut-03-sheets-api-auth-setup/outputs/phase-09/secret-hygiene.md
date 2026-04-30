# Phase 9: Secret hygiene チェックリスト

CLAUDE.md「ローカル `.env` の運用ルール（AI 学習混入防止）」に整合する。

## チェック項目

- [ ] `.env` に Service Account JSON 実値が**書かれていない**（`op://` 参照のみ）
- [ ] `apps/api/.dev.vars` が `.gitignore` に記載される
- [ ] `git check-ignore apps/api/.dev.vars` が exit 0
- [ ] `git log -p` で SA JSON がコミット履歴に**含まれない**
- [ ] `gh pr diff` で diff に `private_key` 文字列が**含まれない**
- [ ] PR 本文 / Issue / Discussion に SA JSON が**転記されない**
- [ ] `~/Library/Preferences/.wrangler/config/default.toml` に OAuth トークンが**保持されない**（`wrangler login` 禁止）
- [ ] `bash scripts/cf.sh` 経由でのみ Cloudflare 認証する
- [ ] log 出力に `redact()` が必ず適用される
- [ ] AI（Claude Code）への session 内で `cat .env` / `Read .env` を実行**しない**

## 検査コマンド

```bash
# .env が op 参照のみで構成されているか
grep -E "^[A-Z_]+=\"?op://" .env | wc -l
grep -E "^[A-Z_]+=\"?[^o]" .env | grep -v "^#" | wc -l  # 0 を期待

# git history に SA JSON が混入していないか
git log -p --all | grep -c "BEGIN PRIVATE KEY"  # 0 を期待
git log -p --all | grep -c "service_account"     # 0 を期待

# .dev.vars の gitignore
git check-ignore apps/api/.dev.vars && echo "OK"
```

## インシデント対応

万が一 commit / push してしまった場合:

1. `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON ...` で**即時 rotate**（古い JSON key を Google Cloud Console で revoke）
2. 1Password の SA item を更新
3. `git filter-repo` で履歴から物理削除（remote が public の場合は force push 不可避だが、roll out 前提で実施）
4. インシデントレポートを `docs/30-workflows/security-incidents/` に記録（**SA JSON 実値は含めない**）
