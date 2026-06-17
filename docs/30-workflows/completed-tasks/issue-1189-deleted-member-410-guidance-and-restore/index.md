# issue #1189 — 退会済み会員（410）の本格対応: /profile 明示誘導 + 管理画面復元ボタン（実装仕様書）

> **実装区分: 実装仕様書**（コード変更を伴う・CONST_004 デフォルト）
> 対象は `apps/web` 表現層 2 系統（会員 `/profile` の 410 分岐文言/CTA、管理 `MemberDrawer` の復元ボタン配線）。
> `apps/api` / D1 schema / Google Form 仕様は**変更しない**（復元 API `POST /admin/members/:memberId/restore` は実装・テスト済みの既存資産を配線するのみ）。

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-MEMBER-410-DELETED-GUIDANCE-AND-RESTORE-001` |
| ワークフロー名 | issue-1189-deleted-member-410-guidance-and-restore |
| 起点 issue | #1189（OPEN・`status:unassigned`。**本タスクで issue 状態は変更しない**） |
| 親タスク | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/`（未タスク C-1） |
| 分類 | 実装（会員 UX 行き止まり解消 + 管理オペレーション配線） |
| 実装区分 | 実装仕様書（CONST_005 必須項目を Phase 5 に明記） |
| implementation_mode | `new`（既存ファイル編集 + テスト新規 1 本） |
| taskType / visualEvidence | implementation / **VISUAL**（/profile バナー・admin drawer の見た目変更あり） |
| 対応パターン | **A+B 両対応**（ユーザー合意済み 2026-06-12: 明示誘導 + 管理画面復元ボタン） |
| 優先度 | low（原 issue 準拠） |
| ステータス | **implemented_local_evidence_captured**（local 実装 + focused evidence 完了、PR/user runtime pending） |
| 作成日 | 2026-06-12 |

## Issue 現行コード最適化（issue_optimization）

原 issue #1189 は「真因が H3（410）と確定するまで着手不可（`deferred_pending_root_cause`）」を着手条件としていたが、
最新コード調査（2026-06-12）により以下の通り**前提を現在の事実へ再定義**した。

| 原 issue の前提 | 現在の事実（current facts） |
|----------------|---------------------------|
| staging /profile 失敗の真因が H3(410) と確定するまで着手不可 | staging 事象は H5(transport) 路線として後続 WF（PR #1194 / #1214 = `profile-session-transport-observability-fail-closed`）が観測性向上 + fail-closed を実装済み。**本タスクは staging 事象の真因と独立**した「退会済み会員の行き止まり UX」としてコード読解のみで成立する（`session-guard.ts:95-100` が `is_deleted=1` で 410 を返し、`session-error-display.ts:34-42` が行き止まり文言を返すことは静的に確定） |
| 復帰の技術要件（is_deleted=0 で足りるか）が未調査 | **復元 API は実装・テスト済み**: `apps/api/src/routes/admin/member-delete.ts:121-168` `POST /admin/members/:memberId/restore`（`member_status.is_deleted=0` + `deleted_members` 行削除 + audit `admin.member.restored`。409 `member_not_deleted` ガードあり）。contract test `member-delete.contract.spec.ts` 済み |
| 復帰 or 明示誘導はプロダクト判断で未合意 | **A+B 両対応で合意済み**（AskUser 2026-06-12）: 会員向けは明示誘導（自己復帰なし）、復元操作は管理者専権（`MemberDrawer` にボタン配線） |
| — | web 側 `restoreMember`（`apps/web/src/lib/admin/api.ts:85`）は定義済みだが live 使用 0 件。`MemberDrawer.tsx:286` は「復元する場合は管理者にお問い合わせください」と表示するのみでボタンなし＝管理者も UI から復元できない |

## このタスクの結論（必要性判定）

**実行が必要（未解決）**。退会済み会員（`member_status.is_deleted=1`）が `/profile` を開くと
「アカウントの利用状態を確認できませんでした。管理者に確認してください。」＋無意味な「再読み込み」リンクのみが表示され、
次のアクションが存在しない。さらに案内先の管理者にも UI 上の復元手段がなく、両側が行き止まりである。
他タスク（PR #1194 / #1210 / #1214 等）はこのギャップを解消していない（調査 2026-06-12・コード根拠は Phase 1 参照）。

## ゴール（DoD 概要）

1. **C1（会員・パターン A）**: `/profile` の 410 分岐が「退会済みである旨＋運営問い合わせ案内＋トップへ戻る導線」を表示し、無意味な再読み込みリンクを出さない。`data-cause="session-410"` と 404/5xx/FAILED/401 の既存挙動は不変。
2. **C2（管理者・パターン B）**: `MemberDrawer` の「退会済み」セクションに復元ボタンを追加し、既存 `POST /admin/members/:memberId/restore` を `useAdminMutation`（不変条件 #10 準拠）経由で配線。成功時に drawer 表示が即時復元状態へ更新される。
3. `apps/api` / D1 / Google Form 変更ゼロ。typecheck / lint / focused vitest / verify:tokens 全 PASS。
4. 不変条件 #11（memberId をログ/レスポンスへ新規露出しない）維持。

