# Phase 1: 要件定義 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / implementation_mode: `new` / visualEvidence: NON_VISUAL

## 1. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | **No（Phase 1 時点）→ Yes（本 wave 実装後）** | 通常の実装 Phase（RED/GREEN）として開始し、`createMemberWithStatus` を本 wave で実装済み |
| upstream（dev / main）にマージ済み | **No** | `grep` で `createMember`/`ensureMember` helper 不在を確認済み（`createMemberTagsProvider` は無関係） |
| 前提タスク（依存タスク）が完了済み | **Yes** | 親 `admin-member-detail-status-404-fix`（F-1〜F-5 = 予防＋backfill）は landed 済。本タスクはその予防を構造化 |

→ `implementation_mode: new`。Phase 4 = RED テスト設計、Phase 5 = 統一 helper 実装 + 経路差し替え。

## 2. タスク分類

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation task（NON_VISUAL） |
| UI task / docs-only task | **どちらでもない（apps/api backend refactor）** |
| 視覚証跡 | 不要（`apps/web` 無変更・レスポンス不変）。Phase 11 は NON_VISUAL 宣言 |
| 主証跡 | D1 contract test（`vitest.d1.config.ts`）+ typecheck + lint |

## 3. 既存コードの命名規則分析（FB-SDK-07-4）

| 規則 | 観測値（現行 apps/api） |
|------|------------------------|
| repository 関数 | camelCase 動詞始まり: `upsertMember` / `findMemberById` / `ensureMemberStatusRow` / `backfillIdentityFromCandidate` / `setConsentSnapshot` |
| 引数順 | 第 1 引数は `c: DbCtx`、以降に row/id |
| 戻り値 | mutation 系は `Promise<void>`、取得系は `Promise<Row | null>` |
| `ensure*` の意味 | 冪等な既定行生成（`INSERT OR IGNORE`）。`ensureMemberStatusRow` が既存先例 |
| ファイル | `repository/members.ts`（identity CRUD）/ `repository/status.ts`（member_status CRUD）/ `repository/identities.ts`（email↔id 検索・auto-link） |

→ 新規 helper は **camelCase 動詞始まり**・第 1 引数 `DbCtx`・`Promise<void>` を踏襲する。命名候補は Phase 2 で確定（`ensureMemberWithStatus` / `createMember` 等）。`ensure*` プレフィックスは既存先例 `ensureMemberStatusRow` と整合する。

## 4. 受け入れ基準（index.md §3 を Phase 1 として固定）

index.md §3 の AC-1〜AC-7 を本 Phase の受け入れ基準とする（再掲省略。index.md が正本）。

## 5. member 作成経路 inventory（AC-1 の正本・現行コード grep 由来）

| # | 経路 | 起点ファイル:行 | identity 生成関数 | member_status 生成 |
|---|------|----------------|------------------|-------------------|
| P-1 | ingest（Form 同期） | 事前調査: `apps/api/src/jobs/sync-forms-responses.ts:307` / 実装後: `apps/api/src/jobs/sync-forms-responses.ts:306` | 事前調査: `upsertMember`（`repository/members.ts:63`）/ 実装後: `createMemberWithStatus` | 事前調査: `sync-forms-responses.ts:314`（別呼び出し `ensureMemberStatusRow`）/ 実装後: helper 内部委譲 |
| P-2 | auto-link（session 解決） | `apps/api/src/routes/auth/session-resolve.ts:53` | `tryAutoLinkIdentityByEmail`（`identities.ts:91`）→ `backfillIdentityFromCandidate`（`identities.ts:69`） | **なし（orphan 生成経路）** |
| P-3 | route mutation（status PATCH 防御） | `apps/api/src/routes/admin/member-status.ts:60` | （生成しない・防御呼び出しのみ） | `ensureMemberStatusRow`（既存行への防御） |

> grep コマンド（再現・AC-1 / AC-3 検証用）:
> ```bash
> grep -rn "upsertMember\b" apps/api/src --include="*.ts" | grep -v ".spec.ts"
> grep -rn "ensureMemberStatusRow" apps/api/src --include="*.ts" | grep -v ".spec.ts"
> grep -rn "backfillIdentityFromCandidate\|tryAutoLinkIdentityByEmail" apps/api/src --include="*.ts" | grep -v ".spec.ts"
> grep -rn "INSERT INTO member_identities\|INSERT OR IGNORE INTO member_identities" apps/api/src --include="*.ts" | grep -v ".spec.ts"
> ```

## 6. targeted test ファイルリスト（FB-UI-02-2・全件 test の SIGKILL 回避）

PASS済みローカル実装が実行する focused test 対象（`vitest.d1.config.ts` 経由・対象ファイル明示指定）:

- `apps/api/src/repository/__tests__/members.repository.spec.ts`（新規 or 拡張・単一 helper 単体）
- `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts`（auto-link → member_status 生成・新規 or 拡張）
- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（ingest 経路の回帰）
- `apps/api/src/routes/admin/member-status.contract.spec.ts`（既存防御の非回帰）

> 実ファイル名は既存命名を Phase 4 で `ls apps/api/src/**/__tests__/` により確定する。上記はプレースホルダ。

## 7. carry-over 確認（前タスク成果物の棚卸し）

| 項目 | 状態 |
|------|------|
| 親 `admin-member-detail-status-404-fix` | landed 済（`ensureMemberStatusRow` / `defaultMemberStatusRow` helper・ingest F-4 予防・backfill `0025`）。本タスクは「F-4 の散在予防」を「単一 helper による構造保証」へ昇格させる差分作業 |
| 本タスク新規作業 | (1) 統一 helper 新設（F-1）(2) auto-link 経路への status 連結（F-3・親が見落とした経路）(3) ingest の 2 呼び出し統合（F-2） |
| 重複回避 | `ensureMemberStatusRow` 自体は再利用（再実装しない）。backfill migration 0025 も再利用（新規 migration なし） |

## 8. 完了条件

- [x] P50 チェック完了（implementation_mode: new 確定）
- [x] タスク分類記録（NON_VISUAL / apps/api backend）
- [x] 命名規則分析記録（camelCase / DbCtx 第 1 引数 / ensure* 先例）
- [x] AC 固定（index.md §3）
- [x] 経路 inventory 固定（P-1/P-2/P-3・auto-link 補完）
- [x] targeted test リスト列挙
- [x] carry-over 棚卸し完了
