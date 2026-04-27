# status-readonly helper の正式昇格 - タスク指示書

## メタ情報

```yaml
issue_number: 103
```


## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | 02b-followup-001-status-readonly-helper           |
| タスク名     | status-readonly helper の正式昇格                 |
| 分類         | 改善                                              |
| 対象機能     | 削除済み会員除外フィルタの共通化                  |
| 優先度       | 中                                                |
| 見積もり規模 | 小規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | 02b Phase 12                                      |
| 発見日       | 2026-04-27                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02b では `apps/api/src/repository/attendance.ts` 内で「削除済み会員を除外する」ためのフィルタ条件 (`is_deleted = 0` 相当) を SQL に直接埋め込んで実装している。同等のフィルタは 02a の `status.ts` でも必要であり、02a 取り込み後は両モジュールで同じ意味のフィルタが分散する見込みである。`_shared/db.ts` の正本は 02a が担うため、02b 単独では helper 化できなかった。

### 1.2 問題点・課題

- `is_deleted = 0` 相当のフィルタが attendance.ts と status.ts の両方に重複する
- フィルタの意味が SQL 文字列に埋もれており、不変条件 #15（削除済み会員除外）の遵守可否が grep ベースでしか検査できない
- 将来 status 拡張（例: `status IN ('active','provisional')` 等）が増えたとき、抜け漏れが発生しやすい

### 1.3 放置した場合の影響

- 削除済み会員が誤って公開ディレクトリ・出席集計に混入するリスク
- status 条件の変更が分散箇所すべてに反映されず、不整合データが返却される
- レビューコストが増え、helper 化のタイミングを逃すと負債が固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

「削除済み会員を除外する」フィルタを `_shared/status-readonly.ts` の正式 helper として 02a 配下に切り出し、attendance.ts / status.ts 両方から呼び出せる単一の正本にする。

### 2.2 最終ゴール

- `apps/api/src/repository/_shared/status-readonly.ts` が helper 関数を export している
- attendance.ts の `is_deleted = 0` SQL が helper 経由に置換されている
- status.ts も同 helper を利用している
- 不変条件 #15 の遵守箇所が helper の参照箇所と一致する

### 2.3 スコープ

#### 含むもの

- `_shared/status-readonly.ts` の新規作成（02a 取り込み時）
- attendance.ts の SQL を helper 呼び出しに置換
- status.ts での helper 利用
- 単体テストでの helper 経路カバレッジ

#### 含まないもの

- status カラム値の意味変更
- 物理削除の導入（論理削除のままとする）
- 公開 API レスポンス schema の変更

### 2.4 成果物

- `apps/api/src/repository/_shared/status-readonly.ts`
- attendance.ts / status.ts の差分
- helper の単体テスト
- 不変条件 #15 遵守箇所の grep ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02a (member-identity-status-and-response-repository) が取り込まれている
- 02b 実装の attendance.ts が main にマージされている

### 3.2 依存タスク

- 02a 取り込み（必須前提）
- 02b マージ済み

### 3.3 必要な知識

- D1 / SQL の WHERE 条件合成
- `_shared/db.ts` の責務境界
- 不変条件 #15（削除済み会員除外）

### 3.4 推奨アプローチ

helper は SQL 断片を返す形（例: `excludeDeletedMembers()` が `"members.is_deleted = 0"` を返す）か、Query Builder の `.where()` を返す形のどちらかに統一する。02a の `_shared/db.ts` の他 helper の様式に合わせる。

---

## 4. 実行手順

### Phase構成

1. 既存実装の棚卸し
2. helper API 設計
3. 移送と置換
4. テストと不変条件再検証

### Phase 1: 既存実装の棚卸し

#### 目的

attendance.ts / status.ts 内の `is_deleted = 0` 相当の SQL を全件抽出する。

#### 手順

1. `rg "is_deleted" apps/api/src/repository` で対象箇所を列挙
2. SQL 文中の表現バリエーションを分類

#### 成果物

対象箇所一覧

#### 完了条件

