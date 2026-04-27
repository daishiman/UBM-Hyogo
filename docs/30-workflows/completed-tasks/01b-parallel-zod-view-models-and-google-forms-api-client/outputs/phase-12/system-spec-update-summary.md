# System Spec Update Summary

このタスク（01b）が `doc/00-getting-started-manual/specs/` および周辺仕様に与えた更新の要約。

## 結論

- specs 本体の **書き換えは発生しない**（このタスクは spec を **消費** する側）。
- 仕様は据え置きで、実装パッケージ側で具現化のみ実施。

## 詳細

| spec ファイル | 影響 | 内容 |
| --- | --- | --- |
| `specs/00-overview.md` | 更新なし | システム全体構成は変更なし |
| `specs/01-api-schema.md` | 更新なし | フォーム schema 定義（31 項目 / 6 セクション）はそのまま消費 |
| `specs/02-auth.md` | 更新なし | Auth.js + Google OAuth + Magic Link の方針は据え置き |
| `specs/04-*` | 更新なし | API 仕様は Wave 4 以降で具体化 |
| `specs/08-free-database.md` | 更新なし | D1 構成は本タスク範囲外 |
| `specs/13-mvp-auth.md` | 更新なし | MVP 認証方針は据え置き |
| `CLAUDE.md` | 更新なし | secret 管理方針はそのまま遵守 |

## 派生で生まれた追加情報（仕様書ではなくガイド側）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-12/implementation-guide.md` | ガイド | パッケージ利用方法（Part 1 / Part 2） |
| `outputs/phase-09/free-tier-estimate.md` | レポート | Forms API / Workers / D1 無料枠への影響評価 |
| `outputs/phase-07/ac-matrix.md` | エビデンス | AC × test × evidence マトリクス |

## 後続タスクへの注記

- `specs/01-api-schema.md` は本タスク内の `FieldByStableKeyZ` で 31 項目を網羅した。後続で項目追加 / 削除があれば spec と zod の双方を同時更新する運用とする。
- consent 統一（不変条件 #2）は実装で具現化済みのため、後続 Wave で `agree*` 系の旧キーを **新規追加してはならない**。
