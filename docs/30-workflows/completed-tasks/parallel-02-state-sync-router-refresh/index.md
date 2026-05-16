# parallel-02-state-sync-router-refresh - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/app/profile/_components/` 配下の 2 dialog コンポーネント (`VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx`) の `onSubmit` ロジックに `router.refresh()` 呼び出しを追加し、対応する `*.component.spec.tsx` に検証ケースを追加するコード実装タスク。仕様策定単体では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | PARALLEL-02-STATE-SYNC |
| タスク名 | profile mutation 成功後の RequestPendingBanner 即時反映（router.refresh 局所化） |
| ディレクトリ | docs/30-workflows/parallel-02-state-sync-router-refresh |
| 親タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_visual_evidence_captured / phase13_user_gated |
| タスク種別 | implementation / VISUAL |
| 実装区分 | ui-bugfix |
| 優先度 | MEDIUM |
| GitHub Issue | （未起票・必要時に作成） |

## 目的

マイページ profile component で `visibility-request` / `delete-request` の mutation が成功した直後に、`RequestPendingBanner` が即時表示される状態を実現する。

修正前は `RequestActionPanel.tsx` の `onSubmitted` callback 内だけに `router.refresh()` が存在し、dialog の `onSubmit` 内では `onSubmitted` → `onClose` の順に呼ばれていた。`onClose` による dialog unmount より前に refresh を schedule するため、refresh の呼び出し位置を dialog ローカルへ移す。

本タスクでは、refresh の呼び出し位置を dialog ローカルに移し、`router.refresh() → onSubmitted() → onClose()` の順で固定する。これにより server state を正本とした banner の即時反映を保証する。

## スコープ

### 含む

- `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` の `onSubmit` に `useRouter()` + `router.refresh()` を追加（mutation 成功時のみ）
- `apps/web/app/profile/_components/DeleteRequestDialog.tsx` の `onSubmit` に同様の変更を追加
- `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` に `router.refresh` 呼び出し検証ケースを追加
- `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` に同様の検証ケースを追加
- 既存 `RequestActionPanel.component.spec.tsx` の non-regression 確認
- Playwright e2e で profile 画面の mutation 前 / dialog open / mutation 後の screenshot を取得（VISUAL evidence）

### 含まない

- `apps/api` 配下の変更（既存 API endpoint surface は不変）
- D1 schema 変更
- Google Form 仕様変更
- 既存色 / OKLch token 変更
- 新規 API endpoint / route handler 追加
- 楽観的 UI 採用（server state を正本とする方針を継続）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md | 原典仕様書 |
| 必須 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 変更対象（lines 66-96） |
| 必須 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 変更対象（lines 59-87） |
| 必須 | apps/web/app/profile/_components/RequestActionPanel.tsx | 変更対象（`onSubmitted(QueueAccepted)` bridge state） |
| 必須 | apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx | テスト追加対象 |
| 必須 | apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx | テスト追加対象 |
| 必須 | CLAUDE.md | UI prototype alignment 不変条件 |
| 参考 | https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh | Next.js `router.refresh()` 仕様 |

## 受入条件 (AC)

