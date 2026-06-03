# Phase 9: QA / CI gate

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 9（QA / CI gate） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 検証種別 | build / typecheck / lint（lint-boundaries 含む）/ focused Vitest / grep gate |
| 回帰確認対象 | `useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx` |

## 目的

Phase 5 実装と Phase 6 テストに対して、AC-3 / AC-6 / AC-7 を機械検証する CI gate と検証コマンドを確定する。`process.env` 非導入・web storage トークン 0 件・OKLch token 不変・D1 直接アクセス 0 を grep / typecheck / lint で固定する。

## 実行タスク

### 9.1 検証コマンド一覧（実行順）

```bash
# 1. 型チェック（secure 第2引数の型整合 / location.protocol 参照）
mise exec -- pnpm typecheck

# 2. lint（lint-boundaries 含む。localStorage/sessionStorage 禁止トークン検査）
mise exec -- pnpm lint

# 3. focused Vitest（TC-1〜TC-6 + 既存 4 ケース）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts

# 4. build（OpenNext Workers 互換 build）
mise exec -- pnpm build

# 5. process.env 非導入 grep（0 件期待。hit したら fail）
if grep -rn "process.env" apps/web/src/components/shell/; then exit 1; fi

# 6. web storage トークン 非導入 grep（0 件期待。hit したら fail）
if grep -rn "localStorage\|sessionStorage" apps/web/src/components/shell/; then exit 1; fi
```

> `vitest.config.ts` はリポジトリルートが正本（`apps/web/vitest.config.ts` は不在）。`--root=. --config=vitest.config.ts` が正経路。

### 9.2 各 gate の合否基準

| # | gate | 合格基準 | 紐づく AC |
|---|------|---------|-----------|
| 1 | `pnpm typecheck` | exit 0。`serializeShellCollapsedCookie(collapsed, secure?)` の第2引数型・`location.protocol` 参照が型エラー無し | AC-7 |
| 2 | `pnpm lint` | exit 0。lint-boundaries が `localStorage` / `sessionStorage` を検出 0。`document` / `location` は非禁止トークンで許容 | AC-7 |
| 3 | focused Vitest | TC-1〜TC-6 + 既存 4 ケースが全 pass（9 件 green） | AC-6 |
| 4 | `pnpm build` | exit 0。OpenNext Workers 互換 build が通る | AC-7 |
| 5 | `process.env` grep | `apps/web/src/components/shell/` 配下で 0 件。hit 時は exit 1 | AC-3 |
| 6 | web storage grep | `apps/web/src/components/shell/` 配下で 0 件。hit 時は exit 1 | AC-3（env / storage 不変条件） |

### 9.3 token / D1 / CSS 不変の確認

| 確認項目 | 手段 | 期待 |
|----------|------|------|
| OKLch token 不変 | 本タスクは CSS / token ファイル無変更（`apps/web/src/styles/tokens.css` 非差分） | `git diff --name-only` に `.css` が含まれない |
| HEX 直書き 0 | `grep -rn "bg-\[#\|text-\[#\|#[0-9a-fA-F]\{6\}" apps/web/src/components/shell/shell-collapse-cookie.ts` | 0 件（serializer に色値なし） |
| D1 直接アクセス 0 | `apps/web` から D1 binding 参照を増やさない（serializer は cookie 文字列のみ） | `shell-collapse-cookie.ts` に D1 / `env.DB` 参照なし |
| `HttpOnly` 非付与 | serializer 戻り値に `HttpOnly` を含めない（client が読み書きするため） | `grep -n "HttpOnly" apps/web/src/components/shell/shell-collapse-cookie.ts` が 0 件 |

### 9.4 既存 shell suite 回帰なし確認

本タスクは serializer の `secure` 既定値（jsdom http で false）を後方互換に保つため、serializer を間接利用する shell 系 spec が回帰しないことを確認する:

```bash
# shell 系 focused suite を一括実行（回帰確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx
```

| spec | 回帰観点 | 期待 |
|------|---------|------|
| `useSidebarState.spec.tsx` | hook が `writeShellCollapsedCookie` 経由で書込む際、既定 secure=false（jsdom http）で `Secure` が付かず書込が従来どおり成立 | 既存ケース全 pass |
| `SidebarShell.server.spec.tsx` | server seed 経路（cookie read）は serializer の `Secure` 分岐と無関係（read 値に `Secure` は現れない） | 既存ケース全 pass |

### 9.5 自動修復方針（gate fail 時）

| fail した gate | 想定原因 | 修復 |
|----------------|---------|------|
| typecheck | 第2引数 `secure` 型注釈漏れ / `location` の null 許容未対応 | Phase 5 §5.4 After どおり `secure: boolean = isSecureRuntimeContext()` と `?.` を反映 |
| lint | フォーマット差異 | `pnpm lint --fix` を先に試し、残違反のみ手修正 |
| focused Vitest | TC の `toContain` / `endsWith` 不一致 | serializer After の `; Secure` append 位置（末尾）を確認 |
| grep（process.env / storage） | 誤って env / storage を導入 | client runtime（`browserDocument()?.location.protocol`）判定へ戻す |

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 5 実装手順 | `phase-5-implementation.md` | grep 確認 / DoD |
| Phase 6 テスト追加 | `phase-6-test-additions.md` | TC-1〜TC-6 |
| lint-boundaries | `scripts/lint-boundaries.mjs` | 禁止トークン定義 |
| env 不変条件 | `CLAUDE.md`「`apps/web` env アクセス不変条件」 | `process.env` 直接参照禁止 |

## 統合テスト連携

統合テスト（Playwright / SSR HTML 検査）は適用外（`Secure` は read 値に現れない）。代わりに §9.4 の shell 系 focused suite 回帰確認が serializer 変更の波及無しを担保する。

## 成果物

- 本ファイル（`phase-9-qa.md`）に検証コマンド一覧、各 gate 合否基準、token/D1/CSS 不変確認、既存 suite 回帰確認、自動修復方針を確定する。

## 完了条件

- build / typecheck / lint / focused Vitest / process.env grep / web storage grep の 6 gate が合格基準付きで確定している。
- OKLch token 不変・HEX 0・D1 直接アクセス 0・`HttpOnly` 非付与の確認手段が記載されている。
- `useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx` の回帰なし確認コマンドが確定している。
