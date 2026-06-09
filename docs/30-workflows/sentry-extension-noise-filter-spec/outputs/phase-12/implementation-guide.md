# 実装ガイド — Sentry 拡張ノイズフィルタ

> 本タスクは **implementation / NON_VISUAL / implemented_local_evidence_captured** として実装済み。
> 以下のシグネチャ・配線は実装正本（SSOT）であり、識別子は逐語で一致している。

## Part 1

> 中学生にもわかる説明。なぜ必要か → 何をするか。

### たとえ話: 監視カメラに近所の人が映り込む

あなたの家（= 私たちのアプリ）には、異常があったらすぐ知らせてくれる **監視カメラ**（= Sentry。エラー監視サービス）が
ついています。家のどこかで物が壊れたら（= アプリが本当にエラーを起こしたら）、カメラがそれを記録して
「異常です！」と通知してくれます。これはとても大事な機能です。

ところが最近、カメラのアラートが鳴りまくっています。調べてみると、原因はあなたの家の異常ではなく、
**近所の人（= ブラウザの拡張機能。利用者が自分でブラウザに入れている、私たちとは無関係な別プログラム）** が
カメラの前を勝手に通っていたからでした。近所の人が映っても、あなたの家には何の問題もありません。
でもカメラは「何か動いた！」と毎回アラートを出してしまい、本当に大事な「家の異常」が
ノイズに埋もれて見えなくなってしまいます。

### このタスクでやること: 仕分けルールを足す

そこで、カメラに **仕分けルール** を1つ足します。

- カメラが何かをとらえたとき、その映像に **近所の人（拡張機能）が映っているか** を確認する。
- 近所の人だけが映っているフレーム（= 拡張機能だけが原因のエラー）なら、**通知しない**。
- 自分の家の異常（= アプリ自身のエラー）は、これまで通り **必ず通知する**。

ここで一番大事なルールは「**迷ったら通知する**」です（専門用語で **fail-open**＝判断に失敗したら
握り潰さず安全側に倒す、という意味）。もし「これは近所の人なのか、自分の家なのか分からない」という
あいまいなフレームが来たら、**消さずに残します**。大事な通知を間違って消してしまうより、
ノイズが少し残るほうがずっと安全だからです。

### 正直な限界: そもそもカメラに映らないノイズもある

調べたところ、利用者が見ているコンソール（ブラウザの開発者ツールに出るメッセージ）の行は、
**すべて第三者の拡張機能が出していて、私たちのアプリのコードが原因ではありません**。

しかも、その多く（`service-worker-loader.js` / `Unchecked runtime.lastError` /
他の拡張機能自身が出す `[Sentry] You cannot use Sentry.init()` 警告など）は、
**そもそも私たちのカメラ（Sentry SDK）の前を通らない**＝別の隔離された場所や Chrome 本体・別の SDK が
出しているため、**仕分けルールをいくら足しても消せません**。

私たちが対策できるのは、たまたまアプリの世界（main world）に漏れてきた
「拡張機能のフレームを含む event」だけを Sentry から除外する、という **一部分** です。
この境界は正直に記録します（できないものを「できる」と言わない）。

---

## Part 2

> 開発者レベル。型・配線・役割分担・エラーハンドリング・設定可能パラメータ。

### 新規 pure module: `apps/web/src/lib/sentry/extension-noise-filter.ts`

```ts
import type { ErrorEvent, EventHint } from "@sentry/core";

/** 拡張由来 URL を識別するプロトコル接頭辞（除外パターン定数 / 設定可能） */
export const EXTENSION_PROTOCOL_PREFIXES: readonly string[];

/** Sentry.init の denyUrls に渡す拡張 URL パターン */
export const EXTENSION_DENY_URLS: RegExp[];

/** Sentry.init の ignoreErrors に渡す拡張ノイズメッセージパターン */
export const EXTENSION_IGNORE_ERRORS: (string | RegExp)[];

/** 渡された URL が拡張由来かを判定（null / undefined は false） */
export function isExtensionUrl(url: string | undefined | null): boolean;

/** event の stacktrace frame / culprit / request.url 等に拡張フレームが含まれるか */
export function eventHasExtensionFrame(event: ErrorEvent): boolean;

/**
 * beforeSend 本体。
 * 拡張フレームのみが原因と判断できる event は null（=送信しない）を返す。
 * 判断不能・アプリフレームを含む・例外発生時は event をそのまま返す（fail-open）。
 */
export function filterExtensionNoise(
  event: ErrorEvent,
  hint?: EventHint,
): ErrorEvent | null;
```

> 上記識別子は実装時の正本。スペル・大文字小文字・引数名まで逐語一致させること。

### `Sentry.init` への配線: `apps/web/src/instrumentation-client.ts`

