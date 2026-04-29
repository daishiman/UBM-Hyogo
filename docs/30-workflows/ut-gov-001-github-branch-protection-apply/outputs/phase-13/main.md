# Phase 13 成果物 — PR 作成 / ユーザー承認後 PUT 実行（NOT EXECUTED）

> **本 Phase は user の二重明示承認後にのみ実行される。**
> Phase 13 完了時点では本ファイルおよび他成果物は未コミット状態で待機する。
> `git commit` / `git push` / `gh pr create` / `gh api PUT` は user 明示指示があるまで一切実行しない。
> **`user_approval_required: true`**

## メタ

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | spec_created |
| taskType | implementation / NON_VISUAL / github_governance |
| user_approval_required | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |
| 作成日 | 2026-04-28 |

## 1. 承認ゲート（最優先）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 状態（artifacts.json） | `completed` | 確認済 |
| Phase 4〜10 状態 | `pending`（仕様書整備のみのため） | 確認済 |
| Phase 11 必須 3 outputs | main.md / manual-smoke-log.md / link-checklist.md | 要 final 確認 |
| Phase 12 必須 5+1 outputs | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report | 要 final 確認 |
| local-check（docs validator） | PASS | 要実行 |
| `1Password secret URI` 混入 | 0 件 | 要 grep 確認 |
| 計画系 wording 残存 | 0 件 | 要 grep 確認 |
| UT-GOV-004 completed | 実 PUT の上流前提（5 重明記の 5 箇所目を本ファイル STEP 0.1 で再確認） | **要確認** |
| 親タスク Phase 13 承認 | task-github-governance-branch-protection 承認済 | 要確認 |
| **user 明示承認（PR 作成）** | user から「PR を作成してよい」 | **承認待ち** |
| **user 明示承認（実 PUT 実行）** | user から「実 PUT を実行してよい」（PR 作成承認とは独立） | **承認待ち** |

## 2. 承認後オペレーション 1: PR 作成（docs-only PR）

### 2-1. local-check 実行

```bash
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-13/

test ! -d docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/screenshots && echo "OK"

rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/ \
  || echo "計画系 wording なし"
rg -n "1Password secret URI" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"

rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=|gho_|ghp_" docs/30-workflows/ut-gov-001-github-branch-protection-apply/ \
  || echo "Secret 混入なし"

node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-001-github-branch-protection-apply
```

### 2-2. PR 作成（user 明示承認後のみ実行）

`phase-13.md` §「PR 作成コマンド」を実行する。`title` / `base=dev` / `Refs #144` を厳守。

## 3. 承認後オペレーション 2: 実 PUT 実行（PR マージ後 / user 二重承認後）

### STEP 0.1: UT-GOV-004 完了確認（5 重明記の 6 箇所目）

```bash
# UT-GOV-004 (required_status_checks.contexts 同期) completed か再確認
# 未完了なら：
#   - 完了待機 OR
#   - contexts=[] で 2 段階適用に切替（先行 PUT → UT-GOV-004 完了後再 PUT）
```

### STEP 0.2: gh auth スコープ確認

```bash
gh auth status
# administration:write スコープが付与されていることを確認
```

### STEP 1: dry-run プレビュー

Phase 11 manual-smoke-log.md STEP 1 と同一系列を実走し、以下を生成・確認：

- `outputs/phase-13/branch-protection-snapshot-{dev,main}.json`（lane 1 / GET 形）
- `outputs/phase-13/branch-protection-payload-{dev,main}.json`（lane 2 / adapter 出力 / 草案 design.md §2 に UT-GOV-004 同期済 contexts を埋め込み）
- `outputs/phase-13/branch-protection-rollback-{dev,main}.json`（lane 2 / snapshot を adapter 通過）
- `diff -S` で intended diff のみであることを `apply-runbook.md` §dry-run-diff に記録

### STEP 2: 実適用（dev / main 独立 PUT、bulk 化禁止）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT \
  --input outputs/phase-13/branch-protection-payload-dev.json \
  > outputs/phase-13/branch-protection-applied-dev.json

gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  --input outputs/phase-13/branch-protection-payload-main.json \
  > outputs/phase-13/branch-protection-applied-main.json
```

期待結果: HTTP 200 / `applied-{branch}.json` が保存される。

### STEP 3: GET 実値確認

Phase 11 manual-smoke-log.md STEP 3 と同一の 9 項目を実行し、各 field の期待値を確認。

### STEP 4: CLAUDE.md grep 一致確認（二重正本 drift 検証）

Phase 11 manual-smoke-log.md STEP 4 と同一系列を実行。drift 検出時は **GitHub 実値ではなく CLAUDE.md** を訂正する後追い PR を起こす。

### STEP 5: rollback リハーサル + 再適用

```bash
# rollback リハーサル
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT --input outputs/phase-13/branch-protection-rollback-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-rollback-main.json

# 再適用（元の payload に戻す）
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-payload-main.json
```

実走ログを `outputs/phase-13/rollback-rehearsal-log.md` に記録（コマンド / HTTP status / 実応答抜粋 / 復元確認）。

### STEP 6: apply-runbook.md / rollback-rehearsal-log.md 確定

実走ログ・dry-run diff・緊急 rollback 2 経路（DELETE / `enforce_admins=false` PUT）・連絡経路（手元 ssh + GitHub UI 二重）・rate limit 待機規約を `outputs/phase-13/apply-runbook.md` に集約。

### STEP 7: 後追い PR（実 PUT 結果 commit）

`outputs/phase-13/` 配下の以下 10 ファイルを後追い PR で commit：

- `branch-protection-snapshot-{dev,main}.json`（2）
- `branch-protection-payload-{dev,main}.json`（2）
- `branch-protection-rollback-{dev,main}.json`（2）
- `branch-protection-applied-{dev,main}.json`（2）
- `apply-runbook.md`
- `rollback-rehearsal-log.md`

後追い PR で Issue #144 をクローズ（`Closes #144`）。

## 4. PR 草案サマリ

詳細は `phase-13.md` §「PR テンプレ」を参照。要点：

- title: `docs(workflow): add UT-GOV-001 GitHub branch protection apply Phase 11-13 task spec (Issue #144)`
- base: `dev`
- linked: `Refs #144`（クローズは後追い PR で）
- labels: `area:docs` / `task:ut-gov-001` / `wave:0` / `governance`

## 5. ブロック条件

- user 承認（PR 作成 / 実 PUT のいずれか）が無い → 該当オペレーション一切実行しない
- local-check FAIL → Phase 12 差戻し
- 計画系 wording / `1Password secret URI` / Secret 混入 1 件以上 → 即時停止 / Phase 12 再実施
- UT-GOV-004 未完了で `contexts=[]` 2 段階適用にも切替できない → UT-GOV-004 完了待機
- `enforce_admins=true` 詰みが発生 → 緊急 rollback 2 経路（DELETE / `enforce_admins=false` PUT）即時実行

## 6. 完了条件（実 PUT 完了後）

- [ ] PR が作成され `Refs #144` でリンク
- [ ] PR がマージされる（user 操作）
- [ ] user 明示承認（実 PUT）を取得
- [ ] STEP 0〜6 全 PASS
- [ ] `outputs/phase-13/` に snapshot / payload / rollback / applied JSON 8 件 + apply-runbook.md + rollback-rehearsal-log.md が揃う
- [ ] CLAUDE.md ↔ GitHub 実値 grep 一致確認 PASS（drift 0）
- [ ] 後追い PR が `Closes #144` でマージされる
- [ ] artifacts.json の Phase 13 が `completed` に更新される

## 7. 関連

- Phase 11 4 ステップ smoke 正本: [../phase-11/manual-smoke-log.md](../phase-11/manual-smoke-log.md)
- Phase 12 implementation-guide: [../phase-12/implementation-guide.md](../phase-12/implementation-guide.md)
- Phase 12 documentation-changelog: [../phase-12/documentation-changelog.md](../phase-12/documentation-changelog.md)
- Phase 2 設計（adapter / rollback 3 経路）: [../phase-02/main.md](../phase-02/main.md)
- 親仕様: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/144
