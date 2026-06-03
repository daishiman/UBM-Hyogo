# Workflow: admin-member-detail-status-404-fix

> **[実装区分: 実装仕様書 (implementation)]** — コード変更を伴う（CONST_004 デフォルト）。
> 本 workflow は admin 会員管理の「会員詳細取得 / ステータス更新が 404」を根本解決するための Phase 1-13 タスク仕様書一式である。
> 実コード対象は `apps/api`（+ D1 migration）のみ。`apps/web` は変更しない（既存 UI は 200 を受け取れば正常描画するため）。
> commit・push・PR・remote D1 migration apply・staging deploy はユーザー明示承認まで行わない（CONST_002）。local 実装と focused evidence は同一 wave で完了済み。

staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`）の admin 会員管理で発生している以下の 404 を根本解決する。

- `GET /api/admin/members/{id}` → 404（会員詳細パネルが「読み込み失敗: HTTP 404」）
- `PATCH /api/admin/members/{id}/status` → 404（公開トグル / 一括公開復帰が失敗）

- ブランチ: `fix/admin-member-detail-status-404`
- ベースブランチ: `dev`
- 起点: ユーザー報告（admin 会員管理画面の console error + スクリーンショット, 2026-06-02）

---

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| 分類 | implementation / bugfix / API contract / data integrity / admin-managed data |
| 実装区分 | 実装仕様書（CONST_004 デフォルト。「動かす」=コード変更必須のため） |
| implementation_mode | `new`（P50: 開始時 current branch に未実装。同一 wave で local 実装済み） |
| visualEvidence | NON_VISUAL（`apps/web` を変更しない。UI は既存のまま。証跡は自動テスト + staging admin 画面はユーザーゲート） |
| 優先度 | 高（priority:high。admin の中核機能が staging で機能不全） |
| 規模 | 小〜中（apps/api 4 ファイル編集 + repo helper 1 + migration 1 + tests） |
| workflow_state | implemented_local_evidence_captured |
| GitHub Issue | なし（本 workflow で起票はユーザーゲート。Phase 12 で未タスク化判定） |
| 依存タスク | なし（既存 endpoint surface を変更せず挙動のみ是正） |

---

## 0. 事前調査結論（「別タスクで解決済みでないか」への回答）

ユーザー依頼の「問題が直っているか・別タスクで解決済みでないか」に対する結論。

| 確認 | 結果 | 根拠 |
|------|------|------|
| 同等の修正が current branch / dev に存在するか | **No（未解決）** | `apps/api/src/repository/_shared/builder.ts:388,391` の `return null`、`apps/api/src/routes/admin/member-status.ts:53` の `if (!before) ... 404` は現行コードのまま |
| 404 の原因は `apps/web` のプロキシか | **No** | `apps/web/app/api/admin/[...path]/route.ts` は GET/POST/PATCH/DELETE を無差別に backend `/admin/*` へ透過転送。一覧が通る以上プロキシは健全 |
| 404 は routing（Hono マウント）の問題か | **No** | `apps/api/src/index.ts:271-272` の `app.route("/admin", ...)` 複数マウントは Hono の正常動作。`GET /admin/members/:memberId`（`members.ts:458`）と `PATCH /admin/members/:memberId/status`（`member-status.ts:37`）は定義済みでマッチする |
| 真の原因 | **データ整合性**: `member_identities` 行はあるが `member_status` 行（および一部 `current_response`）が欠落した会員。一覧は `LEFT JOIN member_status / member_responses` で生存するが、詳細・status は行の存在を前提とするため `return null` → 404 | 下記「根本原因」参照 |

→ **本 workflow は必要**。別タスクでは解決されていない。

---

## 1. 根本原因（confirmed）

### 1.1 一覧が通り、詳細・status だけ 404 になる非対称性

| エンドポイント | 定義 | 挙動 | クエリ前提 |
|----------------|------|------|-----------|
| `GET /admin/members`（一覧） | `apps/api/src/routes/admin/members.ts:329` | 200 | `member_identities mi LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id LEFT JOIN member_status ms ON ms.member_id = mi.member_id`。**status 行 / response 行が無くても会員が出る** |
| `GET /admin/members/:memberId`（詳細） | `members.ts:458` → `buildAdminMemberDetailView`（`_shared/builder.ts:372`） | **404** | `builder.ts:388` `if (!identity || !status) return null` / `:391` `if (!response) return null` → route `members.ts:480` で 404 |
| `PATCH /admin/members/:memberId/status` | `member-status.ts:37` | **404** | `:53` `const before = await getStatus(db, mid); if (!before) return 404`。`getStatus`（`repository/status.ts:31`）は `member_status` を SELECT し行無しで null |

### 1.2 なぜ `member_status` が欠落するか（発生経路）

| 経路 | ファイル | 説明 |
|------|---------|------|
| ingest（Form 同期） | `apps/api/src/jobs/sync-forms-responses.ts:303`（`upsertMember` 呼出）、`apps/api/src/repository/members.ts:63`（`upsertMember`） | `upsertMember` は `member_identities` のみ作成。`member_status` は同 job の `setConsentSnapshot`（`status.ts` 経由・`sync-forms-responses.ts:385`）でしか作られず、その経路が条件付き or 例外で抜けると orphan 化する |
| backfill 不在 | — | `member_status` の欠落を埋める migration / script は**存在しない**（`0021` は `member_identities` のみ、`sync-backfill-publish-state` は `member_status` 存在前提） |
| FK 制約なし | `apps/api/migrations/0001_init.sql` / `0002_admin_managed.sql` | `member_status.member_id` に `member_identities` への FK は無く、DB レベルの整合性保証が無い |

### 1.3 安全な後付け INSERT の前提（スキーマ）

`member_status`（`0002_admin_managed.sql:5-15`）の NOT NULL カラムは全て DEFAULT 値を持つ（`public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` / `updated_at=datetime('now')`）。
→ `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` だけで安全に既定行を生成できる。

---

## 2. 採用方針（ユーザー承認済みスコープ: 耐性化＋予防＋backfill 全部）

| # | 層 | 内容 | 対象ファイル |
|---|----|------|-------------|
| F-1 | repo helper | `ensureMemberStatusRow(c, mid)` 新設（`INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)`。冪等・既定行生成） | `apps/api/src/repository/status.ts`（編集） |
| F-2 | 耐性化（詳細） | `buildAdminMemberDetailView`: `if (!identity) return null` のみ残し、`status` 欠落は既定 status で代替、`response` 欠落は劣化 view（profile.summary 空 / sections []、responseId は `current_response_id ?? member_id` フォールバック）を返す | `apps/api/src/repository/_shared/builder.ts`（編集） |
| F-3 | 耐性化（status PATCH） | 404 判定を「`member_status` 行有無」から「`member_identities` 行有無」へ変更。mutation 前に `ensureMemberStatusRow` で既定行を保証（`hiddenReason` のみ更新時も行が無い問題を解消）。`setPublishState` は既存 `INSERT ... ON CONFLICT` を維持 | `apps/api/src/routes/admin/member-status.ts`（編集） |
| F-4 | 予防（ingest） | 新規 identity 作成時に `ensureMemberStatusRow` を必ず呼び、orphan 再発を防止 | `apps/api/src/jobs/sync-forms-responses.ts`（編集） |
| F-5 | backfill（既存修復） | `0024_backfill_member_status.sql`: orphan な `member_identities` に既定 `member_status` 行を INSERT OR IGNORE | `apps/api/migrations/0024_backfill_member_status.sql`（新規） |
| F-6 | 回帰テスト | repo / builder / route / job / migration の回帰テスト | `apps/api/src/**/__tests__/*.spec.ts`（新規・編集） |

> **不変条件の遵守**: 既存 endpoint surface（`/admin/members/:memberId`, `/admin/members/:memberId/status`）は変更しない。`apps/web` から D1 への直接アクセスは行わない（不変条件 #5）。挙動是正のみ。

---

## 3. 受け入れ基準（AC）

| # | 受け入れ基準 | 測定方法 |
|---|-------------|---------|
| AC-1 | 一覧に出る会員（`member_identities` 行あり）は `GET /admin/members/:memberId` が 200 を返す（`member_status` 欠落でも既定 status で 200） | api contract test（status 行欠落 fixture）|
| AC-2 | `current_response` が欠落した会員でも詳細は 200（劣化 view: summary 空 / sections []）で返り、404 にならない | builder.repository.spec |
| AC-3 | `PATCH /admin/members/:memberId/status` は `member_status` 行欠落でも成功し、行を生成して publishState / hiddenReason を反映する | member-status route spec |
| AC-4 | `member_identities` 行が存在しない memberId への詳細 / status は引き続き 404 を返す（真の不存在は 404 維持） | route spec（unknown id）|
| AC-5 | ingest（Form 同期）で新規 identity を作ると同時に `member_status` 既定行が生成される | sync-forms-responses spec |
| AC-6 | migration 0024 適用後、orphan な `member_identities` 全件に `member_status` 行が存在する（冪等・再適用で重複なし） | migration D1 config test |
| AC-7 | 既存挙動の非回帰: 正常会員（status / response あり）の詳細 / status / 一覧は従来と同一レスポンス | 既存 spec 全 PASS |
| AC-8 | `apps/web` は無変更（diff 0）。UI は 200 受信で既存描画のまま会員詳細が表示される | `git diff --name-only` に apps/web を含めない |

---

## 4. スコープ

### 含む
- `apps/api` の 4 ファイル編集 + repo helper 1 + migration 1（F-1〜F-5）
- 上記の回帰テスト（F-6）
- D1 contract test（repository / migration は `vitest.d1.config.ts`）

### 含まない（理由付き）
- `apps/web` の変更（UI は 200 受信で正常。変更不要）
- 新規 endpoint / D1 schema 変更（既存テーブルへの行 backfill のみ。カラム追加なし）
- remote D1 migration apply / staging deploy / commit / push / PR（すべてユーザーゲート = Phase 13）
- GitHub Issue 起票（Phase 12 で未タスク化判定。起票はユーザーゲート）

---

## 5. Phase 構成

| Phase | 名称 | 主成果物 | 状態 |
|-------|------|---------|------|
| [Phase 1](phase-1.md) | 要件定義 | P50 / 分類 / AC / inventory / 命名規則 | completed |
| [Phase 2](phase-2.md) | 設計 | topology / helper 契約 / degraded view 契約 / マージ戦略 / SubAgent lane | completed |
| [Phase 3](phase-3.md) | 設計レビュー | 4 条件評価 / ゲート判定 | completed |
| [Phase 4](phase-4.md) | テスト作成（RED） | command suite / expected result | completed |
| [Phase 5](phase-5.md) | 実装（GREEN） | 変更ファイル全文方針 | completed |
| [Phase 6](phase-6.md) | テスト拡充 | fail path / 回帰 guard | completed |
| [Phase 7](phase-7.md) | カバレッジ確認 | 変更行 line/branch | completed |
| [Phase 8](phase-8.md) | リファクタリング | 重複削減 / 命名整合 | completed |
| [Phase 9](phase-9.md) | 品質保証 | typecheck / lint / 全テスト | completed |
| [Phase 10](phase-10.md) | 最終レビュー | AC 充足 / blocker | completed |
| [Phase 11](phase-11.md) | 手動テスト | NON_VISUAL 証跡 / staging 確認手順 | completed |
| [Phase 12](phase-12.md) | ドキュメント更新 | implementation-guide ほか 6 成果物 | completed |
| [Phase 13](phase-13.md) | PR 作成 | ユーザー承認後のみ | blocked_pending_user_approval |

---

## 6. 正本順位（衝突時）

1. 本 `index.md` §1 根本原因 / §2 採用方針
2. 各 `phase-*.md`
3. `apps/api` 現行コード（`builder.ts` / `member-status.ts` / `status.ts` / `members.ts` / `sync-forms-responses.ts`）
4. `docs/00-getting-started-manual/specs/*.md`

> 既存 API endpoint surface は変更しない。挙動是正は repository / builder / route の内部ロジックに閉じる。
