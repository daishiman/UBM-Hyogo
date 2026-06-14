# workflow-admin-requests-approval-publish-state-diff artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| Issue | `#1188`（commit / push / PR / Issue mutation は user-gated） |
| purpose | `/admin/requests` 承認導線で `publishState` / `desiredState` / `isDeleted` の既存 3 値だけを使い、`visibility_request` は公開状態遷移、`delete_request` は在籍→退会（論理削除）のレコード状態遷移として `変更前 → 変更後` diff を日本語で表示する |
| implementation | `RequestQueueDetail.tsx` に `formatPublishStateLabel` / `buildPublishStateDiff`（feature ローカル純粋関数）と diff 行、`RequestQueuePanel.tsx` に具体遷移 `destructiveMessage` 生成、`RequestConfirmDialog.tsx` に通常説明文 / destructive alert 分離、`globals.css` に token-only `[data-diff-side]` / `[data-diff-arrow]` styles |
| implementation targets | `apps/web/src/components/admin/{RequestQueueDetail,RequestQueuePanel,RequestConfirmDialog}.tsx`, `apps/web/src/styles/globals.css`, `apps/web/src/lib/admin/server-fetch.ts`（fixture）, `apps/web/playwright/tests/admin-requests.spec.ts`（E2E） |
| tests | `apps/web/src/components/admin/__tests__/{RequestQueueDetail,RequestConfirmDialog,RequestQueuePanel.component}.spec.tsx` |
| local evidence | focused Vitest 3 files / 27 tests PASS、admin requests Playwright E2E 7 tests PASS、`pnpm typecheck` PASS、`pnpm lint` PASS、web design-token gate PASS（HEX 0 件）、`pnpm verify:phase12-compliance` PASS |
| invariant | `apps/api` / `packages/shared` / D1 / Google Form / API projection / design token 正本は不変（`git diff --name-only -- apps/api packages/shared` 空）。新規 primitive 0 件・新規 token 0 件。route / セレクタ / コンポーネントファイル名不変 |
| user gate | staging deploy、admin bearer mint、3 canonical PNG capture、commit、push、PR |

## Lessons Learned

- **L-ARAPSD-001（実装対象が明確な workflow を spec-only で閉じない）**: `apps/web` の改修対象が具体列挙されている workflow を `spec_created` で close-out するのは既存 rule の適用漏れ。同一サイクルで実装・focused tests・typecheck・lint・token gate・Phase 12 compliance まで完了させ、local PASS と staging visual PNG 未取得を混同せず `implemented_local_runtime_pending` + `runtime_pending_user_gate` で状態分離する。
- **L-ARAPSD-002（既存 projection の棚卸しを API 変更判断より先に行う）**: diff 表示に必要な 3 値（`publishState` / `isDeleted` / `desiredState`）は GET `/admin/requests` projection が既に返していた。「UI に新情報を出す = API 拡張」と即断せず、既存 client type の棚卸しを先に行うことで endpoint / D1 / shared 変更ゼロの表現層完結を確定できる（AC-7）。
- **L-ARAPSD-003（note_type で diff の意味軸を分離し fail-soft）**: 同じ `変更前 → 変更後` UI でも `visibility_request` は公開状態遷移、`delete_request` は在籍→退会のレコード状態遷移として `buildPublishStateDiff` の `kind` フィールドと別 `dt` ラベルで意味軸を分離する。対象外 note_type / `desiredState` 欠落は `null` で diff 行ごと非描画、enum 外値は `formatPublishStateLabel` が「不明」を返し崩れず描画する（throw しない fail-soft）。
- **L-ARAPSD-004（共有ダイアログの props を増やさず呼び出し側で文言を組み立てる）**: `RequestConfirmDialog` の最小 props（`kind` / `isDestructive` / `destructiveMessage`）を変えず、diff サマリは `RequestQueuePanel` 側の `destructiveMessage` 生成で組み立てる。これにより既存 3 spec の green 維持（AC-10）と型互換を両立し、詳細パネルとダイアログのラベル表記は `formatPublishStateLabel` 再利用で一致させる。
- **L-ARAPSD-005（data-* 属性セレクタ + token-only CSS で primitive 増殖を防ぐ）**: diff 強調は新規 primitive ではなく既存要素 + `data-diff-side` / `data-diff-arrow` / `data-diff-kind` 属性セレクタと `var(--ubm-*)` トークンのみで構成する。矢印は `aria-hidden="true"` で読み上げ対象外にし、before/after テキスト自体で意味を担保する（AC-6 / AC-9）。

anti-pattern:
- ❌ 実装対象が具体列挙された workflow を `spec_created` のまま close-out し、実装を別サイクルへ先送りする。
- ❌ projection が既に返す値を確認せず、diff 表示のために endpoint / projection 拡張から着手する。
- ❌ `delete_request` を公開状態 diff と同じ意味軸で描画し、「退会申請なのに公開状態が変わる」誤読を誘発する。
- ❌ ダイアログ共有コンポーネントに diff 用 props を追加し、既存 spec / 型互換を破壊する。
- ❌ staging PNG 未取得なのに local 実装完了と一括りにして evidence を present 申告する（state は local / runtime で分離する）。
