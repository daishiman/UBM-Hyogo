# Governance Drift 別 Issue 起票テンプレート

> **読み込み条件**: `gh api repos/{owner}/{repo}/branches/{branch}/protection` の出力と、
> CLAUDE.md / governance 仕様（UT-GOV-001 / UT-GOV-003 等）が定める expected 値の間で
> drift を検出した場合（`enforce_admins` / `lock_branch` / `required_pull_request_reviews` /
> `required_status_checks.contexts` / `required_linear_history` /
> `required_conversation_resolution` 等）。
> e2e-quality-uplift stage-3-impl サブタスク 3c (branch-protection-contexts) で確立した
> 運用方針 O-2 を正本テンプレ化したもの。
> **更新タイミング**: governance 仕様の expected 値が変わったとき、または
> branch protection が新フィールド（次世代 ruleset 等）を追加したとき。

---

## Rationale: 「同 PR で修正を押し付けない」運用ルール

drift を検出した PR の中で governance 値（`enforce_admins` 等）を **同時に修正しない**。
理由は以下の3点。

1. **scope creep 防止**: 元 PR の主題（例: e2e quality uplift）と branch protection 変更は
   レビュー観点が異なる。混ぜると revert 単位が壊れる。
2. **gh api -X PUT の独立 audit**: governance 変更は `before JSON` / `after JSON` /
   実行コマンドを単独 PR で証跡化する必要があり、機能 PR の diff に埋もれさせない。
3. **ユーザー明示承認 gate**: CLAUDE.md (UT-GOV-001) は `gh api -X PUT` 実行を
   ユーザー明示承認後のみと定めている。機能 PR の自動マージで誤発火させない。

→ 検出側 PR は **read-only evidence (before JSON) と本テンプレによる別 Issue 起票** に留める。
   修正は別 PR / 別タスクで実施する。

---

## Issue タイトル規約

```
[governance-drift] <field> mismatch on <branch>
```

例:

- `[governance-drift] enforce_admins mismatch on main`
- `[governance-drift] required_status_checks.contexts missing audit-correlation-verify on dev`
- `[governance-drift] lock_branch mismatch on main`

複数 field が同時に drift している場合は **field ごとに別 Issue** を立てる
（修正粒度を field 単位に揃え、後追い検証を容易にするため）。

---

## Labels（必須）

```
governance
drift
branch-protection
```

優先度ラベル（`priority:high` / `priority:medium`）は drift 種別に応じて付与:

| field | 推奨 priority |
|-------|---------------|
| `enforce_admins` (false 化) | high |
| `lock_branch` (true 化) | high |
| `required_pull_request_reviews` (solo policy 違反) | high |
| `required_status_checks.contexts` 欠落 | medium |
| `required_linear_history` (false 化) | medium |
| `required_conversation_resolution` (false 化) | medium |

---

## Body 必須項目

```markdown
## 検出元
- detection_wave: <例: e2e-quality-uplift stage-3-impl サブタスク 3c>
- detection_pr: #<pr_number>（drift を発見した機能 PR）
- detection_command: `gh api repos/{owner}/{repo}/branches/<branch>/protection`
- detected_at: <ISO8601 timestamp>

## Drift Field
- field: `<field path、例: enforce_admins / required_status_checks.contexts>`
- branch: `<dev | main>`

## Before JSON（実測値・read-only 取得）
```json
{
  "<field>": <actual_value>
}
```

## Expected JSON（CLAUDE.md / 仕様正本）
```json
{
  "<field>": <expected_value>
}
```

仕様根拠: <CLAUDE.md セクション or docs/30-workflows/ut-gov-*/index.md 該当行>

## Proposed Remediation（別 PR で実施）
```bash
# read-only 再確認
gh api repos/{owner}/{repo}/branches/<branch>/protection > before.json

# 修正コマンド（ユーザー明示承認後のみ実行）
gh api -X PUT repos/{owner}/{repo}/branches/<branch>/protection \
  -H "Accept: application/vnd.github+json" \
  --input remediation-payload.json

# 適用後検証
gh api repos/{owner}/{repo}/branches/<branch>/protection > after.json
diff before.json after.json
```

## Blocking Gate
- [ ] ユーザー明示承認取得済み
- [ ] before.json / after.json を別 PR にコミット
- [ ] 関連 required status check（例: `audit-correlation-verify`）が green
- [ ] 検出元 PR (#<detection_pr>) に本 Issue を `Refs #<this_issue>` でクロスリンク

