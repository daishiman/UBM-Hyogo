# 公開 members list の tags 一括取得 N+1 防止 - タスク指示書

## メタ情報

```yaml
issue_number: 224
```

| 項目         | 内容                                                |
| ------------ | --------------------------------------------------- |
| タスクID     | 04a-followup-005-public-tags-batch-fetch-n1-prevention |
| タスク名     | 公開 members list の tags 一括取得 N+1 防止          |
| 分類         | 改善（パフォーマンス）                              |
| 対象機能     | `/public/members` の tag 展開対応                   |
| 優先度       | 低                                                  |
| 見積もり規模 | 小規模                                              |
| ステータス   | 未実施                                              |
| 発見元       | 04a Phase 12 unassigned-task-detection (U-5)        |
| 発見日       | 2026-04-29                                          |
| 着手条件     | members list で tag を展開する要望が出た時点        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a 時点で member-tag 取得は member 1 件単位（detail 経路）で行う設計に留めた。`/public/members` (list) は tags を返さない。将来 list に tag 表示要望が出た場合、素直に書くと `members 数 × tags 取得 SQL` の N+1 になる。

### 1.2 問題点・課題

- list での tag 展開は per-member SQL が現実的でない（D1 latency × N）
- 一方で 04a 時点で `IN (...)` 一括取得 helper を入れるのは over-engineering（list で tag が要らないため）

### 1.3 放置した場合の影響

- 要望対応時に「list の tag 表示」をうっかり N+1 で実装してしまう
- D1 query budget を急速に消費

---

## 2. 何を達成するか（What）

### 2.1 目的

`/public/members` で tag 展開要望が来た時、member_id IN (...) の 1 query で全 member 分の tags を取得し、view-model 側で tag を member に bind する仕組みを用意する。

### 2.2 完了状態

- `getTagsForMembers(memberIds: string[])` 相当の repository helper が存在
- list view-model converter が tags を member に bind する
- N+1 が発生しないことを test で保証する

### 2.3 スコープ

#### 含むもの

- repository への一括取得 helper 追加
- list view-model converter の拡張（tags field の有無を query param `expand=tags` で制御推奨）
- contract test での N+1 検証（query 回数 assert）

#### 含まないもの

- detail 経路の見直し（既存維持）
- tag 自体の admin 管理（admin-managed data 範囲）

### 2.4 成果物

- `apps/api/src/repository/publicMembers.ts` への helper 追加
- view-model 側の拡張
- query param `expand` の zod schema 追加（`packages/shared` に置くなら 04a-followup-003 と整合）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 公開 list に tag 表示要望が確定している
- 04a-followup-003（query parser shared 化）と整合する `expand` パラメータ設計を共有
- tag テーブル（`member_tags` or 同等）の schema が確定している

### 3.2 実行手順

1. `expand=tags` パラメータを query schema に追加
2. `getTagsForMembers(ids)` を repository に追加（`WHERE member_id IN (?)` の 1 query）
3. converter で memberId → tags の Map を作成し、各 member に bind
4. visibility filter（tag 自体の visibility がある場合）を経由
5. contract test で `expand=tags` 指定時の query 回数を assert（ベスト 1〜2 query 以内）

### 3.3 受入条件 (AC)

- AC-1: `/public/members?expand=tags` で全 member の tags が返る
- AC-2: D1 query 回数が `members 取得 + tags 一括取得` の 2 回以内
- AC-3: `expand=tags` を指定しない場合は tags が response に含まれない（既存挙動維持）
- AC-4: leak 防御（responseEmail 等）と visibility filter は維持される
- AC-5: contract test で N+1 リグレッションを検知できる（query 回数 assert）

---

## 4. 苦戦箇所 / 学んだこと（04a で得た知見）

### 4.1 「いつ N+1 防止を入れるか」

04a では「現状 detail 経路でしか tag が要らない」ため、list 側の N+1 防止 helper を入れなかった。**ヒトの「念のため一括取得」は API spec に直結しない過剰実装になりやすい**。要望が確定してから入れる方針が結果として正解だった。

### 4.2 `IN (?)` の placeholder 上限

D1 / SQLite では IN 句の placeholder 数に上限がある（具体値は ENV 依存）。member 数が 100 を超える list の場合、chunk して複数 query に分割する設計が必要。

### 4.3 tag visibility の扱い

tag に visibility 概念がある場合、member 側 visibility と AND を取らないと一部 leak の温床になる。`keepPublicFields` の対象に tag も含める設計を最初から忘れない。

---

## 5. 関連リソース

- `apps/api/src/repository/publicMembers.ts`
- `apps/api/src/_shared/visibility-filter.ts`
- 04a-followup-003 (query parser shared 化) — `expand` パラメータ設計
- 04a Phase 12 unassigned-task-detection.md U-5
