# ut-07b-alias-recommendation-i18n — タスク仕様書 index

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-07B-alias-recommendation-i18n-001 |
| タスク名 | recommendedStableKeys 多言語 label 正規化 |
| ディレクトリ | docs/30-workflows/ut-07b-alias-recommendation-i18n |
| Issue | #292（closed・コード実装未完了のため新規 workflow 化） |
| Wave | 7（07b follow-up） |
| 実行種別 | sequential（小規模・単一サービス変更） |
| 作成日 | 2026-05-17 |
| 担当 | app-admin-ops |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |
| 優先度 | 中 |
| 規模 | 小規模 |

## 目的

`GET /admin/schema/diff` の `recommendedStableKeys` 算出ロジックにおいて、Levenshtein 比較前の label を Unicode 正規化（NFKC）・trim・連続 whitespace 圧縮で前処理することで、日本語・全角半角・空白揺れによる候補順の不安定を解消する。

## 背景

- 07b ワークフローで実装された `apps/api/src/services/aliasRecommendation.ts` は label を生のまま `levenshtein` に渡す
- UBM 兵庫支部会の Google Form は日本語フォーム前提で、フォーム回答 label は全角英数字・括弧・空白揺れを含みやすい
- 実質的に同一の label が表記揺れによって距離が拡大し、管理者に不自然な候補順が提示されるリスクがある
- 当初 Issue #292 は 2026-05-15 作成・2026-05-16 close されたが、source task は未実装 trace として残存していた。今回 workflow で実装・証跡・正本同期を完了し、source task は `completed-tasks/UT-07B-alias-recommendation-i18n-001.md` へ移動済み。

## スコープ

### 含む

- `apps/api/src/services/aliasRecommendation.ts` に `normalizeLabelForCompare(s: string): string` helper を追加
- `recommendAliases` 内で `levenshtein(diff.label, e.label)` を normalized label 同士の比較に差し替え
- `apps/api/src/services/aliasRecommendation.spec.ts` に多言語 fixture を追加
  - 日本語完全一致
  - 全角英数字 / 半角英数字の同一視（NFKC）
  - 空白揺れ（前後 trim・中間連続空白）
  - 過剰一致 negative case（別 label が誤って同一視されないこと）
- 既存英語 fixture の regression 確認
- Phase 12 implementation guide と aiworkflow-requirements 関連 reference の同期

### 含まない

- `recommendAliases` の response shape 変更（`string[]` のまま維持）
- `levenshtein` 関数本体の再実装
- 記号（括弧・コロン等）除去や辞書ベース・embedding ベース recommendation
- `schema_questions.stableKey` の DB schema 変更（別タスク `UT-07B-schema-alias-hardening-001` 責務）
- `/admin/schema` UI 側の表示変更
- back-fill / alias 確定 workflow 側の変更
- commit / push / PR 作成（Phase 13 でユーザー明示承認後）

## 不変条件

1. `stable_key` はコードに固定しない（schema_questions row 経由）— 不変条件 #1
2. schema 変更は `/admin/schema` に集約 — 不変条件 #14
3. D1 直接アクセスは `apps/api` に閉じる
4. `GET /admin/schema/diff` の response shape は変更しない（helper 内に閉じる）
5. 既存英語 fixture （`existing` に英語 label のみ含むケース）の score 順を regress させない

## Phase 構成

| Phase | 名称 | 状態 | ファイル |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | [phase-01.md](phase-01.md) |
| 2 | 設計 | completed | [phase-02.md](phase-02.md) |
| 3 | 設計レビュー | completed | [phase-03.md](phase-03.md) |
| 4 | テスト作成（RED） | completed | [phase-04.md](phase-04.md) |
| 5 | 実装（GREEN） | completed | [phase-05.md](phase-05.md) |
| 6 | テスト拡充 | completed | [phase-06.md](phase-06.md) |
| 7 | カバレッジ確認 | completed | [phase-07.md](phase-07.md) |
| 8 | リファクタリング | completed | [phase-08.md](phase-08.md) |
| 9 | 品質保証 | completed | [phase-09.md](phase-09.md) |
| 10 | 最終レビュー | completed | [phase-10.md](phase-10.md) |
| 11 | 手動テスト（NON_VISUAL） | completed | [phase-11.md](phase-11.md) |
| 12 | ドキュメント更新 | completed | [phase-12.md](phase-12.md) |
| 13 | PR作成（user gate） | blocked | [phase-13.md](phase-13.md) |

## 関連タスク

| タスクID | 関係 |
| --- | --- |
| `07b-parallel-schema-diff-alias-assignment-workflow` | 親 workflow（completed） |
| `UT-07B-schema-alias-hardening-001` | 兄弟タスク（DB constraint / back-fill 強化、責務分離） |
| Issue #292 | 元 Issue（closed・本 workflow で完遂） |

## 参照

- `docs/30-workflows/completed-tasks/UT-07B-alias-recommendation-i18n-001.md`
- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/services/aliasRecommendation.ts`
- `apps/api/src/services/aliasRecommendation.spec.ts`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
