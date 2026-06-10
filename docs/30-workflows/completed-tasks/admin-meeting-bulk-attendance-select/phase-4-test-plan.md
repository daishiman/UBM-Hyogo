# Phase 4: テスト計画（TDD Red）

> 本 Phase は「開催日ドロワーの出席者追加を複数選択 → 一括追加へ是正」の **テスト計画（Red）**。
> 実装着手前に、Checkbox primitive / 選択 hook / 失敗メッセージ純関数 / チェックリスト UI / モーダル UI /
> ドロワー更新 / web client `importAttendance` を検証する unit / component test の期待挙動を確定する。
> 実コードは本 Phase では実装しない（CONST_006）。実コード変更は後続 `03.実装.md` が Phase 5 仕様に従って行う。

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- 前提: Phase 1（AC-1..AC-12）/ Phase 2（設計・F1..F9 確定）/ Phase 3（設計レビュー PASS）/ SSOT（`outputs/phase-1/shared-context.md`）
- 本 Phase の責務: AC-1..AC-12 それぞれのテスト戦略・対象テストファイル（T1..T6）・ケース名・入力・期待値・trace AC を確定する

## 目的

Phase 5 実装前にテスト仕様を確定し、実装後に全ケースが green へ転じることを Phase 6 / Phase 9 で追跡できる状態を作る。
選択ロジック（hook）・失敗メッセージ（純関数）・web client（単一 fetch の path / body）は jsdom / mock で機械検証する。
CSS の「効き」（横並び・スクロール・hover 背景）は jsdom では確認できないため、DOM の class 付与の事実を確認し、
実描画は Phase 11 staging 視覚で確認する方針を採る。

## 1. テスト戦略概要

| AC | 主な検証手段 | 理由 |
| --- | --- | --- |
| AC-1 複数選択チェックリスト | `BulkAttendanceChecklist.spec.tsx`（複数 Checkbox 描画・複数 toggle で複数 checked） | 選択は internal state、複数 checked は DOM で確認可 |
| AC-2 インクリメンタル検索 | `useBulkAttendanceSelection.spec.ts`（query 絞込）+ `BulkAttendanceChecklist.spec.tsx`（検索入力で候補絞込） | 絞込は純粋ロジックゆえ hook で検証、UI 反映は component で確認 |
| AC-3 件数反映ボタン / 0 件 disabled | `BulkAttendanceChecklist.spec.tsx`（ラベル N 反映・selectedCount 0 で disabled） | ボタン文言と disabled は DOM で確認可 |
| AC-4 出席済除外（fresh のみ） | `useBulkAttendanceSelection.spec.ts`（attended 除外）+ `BulkAttendanceChecklist.spec.tsx`（出席済が候補に出ない） | attended 除外は hook で、UI 非表示は component で確認 |
| AC-5 単一 import リクエスト | `api.attendance-import.spec.ts`（path / body / 1 fetch）+ `MeetingsClientShell.spec.tsx`（onBulkAdd が importAttendance を 1 回呼ぶ） | N 回 POST しないことを fetch mock の呼び出し回数で確認 |
| AC-6 committed:true 反映 | `MeetingsClientShell.spec.tsx`（attended に summary.ok 件 add・toast・選択 clear） | 状態反映と toast は DOM で確認可 |
| AC-7 committed:false 反映ゼロ＋選択保持 | `MeetingsClientShell.spec.tsx`（attended 不変・失敗 toast）+ `bulk-attendance-message.spec.ts`（内訳文言）+ `BulkAttendanceChecklist.spec.tsx`（false 戻りで clear しない） | all-or-nothing の副作用ゼロを状態比較で確認 |
| AC-8 モーダル経路 | `BulkAttendanceModal.spec.tsx`（検索 / 全選択 / 選択解除 / 件数ボタン） | モーダル UI を独立に検証 |
| AC-9 ロジック共有 | `useBulkAttendanceSelection.spec.ts`（hook が両 UI 共通の API を満たす） | 重複ロジック集約を hook 単体で担保 |
| AC-10 既存単発追加 / 削除の回帰 | `MeetingAttendanceDrawer.spec.tsx`（既存 2 ケース GREEN 維持 + 新 prop）+ `MeetingsClientShell.spec.tsx`（onAdd / remove 回帰） | 既存挙動の非破壊を確認 |
| AC-11 token 厳守 | `pnpm verify:tokens` + grep gate（Phase 9） | CSS / tsx 全行スキャン（jsdom 不可） |
| AC-12 API 非変更 | `git diff --name-only -- apps/api packages` 空（Phase 9） | 非変更は git で機械確認 |

