# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装完了]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION` / `workflow_state: implemented_local_evidence_captured`

## VISUAL 区分の宣言（冒頭）

- **タスク種別**: **VISUAL**（`VISUAL_ON_EXECUTION`）。`NON_VISUAL` ではない。
- **視覚的変化箇所**: `/admin/members` の `BulkActionBar` tag 一括付与/解除の **部分失敗結果 summary**（`data-testid="bulk-tag-result"` 配下の `bulk-tag-result-skipped` / `bulk-tag-result-not-found` リスト）。生 ID（`memberId` / `tagId`）表示 → 表示名（member `fullName` / tag `label`）表示へ視覚的に変わる。
- **根拠**: 部分失敗時に「誰が（どの会員が）スキップされたか」「どのタグが未登録だったか」を運用者が目で読み取れることが本タスクの価値。text の意味だけでなく、result summary のリスト行が ID から人間可読な名前へ置き換わる視覚変化を伴うため screenshot 補強が望ましい。
- **本サイクルでの screenshot 状態**: **present**（local Playwright fixture screenshot 保存済み: `outputs/phase-11/screenshots/bulk-tag-result-member-labels.png`）。staging 認証付き visual baseline は optional reinforcement として user-gated。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1080-bulk-tag-result-member-labels` |
| issue | #1080（= `task-issue-1036-followup-004-bulk-tag-result-member-labels`）。GitHub 実状態 **OPEN**（状態変更しない / user-gated） |
| phase | Phase 11（手動テスト / VISUAL 視覚 evidence 計画） |
| task type | **VISUAL**（`VISUAL_ON_EXECUTION`） |
| route | `/admin/members` |
| 対象 component | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`（表示）/ `MembersClientShell.tsx`（`membersById` 注入） |
| evidence 方針 | **two-tier**: (1) component test（`BulkActionBar.spec.tsx` の TC-BAB-TAG-06/07 + 既存回帰）= 主証跡 / (2) local Playwright fixture screenshot 1 枚 = 視覚証跡。staging 認証付き baseline は optional reinforcement（user-gated） |
| screenshot capture | **present**: `outputs/phase-11/screenshots/bulk-tag-result-member-labels.png`（790x314） |

## 目的

本タスクで導入する「部分失敗結果 summary の member/tag 表示名表示」は、result summary リスト行の **表示テキストが ID から表示名へ置き換わる視覚的変化** を伴う VISUAL 区分である。component test の text assertion で表示名 / fallback / 未登録表記を決定的に検証しつつ、実機での読みやすさ（誰が・どのタグか）を screenshot で補強する計画を確定する。

本ワークフローでは local code 実装、component test 実行、local Playwright fixture screenshot 保存を完了した。staging screenshot は認証・環境依存のため optional user-gated reinforcement として分離する。

| tier | evidence | 役割 | 本サイクルでの状態 |
| --- | --- | --- | --- |
| **tier 1（主証跡）** | component test `BulkActionBar.spec.tsx`（TC-BAB-TAG-06/07 + 既存 TC-BAB-TAG-01..05） | skipped 行の member 名表示 / notFound 行の tag label 表示 / 未登録表記 / 表示名なし memberId fallback を component-local に検証 | **PASS**。`pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` = 12 tests PASS |
| **tier 2（視覚証跡）** | local Playwright fixture screenshot 1 枚 | 部分失敗 summary が表示名で読める状態を固定 | **PASS / present**。`outputs/phase-11/screenshots/bulk-tag-result-member-labels.png`（790x314） |
| **tier 3（任意補強）** | staging 認証付き Playwright screenshot 1 枚 | 実機認証routeでの baseline 固定 | **pending（user-gated）**。親 #1036 系 followup-001=#1077 の認証付き staging visual baseline 基盤を将来流用 |

## 検証する状態

| 状態 | 期待 | 対応 AC |
| --- | --- | --- |
| skipped（退会済みスキップ）行 | `membersById[memberId].fullName` を表示（例: `退会済みのためスキップ: 山田 太郎`） | AC-1 |
| notFound（未登録タグ）行・tag 解決済み | `tagLabelById[tagId]` の label を表示（例: `未登録タグのためスキップ: 役員`） | AC-2 |
| notFound 行・tag 未解決 | `{tagId}（未登録）` を表示 | AC-2 |
| 表示名が手元にない member | `membersById` に該当キーなし → `?? r.memberId` で memberId 表示で壊れない | AC-4 |
| API response shape | `{ memberId, tagId, status }` を維持（UI 側のみ変更・apps/api 非接触） | AC-3 |

