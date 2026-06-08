# Workflow: issue-1104-member-creation-path-unification

> **[実装区分: 実装仕様書 (implementation)]** — コード変更を伴う（CONST_004 デフォルト）。
> 「member 作成経路を単一 helper に統一し、どの経路から作っても `member_status` 既定行が必ず同期生成される構造にする」という目的は、`apps/api` のコード変更なしには達成できないため、実装仕様書として作成する（ラベルより実態優先・CONST_004）。
> 実コード対象は `apps/api` のみ。`apps/web` は変更しない（不変条件 #5）。新規 endpoint・D1 schema 変更（カラム追加）・FK 制約導入は含まない（FK は followup-002 へ委譲）。
> 本 workflow は **implemented_local_evidence_captured**（ローカル実装・focused 証跡取得済み）段階である。commit・push・PR・staging 検証はすべてユーザー明示承認後にのみ行う（CONST_002 / CONST_006）。
> GitHub Issue #1104 は **CLOSED のまま維持**（reopen しない）。

GitHub Issue #1104（= unassigned-task `admin-member-detail-status-404-fix-followup-001-member-creation-path-unification`）が指摘する「member 作成経路の分散による `member_status` 欠落（orphan 会員）」という構造的リスクを、**生成責務を単一 helper へ集約**することで根本解決する Phase 1-13 タスク仕様書一式。

- ブランチ: `docs/issue-1104-member-creation-path-unification-spec`
- ベースブランチ: `dev`
- 起点: GitHub Issue #1104（親 workflow `admin-member-detail-status-404-fix` の MINOR-FUT-1 / followup-001）

---

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1104-member-creation-path-unification |
| 分類 | implementation / refactor / data integrity / API（apps/api 内部）|
| 実装区分 | 実装仕様書（CONST_004 デフォルト。「構造的に発生不能にする」=コード変更必須） |
| implementation_mode | `new`（P50: 統一 helper は dev に未配置だったため、本 wave で RED/GREEN サイクルとして新規実装） |
| visualEvidence | NON_VISUAL（`apps/web` を変更しない。証跡は自動テスト = D1 contract test。staging smoke はユーザーゲート） |
| 優先度 | 低（priority:low。親タスクの予防＋backfill で止血済み。将来の経路追加時の再発防止が目的） |
| 規模 | 小（scale:small。apps/api repository 層 1-2 ファイル + 呼び出し側 2 ファイル + tests） |
| workflow_state | implemented_local_evidence_captured |
| GitHub Issue | #1104（CLOSED・2026-06-05T01:50:06Z・**reopen しない**） |
| source unassigned-task | `docs/30-workflows/unassigned-task/admin-member-detail-status-404-fix-followup-001-member-creation-path-unification.md` |
| 依存タスク | なし（親 `admin-member-detail-status-404-fix` は landed 済。本タスクはその予防策を構造化する）|
| 責務境界（委譲先） | followup-002（`member_status.member_id` → `member_identities` FK 制約）は DB 層の整合性保証として別関心・**本タスクに含めない** |

---

## 0. 事前調査結論（「別タスクで解決済みでないか」への回答）

ユーザー依頼の「問題が直っているか・別タスクで解決済みでないか / issue が古いか」に対する結論（2026-06-05 現行コードで確認）。

| 確認 | 結果 | 根拠（現行コード） |
|------|------|------|
| 単一 helper（`createMember` / `ensureMember`）が既に存在するか | **No（未解決）** | `grep -rn "createMember\|ensureMember\b" apps/api/src` は `createMemberTagsProvider`（無関係）のみ。member 生成責務を束ねる helper は不在 |
| 散在する `ensureMemberStatusRow` 予防呼び出しは集約済みか | **No（Phase 1 事前調査時点）→ Yes（本 wave 実装後）** | 事前調査では `ensureMemberStatusRow` 呼び出しが **2 箇所に散在**: `apps/api/src/jobs/sync-forms-responses.ts:314`（ingest）/ `apps/api/src/routes/admin/member-status.ts:60`（route mutation 前）。本 wave で ingest は `createMemberWithStatus` 内部委譲へ移管し、route mutation は legacy backstop として意図的保持 |
| `upsertMember` は `member_status` を生成するか | **No（未解決）** | `apps/api/src/repository/members.ts:63` の `upsertMember` は `member_identities` のみ INSERT。`member_status` は呼び出し側に委譲されたまま |
| issue の棚卸し表（§5.1）は現行コードを網羅しているか | **No（issue が陳腐化）** | issue は ingest 経路のみ列挙。**auto-link 経路を見落としている**（下記 §1.2 参照） |
| issue の行番号は現行コードと一致するか | **No（陳腐化）** | issue: `upsertMember` 呼出 `:303` → 実際 `:307` / `setConsentSnapshot` `:385` → 実際 `:391` / backfill migration `0024` → 実際 `0025` |