attendance.ts / status.ts の対象 SQL がすべて把握できている

### Phase 2: helper API 設計

#### 目的

`_shared/status-readonly.ts` が export する関数の I/O を決める。

#### 手順

1. SQL 断片返却 / Query Builder 返却のどちらかを選定
2. 02a の `_shared/db.ts` の既存 helper との命名整合性を確認
3. 関数名・引数・戻り値を確定

#### 成果物

helper API 仕様メモ

#### 完了条件

attendance.ts / status.ts 双方が同 API で呼び出せる

### Phase 3: 移送と置換

#### 目的

helper を実装し、attendance.ts と status.ts の SQL を helper 経由に置換する。

#### 手順

1. `_shared/status-readonly.ts` を新規作成
2. attendance.ts の SQL を helper 呼び出しに置換
3. status.ts でも同 helper を利用
4. 重複コードを削除

#### 成果物

helper 実装と差分

#### 完了条件

`is_deleted` 直書きが attendance.ts / status.ts から消えている

### Phase 4: テストと不変条件再検証

#### 目的

helper 経路で削除済み会員が除外されることを保証する。

#### 手順

1. helper の単体テストを追加
2. attendance / status のリポジトリテストを helper 経路で再実行
3. 不変条件 #15 の遵守箇所を grep で再確認

#### 成果物

テスト追加差分と検証ログ

#### 完了条件

全テスト緑かつ helper 未経由の `is_deleted` 直書きが 0 件

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `_shared/status-readonly.ts` が helper を export している
- [ ] attendance.ts が helper を利用している
- [ ] status.ts が helper を利用している
- [ ] 削除済み会員が除外されることがテストで保証されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] 関連テスト緑

### ドキュメント要件

- [ ] 02a の `_shared/` README または該当仕様に helper を追記
- [ ] 不変条件 #15 と helper の対応が記録されている

---

## 6. 検証方法

### テストケース

- 削除済み会員が attendance クエリ結果に含まれない
- 削除済み会員が status クエリ結果に含まれない
- 通常会員は従来通り取得できる

### 検証手順

```bash
rg -n "is_deleted" apps/api/src/repository
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test
```

---

## 7. リスクと対策

| リスク                                                        | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| helper API が他 `_shared/` 関数と命名規約上ずれる             | 中     | 中       | 02a 既存 helper の様式に合わせて命名・I/O を統一                     |
| 置換漏れにより削除済み会員が混入                              | 高     | 低       | grep で `is_deleted` 直書き 0 件を完了条件にする                     |
| 02a と 02b のマージ順前後で衝突                               | 中     | 中       | 02a 取り込み完了後に着手する依存関係を明示                           |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/attendance.ts`
- `apps/api/src/repository/_shared/db.ts`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`

### 参考資料

- 不変条件 #15（削除済み会員除外）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 02b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | attendance.ts と将来の status.ts (02a) で「is_deleted = 0」相当のフィルタが分散しそうになった                                                                         |
| 原因     | 02b 単独では「削除済み会員除外」フィルタを `_shared/` の helper として正式に切り出すスコープがなかった（02a と 02b の両方が呼び出すが、02a が `_shared/db.ts` の source であるため） |
| 対応     | 02b ローカルでは attendance.ts 内に SQL を埋め込み、helper 化は 02a 取り込み時に行う方針とした                                                                        |
| 再発防止 | 02b と 02a の両方で使う共有関数は 02a の `_shared/` に source を置くルールを `phase-12/system-spec-update-summary.md` で正本化済                                      |

### レビュー指摘の原文（該当する場合）

```
02b Phase 12 unassigned-task-detection.md にて _shared/status-readonly.ts の正式 helper 化を 02a 取り込み時の対応推奨タスクとして識別
```

### 補足事項

02b 単独でのスコープ外であり、02a 取り込みのタイミングで実施するのが最小コストとなる。helper 化により不変条件 #15 の遵守検査が helper 参照箇所の検査に単純化されるため、保守性とレビュー効率の双方が向上する。
