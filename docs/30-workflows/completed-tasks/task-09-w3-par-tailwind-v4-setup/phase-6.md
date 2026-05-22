# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 名称 | テスト拡充 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

Phase 4 RED テストの GREEN 化に加え、**bridge 経路の生成 CSS 確認**（Tailwind が実際に utility を出力しているか）を追加することで、AC-4 の証跡を強化する。

## 追加テスト

### TC-EXT-01: ビルド成果に `var(--ubm-color-accent)` が含まれている（AC-4 の動作確認）

```ts
// apps/web/src/__tests__/build-output.test.ts (新設)
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

describe("build output (Tailwind utility 生成確認)", () => {
  const buildDir = resolve(__dirname, "../../.open-next/assets");

  it.runIf(existsSync(buildDir))("生成 CSS に var(--ubm-color-accent) が含まれる", () => {
    const cssFiles = readdirSync(buildDir, { recursive: true })
      .filter((f) => typeof f === "string" && f.endsWith(".css")) as string[];
    const allCss = cssFiles
      .map((f) => readFileSync(join(buildDir, f), "utf-8"))
      .join("\n");
    expect(allCss).toMatch(/var\(--ubm-color-accent\)/);
    expect(allCss).toMatch(/oklch\(/);
  });
});
```

> `it.runIf` で `.open-next/assets` が存在する場合のみ実行。CI では `build:cloudflare` 実行後に走らせる。

### TC-EXT-02: `bg-accent` クラス利用箇所がビルド出力に展開されている

ダミーで `apps/web/src/__tests__/__fixtures__/utility-probe.tsx` を新設し、`bg-accent` / `text-info` / `border-warn` / `bg-zone-a` を全種記述する（content scan に拾わせる）。

```tsx
// apps/web/src/__tests__/__fixtures__/utility-probe.tsx
// このファイルは Tailwind の content scan 対象に含めるためだけのプローブ。
// レンダリングはされない。
export const _probe = (
  <div
    className="bg-surface bg-surface-2 bg-panel bg-panel-2 text-text text-text-2 text-text-3 border-border border-border-2 bg-accent text-accent-ink bg-accent-soft text-ok bg-ok-soft text-warn bg-warn-soft text-danger bg-danger-soft text-info bg-info-soft bg-zone-a bg-zone-b bg-zone-c bg-zone-d bg-zone-e rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl shadow-xs shadow-sm shadow-md shadow-lg font-sans font-mono"
  />
);
```

ビルド後の生成 CSS に上記 utility class 名が含まれることを TC-EXT-01 と同じ仕組みで assert。

```ts
it.runIf(existsSync(buildDir))("Tailwind utility class が生成されている", () => {
  const allCss = /* ... TC-EXT-01 と同じ収集 ... */;
  for (const cls of [".bg-accent", ".text-info", ".border-border", ".rounded-2xl", ".shadow-md"]) {
    expect(allCss, `missing utility: ${cls}`).toContain(cls);
  }
});
```

### TC-EXT-03: 回帰防止 - `apps/api/**` に diff がない

```bash
# Phase 6 の検証として shell で実行（テストハーネス外）
test -z "$(git diff main...HEAD --name-only | grep '^apps/api/')" || (echo "apps/api に diff 検出"; exit 1)
```

## ローカル実行コマンド

```bash
# 通常 unit test
mise exec -- pnpm --filter @ubm-hyogo/web test

# build → build-output test
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/__tests__/build-output.test.ts

# api 不変確認
test -z "$(git diff main...HEAD --name-only | grep '^apps/api/')" && echo "OK: apps/api 不変"
```

## 完了条件

- [ ] TC-EXT-01〜TC-EXT-03 が追加・実行されている
- [ ] `__fixtures__/utility-probe.tsx` がプローブとして配置されている
- [ ] build:cloudflare 後の生成 CSS に `var(--ubm-color-accent)` / `oklch(` / 主要 utility が含まれることを確認
- [ ] `apps/api/**` に diff 0 を確認

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/build-output-grep.md` — 生成 CSS の grep 結果
- `outputs/phase-6/api-diff-zero.md` — `apps/api/` diff ゼロ確認
