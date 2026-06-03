# Phase 7: カバレッジ

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 7（カバレッジ） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| coverage 対象 | `serializeShellCollapsedCookie` + `isSecureRuntimeContext` の本タスク変更行のみ |
| 対象外 | parser / reader / writer / alias の既存行（無改修のため対象外） |

## 目的

本タスクで追加・変更した行（`isSecureRuntimeContext` ヘルパ + `serializeShellCollapsedCookie` の `secure` 引数 / `; Secure` append）に限定して、serializer 出力分岐を実質網羅する観点を定義する。ファイル全体やモジュール広域を coverage ゲート対象に広げず、変更行のみを評価範囲とする。

## 実行タスク

### 7.1 coverage 評価範囲（変更行のみに限定）

| 評価対象 | 変更種別 | 評価する分岐 |
|----------|---------|-------------|
| `isSecureRuntimeContext()` | 新規追加 | default-path（jsdom http）で false 側を確認。https true 側は Phase 11 DevTools smoke の user-gated 対象 |
| `serializeShellCollapsedCookie` の `secure` 既定引数 | 追加 | 省略時に `isSecureRuntimeContext()` へフォールバックする経路 |
| `serializeShellCollapsedCookie` の戻り値三項 | 変更 | `secure ? "...; Secure" : "..."` の true / false 2 分岐 |

> parser（`parseShellCollapsedCookie`）/ reader（`readCollapsedFromDocument`）/ writer（`writeShellCollapsedCookie`）/ alias は本タスクで無改修のため、coverage 評価範囲に含めない。既存テストで pass している既存行の coverage 変動は本タスクの判定対象外とする。

### 7.2 serializer 出力分岐のテスト割当

| 分岐 | カバーする TC | 入力 | 通る経路 |
|------|--------------|------|----------|
| 三項 `secure === true` | TC-1 / TC-5 | `serializeShellCollapsedCookie(true, true)` | `; Secure` を append する側 |
| 三項 `secure === false` | TC-2 / TC-3 | `serializeShellCollapsedCookie(true, false)` / `(false, false)` | `; Secure` を付けない側 |
| 既定引数フォールバック（`isSecureRuntimeContext()` 呼出） | TC-4 | `serializeShellCollapsedCookie(true)`（secure 省略） | `isSecureRuntimeContext()` を評価し jsdom http で false → 付けない側 |

> `isSecureRuntimeContext()` の `=== "https:"` true 分岐（戻り値 true）は jsdom 既定 location が `http:` のため focused test の default-path では到達しない。本タスクは serializer の `secure` 引数 true 分岐（TC-1 / TC-5）で「`Secure` を付ける serializer 出力」を直接検証する。runtime 判定の true 戻り値そのものは Phase 11 の DevTools 目視（https staging で `Secure` フラグ確認）で担保し、jsdom location mock は導入しない。

### 7.3 collapsed 値（true / false）の網羅

`serializeShellCollapsedCookie` の第1引数 `collapsed` の `true`/`false` 両値も既存ケース + 新規ケースで網羅する:

| `collapsed` | カバーする TC | 期待 value |
|------------|--------------|-----------|
| `true` | TC-1 / TC-4 / TC-5 | `ubm_shell_collapsed=true` |
| `false` | TC-3 | `ubm_shell_collapsed=false` |

### 7.4 coverage 実行コマンド（変更行に限定して確認）

```bash
# focused suite の coverage を変更行のみ確認（広域指定しない）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --coverage \
  apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
```

> coverage レポートで `shell-collapse-cookie.ts` の `serializeShellCollapsedCookie` / `isSecureRuntimeContext` 行が covered になっていることを確認する。同ファイルの既存無改修行（parser / reader / writer / alias）の uncovered は本タスクのゲート対象外（変更行のみ評価）。リポジトリ全体の coverage しきい値ゲートは本 focused 範囲で判定しない。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 4 テスト計画 | `phase-4-test-plan.md` | TC-1〜TC-6 |
| Phase 6 テスト追加 | `phase-6-test-additions.md` | 追記テストコード全文 |
| Phase 5 実装手順 | `phase-5-implementation.md` | 変更行（serializer / ヘルパ）の正本 |

## 統合テスト連携

統合テストは適用外。coverage は serializer focused Vitest の `--coverage` 出力のみで確認し、変更行（`serializeShellCollapsedCookie` / `isSecureRuntimeContext`）に限定する。

## 成果物

- 本ファイル（`phase-7-coverage.md`）に coverage 評価範囲（変更行限定）、branch coverage 100% のテスト割当、実行コマンドを確定する。

## 完了条件

- coverage 評価範囲が変更行（serializer + ヘルパ）に限定され、無改修行が対象外と明記されている。
- `secure=true` / `secure=false` / 既定（jsdom http）の 3 分岐が TC へ割り当てられている。
- coverage 確認コマンドが確定している。
