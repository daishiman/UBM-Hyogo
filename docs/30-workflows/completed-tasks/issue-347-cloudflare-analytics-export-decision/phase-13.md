# Phase 13 — PR 作成（user 承認ゲート必須）

## 目的

本ディレクトリ全体（13 仕様書 + outputs/* + aiworkflow-requirements / 09c parent への 1 行追加）を 1 PR として user 承認後に作成する。docs-only PR のため CI gate は doc lint / link check のみ通れば PASS。

## 必須前提

- Phase 1〜12 すべて completed
- Phase 11 で sample export と redaction-check が PASS 保存済み
- Phase 12 で aiworkflow-requirements 2 件 / 09c parent 1 件への diff が実 commit に含まれている
- **user 承認**: 「PR 作成して良い」の明示的指示なしには PR を作成しない

## 出力

- `outputs/phase-13/main.md`: 承認ゲート log + PR 作成結果
- `outputs/phase-13/local-check-result.md`: `pnpm typecheck` / `pnpm lint` 実行ログ（docs-only でも実行）
- `outputs/phase-13/change-summary.md`: 変更ファイル一覧 + 各意図
- `outputs/phase-13/pr-template.md`: PR タイトル / 本文 draft

## ローカル検証コマンド

```bash
# 1. リモート main 同期
git fetch origin main

# 2. main を取り込み
git merge origin/main --no-edit

# 3. docs-only でも typecheck / lint は実行（CLAUDE.md PR フロー準拠）
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. 変更ファイル一覧
git diff main...HEAD --name-only > outputs/phase-13/change-summary.md

# 5. PR 本文 draft 確認
cat outputs/phase-13/pr-template.md
```

## PR 本文 draft（pr-template.md 用）

```markdown
## Summary

- issue #347 「Cloudflare Analytics 長期保存 export 方式の確定」のタスク仕様書を作成
- 採用方式: GraphQL Analytics API（aggregate-only）+ 月次手動取得 + repo 12 件 retention
- aiworkflow-requirements / 09c parent index への参照導線を追加
- 取得サンプル 1 回分と redaction-check evidence を保存

## 実装区分

ドキュメントのみ仕様書（CONST_004 例外条件: 純粋にドキュメント・調査・合意形成で完結）

## 関連

Refs #347

## Test plan

- [ ] outputs/phase-11/evidence/sample-export/*.json に PII が含まれていないこと（grep 確認）
- [ ] aiworkflow-requirements の deployment-cloudflare.md / deployment-cloudflare-opennext-workers.md に本仕様書へのリンクが追加されていること
- [ ] 09c parent index.md に本仕様書への参照が 1 行追加されていること
- [ ] 09c workflow_state が変更されていないこと

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 完了条件（DoD）

- [ ] user の明示承認取得（PR 作成 OK の指示）
- [ ] `git status --porcelain` 空
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] 7 + 13 = 20 個程度のファイルが PR に含まれている
- [ ] PR URL が `outputs/phase-13/main.md` に記録
- [ ] issue #347 を **再 open しない**（CLOSED のまま `Refs #347` で参照）

## 受け入れ条件（AC mapping）

- AC-7（aiworkflow 同期実 commit）, AC-8（09c root state 据え置き）

## 検証手順

```bash
gh pr view --json url,state,title 2>&1 | head -10
```

## リスク

| リスク | 対策 |
| --- | --- |
| issue #347 が CLOSED のため自動 close されない | `Closes #347` ではなく `Refs #347` のみ使用 |
| docs-only PR で CI gate が想定と異なる挙動 | CLAUDE.md PR フローに従い `pnpm typecheck` / `pnpm lint` を local で先行実行し、red を発生させない |
| user 承認なしに PR 作成 | Phase 13 冒頭の前提を必ず確認、勝手に gh pr create しない |
