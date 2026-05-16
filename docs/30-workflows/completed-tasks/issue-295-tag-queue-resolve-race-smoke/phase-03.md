# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 3 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 3 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-03/main.md

## 完了条件

- [x] Phase 3 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 03 — 設計レビュー

[実装区分: 実装仕様書]

## セルフレビュー観点

### 1. 並行性の保証

- `Promise.all([...Array(N)].map(() => fetch(...)))` でイベントループ同 tick に N 件投入する。
- 各 fetch の `startedAt` / `finishedAt` を記録し、evidence JSON で重なりを目視確認できるようにする。
- Node `fetch` の HTTP/1.1 keep-alive 連結による直列化が懸念点だが、staging API は HTTPS かつ Workers 経由のため connection multiplexing は問題化しにくい。それでも明示的に各 fetch で `headers: { 'connection': 'close' }` 相当を入れるか、`undici` の `dispatcher` を使わずに default で行く方針を採る（標準 fetch のみ、deps 0）。

### 2. 副作用なし保証

- script 自身は HTTP POST のみ。D1 直接アクセスはしない。
- 失敗 fetch は server 側で guarded UPDATE で守られているため、敗者の更新は D1 に届かない（07a Phase 7 AC-1 で確認済み）。

### 3. staging fixture の冪等性

- 検証前: 専用 fixture queue（`status='queued'`）を 1 件 INSERT。
- 検証後: queue は `resolved` or `rejected` になり再利用不可。次回検証は新規 fixture を作成する手順を Phase 11 に明記。
- fixture member は test 用 sandbox member を再利用（PRD 学習に混入しないよう `manju.manju.03.28@gmail.com` 系の test account）。

### 4. flakiness 対策

- timing 依存判定をしない（重なり時間は記録のみで判定材料にしない）。
- 判定は終状態の **件数のみ**: `successes==1 && raceLosts>=1 && others==0`。
- network error は再試行せず `others` 計上で `fail`。再試行で race を歪めるリスクを避ける。

### 5. secrets 漏洩

- `redact(opts)` で cookie を `***` 化してから stdout/evidence に書く。
- evidence JSON にも `sessionCookie` を含めない（`results[].body` に server エコーがないことを確認）。

### 6. 退出コード設計

- `pass` → exit 0
- `concurrency<2` → exit 2。race 未実行を成功扱いしない。
- `fail` (verdict) → exit 1
- `usage error / 全件接続不能` → exit 2

### 7. テスト容易性

- `runConcurrentResolve` は `fetch` を引数で差し替え可能にする（DI）。これで shell test から mock fetch を注入できる ── ただし shell test は mjs を直接 spawn できないため、`analyzeResults` を CLI から `--analyze-only --input <json>` で呼べる sub-command を備える（後述 Phase 04 で test 用に活用）。

## 判定

- 上記論点はすべて Phase 02 設計でカバー可能。実装段階で `analyzeResults` sub-command の追加のみ確定する。

## 成果物

- `outputs/phase-03/main.md`

## 次 Phase

- [phase-04.md](./phase-04.md): テスト戦略
