# Phase 7: 単体テスト計画

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Phase 番号 | 7 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | Phase 6（実装手順詳細）|
| 下流 Phase | Phase 8（統合 / smoke）|
| 状態 | completed |

---

## 0. 目的

Phase 6 で実装した `is-browser.ts` / `logger.ts` の不変条件を、Vitest 単体テストで構造的に保証する。元仕様 §7 のテーブル 7 ケースをすべて実装し、jsdom / node 両環境での動作・Sentry mock 連携・child フィールドマージ・runtime tag 判定・throw 安全性を検証する。

---

## 1. 変更対象ファイル

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/__tests__/is-browser.test.ts` | C | jsdom env 用 |
| `apps/web/src/lib/__tests__/is-browser.node.test.ts` | C | node env 用（SSR/Workers 模擬）|
| `apps/web/src/lib/__tests__/logger.test.ts` | C | logger の挙動検証 |
| `apps/web/src/lib/__tests__/logger.runtime.test.ts` | C | node env 用 runtime tag 検証 |

> 元仕様 §3 では is-browser テストを 1 ファイルとしているが、jsdom / node の env 切替は **`// @vitest-environment` pragma がファイル単位** であるため、本 task では 2 ファイルに分離する（Phase 5 §4.2 で確定済み）。

---

## 2. `is-browser.test.ts`（jsdom env）仕様

### 2.1 ファイル冒頭

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { isBrowser, whenBrowser } from "../is-browser";
```

### 2.2 テストケース

| # | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| 1 | jsdom env で `isBrowser()` が `true` | （なし）| `expect(isBrowser()).toBe(true)` |
| 2 | `whenBrowser(fn)` が jsdom 下で fn を呼ぶ | `vi.fn()` | `expect(fn).toHaveBeenCalledTimes(1)` |
| 3 | `whenBrowser` が同期的に呼ぶ | `let called = false; whenBrowser(() => { called = true })` | `expect(called).toBe(true)` |

### 2.3 サンプル実装

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { isBrowser, whenBrowser } from "../is-browser";

describe("isBrowser (jsdom)", () => {
  it("returns true under jsdom env", () => {
    expect(isBrowser()).toBe(true);
  });

  it("whenBrowser executes the callback", () => {
    const fn = vi.fn();
    whenBrowser(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("whenBrowser executes synchronously", () => {
    let called = false;
    whenBrowser(() => { called = true; });
    expect(called).toBe(true);
  });
});
```

---

## 3. `is-browser.node.test.ts`（node env）仕様

### 3.1 ファイル冒頭

```ts
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { isBrowser, whenBrowser } from "../is-browser";
```

### 3.2 テストケース

| # | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| 1 | node env で `isBrowser()` が `false` | （なし）| `expect(isBrowser()).toBe(false)` |
| 2 | `whenBrowser(fn)` が node 下では noop | `vi.fn()` | `expect(fn).not.toHaveBeenCalled()` |

---

## 4. `logger.test.ts` 仕様

### 4.1 ファイル冒頭と mock 戦略

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Sentry capture を完全 mock 化（実 SDK を呼ばない）
vi.mock("@/lib/sentry/capture", () => ({
  captureException: vi.fn(() => "evt_xxx"),
  captureMessage: vi.fn(() => "evt_yyy"),
}));

