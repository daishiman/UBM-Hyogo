# Unassigned Task Detection — issue-1088 manual form resync durationMs

**[実装区分: 実装仕様書 / implementation_mode: new / VISUAL_ON_EXECUTION]**

issue #1088 の Phase 12 未タスク検出。**新規未タスク 0 件**（backend producer + frontend consumer が 1 サイクル完結のため）。0 件でも本ファイルを出力する。

---

## 1. 検出ソース走査

| ソース | 走査結果 |
|---|---|
| 元 issue スコープ外項目 | durationMs 以外のメトリクス（後述 baseline 候補） |
| Phase 3 / Phase 10 MINOR | Phase 10 §10.3 の MINOR-1（`now().getTime()` が monotonic clock でないため時刻後退時に `durationMs` が負になりうる）は**実装で解消済み**。`sync-forms-responses.ts:119` が `const durationMs = () => Math.max(0, now().getTime() - startedAt)` でクランプし、`manual-sync.ts:10` の `z.number().int().nonnegative()` が schema 側で二重防御する。Phase 10 が提案したクランプが実装に取り込まれているため**新規未タスク化不要**（握り潰しではなく解消の記録）|
| Phase 11 発見事項 | runtime screenshot が user-gated（タスクではなく Gate-B/C の実行待ち） |
| TODO / FIXME | 対象 3 ファイルに新規 TODO/FIXME 追加なし |
| `describe.skip` | 対象 spec に skip 追加なし |

## 2. current / baseline 分離

### current（本サイクルで対応）

- backend 3 経路の `durationMs` 計測・返却（AC-1）
- `SyncResultSchema` optional 追加・`.strict()` 維持（AC-2）
- `resultRows` 行追加・`-` fallback（AC-3）
- 既存退化なし / spec 回帰 green / contract green（AC-4/5/6）

→ すべて本サイクルのスコープ内。未タスク化しない。

### baseline 候補（本サイクルではスコープ外・記録のみ）

| 候補 | 内容 | 判断 |
|---|---|---|
| 追加メトリクス | durationMs 以外の派生指標（writeRate = writeCount/durationMs 等） | スコープ外。issue #1088 は durationMs 単体。baseline 候補として記録。 |
| D1 migration | sync_jobs ledger 等への所要時間永続化 | スコープ外。本タスクは戻り値・UI 表示のみで schema 変更なし。 |
| sync/manual.ts / backfill.ts のハードコード `durationMs: 0` 修正 | 別 sync パターン（`DiffSummary` 経由）の `apps/api/src/sync/manual.ts:87` と `apps/api/src/sync/backfill.ts:95` が固定値 `durationMs: 0` を返している（`apps/api/src/sync/types.ts:20` の `DiffSummary.durationMs: number`）。実所要時間へ修正する余地がある | **resync 経路（`runResponseSync`）とは非経由の別 sync use-case** であり、issue #1088 のスコープ（resync 結果の durationMs）と独立。本サイクルでは対象外。実所要時間化は将来検討の baseline 候補として記録。 |

> 上記 baseline 候補は **新規 Issue 化しない**。issue #1088 のスコープ（durationMs の生成・伝播・表示）と独立した将来検討事項であり、本サイクルの両輪完結を妨げない。

## 3. 新規未タスク判定

- **新規未タスク: 0 件**。
- 理由: backend（producer）と frontend（consumer + schema）が同一サイクル内で完結し、route は pass-through で変更不要。durationMs の生成 → 伝播 → 表示が閉じた依存チェーンで完成するため、後続に切り出す残作業がない。

## 4. 関連タスク差分確認

| 関連タスク | 重複チェック |
|---|---|
| 親 Task B（`task-b-manual-form-resync-admin-ui-spec`） | Task B は手動リシンク UI 本体・結果テーブルの枠組みを構築済み。本タスクはその結果テーブルに 1 行追加するのみ。**重複なし**（追加であり再実装ではない）。 |
| issue #1088 | 本 workflow が issue #1088 の唯一の実装経路。**重複なし**。 |

→ **重複なし**。
