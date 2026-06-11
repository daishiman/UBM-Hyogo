# Phase 11 手動テスト結果（計画）

## メタ情報

| 項目 | 値 |
|------|-----|
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| task 分類 | **VISUAL** |
| 状態 | `pending_implementation`（spec_created。実機実行・capture は user-gated） |
| 証跡の主ソース | staging before/after screenshot（実装 + 復旧後に取得予定） + 復旧 runbook 実行ログ |
| screenshot を未取得の理由 | コード実装・staging 復旧 mutation・authenticated runtime capture がすべて user-gated のため、仕様書作成段階では取得しない |

## 実機検証手順（user-gated・Phase 11 実行時）

1. **read-only 診断**: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --remote --command "SELECT COUNT(*) FROM schema_questions"` → 0 件を確認（真因再現）。
2. **before capture**: `/members/b0db428f-7dc0-4898-83f5-df31c7a04d69` の空表示を `member-detail-before-recovery.png` として取得。
3. **schema sync**: `POST /admin/sync/schema`（user 承認）。
4. **再診断**: schema_questions が充足（> 0、question_id 充足）したことを確認。
5. **response sync fullSync**: `POST /admin/sync/responses?fullSync=true`（user 承認）。
6. **反映データ診断**: 対象メンバーの `answers_json` が非空、`response_fields` に known stableKey（fullName 等）が投入されたことを確認。
7. **after capture**: 詳細ページに項目が反映された状態を `member-detail-after-recovery.png` として取得。

## 3 層評価（合格基準）

| 層 | 観点 | 合格基準 |
|----|------|---------|
| Semantic | データ意味 | 公開項目（businessOverview / hobbies / motto 等）が会員の実入力値で表示される |
| Visual | 視覚 | 全項目 "—" → 実値表示。プロトタイプ準拠の 5 セクション崩れなし |
| AI UX | 体験 | 「入力したのに反映されない」という不信が解消される |

## 実行記録

- 実行日時: pending（user-gated）
- 結果: pending
- 取得 screenshot: 0 件（capture pending）
