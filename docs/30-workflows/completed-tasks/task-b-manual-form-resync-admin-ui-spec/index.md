# Workflow: task-b-manual-form-resync-admin-ui-spec

> **[実装区分: 実装仕様書 / implementation]**
> **[implementation_mode: verify_existing]** — Task B（手動フォーム再取込 管理 UI）は
> commit `745c95115`（PR #1064・2026-06-01 dev マージ済）で **既に実コードへ landed 済み**。
> 本仕様書一式は greenfield 実装指示ではなく、**landed 実装の正本記述 + 回帰確認（diff-check）**
> として Phase 1〜13 を構成する。コミット・PR・staging deploy・SYNC_ADMIN_TOKEN 投入は
> ユーザー明示指示まで行わない（CONST_002）。

`docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/B-manual-form-resync-admin-ui.md`
（親 workflow の Task B 単一タスクファイル）を、task-specification-creator skill の Phase 1〜13
実行可能仕様書へ展開したもの。実コードへ landed 済みのため、各 Phase は「実装の正本記述」と
「回帰確認手順」を主軸に記述する。

- ブランチ: `docs/task-b-manual-form-resync-admin-ui-spec`
- ベースブランチ: `dev`
- 起票元: ユーザー直接依頼（2026-06-01、`tasks/B-manual-form-resync-admin-ui.md` を Phase 1-13 化）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| 実装区分 | 実装仕様書 |
| implementation_mode | `verify_existing` |
| タスク分類 | UI task（VISUAL・admin パネル追加） |
| visualEvidence | `VISUAL_ON_EXECUTION`（static UI contract PNG captured; authenticated runtime screenshot は認証必須のため user-gated・pending） |
| workflow_state | `implemented_local_evidence_captured`（landed in `745c95115` / #1064。runtime screenshot は user-gated） |
| 正本コード | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` 他 |
| 親 workflow | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` |

---

## 0. P50 事前確認結論（landed 実装ベースライン）

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch / dev に実装が存在する | **Yes**（commit `745c95115`） | Phase 5 を「差分確認」へ切替・回帰確認を主作業とする |
| upstream（dev）にマージ済み | **Yes**（PR #1064） | worktree への再実装不要・正本記述に徹する |
| 前提タスク（取込本体・endpoint）完了済み | **Yes**（cron `runResponseSync` / `POST /admin/sync/responses` / `?fullSync=true`） | `apps/api` 変更ゼロを invariant とする |

### landed ファイル一覧（実在確認済み）

| パス | 区分 | 状態 |
|------|------|------|
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | schema/型/定数 | 実在 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | パネル component | 実在 |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | マウント先（`:129`） | 実在 |
| `apps/web/app/api/admin/[...path]/route.ts` | proxy bearer 注入（`:29-92`） | 実在 |
| `apps/web/src/lib/env.ts` | `SYNC_ADMIN_TOKEN`（`:10, :52`） | 実在 |
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | パネル test（TC-B1..B8） | 実在 |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | schema test（TC-S1..S7） | 実在 |

> **重要（原タスクファイルとの drift 補正）**: 原 `tasks/B-manual-form-resync-admin-ui.md` の記述と
> landed 実装には以下の差分があり、本仕様書は **landed 実装を正本** として記述する。
> 詳細は `phase-1.md §5` を参照。

---

## Phase 一覧

| Phase | 名称 | 主眼（verify_existing 読み替え） |
|-------|------|-------------------------------|
| 1 | 要件定義 | scope/AC/inventory + landed 実装の正本固定 + drift 補正 |
| 2 | 設計 | 責務境界・状態所有権・proxy 認証境界の正本記述 |
| 3 | 設計レビュー | 4 条件評価 + Phase 4 進行判定 |
| 4 | テスト作成 | landed test（TC-B1..B8 / TC-S1..S7）の coverage 写像 |
| 5 | 実装 | 差分確認（diff-check）— 新規実装なし |
| 6 | テスト拡充 | fail path / 回帰 guard の現状確認と拡充候補 |
| 7 | カバレッジ確認 | 変更面（パネル/schema/proxy）の coverage 実測 |
| 8 | リファクタリング | 重複・navigation drift の点検 |
| 9 | 品質保証 | typecheck / lint / トークン / 不変条件の一括判定 |
| 10 | 最終レビュー | AC-B1..B3 充足判定・blocker 判定 |
| 11 | 手動テスト | VISUAL（static UI contract PNG captured; runtime screenshot は user-gated・代替証跡を記録） |
| 12 | ドキュメント更新 | implementation-guide / spec sync / 未タスク / feedback |
| 13 | PR作成 | user 明示承認後のみ |

---

## Phase 仕様書リンク

- [Phase 1 — 要件定義](phase-1.md)
- [Phase 2 — 設計](phase-2.md)
- [Phase 3 — 設計レビュー](phase-3.md)
- [Phase 4 — テスト作成](phase-4.md)
- [Phase 5 — 実装（差分確認）](phase-5.md)
- [Phase 6 — テスト拡充](phase-6.md)
- [Phase 7 — カバレッジ確認](phase-7.md)
- [Phase 8 — リファクタリング](phase-8.md)
- [Phase 9 — 品質保証](phase-9.md)
- [Phase 10 — 最終レビュー](phase-10.md)
- [Phase 11 — 手動テスト](phase-11.md)
- [Phase 12 — ドキュメント更新](phase-12.md)
- [Phase 13 — PR作成](phase-13.md)

---

## 正本順位（衝突時の優先度）

1. landed 実コード（`apps/web/...` の current facts）
2. `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/phase-1.md`（AC-B 群）
3. `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/B-manual-form-resync-admin-ui.md`（原タスク・drift 部分は (1) 優先）
4. `docs/00-getting-started-manual/specs/*.md`
