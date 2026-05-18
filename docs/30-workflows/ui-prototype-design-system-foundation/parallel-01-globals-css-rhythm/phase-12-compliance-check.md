---
phase: 12
title: Compliance check — workflow_state / phase status / evidence 実在 self-check
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 12 — Compliance Check

[実装区分: 実装仕様書]

## 1. なぜこの Phase が必要か（中学生にも分かる説明）

「ちゃんとルール通りに作業したか」を自分でチェックする工程です。
お弁当を作ったあとに「ご飯入れた？おかず入れた？フタした？」と
指差し確認するのと同じです。

このプロジェクトでは、

1. 仕様書 13 個（Phase 1〜13）が**全部そろっているか**
2. それぞれに**正しい YAML ヘッダー**（タイトル・状態など）が付いているか
3. **証拠ファイル**（テスト結果のログ等）が**本当に存在するか**

をスクリプトで自動チェックします。これに合格しないと、GitHub の
プルリクエストが受け付けられない仕組みになっています。

## 2. Self-check 項目

| # | チェック項目 | 検証コマンド |
|---|------------|------------|
| 1 | Phase 1〜13 の md ファイルが 13 個揃っている | `ls docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-*.md \| wc -l` → `13` |
| 2 | 各 md の冒頭に YAML frontmatter（`phase:`/`title:`/`workflow_id:`/`sub_workflow:`/`status:`）がある | `head -7` で目視 or `mise exec -- pnpm exec tsx scripts/gate-metadata.ts` |
| 3 | 各 md の Phase 直後に `[実装区分: 実装仕様書]` が記載 | `grep -l '\[実装区分: 実装仕様書\]' phase-*.md \| wc -l` → `13` |
| 4 | `outputs/phase-11/` の必須 evidence 10 ファイルが物理存在 | `ls outputs/phase-11/ \| wc -l` ≥ `10` |
| 5 | Phase 11 inventory に記載した evidence ファイルがすべて実在 | `scripts/verify-phase11-evidence.ts` |
| 6 | workflow_state が `spec_created` 以上 | frontmatter `status` で確認 |
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
| 実装開始 | `implementing` | 実装プロンプト（`03.実装.md`）開始時 |
| 実装完了 | `implemented` | Phase 8 DoD 全件 green |
| PR 作成 | `pr_opened` | Phase 13 commit & gh pr create 完了 |
| マージ済 | `merged` | dev へ merge |

本 SW 作成完了時の status は **`spec_created`**。

## 5. evidence 実在の整合

Phase 11 inventory に記載した 10 evidence ファイルが `outputs/phase-11/` 配下に
物理存在するか、`scripts/verify-phase11-evidence.ts` で検査する。実装完了後にのみ
green 化することを期待し、仕様書作成段階では未生成で可。

## 6. Phase 11 inventory との突合

- inventory に記載のファイル名と実ディレクトリ内容が 1:1 で一致すること
- 余剰ファイルがある場合は inventory に追記すること

## 7. 不整合時の対応

| 不整合パターン | 対応 |
|--------------|------|
| Phase md 欠落 | 該当 Phase を新規作成し、frontmatter を整える |
| frontmatter 不足 | `mise exec -- pnpm exec tsx scripts/gate-metadata.ts` の出力を参照して修正 |
| evidence 欠落 | Phase 10 のコマンドを再実行して生成 |
| Phase 12 SSOT 不整合 | `.claude/skills/task-specification-creator/references/phase12-ssot.md` を参照して 9 headings を修正 |

## 8. 自動 CI gate

| gate | 役割 |
|------|------|
| `verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan |
| `gate-metadata:validate` | artifacts.json zod schema |
| `verify-phase11-evidence` | evidence 物理存在 |

## 9. 完了判定

本 Phase 12 は「自己点検が green」であれば完了とみなす。green の判定は §2 の
チェック項目 1〜7 がすべて pass であること。
