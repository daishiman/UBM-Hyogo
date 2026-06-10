# Phase 6: テスト追加（fail path / エッジ / 回帰 guard）

> 本 Phase は Phase 4 の正常系ケースに対し、**fail path / エッジケース / 回帰 guard** を追加する。
> all-or-nothing の各失敗内訳・通信失敗・空候補・> 500・attended 変化での stale 除去・検索 0 ヒットを網羅し、
> 既存 `MeetingAttendanceDrawer.spec.tsx` の回帰維持を担保する。実コードは本 Phase でも実装しない（CONST_006）。

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 4（T1..T8 正常系）/ Phase 5（実装指示）/ SSOT
- 本 Phase の責務: fail path / エッジ / 回帰の追加ケースと、カバレッジ範囲の限定方針を確定する

## 1. 追加 fail path / エッジケース

### T3 追加: bulk-attendance-message.spec.ts（committed:false 各内訳）

| ケース ID | ケース名 | 入力 summary | 期待値 | trace |
| --- | --- | --- | --- | --- |
| MSG-E1 | duplicate + invalid の混在内訳 | `{total:3,ok:0,duplicate:2,deletedMember:0,unknownMember:0,invalid:1}` | `"追加できませんでした（出席済 2 / 不正 1）。選択を見直してください"` | AC-7 |
| MSG-E2 | deletedMember + unknownMember の混在内訳 | `{total:2,ok:0,duplicate:0,deletedMember:1,unknownMember:1,invalid:0}` | `"追加できませんでした（削除済 1 / 不明 1）。選択を見直してください"` | AC-7 |
| MSG-E3 | ok>0 を含むが committed:false の summary でも内訳を非 ok のみで構成 | `{total:3,ok:1,duplicate:2,deletedMember:0,unknownMember:0,invalid:0}` | 出力に「出席済 2」を含み「ok」「1 名」を含まない | AC-7 |

> 注: `bulkFailureMessage` は committed:false の時のみ呼ばれる（F7）。MSG-E3 は理論上の防御として ok>0 でも非 ok 内訳のみ表示することを確認。

### T8 追加: MeetingsClientShell.spec.tsx（committed:false 各内訳・通信失敗・>500）

| ケース ID | ケース名 | importAttendance mock | 期待値 | trace |
| --- | --- | --- | --- | --- |
| SH-E1 | committed:false（duplicate）で attended 不変・選択保持側へ false 返却 | `{ok:true,data:{committed:false,summary:{total:2,ok:0,duplicate:2,...}}}` | 出席者件数不変・toast「追加できませんでした（出席済 2）」・onBulkAdd 戻り false | AC-7 |
| SH-E2 | committed:false（deleted_member）の内訳 toast | `{...committed:false,summary:{deletedMember:1,...}}` | toast「追加できませんでした（削除済 1）」・attended 不変 | AC-7 |
| SH-E3 | committed:false（unknown_member）の内訳 toast | `{...committed:false,summary:{unknownMember:1,...}}` | toast「追加できませんでした（不明 1）」・attended 不変 | AC-7 |
| SH-E4 | committed:false（invalid）の内訳 toast | `{...committed:false,summary:{invalid:1,...}}` | toast「追加できませんでした（不正 1）」・attended 不変 | AC-7 |
| SH-E5 | 通信失敗（res.ok=false / status 0）で失敗 toast・attended 不変 | `{ok:false,status:0,error:"network error"}` | toast「一括追加に失敗: network error」・attended 不変・false 返却 | AC-7 |
| SH-E6 | HTTP 非 2xx（res.ok=false / status 413）で失敗 toast | `{ok:false,status:413,error:"payload_too_large"}` | toast「一括追加に失敗: payload_too_large」・attended 不変 | AC-7 |
| SH-E7 | > 500 件は送信前ガードし importAttendance を呼ばない | 501 件 memberIds | importAttendance mock 未呼出・toast「一度に追加できるのは 500 名までです」 | SSOT §5 |
| SH-E8 | fresh 0 件（全て既出席）は送信前ガード | 既出席 id のみ渡す | importAttendance mock 未呼出・toast「追加対象がありません」・false 返却 | AC-4 |
| SH-E9 | committed:true は importAttendance を 1 回だけ呼ぶ | 3 名（全 fresh）committed:true | importAttendance mock 呼び出し回数 1 | AC-5 |

### T4 追加: BulkAttendanceChecklist.spec.tsx（空候補・検索 0 ヒット・false 保持）

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| CL-E1 | 全候補が出席済の時に空状態文言を表示し submit を出さない | candidates 全て attended | 「追加できる会員がいません」表示・`bulk-attendance-submit-sess-1` 非表示または disabled | AC-4 |
| CL-E2 | 検索 0 ヒットで候補リストが空・件数 0 | 「存在しない名前」を入力 | option checkbox 0 個・submit disabled | AC-2 |
| CL-E3 | onBulkAdd が false を返すと選択を保持する | onBulkAdd=async()=>false で m1 選択 → submit | m1 が checked のまま・ボタン文言に「1」 | AC-7 |
| CL-E4 | 検索で絞った状態の全選択は絞込外を選択しない | candidates=[{m1,"山田"},{m2,"佐藤"}] → "山田" 入力 → 全選択 | m1 のみ checked（m2 は対象外） | AC-2 / AC-9 |

### T2 追加: useBulkAttendanceSelection.spec.ts（stale 除去・部分一致境界）

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| HK-E1 | attended が複数 id を後から含むと該当 id を全て選択から除く | toggle m1,m2,m3 → rerender attended=Set([m1,m3]) | `selectedIds`=Set([m2]) | AC-4 / [FB-STATE-DETAIL-002] |
| HK-E2 | query trim 後空文字（空白のみ）は未出席全件を返す | query="   " | `selectableCandidates`=未出席全件 | AC-2 |
| HK-E3 | 大文字小文字混在 query が小文字候補にヒットする | candidates=[{m1,"Yamada"}], query="yama" | `selectableCandidates`=[m1] | AC-2 |

