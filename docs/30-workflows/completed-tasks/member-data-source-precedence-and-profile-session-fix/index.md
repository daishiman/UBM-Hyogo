# 会員データソース 3層プレシデンス反映 + /profile セッションエラー修正 タスク仕様書

- task_id: `member-data-source-precedence-and-profile-session-fix`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。全 Lane がコード変更を伴う。判定根拠は Phase 1 / `_shared-context.md` §6 参照）
- taskType: `implementation` / visualEvidence: `VISUAL`（Lane D admin 編集 UI を含む。他 Lane は NON_VISUAL backend）/ implementation_mode: `new`
- workflow_state: `implemented_local_runtime_pending`（apps/packages 実装とローカル検証は完了。commit / PR / D1 適用 / deploy / 認証済み visual capture は user-gated）
- スコープ: `apps/api`（sync / repository / use-case / route / migration）+ `apps/web`（admin 編集 UI / profile）+ 一部 `packages/integrations-google`（label alias）
- 正本: 同ディレクトリの [`_shared-context.md`](_shared-context.md)（SSOT・矛盾時はこちらを優先）

## 目的

Google Form とその回答スプレッドシートにある会員情報を、公開一覧 `/members`・公開詳細 `/members/[id]`・
マイページ `/profile` に**正しく反映**し、「初回 seed=スプレッドシート / 本人更新=Form 再回答 / 確定編集=本システム」の
**3層プレシデンス**で上書き事故を防ぐ。あわせて staging `/profile` の「セッション情報を取得できませんでした」を修正する。

## 根本原因（実測確定・詳細は `_shared-context.md` §3）

- **RC-1**: Sheets 経路 `mappers/sheets-to-members.ts` の `DB_FIELD_MAP` が実スプレッドシートヘッダーとほぼ全項目で不一致（例: 実「お名前（フルネーム）」vs コード「氏名」、実「UBM区画」vs コード「UBMゾーン」）→ seed がマップされない。
- **RC-2**: `CONSENT_MAP` が実値 `"同意する（掲載OK）"` を持たず `public_consent = unknown` 化 → 公開されない。
- **RC-3**: `/profile` の `/me` フェッチが 401/404 以外（500/transport）を返し、`page.tsx` 汎用エラー分岐に落ちる。
- **構造**: import-once / source provenance / フィールド編集 override の列・テーブルが現状ゼロ。

## 3層プレシデンス（表示時に上位が勝つ）

| 層 | ソース | 格納先 | 上書き |
|----|--------|--------|--------|
| L1 | 本システム編集 | `member_field_overrides`（新規） | 再同期で不変・Form 再回答でも維持（DEC-4） |
| L2 | Form 本人再回答 | `member_responses`/`response_fields` | 通常更新（L1 がある列は表示で勝てない） |
| L3 | スプレッドシート初回 seed | 同上 | import-once（未登録 member のみ） |

## スコープ（本サイクル完結・CONST_007）

| Lane | 責務 | 主な変更 |
|------|------|---------|
| A | データモデル基盤（override テーブル + provenance 列 + repository） | migration 新規 / `repository/memberFieldOverrides.ts` 新規 / identities |
| B | 取込是正（RC-1/RC-2 ラベル・同意マップ + import-once + Form label 整合） | `sheets-to-members.ts` / `sync-sheets-to-d1.ts` / `sync-forms-responses.ts` |
| C | 表示プレシデンス純関数 + admin override 書込 endpoint | public use-cases / `routes/me/*` / `routes/admin/member-fields.ts` 新規 |
| D | Web UI（admin 詳細編集 + 一覧/詳細/profile 表示確認） | `apps/web` admin components / profile |
| E | `/profile` セッションエラー修正 | `routes/me/*` / `me-session-resolver.ts` / `apps/web profile/page.tsx` |

> 先送り（別PR/将来タスク）はしない。並列は実装時 3 lane まで（`_shared-context.md` §7）。

## Acceptance Criteria

`_shared-context.md` §8（AC-1..AC-9）を正本とする。Phase 1 で再掲・確定する。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義（AC 確定 / 命名規則 / 実測検証） | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（テーブル / 関数シグネチャ / projection / Lane topology） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー（Phase 4 進行可否ゲート） | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順（Lane A-E 逐次手順・変更ファイル・差分方針） | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加（fail path / 回帰） | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット計画 | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release（user-gated） | [phase-13-pr.md](phase-13-pr.md) |
