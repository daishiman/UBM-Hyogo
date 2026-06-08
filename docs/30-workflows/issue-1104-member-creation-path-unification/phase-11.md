# Phase 11: 手動テスト（NON_VISUAL）— issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1104-member-creation-path-unification |
| Phase | 11（手動テスト） |
| workflow_state | **implemented_local_evidence_captured**（ローカル実装・focused evidence 取得済み。staging 確認はユーザーゲート） |
| visualEvidence | **NON_VISUAL** |
| タスク種別 | apps/api refactor（データ整合性 / member 生成責務の単一点集約） |
| 証跡の主ソース | 自動テスト = D1 contract test（helper 単体 / ingest / auto-link 各経路 spec） |
| staging 実機確認 | authenticated admin session 必須 → **ユーザーゲート**（本 workflow では実行しない） |
| スクリーンショット | **作成しない**（`screenshots/.gitkeep` も作らない。下記 §11.2 理由） |

## NON_VISUAL 宣言（[Feedback BEFORE-QUIT-001 / WEEKGRD-03]）

本タスクは **NON_VISUAL** である。

- **タスク種別**: `apps/api` backend refactor（repository / job / auto-link への member 生成責務集約）。
- **非視覚的理由**: 変更は `apps/api`（`repository/members.ts` / `repository/identities.ts` / `jobs/sync-forms-responses.ts` / 要判定 `routes/admin/member-status.ts`）に閉じ、`apps/web` を 1 byte も変更しない（AC-6）。生成責務を単一 helper へ集約しても **既存 endpoint surface・レスポンス shape は不変**（Phase 3 §2）であり、UI には「新しい見た目」が一切発生しない。検証対象は「どの作成経路からでも `member_status` 行が存在する」という DB 行の存在という非視覚的事実である。
- **代替証跡**: (1) 自動テスト（helper 単体 / ingest / auto-link / route 非回帰の各 D1 contract test）の PASS、(2) staging での authenticated admin による orphan 非発生確認（後述・ユーザーゲート）。

## 目的

NON_VISUAL refactor の正しさを、視覚的証跡ではなく自動テスト群と（ユーザーゲートの）staging
実機確認手順で担保する。本 workflow は **implemented_local_evidence_captured** 段階であり、focused D1 tests / typecheck / lint は実行済み。staging 確認のみユーザー明示承認後に行う。

## 実行タスク（証跡の構造）

### 11.1 自動テスト証跡（主ソース）

| spec | 検証 AC | 観点 | Status |
|------|---------|------|--------|
| `members.repository.spec`（`createMemberWithStatus` 単体） | AC-2 | identity upsert + `member_status` 既定行を同期生成・冪等（再呼び出しで重複/例外なし） | PASS（local focused evidence） |
| `identities.autolink.repository.spec`（auto-link → `backfillIdentityFromCandidate` / 既存 identity early return） | AC-3 / AC-4 | identity INSERT 直後・既存 identity 早期 return の両方で `member_status` 既定行が必ず生成される・戻り値契約不変 | PASS（local focused evidence） |
| `sync-forms-responses.contract.spec`（ingest） | AC-3 / AC-4 | ingest 経路が `createMemberWithStatus` 経由で member_status 既定行を生成・`writeCount` セマンティクス不変 | PASS（local focused evidence） |
| `member-status.contract.spec`（route 防御の非回帰） | AC-5 | F-4 で保持した防御 backstop が従来どおり動作（legacy orphan への PATCH 前防御） | PASS（local focused evidence） |
| 既存 spec 群（正常会員・詳細 / status / 一覧） | AC-5 | endpoint surface・レスポンスの非回帰 | PASS（local focused evidence） |

> 上記 Status は **implemented_local_evidence_captured** として local focused evidence を取得済み。staging 実機確認のみ user-gated pending として `outputs/phase-11/manual-test-result.md` に分離する。

### 11.2 3 層評価（Semantic / Visual / AI UX）

