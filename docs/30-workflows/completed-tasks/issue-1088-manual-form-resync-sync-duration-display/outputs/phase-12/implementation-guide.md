# Implementation Guide — issue-1088 manual form resync durationMs

**[実装区分: 実装仕様書 / implementation_mode: new]**

issue #1088 は OPEN のまま。本ガイドは実装済み local 変更の実装内容を記録する。commit・PR・authenticated runtime screenshot は user-gated として未実行。

---

## Part 1（中学生レベル）

### なぜ必要か

料理をするとき「カレーは煮込みに 30 分かかった」と分かると、次に作るときの段取りが立てやすくなります。逆に「何分かかったか分からない」と、遅いのか速いのかも判断できません。

管理画面には「フォーム回答の再取込（リシンク）」というボタンがあります。これは Google フォームに届いた回答を、サイトのデータベースに取り込み直す作業です。取込が終わると結果の表が出ますが、いまは「何件処理したか」「何件書き込んだか」は出るのに、**取込にどれだけ時間がかかったか**は出ません。

時間が分からないと、

- 取込が遅くなってきていることに気づけない（料理がだんだん時間がかかるようになっても気づけないのと同じ）
- 「いつもより明らかに遅い」という異常も見逃す

そこで、結果の表に「取込にかかった時間」を 1 行追加します。

### 何をするか

取込処理の「始まった時刻」と「終わった時刻」を測って、その差（かかった時間）を結果に含めます。これを画面の結果テーブルに 1 行追加して見せます。

専門用語の言い換え:

- **durationMs（デュレーション・ミリ秒）** = 取込にかかった時間を「ミリ秒」（1000 分の 1 秒）で表したもの。ストップウォッチで測った経過時間だと思ってください。
- **schema（スキーマ）** = 「受け取ってよいデータの形」を決めた設計図。画面側は「この形のデータしか受け取りません」と決めているので、新しい項目（時間）を受け取れるように設計図を 1 行ひろげます。
- **optional（オプショナル）** = 「あってもなくてもよい項目」。古いデータには時間が入っていないこともあるので、無ければ表には「-」と出すだけで、エラーにはなりません。
- **fallback（フォールバック）** = 値が無いときの代わりの表示。ここでは「-」がそれです。

### 全体の流れ（順番が大事）

1. **取込処理（裏側）** が「かかった時間」を測って結果に入れる。これが時間を生み出す側（producer = 作り手）。
2. **データの形の設計図** に「時間（あってもなくてもよい）」を追加する。
3. **画面（表）** が時間を読み取って 1 行追加する。これが時間を使う側（consumer = 使い手）。

作り手 → 設計図 → 使い手 の順番で作ると、途中でデータがはじかれてエラーになりません。

---

## Part 2（技術者レベル）

### 概要

backend producer（`runResponseSync`）が処理の経過時間 `durationMs` を計測して `ResponseSyncResult` に含め、route（pass-through）→ UI schema（zod, optional）→ 結果テーブル行（`-` fallback）へ伝播させる。backend + frontend を 1 サイクルで実装する。route は変更不要。

### 1. 型定義の変更

#### apps/api `ResponseSyncResult`（公開戻り値型）

`apps/api/src/jobs/sync-forms-responses.ts`（現状 99-107 行）に必須フィールドを追加する:

```ts
export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly durationMs: number; // ★追加（必須）
  readonly skippedReason?: string;
  readonly error?: string;
}
```

backend は producer なので `durationMs` は **必須（非 optional）**。3 経路すべてで必ず値を返す。

#### apps/web `SyncResultSchema` / `SyncResult`（UI zod schema）

`apps/web/src/features/admin/diagnostics/manual-sync.ts`（現状 3-12 行・`.strict()`）に optional フィールドを追加する:

```ts
export const SyncResultSchema = z
  .object({
    status: z.enum(["succeeded", "failed", "skipped"]),
    jobId: z.string(),
    processedCount: z.number().int().nonnegative(),
    writeCount: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
    durationMs: z.number().int().nonnegative().optional(), // ★追加（optional）
    skippedReason: z.string().optional(),
  })
  .strict();
```

UI は consumer。`.strict()` を維持したまま `durationMs` を **optional** にする理由:

