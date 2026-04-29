# Phase 5 成果物 — 実装ランブック

## 1. ランブック概要

UT-GOV-001 base case（案 A: gh api 直叩き + payload Git 管理）の **6 ステップランブック** を定義する。Step 0（前提確認）/ Step 1（snapshot）/ Step 2（adapter）/ Step 3（dry-run）/ Step 4（apply）/ Step 5（rollback リハーサル）/ Step 6（再適用）の順序を厳守し、dev / main は **bulk 化せず独立 PUT**。Step 4 / 5 / 6 の実 `gh api PUT` / DELETE は **Phase 13 ユーザー承認後** にのみ走る（user_approval_required: true）。本ファイルはコマンドを記述するが**実行は禁止**。

## 2. 状態（NOT EXECUTED テンプレ）

| ステップ | 状態 | 副作用 | Phase 13 承認 必須 |
| --- | --- | --- | --- |
| Step 0 前提確認 | NOT EXECUTED | なし | 不要（GET / 文書確認のみ） |
| Step 1 snapshot 取得 | NOT EXECUTED | なし（GET のみ） | 不要 |
| Step 2 adapter 正規化 | NOT EXECUTED | なし（jq のみ） | 不要 |
| Step 3 dry-run 差分 | NOT EXECUTED | なし（diff のみ） | 不要 |
| Step 4 apply (PUT × 2) | NOT EXECUTED | **GitHub 実値変更** | **必須** |
| Step 5 rollback リハーサル | NOT EXECUTED | **GitHub 実値変更** | **必須** |
| Step 6 再適用 + drift 検証 | NOT EXECUTED | **GitHub 実値変更** | **必須** |

## 3. Step 0: 前提確認（必須ゲート）

```bash
# UT-GOV-004 完了確認
ls docs/30-workflows/completed-tasks/ | rg "ut-gov-004"
gh issue view <UT-GOV-004 issue> --json state                # state: CLOSED
gh run list --workflow ci --limit 20 --json name | jq -r '.[].name' | sort -u

# Phase 13 ユーザー承認状態の確認
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-13/
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-GOV-004 task | `completed` | `pending`（同時完了で案 D 採用合意あり時のみ GO） |
| GitHub Issue | `CLOSED` | `OPEN` |
| `contexts` 候補 | UT-GOV-004 積集合済み | 未同期 / typo / 将来予定 job |
| Phase 13 承認 | 取得済み | 未取得（Step 4〜6 実行禁止） |

**1 件でも NO-GO → 実装着手禁止 → Phase 3 NO-GO 経由で UT-GOV-004 着手 or 案 D 切替。**

## 4. Step 1: snapshot 取得（lane 1 / 副作用なし）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection \
  > outputs/phase-13/branch-protection-snapshot-dev.json
gh api repos/{owner}/{repo}/branches/main/protection \
  > outputs/phase-13/branch-protection-snapshot-main.json
```

確認:

```bash
jq -e '.required_status_checks' outputs/phase-13/branch-protection-snapshot-dev.json
jq -e '.required_status_checks' outputs/phase-13/branch-protection-snapshot-main.json
```

> snapshot は **PUT 不可形式**（GET ネスト構造）。Phase 2 §5 の用途分離に従い監査用として永続保存。

## 5. Step 2: adapter 正規化（lane 2 / 副作用なし）

### 5.1 草案 → payload（design.md §2 写経 + UT-GOV-004 contexts 反映）

```bash
# design.md §2 を写経した payload 雛形を以下に保存
# outputs/phase-13/branch-protection-payload-dev.json
# outputs/phase-13/branch-protection-payload-main.json
# contexts 配列は UT-GOV-004 結果の積集合のみ採用（typo / 将来予定 job 名禁止）
# 案 D（2 段階適用）採用時は第 1 段階 payload で contexts=[] を強制
```

### 5.2 snapshot → rollback payload（jq 変換）

```bash
for branch in dev main; do
  jq '{
    required_status_checks: (.required_status_checks // null),
    enforce_admins: (.enforce_admins.enabled // false),
    required_pull_request_reviews: null,
    restrictions: (
      if .restrictions == null then null
      else {
        users: [.restrictions.users[].login],
        teams: [.restrictions.teams[].slug],
        apps:  [.restrictions.apps[].slug]
      } end),
    required_linear_history: (.required_linear_history.enabled // true),
    allow_force_pushes: (.allow_force_pushes.enabled // false),
    allow_deletions: (.allow_deletions.enabled // false),
    required_conversation_resolution: (.required_conversation_resolution.enabled // true),
    lock_branch: false,
    allow_fork_syncing: (.allow_fork_syncing.enabled // false)
  }' outputs/phase-13/branch-protection-snapshot-${branch}.json \
    > outputs/phase-13/branch-protection-rollback-${branch}.json
done
```

### 5.3 11 field 突合（T2 チェックリスト / Phase 4 §3.1 を Step 2 に転記）

```bash
for branch in dev main; do
  payload=outputs/phase-13/branch-protection-payload-${branch}.json
  jq -e '.required_status_checks' "$payload"
  jq -e '.enforce_admins | type == "boolean"' "$payload"
  jq -e '.required_pull_request_reviews == null' "$payload"
  jq -e '.restrictions == null or (.restrictions.users | all(type == "string"))' "$payload"
  jq -e '.required_linear_history | type == "boolean"' "$payload"
  jq -e '.allow_force_pushes == false' "$payload"
  jq -e '.allow_deletions == false' "$payload"
  jq -e '.required_conversation_resolution | type == "boolean"' "$payload"
  jq -e '.lock_branch == false' "$payload"
  jq -e '.allow_fork_syncing | type == "boolean"' "$payload"
done
```

