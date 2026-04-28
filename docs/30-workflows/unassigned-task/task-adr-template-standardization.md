# ADR テンプレート標準化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-adr-template-standardization |
| タスク名 | ADR テンプレート標準化 |
| 分類 | DevEx / Documentation |
| 対象機能 | Architecture Decision Records |
| 優先度 | Low |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | task-husky-rejection-adr Phase 12 |
| 発見日 | 2026-04-28 |

## 1. なぜこのタスクが必要か（Why）

ADR-0001 で `doc/decisions/` と最小運用規約を作成したが、次回以降の ADR 作成者が同じ章立て・リンク・Accepted 後の扱いを毎回思い出す必要がある。テンプレートがないまま ADR-002 以降を作ると、Status / Context / Decision / Consequences / Alternatives Considered / References の欠落や表記揺れが再発する。

## 2. 何を達成するか（What）

- `doc/decisions/TEMPLATE.md` を追加する。
- `doc/decisions/README.md` からテンプレートへリンクする。
- 新規 ADR 作成時のチェックリストを README または TEMPLATE に含める。

## 3. どのように実行するか（How）

1. ADR-0001 の構成を抽出し、汎用テンプレートへ変換する。
2. 派生元抜粋が必要な場合と不要な場合の判断基準をテンプレートに書く。
3. Accepted 後の直接書き換え禁止と Superseded 運用を明記する。
4. README の一覧付近へ `TEMPLATE.md` へのリンクを追加する。

## 4. 受入条件

- `doc/decisions/TEMPLATE.md` が存在する。
- README からテンプレートへ相対リンクで到達できる。
- テンプレートに必須6セクションが含まれる。
- ADR-0001 の本文は不要に書き換えない。

## 5. 含まないもの

- ADR-0001 の方針変更
- CI link checker の新設
- `lefthook-operations.md` から ADR-0001 への参照追加
