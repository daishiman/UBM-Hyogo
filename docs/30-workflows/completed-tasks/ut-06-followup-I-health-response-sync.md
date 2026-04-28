# UT-06 Follow-up I: API `/health` 期待レスポンス同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-I |
| タスク名 | docs と実装の `/health` レスポンス形式統一 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 作成日 | 2026-04-27 |
| 種別 | refactor / docs |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-I / 実行前ブロッカー B-3 |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

UT-06 smoke docs は `/health` の期待値を `{"status":"healthy"}` としているが、現行 API 実装は `{ ok: true, foundation, integrationRuntimeTarget }` を返している。docs または実装のいずれかに統一し、API contract test を追加する。

## スコープ

### 含む

- どちらに寄せるかの意思決定（実装側 `ok: true` を canonical 推奨）
- 反対側（docs もしくは実装）の修正
- API contract test の追加
- Phase 11 smoke-test-result.md の期待値更新

### 含まない

- `/health/db` の実装（FU-H 別タスク）
- 認証 / 権限変更
- ヘルスチェック以外の endpoint

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 Phase 11 smoke docs | 期待値の正本 |
| 関連 | UT-06-FU-H | `/health/db` と整合した形式が望ましい |
| 関連 | UT-06-FU-F | smoke スクリプトの期待値 |

## 苦戦箇所・知見

**1. 既存実装を canonical とする利点**
`{ ok: true, foundation, integrationRuntimeTarget }` は monorepo の foundation revision と integration runtime target を含み、deploy 検証で有用な情報量を持つ。`{"status":"healthy"}` は最小だが情報量に乏しい。実装側を canonical にする方が情報損失が少ない。

**2. `/health` を外部監視（UpTimeRobot 等）に登録済の場合**
レスポンス形式変更で監視 alert が誤発火する可能性がある。UT-08 監視設定と整合確認が必要。

**3. contract test の置き場所**
`apps/api` の vitest または `packages/shared/contracts` のどちらに置くかは monorepo 規約次第。既存 contract test の有無を確認して合わせる。

**4. drift 検出 CI**
今後 docs / 実装 drift を防ぐため、contract test を CI gate に組み込み、PR でレスポンス形式が変わったら fail させる。

## 受入条件

- [ ] docs と実装が同一形式に統一されている
- [ ] API contract test が追加され CI gate に組み込まれている
- [ ] Phase 11 smoke-test-result.md / smoke spec の期待値が実装と一致
- [ ] 既存外部監視への影響評価が docs に記載
- [ ] FU-H と整合する形式（`ok: true` 系統）になっている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-I |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | B-3 |
| 必須 | apps/api/src/index.ts | 実装 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | docs 期待値 |
