---
phase: 7
title: 品質ゲート — typecheck / lint / build / verify-design-tokens / verify-pr-ready
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 7: 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| Gate | コマンド | 期待 | 失敗時の典型原因 |
|------|---------|------|------------------|
| G1 typecheck | `mise exec -- pnpm typecheck` | exit 0 | admin layout の className 変更を含むため TSX 構文破損も検出対象 |
| G2 lint | `mise exec -- pnpm lint` | exit 0 | stylelint 等が globals.css を検査する場合、追加規則の syntax / order 違反 |
| G3 build | `mise exec -- pnpm build` | exit 0 | `next build --webpack` で CSS bundle 失敗。未定義 `--ubm-*` 参照、`@layer` 構文崩れ |
| G4 verify-design-tokens | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts`（既存 CI） | exit 0 | HEX 直書き / `bg-[#` 検出 |
| G5 verify-pr-ready | `bash scripts/verify-pr-ready.sh` | exit 0 | docs-only gate / gate-metadata / verify:phase12-compliance / indexes drift |

## 2. 各ゲートの通過条件

### G1 typecheck
- [x] 本 SW の TSX 変更は className 文字列 1 行のみ
- [x] 通過条件: `apps/web` / `apps/api` 双方の `tsc --noEmit` が exit 0

### G2 lint
- [x] 通過条件: ESLint / Stylelint（設定されていれば）が exit 0
- [x] 本 SW の CSS 追加が attribute selector のみで spec 違反を起こさない設計

### G3 build
- [x] 通過条件: `apps/web` の `next build --webpack` が exit 0
- [x] 確認ポイント: 本 SW が参照する `--ubm-*` トークンすべてが `tokens.css` で defined
- [x] Cloudflare Workers 互換 bundle に CSS が正しく載ること（OpenNext build 内で確認）

### G4 verify-design-tokens
- [x] 通過条件: 既存 CI workflow `verify-design-tokens` が green
- [x] 検査対象: `apps/web/src/**/*.{ts,tsx,css}`
- [x] 本 SW 追加分の HEX 直書き 0 件、`bg-[#` 0 件、`text-[#` 0 件

### G5 verify-pr-ready
- [x] 通過条件: `bash scripts/verify-pr-ready.sh` exit 0
- [x] 内部で `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift を検査
- [x] 本 SW では Phase 12 canonical 9 headings と Phase 11 evidence 表が整っていることが条件

## 3. ゲート実行順序

```
G1 typecheck ─┐
G2 lint      ─┼─→ G3 build ─→ G4 verify-design-tokens ─→ G5 verify-pr-ready
              ┘
```

G1/G2 は並列実行可、G3 以降は前段成功が前提。

## 4. ローカル先行検証（pre-push）

`lefthook.yml` の pre-push hook（`verify-indexes-up-to-date` / `verify-gate-metadata`）がローカルで先行ブロックする。CI 失敗を待たずローカルで気づける。

## 5. ゲート評価記録

各ゲート結果は Phase 11 evidence inventory に下記ファイルとして保存:

| Gate | evidence ファイル |
|------|------------------|
| G1 | `outputs/phase-11/typecheck.log` |
| G2 | `outputs/phase-11/lint.log` |
| G3 | `outputs/phase-11/build.log` |
| G4 | `outputs/phase-11/verify-design-tokens.log` |
| G5 | `outputs/phase-11/verify-pr-ready.log` |

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `7` |
| status | `runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |

## 目的

この Phase は既存本文の内容を、task-specification-creator の共通骨格に沿って実行可能な仕様として扱う。

## 実行タスク

1. 既存本文の Phase 固有タスクを実行する。
2. `apps/web/src/styles/globals.css` の P1-1〜P1-5 selector contract と矛盾しないことを確認する。
3. Phase 11 evidence と Phase 12 strict 7 の境界を `VISUAL_ON_EXECUTION` として維持する。

## 参照資料

- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- `apps/web/src/styles/globals.css`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/` の local selector evidence
- `outputs/phase-12/` の strict 7 files

## 完了条件

- [x] `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm` が error 0 である。
- [x] P1-1〜P1-5 selector が `globals.css` に存在する。
- [x] root workflow 全体の visual runtime evidence は serial-07 に委譲され、parallel-01 は `runtime_pending` として閉じる。

## 統合テスト連携

- CSS selector presence は `outputs/phase-11/section-presence.txt` と `grep-selectors.txt` で確認する。
- visual screenshot は `serial-07-regression-evidence/` の責務として後続 runtime evidence に接続する。