> AC-11 / AC-12 は Phase 9 のコマンド検証へ委譲する（vitest 対象外）。本 Phase は AC-1..AC-10 の vitest / 純関数ケースを確定する。

## 2. テスト対象ファイル一覧（SSOT §3 の T1..T6）

| T# | ファイル | 種別 | 対応 AC |
| --- | --- | --- | --- |
| T1 | `apps/web/src/components/ui/__tests__/Checkbox.spec.tsx` | 新規 | AC-1 / AC-11 |
| T2 | `apps/web/src/features/admin/components/_meetings/__tests__/useBulkAttendanceSelection.spec.ts` | 新規 | AC-2 / AC-4 / AC-9 |
| T3 | `apps/web/src/features/admin/components/_meetings/__tests__/bulk-attendance-message.spec.ts` | 新規 | AC-7 |
| T4 | `apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx` | 新規 | AC-1 / AC-2 / AC-3 / AC-4 / AC-7 |
| T5 | `apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceModal.spec.tsx` | 新規 | AC-8 / AC-9 |
| T6 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | AC-10 |
| T7 | `apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts` | 新規 | AC-5 |
| T8 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | 編集 | AC-5 / AC-6 / AC-7 / AC-10 |

> T7 / T8 は SSOT §3 の T6（api client）と回帰 owner（Shell）に対応する追加対象。テスト ID は本 Phase 内で T1..T8 とする。
> props vs internal state（[VSCPKR-03]）: **選択状態（selectedIds / query）は hook の internal state**、`candidates` / `attended` は external props。テストは props で候補・出席を注入し、選択は UI 操作（toggle / 検索入力）で駆動する。

## 3. ケース表（AC trace 付き）

### T1: Checkbox.spec.tsx（AC-1 / AC-11）

| ケース ID | ケース名 | 入力 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| CB-1 | label あり時に label テキストと checkbox を描画する | `<Checkbox label="山田 太郎" />` | `type=checkbox` の input が 1 個・テキスト「山田 太郎」が DOM に存在・wrapper class `ui-checkbox` を持つ | AC-1 |
| CB-2 | checked / onChange が制御 props として伝播する | `<Checkbox checked={true} onChange={fn} />` → click | input が checked=true で描画され、click で onChange が 1 回呼ばれる | AC-1 |
| CB-3 | disabled を input へ伝える | `<Checkbox disabled label="x" />` | input が disabled 属性を持つ | AC-4（出席済 disabled の primitive 基盤） |
| CB-4 | label 省略時は input のみ描画し aria-label を透過する | `<Checkbox aria-label="m_1" />` | `type=checkbox` の input に `aria-label="m_1"`・wrapper `ui-checkbox__label` のテキストノードが無い | AC-1 |
| CB-5 | id / name / aria-describedby を透過する（FormField 互換） | `<Checkbox id="cb1" name="n" describedBy="d1" />` | input が `id=cb1` / `name=n` / `aria-describedby=d1` を持つ | AC-11（FormField 互換 / 不変条件 #9） |

> CB は HEX を含まない（class のみ）。色トークン検証は Phase 9 の `verify:tokens` / grep gate に委譲する。

### T2: useBulkAttendanceSelection.spec.ts（AC-2 / AC-4 / AC-9）

> `renderHook`（`@testing-library/react`）で hook を駆動する。`candidates` / `attended` を引数で注入。

