# Phase 11: 手動テスト結果 — VISUAL_ON_EXECUTION（local evidence captured）

> 主証跡は **tier 1（component test: `BulkActionBar.spec.tsx` の TC-BAB-TAG-06/07 + 既存回帰）**。tier 2 として local Playwright fixture screenshot を保存済み。staging 認証付き Playwright screenshot は optional reinforcement として **pending（user-gated）**。
> 本ワークフローでは local code 実装、focused component test、local screenshot を完了した。commit / push / PR / Issue mutation / staging authenticated screenshot は user-gated。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1080-bulk-tag-result-member-labels` |
| issue | #1080（= `task-issue-1036-followup-004`）。GitHub 実状態 **OPEN**（状態変更しない） |
| タスク種別 | **VISUAL_ON_EXECUTION** |
| route | `/admin/members` |
| 対象 component | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` / `MembersClientShell.tsx` |
| workflow_state | `implemented_local_evidence_captured` |
| 証跡の主ソース | **component test: `BulkActionBar.spec.tsx`**（12 tests PASS） + local screenshot |
| screenshot | `outputs/phase-11/screenshots/bulk-tag-result-member-labels.png`（790x314） |

## 1. 実施情報

- **対象**: `/admin/members` の `BulkActionBar` tag 一括付与/解除の部分失敗結果 summary。
- **変更内容（実装済み）**:
  - `BulkActionBar.tsx`: props に optional `membersById?: Readonly<Record<string,{readonly fullName:string}>>` を追加。skipped 行に `membersById[r.memberId]?.fullName.trim() || r.memberId`、notFound 行に `tagLabelById.get(r.tagId)?.trim() || \`${r.tagId}（未登録）\`` を表示。
  - `MembersClientShell.tsx`: `initial.members` から `membersById` を `useMemo` で構築し `BulkActionBar` へ注入（既存 `republishCandidates` の `displayName` 注入と同パターン）。
  - `BulkActionBar.spec.tsx`: TC-BAB-TAG-06/07 を追加。
- **証跡の主ソース**: component test（tier 1）。VISUAL だが、表示名 / fallback / 未登録表記の正しさは jsdom render の text assertion で決定的に検証できる。
- **本サイクルの状態**: 実装・focused component test・local screenshot は完了。staging screenshot は optional user-gated。

## 2. 仕様判断根拠

| 判断 | 根拠 |
| --- | --- |
| member 表示は `fullName` を主表示にする（email を出さない） | 既存 `MembersTable` の表示ポリシー（fullName 主・email は maskEmail 副）に整合し、result summary での PII 表示拡大を回避（issue リスク表「中」回避）。AC-1 は fullName で充足 |
| tag label は UI 側で `fetchTagMaster().available` から `tagLabelById` を構築して解決 | API contract を膨らませず（AC-3 維持）、`BulkActionBar` が既にロード済みの `available`（`AdminTagRef[]`）を再利用できる |
| 表示名が手元にない場合は memberId / `{tagId}（未登録）` へ fallback | API shape `{memberId,tagId,status}` を維持しつつ、表示名解決失敗でも UI が壊れない（AC-4） |
| props は optional 追加（後方互換） | 既存 `BulkActionBar` 呼び出し側（`membersById` 未注入）でも破壊しない。`MembersClientShell` のみ注入する |
| local screenshot を本サイクルで取得する | UI/UX変更の視覚証跡を同サイクル内で残すため、部分失敗 summary の決定的fixtureを Playwright で撮影する。staging 認証付き visual baseline は optional user-gated（#1077 系基盤を流用） |

## 3. 実行記録

> 本セクションは今回サイクルの実行結果を記録する。

### tier 1（主証跡）想定 component test

| TC-ID | 自動テスト名（想定） | 件数 | 対応 AC | 本サイクル状態 |
| --- | --- | --- | --- | --- |
| TC-BAB-TAG-06 | 部分失敗結果の member / tag を表示名で表示する | 1 | AC-1 / AC-2 | **PASS** |
| TC-BAB-TAG-07 | 表示名が無い member / tag は生 ID fallback で壊れない | 1 | AC-2 / AC-4 | **PASS** |

> 既存 result summary の counts 表示（`bulk-tag-result-counts`）と既存 TC（B-T1..）は回帰させない。`{memberId,tagId,status}` shape を直接 assert する既存検証は維持（AC-3）。

### tier 2（視覚証跡）local screenshot

| canonical 名 | 撮影状態 | 本サイクル状態 |
| --- | --- | --- |
| `bulk-tag-result-member-labels.png` | 部分失敗 summary が member 名 / tag label / `{tagId}（未登録）` で表示された状態 | **PASS / present**（790x314） |

### 検証コマンド（実行済み）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 4. 既知制限

- focused component test と local screenshot は実行済み。typecheck/lint は Phase 12 close-out で記録する。
- screenshot は local fixture で部分失敗 summary を決定的に再現した。実機 member/tag データでの追加確認は staging 認証付き（#1077 系基盤）を optional user-gated reinforcement とする。
- tag label 解決は `fetchTagMaster().available` に依存するため、tag master が空 / 未ロードの場合は `{tagId}（未登録）` fallback になる（仕様どおり・AC-2）。
- member 表示は `fullName` のみで email は出さない（PII 拡大回避）。「email 補助表示」は将来候補（`unassigned-task-detection.md` 参照・本タスクでは起票しない）。

## 判定

**GATE: PASS_LOCAL_SCREENSHOT_CAPTURED / STAGING_VISUAL_OPTIONAL_PENDING_USER_GATE** — tier 1 component evidence は PASS（12 tests）。tier 2 local screenshot は present。staging screenshot は optional user-gated pending。
