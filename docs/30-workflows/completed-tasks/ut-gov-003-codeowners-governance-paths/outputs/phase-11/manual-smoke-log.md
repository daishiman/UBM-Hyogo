# Phase 11 manual smoke log — UT-GOV-003 CODEOWNERS

> **status**: PARTIALLY EXECUTED
> **理由**: `.github/CODEOWNERS` 編集と `gh api .../codeowners/errors` は本差分で実行済み。test PR 作成と suggested reviewer 観察はリモートブランチ作成を伴うため、ユーザー承認なしでは実行しない。
> **本ファイルの役割**: 実行済みの静的 / API 検証ログと、未実行の test PR smoke コマンド系列を同居させる。

---

## 1. test PR による 5 governance path × suggested reviewer 観察

### 1.1 前提

- `.github/CODEOWNERS` が冒頭 global fallback (`* @daishiman`) + 5 governance path 指定済の状態（Phase 13 PR smoke 完了後）
- 実走者は本リポジトリへの write 権限を持つ
- test branch は **マージしない**（draft → close → delete branch）

### 1.2 コマンド系列

```bash
# (a) test branch を切る
git checkout -b chore/codeowners-smoke-do-not-merge

# (b) 5 governance path に 1 ファイルずつ touch
echo "<!-- codeowners smoke -->" >> docs/30-workflows/ut-gov-003-codeowners-governance-paths/index.md
echo "<!-- codeowners smoke -->" >> .claude/skills/task-specification-creator/references/artifact-naming-conventions.md
# .github/workflows/<existing>.yml に末尾コメント追記（実在 workflow を選ぶこと）
printf "\n# codeowners smoke\n" >> .github/workflows/verify-indexes.yml
# apps/api / apps/web は実在ファイルを 1 つずつ選ぶ
printf "\n// codeowners smoke\n" >> apps/api/src/index.ts
printf "\n// codeowners smoke\n" >> apps/web/app/layout.tsx

# (c) 明示 add（git add . / -A は禁止）
git add docs/30-workflows/ut-gov-003-codeowners-governance-paths/index.md \
        .claude/skills/task-specification-creator/references/artifact-naming-conventions.md \
        .github/workflows/verify-indexes.yml \
        apps/api/src/index.ts \
        apps/web/app/layout.tsx

git commit -m "chore: codeowners smoke (DO NOT MERGE)"
git push -u origin chore/codeowners-smoke-do-not-merge

# (d) draft PR 作成
gh pr create --draft --base dev \
  --title "chore: codeowners smoke (DO NOT MERGE)" \
  --body "smoke for UT-GOV-003. close without merge."

# (e) suggested reviewer / reviewRequests を JSON で取得
gh pr view --json reviewRequests,reviewDecision,files,number
```

### 1.3 期待結果

| # | path | 期待 suggested reviewer |
| --- | --- | --- |
| 1 | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/index.md` | `@daishiman` |
| 2 | `.claude/skills/task-specification-creator/references/artifact-naming-conventions.md` | `@daishiman` |
| 3 | `.github/workflows/verify-indexes.yml` | `@daishiman` |
| 4 | `apps/api/src/index.ts` | `@daishiman` |
| 5 | `apps/web/app/layout.tsx` | `@daishiman` |

> 本リポジトリは solo 運用かつ owner = `@daishiman` のみのため、5 path とも同一 owner が表示される。観察ポイントは「path → owner 解決が silently skip されていないこと」。

### 1.4 後始末（必須）

```bash
gh pr close --delete-branch
git checkout dev
git branch -D chore/codeowners-smoke-do-not-merge 2>/dev/null || true
```

---

## 2. `gh api .../codeowners/errors` による syntax / 権限検証

### 2.1 コマンド

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
```

### 2.2 実行ログ

実行日: 2026-04-29

コマンド:

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
```

結果:

```json
{"errors":[]}
```

### 2.3 失敗例（赤シナリオ / L4 fixture）

意図的に存在しない user を 1 行追加した場合の期待 error:

```json
{
  "errors": [
    {
      "line": <N>,
      "column": 1,
      "kind": "Unknown owner",
      "source": "@nonexistent-bot-handle-xyz",
      "suggestion": "Owner not a collaborator/team",
      "message": "..."
    }
  ]
}
```

> 本 fixture は本番 `.github/CODEOWNERS` には**コミットしない**。L4 検証はPhase 13 PR smoke 内の commit 1 件で append → `gh api` 実行 → revert の流れで行う。

---

## 3. 未実行範囲

- test branch 作成 / push / draft PR 作成 / suggested reviewer 観察は未実行
- 理由: コミット・push・PR 作成はユーザー明示承認が必要なため
- 実走者は本ファイルの §1 を使い、PR 番号と `gh pr view --json reviewRequests,reviewDecision,files,number` の出力を追記する

---

## 4. 関連

- 原典スペック: `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md` §2.2 想定 AC / §8 苦戦箇所
- 関連タスク: UT-GOV-001（branch protection 本適用）/ UT-GOV-002（PR target safety gate）/ UT-GOV-004（required status checks context sync）
- GitHub Docs: "About code owners"
- GitHub REST API: `GET /repos/{owner}/{repo}/codeowners/errors`
