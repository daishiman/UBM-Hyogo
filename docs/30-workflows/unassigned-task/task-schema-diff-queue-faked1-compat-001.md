# task-schema-diff-queue-faked1-compat-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-schema-diff-queue-faked1-compat-001 |
| 分類 | test quality |
| 優先度 | 中 |
| ステータス | unassigned |
| 発見元 | issue-109 UT-02A quality-report |

## 概要

`apps/api/src/repository/schemaDiffQueue.test.ts` の既存 fail 2 件を、fakeD1 と `schema_diff_queue` repository contract の互換性問題として切り出して修正する。

## 苦戦箇所【記入必須】

UT-02A の対象テストは PASS しているが、全体 `pnpm --filter @ubm-hyogo/api test` では schemaDiffQueue の list 系 2 件が既存 fail として残る。全体品質ゲートを緑に戻すには別タスクで対応が必要。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| UT-02A と無関係な fail が PR 品質を落とす | 既存 fail として明示し、専用タスクで fakeD1 / repository を修正する |
| repository contract と fake が再度 drift する | failing assertions を contract test として維持する |

## 検証方法

- `pnpm --filter @ubm-hyogo/api test -- src/repository/schemaDiffQueue.test.ts` が PASS。
- 全体 test で既存 2 fail が解消される。

## スコープ

含む: fakeD1 互換修正または repository query 修正、該当 test。
含まない: UT-02A tag queue 実装変更。
