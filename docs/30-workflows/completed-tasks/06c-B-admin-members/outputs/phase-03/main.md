# Phase 03 Main — 設計レビュー

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `03 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## 代替案比較（5 案）

| 案 | 概要 | 採否 | 判定 | 主理由 |
| --- | --- | --- | --- | --- |
| A | apps/web から D1 直参照 | 却下 | MAJOR | 不変条件 #5（apps/web D1 direct access forbidden）違反 |
| B | apps/api 経由 + cookie forwarding（06b-A session resolver 再利用） | **採用** | PASS | 二段防御 / 06b-A 再利用 / #5 #13 整合 |
| C | admin 専用 BFF を別 worker で建てる | 却下 | MAJOR | 無料枠圧迫 + 運用負担増 + 既存 require-admin 重複 |
| D | 検索を client-side filter で擬似実装（全件取得） | 却下 | MAJOR | 性能劣化 + 12-search-tags 不整合 + 無料枠 |
| E | delete を物理削除で代替（DELETE 文） | 却下 | MAJOR | 07-edit-delete 論理削除/復元ポリシー違反 |

## 採用案（B）の根拠

- **不変条件**: #5（D1 直参照禁止）を構造的に守る。#13（audit 必須）を handler 単一箇所に集約できる。
- **整合性**: 11-admin-management（admin role 読み取り）/ 07-edit-delete（softDelete + restore）/ 12-search-tags（filter+q+zone+tag+sort+density）すべて正本準拠。
- **再利用**: 06b-A session resolver と既存 `require-admin` middleware を再利用、新規 worker 追加なし。
- **運用性**: audit_log で操作を完全追跡。

## 却下案の MAJOR 理由（不変条件マッピング）

- A: #5 違反（apps/web から D1 binding 経由で直接 SQL 発行になる）
- C: 不変条件違反はないが運用 / 無料枠 / 重複の MAJOR
- D: 12-search-tags（server-side query 仕様）と性能（無料枠 D1 reads）で MAJOR
- E: 07-edit-delete（論理削除 + restore）違反、復元不可で運用破綻

## blocker / 未解決リスク（Phase 4 へ）

- B1: 06b-A session resolver 未着地時は admin guard が dev token に依存
- B2: audit_log migration 未適用環境では handler が落ちる
- B3: require-admin の admin role 判定基準（11-admin-management 参照）の確定
- B4: 検索向け index（members(zone, status) / member_tags(memberId, tag)）

## 完了条件チェック

- [x] 採用案 B が PASS
- [x] 却下案 A/C/D/E に MAJOR 理由が不変条件 / 正本仕様で説明される
- [x] 12-search-tags / 07-edit-delete に整合する案のみが採用

## 次 Phase への引き渡し

Phase 4 へ、採用案 B・blocker B1〜B4・テスト対象 endpoint 4 件を渡す。
