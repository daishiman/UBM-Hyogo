# Phase 6: テスト拡充

## メタ情報

| 項目   | 値                              |
| ------ | ------------------------------- |
| Phase  | 6 / 13（テスト拡充）            |
| 依存   | Phase 5                         |
| 成果物 | outputs/phase-6/phase-6.md      |

## 目的

`PublicHeader.spec.tsx` の追加 3 ケースが fail path と回帰 guard を兼ねていることを明文化し、
`(public)/layout.spec.tsx` の async wrapper mock も将来の async server component 回帰を guard することを確認する。

## 実行タスク

- [x] 各 case が guard する fail path を表で記述する
- [x] async server component の RTL 非対応に対する guard を確認する

## fail path / 回帰 guard

| ケース                          | guard 対象                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------- |
| 未ログイン CTA = `/login`       | 旧仕様（固定 `/login`）が壊れていないこと。`data-state="anonymous"` 必須        |
| ログイン中 CTA = `/profile`     | currentUser 認識漏れの回帰（CTA が `/login` のまま）を fail にする              |
| `/profile` 時 `aria-current`    | active state の付与漏れを fail にする                                            |

`(public)/layout.spec.tsx` の `vi.mock` は async server component が RTL で render 失敗（thenable を return
すると null になる）するパターンの回帰 guard を兼ねる。

## 参照資料

- `outputs/phase-5/phase-5.md`
- `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`

## 成果物

- `outputs/phase-6/phase-6.md`（本書）

## 完了条件

- [x] 3 ケースの guard 対象を明示
- [x] layout.spec の `vi.mock` 効果を明示
