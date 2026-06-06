# Phase 8 — リファクタリング

**[実装区分: 実装仕様書 / implementation_mode: new]**

> 本 Phase は preview 経路の追加にあたり「既存資産との重複を生まない設計」と「命名 drift を起こさない設計」を固定する。
> 重複削減 / navigation・命名 drift / 過剰リファクタ回避 の 3 観点を点検し、各点について
> 対象 / Before / After / 理由を [Feedback RT-03] のテーブル形式で記述する。
> **write path（`runResponseSync` / `processResponse`）には一切手を入れない**ことを大前提とする。

---

## 1. 変更内容（[Feedback RT-03] 対象 / Before / After / 理由）

| 対象 | Before（現状） | After（あるべき姿） | 理由 |
|------|---------------|----------------------|------|
| pagination helper（`parseHighWaterCursor` / `isAfterHighWater` / `estimateResponseWrites` / `parseAutoPublishFlag`） | `runResponseSync` が module 内で利用。`previewResponseSync` は未存在 | `previewResponseSync` から**同一 helper を共有**（再実装しない）。必要なら module 内で `export` し、両関数が単一ソースを参照 | 集計ロジックを 2 箇所に複製すると highWater / 推定 write の判定が drift し、AC-2（実数）の整合が崩れる。単一ソース共有で挙動を一致させる |
| `formId` 解決ロジック | `runResponseSync` 内で `options.formId ?? env.GOOGLE_FORM_ID`・未設定 throw | `previewResponseSync` も**同一の解決式**を使用（必要なら小さな内部 helper へ抽出を検討） | run と preview で formId 解決が分岐すると preview の scope が run とずれる。同一式で整合 |
| cursor 決定ロジック（`fullSync` → null / `cursor` 指定 → それ / それ以外 → `readLastCursor`） | `runResponseSync` 内に実装 | `previewResponseSync` も同一決定ロジック。**共通 helper への抽出可否を検討項目**とする（抽出する場合は read-only な純関数として両者で共有・抽出しない場合は同値であることをコメントで担保） | run / preview で scope が一致することを構造的に保証する。ただし read（`readLastCursor`）は preview でも読取のみで副作用なし |
| `mode` union（UI 状態） | Task B は `"run" \| "backfill" \| null`（2 値 + null） | `"run" \| "backfill" \| "preview" \| null` の **3 値 + null** に統一。`mode` / `activeMode` の両方を同一 union 型で揃える | preview state を別 boolean で持つと state 整合の組み合わせ爆発が起きる。単一 union で `canBackfill = previewResult!==null && mode==="preview"` を一貫表現する |
| preview schema 命名 | 既存は `SyncResultSchema` / `SyncRunResponseSchema`、参考 `BackfillResultSchema`（[FB-SDK-07-4] 命名規則） | 新規は `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / 型 `SyncPreviewResult` とし、**既存 `<名詞>Schema` / `<名詞>RunResponseSchema` 規則を踏襲** | 命名一貫性（[FB-SDK-07-4]）。`BackfillResultSchema` と同じ接尾規則に揃え、レビュー時の認知負荷を下げる |
| dry-run UI パターン | `BackfillPublishStatePanel` が `mode`/`activeMode`/`canApply` gate / 結果テーブルの staged パターンを完成済み | `ManualFormResyncPanel` で**同一パターンを踏襲**（`canBackfill` gate / preview 結果パネル / `activeMode` による busy 表現）。新規 primitive・新規 dialog を**生やさない** | 同一 `_sync` 配下の確立済みパターンに揃え、UX と実装の整合を最小コストで担保（不変条件: prototype alignment §3 / DD3） |

---

## 2. 重複削減の方針（duplicate を作らない）

1. **集計ロジックは job レイヤに単一ソース化**: `previewResponseSync` は pagination helper を `runResponseSync` と共有し、件数集計を UI / route に複製しない（AC-2 / 責務境界）。
2. **`previewResponseSync` は `runResponseSync` の dryRun 内挿ではなく別関数**（DD1）。write path への分岐内挿を避けることで、run の lock/ledger/write cap/PII redact 不変条件への回帰を構造的に遮断する。共有するのは read-only helper のみ。
3. **schema は `manual-sync.ts` に単一ソース**: preview schema を component 側へ重複定義しない。`apps/api` を import しない（不変条件 #5）。
4. **path 定数は単一 `SYNC_RESPONSES_PATH` + query suffix**: preview は `?dryRun=true&fullSync=true`、backfill は `?fullSync=true` を suffix で切替え、新規 path 定数を増やさない。

---

## 3. navigation / 命名 drift の点検

| 観点 | 判定 | 根拠 |
|------|------|------|
| マウント箇所 | drift なし | preview ボタンは既存 `ManualFormResyncPanel` 内に追加し、新規ページ・新規導線を作らない |
| `mode` union 整合 | 統一済み | `mode` / `activeMode` を `"run"\|"backfill"\|"preview"\|null` の同一 union に揃える |
| schema 命名 | 規則踏襲 | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema`（[FB-SDK-07-4] `BackfillResultSchema` 命名規則踏襲） |
| testid 命名 | 規則踏襲 | `manual-sync-backfill-preview` を既存 `manual-sync-*` 接頭に揃える |

