# Phase 1: 要件定義

## 目的

`ui-prototype-alignment-mvp-recovery` 配下の 22 タスクを 4 条件で評価し、`22 × 4 = 88` セルの matrix を `VERIFICATION-STATUS.md` に出力するための要件を固定する。

---

## 1. タスク分類

| 分類軸 | 値 |
|--------|-----|
| 種別 | docs-only task |
| visual classification | NON_VISUAL（UI 変更なし） |
| implementation_mode | `verify_existing`（upstream task-01〜22 完了済み） |
| 主成果物 | `VERIFICATION-STATUS.md` 単一 markdown |

---

## 2. スコープ in

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-*.md` 〜 `task-05-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-*.md` 〜 `task-08-*.md`, `task-19-*.md` 〜 `task-22-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-*.md`, `task-10-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-*.md`, `task-12-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-13-*.md`, `task-14-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-*.md` 〜 `task-17-*.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-*.md`

## 3. スコープ out

- 22 タスクの spec / 実装の書き換え（read-only）
- 新規 task spec の追加
- CI gate の改修
- task-24〜26（並列タスク）の matrix への merge

---

## 4. 受入条件（DoD）

1. `VERIFICATION-STATUS.md` が `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` 直下に存在する
2. 22 行 × 4 列 = 88 セルすべてが PASS / WARN / FAIL / N/A のいずれかで埋まっている
3. WARN / FAIL のセルには 1 行の理由が付与されている
4. GFM table 構文として有効（preview で崩れない）
5. 「凡例」「評価日付」「評価者」「参照 commit / branch」セクションを matrix の前に含む
6. 88 セル中 PASS 比率を末尾サマリーに記載する

---

## 5. 検証 4 条件の定義（厳密化）

| # | 条件 | 評価方法 |
|---|------|----------|
| C1 | 矛盾なし | task spec の「不変条件」「DoD」が、関連 spec / 実装と論理的に矛盾しない |
| C2 | 漏れなし | spec の「変更対象ファイル」「成果物」が、対応する `outputs/` 配下 / 実装ファイルに揃っている |
| C3 | 整合性あり | spec のシグネチャ・型名・命名規約と実装の identifier が一致 |
| C4 | 依存関係整合 | 上流依存タスクが PASS 状態で完了している（依存表が spec と DAG で一致） |

---

## 6. 既存コードベース命名規則

- task spec ファイル名: `task-NN-wWAVE-{par|solo}-<slug>.md`（kebab-case）
- 出力 matrix 行 ID: `task-NN`
- 出力 matrix 列見出し: `C1: 矛盾なし` / `C2: 漏れなし` / `C3: 整合性あり` / `C4: 依存関係整合`

---

## 7. 不変条件

1. 既存 spec / 実装は read-only
2. matrix は GFM の単一テーブルで表現
3. 88 セルすべてに値（空欄禁止）

---

## 8. carry-over 確認

`git log --oneline -5` で前タスクの状態を確認し、本タスクは「新規 markdown 1 件追加 + 本ワークフロー内 Phase outputs 一式」以外の差分を持たないことを確認する。

## 9. 成果物

- `outputs/phase-1/requirements.md`（本ファイルの確定版を出力）
