# Phase 8: Before / After 差分集

仕様書品質のリファクタ前後を 3 セクションで記録する。

---

## 1. 用語統一表

本タスク内で用いる正規語彙を以下に固定する。以後の phase / outputs / commit message
すべてで同じ語を使うこと。

| 正規語 | 定義 | 同義語（廃止） |
| --- | --- | --- |
| ledger | skill 配下で複数 worktree が共有する **可変ファイル**の総称（LOGS.md / keywords.json / SKILL-changelog.md など） | 共有ファイル / 共有状態ファイル / state file |
| fragment | A-2 適用後の **分割された個別ファイル**。1 worktree につき 1 ファイル新規作成され、追記しない | entry / shard / chunk / log file |
| runbook | 別タスク（実装タスク）が読んで実行する **手順書** | 手順書 / 実行手順 / playbook |
| initiative | A-1 / A-2 / A-3 / B-1 の各 **施策** | 施策 / measure / action |
| 200 行閾値 | A-3 における SKILL.md の上限行数 | 200LOC / 200 limit |

---

## 2. 重複統合 Before / After

### 2-1. fragment 命名規約の 2 重記述

**Before**:

- `phase-02.md` に fragment 命名規約を記載
- `phase-06.md` のランブック冒頭にも同じ命名規約を再掲（コピー）
- 将来の更新時に片側のみ修正される事故リスク

**After**:

- `outputs/phase-2/fragment-schema.md` を **唯一の正本**とする
- `phase-06.md` および `outputs/phase-6/fragment-runbook.md` では
  「命名規約は `outputs/phase-2/fragment-schema.md` を参照」と 1 行リンクのみ残す
- 正規表現 `^LOGS/\d{8}-\d{6}-[a-z0-9-]+-[a-z0-9]{6}\.md$` も phase-02 を正本化

### 2-2. AC 文言コピペ

**Before**: AC-1〜AC-9 が index.md / phase-01 / phase-07 / phase-09 で微妙に揺れる
**After**: index.md を正本化し、他 phase は AC 番号のみ引用（文言を再掲しない）

---

## 3. リンク整備 Before / After

| 箇所 | Before | After |
| --- | --- | --- |
| phase-04 → phase-2 file-layout 参照 | `../phase-2/file-layout.md`（相対不正） | `outputs/phase-2/file-layout.md` |
| phase-11 → phase-04 sim 参照 | `phase-4/parallel-commit-sim.md`（タスク相対） | `outputs/phase-4/parallel-commit-sim.md` |
| phase-07 → AC マトリクス | リンクなし（記述のみ） | `index.md#受入条件-ac` へアンカーリンク |
| phase-12 → documentation-changelog | 別 phase からの参照欠落 | phase-08 main.md / phase-13 change-summary.md からリンク追加 |

---

## 4. 表記揺れ修正

| 修正前 | 修正後 |
| --- | --- |
| `A1` / `A_1` / `A.1` | `A-1` |
| `gitignore化` / `git-ignore 化` | `gitignore 化` |
| `merge=union driver` / `merge union` | `merge=union ドライバ` |
| `worktree並列` / `並列worktree` | `worktree 並列` |
| `200行` / `200LOC` | `200 行` |

---

## 5. リファクタ対象外（明示）

- 各 phase の「目的」「実行タスク」本文の論理: 内容は触れず、用語のみ揃える
- artifacts.json の構造: schema 互換のため変更しない
- 参照資料一覧の項目数: index.md の表を正本とし phase 側は同期するのみ