| ケース ID | ケース名 | 入力 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| HK-1 | attended の会員を selectableCandidates から除外する | candidates=[m1,m2,m3], attended=Set([m2]) | `selectableCandidates` が [m1,m3]（m2 を含まない） | AC-4 |
| HK-2 | query 部分一致で fullName 絞込（大文字小文字無視・trim） | candidates=[{m1,"山田"},{m2,"佐藤"}], query=" 山田 " | `selectableCandidates` が [m1] のみ | AC-2 |
| HK-3 | query が memberId にも部分一致する | candidates=[{TEST-MEM-04,"A"},{TEST-MEM-99,"B"}], query="04" | `selectableCandidates` が [TEST-MEM-04] のみ | AC-2 |
| HK-4 | query 空文字で未出席全件を返す | candidates=[m1,m2], attended=空, query="" | `selectableCandidates` が [m1,m2] | AC-2 |
| HK-5 | toggle で選択追加・再 toggle で解除する | act(toggle m1) → act(toggle m2) → act(toggle m1) | `selectedIds`=Set([m2]) / `selectedCount`=1 | AC-9 |
| HK-6 | selectAllFiltered が絞込結果の未出席を全選択する | candidates=[m1,m2,m3], attended=Set([m2]), query="" → selectAllFiltered | `selectedIds`=Set([m1,m3])（m2 を含まない） | AC-9 |
| HK-7 | selectAllFiltered は query 絞込後の候補のみ選択する | candidates=[{m1,"山田"},{m2,"佐藤"}], query="山田" → selectAllFiltered | `selectedIds`=Set([m1]) | AC-2 / AC-9 |
| HK-8 | clear で選択を空にする | toggle m1, m2 → clear | `selectedIds`=空 Set / `selectedCount`=0 | AC-9 |
| HK-9 | attended が後から既選択 id を含むと選択集合から除去する（stale 防止） | toggle m1 → rerender で attended=Set([m1]) | `selectedIds` が m1 を含まない（size 0） | AC-4 / [FB-STATE-DETAIL-002] |
| HK-10 | attended 変化が無関係なら選択 Set 参照を維持する | toggle m1 → rerender で attended=Set([m2]) | `selectedIds` が m1 を保持（size 1） | AC-4 |

### T3: bulk-attendance-message.spec.ts（AC-7）

> 純関数 `bulkFailureMessage(summary: ImportAttendanceSummary): string`（[WEEKGRD-02] 例外を投げず文字列返却）。

| ケース ID | ケース名 | 入力 summary | 期待値（文字列） | trace |
| --- | --- | --- | --- | --- |
| MSG-1 | duplicate のみの内訳を表示 | `{total:2,ok:0,duplicate:2,deletedMember:0,unknownMember:0,invalid:0}` | `"追加できませんでした（出席済 2）。選択を見直してください"` | AC-7 |
| MSG-2 | deletedMember のみの内訳を表示 | `{total:1,ok:0,duplicate:0,deletedMember:1,unknownMember:0,invalid:0}` | `"追加できませんでした（削除済 1）。選択を見直してください"` | AC-7 |
| MSG-3 | unknownMember のみの内訳を表示 | `{...unknownMember:1}` | `"追加できませんでした（不明 1）。選択を見直してください"` | AC-7 |
| MSG-4 | invalid のみの内訳を表示 | `{...invalid:1}` | `"追加できませんでした（不正 1）。選択を見直してください"` | AC-7 |
| MSG-5 | 複数内訳を「出席済 X / 削除済 Y / 不明 Z / 不正 W」順で連結 | `{total:4,ok:0,duplicate:1,deletedMember:1,unknownMember:1,invalid:1}` | `"追加できませんでした（出席済 1 / 削除済 1 / 不明 1 / 不正 1）。選択を見直してください"` | AC-7 |
| MSG-6 | 0 件の内訳は文言に含めない | `{total:2,ok:0,duplicate:2,deletedMember:0,unknownMember:0,invalid:0}` | 出力に「削除済」「不明」「不正」を含まない | AC-7 |
| MSG-7 | 全内訳 0（理論上未到達）でも例外を投げず汎用文言を返す | `{total:0,ok:0,duplicate:0,deletedMember:0,unknownMember:0,invalid:0}` | `"追加できませんでした。選択を見直してください"`（括弧なし） | AC-7 / [WEEKGRD-02] |