## 同 PR 修正押し付け禁止 Rationale（運用 O-2）
本 Issue は **検出元 PR とは独立した PR で remediation する** こと。
理由は references/governance-drift-issue-template.md の Rationale セクション参照。
```

---

## 自動 Cross-Ref フォーマット

検出元 PR / 親 Issue / 関連 governance 仕様への双方向リンクは以下フォーマットで残す。

| 方向 | 残す場所 | 文面 |
|------|----------|------|
| 検出元 PR → 本 Issue | PR description 末尾 | `governance drift detected: Refs #<this_issue> （別 PR で remediation）` |
| 本 Issue → 検出元 PR | 本 Issue body `## 検出元` | `detection_pr: #<pr_number>` |
| 本 Issue → 仕様正本 | 本 Issue body `仕様根拠` | `CLAUDE.md L<line>` or `docs/30-workflows/ut-gov-001-*/index.md#<anchor>` |
| remediation PR → 本 Issue | remediation PR description | `Closes #<this_issue>` |

`Closes` / `Fixes` は **remediation PR からのみ** 使う。検出元 PR からは
`Refs` のみで参照（closed-issue-reference-pattern.md と整合）。

---

## クローズ条件

- remediation PR がマージされ、`gh api repos/{owner}/{repo}/branches/<branch>/protection`
  の after JSON が expected JSON と一致する。
- after JSON が remediation PR にコミットされ、`audit-correlation-verify` 等の
  required status check が green。
- 関連する governance 仕様（CLAUDE.md / `docs/30-workflows/ut-gov-*`）に
  drift 履歴と是正日が追記されている（regression 検知用）。

---

## gh CLI 実行例

```bash
# Issue 作成（field 単位）
gh issue create \
  --title "[governance-drift] enforce_admins mismatch on main" \
  --label "governance,drift,branch-protection,priority:high" \
  --body-file /tmp/governance-drift-body.md

# 関連 PR への cross-ref コメント
gh pr comment <detection_pr> \
  --body "governance drift detected on \`main.enforce_admins\`. 別 PR で remediation: Refs #<this_issue>"
```

---

## Required status check 追加パターン（task-18 W7 / 2026-05-12 追記）

新規 CI workflow を `required_status_checks.contexts` に乗せる際の運用は、別 Issue / 別 PR で扱う:

1. **workflow を `dev` で 1 回成功 run させる**（GitHub branch protection は registered check のみ評価。未 run の context を required に追加すると PR が永遠に未充足になる）
2. **`gh api repos/<owner>/<repo>/commits/<sha>/check-runs > outputs/phase-11/check-runs.txt`** で context name 完全一致を確認
3. **pre snapshot** を取得（`outputs/phase-11/branch-protection-{dev,main}-pre.json`）
4. **PUT payload は read response を normalize** し、`required_status_checks.contexts` だけ append。`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` を保全
5. **user approval を経て `dev` 先行 PUT → invariants verify → `main` PUT** の順序
6. **post snapshot** を保存（`outputs/phase-11/branch-protection-{dev,main}-post.json`）

例（task-18 W7 候補 3 件）:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`

Issue body は drift Issue と同じ「Read-only context / Required mutation / Constraints / Evidence paths / User approval requirement」構造を踏襲し、`gh api -X PUT` の実行は user approval を marker file（`outputs/phase-13/user-approval-<task>-<timestamp>.md`）で確定させた後に限る。

## 既存テンプレとの責務分離

| テンプレ | 対象 | 違い |
|----------|------|------|
| `d1-parity-followup.md` | 親タスク outputs に runtime evidence placeholder が残った場合 | execution-only 子 Issue（実行依頼） |
| `scheduled-reminder-issue-pattern.md` | cron schedule 起点の reminder | 時刻ベース冪等起票 |
| `closed-issue-reference-pattern.md` | CLOSED Issue を後続 PR から参照する作法 | 参照規約のみ（起票なし） |
| **本テンプレ** | branch protection drift 検出時 | **drift 修正の別 Issue 化（同 PR 修正禁止）** |

責務が重ならないため新規ファイルとして追加。
