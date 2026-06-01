# Phase 2: 設計（ギャップ分析・判定フレーム適用）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビュー） |
| 主成果物 | outputs/phase-02/gap-analysis-and-verdict.md |

## 目的

Phase 1 inventory を入力に、UT-21 audit 観点 × 現行 ledger のギャップ表を作成し、判定基準 4.3 を適用して確定判定（新設不要 / `sync_jobs` 拡張 / 新規テーブル）を導出する。本 Phase は判定の中核設計であり、`gap-analysis-and-verdict.md` が本 workflow の正本成果物となる。

## docs-only / Ownership 宣言

- 本 Phase は `apps/api/migrations/*` / `apps/api/src/*` の編集、D1 DDL の追加、zod schema の変更をいずれも行わない。棚卸し・差分抽出・判定のみ。
- 判定が「新設要」に転んだ場合のみ別タスクの実装仕様書を起票する（本 Phase はその起票条件を明記するのみ）。

## 実行タスク

1. **棚卸し表の作成**: I-1〜I-4 のカラム / キー / 失敗記録経路を表に整理する。
2. **ギャップ表の作成**: O-1〜O-4 × 現行 ledger カバー可否（◯ / △ / ✕）を根拠付きで埋める。
3. **判定基準 4.3 適用**: 3 条件それぞれに「該当 / 非該当」と根拠を付す。
4. **outbox 前例の評価**: `notification_outbox`（I-5）を「実需ベース新設」の運用根拠として評価する。
5. **確定判定の導出**: 3 条件すべて非該当 → **新設不要** を一意に結論付ける。
6. **解除条件の定義**: 将来 新設を再検討するトリガと受け皿タスクを定義する。
7. **docs-only 確定**: 判定が「新設不要」のためコード変更ゼロであることを CONST_004 例外として固定する。

## ライブラリ選定

- 新規ライブラリ採用なし（判定タスク）。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] I-1〜I-4 棚卸し表が作成済み
- [ ] O-1〜O-4 × ledger ギャップ表が根拠付きで作成済み
- [ ] 判定基準 3 条件の該当/非該当が記録済み
- [ ] 確定判定（新設不要）が一意に導出されている
- [ ] 解除条件と受け皿タスクが定義されている
- [ ] docs-only（コード変更ゼロ）が明記されている

## 成果物/実行手順

- `outputs/phase-02/gap-analysis-and-verdict.md`
