# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | quality gate |

## 目的

実装後に必ず実行する品質ゲートを固定する。

## 実行タスク

| Gate | コマンド | 成功条件 |
| --- | --- | --- |
| G-01 | `mise exec -- pnpm --filter @repo/api test` | PASS |
| G-02 | `mise exec -- pnpm typecheck` | PASS または repo 標準対象 PASS |
| G-03 | `rg -n "UPDATE schema_questions SET stable_key" apps packages` | 実行経路 0 |
| G-04 | local D1 migration apply | PASS |
| G-05 | `PRAGMA table_info(schema_aliases);` | expected columns |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Quality gates | `.claude/skills/task-specification-creator/references/quality-gates.md` | Phase gate |
| Phase 7 | `phase-07.md` | AC coverage |

## 実行手順

1. G-01 から G-05 を実行する。
2. 失敗した gate は Phase 5/6/8 のどこへ戻すか分類する。
3. 結果を Phase 11 evidence に転記する。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| automated tests | PASS |
| static guard | PASS |
| migration | PASS |

## 多角的チェック観点（AIが判断）

- typecheck が repo 全体で重い場合でも API 変更対象の型検証を省略していないか。
- grep 0 件をコメントや docs だけで誤判定していないか。

## サブタスク管理

| failure | 戻り先 |
| --- | --- |
| test failure | Phase 5/6 |
| boundary failure | Phase 8 |
| missing AC evidence | Phase 7 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 品質保証 | `phase-09.md` | gate list |

## 完了条件

- [ ] G-01 から G-05 が定義されている
- [ ] failure の戻り先が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 10 の GO/NO-GO 判定に必要な gate が揃っている

## 次Phase

Phase 10: GO/NO-GO
