# Phase 12 Implementation Guide: ut-web-cov-01-admin-components-coverage

## Part 1: 中学生レベル

このタスクは、学校の係ごとの仕事を先生が見回って、困った時にもちゃんと動けるか確認する作業に似ている。管理画面の部品は、会員、タグ、会議、監査ログなど大事な仕事を担当している。ふつうの表示、空の表示、権限が足りない時、変更ボタンを押した時をテストで確かめる。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| coverage | チェック済みの割合 |
| component | 画面の部品 |
| assertion | 期待どおりかの確認 |
| authz | 入ってよい人かの確認 |
| mutation | 画面から変更する操作 |

## Part 2: 技術者レベル

対象は `MembersClient`、`TagQueuePanel`、`AdminSidebar`、`SchemaDiffPanel`、`MemberDrawer`、`MeetingPanel`、`AuditLogPanel`。各 component は snapshot 依存を避け、visible text、disabled state、callback invocation、API mock result を明示 assertion で検証する。

既存 admin API contract は変更しない。apps/web から D1 へ直接触れず、admin client / proxy 境界を維持する。Production UI code は変更せず、表示仕様・画面挙動の変更は発生しない。NON_VISUAL unit coverage task として screenshot 実測を要求せず、coverage / regression evidence を PASS 条件にする。

実装対象は `apps/web/src/components/admin/__tests__/` と `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx`。Phase 11 では web coverage Vitest を実行し、21 test files / 196 tests PASS と対象7ファイルすべて Stmts/Lines/Funcs >=85% / Branches >=80% を確認した。

Phase 11 evidence:

- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-summary.snapshot.json`
- `outputs/phase-11/coverage-target-files.txt`