→ **本 workflow は必要**。別タスクでは解決されておらず、かつ issue の棚卸しは現行コードに対して不完全。本仕様書で issue を現行コードへ最適化したうえで根本解決する。

---

## 1. 根本原因と issue 最適化（confirmed）

### 1.1 構造的問題

`member_identities` 行を生成しうる production 経路が複数あり、各経路が `member_status` 既定行生成を「各自のタイミングで・別呼び出しで」行う。生成責務が単一点に集約されていないため、ある経路が `member_status` 生成を欠くと orphan 会員（`member_identities` あり / `member_status` なし）が発生し、詳細 GET・status PATCH が 404 になる（親タスクが解決した症状の再発リスク）。

### 1.2 member 作成経路の棚卸し（**issue §5.1 を現行コードへ最適化**）

| # | 経路 | identity 生成 | `member_status` 生成 | orphan リスク |
|---|------|--------------|---------------------|--------------|
| P-1 | ingest（Form 同期） | 事前調査: `sync-forms-responses.ts:307` → `upsertMember`（`members.ts:63`, `INSERT ... ON CONFLICT DO UPDATE`）/ 実装後: `createMemberWithStatus` | 事前調査: `sync-forms-responses.ts:314` `ensureMemberStatusRow`（**別呼び出し**・親 F-4 で追加）/ 実装後: helper 内部委譲 | 事前調査では呼び忘れ可能。本 wave で統合済み |
| P-2 | **auto-link（session 解決）** | `session-resolve.ts:53` → `tryAutoLinkIdentityByEmail`（`identities.ts:91`）→ `backfillIdentityFromCandidate`（`identities.ts:69`, `INSERT OR IGNORE INTO member_identities`） | **生成しない（呼び出しなし）** | **現役の orphan 生成経路（issue 見落とし）** |
| P-3 | route mutation（status PATCH） | — | `member-status.ts:60` `ensureMemberStatusRow`（mutation 前の防御） | 既存行への防御のみ・新規生成経路ではない |

> **🔴 最重要発見**: issue §5.1 は P-2（auto-link）を棚卸しから欠落させている。`backfillIdentityFromCandidate` は `INSERT OR IGNORE INTO member_identities` で identity を生成するが `member_status` を一切生成しない。これは staging で観測された orphan の有力な発生源であり、本タスクで必ず統一 helper の対象に含める。

### 1.3 安全な後付け INSERT の前提（スキーマ・現行確認済み）

`member_status`（`apps/api/migrations/0002_admin_managed.sql:5-15`）の NOT NULL カラムは全て DEFAULT 値を持つ（`public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` / `updated_at=datetime('now')`）。
→ `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)`（= 既存 `ensureMemberStatusRow`）だけで安全・冪等に既定行を生成できる。新規 SQL は不要で、既存 helper を再利用する。

---

## 2. 採用方針（How）— 生成責務の単一点集約

| # | 層 | 内容 | 対象ファイル |
|---|----|------|-------------|
| F-1 | repo helper（新設） | `member_identities` の生成（upsert または insert-or-ignore）と `member_status` 既定行生成を **同一 helper 内で必ず両方行う** 単一 helper を新設する（`apps/api/src/repository/members.ts` 付近）。`ensureMemberStatusRow` を内部で呼び、生成責務を 1 点へ集約 | `apps/api/src/repository/members.ts`（編集・helper 追加） |
| F-2 | ingest 差し替え | `sync-forms-responses.ts:307-314` の `upsertMember` + 別呼び出しの `ensureMemberStatusRow` を、単一 helper 1 呼び出しへ置き換え（writeCount=2 の意味は不変） | `apps/api/src/jobs/sync-forms-responses.ts`（編集） |
| F-3 | auto-link 差し替え（**最重要**） | `backfillIdentityFromCandidate`（`identities.ts:69`）の identity INSERT 後に `member_status` 既定行生成を必ず連結し、P-2 の orphan 生成を構造的に解消 | `apps/api/src/repository/identities.ts`（編集） |
| F-4 | route mutation の整理 | `member-status.ts:60` の防御的 `ensureMemberStatusRow` は「既存（legacy）会員への mutation 前防御」であり新規生成経路ではない。**設計判断は Phase 2/3 で確定**（集約 helper へ寄せる or backstop として明示保持） | `apps/api/src/routes/admin/member-status.ts`（要判定） |
| F-5 | 回帰テスト | 単一 helper 単体（identity + status 同期生成・冪等性）/ 各経路（ingest / auto-link）から member を作ると `member_status` が必ず生成される / 既存挙動の非回帰 | `apps/api/src/**/__tests__/*.spec.ts`（新規・編集） |

