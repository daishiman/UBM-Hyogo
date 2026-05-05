# UT-09 member_responses table-name drift cleanup

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-UT09-MEMBER-RESPONSES-DRIFT-001 |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 出典 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-10/go-no-go.md |
| 優先度 | HIGH |

## 目的

UT-09 側に残る旧テーブル名 `members` を、UT-04 の正本である `member_responses` へ統一する。

## スコープ

含む:

- UT-09 workflow / mapper / sync runbook 内の `members` 参照洗い出し
- `member_responses` / `response_fields` / `sync_jobs` への用語統一
- UT-04 schema-design.md との依存リンク追加

含まない:

- 実 D1 migration の変更
- 本番 sync 実行

## 苦戦箇所【記入必須】

UT-04 は既存 migration から現行 schema を抽出したが、UT-09 は旧設計の `members` 表を前提にしている箇所がある。表記だけの問題に見えるが、mapper の upsert 先を誤ると同期データが二重化する。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `members` と `member_responses` の二重実装 | UT-09 の Phase 8 / Phase 11 前に grep 結果を evidence 化する |
| sync_jobs との責務混同 | UT-04 の正本 6 テーブルと UT-09 owned transition tables を表で分離する |

## 検証方法

- `rg -n "\bmembers\b|member_responses" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job apps/api packages/shared`
- UT-09 Phase 11 の smoke で `member_responses.response_id` upsert を確認

## 受入条件

- UT-09 docs / code の旧 `members` 参照が意図的な legacy 説明以外に残らない
- UT-04 schema-design.md への参照が UT-09 の上流依存として明記される