### T5 追加: BulkAttendanceModal.spec.tsx（open=false / 空候補 / 選択解除）

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| MD-E1 | open=false で dialog を描画しない | render(open=false) | `bulk-attendance-modal-sess-1` が DOM に無い | AC-8 |
| MD-E2 | 全候補出席済で空状態文言を表示 | candidates 全て attended | 「追加できる会員がいません」表示・submit disabled | AC-4 |
| MD-E3 | 選択解除で件数 0 に戻る | 全選択 → 選択解除 | submit disabled（件数 0） | AC-8 / AC-9 |

### T7 追加: api.attendance-import.spec.ts（通信失敗 / 非 2xx）

| ケース ID | ケース名 | 入力 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| API-E1 | fetch throw（通信失敗）で `{ok:false,status:0}` を返す | fetch mock が reject | `{ok:false, status:0, error}` | AC-7 |
| API-E2 | HTTP 413（payload_too_large）で `{ok:false,status:413}` | res 413 `{error:"payload_too_large"}` | `{ok:false, status:413, error:"payload_too_large"}` | AC-7 |
| API-E3 | HTTP 404（session_not_found）で `{ok:false,status:404}` | res 404 `{error:"session_not_found"}` | `{ok:false, status:404}` | AC-7 |

## 2. 回帰 guard

### T6: MeetingAttendanceDrawer.spec.tsx（既存 2 ケース GREEN 維持 + 新 prop）

- 既存 DR-1（出席者一覧で氏名主表示）・DR-2（候補にない出席者は memberId 表示）を**変更せず GREEN 維持**する。
- ただし新 required prop `onBulkAddAttendance` 追加に伴い、既存全 render に `onBulkAddAttendance={vi.fn(async () => true)}` を追加する（型エラー回避）。
- 追加 DR-3..5（既存単発 select 保持・チェックリスト埋込・モーダル起動）は Phase 4 で定義済み。

### T8: MeetingsClientShell.spec.tsx（既存単発追加 / 削除の回帰）

- SH-6（単発「出席を追加」が従来通り）・SH-7（出席削除が従来通り）を回帰 guard とする。
- 新 onBulkAdd 配線が既存 `onAdd` / `removeAttendanceMutation` 経路に影響しないことを確認する（mock を分離）。

### 回帰確認コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

## 3. エッジ網羅マトリクス（committed:false 5 内訳）

| 内訳 status | 単体ケース | 文言 | カバー先 |
| --- | --- | --- | --- |
| `duplicate` | MSG-1 / SH-E1 | 出席済 | T3 / T8 |
| `deleted_member` | MSG-2 / SH-E2 | 削除済 | T3 / T8 |
| `unknown_member` | MSG-3 / SH-E3 | 不明 | T3 / T8 |
| `invalid` | MSG-4 / SH-E4 | 不正 | T3 / T8 |
| 複数混在 | MSG-5 / MSG-E1 / MSG-E2 | 連結 | T3 |
| 内訳全 0（理論） | MSG-7 | 括弧なし汎用 | T3 |

> `ok`（committed:true）は SH-1 / SH-E9 でカバー。通信失敗 / 非 2xx は API-E1..3 / SH-E5 / SH-E6 でカバー。

## 4. カバレッジ対象範囲の限定（[BEFORE-QUIT-002]）

- カバレッジ計測は **本タスクの変更ファイル（F1..F9）に限定**する。リポジトリ全体のカバレッジ閾値変動は本タスクの責務外。
- 対象: `apps/web/src/lib/admin/api.ts`（`importAttendance` 部分）・`Checkbox.tsx`・`useBulkAttendanceSelection.ts`・`bulk-attendance-message.ts`・`BulkAttendanceChecklist.tsx`・`BulkAttendanceModal.tsx`・`MeetingAttendanceDrawer.tsx`（差分）・`MeetingsClientShell.tsx`（`onBulkAdd` 部分）。
- focused vitest（SSOT §7）で上記の追加分岐（committed true/false・通信失敗・ガード・stale 除去）が実行されることを確認する。
- `globals.css`（F9）はカバレッジ対象外（CSS）。AC-11 の token 検証は `verify:tokens` / grep gate（Phase 9）で担保する。

## 5. 実行コマンド（fail path 含む全 focused run）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

## 6. DoD（Phase 6）

- [ ] 追加 fail path ケース（MSG-E* / SH-E* / CL-E* / HK-E* / MD-E* / API-E*）が全 GREEN。
- [ ] 既存 DR-1 / DR-2 / SH-6 / SH-7 の回帰 GREEN 維持。
- [ ] committed:false 5 内訳すべてに単体ケースが存在（§3 マトリクス充足）。
- [ ] カバレッジ計測が変更ファイルに限定されている（[BEFORE-QUIT-002]）。

## 7. 成果物（Phase 6）

| 成果物 | パス |
| --- | --- |
| テスト追加計画（本書） | `phase-6-test-additions.md` |
| 統合テスト仕様 | `outputs/phase-6/integration-test.md` |

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `phase-1-requirements.md` | AC-1..AC-12 |
| 共有コンテキスト（SSOT） | `outputs/phase-1/shared-context.md` | API 契約・row status・IMPORT_MAX_ROWS |
| 設計書 | `phase-2-design.md` | all-or-nothing UX・失敗メッセージ |
| 設計レビュー | `phase-3-design-review.md` | リスクと対策 |
| テスト計画 | `phase-4-test-plan.md` | T1..T8 正常系 |
