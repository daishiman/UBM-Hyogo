# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 4 (followup) |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## ユーザー承認確認文（冒頭必須）

**この Phase はユーザーの明示承認がある場合のみ実行する。承認なしで `gh pr create` を発火しない。**
承認形式: 「PR 作成を承認」「PR 出してよい」「OK / approve」等の明示文言。曖昧な指示の場合は再確認すること。

## 目的

Phase 1〜12 の成果物（migration 0007 / repository helper / route guard / spec 更新）を `feature/04b-followup-001-admin-queue-request-status-metadata` ブランチに push し、`feature/* → dev` PR を user 承認後に作成する。Issue #217 を `Closes` で連動させる。

## 実行タスク

1. local check（typecheck / lint / test / build）
2. local-check-result.md 作成
3. change-summary.md 作成
4. PR template 整備
5. user 承認確認
6. 承認後 `git push -u origin ...` + `gh pr create`
7. pr-info.md / pr-creation-result.md 作成（PR 作成後。未承認時は blocked 理由を記録）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/ | 全成果物 |
| 必須 | outputs/phase-11/ | smoke evidence |
| 必須 | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | 元 Issue #217 |

## 実行手順

### ステップ 1: 最終 local check
```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F apps/api test
mise exec -- pnpm -F apps/api build
```

### ステップ 2: local-check-result.md
- 5 コマンドの exit code / 所要時間 / 警告件数
- typecheck: 0 errors
- lint: 0 errors / warnings 許容（既存基準に従う）
- test: apps/api 全 green、新規追加ケース（adminNotes state transition / routes/me 再申請）含む
- build: opennextjs / wrangler bundle PASS

### ステップ 3: change-summary.md（change-summary）
変更ファイル一覧:
- `apps/api/migrations/0007_admin_member_notes_request_status.sql`（新規）
  - ALTER TABLE で 3 列追加（request_status / resolved_at / resolved_by_admin_id）
  - 既存 visibility/delete_request 行を pending に backfill
  - partial index `idx_admin_notes_pending_requests` 作成
- `apps/api/src/repository/adminNotes.ts`（改修）
  - `RequestStatus` 型 / Row interface 拡張
  - `markResolved` / `markRejected` 追加
  - `hasPendingRequest` を pending 限定化
- `apps/api/src/routes/me/services.ts`（改修）
  - `memberSelfRequestQueue` ガードを pending 限定に切替
- `apps/api/src/repository/__tests__/adminNotes.test.ts`（追加）
  - state transition 6 ケース
- `apps/api/src/routes/me/index.test.ts`（追加）
  - resolved 後の再申請 202 ケース
- `docs/00-getting-started-manual/specs/07-edit-delete.md`（追記）
  - queue 状態遷移節（Mermaid + request_status 値定義）
- `docs/00-getting-started-manual/specs/08-free-database.md`（追記）
  - admin_member_notes に 3 列 + index を反映

AC trace: AC-1〜AC-11 は `outputs/phase-07/ac-matrix.md` 参照。
不変条件: #4 / #5 / #11 PASS（`outputs/phase-12/phase12-task-spec-compliance-check.md`）。

### ステップ 4: PR template

```
title: feat(api): admin_member_notes リクエスト処理メタデータ整備 (Issue #217)

body:
## Summary
- `admin_member_notes` に `request_status` / `resolved_at` / `resolved_by_admin_id` を追加し、本人再申請ガードと admin resolve workflow が同一の正本を参照する構造に統一
- `markResolved` / `markRejected` helper を追加し、`pending → resolved` / `pending → rejected` の単方向 state transition を repository で担保
- partial index `idx_admin_notes_pending_requests` で pending 検索を高速化
- 本人再申請が「resolved 行のみ存在 → 202」「pending 行存在 → 409」となる API 契約を確立
- `docs/00-getting-started-manual/specs/07-edit-delete.md` に queue 状態遷移節を追記

## Test plan
- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `mise exec -- pnpm -F apps/api test` PASS（新規ケース込み）
- [x] migration 0007 を local D1 に dry-run 適用、backfill 件数を SELECT で確認
- [x] `EXPLAIN QUERY PLAN` で partial index hit を確認
- [x] curl で本人再申請 → 409 / resolve 後 → 202 の差分を確認

## Evidence
- outputs/phase-11/wrangler/migration-apply.txt
- outputs/phase-11/sql/{backfill-status-counts,explain-pending-index,general-null-check}.txt
- outputs/phase-11/curl/me-{visibility,delete}-{409,202}.txt
- outputs/phase-12/phase12-task-spec-compliance-check.md

## Risks
- 既存 production の `admin_member_notes` 行に対する backfill UPDATE 件数が想定外に多い場合は migration 適用時間が伸びる可能性 → Phase 5 runbook で件数事前計測手順を記載済み

Closes #217
```

