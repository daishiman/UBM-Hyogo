# PR template（spec_created 段階）

## PR タイトル案（70 文字以内）

```
docs(06a-followup-001): real workers + D1 smoke spec (Refs #273)
```

代替案:

- `docs(30-workflows): add 06a-followup-001 real workers/D1 smoke spec`
- `docs: spec for 06a-followup-001 public-web real workers d1 smoke`

## PR body（HEREDOC 用）

```markdown
## Summary

- 06a 公開導線について、04a public API 実体 + Cloudflare D1 binding を経由した local + staging smoke のタスク仕様書 (Phase 1〜13) を追加。
- `scripts/cf.sh` 経由で wrangler を起動する運用を正本化し、esbuild Host/Binary version mismatch (`0.27.3` vs `0.21.5`) を回避できることを AC-1 で確認する手順を整理。
- 本 PR は **Markdown 仕様書のみ**。コード変更・migration・実 smoke 実行・system spec 反映は伴わない（後続 PR でフォロー）。

## Scope

- 追加: `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` 配下一式
- 変更なし: `apps/web/**`, `apps/api/**`, migration ファイル, `scripts/**`
- pending: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `08-free-database.md` の実反映は別 PR

## Issue

- Refs #273
- Issue #273 は CLOSED のまま再オープンしない（仕様書化のみ）

## Acceptance Criteria（spec 段階トレース）

- AC-1〜7 を `outputs/phase-07/ac-matrix.md` で完全トレース（実観測は Phase 11 実 smoke 後に別 commit / 別 PR で追記）
- 不変条件 #5（apps/web → apps/api → D1 経路）を AC-7 で再確認
- 不変条件 #6（GAS prototype 非昇格）を smoke 対象外として明記

## Test plan

- [ ] `mise exec -- pnpm typecheck` が pass
- [ ] `mise exec -- pnpm lint` が pass
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` の Phase 12 チェックリストが 7/7 OK
- [ ] index.md outputs リストと実体ファイルが一致（Phase 11 evidence 3 ファイルは planned evidence として除外）
- [ ] PR 本文に `Closes #273` が含まれていない（`Refs #273` のみ）
- [ ] 仕様書内に実 secret 値・Cloudflare API token・D1 database ID が含まれていない

## Follow-up（本 PR のスコープ外）

- Phase 11 実 smoke 実行 + evidence (curl ログ + staging screenshot 1 枚) の commit
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への Step 1-A/B/C 追記
- `docs/00-getting-started-manual/specs/08-free-database.md` への smoke 確認観点 append

## Notes

- `wrangler` 直接実行は禁止。すべて `bash scripts/cf.sh` 経由。
- `git commit --no-verify` / `git push --no-verify` は使用していない。
```

## gh コマンド例（user GO 後にのみ実行）

```bash
gh pr create --title "docs(06a-followup-001): real workers + D1 smoke spec (Refs #273)" --body "$(cat <<'EOF'
（上記 PR body をそのまま貼り付け）
EOF
)"
```

## 禁止事項チェックリスト（commit / push 前）

- [ ] PR タイトル / body に `Closes #273` が含まれていない
- [ ] PR タイトル / body に Issue 再オープンを示唆する文言がない
- [ ] 仕様書内に `wrangler` 直接呼び出し例が含まれていない（すべて `bash scripts/cf.sh` 経由）
- [ ] 仕様書内に実 secret 値 / Cloudflare API token / D1 database ID が含まれていない
- [ ] `--no-verify` を使う必要がない状態で hook が pass している