---

## 4. 過剰リファクタを避ける方針（YAGNI）

- **write path 不可侵**: `runResponseSync` / `processResponse` / lock / ledger / write cap には手を入れない。preview 追加を口実に既存 run 経路をリファクタしない（AC-3 退行リスク回避）。
- **早期抽象化の回避**: cursor 決定ロジックの共通 helper 抽出は「検討項目」とし、抽出が同値性を明確化する場合のみ行う。同値であることをコメントで担保できるなら抽出しない選択も可とする（over-abstraction を避ける）。
- **`BackfillPublishStatePanel` との共通化はしない**: 責務（フォーム回答再取込 vs publish_state backfill）が異なり、testid も衝突しない。パターン踏襲はするが component の物理共通化はコストが価値を上回るため不採用。

---

## 5. 点検コマンド（重複・drift が無いことの裏付け）

```bash
# pagination helper が単一 module 内で共有され、preview 側に再実装が無いこと
grep -n 'parseHighWaterCursor\|isAfterHighWater\|estimateResponseWrites\|parseAutoPublishFlag' \
  apps/api/src/jobs/sync-forms-responses.ts

# preview schema 命名が規則踏襲であること（manual-sync.ts に単一ソース）
grep -n 'SyncPreviewResultSchema\|SyncPreviewRunResponseSchema' \
  apps/web/src/features/admin/diagnostics/manual-sync.ts

# path 定数が単一であること（新規 path 定数を増やしていない）
grep -rn 'SYNC_RESPONSES_PATH' apps/web/src

# mode union が 3 値 + null に統一されていること
grep -n '"run"\|"backfill"\|"preview"' \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx
```

期待: helper は `sync-forms-responses.ts` に単一定義 / preview schema は `manual-sync.ts` のみに定義 / `SYNC_RESPONSES_PATH` は単一定数 / `mode` union は 3 値 + null に統一。

---

## 完了条件

- [x] 対象 / Before / After / 理由テーブルで変更内容（helper 共有 / formId・cursor 解決 / mode union / 命名 / UI パターン）を記述した（[Feedback RT-03]）
- [x] pagination helper を `runResponseSync` と `previewResponseSync` で重複させず共有する方針を固定した
- [x] cursor 決定ロジックの共有（ヘルパー抽出可否）を検討項目として記述した
- [x] `mode` union（`"run"\|"backfill"\|"preview"`）と preview schema 命名一貫性（[FB-SDK-07-4]）を整合させた
- [x] write path（`runResponseSync` / `processResponse`）に手を入れない過剰リファクタ回避方針を明記した
- [x] 点検コマンドで重複・drift が無いことを検証可能にした
