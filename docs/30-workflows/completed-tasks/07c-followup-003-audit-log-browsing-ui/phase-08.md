# Phase 8: リファクタリング / DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング / DRY 化 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |

## 目的

filter query、timezone 変換、PII mask、JSON viewer を責務分離し、重複と漏洩リスクを減らす。

## 実行タスク

1. API query builder を test しやすい関数へ分離する
2. JST/UTC 変換 helper を単体テスト対象にする
3. PII mask helper を API projection と UI defense-in-depth で共有できる形にする
4. JSON viewer を表示専用 component に分離する
5. mutation helper や edit/delete UI が混入していないか確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | phase-05.md | API 実装 |
| Phase 6 | phase-06.md | UI 実装 |
| Shared auth | packages/shared/src/auth.ts | shared 型配置の先例 |

## 実行手順

### ステップ 1: 分離候補確認

| 関心 | 分離先候補 | 判定 |
| --- | --- | --- |
| query builder | apps/api route/repository local | API 限定なら shared 化しない |
| timezone | apps/api util / shared | web と API 両方で使うなら shared |
| PII mask | shared or web/api duplicated minimal | raw leak 防止を優先 |
| JSON viewer | apps/web component | UI 専用 |

### ステップ 2: regression test

リファクタ後に Phase 4/7 の TC を再実行する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint / tests |
| Phase 10 | final review の構造確認 |

## 多角的チェック観点（AIが判断）

- 抽象化は重複と漏洩リスクを減らす場合だけ行う
- shared 化で依存が広がる場合は局所 helper を優先する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | helper 分離 | pending | 必要最小限 |
| 2 | regression test | pending | Phase 4 TC |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | refactor 記録 |

## 完了条件

- [ ] PII / timezone / query の責務が明確
- [ ] regression test が PASS
- [ ] 不要な shared 化をしていない

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 8 を completed に更新

## 次Phase

次: 9 (品質保証)。

