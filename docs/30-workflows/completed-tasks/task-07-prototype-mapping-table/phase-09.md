# Phase 9: 統合検証 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 9 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

`09a-prototype-map.md` が周辺ドキュメントと整合することを確認する。具体的には:

1. `09-ui-ux.md`（task-06 出力）から `09a` への link target が成立すること
2. phase-3 §3 派生ルールと §5.1〜§5.8 が 1:1 対応すること
3. task-08 の `09b-design-tokens.md` と responsibility 境界が成立すること（本ファイルでは値を扱わない）
4. task-10 / task-11..17 が §3 / §6 を逆引き参照可能であること

## 実行タスク

1. `09-ui-ux.md` から `09a-prototype-map.md` への相対リンクが `[..](./09a-prototype-map.md)` で 1 箇所以上存在することを `grep` で確認する。
2. phase-3 §3 派生ルール 8 パターンと §5.1〜§5.8 の見出し名・対象 routes を表で突合する。
3. §2 列に値（OKLch / hex）が含まれていないことを `grep -E '#[0-9a-fA-F]{6}|oklch\\('` で確認する（責務分離）。
4. task-10..17 が §6 を grep 検索したときに、自タスク担当 prototype 行範囲を 1 ヒットで取得できることを確認する。

## 統合検証マトリクス

| 観点 | 検証 | 期待 |
|------|------|------|
| link from 09-ui-ux.md | `grep -c "09a-prototype-map" specs/09-ui-ux.md` | 1+ |
| 派生ルール対応 | §5.x 見出し × phase-3 §3 表 | 1:1 |
| token 値混入禁止 | `grep -E '#[0-9a-fA-F]{6}\|oklch' 09a` | 0 |
| §6 一意検索性 | `grep "MemberDetailPage" 09a` | 1 hit |

## 参照資料

- task-06 出力 `09-ui-ux.md`（link 元）
- task-08 出力 `09b-design-tokens.md`（境界対象）
- phase-3 §3

## 依存 Phase 成果物参照

- Phase 5 / 6 / 7 / 8 outputs

## 多角的チェック観点

- 責務境界（token 値 / props・state / コード）が 09a に侵入していないこと
- link 双方向性: 09-ui-ux.md → 09a の link target に anchor 化が必要なら anchor も整合
- 派生ルール末尾「新規 primitive を生やさない」段落が link 文脈で誤解を生まないこと

## サブタスク管理

- [ ] 09-ui-ux.md からの link 確認
- [ ] phase-3 §3 ↔ §5 突合表作成
- [ ] token 値混入 0 確認
- [ ] §6 一意検索 sample 5 件実施
- [ ] outputs/phase-09/main.md にレポート

## 成果物

- outputs/phase-09/main.md

## 完了条件

- [ ] `09-ui-ux.md` からの link が 1+ 確認
- [ ] §5.1〜§5.8 が phase-3 §3 と 1:1 対応
- [ ] §2/§3/§4/§6 に token 値が混入していない
- [ ] §6 各 row が grep 一意で参照可能

## 次 Phase への引き渡し

Phase 10 へ、統合整合 PASS のレポートを品質ゲート入力として渡す。
