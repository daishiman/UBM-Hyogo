---
phase: 12
title: Compliance check — workflow_state / phase status / evidence 実在 self-check
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 12: Compliance Check

[実装区分: 実装仕様書]

## 1. なぜこの Phase が必要か（中学生にも分かる説明）

「ちゃんとルール通りに作業したか」を自分でチェックする工程です。
お弁当を作ったあとに「ご飯入れた？おかず入れた？フタした？」と
指差し確認するのと同じです。

このプロジェクトでは、

1. 仕様書 13 個（Phase 1〜13）が**全部そろっているか**
2. それぞれに**正しい YAML ヘッダー**（`phase` / `title` / `workflow_id` / `sub_workflow` / `status`）が付いているか
3. **証拠ファイル**（テスト結果のログ等）が**本当に存在するか**

をスクリプトで自動チェックします。これに合格しないと、GitHub の
プルリクエストが受け付けられない仕組みになっています。

## 2. Self-check 項目

| # | チェック項目 | 検証コマンド |
|---|------------|------------|
| 1 | Phase 1〜13 の md ファイルが 13 個揃っている | `ls docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-*.md \| wc -l` → `13` |
| 2 | 各 md の冒頭に YAML frontmatter（`phase:`/`title:`/`workflow_id:`/`sub_workflow:`/`status:`）がある | `head -7` で目視 or `mise exec -- pnpm exec tsx scripts/gate-metadata.ts` |
| 3 | 各 md の Phase 直後に `[実装区分: 実装仕様書]` が記載 | `grep -l '\[実装区分: 実装仕様書\]' phase-*.md \| wc -l` → `13` |
| 4 | `outputs/phase-11/` の必須 evidence 11 ファイルが物理存在 | `ls docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/outputs/phase-11/ \| wc -l` ≥ `11` |
| 5 | Phase 11 inventory に記載した evidence ファイルがすべて実在 | `test -e` で 11 ファイル確認（grep 0 件 evidence は空ファイル可） |
| 6 | workflow_state が `runtime_pending` 以上 | frontmatter `status` と root artifacts の境界説明を確認 |
| 7 | Phase 12 canonical 9 headings の SSOT に整合 | `mise exec -- pnpm exec tsx scripts/verify-phase12-compliance.ts` |

## 3. canonical 9 headings 整合（SSOT）

本 Phase 12 ファイルは task-specification-creator skill の Phase 12 SSOT に従って下記 9 headings を含む構造にする:

1. なぜこの Phase が必要か（中学生にも分かる説明）
2. Self-check 項目
3. canonical 9 headings 整合（SSOT）
4. workflow_state transition の整合
5. evidence 実在の整合
6. Phase 11 inventory との突合
7. 不整合時の対応
8. 自動 CI gate
9. 完了判定

## 4. workflow_state transition の整合

| 段階 | status | 遷移条件 |
|------|--------|---------|
| 仕様作成完了 | `spec_created` | 本 SW の Phase 1〜13 md が全件揃った時点 |
| local 実装・証跡取得中 | `runtime_pending` | `globals.css` に P1-1〜P1-5 が実装され、local evidence は取得済みだが serial-07 の visual runtime evidence が未完 |
| runtime 完了 | `completed` | visual runtime evidence と必要 gate が実測 exit 0 / artifact 物理生成済み |

本 SW はコード差分を伴うため、parallel-01 単体の実装状態は **`runtime_pending`** と扱う。workflow root 全体は serial-05 / serial-07 が未完のため `spec_created` を維持する。

## 5. evidence 実在の整合

Phase 11 inventory に記載した 11 evidence ファイルが `outputs/phase-11/` 配下に
物理存在するかを検査する。parallel-01 の local evidence は今回サイクルで生成し、visual runtime evidence は serial-07 の責務として `runtime_pending` 境界に残す。

## 6. Phase 11 inventory との突合

- [x] inventory に記載のファイル名と実ディレクトリ内容が 1:1 で一致すること
- [x] 余剰ファイルがある場合は inventory に追記すること

## 7. 不整合時の対応

| 不整合パターン | 対応 |
|--------------|------|
| Phase md 欠落 | 該当 Phase を新規作成し、frontmatter を整える |
| frontmatter 不足 | `mise exec -- pnpm exec tsx scripts/gate-metadata.ts` の出力を参照して修正 |
| evidence 欠落 | Phase 10 のコマンドを再実行して生成。grep 0 件 evidence は空ファイルでよい |
| Phase 12 SSOT 不整合 | `.claude/skills/task-specification-creator/references/phase12-ssot.md` を参照して 9 headings を修正 |

## 8. 自動 CI gate

| gate | 役割 |
|------|------|
| `verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan |
| `gate-metadata:validate` | artifacts.json zod schema |
| Phase 11 evidence existence | `ls` / `test -e` による evidence 物理存在 |

## 9. 完了判定

本 Phase 12 は「自己点検が green」であれば `runtime_pending` として完了とみなす。green の判定は §2 のチェック項目 1〜7 がすべて pass であること。`completed` は serial-07 visual runtime evidence 完了後にのみ使う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `12` |
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