## screenshot canonical 名（セマンティック命名 `<component>-<state>.png`）

命名は `<component>-<state>.png` 形式。phase spec / `screenshot-plan.json` / Phase 12 implementation-guide で **同一の canonical 名**を用いる（identifier drift 防止）。配置先は `outputs/phase-11/screenshots/`。

| # | canonical ファイル名 | 撮影状態 | capture 状態 | 対応 AC |
| --- | --- | --- | --- | --- |
| 1 | `bulk-tag-result-member-labels.png` | 部分失敗結果 summary（skipped 行に member `fullName`・notFound 行に tag `label` または `{tagId}（未登録）` が表示された状態） | **present**（local Playwright fixture screenshot） | AC-1 / AC-2 / AC-4 |

> local 実装、focused component test、local screenshot は完了。staging 認証付き visual baseline は optional user-gated reinforcement として残す。

## 3層評価（計画）

| 層 | 評価観点 | 対応 |
| --- | --- | --- |
| **Semantic（意味）** | skipped 行が「誰が（どの会員が）退会済みでスキップされたか」を `fullName` で意味的に読めること。notFound 行が「どのタグが未登録か」を label で意味的に読めること。`{tagId}（未登録）` fallback が「解決できなかったタグ ID である」と読めること。API shape `{memberId,tagId,status}` は意味変更なし | screenshot #1 / tier 1 component test |
| **Visual（視覚）** | result summary が既存の `data-testid="bulk-tag-result"` レイアウト・OKLch トークン配色（`var(--ubm-color-text-secondary)` 等）を変えず、リスト行のテキストのみ ID → 表示名へ置き換わること。HEX 直書き / inline `style` を追加しないこと（`verify-design-tokens` gate 準拠）。表示名が長い場合もリストレイアウトが崩れないこと | screenshot #1 |
| **AI UX（操作体感）** | 一括操作で一部失敗した際、運用者が ID 照合作業なしに「誰が・どのタグか」を即座に把握できること。表示名が無い場合も memberId で壊れず情報が残ること（迷子防止）。PII 拡大を避け `fullName` 主表示（email は出さない）で MembersTable の表示ポリシーと整合すること | screenshot #1 |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 確定設計（props 契約 / 表示解決） | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md` | `membersById` optional prop・`tagLabelById` 解決・fallback・canonical 命名 |
| 既存 component | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`（L253-283 result summary）/ `MembersClientShell.tsx`（`republishCandidates` の displayName 注入前例） | 変更対象・注入前例 |
| 親 staging visual 基盤 | `#1077`（= `task-issue-1036-followup-001`） | 認証付き staging Playwright visual baseline 基盤（将来流用先） |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token 正本（HEX 直書き禁止根拠） |

## 成果物

| 成果物 | path | 役割 |
| --- | --- | --- |
| 本 phase 仕様 | `outputs/phase-11/phase-11.md` | VISUAL 区分宣言・検証状態・canonical 1 名・3層評価計画 |
| screenshot 計画 | `outputs/phase-11/screenshot-plan.json` | `mode: "VISUAL"` / canonical 1 shot / `status: "present"` |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | tier 1（component test）+ tier 2（local screenshot present）の証跡メタ |

## 統合テスト連携

- tier 1（主証跡）: `BulkActionBar.spec.tsx` の component test で member 名表示 / tag label 表示 / 未登録表記 / fallback を検証済み（12 tests PASS）。
- tier 2（視覚証跡）: local Playwright fixture screenshot 1 枚（`bulk-tag-result-member-labels.png`）を保存済み。親 #1036 系 followup-001=#1077 の認証付き staging visual 基盤は optional reinforcement として将来流用可能。
- canonical 名は本 phase / screenshot-plan / Phase 12 implementation-guide / Phase 13 で完全一致させる。

## 完了条件（Phase 11）

- VISUAL 区分を宣言し、視覚変化箇所（result summary の skipped/notFound 行表示）を明記した。
- two-tier evidence（tier 1 = component test TC-BAB-TAG-06/07 + 既存回帰 / tier 2 = local screenshot present）を確定した。
- screenshot canonical 1 名（`bulk-tag-result-member-labels.png`）を保存済みにし、staging 認証付き visual baseline は optional **pending（user-gated）** であることを明記した。
- 3層評価（Semantic / Visual / AI UX）の計画を確定した。