### T4: BulkAttendanceChecklist.spec.tsx（AC-1 / AC-2 / AC-3 / AC-4 / AC-7）

> `render` + `@testing-library/user-event`。props: `sessionId="sess-1"` / `candidates` / `attended` / `onBulkAdd=vi.fn(async()=>true)` / `onOpenModal=vi.fn()`。

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| CL-1 | 未出席候補ごとに Checkbox を描画する | candidates=[m1,m2,m3], attended=Set([m2]) | `data-testid=bulk-attendance-option-sess-1` の checkbox が 2 個（m1,m3）・m2 は描画されない | AC-1 / AC-4 |
| CL-2 | 複数候補を同時に選択できる | m1 と m3 を click | 両 checkbox が checked=true | AC-1 |
| CL-3 | 検索入力で候補を絞り込む | candidates=[{m1,"山田"},{m2,"佐藤"}] → search に "山田" 入力 | 候補 checkbox が 1 個（m1）になる | AC-2 |
| CL-4 | 検索 input は FormField 経由で `data-testid=bulk-attendance-search-sess-1` を持つ | render | 当該 testid の input が存在し `data-component=form-field` 配下 | AC-2 / 不変条件 #9 |
| CL-5 | 一括追加ボタンに選択件数 N が反映される | m1, m3 を click | ボタン文言に「2」を含む（例「選択した 2 名を一括追加」） | AC-3 |
| CL-6 | 選択 0 件で一括追加ボタンが disabled | 何も選択しない | `data-testid=bulk-attendance-submit-sess-1` が disabled | AC-3 |
| CL-7 | 一括追加 click で onBulkAdd に選択 memberId 配列を渡す | m1, m3 を click → submit click | `onBulkAdd` が `["m_1","m_3"]` 相当（順不同を sort 比較）で 1 回呼ばれる | AC-3 / AC-5 |
| CL-8 | onBulkAdd が true（committed）を返すと選択をクリアする | onBulkAdd=async()=>true で submit | submit 後にボタンが disabled（selectedCount 0）に戻る | AC-6 |
| CL-9 | onBulkAdd が false（未 commit）を返すと選択を保持する | onBulkAdd=async()=>false で m1 選択して submit | submit 後も m1 が checked のまま・ボタン文言に「1」を含む | AC-7 |
| CL-10 | 「人数が多い時はこちら」で onOpenModal を呼ぶ | モーダル起動リンク click | `onOpenModal` が 1 回呼ばれる | AC-8 |
| CL-11 | 全選択で絞込結果の未出席を全 checked にする | 「全選択」click（candidates=[m1,m2,m3], attended=Set([m2])） | m1,m3 が checked・件数 2 | AC-3 / AC-9 |
| CL-12 | 候補 0 件時は空状態文言を表示しボタンを出さない | candidates 全て attended | 「追加できる会員がいません」を表示・submit ボタン非表示または disabled | AC-4 |

### T5: BulkAttendanceModal.spec.tsx（AC-8 / AC-9）

