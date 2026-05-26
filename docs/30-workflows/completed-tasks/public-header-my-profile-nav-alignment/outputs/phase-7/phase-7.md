# Phase 7: テストカバレッジ確認

## メタ情報

| 項目   | 値                              |
| ------ | ------------------------------- |
| Phase  | 7 / 13（カバレッジ確認）        |
| 依存   | Phase 6                         |
| 成果物 | outputs/phase-7/phase-7.md      |

## 目的

`PublicHeader` の表示分岐と `(public)` layout 構造が Phase 6 のテストで十分カバーされていることを確認し、
`SessionAwarePublicHeader` の薄い wrapper は Phase 11 manual smoke で実 session 経路を検証する設計とする。

## 実行タスク

- [x] concern と dependency edge を表で列挙する
- [x] カバー先テストを明示する
- [x] Phase 11 で検証する経路を明示する

## カバレッジ可視化

| concern                            | カバー先                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `currentUser` 認識分岐 (auth/anon) | `PublicHeader.spec.tsx`（case 3, 4）                                                                  |
| `aria-current` on `/profile`       | `PublicHeader.spec.tsx`（case 5）                                                                     |
| session → props 変換               | `SessionAwarePublicHeader` の薄い wrapper のため、`(public)/layout.spec.tsx` の構造 test で代替し、実 session 経路は Phase 11 で確認 |
| layout wrapper 構造                | `(public)/layout.spec.tsx`（3 tests）                                                                  |

## 参照資料

- `outputs/phase-6/phase-6.md`
- `outputs/phase-11/phase-11.md`

## 成果物

- `outputs/phase-7/phase-7.md`（本書）

## 完了条件

- [x] 4 concern が Phase 6 テストでカバーされている
- [x] session → props 経路は Phase 11 manual smoke でカバーする計画を明示