詳細 DoD・検証コマンドは [outputs/phase-5/phase-5.md](outputs/phase-5/phase-5.md)（CONST_005 必須項目）と
[outputs/phase-10/phase-10.md](outputs/phase-10/phase-10.md) を参照。

## 変更対象ファイル（実装サマリー）

| # | パス | 種別 | concern |
|---|------|------|---------|
| 1 | `apps/web/app/(member)/profile/_lib/session-error-display.ts` | 編集 | C1: 410 分岐の文言/CTA |
| 2 | `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` | 編集 | C1: 410 期待値更新 |
| 3 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | C1: 410 描画期待値更新（該当アサーションがある場合） |
| 4 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | C2: 復元ボタン配線 |
| 5 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx` | 新規 | C2: 復元フローのテスト |

## Phase 構成

| Phase | 名称 | status | 成果物 |
|-------|------|--------|--------|
| 1 | 要件定義 | completed | [phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | 設計 | completed | [phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | 設計レビュー | completed | [phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | テスト作成 | completed | [phase-4.md](outputs/phase-4/phase-4.md) |
| 5 | 実装 | completed | [phase-5.md](outputs/phase-5/phase-5.md) |
| 6 | テスト拡充 | completed | [phase-6.md](outputs/phase-6/phase-6.md) |
| 7 | カバレッジ確認 | completed | [phase-7.md](outputs/phase-7/phase-7.md) |
| 8 | リファクタリング | completed | [phase-8.md](outputs/phase-8/phase-8.md) |
| 9 | 品質保証 | completed | [phase-9.md](outputs/phase-9/phase-9.md) |
| 10 | 最終レビュー | completed | [phase-10.md](outputs/phase-10/phase-10.md) |
| 11 | 手動テスト（VISUAL） | completed | [phase-11.md](outputs/phase-11/phase-11.md) |
| 12 | ドキュメント更新 | completed | [phase-12.md](outputs/phase-12/phase-12.md) |
| 13 | PR作成 | pending_user_approval | [phase-13.md](outputs/phase-13/phase-13.md) |

> Phase 1-12 の status `completed` は「実装・local focused evidence・Phase 12 同期が完了した」ことを示す。
> staging visual screenshot / D1 mutation / commit / push / PR / issue #1189 状態変更は user-gated。
> commit / push / PR はユーザー明示承認まで実行しない（CONST_002）。

## 不変条件

1. issue #1189 の GitHub 上の状態（OPEN/CLOSED・ラベル）は**変更しない**（ユーザー指示）。実装完了後のクローズ判断はユーザーに委ねる。
2. `apps/api` のコード・`session-guard.ts` の 410 返却体系・restore endpoint の契約は**変更しない**（既存資産の配線のみ）。
3. D1 schema・Google Form 仕様は変更しない。D1 直接アクセスは `apps/api` に閉じる（プロジェクト不変条件 #5）。
4. `/me/*` 系のログ・レスポンスへ memberId を新規露出しない（プロジェクト不変条件 #11）。admin 画面内の既存 memberId 表示範囲は維持。
5. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（プロジェクト不変条件 #10）。legacy `@/lib/useAdminMutation` への新規参照を増やさない。
6. 色は `var(--ubm-*)` トークンのみ（HEX 直書き禁止・`verify:tokens` PASS 維持）。
7. 新規テストは `*.spec.{ts,tsx}` のみ（プロジェクト不変条件 #8）。
8. 一般会員の**自己復帰フロー（会員自身が復元を実行する API/UI）は実装しない**（明示誘導＋管理者復元で根本解消する合意。自己復帰は新 endpoint 追加＝スコープ外宣言であり先送りではない）。

## CONST_007 宣言（スコープ完結性）

本 workflow は **1 サイクル内で完了できるスコープ**に収め、local 実装まで完了した
（編集 4 ファイル + 新規テスト 1 ファイル・API 新設なし・D1 変更なし）。「将来タスク」「別 PR」前提の分割はない。
一般会員の自己復帰フローはスコープ外（先送りではなく、合意済みプロダクト判断による対象外）。

## 参照

| 種別 | パス |
|------|------|
| 起点 issue | https://github.com/daishiman/UBM-Hyogo/issues/1189 |
| 親 WF 未タスク指示書 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/task-410-deleted-member-recovery-or-guidance.md` |
| 後続 WF（transport 路線） | `docs/30-workflows/profile-session-transport-observability-fail-closed/` |
| API 実装（不変・配線対象） | `apps/api/src/routes/admin/member-delete.ts:121-168` |
| API 410 返却（不変） | `apps/api/src/middleware/session-guard.ts:95-100` |
| web 410 表示（編集対象） | `apps/web/app/(member)/profile/_lib/session-error-display.ts:34-42` |
| admin drawer（編集対象） | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:273-289` |