> **不変条件の遵守**: 既存 endpoint surface・レスポンスは不変。`apps/web` は無変更（不変条件 #5）。D1 schema 変更・FK 導入なし（FK は followup-002）。

---

## 3. 受け入れ基準（AC）

| # | 受け入れ基準 | 測定方法 |
|---|-------------|---------|
| AC-1 | member 作成経路の棚卸し表が文書化され、現存する全経路（**ingest / auto-link**）が列挙されている（issue §5.1 の欠落 = auto-link を補完） | 本 index §1.2 / phase-1.md / `grep` 呼び出し箇所確認 |
| AC-2 | `member_identities` と `member_status` 既定行を必ず同期生成する単一 helper が新設されている | repository spec（helper 単体テスト・冪等性確認） |
| AC-3 | 既存の全 member 作成経路（ingest / auto-link）が単一 helper 経由 or status 連結に差し替えられ、新規生成経路に散在する独立 `ensureMemberStatusRow` 呼び出しが集約されている | `grep` で新規生成経路の散在呼び出しが残っていないこと / 各経路の参照確認 |
| AC-4 | どの経路から member を作っても `member_status` 既定行が生成される（経路ごとの回帰テスト） | sync-forms-responses spec / identities（auto-link）spec |
| AC-5 | 既存 endpoint surface・レスポンスが不変で回帰がない（一覧 / 詳細 / status の従来挙動を維持） | 既存 spec 全 PASS / `mise exec -- pnpm typecheck` 成功 |
| AC-6 | `apps/web` は無変更（diff 0） | `git diff --name-only` に apps/web を含めない |
| AC-7 | D1 schema 変更・新規 endpoint・FK 制約導入を行っていない（followup-002 と責務が重複しない） | `apps/api/migrations/` に新規ファイルなし / `git diff` 確認 |

---

## 4. スコープ

### 含む
- 単一 helper の新設（F-1）と ingest / auto-link 経路の差し替え（F-2 / F-3）
- route mutation 防御呼び出しの設計判定（F-4）
- 上記の回帰テスト（F-5）
- D1 contract test（repository は `vitest.d1.config.ts`）
- 対象は `apps/api` のみ

### 含まない（理由付き）
- `apps/web` の変更（UI は既存 API レスポンス不変のため不要・不変条件 #5）
- 新規 endpoint / D1 schema 変更（カラム追加なし。既存 `ensureMemberStatusRow` を再利用）
- **FK 制約導入（`member_status.member_id` → `member_identities`）= followup-002 へ委譲**（DB 層の整合性保証は別関心。本タスクはアプリ層の生成責務集約に限定）
- commit / push / PR / staging smoke（すべてユーザーゲート = Phase 13）
- GitHub Issue 状態変更（#1104 は CLOSED のまま維持・reopen しない）

### 今回サイクル完結性（CONST_007）
本仕様書が記述する F-1〜F-5 は、本 wave の **1 サイクル内でローカル実装・focused evidence 取得まで完了済み**（apps/api の repository 層 + 呼び出し側 2 ファイル + tests）。先送り・別 PR 分離はない。FK 制約（followup-002）のみ「DB 層の別関心・既に別 Issue で分離済み」という明確な整合性理由で本タスクから除外しており、これは CONST_007 の正当な分離条件（独立した関心・既存の合意済み境界）に該当する。

---

## 5. Phase 構成

| Phase | 名称 | 主成果物 | 状態 |
|-------|------|---------|------|
| [Phase 1](phase-1.md) | 要件定義 | P50 / 分類 / AC / 経路 inventory / 命名規則 | completed |
| [Phase 2](phase-2.md) | 設計 | helper 契約 / 各経路差し替え設計 / F-4 判定 / SubAgent lane | completed |
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

1. 本 `index.md` §1 根本原因（auto-link 補完含む）/ §2 採用方針
2. 各 `phase-*.md`
3. `apps/api` 現行コード（`members.ts` / `identities.ts` / `status.ts` / `sync-forms-responses.ts` / `routes/auth/session-resolve.ts` / `routes/admin/member-status.ts`）
4. `docs/00-getting-started-manual/specs/*.md`
5. GitHub Issue #1104 本文（**ただし §5.1 棚卸しは auto-link 欠落につき本 index §1.2 で上書き**・行番号は現行コードを正とする）

> 既存 API endpoint surface は変更しない。生成責務集約は repository / job / auto-link の内部ロジックに閉じる。
