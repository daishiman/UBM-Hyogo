# Phase 8: リファクタ

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 8（リファクタ） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| リファクタ規模 | 最小（差分 2 ファイル・新規ファイル 0） |
| navigation drift | なし（route / nav 変更を伴わない security hardening） |

## 目的

Phase 5 の最小差分実装を前提に、重複・複雑化を生まないことを確認し、必要な微小整形のみを「対象 / Before / After / 理由」テーブルで固定する。本タスクは serializer 1 関数への後方互換追加であり、構造変更を伴う大きなリファクタは行わない。

## 実行タスク

### 8.1 リファクタ項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `; Secure` 付与ロジック | `if (secure) { return base + "; Secure"; } return base;`（分岐ブロック） | `return secure ? \`${base}; Secure\` : base;`（三項演算子・1 行） | 2 値分岐を 1 式に簡潔化し重複 `return base` を 0 にする。Phase 5 §5.4 After は既にこの三項形で確定済み（本 Phase で逆行させない） |
| `base` 文字列の組立 | serializer 本体に template literal を直書き | `const base = \`${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax\`;` を中間変数へ抽出 | `; Secure` 付与の有無で同一基底文字列を 2 度書かない（重複 0）。三項両辺で `base` を共有する |
| 環境判定 | serializer 内に `browserDocument()?.location.protocol === "https:"` を直書き | private ヘルパ `isSecureRuntimeContext()` へ抽出し、`secure` 引数の既定値に使用 | 判定意図に名前を与え、テストが `secure` 引数で決定論的に注入できるようにする（判定と整形の関心分離） |

> 上記 3 項は Phase 5 実装で既に達成済みであり、本 Phase は「これ以上の構造変更を加えない」ことの確認に相当する。新規 abstraction（汎用 cookie builder / 属性配列化等）は単一 cookie・単一属性の追加に対して過剰であり導入しない。

### 8.2 リファクタしない判断（過剰抽象の回避）

| 候補 | 判断 | 理由 |
|------|------|------|
| 汎用 `browserLocation()` accessor を `is-browser.ts` に新設 | 導入しない | 本タスクは `browserDocument()?.location` で完結する。新 accessor は別関心の API 設計判断を持ち込むため Phase 1 §1.6 でスコープ外。横展開候補は Phase 10 の MINOR（M-1）へ引き継ぐ |
| cookie 属性を配列で組み立てる builder へ一般化 | 導入しない | 属性は `Path` / `Max-Age` / `SameSite` / 条件付き `Secure` の固定構成。配列化は YAGNI で可読性を下げる |
| `secure` を enum / オブジェクト options 引数へ昇格 | 導入しない | boolean 1 値で十分。options 化は呼出側（既定経由）の単純さを損なう |

### 8.3 命名・型の整合確認

| 項目 | 確認 |
|------|------|
| `isSecureRuntimeContext` | 動詞句 + 名詞で「現在 runtime が secure か」を表す。private（`export` しない）。戻り値 `boolean` |
| `serializeShellCollapsedCookie(collapsed, secure?)` | 既存 camelCase 関数命名を踏襲。`secure` は boolean・既定値付き optional |
| 定数 | `SHELL_COLLAPSE_COOKIE_NAME` / `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` は無改修（SCREAMING_SNAKE 維持） |

### 8.4 navigation / 構造 drift 確認

- route / layout / nav 構成は無変更（serializer module 内のみの差分）。`SidebarShell*.tsx` / 3 layout / `useSidebarState.ts` は無改修。
- import 経路の変更なし（`browserDocument` の既存 import を再利用）。
- 公開 API surface の追加・削除なし（`isSecureRuntimeContext` は private で export しない）。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 5 実装手順 | `phase-5-implementation.md` | After コード（三項 / base 抽出 / ヘルパ） |
| index 不変条件 | `index.md` | I-1〜I-6 |
| スコープ外定義 | `phase-1-requirements.md` §1.6 | `browserLocation()` 新設の除外根拠 |

## 統合テスト連携

リファクタは serializer 内部に閉じ、公開 signature と既定挙動（jsdom http で `Secure` 無し）を不変に保つため、既存 shell 系統合経路（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）への影響はない。Phase 9 で回帰なしを確認する。

## 成果物

- 本ファイル（`phase-8-refactor.md`）にリファクタ項目（対象/Before/After/理由）と過剰抽象の回避判断、navigation drift なしを確定する。

## 完了条件

- リファクタ項目が「対象/Before/After/理由」テーブルで固定され、重複 0・三項簡潔化が明記されている。
- 過剰抽象（汎用 accessor / builder / options 化）を導入しない判断が根拠付きで記録されている。
- navigation / 構造 drift なしが確認されている。
