# Phase 4: テスト作成（RED）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 名称 | テスト作成（RED） |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

実装着手前に、AC-1〜AC-12 を逆算した失敗するテスト（RED）を整備する。Phase 5（実装）でこれらが GREEN になることを確認する。

## テストファイル一覧（CONST_005 必須項目）

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/__tests__/tokens.test.ts` | C | tokens.css の token 定義 / fallback 宣言 / @theme bridge の存在 assert |
| `outputs/phase-4/hex-grep-gate.sh` | C | HEX 直書き 0 件検証スクリプト（task-18 への先行実装、ローカル shell） |

## テストケース定義

### TC-RED-01: tokens.css に必須 OKLch tokens がすべて定義されている（AC-3）

```ts
// apps/web/src/__tests__/tokens.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(
  resolve(__dirname, "../styles/tokens.css"),
  "utf-8",
);

describe("design tokens (tokens.css)", () => {
  it("OKLch palette が全て定義されている", () => {
    const required = [
      // surface / text / border
      "--ubm-color-surface-bg",
      "--ubm-color-surface-bg-2",
      "--ubm-color-surface-panel",
      "--ubm-color-surface-panel-2",
      "--ubm-color-text-primary",
      "--ubm-color-text-secondary",
      "--ubm-color-text-muted",
      "--ubm-color-border-default",
      "--ubm-color-border-strong",
      // accent
      "--ubm-color-accent",
      "--ubm-color-accent-soft",
      "--ubm-color-accent-ink",
      // status (8)
      "--ubm-color-ok",
      "--ubm-color-ok-soft",
      "--ubm-color-warn",
      "--ubm-color-warn-soft",
      "--ubm-color-danger",
      "--ubm-color-danger-soft",
      "--ubm-color-info",
      "--ubm-color-info-soft",
      // zone (5)
      "--ubm-color-zone-a",
      "--ubm-color-zone-b",
      "--ubm-color-zone-c",
      "--ubm-color-zone-d",
      "--ubm-color-zone-e",
      // radius
      "--ubm-radius-sm",
      "--ubm-radius-md",
      "--ubm-radius-lg",
      "--ubm-radius-xl",
      "--ubm-radius-2xl",
      // shadow
      "--ubm-shadow-xs",
      "--ubm-shadow-sm",
      "--ubm-shadow-md",
      "--ubm-shadow-lg",
      // motion
      "--ubm-dur-fast",
      "--ubm-dur-base",
      "--ubm-dur-slow",
      "--ubm-ease-standard",
      "--ubm-ease-emphasized",
      "--ubm-ease-decelerate",
      "--ubm-ease-accelerate",
      // typography
      "--ubm-font-jp",
      "--ubm-font-en",
      "--ubm-font-serif",
      "--ubm-font-body",
      "--ubm-font-mono",
      "--ubm-text-xs",
      "--ubm-text-sm",
      "--ubm-text-base",
      "--ubm-text-md",
      "--ubm-text-lg",
      "--ubm-text-xl",
      "--ubm-text-2xl",
      "--ubm-text-3xl",
      // spacing
      "--ubm-space-0",
      "--ubm-space-1",
      "--ubm-space-2",
      "--ubm-space-3",
      "--ubm-space-4",
      "--ubm-space-6",
      "--ubm-space-8",
      "--ubm-space-12",
      "--ubm-space-16",
      "--ubm-space-24",
    ];
    for (const t of required) {
      expect(css, `missing token: ${t}`).toContain(t);
    }
  });
});
```

期待結果: tokens.css 未作成時に 1 件 fail（RED）。

### TC-RED-02: OKLch fallback が宣言されている（AC-5）

```ts
it("OKLch fallback (@supports not) が宣言されている", () => {
  expect(css).toMatch(/@supports not \(color:\s*oklch/);
});
```

期待結果: tokens.css 未作成時に fail（RED）。

### TC-RED-03: dark mode placeholder が宣言されている（AC-3 補強）

```ts
it("warm/cool theme placeholder が宣言されている", () => {
  expect(css).toMatch(/\[data-theme="warm"\]/);
  expect(css).toMatch(/\[data-theme="cool"\]/);
});
```

### TC-RED-04: @theme inline ブロックが OKLch tokens を bridge している（AC-4）

```ts
// apps/web/src/__tests__/tokens.test.ts に追加
const globals = readFileSync(
  resolve(__dirname, "../styles/globals.css"),
  "utf-8",
);

describe("globals.css @theme bridge", () => {
  it("@theme inline ブロックが宣言されている", () => {
    expect(globals).toMatch(/@theme\s+inline\s*\{/);
  });

  it("代表的な --color-* が var(--ubm-*) 経由で bridge されている", () => {
    const bridges = [
      ["--color-surface", "--ubm-color-surface-bg"],
      ["--color-accent", "--ubm-color-accent"],
      ["--color-ok", "--ubm-color-ok"],
      ["--color-info", "--ubm-color-info"],
      ["--color-zone-a", "--ubm-color-zone-a"],
      ["--radius-md", "--ubm-radius-md"],
      ["--shadow-md", "--ubm-shadow-md"],
      ["--font-sans", "--ubm-font-body"],
    ];
    for (const [tw, ubm] of bridges) {
      const re = new RegExp(`${tw}\\s*:\\s*var\\(${ubm}\\)`);
      expect(globals, `missing bridge: ${tw} -> var(${ubm})`).toMatch(re);
    }
  });

  it("@import \"tailwindcss\" が globals.css の先頭に存在する", () => {
    expect(globals).toMatch(/^@import\s+["']tailwindcss["'];/m);
  });
});
```

### TC-RED-05: HEX 直書き 0 件 grep gate（AC-11）

`outputs/phase-4/hex-grep-gate.sh`:

```bash
#!/usr/bin/env bash
# task-09 phase-4: HEX 直書き 0 件検証（task-18 への先行実装）
# fallback ブロック内 HEX のみ許可（@supports not (color: oklch...) の範囲で判定）
set -euo pipefail

ROOT="${1:-apps/web/src}"

# .ts / .tsx / .css を対象に HEX を検出
matches=$(grep -REn "#[0-9a-fA-F]{3,8}\b" "$ROOT" \
  --include='*.ts' --include='*.tsx' --include='*.css' \
  --exclude-dir=node_modules --exclude-dir=.next || true)

filtered=$(echo "$matches" | awk -F: '
  $1 ~ /tokens\.css$/ { next }
  { print }
')

if [ -n "$filtered" ]; then
  echo "HEX 直書き検出（fallback 外）:"
  echo "$filtered"
  exit 1
fi
echo "HEX 直書き 0 件（OK）"
```

期待結果: tokens.css 未作成 + 既存コードに HEX があれば fail（RED）。

### TC-RED-05B: placeholder token grep 0 件 gate（Phase 12 前倒し）

```bash
rg -n "token-sized|09b-token-value|token-mix|TODO_TOKEN|PLACEHOLDER_TOKEN" \
  apps/web/src/styles docs/30-workflows/task-09-w3-par-tailwind-v4-setup \
  > docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/placeholder-token-grep-zero.md
echo "exit=$?" >> docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/placeholder-token-grep-zero.md
```

期待結果: match 件数 0。Phase 12 compliance check ではコマンド、exit code、match 件数を逐語記録する。

### TC-RED-06: tailwind.config.ts が minimal config（AC-2 補強）

```ts
it("tailwind.config.ts は content glob のみ（theme/plugins 拡張なし）", () => {
  const config = readFileSync(
    resolve(__dirname, "../../tailwind.config.ts"),
    "utf-8",
  );
  expect(config).toMatch(/content:\s*\[/);
  // theme: {} は許可、theme: { extend: ... } や plugins: [...] は禁止
  expect(config).not.toMatch(/theme:\s*\{\s*extend/);
  expect(config).not.toMatch(/plugins:\s*\[[^\]]+\]/);
});
```

### TC-RED-07: postcss.config.mjs が @tailwindcss/postcss 単独構成（AC-2）

```ts
it("postcss.config.mjs は @tailwindcss/postcss 1 plugin のみ", () => {
  const cfg = readFileSync(
    resolve(__dirname, "../../postcss.config.mjs"),
    "utf-8",
  );
  expect(cfg).toMatch(/@tailwindcss\/postcss/);
  expect(cfg).not.toMatch(/autoprefixer/);
});
```

## ローカル実行コマンド（CONST_005 必須項目）

```bash
# RED 確認（実装前なのでテストが fail することを確認）
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/__tests__/tokens.test.ts

# HEX grep gate を実行
bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src
```

## 完了条件

- [ ] TC-RED-01〜TC-RED-07 が `apps/web/src/__tests__/tokens.test.ts` に記述されている
- [ ] `outputs/phase-4/hex-grep-gate.sh` が新設されている
- [ ] テスト実行で **すべて fail（RED）** することを確認（実装前）
- [ ] AC-1〜AC-12 とテスト ID の対応表が `outputs/phase-4/test-matrix.md` に保存されている

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-4/hex-grep-gate.sh`
