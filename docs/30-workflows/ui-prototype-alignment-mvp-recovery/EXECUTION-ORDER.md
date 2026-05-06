# 実行順 INDEX

ファイル名規約: `task-NN-w{wave}-{solo|par}-{name}.md`
- `wN`  : 実行 wave (W1〜W7)。**同じ wave 内のタスクは並列起動可**
- `solo`: その wave に他タスクがない（並列なし）
- `par` : 同 wave に並列 sibling あり

ディレクトリ番号 (01〜08) は **責務分類** であり、**実行順ではない**。

---

## Wave 一覧（クリティカルパス）

| wave | 並列度 | タスク | 着手条件 |
|---|---|---|---|
| **W1** | solo | task-01 | 即着手可 |
| **W2** | ×9 | task-02, task-03, task-06, task-07, task-08, task-19, task-20, task-21, task-22 | W1 完了後 |
| **W3** | ×2 | task-04, task-09 | W2 のうち task-03 / task-08 完了後 |
| **W4** | ×2 | task-05, task-10 | W3 完了後（+ task-02 完了済） |
| **W5** | ×5 | task-11, task-12, task-13, task-14, task-15 | W4 の task-10 完了後 |
| **W6** | ×2 | task-16, task-17 | W5 の task-15（admin layout）完了後 |
| **W7** | solo | task-18 | W6 まで全完了後 |

---

## 並列起動コマンド例

```text
# W2: 9 タスクを 9 worktree で並列起動
worktree-1 → task-02-w2-par-wrangler-env-injection.md
worktree-2 → task-03-w2-par-sentry-workers-sdk-unify.md
worktree-3 → task-06-w2-par-ui-ux-contract-rewrite.md
worktree-4 → task-07-w2-par-prototype-mapping-table.md
worktree-5 → task-08-w2-par-design-tokens-doc.md
worktree-6 → task-19-w2-par-primitives-full-spec.md
worktree-7 → task-20-w2-par-screen-blueprints-public-and-member.md
worktree-8 → task-21-w2-par-screen-blueprints-admin.md
worktree-9 → task-22-w2-par-shell-and-icons-and-fixtures.md

# W3: 2 タスク並列
worktree-1 → task-04-w3-par-window-guard-and-logger.md
worktree-2 → task-09-w3-par-tailwind-v4-setup.md

# W4: 2 タスク並列
worktree-1 → task-05-w4-par-error-boundary-and-staging-smoke.md
worktree-2 → task-10-w4-par-ui-primitives.md

# W5: 5 タスク並列
worktree-1 → task-11-w5-par-public-top-and-member-list.md
worktree-2 → task-12-w5-par-member-detail-register-legal.md
worktree-3 → task-13-w5-par-login-rebuild.md
worktree-4 → task-14-w5-par-my-profile-and-requests.md
worktree-5 → task-15-w5-par-admin-dashboard-and-members.md

# W6: 2 タスク並列
worktree-1 → task-16-w6-par-admin-tags-meetings-requests.md
worktree-2 → task-17-w6-par-admin-schema-conflicts-audit.md

# W7: solo
worktree-1 → task-18-w7-solo-verify-tokens-and-playwright-smoke.md
```

---

## DAG（mermaid）

```mermaid
flowchart LR
  T01[task-01<br/>W1 solo<br/>scope gate]

  T02[task-02<br/>W2 par<br/>env]
  T03[task-03<br/>W2 par<br/>sentry]
  T06[task-06<br/>W2 par<br/>ui-ux contract]
  T07[task-07<br/>W2 par<br/>prototype map]
  T08[task-08<br/>W2 par<br/>design tokens]
  T19[task-19<br/>W2 par<br/>09c primitives]
  T20[task-20<br/>W2 par<br/>09e/09f public+member]
  T21[task-21<br/>W2 par<br/>09g admin]
  T22[task-22<br/>W2 par<br/>09d/09h icons+shell+fixtures]

  T04[task-04<br/>W3 par<br/>window+logger]
  T09[task-09<br/>W3 par<br/>tailwind setup]

  T05[task-05<br/>W4 par<br/>error+smoke]
  T10[task-10<br/>W4 par<br/>ui primitives]

  T11[task-11<br/>W5 par<br/>public top+list]
  T12[task-12<br/>W5 par<br/>detail+register]
  T13[task-13<br/>W5 par<br/>login]
  T14[task-14<br/>W5 par<br/>my profile]
  T15[task-15<br/>W5 par<br/>admin dash+members]

  T16[task-16<br/>W6 par<br/>tags+meetings+requests]
  T17[task-17<br/>W6 par<br/>schema+conflicts+audit]

  T18[task-18<br/>W7 solo<br/>verify+smoke]

  T01 --> T02 & T03 & T06 & T07 & T08 & T19 & T20 & T21 & T22
  T03 --> T04
  T08 --> T09
  T02 & T03 & T04 --> T05
  T08 & T09 --> T10
  T19 & T22 --> T10
  T10 --> T11 & T12 & T13 & T14 & T15
  T20 --> T11 & T12 & T13 & T14
  T21 --> T15 & T16 & T17
  T22 --> T11 & T12 & T13 & T14 & T15
  T15 --> T16 & T17
  T05 & T11 & T12 & T13 & T14 & T16 & T17 --> T18
```

---

## ディレクトリ番号 vs Wave 番号の対応

ディレクトリ番号は **責務分類** で、wave とは別軸です。混同しないように。

| dir | 含むタスク | 含む wave |
|---|---|---|
| 01-scope | task-01 | W1 |
| 02-runtime | task-02..05 | **W2 / W3 / W4 に分散** |
| 03-spec-source | task-06..08, task-19..22 | W2 |
| 04-design-system | task-09, 10 | W3, W4 |
| 05-screens-public | task-11, 12 | W5 |
| 06-screens-member | task-13, 14 | W5 |
| 07-screens-admin | task-15..17 | W5, W6 |
| 08-regression | task-18 | W7 |

→ **「02-runtime を全部終えてから 03-spec-source」は誤り**。W2 で 02-runtime の task-02/03 と 03-spec-source の task-06/07/08 を**同時並列**で進めるのが最速。

---

## 直列実行を選ぶ場合

solo dev で worktree 並列運用が重い場合は、wave 順 + 番号順で直列実行しても問題ありません。

```text
task-01 → 02 → 03 → 06 → 07 → 08 → 19 → 20 → 21 → 22
       → 04 → 09
       → 05 → 10
       → 11 → 12 → 13 → 14 → 15
       → 16 → 17
       → 18
```

直列の場合は約 14 人日、最大並列の場合は約 6〜8 人日が見込みです。

---

## 各タスクの自己完結性

各 task ファイルの **§0. 自己完結コンテキスト** を読めば、`outputs/phase-1..3.md` を再度開かずに着手可能です。
phase-1..3.md は**ワークフロー設計者向けの上位文書**であり、実装時は task ファイル 1 枚で完結します。
