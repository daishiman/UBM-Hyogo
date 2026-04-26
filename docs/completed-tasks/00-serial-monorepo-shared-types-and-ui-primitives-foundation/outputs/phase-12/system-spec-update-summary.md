# Phase 12 / system-spec-update-summary.md — システム仕様書更新サマリ

## サマリ

本タスク（Wave 0: monorepo-shared-types-and-ui-primitives-foundation）は、`doc/00-getting-started-manual/specs/` の既存仕様書を**消費する**タスクであり、specs/ への変更は加えない。

## 更新有無

| 対象ファイル | 更新 | 備考 |
| --- | --- | --- |
| `doc/00-getting-started-manual/specs/00-overview.md` | なし | 参照のみ |
| `doc/00-getting-started-manual/specs/01-api-schema.md` | なし | 参照のみ |
| `doc/00-getting-started-manual/specs/02-auth.md` | なし | 参照のみ |
| `doc/00-getting-started-manual/specs/08-free-database.md` | なし | 参照のみ |
| `doc/00-getting-started-manual/specs/13-mvp-auth.md` | なし | 参照のみ |

## 理由

Wave 0 の責務は「後続 Wave が参照する型の置き場所とランタイム基盤を確立する」こと。仕様書を更新するのではなく、仕様書の内容を TypeScript 型として具現化する役割を担う。

仕様書自体の更新は、実装が進んで「実態と乖離した記述」が生じた場合に Wave 1〜9 の各タスクで個別に行う。

## 完了条件

- [x] specs/ への変更なし（意図的）
- [x] 参照した仕様書の内容が型定義に反映されていることを確認
