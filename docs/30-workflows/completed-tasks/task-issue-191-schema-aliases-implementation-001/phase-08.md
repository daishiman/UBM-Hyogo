# Phase 8: DRY/責務確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 責務境界と重複排除 |

## 目的

`schema_aliases` 実装が既存 repository/route pattern と重複せず、責務境界を守っているか確認する。

## 実行タスク

- D1 access が `apps/api` に閉じていることを確認する。
- apps/web に D1 直接参照を追加していないことを確認する。
- `schema_questions.stable_key` 直更新 helper を新設していないことを確認する。
- 03a lookup と 07b apply の責務を分ける。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Architecture boundaries | `.claude/skills/aiworkflow-requirements/references/architecture-overview.md` | 境界 |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | route contract |

## 実行手順

1. `rg -n "schema_aliases|schemaAliases|stable_key" apps/api apps/web packages` を確認する。
2. D1 binding の利用が API 層に閉じていることを確認する。
3. helper の抽象化は repository contract の重複を減らす場合だけ追加する。

## 統合テスト連携

| コマンド | 目的 |
| --- | --- |
| `rg -n "D1Database|DB" apps/web packages` | web/shared への D1 境界漏れ確認 |
| `rg -n "UPDATE schema_questions SET stable_key" apps/api packages` | direct update 確認 |

## 多角的チェック観点（AIが判断）

- 03a に write responsibility を持たせていないか。
- 07b に sync runtime の retry policy を混ぜていないか。
- 一度しか使わない薄い abstraction を追加していないか。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| boundary scan | violations 0 |
| duplication scan | unnecessary helper 0 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| DRY/責務確認 | `phase-08.md` | boundary checklist |

## 完了条件

- [ ] D1 access 境界が守られている
- [ ] 重複 helper がない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 9 の品質ゲートへ確認項目を渡した

## 次Phase

Phase 9: 品質保証
