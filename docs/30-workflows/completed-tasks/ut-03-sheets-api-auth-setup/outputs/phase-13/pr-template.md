# Phase 13: PR テンプレ

## タイトル（70 文字以内）

```
docs(spec): [UT-03] Sheets API 認証方式設定 タスク仕様書（Phase 1-13）
```

## 本文（HEREDOC で gh pr create に渡す）

```markdown
## Summary

- GitHub Issue #52「[UT-03] Sheets API 認証方式設定」のタスク仕様書を `docs/30-workflows/ut-03-sheets-api-auth-setup/` 配下に Phase 1-13 形式で初版作成
- Service Account JSON key + Web Crypto API JWT 署名方式を採択（OAuth 2.0 / google-auth-library 等を Phase 3 で却下）
- visualEvidence: NON_VISUAL — Phase 11 で curl/疎通ログのみ evidence、screenshot 不要
- workflow_state: `completed`（Sheets auth 実装込み / Phase 13 承認待ち）

## Test plan

- [ ] `find docs/30-workflows/ut-03-sheets-api-auth-setup -type f | wc -l` が期待件数と一致
- [ ] `python3 -m json.tool docs/30-workflows/ut-03-sheets-api-auth-setup/artifacts.json` で valid JSON
- [ ] Phase 1-13 すべてに対応する outputs ファイルが存在
- [ ] CI required status checks (typecheck / lint / verify-indexes-up-to-date) が green
- [ ] Phase 11 link-checklist の broken link 0 件
- [ ] `grep -r "BEGIN PRIVATE KEY" docs/30-workflows/ut-03-sheets-api-auth-setup/` が 0 件（secret hygiene）

Refs #52

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## gh コマンド例（実行はユーザー承認後）

```bash
gh pr create --title "docs(spec): [UT-03] Sheets API 認証方式設定 タスク仕様書（Phase 1-13）" --body "$(cat <<'EOF'
## Summary

- GitHub Issue #52「[UT-03] Sheets API 認証方式設定」のタスク仕様書を docs/30-workflows/ut-03-sheets-api-auth-setup/ 配下に Phase 1-13 形式で初版作成
- Service Account JSON key + Web Crypto API JWT 署名方式を採択
- visualEvidence: NON_VISUAL
- workflow_state: completed

## Test plan

- [ ] artifacts.json が valid JSON として parse 成功
- [ ] Phase 1-13 すべての outputs が存在
- [ ] CI required status checks すべて green
- [ ] secret hygiene grep clean

Refs #52

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