> props: checklist と同型 + `open=true` / `onClose=vi.fn()`。`data-testid=bulk-attendance-modal-sess-1`。

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| MD-1 | open=true で `role=dialog aria-modal=true` のパネルを描画する | render(open=true) | dialog role 要素 1 個・`data-testid=bulk-attendance-modal-sess-1` 存在 | AC-8 |
| MD-2 | open=false で何も描画しない | render(open=false) | dialog role 要素が DOM に無い | AC-8 |
| MD-3 | 検索 / 全選択 / 選択解除 / 件数ボタンを持つ | render(open=true) | search input・「全選択」・「選択解除」・件数表示ボタンが存在 | AC-8 |
| MD-4 | 全選択 → 件数ボタンに件数が反映される | 全選択 click（候補 3 件 / 未出席 3 件） | ボタン文言に「3」を含む | AC-8 / AC-9 |
| MD-5 | 一括追加 click で onBulkAdd に選択配列を渡す | 全選択 → submit click | `onBulkAdd` が未出席 3 件の配列で 1 回呼ばれる | AC-9 / AC-5 |
| MD-6 | onClose 導線（閉じる）で onClose を呼ぶ | 閉じるボタン click | `onClose` が 1 回呼ばれる | AC-8 |
| MD-7 | onBulkAdd が true を返すと選択をクリアする | onBulkAdd=async()=>true で全選択 → submit | submit 後に件数 0 | AC-6 / AC-9 |

### T6: MeetingAttendanceDrawer.spec.tsx（AC-10 / 既存更新）

> 既存 2 ケースを GREEN 維持しつつ、新 required prop `onBulkAddAttendance: vi.fn(async()=>true)` を全 render に追加する。

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| DR-1 | （既存）出席者一覧で氏名を主表示し memberId を補助表示する | attended=Set([m_1]) | `attendance-attendee-sess-1` に「山田 太郎」と「m_1」 | AC-10（回帰） |
| DR-2 | （既存）候補にない出席者は memberId を表示する | attended=Set([m_unknown]) | 当該 testid に「m_unknown」 | AC-10（回帰） |
| DR-3 | （新規）既存の単一 select 出席追加 UI を保持する | candidates=[m1] | `data-testid=attendance-select-sess-1` と `add-attendance-sess-1` が存在 | AC-10 |
| DR-4 | （新規）ドロワー内にチェックリストを埋め込む | candidates=[m1,m2] | `bulk-attendance-search-sess-1` と `bulk-attendance-submit-sess-1` が存在 | AC-1 |
| DR-5 | （新規）「人数が多い時はこちら」click でモーダルを開く | リンク click | `bulk-attendance-modal-sess-1` が DOM に出現する | AC-8 |

### T7: api.attendance-import.spec.ts（AC-5）

> `vi.stubGlobal("fetch", mock)` で fetch をモック。`importAttendance("sess 1", ["m_1","m_2"])` を呼ぶ。

| ケース ID | ケース名 | 入力 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| API-1 | 単一 fetch で正しい path を叩く | `importAttendance("sess 1", ["m_1"])` | fetch が 1 回・URL が `/api/admin/meetings/sess%201/attendance/import?dryRun=false`（sessionId は encodeURIComponent） | AC-5 |
| API-2 | body が `{rows:[{memberId}...]}` になる | `importAttendance("s", ["m_1","m_2"])` | 送信 body（JSON.parse）が `{rows:[{memberId:"m_1"},{memberId:"m_2"}]}` | AC-5 |
| API-3 | method=POST / content-type=application/json | 上記 | init.method="POST" / headers["content-type"]="application/json" | AC-5 |
| API-4 | 200 committed:true を `{ok:true,data}` で返す | res 200 `{ok:true,summary,rows,dryRun:false,committed:true}` | `{ok:true, data.committed===true, data.summary.ok===1}` | AC-5 / AC-6 |
| API-5 | 200 committed:false も `{ok:true,data}` で返す（HTTP は成功） | res 200 `{...committed:false,summary.duplicate:1}` | `{ok:true, data.committed===false}`（ok:false にしない） | AC-7 |
| API-6 | N 名でも fetch は 1 回のみ（N 回 POST しない） | `importAttendance("s", ["a","b","c"])` | fetch.mock.calls.length===1 | AC-5 |

### T8: MeetingsClientShell.spec.tsx（AC-5 / AC-6 / AC-7 / AC-10 / 編集）

> 既存回帰ケース（単発追加 / 削除）を維持し、onBulkAdd 配線ケースを追加する。`importAttendance` を `vi.mock("../../../../lib/admin/api")` でモックし戻り値を制御する。

