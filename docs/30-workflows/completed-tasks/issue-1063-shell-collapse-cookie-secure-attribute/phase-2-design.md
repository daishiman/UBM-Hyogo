# Phase 2: 設計

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 2（設計） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 入力 | Phase 1 受入条件（AC-1〜AC-7） |
| 出力 | serializer の `Secure` 環境分岐設計（シグネチャ・判定経路・データフロー） |

## 目的

AC-1〜AC-7 を満たす最小差分の設計を確定する。環境判定経路の選定、serializer のシグネチャ拡張、`secure` 分岐の所有権境界を固定し、Phase 4（テスト）/ Phase 5（実装）が逸脱なく従える設計正本とする。

## 実行タスク

### 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

新規ファイル・新規 cookie・新規 state store を作らない。既存 `serializeShellCollapsedCookie` の戻り値末尾に条件付き `; Secure` を足す**最小差分**で AC を満たす。`browserDocument()` は `is-browser.ts` の既存 accessor を再利用し、新規 `browserLocation()` は作らない（Phase 1 §1.6）。

### 2.2 環境判定経路の選定（最重要・苦戦箇所）

起点 spec §3.1 が示す 2 候補を評価し、**client runtime 判定**を採用する。

| 候補 | 内容 | 採否 | 根拠 |
|------|------|------|------|
| A: `getPublicEnv()` の公開値で production 判定 | env アクセサ経由で `NODE_ENV`/`ENVIRONMENT` を読む | **不採用** | serializer は client writer 同期パスから呼ばれる。`getEnv()` は zod throw 経路で error boundary 設計（task-05）に乗らないと握り潰しになる。public env 値は HTTPS とは別軸（production でも HTTP local preview があり得る）で「Secure を付けてよい文脈 = HTTPS」を直接表さない |
| **B: client runtime（`location.protocol === "https:"`）** | `browserDocument()?.location.protocol === "https:"` で判定 | **採用** | env を増やさず client 単独で完結。`Secure` を付けてよい条件（= HTTPS で送受信される文脈）を**直接**表す。`process.env` を `apps/web/src` に増やさない（AC-3）。throw しない（`browserDocument()` は SSR/Workers で `undefined` を返すだけ） |

> 判定の意味論: `Secure` cookie は HTTPS 接続でしか送信されない。よって「HTTPS で配信されている時のみ `Secure` を付ける」= `location.protocol === "https:"` が正準。production = HTTPS、localhost dev = `http:` のため、これが「production 限定」を runtime で正しく表現する。

### 2.3 serializer シグネチャ拡張

| 対象 | Before | After |
|------|--------|-------|
| `serializeShellCollapsedCookie` | `(collapsed: boolean): string` | `(collapsed: boolean, secure?: boolean): string`（`secure` 既定値 = `isSecureRuntimeContext()`） |
| 新規内部ヘルパ | — | `isSecureRuntimeContext(): boolean`（module 内 private。export しない） |
| `writeShellCollapsedCookie` | `serializeShellCollapsedCookie(collapsed)` を呼ぶ | **無改修**（既定の `secure` 引数経由で runtime 判定を自動取得） |
| parser 群 | — | **無改修**（I-5） |

設計判断（変更不可の根拠）:

- **`secure` を第2引数（optional・既定 = runtime 判定）にする理由**: テストが `secure` を明示注入することで `isSecureRuntimeContext` のモック無しに**両分岐を決定論的**に検証できる（起点 spec §3.3 の「環境分岐モック」課題を引数注入で解消）。本番経路（`writeShellCollapsedCookie`）は引数を省略し runtime 判定を拾うため呼出側は無改修。
- **`isSecureRuntimeContext` を private にする理由**: 公開 API surface を増やさない。`Secure` 分岐を serializer module 内に閉じ込める（I-1）。
- **`Secure` を文字列末尾に足す理由**: `Path`/`Max-Age`/`SameSite` の既存順序・大文字小文字を一切変えない（I-2）。`SameSite=Lax` の後ろに `; Secure` を append するだけで他属性に副作用が無い。

### 2.4 データフロー

```
[本番 client toggle]
  useSidebarState.toggleCollapsed()
    → writeShellCollapsedCookie(collapsed)
        → serializeShellCollapsedCookie(collapsed)            // secure 省略
            → isSecureRuntimeContext()                        // browserDocument()?.location.protocol === "https:"
            → `${NAME}=${value}; Path=/; Max-Age=...; SameSite=Lax` (+ "; Secure" if https)
        → doc.cookie = <serialized>

[テスト]
  serializeShellCollapsedCookie(true, true)   → "...; SameSite=Lax; Secure"   // AC-1
  serializeShellCollapsedCookie(true, false)  → "...; SameSite=Lax"            // AC-2
  serializeShellCollapsedCookie(true)         → "...; SameSite=Lax"            // jsdom http → AC-3 default-path
```

### 2.5 ロック / 状態所有権

- `Secure` 付与判定の所有権は serializer module（`shell-collapse-cookie.ts`）に**単一集約**。呼出側（writer / hook / server）は判定を持たない（I-1）。
- 状態変更（state store）は無い。本タスクは純粋な文字列生成ロジックの分岐追加のみ。副作用は既存 `writeShellCollapsedCookie` の `document.cookie` 書込のみで、本タスクで新規副作用は増えない。

### 2.6 エラーハンドリング / エッジケース

| ケース | 挙動 | 根拠 |
|--------|------|------|
| SSR / Workers（`browserDocument()` が `undefined`） | `isSecureRuntimeContext()` は `undefined?.location` → `false` → `Secure` 無し | serializer が SSR で呼ばれることは無い（writer は client 専用）が、呼ばれても dev 安全側（`Secure` 無し）に倒れ throw しない |
| `location.protocol` が `https:` 以外（`http:` / `file:` / `blob:`） | `false` → `Secure` 無し | localhost dev（`http:`）で cookie が黙って送信されない回帰を防ぐ（起点 spec §3.4） |
| `secure` 引数を明示 `true`/`false` | runtime 判定を無視し引数を優先 | テスト決定論性。本番経路は引数省略のため影響なし |

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
|----------|------|------|
| セキュリティ | `.claude/skills/aiworkflow-requirements/references/security-*.md` | cookie `Secure` 属性 / 送信制御方針 |

### プロジェクト資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| 現行 serializer | `apps/web/src/components/shell/shell-collapse-cookie.ts` | 改修対象 |
| browser accessor | `apps/web/src/lib/is-browser.ts` | `browserDocument()` 再利用 |
| env 不変条件 | `CLAUDE.md`「`apps/web` env アクセス不変条件」 | 判定経路 B 採用の制約根拠 |

## 統合テスト連携

設計上、`Secure` は `document.cookie` の read 値に現れないため統合テスト（DOM read / Playwright）では検証不可。serializer 戻り値の文字列検証（Phase 4）が唯一の自動検証経路であることを設計判断として固定する。既存 shell 系統合テストへの回帰防止は Phase 9 で typecheck/lint/focused suite により担保する。

## 成果物

- 本ファイル（`phase-2-design.md`）に環境判定経路の選定・serializer シグネチャ・データフロー・エラーハンドリングを確定する。

## 完了条件

- 環境判定経路（候補 B）が根拠付きで選定されている。
- serializer の Before/After シグネチャと `secure` 引数の既定値が確定している。
- エッジケース（SSR / non-https / 明示引数）の挙動が表で固定されている。
