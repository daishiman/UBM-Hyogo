# U-VIDX-02 他 skill indexes への verify gate 横展開判定 ADR - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | U-VIDX-02                                                           |
| タスク名     | 他 skill indexes への verify gate 横展開判定 ADR                    |
| 分類         | 設計判断 / ADR                                                      |
| 対象機能     | `.claude/skills/*/indexes` / `.github/workflows/verify-indexes.yml` |
| 優先度       | 中 (MEDIUM)                                                         |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | task-verify-indexes-up-to-date-ci AC-7                              |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

現行 `verify-indexes-up-to-date` の対象は AC-7 で `aiworkflow-requirements/indexes` に限定している。一方リポジトリには `task-specification-creator` 等、他 skill にも indexes 系生成物が存在する。横展開すべきか・するならどう拡張するかの判断が未着手。

### 1.2 問題点・課題

- 横展開有無の方針が文書化されていないため、新しい skill が追加されるたびに ad-hoc 判断が必要になる。
- `pnpm indexes:rebuild` の対象範囲と CI gate の対象範囲のずれが暗黙化している。

### 1.3 放置した場合の影響

- 他 skill 側の indexes drift が長期間気付かれない。
- gate 範囲を後から広げる際に過去 PR の drift 一括解消コストが膨張する。

---

## 2. 何を達成するか（What）

### 2.1 目的

他 skill indexes（`task-specification-creator` 等）に verify-gate を広げるか否かを ADR として明文化する。

### 2.2 最終ゴール

- ADR 1 本（`docs/` 配下）が作成され、対象範囲・採否理由・再評価条件が記述済み。

### 2.3 スコープ

#### 含むもの

- 対象候補 skill の棚卸し
- gate 化のメリット / コスト評価
- 採否判断と再評価トリガの記述

#### 含まないもの

- 実装作業（採用と判断された場合は別タスクで切り出し）

### 2.4 成果物

- ADR ファイル（`docs/` 配下、命名は既存 ADR 慣習に準拠）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `aiworkflow-requirements` 側の verify gate が稼働済み（U-VIDX-01 完了が望ましい）

### 3.2 依存タスク

- なし（U-VIDX-01 と並行可）

### 3.3 推奨アプローチ

1. `.claude/skills/*/indexes` を grep で棚卸し。
2. 各 skill の更新頻度・drift 影響度を評価。
3. 採否を ADR に記載し、PR で merge。

---

## 4. 完了条件

- [ ] 候補 skill の棚卸し結果が ADR に記述済み
- [ ] 採否判断と理由が明記されている
- [ ] 再評価条件（trigger）が記述済み

---

## 5. 関連仕様書リンク

- `.github/workflows/verify-indexes.yml`
- `.claude/skills/aiworkflow-requirements/indexes/`
- `.claude/skills/task-specification-creator/`
- task-verify-indexes-up-to-date-ci AC-7

---

## 6. 引き継ぎ先

採用判断の場合、後続実装タスクとして workflow 拡張タスクを切り出す。