| ケース ID | ケース名 | 操作 | 期待値 | trace |
| --- | --- | --- | --- | --- |
| SH-1 | committed:true で summary.ok 件を attended に反映し toast を出す | importAttendance→`{ok:true,data:{committed:true,summary:{...ok:2}}}` で 2 名 bulk add | `attendance-toast` に「2 名の出席を追加しました」・出席者リストに 2 名増 | AC-6 |
| SH-2 | committed:false で attended を変えず失敗 toast を出す | importAttendance→`{ok:true,data:{committed:false,summary:{duplicate:1}}}` | 出席者リスト件数が不変・toast に「追加できませんでした（出席済 1）」 | AC-7 |
| SH-3 | onBulkAdd が committed を boolean で返す | committed:true 時 onBulkAdd 戻り値 | `await onBulkAdd(...)===true`（UI 側 clear トリガ） | AC-6 |
| SH-4 | importAttendance を 1 回だけ呼ぶ（N 回呼ばない） | 3 名 bulk add | importAttendance mock の呼び出し 1 回 | AC-5 |
| SH-5 | 選択件数 > 500 を送信前ガードする | 501 件の memberIds で bulk add | importAttendance を呼ばず toast「一度に追加できるのは 500 名までです」 | SSOT §5 / AC-7 |
| SH-6 | （回帰）単発「出席を追加」が従来通り動作する | addAttendance mock 成功 → onAdd | 出席者 1 名増・toast「出席を追加しました」 | AC-10 |
| SH-7 | （回帰）出席削除が従来通り動作する | remove → confirm | 該当会員が出席者リストから消える | AC-10 |

> 境界値文字列の長さは `.length` コメントで明示する（[W0-RV-001]）。例:
> `expect(toast).toBe("一度に追加できるのは 500 名までです"); // 22 文字`。
> 各 toast / ボタン文言ケースは期待文字列にコメントで文字数を併記する。

## 4. vitest 実行コマンド（SSOT §7 の focused run）

> worktree 直後は事前に `mise exec -- pnpm install` / `mise exec -- pnpm verify:vitest-runtime` を 1 回実施する。

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

> 本リポジトリの vitest 設定はルート `vitest.config.ts` に集約され、`include` glob で `apps/**/__tests__/**/*.spec.{ts,tsx}` を収集する。
> 新規 `.spec.ts(x)` のみ作成する（不変条件 #8。`.test.ts(x)` 禁止）。

## 5. Red 期待（実装前）

実装前は以下が Red（fail / 型エラー）となることを確認する:

- T1（Checkbox.spec.tsx）: `Checkbox.tsx` が存在しないため import エラー。
- T2（useBulkAttendanceSelection.spec.ts）: hook 未実装で import エラー。
- T3（bulk-attendance-message.spec.ts）: `bulkFailureMessage` 未実装で import エラー。
- T4 / T5（Checklist / Modal）: コンポーネント未実装で import エラー。
- T6（MeetingAttendanceDrawer.spec.tsx）: 新 required prop `onBulkAddAttendance` 未渡しで型エラー。
- T7（api.attendance-import.spec.ts）: `importAttendance` 未実装で import エラー。
- T8（MeetingsClientShell.spec.tsx）: onBulkAdd 配線・bulk UI 未実装で testid 不在 fail。

## 6. 成果物（Phase 4）

| 成果物 | パス |
| --- | --- |
| テスト計画書（本書） | `phase-4-test-plan.md` |
| テスト仕様詳細 | `outputs/phase-4/test-specification.md` |

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `phase-1-requirements.md` | AC-1..AC-12 正本 |
| 共有コンテキスト（SSOT） | `outputs/phase-1/shared-context.md` | シグネチャ・API 契約・T1..T6 |
| 設計書 | `phase-2-design.md` | F1..F9 設計・hook 方針・onBulkAdd 戻り値 |
| 設計レビュー | `phase-3-design-review.md` | PASS 判定・純関数ガード・props vs state |