import { logger } from "../logger";
import { captureException, captureMessage } from "@/lib/sentry/capture";
```

> **mock 戦略**: `vi.mock('@/lib/sentry/capture')` でモジュール全体を差し替え、`captureException` / `captureMessage` を `vi.fn()` 化する。これにより:
> - logger 単体の振る舞い検証に Sentry 実 SDK 依存を持ち込まない
> - 呼び出し回数 / 引数を spy で検証できる
> - Sentry が throw しても logger が throw しないことを `mockImplementation(() => { throw ... })` で再現できる

### 4.2 テストケース（元仕様 §7 + 拡張）

| # | ケース | 期待 |
| --- | --- | --- |
| 1 | `logger.info({event:"x"})` が JSON 一行を `console.info` に出す | spy で `JSON.parse(arg)` が `{level:"info", event:"x", ts, runtime}` を含む |
| 2 | `logger.error({event:"y", err})` が `captureException` を 1 回呼ぶ | `expect(captureException).toHaveBeenCalledTimes(1)` |
| 3 | `logger.warn({event:"z"})` が `captureMessage` を `level:"warning"` で呼ぶ | `expect(captureMessage).toHaveBeenCalledWith("z", expect.objectContaining({ level: "warning" }))` |
| 4 | `logger.child({userId:"u1"})` が全 emit に `userId` を付与する | console spy で payload に `userId:"u1"` が含まれる |
| 5 | Sentry が throw しても logger は throw しない | `captureException.mockImplementation(() => { throw new Error("sentry down") })` の状態で `expect(() => logger.error({event:"e"})).not.toThrow()` |
| 6 | runtime tag が `browser` になる（jsdom env） | console spy の payload で `runtime:"browser"` |
| 7 | `logger.debug({event:"d"})` は Sentry を呼ばない | `expect(captureException).not.toHaveBeenCalled()` & `expect(captureMessage).not.toHaveBeenCalled()` |
| 8 | `logger.info({event:"d"})` は Sentry を呼ばない | 同上（info / debug ともに console-only）|
| 9 | runtime tag が `nodejs` になる（node env / 別ファイル）| 別ファイルで `process.env.NEXT_RUNTIME='nodejs'` を stub し payload に `runtime:"nodejs"` |
| 10 | runtime tag が `workers` になる（NEXT_RUNTIME 未定義 / SSR 模擬）| node env で `delete process.env.NEXT_RUNTIME` 後 `runtime:"workers"`（is-browser が false かつ env なし）|

> ケース 9, 10 は `// @vitest-environment node` の追加ファイル（`logger.runtime.test.ts`）へ分離する。`artifacts.json` と本 Phase の成果物表にも正式成果物として登録し、AC-2 の test pass 対象に含める。

### 4.3 サンプル実装（ケース 1〜5 抜粋）

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sentry/capture", () => ({
  captureException: vi.fn(() => "evt_xxx"),
  captureMessage: vi.fn(() => "evt_yyy"),
}));

import { logger } from "../logger";
import { captureException, captureMessage } from "@/lib/sentry/capture";

describe("logger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("emits JSON one-line to console.info on info()", () => {
    logger.info({ event: "x" });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({ level: "info", event: "x", runtime: "browser" });
    expect(typeof payload.ts).toBe("string");
  });

  it("calls captureException once on error()", () => {
    const err = new Error("boom");
    logger.error({ event: "y", err });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ level: "error", tags: expect.objectContaining({ event: "y" }) }),
    );
  });

  it("calls captureMessage with level=warning on warn()", () => {
    logger.warn({ event: "z" });
    expect(captureMessage).toHaveBeenCalledWith(
      "z",
      expect.objectContaining({ level: "warning" }),
    );
  });

  it("merges child fields into emitted payload", () => {
    const child = logger.child({ userId: "u1" });
    child.info({ event: "c" });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload.userId).toBe("u1");
    expect(payload.event).toBe("c");
  });

  it("does not throw when Sentry capture throws", () => {
    (captureException as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("sentry down");
    });
    expect(() => logger.error({ event: "e" })).not.toThrow();
  });

  it("does not call Sentry on info/debug levels", () => {
    logger.info({ event: "i" });
    logger.debug({ event: "d" });
    expect(captureException).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });
});
```

### 4.4 「Sentry が throw しても logger が throw しない」の実現方法

実装側 (`logger.ts`) は `captureException(...)` / `captureMessage(...)` 呼び出しを `try/catch` で包む。**`captureException` 自体が同期 throw する** ケースでも logger から伝播させない。本テストはそのガードが効いていることを保証する。

> task-03 §5.3 の swallow 設計に依存しきらず、logger 側でも観測失敗を吸収する二重防御にする。

---

## 5. mock パターン早見

| 対象 | 戦略 |
| --- | --- |
| `@/lib/sentry/capture` | `vi.mock()` でモジュール差替え。`captureException` / `captureMessage` を `vi.fn()` 化 |
| `console.{info,warn,error,debug}` | `vi.spyOn(console, ...).mockImplementation(() => {})`。各 `beforeEach` で `vi.clearAllMocks()` |
| `process.env.NEXT_RUNTIME` | runtime tag 専用テストでのみ `vi.stubEnv('NEXT_RUNTIME', 'nodejs')` / `vi.unstubAllEnvs()` |
| `window` | jsdom env が自動提供。SSR 模擬は別ファイル `// @vitest-environment node` で実現 |