| 層 | 評価 | 内容 |
|----|------|------|
| Semantic（意味的正しさ） | **主軸** | 「どの member 作成経路からでも `member_status` 既定行が存在する」という不変条件を D1 contract test で機械検証する。helper の冪等性・auto-link 連結・ingest 統合が意味的正しさの核 |
| Visual（視覚的正しさ） | **N/A** | `apps/web` 無変更（AC-6）でレスポンス shape も不変のため、修正前後で同一画面となり視覚的差分が存在しない。スクリーンショットは「同一画面を撮るだけ」で証跡価値が無い（§11.3） |
| AI UX（体験的正しさ） | **N/A（間接）** | UI フロー・操作体験に変更なし。利益は「将来 orphan 由来 404 が構造的に発生しない」という保守体験であり、エンドユーザー UX への直接変更はない |

### 11.3 スクリーンショットを作らない理由（[Feedback BEFORE-QUIT-001 / WEEKGRD-03]）

- `apps/web` 無変更のため UI の視覚的差分が存在せず、スクリーンショットは「修正前後で同一画面」を撮るだけで証跡価値が無い。
- staging で意味のある画面（admin 会員詳細）を撮るには authenticated admin session が必要で、これはユーザーゲート。本 wave（implemented_local_evidence_captured）では取得しない。
- よって `outputs/phase-11/screenshots/` ディレクトリも `.gitkeep` も作らない（空ディレクトリの強制は validate の missing-evidence を誘発するため避ける）。証跡は自動テストと `manual-test-result.md` の文書記録に一本化する。

### 11.4 staging 実機確認手順（ユーザーゲート）

> 以下は **コード実装＋deploy 完了後にユーザーが行う想定**の end-to-end 確認手順。本 wave では実行せず手順固定のみ。

1. 修正済み `apps/api` を staging へ deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 相当・ユーザー承認後）。**新規 migration は無いため D1 apply は不要**（AC-7）。
2. **確認 A（auto-link 経路・最重要 / AC-3 / AC-4）**: orphan を擬似生成する（member_identities が無い未連携 email を持つアカウントで session を解決し、auto-link を発火させる）。auto-link 完了後、当該 member_id に対し `member_status` 行が存在することを確認する（auto-link で生成された identity に既定 status 行が同期生成されている）。
3. **確認 B（詳細 GET / AC-5）**: 上記 member の `GET /admin/members/:memberId` を authenticated admin で開く → **200** で会員詳細が表示される（orphan 由来 404 が発生しない）。
4. **確認 C（ingest 経路 / AC-4）**: Form 再同期（ingest）で新規 member が作られた直後に、その member の `member_status` 行が存在し詳細 GET が 200 であることを確認する。
5. **確認 D（非回帰 / AC-5）**: 正常会員（従来 200）の詳細・status PATCH・一覧が従来どおり動くこと。

> 上記 1-5 はすべてユーザーゲート。実行結果は Phase 13 close-out で `manual-test-result.md` に追記する。

## 参照資料

- Phase 9（検証コマンド）/ Phase 10（AC 充足判定）
- index.md §3 AC-1〜AC-7 / §1.2 経路 inventory（P-2 auto-link 補完）
- Phase 2 §2.3（auto-link status 連結）/ Phase 3 §2（レスポンス不変）
- `outputs/phase-11/manual-test-result.md`（証跡記録の正本）

## 成果物

- 本ファイル（Phase 11 手動テスト・NON_VISUAL 宣言）
- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 証跡記録）

## 統合テスト連携

- §11.1 の自動テスト群が AC-2〜AC-5 の主証跡。実行記録は `manual-test-result.md` に集約し、Phase 10 の AC 判定と整合させる。
- §11.4 の staging 確認は自動テストを補完する end-to-end 証跡。ユーザーゲートのため local deterministic evidence と external runtime evidence を `manual-test-result.md` で別カテゴリ記録する（WEEKGRD-01）。

## 完了条件

- [x] NON_VISUAL を宣言し（タスク種別・非視覚的理由・代替証跡）を明記した
- [x] 証跡の主ソース（自動テスト spec 一覧・local focused evidence PASS）を列挙した
- [x] 3 層評価（Semantic 主軸 / Visual N/A / AI UX N/A）を記録した
- [x] スクリーンショットを作らない理由を記録し `screenshots/.gitkeep` を作らないと明記した
- [x] staging 実機確認手順（orphan 擬似生成 → auto-link 後に member_status 存在 → 詳細 GET 200）をユーザーゲートとして固定した
- [x] `outputs/phase-11/manual-test-result.md` を代替証跡として参照した
