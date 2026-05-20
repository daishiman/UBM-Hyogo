---
phase: 10
title: ローカル検証コマンド
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 10: ローカル検証コマンド

[実装区分: 実装仕様書]

## 1. 検証コマンド一覧（順次実行）

実行前提: ワークツリー root に `cd` 済、`mise install` 済。

```bash
# 1. 依存整合性（CSS 変更でも lock 同期は確認）
mise exec -- pnpm install

# 2. 型チェック
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. build（Cloudflare Workers 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build

# 5. HEX 直書き grep（本 SW 追加分が 0 件であること）
grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css || echo "OK: no HEX"

# 6. bg-[# / text-[# grep
grep -nE '\b(bg|text)-\[#' apps/web/src/styles/globals.css || echo "OK: no arbitrary tailwind"

# 7. P1-1〜P1-5 セクション存在確認
grep -n 'parallel-01 P1-' apps/web/src/styles/globals.css

# 8. selector 全件存在確認
grep -nE '\[data-(route|section|card|shell|text)' apps/web/src/styles/globals.css

# 9. admin shell width 契約
grep -n 'md:grid-cols-\\[272px_1fr\\]' 'apps/web/app/(admin)/layout.tsx'

# 10. verify-design-tokens（既存 CI と同じスクリプト）
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts

# 11. PR 準備 gate
bash scripts/verify-pr-ready.sh
```

各ログを Phase 11 evidence として保存する場合は、リポジトリ root から下記の `EVIDENCE_DIR` を使う。

```bash
EVIDENCE_DIR=docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/outputs/phase-11
mkdir -p "$EVIDENCE_DIR"
```

## 2. 期待結果サマリ

| Step | 期待 |
|------|------|
| 1 | lockfile drift なし |
| 2 | `Tasks: ... successful` exit 0 |
| 3 | lint warning/error 0 |
| 4 | `Compiled successfully` exit 0 |
| 5 | 出力なし or 既存 tokens から間接参照のみ。本 SW 追加行に HEX が含まれない |
| 6 | 出力なし |
| 7 | 5 件 hit（P1-1 page surface / P1-2 section rhythm / P1-3 card chrome / P1-4 shell surface / P1-5 typography scale） |
| 8 | 各 selector が hit |
| 9 | admin shell width が `272px` |
| 10 | exit 0 |
| 11 | exit 0 |

## 3. 失敗時の対処（典型）

| 失敗 | 対処 |
|------|------|
| Step 4 build fail: `--ubm-* is not defined` | tokens.css 内のトークン名と Phase 4 の依存表を照合。typo を修正 |
| Step 5/6 grep hit | 追加 CSS の該当行を token 経由に置換 |
| Step 7 hit < 5 | 欠落セクションを Phase 5 §3 の実装サンプルから補完 |
| Step 9 fail | admin shell の grid width を `md:grid-cols-[272px_1fr]` に戻す |
| Step 10 fail | `verify-design-tokens.ts` の出力 line を参照し、該当箇所を token 経由に置換 |
| Step 11 fail | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照 |

## 4. ローカル dev 起動による視覚確認（任意）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://127.0.0.1:3000 にアクセス
```

本 SW 単体では page.tsx が未整備で見た目変化を判定しにくい。serial-05 完了後に再確認するのが効率的。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `10` |
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
