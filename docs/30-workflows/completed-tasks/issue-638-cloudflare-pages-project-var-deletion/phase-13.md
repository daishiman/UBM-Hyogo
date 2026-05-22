# Phase 13: PR 作成テンプレート（diff-to-pr 連携）

## 13.1 ブランチ・base

- 作業ブランチ: `docs/issue-638-cloudflare-pages-project-var-deletion`
- PR base: `dev`（CLAUDE.md 既定）
- production への取り込み: 通常の `dev → main` リリースサイクルで実施（本 PR では行わない）

## 13.2 PR title

```
docs(issue-638): delete CLOUDFLARE_PAGES_PROJECT GitHub variable
```

## 13.3 PR body テンプレート

```markdown
## 概要

Issue #331 (CI/CD runtime warning cleanup) の Workers deploy 統一により dormant となった GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` を削除する。Phase 1-13 仕様書を `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/` に配置し、削除前後 evidence を `outputs/phase-11/` に記録する。

Refs #638 (CLOSED, reopen はしない / ユーザー指示)
Refs #331 (Workers deploy 統一の前提タスク)
Refs #419 (CLOSED, 元 fold 先)

## 背景

- Issue #638 は CLOSED 状態だが、GitHub Variable 本体は user approval marker 後に削除済み (`after.json` total_count=3 / `after-single.txt` HTTP 404)
- `.github/` 配下の grep gate は hit 0 → workflow からの参照なし、削除安全
- 旧 unassigned-task spec を本仕様で supersede

## 変更内容

- 新規: `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/` (index + Phase 1-13)
- 新規: `outputs/phase-11/` 配下 evidence。削除後 evidence は user approval marker 保存後に取得
- 編集: `docs/30-workflows/unassigned-task/issue-331-followup-001-*.md` 冒頭に SUPERSEDED marker
- 外部 mutation: `CLOUDFLARE_PAGES_PROJECT` を GitHub Actions Variables から削除

## Evidence

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/before.json` | 削除前 list (total_count=4) |
| `outputs/phase-11/before-single.json` | 削除前 single GET (value=ubm-hyogo-web) |
| `outputs/phase-11/after.json` | 削除後 list (total_count=3) |
| `outputs/phase-11/after-single.txt` | 削除後 single GET (HTTP 404) |
| `outputs/phase-11/grep-gate.txt` | rg 結果 (0 hits / 0 byte) |
| `outputs/phase-11/deletion-log.md` | 実行サマリ |

## DoD (Phase 11)

- [x] DoD-A 削除完了（user approval marker 後）
- [x] DoD-B read-only preflight evidence + mutation evidence 取得
- [x] DoD-C ドキュメント整合
- [ ] DoD-D ローカル品質ゲート (`pnpm typecheck` / `pnpm lint`)
- [ ] DoD-E PR 状態（user approval 後）

## test plan

- [ ] reviewer: `outputs/phase-11/after.json` に `CLOUDFLARE_PAGES_PROJECT` が含まれないことを `jq` で確認
- [ ] reviewer: `outputs/phase-11/after-single.txt` の "HTTP 404" 文字列を目視確認
- [ ] reviewer: `gh api repos/daishiman/UBM-Hyogo/actions/variables` 実行結果が evidence と一致することを確認
- [ ] reviewer: 旧 `unassigned-task/issue-331-followup-001-*.md` 冒頭の SUPERSEDED marker を確認

## 注記

- Issue #638 は CLOSED のまま。reopen / state 変更は行わない（ユーザー指示）
- Cloudflare Pages project 本体 (`ubm-hyogo-web`) の物理削除は `issue-331-followup-002` の責務、本 PR では実施しない
- OIDC / step-scoped CF token cutover は `issue-331-followup-003` の責務、本 PR では実施しない
```

## 13.4 gh pr create コマンド

```bash
gh pr create --base dev \
  --title "docs(issue-638): delete CLOUDFLARE_PAGES_PROJECT GitHub variable" \
  --body "$(cat <<'EOF'
<上記 13.3 のテンプレートをここに貼る>
EOF
)"
```

このコマンドは user approval 後にのみ実行する。

## 13.5 マージ後の確認

- [ ] PR merged to `dev`
- [ ] `dev` への次回 production cutover で `main` に自動取り込み
- [ ] 次回 unassigned-task 棚卸時、本 spec が `completed-tasks/` 配下に移動されること（別 PR / 別タスク）

## 13.6 関連リソース

- 旧仕様: `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md`
- 元 Issue: https://github.com/daishiman/UBM-Hyogo/issues/638
- 親 workflow: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/` (history)
- GitHub Audit log: `https://github.com/daishiman/UBM-Hyogo/settings/audit-log`