> **コミット 1**: `chore(governance): generate UT-GOV-001 payload / rollback adapter outputs`

## 6. Step 3: dry-run 差分プレビュー（lane 3 / 副作用なし）

```bash
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-dev.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-dev.json) \
     | tee /tmp/ut-gov-001-diff-dev.txt

diff <(jq -S . outputs/phase-13/branch-protection-snapshot-main.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-main.json) \
     | tee /tmp/ut-gov-001-diff-main.txt
```

- 出力を `outputs/phase-13/apply-runbook.md §dry-run-diff` に転記。
- ユーザーレビュー承認を取得（Phase 13 user_approval ゲートの入力）。
- 確認: T1 が Green。

> **コミット 2**: `docs(governance): record UT-GOV-001 dry-run diff for dev / main`

## 7. Step 4: apply（lane 4 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ 本ワークフローでは**コマンドを記述するのみで実行禁止**。

```bash
# dev（独立 PUT）
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json \
  > outputs/phase-13/branch-protection-applied-dev.json

# main（独立 PUT・bulk 化禁止）
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-main.json \
  > outputs/phase-13/branch-protection-applied-main.json
```

確認:

```bash
jq -e '.url' outputs/phase-13/branch-protection-applied-dev.json
jq -e '.url' outputs/phase-13/branch-protection-applied-main.json
```

- T3（独立 PUT × 2 exit 0）が Green。
- 422 時: Step 2 へ戻し adapter field 漏れを再確認（Phase 6 異常系参照）。

> **コミット 3**: `chore(governance): record UT-GOV-001 apply result for dev / main`（applied JSON のみ）

## 8. Step 5: rollback リハーサル（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

### 8.1 通常 rollback（snapshot 相当へ復元）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-rollback-dev.json
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

### 8.2 緊急 rollback（`enforce_admins=true` 詰み時 / §8.4）

```bash
# 経路 A: enforce_admins サブリソース DELETE（最小破壊）
gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE

# 経路 B: rollback payload（enforce_admins=false 反映済み）を PUT
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

| 観点 | 値 |
| --- | --- |
| 担当者 | solo 運用のため**実行者本人**（apply-runbook.md に必須明記） |
| 連絡経路 | 手元 ssh / GitHub UI（Cloudflare 系 secrets を経由しない） |
| 確認 | T4（rollback 3 経路すべて exit 0）が Green |

## 9. Step 6: 再適用 + 二重正本 drift 検証

### 9.1 再適用（dev / main 独立 PUT × 2）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-main.json
```

### 9.2 二重正本 drift 検証（§8.6）

```bash
# 正本（GitHub 実値）と CLAUDE.md（参照）の整合
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_pull_request_reviews'
# => null

grep -E "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md
# => CLAUDE.md にヒット
```

### 9.3 案 D（2 段階適用）採用時の第 2 段階再 PUT

UT-GOV-004 完了通知後に以下を実行:

```bash
# 第 2 段階: contexts 入りの payload を再生成し再 PUT
# (1) outputs/phase-13/branch-protection-payload-{dev,main}.json の contexts を更新
# (2) Step 4 と同じ独立 PUT × 2
# (3) GET で contexts が UT-GOV-004 積集合と一致することを確認
```

> **第 2 段階完了が Phase 13 完了条件**（Phase 3 notes #1）。

> **コミット 4**: `docs(governance): record UT-GOV-001 rollback rehearsal log`

## 10. コミット粒度（4 分割）

| # | メッセージ | スコープ |
| --- | --- | --- |
| 1 | `chore(governance): generate UT-GOV-001 payload / rollback adapter outputs` | payload-{dev,main}.json + rollback-{dev,main}.json |
| 2 | `docs(governance): record UT-GOV-001 dry-run diff for dev / main` | apply-runbook.md §dry-run-diff |
| 3 | `chore(governance): record UT-GOV-001 apply result for dev / main` | applied-{dev,main}.json |
| 4 | `docs(governance): record UT-GOV-001 rollback rehearsal log` | rollback-rehearsal-log.md |

## 11. 実走境界（重要）

- **本ワークフローでは Step 4 / 5 / 6 の `gh api PUT` / DELETE を実行しない**。
- Step 1〜3 は副作用なしの GET / jq / diff のみで、Phase 13 承認前でも実走可能。ただし本 Phase の役割は仕様化のため、**実コマンドの実行は Phase 13 着手後の別オペレーションに限定**。
- 4 コミットも本ワークフローでは作成しない（Phase 13 ユーザー承認後の実走者が作成）。

## 12. 引き渡し（Phase 6 へ）

- 4 コミット粒度の分離が Phase 6 異常系（422 / contexts 不在 / lock_branch 誤投入 / 片側適用ミス / GET→PUT field drift）の前提
- Step 2 の 11 field チェックリストが Phase 6 T6〜T10 の入力
- Step 4〜6 の実 PUT 境界（Phase 13 ユーザー承認後のみ）が Phase 6 fail シナリオの実走条件
- T5（2 段階適用）の第 2 段階再 PUT を Phase 13 完了条件として申し送る