```ts
import * as Sentry from "@sentry/nextjs";
import {
  EXTENSION_DENY_URLS,
  EXTENSION_IGNORE_ERRORS,
  filterExtensionNoise,
} from "@/lib/sentry/extension-noise-filter";

Sentry.init({
  // ...既存設定（dsn / tracesSampleRate 等）はそのまま維持...
  ignoreErrors: [
    // ...既存の ignoreErrors があれば spread で温存...
    ...EXTENSION_IGNORE_ERRORS,
  ],
  denyUrls: [
    // ...既存の denyUrls があれば spread で温存...
    ...EXTENSION_DENY_URLS,
  ],
  beforeSend(event, hint) {
    return filterExtensionNoise(event, hint);
  },
});
```

> 既存設定キーを破壊せず additive に配線する。既存 `ignoreErrors` / `denyUrls` がある場合は
> 必ず spread で結合し、上書きで失わないこと。

### 3 機構の役割分担

| 機構 | 適用タイミング | 判定対象 | 役割 | fail 挙動 |
|------|----------------|----------|------|-----------|
| `ignoreErrors`（`EXTENSION_IGNORE_ERRORS`） | SDK 内部・送信前 | エラーメッセージ文字列 | 既知の拡張ノイズ文言をメッセージ一致で早期除外 | パターン非一致なら通す（安全側） |
| `denyUrls`（`EXTENSION_DENY_URLS`） | SDK 内部・送信前 | event 内の URL | `chrome-extension://` 等の URL から発生した event を除外 | パターン非一致なら通す（安全側） |
| `beforeSend`（`filterExtensionNoise`） | 最終フック・送信直前 | stacktrace frame / culprit / request.url を横断 | `ignoreErrors` / `denyUrls` を通り抜けた拡張フレーム event を最終仕分け | 判断不能・例外時は event を返す（fail-open） |

> `ignoreErrors` / `denyUrls` は粗い前段フィルタ、`beforeSend` は frame 横断の最終仕分け、という二段構え。
> いずれの段も「除外すると確信できる時だけ除外」する設計で、確信できなければ event を残す。

### エラーハンドリング（fail-open の徹底）

- `filterExtensionNoise` は内部で `try` し、判定ロジックが throw した場合は **event をそのまま返す**。
  ノイズフィルタ自身のバグでアプリの実エラーを失わないため。
- `event` の `exception` / `stacktrace` / `frames` が undefined / 空でも安全に false を返し、event を残す。
- `eventHasExtensionFrame` は「アプリ由来 frame が 1 つでもあれば除外しない」を優先する。
  拡張 frame とアプリ frame が混在する event は **残す**（実エラーの可能性があるため）。
- 判定の真理値は「**除外する＝拡張のみと確信**」「**それ以外は全て残す**」の片側安全設計。

### 設定可能パラメータ（除外パターン定数の一覧）

| 定数 | 型 | 内容 | 拡張点 |
|------|----|------|--------|
| `EXTENSION_PROTOCOL_PREFIXES` | `readonly string[]` | `chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://` | 新ブラウザ拡張スキーム追加はここに 1 行追記で閉じる |
| `EXTENSION_DENY_URLS` | `RegExp[]` | 上記接頭辞を URL マッチに展開した正規表現群 | 新パターン追加はここ |
| `EXTENSION_IGNORE_ERRORS` | `(string \| RegExp)[]` | main world に漏れる既知拡張メッセージ文言 | 到達可能な新ノイズ文言が判明したらここに追記 |

> 新しい拡張スキームや到達可能なノイズ文言が将来出た場合は、上記定数への追記のみで対応する
> 恒常拡張点とする（フィルタ本体ロジックの再設計を不要にする）。

### 任意編集: barrel `apps/web/src/lib/sentry/index.ts`

公開 API を barrel 経由で再 export する場合に編集（任意）。既存 `capture.ts`（fail-soft 手動 capture）の
export を破壊しないこと。

### 既存前提

- `@sentry/nextjs ^10.51.0` 導入済み。client は `instrumentation-client.ts` で `Sentry.init`。
- 手動 capture は `apps/web/src/lib/sentry/capture.ts`（fail-soft）。本タスクは自動 event の送信前フィルタであり、
  capture.ts の二重フィルタは行わない（YAGNI、後述 unassigned-task 参照）。

---

## 視覚証跡

本タスクは **UI / UX 変更なし**（Sentry のクライアント送信前フィルタのみ）のため、
**Phase 11 スクリーンショットは不要**。

代替証跡として以下を参照する:

- `outputs/phase-10/phase-10.md`（最終レビュー: 設計・到達不能ノイズ境界・fail-open 不変条件の確認）
- `outputs/phase-11/manual-test-result.md`（focused vitest / typecheck / lint のPASS証跡）
