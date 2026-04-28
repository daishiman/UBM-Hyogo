# B-1 Attribute A-2 Completion Review - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-B1-A2-REVIEW |
| タスク名 | A-2 完了レビュー時の B-1 attribute 残存確認 |
| 分類 | 改善 |
| 対象機能 | skill ledger lifecycle review |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

B-1 は A-2 fragment 化完了までの保険施策である。A-2 によって `_legacy.md` が空、削除済み、または追記停止になった後も `.gitattributes` の B-1 セクションが残ると、不要な merge driver 設定が永続する。

### 1.2 問題点・課題

B-1 仕様書は解除条件を定義しているが、A-2 完了レビュー側のチェックリストに残存確認を組み込まないと、解除タイミングを見落とす。

### 1.3 放置した場合の影響

不要な `merge=union` pattern が残り、将来の `_legacy.md` 命名や skill ledger 整理時に意図しない attribute が作用する。保険施策が恒久設定になり、A-2 fragment 化を本筋とする設計意図が薄れる。

---

## 2. 何を達成するか（What）

### 2.1 目的

A-2 完了レビューのチェック項目として「B-1 attribute 残存確認」と「解除可否判定」を追加する。

### 2.2 最終ゴール

A-2 完了時に root `.gitattributes` の B-1 セクションを残すか削除するかが evidence 付きで判断され、不要になった場合は削除タスクまたは削除差分が作成される。

### 2.3 スコープ

#### 含むもの

- A-2 完了レビュー文書への B-1 残存確認項目追加
- `_legacy.md` の残存棚卸し
- `.gitattributes` B-1 セクションの解除可否判定
- 解除が必要な場合の follow-up 明文化

#### 含まないもの

- A-2 fragment 化そのものの実装
- B-1 `.gitattributes` 初回実装
- UI / API / database / runtime code の変更

### 2.4 成果物

- A-2 完了レビューの更新差分
- B-1 attribute 残存確認ログ
- 必要に応じた B-1 解除タスクまたは削除差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-2 fragment 化が完了していること
- B-1 が実装済みの場合は root `.gitattributes` に B-1 セクションがあること
- B-1 が未実装の場合は「未実装のため解除不要」と記録すること

### 3.2 依存タスク

- `task-skill-ledger-a2-fragment`
- `UT-B1-IMPL`（B-1 実装済みの場合）

### 3.3 必要な知識

- skill ledger fragment 化方針
- Git attributes の `merge=union`
- `_legacy.md` の移行完了判定

### 3.4 推奨アプローチ

A-2 完了レビューで `_legacy.md` の残存状態を先に確認し、残存がなければ B-1 セクション削除を推奨する。残存がある場合でも、append が継続する理由を明記し、次回レビュー日を設定する。

---

## 4. 実行手順

### Phase構成

1. A-2 完了状態確認
2. `_legacy.md` 棚卸し
3. B-1 attribute 確認
4. 解除可否判定
5. レビュー文書更新

### Phase 1: A-2 完了状態確認

#### 目的

fragment 化が完了しているか確認する。

#### 手順

1. A-2 の完了記録を確認する。
2. A-2 の Phase 12 / completion review を読む。
3. 未完の場合は本タスクを保留する。

#### 成果物

- A-2 完了確認メモ

#### 完了条件

A-2 完了済み、または保留理由が記録されている。

### Phase 2: `_legacy.md` 棚卸し

#### 目的

B-1 の適用対象が残っているか確認する。

#### 手順

1. `git ls-files '.claude/skills/**/_legacy*.md'` を実行する。
2. 残存ファイルが空、移行済み、追記継続中のどれか分類する。
3. 結果をレビュー文書へ転記する。

#### 成果物

- `_legacy.md` 残存一覧

#### 完了条件

全 `_legacy.md` の状態分類が完了している。

### Phase 3: B-1 attribute 確認

#### 目的

`.gitattributes` に B-1 セクションが残っているか確認する。

#### 手順

1. root `.gitattributes` を確認する。
2. B-1 セクションがある場合は pattern と解除コメントを確認する。
3. `git check-attr merge` の対象 / 除外確認を実行する。

#### 成果物

- B-1 attribute 確認ログ

#### 完了条件

B-1 の有無と適用範囲が明確になっている。

### Phase 4: 解除可否判定

#### 目的

B-1 セクションを削除するか、残すかを決める。

#### 手順

1. `_legacy.md` が 0 件なら削除判定にする。
2. `_legacy.md` が残っていても追記停止済みなら削除判定にする。
3. 追記継続が必要なものがある場合は残す理由と次回レビュー条件を記録する。

#### 成果物

- 解除可否判定

#### 完了条件

削除 / 継続 / 保留のいずれかが evidence 付きで決まっている。

### Phase 5: レビュー文書更新

#### 目的

A-2 完了レビューから B-1 の状態を追跡できるようにする。

#### 手順

1. A-2 完了レビューに B-1 残存確認欄を追加する。
2. 削除判定の場合は B-1 解除差分または未タスクを作る。
3. 継続判定の場合は次回レビュー条件を記録する。

#### 成果物

- A-2 完了レビュー更新差分
- 必要に応じた B-1 解除 follow-up

#### 完了条件

A-2 完了レビューを読めば B-1 の解除状態が判断できる。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] A-2 完了レビューに B-1 残存確認がある
- [ ] `_legacy.md` 残存一覧がある
- [ ] B-1 セクションの削除 / 継続 / 保留が判断されている

### 品質要件

- [ ] 判断根拠がコマンドログで残っている
- [ ] B-1 を残す場合は次回レビュー条件がある
- [ ] B-1 を削除する場合は削除差分または follow-up がある

### ドキュメント要件

- [ ] A-2 完了レビューから B-1 policy へリンクしている
- [ ] skill-ledger gitattributes policy の解除条件と矛盾していない
- [ ] Phase 12 changelog に記録されている

---

## 6. 検証方法

### テストケース

- `_legacy.md` が 0 件の場合の削除判定
- `_legacy.md` が残るが追記停止済みの場合の削除判定
- `_legacy.md` が追記継続中の場合の継続判定

### 検証手順

```bash
git ls-files '.claude/skills/**/_legacy*.md'
rg -n "B-1|merge=union|_legacy.md" .gitattributes .claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

期待: `_legacy.md` 残存状態と B-1 attribute 状態がレビュー文書に一致している。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| B-1 解除忘れ | 中 | 中 | A-2 完了レビューの必須チェックにする |
| `_legacy.md` 残存理由の不明確化 | 中 | 中 | 残す場合は次回レビュー条件と所有者を記録する |
| B-1 未実装時に削除作業へ進む | 低 | 低 | `.gitattributes` の B-1 セクション有無を先に確認する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-fragment-spec.md`

### 参考資料

- `git help attributes`

---

## 9. 備考

## 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | B-1 は「最後の保険」なので、実装後に解除条件を忘れると恒久設定になりやすい |
| 原因 | `.gitattributes` は普段の開発中に目立たず、A-2 完了と B-1 解除のタイミングが別タスクに分かれている |
| 対応 | A-2 完了レビューに B-1 attribute 残存確認を入れる |
| 再発防止 | `_legacy.md` 棚卸しと `.gitattributes` 確認を同じレビューで実行する |

### レビュー指摘の原文（該当する場合）

```
Phase 12 の system-spec-update-summary.md で A-2 完了レビュー時の B-1 attribute 残存確認を未タスク化すると宣言しているが、実体ファイルが存在しない。
```

### 補足事項

B-1 が未実装の時点では削除作業は不要である。その場合も「未実装のため解除不要」と記録して閉じる。
