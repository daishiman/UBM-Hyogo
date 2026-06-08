# Phase 1: 要件定義

- taskId: `TASK-SENTRY-EXTENSION-NOISE-FILTER-001`
- 実装区分: **実装仕様書（NON_VISUAL）** — 判定根拠は `index.md` 参照
- implementation_mode: `new`
- タスク分類: **NON_VISUAL implementation task**（UI/UX 変更なし・クライアント observability instrumentation）

## 1. 真の論点（1 文固定）

> 「ブラウザ拡張由来のエラーが私たちの Sentry 監視に流入してノイズ化するのを止める。ただし、拡張のコンソールエラーそのものはアプリからは直せないという事実を取り違えない。」

`what`: Sentry へ送る前に拡張フレーム由来イベントを落とす。
`how`: `Sentry.init()` に `ignoreErrors` / `denyUrls` / `beforeSend` を配線。判定ロジックは pure module に分離して単体テスト可能にする。
`why now`: ユーザーが console エラーを観測し対策を要求。現状 `instrumentation-client.ts` の `Sentry.init()` はこれら 3 オプションを未実装。
`why this way`: Sentry 公式の browser-extension best practice。`beforeSend` は全 stack frame を走査でき、`denyUrls`（最終フレーム URL のみ）の穴を埋める。pure module 化で `Sentry.init` を起動せずにロジックを検証できる。

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在するか | No（`rg "extension-noise-filter\|denyUrls\|ignoreErrors\|beforeSend" apps/web` 0 件） | 通常の新規実装 Phase とする |
| upstream にマージ済みか | No | 未マージ |
| 前提タスク完了済みか | Yes（Sentry 基盤 task-04/05 で `instrumentation-client.ts` / `capture.ts` 実装済み） | 依存解消タスク不要 |

## 3. 既存コードベースの事実（調査確定）

| 事実 | 出典 |
|------|------|
| client Sentry は `apps/web/src/instrumentation-client.ts` の `Sentry.init()` で初期化 | `instrumentation-client.ts:19-27` |
| 現状 `beforeSend` / `ignoreErrors` / `denyUrls` は未設定 | 同上（`dsn` / `environment` / `tracesSampleRate` のみ） |
| `@sentry/nextjs` `^10.51.0` / `@sentry/cloudflare` `^10.51.0` を使用 | `apps/web/package.json` |
| 手動 capture は `apps/web/src/lib/sentry/capture.ts`（fail-soft 規約） | `capture.ts:1-115` |
| Sentry barrel: `apps/web/src/lib/sentry/index.ts` | 既存 |
| テストは colocated `*.spec.ts`（例: `apps/web/src/lib/auth.spec.ts`） | リポジトリ慣習・不変条件 #8 |
| client は Next.js SDK のみ（Cloudflare SDK を import しない） | `instrumentation-client.ts:3-4` |

### 命名規則（既存分析）

| 対象 | 規則 | 本タスクでの適用 |
|------|------|------------------|
| ファイル名 | kebab-case（`extension-noise-filter.ts`） | 踏襲 |
| 関数 | camelCase（`captureException`, `parseSampleRate`） | `isExtensionUrl` / `eventHasExtensionFrame` / `filterExtensionNoise` |
| 定数 | UPPER_SNAKE（`CaptureContext` は型） | `EXTENSION_DENY_URLS` / `EXTENSION_IGNORE_ERRORS` / `EXTENSION_PROTOCOL_PREFIXES` |
| テスト | `*.spec.ts` colocated | `extension-noise-filter.spec.ts` |

## 4. スコープと受入条件（AC）

### スコープ IN

| ID | 内容 |
|----|------|
| IN-1 | 拡張由来判定の pure module `apps/web/src/lib/sentry/extension-noise-filter.ts` を新規作成 |
| IN-2 | `Sentry.init()` に `ignoreErrors` / `denyUrls` / `beforeSend` を配線 |
| IN-3 | pure module の単体テスト（`*.spec.ts`）を作成 |

### スコープ OUT（理由付き）

| ID | 内容 | 理由 |
|----|------|------|
| OUT-1 | `service-worker-loader.js` / `Unchecked runtime.lastError` / 他拡張の `[Sentry] You cannot use Sentry.init()` 警告の除去 | **到達不能**。拡張の隔離コンテキスト・別 SDK インスタンス・Chrome 本体の console 出力であり私たちの SDK に届かない。コード変更で除去不可（恒久対策＝拡張無効化／incognito）。未タスク化もしない（実装余地が存在しないため）。 |
| OUT-2 | `capture.ts` / `logger.ts` 側でのフィルタ追加 | YAGNI。拡張エラーは手動 capture を経由せず Sentry グローバルハンドラ経由で入るため、`Sentry.init` の 3 オプションで全カバー。二重実装は避ける。 |
| OUT-3 | server (Cloudflare) 側 Sentry のフィルタ | 拡張はブラウザのみ。server には拡張フレームが存在しない。 |

### 受入条件

| AC | 条件 |
|----|------|
| AC-1 | `chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://` の stack frame を含むイベントは `beforeSend` で `null`（drop）される |
| AC-2 | アプリ自身の error（拡張フレームを含まない）は `beforeSend` を素通りし、これまで通り Sentry に送られる（**fail-open**） |
| AC-3 | `ignoreErrors` に観測された拡張メッセージパターンが登録される |
| AC-4 | `denyUrls` に拡張 protocol の正規表現が登録される |
| AC-5 | `extension-noise-filter.ts` は `Sentry.init` を起動せず単体テスト可能な pure module である |
| AC-6 | filter 関数は throw しない（不正 event shape でも安全に判定。判断不能時は **送信側＝event を残す**） |
| AC-7 | typecheck / lint / focused vitest がすべて green |

## 5. システム観点（要件レビュー思考法）

### 因果ループ
- バランスループ: 拡張エラー流入 → Sentry ノイズ増 → 実エラー埋没 → **本フィルタ** → ノイズ減 → 実エラー可視性回復。
- 強化ループ（リスク）: フィルタが過剰 → アプリ実エラーも drop → 障害検知不能。→ **AC-2 / AC-6 の fail-open で遮断**（判断に迷うイベントは必ず残す）。

### 責務境界・状態所有権
- `extension-noise-filter.ts`（純粋判定ロジック・状態を持たない）／ `instrumentation-client.ts`（SDK 起動・配線のみ）。判定と起動の所有権を混在させない。

### 価値とコスト
- 価値: Sentry ダッシュボードの信号対雑音比改善（運用コスト低減）。コスト: 約 1 pure module + 1 配線 + 単体テスト（小）。将来拡張（除外パターン追加）は同 module の定数追記で閉じる。

## 6. 4 条件の一次結論

| 条件 | 評価 |
|------|------|
| 価値性 | 監視運用者の「ノイズ選別コスト」を下げる。明確。 |
| 実現性 | 1 module + 1 配線 + 1 spec。1 サイクルで実装可能。 |
| 整合性 | 既存 fail-soft 規約・client SDK-only 制約・命名規則と矛盾なし。fail-open でアプリ error の捕捉を保証。 |
| 運用性 | 除外パターンは定数集中で監査可能。誤フィルタ時は定数を絞るだけ。 |

## 7. 完了条件（このタスクの DoD は Phase 5 / Phase 9 / Phase 10 に詳細化）

- 変更ファイル一覧（`index.md` の表）が実体化される
- AC-1〜AC-7 を満たす
- NON_VISUAL のため Phase 11 は自動テスト結果を主証跡とし、スクリーンショット不要