---

## 6. 期待カバレッジ目標

| metric | 目標 |
| --- | --- |
| `apps/web/src/lib/is-browser.ts` line | 100% |
| `apps/web/src/lib/is-browser.ts` branch | 100% |
| `apps/web/src/lib/logger.ts` line | ≥ 95% |
| `apps/web/src/lib/logger.ts` branch | ≥ 90% |
| `apps/web/src/lib/logger.ts` function | 100%（`emit` / `build` / `RUNTIME_TAG` / 4 level methods + `child`）|

未カバレッジ許容範囲:
- `RUNTIME_TAG` の `edge` 分岐は本 PR では対象外（NEXT_RUNTIME='edge' のスタブが Next.js 連携 task で網羅）

---

## 7. 実行コマンド

```bash
# 単体テスト実行
mise exec -- pnpm --filter @ubm-hyogo/web test \
  src/lib/__tests__/is-browser.test.ts \
  src/lib/__tests__/is-browser.node.test.ts \
  src/lib/__tests__/logger.test.ts \
  src/lib/__tests__/logger.runtime.test.ts

# カバレッジ計測
mise exec -- pnpm --filter @ubm-hyogo/web test --coverage \
  --coverage.include='src/lib/is-browser.ts' \
  --coverage.include='src/lib/logger.ts'
```

---

## 8. AC ↔ test 対応表

| AC（仕様 §9 DoD）| 対応テスト |
| --- | --- |
| logger / is-browser test pass | §2〜4 全ケース |
| logger 出力が JSON 一行 | §4.2 ケース 1 |
| logger.error が Sentry に event を記録 | §4.2 ケース 2 |
| logger 自身が落ちない | §4.2 ケース 5 |
| runtime tag 判定 | §4.2 ケース 6, 9, 10 |
| `isBrowser()` SSR/browser 判定 | §2 / §3 全ケース |

---

## 9. DoD（本 phase）

- [ ] §2 / §3 / §4 のテストファイルが新設され全 pass
- [ ] `vi.mock('@/lib/sentry/capture')` で Sentry が完全モック化されている
- [ ] §6 カバレッジ目標達成
- [ ] §7 実行コマンドが exit 0

---

## 10. 成果物（本 phase）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-07/phase-07.md` | 単体テスト計画（本ファイルと同内容）|
| テストファイル | `apps/web/src/lib/__tests__/is-browser.test.ts` | jsdom env |
| テストファイル | `apps/web/src/lib/__tests__/is-browser.node.test.ts` | node env |
| テストファイル | `apps/web/src/lib/__tests__/logger.test.ts` | logger 全ケース |
| テストファイル | `apps/web/src/lib/__tests__/logger.runtime.test.ts` | runtime tag node / workers ケース |

---

## 11. 完了条件

- [ ] §9 DoD 全項目 green
- [ ] §8 AC ↔ test 対応表が完全に紐付いている

---

## 12. 次 Phase

- 次: Phase 8（統合 / smoke）
- 引き継ぎ事項: テストカバレッジ結果 / Sentry mock 戦略
- ブロック条件: §9 DoD のいずれかが red

## 実行タスク

1. `is-browser.test.ts` と `is-browser.node.test.ts` を作成する。
2. `logger.test.ts` と `logger.runtime.test.ts` を作成する。
3. Sentry mock、runtime tag、non-throw 契約を検証する。

## 参照資料

| 種別 | パス |
| --- | --- |
| Phase 6 | `phase-06.md` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
