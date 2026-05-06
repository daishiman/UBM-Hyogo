# Phase 7 — コード実装手順

**[実装区分: 実装仕様書]**

> **本仕様書はコード実装の指示書である**。後続の実装プロンプト（03.実装.md など）はこの Phase 7〜10 の手順に沿って実装する。**本プロンプトでは実装そのものは行わない**（CONST_002）。

## 1. 実装タスク順

T-03 → T-02 → T-01 → T-04 → T-05 → T-06 → T-07 → T-08（T-09 は最終 lint）

## 2. T-03: Issue body テンプレ作成

- パス: `scripts/observation/reminder-issue-template.md`
- 内容: Phase 5 §3.1 の本文を**そのまま**配置
- placeholder: `{{RELEASE_DATE}}` / `{{OFFSET}}` / `{{TARGET_DATE}}`

検証:
```sh
test -f scripts/observation/reminder-issue-template.md
grep -c '{{RELEASE_DATE}}' scripts/observation/reminder-issue-template.md   # >=1
grep -c '{{OFFSET}}' scripts/observation/reminder-issue-template.md         # >=2 (title + body)
```

## 3. T-02: shell 作成

- パス: `scripts/observation/create-reminder-issue.sh`
- 内容: Phase 5 §2.1 のスクリプトを基本に、テスト容易性のため `today_iso()` を以下に差し替え:

```sh
today_iso() { echo "${TODAY_OVERRIDE:-$(date -u +%Y-%m-%d)}"; }
```

- 実行権限付与: `chmod +x scripts/observation/create-reminder-issue.sh`

検証:
```sh
shellcheck scripts/observation/create-reminder-issue.sh
bash -n scripts/observation/create-reminder-issue.sh
test -x scripts/observation/create-reminder-issue.sh
```

## 4. T-01: workflow YAML 作成

- パス: `.github/workflows/post-release-observation-reminder.yml`
- 内容: Phase 5 §1.1 を**そのまま**配置

検証:
```sh
actionlint .github/workflows/post-release-observation-reminder.yml
```

## 5. T-04: 手動 checklist 手順

- パス: `scripts/observation/check-thresholds.md`
- 内容: 担当者向けに次の構成で記述:

```markdown
# Post-Release Long-Term Observation — 手動チェック手順

## 前提
- reminder Issue が GitHub Actions により自動起票されている前提

## 手順
1. Cloudflare dashboard → Workers → Analytics で req/day を取得
2. `bash scripts/cf.sh d1 insights ubm-hyogo-db-prod --env production` で D1 reads/writes を取得
3. `gh run list --workflow=post-release-dashboard.yml --limit 14 --json conclusion`
4. authz smoke: `curl -i https://api.../admin/me` (no token) → 401/403 確認
5. 取得値を reminder Issue の表に記入し判定
6. CRITICAL の場合 `docs/runbooks/post-release-long-term-observation.md` §4 へ
```

検証:
```sh
test -f scripts/observation/check-thresholds.md
rg -c "Cloudflare" scripts/observation/check-thresholds.md   # >=1
```

## 6. T-05: runbook 作成

- パス: `docs/runbooks/post-release-long-term-observation.md`
- 構成: Phase 5 §4 の H2 構成（1〜7）。本文は Phase 1 の表 / Phase 4 の方針を流用しつつ、**operations 担当者単独で読み解ける**ように完結性を担保する。
- §5（rollback 連携）には 09c runbook の絶対パスを書く: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/`

検証:
```sh
test -f docs/runbooks/post-release-long-term-observation.md
rg -n "^## [0-9]" docs/runbooks/post-release-long-term-observation.md | wc -l   # ==7
```

## 7. T-06: SSOT reference 作成

- パス: `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md`
- 内容: Phase 5 §5 のテンプレを配置（frontmatter + 概要 + リンク）

検証:
```sh
test -f .claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md
rg -n "^topic: post-release-long-term-observation" .claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md
```

## 8. T-07: aiworkflow indexes 更新

4 ファイルを同期する。手編集対象は `resource-map.md` / `quick-reference.md`、生成対象は `topic-map.md` / `keywords.json` とする:

### 8.1 `resource-map.md`

クイックルックアップに Issue #350 行を追加（既存の markdown table 形式に合わせる）:
```markdown
| Issue #350 D+7 / D+30 long-term production observation | `docs/30-workflows/issue-350-long-term-production-observation/index.md`, `references/post-release-long-term-observation.md` | `.github/workflows/post-release-observation-reminder.yml`, `scripts/observation/` |
```

### 8.2 `quick-reference.md`

```markdown
### Issue #350 Long-term Production Observation（2026-05-06）
```

### 8.3 `topic-map.md` / `keywords.json`

`pnpm indexes:rebuild` により `references/post-release-long-term-observation.md` から生成する。

検証:
```sh
mise exec -- pnpm indexes:rebuild   # 成功すること
git diff .claude/skills/aiworkflow-requirements/indexes
```

## 9. T-08: 09c trace 書換

- パス: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- 該当行: `task-09c-long-term-production-observation-001` を含む行
- 書換: 末尾に **`→ consumed by issue-350-long-term-production-observation (2026-05-06)`** を追記。**行を削除しない**（trace 保持）。

検証:
```sh
rg -n "consumed by issue-350-long-term-production-observation" \
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md
```

## 10. 完了条件（Phase 7）

- [ ] 全ファイル 8 種が path 通りに作成済
- [ ] T-09: `actionlint` / `shellcheck` exit 0
- [ ] `pnpm indexes:rebuild` exit 0
- [ ] git diff が想定変更ファイル一覧（Phase 3 §2）と完全一致
