**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending` / `status: pending_user_approval`

> commit / push / PR 作成 / staging deploy / screenshot 取得は**すべて user-gated**。本ワークフローは local 実装と focused Vitest まで完了した `implemented_local_runtime_pending` サイクルである。

---

## 前提

- 本タスクは `implemented_local_runtime_pending` 状態。実コード（route.ts transport 統一 + `_meetings/*` 改修 + テスト）と focused Vitest は完了済み。staging 実測・screenshot は pending。
- Phase 13 の全アクション（commit / push / PR / staging deploy / screenshot）はユーザーの明示承認後にのみ実行する（自動実行しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約。production リリース時のみ `dev → main`）。

## 実行順序（local 実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | 追加品質検証（`pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` など） | user-gated 前に実行可能 |
| 2 | staging deploy + `POST /api/admin/meetings` 201 実測 + screenshot 2 枚取得 | **user-gated** |
| 3 | commit | **user-gated** |
| 4 | push | **user-gated** |
| 5 | `gh pr create --base dev` | **user-gated** |

## PR 本文に含める内容（実装完了時）

### 変更概要

- **Task A（404 修正・P0）**: admin API proxy（`apps/web/app/api/admin/[...path]/route.ts`）の transport を `server-fetch.ts` と同一の service binding（`getAuthEnv().API_SERVICE`）優先 / 不在時のみ `INTERNAL_API_BASE_URL` HTTP fallback / どちらも無ければ 500 fail-fast へ統一。GET（既存 service binding）と POST（旧 HTTP only）の非対称を解消し `POST /api/admin/meetings` 404 を解消。
- **Task B（出席管理 UI/UX）**: 開催日カードに出席人数バッジ（`N 名出席` / `出席 未登録`）、展開時の出席者氏名表示（candidates から memberId→fullName 解決・解決不能時のみ memberId）、展開導線（aria-label / 可視ラベル）、運用導線テキスト（各回を展開して出席を記録・編集）を追加。

### 404 の真因と修正

- **真因**: proxy は service binding を使わず `INTERNAL_API_BASE_URL` への HTTP fetch のみ。GET 初期表示は `server-fetch.ts` 経由で service binding を使うため成功するが、POST（client mutation）は proxy 経由で HTTP only のため `INTERNAL_API_BASE_URL` の値依存で 404。**transport 不整合が根本原因**（推測でなくコードベースで確定）。
- **修正**: proxy の transport を service binding 優先へ統一。GET/POST/PATCH/DELETE 全てが最新 api へ到達。同 proxy を通る他 admin mutation（tags resolve / member status / requests resolve）も同時回復。
- **インフラ設定（INTERNAL_API_BASE_URL 実値）は変更不要**: service binding 統一で値依存の root を解消するため。binding 不在環境が残る場合のみ別途インフラ確認。

### テスト

- focused Vitest（ルートから config 明示）:
  - route handler transport 3 分岐: TC-A-binding（binding.fetch 呼出 + upstream status 中継）/ TC-A-http（HTTP fallback）/ TC-A-missing（500 `internal_api_base_url_missing`）。`requireAdmin` 403・`needsSyncAdminBearer` 既存挙動の非退行。
  - component: TC-B1 / TC-B1-fallback（氏名 / memberId fallback）/ TC-B2 / TC-B2-zero（バッジ両枝）/ TC-B3（aria-label 導線）/ TC-B4（導線テキスト）。
- `pnpm typecheck` / `pnpm lint` pass。OKLch トークン準拠（HEX 直書きなし・`verify-design-tokens`）。
- 既存 admin proxy 経由 mutation の回帰なし（AC-A5）。

### 受け入れ基準達成

- AC-A1（binding 優先）/ AC-A2（HTTP fallback + 500 fail-fast）/ AC-A3（admin gate・header・body 中継不変）/ AC-A4（staging 201・開催日追加成功）/ AC-A5（他 mutation 回帰なし）。
- AC-B1（氏名表示）/ AC-B2（人数バッジ）/ AC-B3（導線識別）/ AC-B4（運用導線テキスト）/ AC-B5（OKLch トークン / primitive 経由維持）。

### 不変条件遵守

- #1（既存 API のみ・apps/api 不変）/ #2（OKLch トークン）/ #5（D1 直接アクセス禁止）/ #9（primitive 経由）/ #10（useAdminMutation 経由）。

### スクリーンショット

実装完了 + staging 実測後に取得する 2 枚を参照として含める（取得後に本セクションを更新）:

- `admin-meetings-attendance-after-fix.png`（開催日追加 201 成功・カード出現・404 解消）
- `admin-meetings-attendance-count-badge.png`（出席人数バッジ + 出席者氏名表示）

> implemented_local_runtime_pending 段階では screenshot 未取得（pending）。`outputs/phase-11/screenshots/` に PNG が 0 件のため、本セクションは実物取得後にのみ画像参照を追加する（placeholder は作らない）。

## Issue 状態の注記

- 本タスクは `issue: null` / `issue_state: n/a`（起点は staging 実機エラーのユーザー報告）。GitHub Issue 化は未実施。
- 本ワークフローは Issue の作成 / close を行わない。Issue 化が必要な場合は user 判断で別途実施する。

## 本サイクルでの結論

- 本サイクルで Phase 1-13 spec、Phase 11 manual test plan、Phase 12 strict 7 outputs の作成を完了した（`implemented_local_runtime_pending`）。
- commit・push・PR・staging deploy・screenshot は**未実行**（user-gated）。実コードと focused Vitest は完了済み。
- Phase 13 は PR 作成計画（変更概要・404 真因と修正・テスト・AC 達成・スクリーンショット計画）のみを記述し、PR 作成自体は user 承認後に実施する（`status: pending_user_approval`）。