### ステップ 5: 承認後 PR 発行
```bash
# user 承認後のみ実行
git push -u origin feature/04b-followup-001-admin-queue-request-status-metadata
gh pr create --base dev \
  --head feature/04b-followup-001-admin-queue-request-status-metadata \
  --title "feat(api): admin_member_notes リクエスト処理メタデータ整備 (Issue #217)" \
  --body-file outputs/phase-13/pr-body.md
```

## approval gate

| ゲート | 通過条件 | 失敗時の挙動 |
| --- | --- | --- |
| user 明示承認 | 「承認」「OK」「approve」等の明示文言を受領 | 待機。`gh pr create` を発火しない |
| local-check 全 PASS | typecheck / lint / test / build すべて exit 0 | 差し戻し、Phase 9 へ戻す |
| Phase 12 close-out | 必須 6 タスク成果物 + `main.md` の 7 ファイルすべて存在 | 差し戻し、Phase 12 へ戻す |

## local-check-result（local-check-result）

| コマンド | exit | 所要時間 | 備考 |
| --- | --- | --- | --- |
| `pnpm install` | TBD | TBD | prepare で lefthook install |
| `pnpm typecheck` | TBD | TBD | 0 errors |
| `pnpm lint` | TBD | TBD | 0 errors |
| `pnpm -F apps/api test` | TBD | TBD | 全 green |
| `pnpm -F apps/api build` | TBD | TBD | wrangler bundle PASS |

## change-summary（change-summary）

- migration: 1 ファイル新規
- code: repository 1 / routes 1 改修
- test: 2 ファイル拡張
- spec: 2 ファイル追記
- AC: 11 件 trace 済
- 不変条件: #4 / #5 / #11 PASS

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 後続 wave | merge 後に 07a / 07c が `markResolved` / `markRejected` を呼び出し |

## 多角的チェック観点

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #4 | member_responses 非更新 | OK |
| #5 | apps/api 内のみ | OK |
| #11 | admin が note のみ更新 | OK |

## CI チェック

- typecheck / lint / test の required status checks PASS
- verify-indexes-up-to-date PASS（本タスクは indexes 影響なし想定）
- docs lint PASS

## close-out チェックリスト

- [ ] user 承認あり
- [ ] local-check-result.md 記載済
- [ ] change-summary.md 記載済
- [ ] pr-info.md / pr-creation-result.md 記載済（未承認時は blocked と明記）
- [ ] PR body に Closes #217
- [ ] PR が `feature/04b-followup-001-* → dev`
- [ ] artifacts.json で phase 13 を completed
- [ ] PR URL を outputs/phase-13/main.md に記録

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | 5 コマンド |
| 2 | local-check-result | 13 | pending | exit code |
| 3 | change-summary | 13 | pending | 変更一覧 |
| 4 | PR template | 13 | pending | title/body |
| 5 | approval gate | 13 | pending | user 承認 |
| 6 | gh pr create | 13 | pending | 承認後のみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成記録 + URL |
| ドキュメント | outputs/phase-13/local-check-result.md | check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| ドキュメント | outputs/phase-13/pr-info.md | PR URL / CI 結果（未承認時は blocked） |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成プロセスの実行ログ |
| メタ | artifacts.json | Phase 13 を completed |

## 完了条件

- [ ] user 承認取得
- [ ] local check 全 PASS
- [ ] PR が dev 向けに発行
- [ ] Closes #217 連動
- [ ] artifacts.json completed

## タスク100%実行確認

- approval gate 通過
- PR URL を outputs/phase-13/main.md に記録
- artifacts.json で phase 13 を completed

## 次 Phase への引き渡し

- 次: なし（タスク完了）
- 引き継ぎ: 07a / 07c が `markResolved` / `markRejected` を呼び出す実装に着手可能
- ブロック条件: 承認なしで PR 発行しない / local-check FAIL で発行しない
