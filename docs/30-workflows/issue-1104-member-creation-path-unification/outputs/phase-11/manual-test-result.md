# Phase 11: 手動テスト証跡 — issue-1104-member-creation-path-unification

> **[実装区分: 実装仕様書 / NON_VISUAL / implemented_local_evidence_captured]**

## NON_VISUAL 宣言 [Feedback 4 / WEEKGRD-03 / BEFORE-QUIT-001]

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: `apps/web` を一切変更しない（不変条件 #5）。変更は `apps/api` の repository / job / auto-link 内部ロジックに閉じる。既存 endpoint surface・レスポンス shape は不変であり、画面（UI/UX）に視覚的変化が一切発生しない。
- **証跡の主ソース = D1 contract test（自動）**: `vitest.d1.config.ts` 経由の D1 contract test を主証跡とする。具体的には「単一 helper `createMemberWithStatus` 単体（identity + member_status 同期生成 / 冪等性）」「ingest 経路（sync-forms-responses）回帰」「auto-link 経路（identities / session-resolve）で `member_status` が必ず生成される」「route 防御（member-status）の非回帰」を機械検証する。これに `typecheck` / `lint` / grep gate（新規生成経路に独立 `ensureMemberStatusRow` が残らないこと）を加えた 4 系統を、視覚証跡（スクリーンショット）の代替とする。
- **スクリーンショットを作らない理由**: `apps/web` 無変更でレスポンス・画面が不変のため。視覚回帰を撮っても before/after が同一であり証跡価値がない。member 生成は backend 内部の D1 書き込みであり、UI からは観測できない（観測対象は D1 行の存在 = contract test の責務）。

## implemented_local_evidence_captured 段階の証跡ステータス [重要]

- 本 workflow は **implemented_local_evidence_captured**（ローカル実装・証跡取得済み）段階である。
- 下表の自動テストはローカル実装 wave で実行済みであり、focused evidence は **5 files / 51 tests PASS**。commit / PR / staging smoke のみユーザーゲートとして残す。
- 本ファイルは「何を・どの主ソースで検証したか」の証跡記録であり、local deterministic evidence と external runtime evidence を分離する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-1104-member-creation-path-unification |
| タスク種別 | NON_VISUAL（実装仕様書 / implementation_mode: new） |
| 段階 | implemented_local_evidence_captured（ローカル実装済み・focused D1 tests / typecheck / lint PASS） |
| 実施者（実装時） | PASS済みローカル実装（commit/PR/staging はすべて user-gated） |
| 環境（実装時） | ローカル（Node 24.15.0 / pnpm 10.33.2・`mise exec` 経由） |
| GitHub Issue | #1104（CLOSED・reopen しない） |

## 証跡の主ソース（PASS（2026-06-05 focused evidence）する自動テスト）

D1 contract test（`vitest.d1.config.ts` 経由・targeted test 対象を明示指定して SIGKILL 回避 / FB-UI-02-2）:

- `apps/api/src/repository/__tests__/members.repository.spec.ts`（単一 helper `createMemberWithStatus` 単体・冪等性）
- `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts`（auto-link → `member_status` 同期生成 / 既存 identity early return 補完）
- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（ingest 経路の回帰）
- `apps/api/src/routes/admin/member-status.contract.spec.ts`（既存防御 P-3 の非回帰）
- `apps/api/src/routes/auth/session-resolve.contract.spec.ts`（route 実経路が repository repair を迂回しないこと）

> focused evidence: repository 2 files / 14 tests PASS、contract 3 files / 37 tests PASS、合計 5 files / 51 tests PASS。

## 検証項目チェックリスト（TC-ID 形式・期待値）

下表は **期待値の契約**であり、状態列は implemented_local_evidence_captured 段階のため全件 `PASS（2026-06-05 focused evidence）`。

