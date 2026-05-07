# Phase 13: PR 作成（multi-stage approval gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| Source | `outputs/phase-13/phase-13.md` |
| 区分 | リリース（commit / push / PR の 3 段独立 gate） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 1-12 の成果物を 1 PR にまとめ、`Refs: #516` を含む PR を `feat/issue-516-github-audit-log-cross-source-correlation` ブランチから作成する。CLAUDE.md「PR 作成の完全自律フロー」に従う。

## multi-stage approval gate

| Gate | 内容 | 承認 |
| --- | --- | --- |
| G1: pre-flight | `pnpm typecheck` / `pnpm lint` / vitest / bats / actionlint clean | 自動（失敗したら commit しない） |
| G2: commit | 変更を意味単位でコミット（実装 / scripts / workflow / docs / SSOT を分けても良い） | ユーザー承認後 |
| G3: push | `feat/issue-516-...` ブランチに push | ユーザー承認後 |
| G4: PR 作成 | `gh pr create --label priority:medium --label type:security` | ユーザー承認後 |

## 実行タスク

1. Phase 1-12 の evidence と Phase 12 strict outputs を確認する。
2. commit / push / PR 作成の前にユーザー承認を得る。
3. PR には `Refs: #516`、`priority:medium`、`type:security` を含める。
4. Issue #516 の close / comment は PR merge 後のユーザー判断まで実行しない。

## ブランチ / コミット / PR

- ブランチ: `feat/issue-516-github-audit-log-cross-source-correlation`
- ベース: `main`（main を作業ブランチにマージしてから push）
- PR タイトル: `feat(security): issue-516 GitHub Actions audit log との cross-source 相関基盤`
- PR labels: `priority:medium`, `type:security`
- PR 本文必須要素:
  - `Refs: #516`
  - 概要（cross-source correlation の目的）
  - 変更点サマリ（`outputs/phase-12/implementation-guide.md` から抜粋）
  - 検証ログへのリンク（`outputs/phase-11/main.md`）
  - スクリーンショット項目は**作らない**（NON_VISUAL）
  - Test plan（typecheck / lint / vitest / bats / actionlint / grep-gate / HIGH dry-run）

## PR 本文テンプレート（HEREDOC）

```bash
gh pr create \
  --title "feat(security): issue-516 GitHub Actions audit log との cross-source 相関基盤" \
  --label priority:medium \
  --label type:security \
  --body "$(cat <<'EOF'
## Summary
- GitHub Actions audit log と Cloudflare audit log を redact-safe な fingerprint hash で cross-source 相関させる基盤を新規実装
- HIGH severity 判定ロジック / fixture 駆動 verify / runbook を整備し CI で恒久化
- PII（secret / full IP / full UA）非保存ポリシーを grep gate で恒久検証

## 変更点
- apps/api/src/audit-correlation/ — fetch / redact / fingerprint / correlate コア実装
- scripts/audit-correlation/ — runner / fixtures / bats / grep-gate
- .github/workflows/audit-correlation-verify.yml — CI 恒久化
- docs/runbooks/audit-correlation.md — HIGH alert dry-run runbook
- .claude/skills/aiworkflow-requirements/references/audit-correlation.md — SSOT

## Test plan
- [x] pnpm typecheck / lint clean
- [x] vitest 全件 green / coverage 80%+
- [x] bats grep-gate / runner-determinism green
- [x] actionlint clean
- [x] HIGH alert dry-run で severity HIGH を確認
- [x] grep-gate で PII 検出 0 件

## Evidence
- outputs/phase-11/main.md

Refs: #516
EOF
)"
```

## 親 Issue 状態維持

- 親 Issue #516 は **OPEN のまま据え置き**。本 PR の merge をもってユーザー判断でクローズする想定。Phase 13 では Issue 操作を行わない。

## ローカル実行コマンド

```bash
# main 同期
git fetch origin main
git checkout main && git merge --ff-only origin/main
git checkout -b feat/issue-516-github-audit-log-cross-source-correlation
git merge main

# pre-flight
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# commit + push + PR
git add -A
git commit -m "feat(security): issue-516 GitHub Actions audit log との cross-source 相関基盤" 
git push -u origin feat/issue-516-github-audit-log-cross-source-correlation
# (上記 gh pr create コマンドを実行)
```

## 参照資料

- CLAUDE.md「PR 作成の完全自律フロー」
- `.claude/commands/ai/diff-to-pr.md`
- Phase 11 / Phase 12 outputs

## 成果物

- PR URL（`outputs/phase-13/phase-13.md` に記録）

## 完了条件（DoD）

- [ ] G1-G4 すべて gate 通過。
- [ ] PR タイトル / label / 本文が仕様通り。
- [ ] PR 本文に `Refs: #516` を含む。
- [ ] PR 本文に NON_VISUAL のためスクリーンショット項目を**作っていない**。
- [ ] 親 Issue #516 は OPEN のまま（操作なし）。
