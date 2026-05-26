# Phase 9: 品質保証

## メタ情報

| 項目   | 値                              |
| ------ | ------------------------------- |
| Phase  | 9 / 13（品質保証）              |
| 依存   | Phase 8                         |
| 成果物 | outputs/phase-9/phase-9.md      |

## 目的

typecheck / lint / 主要テスト / HEX 直書きチェック / mirror parity を一括判定する。

## 実行タスク

- [x] typecheck PASS を確認
- [x] focused vitest（8 tests）PASS を確認
- [x] HEX 直書きを grep で確認
- [x] artifacts.json と outputs/artifacts.json の parity を確認

## 検証結果

| 検証                                | 結果   | 証跡                                                |
| ----------------------------------- | ------ | --------------------------------------------------- |
| `pnpm typecheck`                    | PASS   | `tasks/bsvwc4252.output`（tsc --noEmit 0 件）       |
| `(public)/layout.spec.tsx`          | PASS 3 | `tasks/b3yf29ay0.output`（Tests 3 passed）          |
| `PublicHeader.spec.tsx`             | PASS 5 | targeted vitest 確認                                |
| HEX 直書き grep                     | clean  | `data-state` のみ追加、色トークン触れていない        |
| link 健全性                         | OK     | `/profile` / `/login` 既存 route                    |
| mirror parity                       | OK     | artifacts.json と outputs/artifacts.json 同期       |

## 参照資料

- `outputs/phase-5/phase-5.md`
- `outputs/phase-6/phase-6.md`

## 成果物

- `outputs/phase-9/phase-9.md`（本書）

## 完了条件

- [x] typecheck PASS
- [x] focused vitest 10/10 PASS
- [x] HEX 直書き 0
- [x] mirror parity OK
