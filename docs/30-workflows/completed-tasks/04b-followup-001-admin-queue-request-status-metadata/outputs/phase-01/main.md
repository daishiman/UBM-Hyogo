# Phase 1: 要件定義 — 成果物

## 確定した値域・状態遷移

| 列 | 型 | 値域 | NULL | 備考 |
| --- | --- | --- | --- | --- |
| `request_status` | TEXT | `pending` / `resolved` / `rejected` | YES (general 行のみ) | enum は zod / repository 入口で守る |
| `resolved_at` | INTEGER | unix epoch ms | YES | resolve / reject 確定時 |
| `resolved_by_admin_id` | TEXT | admin userId 文字列 | YES | resolve / reject 確定時 |

状態遷移: `[*] -> pending -> resolved | rejected`（resolved/rejected は terminal）。
`resolved -> *` / `rejected -> *` は構造的に禁止（`WHERE request_status='pending'` ガード）。

## AC 確定（11 件）

`index.md` の AC-1〜AC-11 をそのまま採用。本 phase で値域・遷移経路と整合することを確認した。

## 完了条件

- [x] 値域・状態遷移表を確定
- [x] AC 11 件を Phase 2 設計入力として固定
- [x] 不変条件 #4 / #5 / #11 への接触面を「`admin_member_notes` 単独」に限定する制約を明示