- **AC-1**: `VisibilityRequestDialog.tsx` の `onSubmit` 内、mutation success branch (line 77 周辺) で `router.refresh() → onSubmitted(res.accepted) → onClose()` の順序固定で呼ばれる
- **AC-2**: `DeleteRequestDialog.tsx` の `onSubmit` 内、mutation success branch (line 68 周辺) で同様の順序固定で呼ばれる
- **AC-3**: mutation 失敗（409 / 422 / network error）時には `router.refresh()` を呼ばない
- **AC-4**: `VisibilityRequestDialog.component.spec.tsx` に「202 → router.refresh が 1 回呼ばれる」テストケースが追加され green
- **AC-5**: `DeleteRequestDialog.component.spec.tsx` に同様のテストケースが追加され green
- **AC-6**: 既存テスト（TC-U-05..11, TC-A-01..03, TC-U-21, TC-A-06）が non-regression で green
- **AC-7**: Playwright e2e で mutation 後に `RequestPendingBanner` が page reload なしで表示されることが screenshot に記録されている
- **AC-8**: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test` PASS

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/task-breakdown.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-evidence.md + outputs/phase-11/screenshots/*.png |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（4 真の論点 / 4 条件評価 / 既存資産インベントリ） |
| ドキュメント | outputs/phase-02/design.md | 設計（onSubmit シグネチャ / 呼び出し順序 / failure path 方針） |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー GO/NO-GO |
| ドキュメント | outputs/phase-07/test-plan.md | 新規 test ケース + non-regression 範囲 |
| ドキュメント | outputs/phase-11/visual-evidence.md | Playwright screenshot evidence と canonical path |
| ドキュメント | outputs/phase-12/implementation-guide.md | PR 本文の正本（Part1 中学生レベル + Part2 技術契約） |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |

## 不変条件

1. **既存 API 不変**: `apps/api/src/routes/` 配下に変更なし。`POST /api/me/visibility-request` / `POST /api/me/delete-request` のシグネチャ・挙動は不変
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を呼ばない
3. **OKLch トークン無関係**: 本タスクは色変更なし。`apps/web/src/styles/tokens.css` への変更なし
4. **`apps/web` 限定**: `apps/api` には触らない
5. **テストファイル拡張子**: 新規テストは `*.spec.tsx`（`*.test.tsx` 禁止）
6. **呼び出し順序固定**: `router.refresh() → onSubmitted() → onClose()`（dialog unmount は最後）
7. **server state 正本**: pending 状態は `/me/profile` の `pendingRequests` を正本とし、楽観的 UI を採用しない
8. **CONST_007 遵守**: 1 サイクル内で Phase 1〜13 を完了させる（spec 作成は本タスクの Phase 0 相当）
9. **CONST_005 遵守**: 各 phase に変更ファイル一覧 / 関数シグネチャ / 入出力 / テスト / コマンド / DoD を含める

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `onClose()` が先に呼ばれ unmount された後の `router.refresh()` で React warning が出る | 呼び出し順序を `router.refresh() → onSubmitted() → onClose()` に固定 |
| parent と dialog の refresh が二重に呼ばれる | Phase 10 で dialog ローカルに一本化し、parent は accepted response bridge state に限定 |
| mutation 失敗時に refresh が走り、不要な server 往復が発生 | failure branch (`else` / `catch`) では refresh を呼ばない設計を Phase 2 で固定 |
| Playwright e2e で server state の再 fetch が flaky になる | `RequestPendingBanner` の `aria-live="polite"` 出現を `waitFor` でアサート |
| `useRouter()` を 2 dialog で個別に呼ぶことで bundle / import 二重化 | shared util ではなく React idiom に従い各 dialog で個別 hook 呼び出し（無視可能なコスト） |
| プロトタイプ正本順位への抵触 | 本タスクは UI 表示ロジックではなく client state sync 改善。プロトタイプ primitives に影響なし |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計)
  └─ outputs/phase-02/design.md
       │
       ▼
phase-03 (設計レビュー)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04〜10 (タスク分解〜リファクタ)
     │
     ▼
phase-11 (VISUAL evidence: Playwright screenshot)
  └─ outputs/phase-11/visual-evidence.md + screenshots/
       │
       ▼
phase-12 (正本同期 / strict 7 outputs)
       │
       ▼
phase-13 (PR・振り返り / user approval gate)
```

## 注意点

- 親 workflow `ui-prototype-alignment-mvp-recovery` の SCOPE.md / phase-{1,2,3} 配下の正本順位に従う
- 既存 `RequestActionPanel.tsx` の `router.refresh()` は Phase 10 で削除し、dialog ローカル一本化 + parent bridge state に再構成済み
- spec.md (line 91) で Option A（dialog ローカル）が採用済み。本仕様書はそれを Phase 2 設計の前提として固定する
- visualEvidence = VISUAL のため Phase 11 で Playwright screenshot を必須化する
- Phase 13 commit / push / PR はユーザー明示承認後のみ実行する（blocked_pending_user_approval）