- backend が必須化されても、古い in-flight レスポンスや将来の互換境界で欠落しても UI 側で parse 失敗にしない（fail-safe）。
- `.strict()` を残すことで「未知キー混入」は引き続き reject する（AC-2）。
- `z.number().int().nonnegative()` で「非負整数のミリ秒」を表現。`now().getTime()` の差分は常に非負整数。

### 2. API シグネチャ・3 経路の戻り値

`runResponseSync(env, options): Promise<ResponseSyncResult>` のシグネチャは不変。戻り値オブジェクトに `durationMs` を追加する。

計時方式: `now()`（注入可能なクロック）を 2 回呼び差分を取る。

```ts
const now = options.now ?? (() => new Date()); // 116 行（既存）
const startedAt = now().getTime();             // ★116 行直後に追加
```

3 つの return すべてに `durationMs: now().getTime() - startedAt` を付与する:

| 経路 | 場所（現行行） | 返す `status` | 追記 |
|---|---|---|---|
| skipped（lock 取得失敗） | 154-162 行 | `"skipped"` | `durationMs: now().getTime() - startedAt` |
| failed（catch 節） | 225-232 行 | `"failed"` | `durationMs: now().getTime() - startedAt` |
| succeeded（正常終了） | 268-274 行 | `"succeeded"` | `durationMs: now().getTime() - startedAt` |

### 3. route（変更不要）

`apps/api/src/routes/admin/responses-sync.ts`（50-58 行）は `const result = await runResponseSync(c.env, opts);` の結果を `c.json({ ok, result }, status)` で素通しする。型が拡張されれば `durationMs` も自動的に payload に含まれる。**変更不要**。

### 4. 結果テーブル行の追加（UI consumer）

`apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` の `resultRows()`（現状 34-42 行）に行を追加する:

```ts
function resultRows(result: SyncResult) {
  return [
    ["status", result.status],
    ["jobId", result.jobId],
    ["processedCount", result.processedCount],
    ["writeCount", result.writeCount],
    ["cursor", result.cursor ?? "-"],
    ["durationMs", result.durationMs ?? "-"], // ★追加（欠落時 "-"）
  ] as const;
}
```

### 5. エラーハンドリング / エッジケース

- **failed / skipped でも durationMs を返す**: 異常終了でも経過時間は計測対象。3 経路すべてで return に含めることで「失敗した処理が何 ms で打ち切られたか」も観測できる。
- **クロック注入**: 既存の `options.now` を再利用するため、テストで決定論的に固定値を返せる（例: `startedAt` 用と return 用で 2 回返すスタブクロックで `durationMs` を検証可能）。
- **欠落時 `-`**: schema が optional のため `durationMs` が undefined のレスポンスでも parse 成功し、`resultRows` は `result.durationMs ?? "-"` で `"-"` を表示する。
- **非負保証**: `now()` が単調増加する前提で差分は非負。`z.number().int().nonnegative()` と整合。

### 6. 設定可能パラメータ

なし。固定のメトリクスであり、env / options に新しい設定項目は追加しない。

### 7. テスト回帰（AC-4/5/6）

| spec | 影響 | 期待 |
|---|---|---|
| panel spec（TC-B1..B8） | `resultRows` 行追加 | 既存ケース green 維持 + durationMs 行表示・欠落時 `-`（AC-3/4/5） |
| sync-schemas spec（TC-S1..S7） | `SyncResultSchema` optional 追加 | durationMs あり/なし両方 parse 成功・未知キー reject 維持（AC-2/5） |
| `responses-sync.contract.spec.ts` | 3 経路の戻り値拡張 | 各 status で `durationMs` が非負整数として含まれる（AC-1/6） |

---

## 視覚証跡

本タスクは VISUAL。ただし runtime screenshot は **admin 認証 + 実 sync 実行が必須** であり user-gated・**pending**。DOM 上の durationMs 行表示は focused component test で検証済み。

- canonical 名: `manual-form-resync-panel-result-with-duration.png`
- 取得経路: 認証済み admin で `/admin`（診断パネル）→ 手動リシンク実行 → 結果テーブルに `durationMs` 行が表示された状態をキャプチャ。
- 主証跡（自動テスト）: panel spec / sync-schemas spec / backend（`runResponseSync` 3 経路）/ contract spec。これらが durationMs の生成・伝播・表示・後方互換を機械的に保証する。
- runtime PNG は本 local implementation cycle では物理コミットしない（`outputs/phase-11/runtime/` に pending として予約）。