| TC-ID | 検証内容 | 期待値 | 主ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-01 | `createMemberWithStatus` が identity + member_status を同期生成 | 呼び出し後、`member_identities` と `member_status` の両行が存在 | members spec | PASS（2026-06-05 focused evidence） |
| TC-02 | `createMemberWithStatus` の冪等性 | 同一 row で再呼び出ししても throw せず重複行を作らない（`ON CONFLICT` / `INSERT OR IGNORE`） | members spec | PASS（2026-06-05 focused evidence） |
| TC-03 | ingest 経路（P-1）から member を作ると member_status が生成される | sync 後に対象 member の `member_status` 既定行が存在・`writeCount += 2` 不変 | sync-forms-responses spec | PASS（2026-06-05 focused evidence） |
| TC-04 | auto-link 経路（P-2）から member を作ると member_status が生成される（**最重要・issue 見落とし補完**） | `backfillIdentityFromCandidate` 後、または既存 identity 早期 return 後に `member_status` 既定行が存在（従来は orphan） | identities spec | PASS（2026-06-05 focused evidence） |
| TC-05 | auto-link の戻り値契約が不変 | `backfillIdentityFromCandidate` は `Promise<MemberIdentityRow \| null>` を維持（status 連結は副作用追加のみ） | identities spec | PASS（2026-06-05 focused evidence） |
| TC-06 | route 防御（P-3）の非回帰 | `member-status.ts:60` の防御呼び出しが legacy orphan への mutation 前に既定行を保証する挙動を維持 | member-status route spec | PASS（2026-06-05 focused evidence） |
| TC-06b | session-resolve route が既存 identity repair を迂回しない | `session-resolve` が `tryAutoLinkIdentityByEmail` 経由で既存 identity の `member_status` 欠落を補完し、default status により `rules_declined` へ倒す | session-resolve contract spec | PASS（2026-06-05 focused evidence） |
| TC-07 | 新規生成経路に独立 `ensureMemberStatusRow` 散在が残らない（AC-3） | grep で P-1/P-2 に独立呼び出しが 0 件（P-3 は意図的保持で対象外） | grep gate | PASS（2026-06-05 focused evidence） |
| TC-08 | 既存 endpoint surface・レスポンス不変（AC-5） | 既存 spec 全 PASS / `pnpm typecheck` exit 0 / `pnpm lint` exit 0 | 既存 spec + typecheck + lint | PASS（2026-06-05 focused evidence） |
| TC-09 | `apps/web` 無変更（AC-6） | `git diff --name-only` に `apps/web` を含めない | git diff | PASS（2026-06-05 focused evidence） |
| TC-10 | D1 schema 変更・新規 migration なし（AC-7） | `apps/api/migrations/` に新規ファイルなし | git diff | PASS（2026-06-05 focused evidence） |

## staging 手動確認手順（ユーザーゲート・概要）

staging 実走はユーザー明示承認後にのみ実施する（CONST_002 / CONST_006）。概要のみ記録する:

1. ユーザー承認のもと `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` で apps/api を staging へ deploy。
2. auto-link が発火するシナリオ（未 link の認証済セッションで初回 email 一致解決）を 1 件実行し、対象 member の `member_status` 既定行が生成されることを D1 で確認（`bash scripts/cf.sh d1 ...` の read-only クエリ）。
3. ingest（Form 同期）を 1 回走らせ、新規 member に `member_status` 既定行が付くことを確認。
4. 既存 admin 機能（一覧 / 詳細 GET / status PATCH）が 404 なく従来どおり動くことを確認（回帰なし）。

> staging deploy / D1 への mutation / authenticated smoke は副作用を伴うため、本仕様書の責務外（Phase 13・user-gated）。

## source-level PASS と環境ブロッカーの分離 [WEEKGRD-01]

- **source-level（実測済み）**: TC-01〜TC-10 は local focused evidence で PASS。`createMemberWithStatus` は既存 `upsertMember` + `ensureMemberStatusRow` の内部委譲であり、auto-link 既存 identity early return path も `ensureMemberStatusRow` で補完済み。
- **環境ブロッカー**: Vitest / esbuild runtime（arch / worktree isolation / esbuild version）のみ想定。発生時は `pnpm verify:vitest-runtime` で切り分ける（本タスク固有の欠陥ではなく環境要因として分離記録する）。

## 結論

NON_VISUAL タスクとして、視覚証跡の代替に D1 contract test（4 spec）+ typecheck + lint + grep gate を主ソースとする。本 workflow は **implemented_local_evidence_captured**（ローカル実装・focused evidence 取得済み）段階で、TC-01〜TC-10 は local deterministic evidence として PASS。スクリーンショットは `apps/web` 無変更・レスポンス不変のため不要。commit / push / PR / staging smoke はすべて user-gated。
