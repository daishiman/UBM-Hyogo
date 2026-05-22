---
phase: 12
title: Compliance check — Phase 11 evidence existence validator gate
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 12 — Compliance check（中学生レベル概念説明込み）

[実装区分: 実装仕様書]

## 1. なぜ Phase 12 が必要か（中学生レベル説明）

Phase 11 で「この場所にこのファイルを置く」と決めても、人間が忘れて置き忘れるとあとから「ちゃんとやった」と言えなくなる。Phase 12 では「Phase 11 で決めた場所に本当にファイルがあるか」を機械が自動で確認する。先生（CI）が「宿題の写真出して」と言って、本当に写真があるかチェックするのと同じ。

つまり Phase 12 は **「Phase 11 と実物の照合」を CI で機械化** するための gate。

## 2. canonical 9 headings（task-specification-creator 標準）

本ファイルは Phase 12 の standard 9 headings に準拠する:

1. 目的
2. 適用範囲
3. 検証ルール
4. 実行コマンド
5. 失敗時の対応
6. 例外規定
7. 監査ログ
8. 関連ドキュメント
9. SSOT 宣言

## 3. 目的

Phase 11 で定義した evidence inventory（14 entry）が物理存在し、`artifacts.json` が gate-metadata zod schema を通過していることを CI で機械検証する。これにより本 SW の DoD（Phase 8）が満たされたことを branch protection 経由で gate にする。

## 4. 適用範囲

| 範囲 | 内容 |
|------|------|
| 対象ディレクトリ | `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/outputs/phase-11/` |
| 対象 evidence | Phase 11 §2.1 ログ 7 件 / §2.2 screenshot 4 件 / §2.3 metadata 3 件 = 計 14 件 |
| 対象 schema | `artifacts.json` の zod schema（gate-metadata） |
| 対象 gate | `verify-phase12-compliance` / `verify-gate-metadata` |

## 5. 検証ルール

| Rule | 内容 | 検証 |
|------|------|------|
| R-01 | Phase 11 inventory 表の全 14 path が物理存在 | `verify-phase12-compliance` の evidence existence validator |
| R-02 | 各ファイルのサイズ > 0 | 同上 |
| R-03 | `artifacts.json` が zod schema を満たす（`status` enum / `passed_at` ISO 8601 / `evidence_path` 相対パス） | `gate-metadata:validate` |
| R-04 | `artifacts.json.gates[].evidence_path` が R-01 の存在チェックリストに含まれる | gate-metadata:validate |
| R-05 | Phase 12 compliance check の canonical 9 headings が `outputs/phase-12/phase12-task-spec-compliance-check.md` に存在 | `verify-phase12-compliance` |
| R-06 | workflow root（`SCOPE.md` / `index.md` 既存）と本 SW Phase 1 の参照整合 | `verify-phase12-compliance` |

## 6. 実行コマンド

```bash
# local
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee outputs/phase-11/verify-phase12-compliance.log
mise exec -- pnpm gate-metadata:validate

# CI
# - .github/workflows/verify-phase12-compliance.yml
# - .github/workflows/verify-gate-metadata.yml
```

## 7. 失敗時の対応

| 失敗パターン | 原因 | 対応 |
|------------|------|-----|
| evidence path 不在 | コマンド未実行 / 配置漏れ | Phase 10 のコマンドを再実行し配置 |
| ファイルサイズ 0 | コマンド失敗 → 空ログ | コマンド実行を再確認、エラー解決後に再生成 |
| artifacts.json schema violation | enum / datetime 形式違反 | Phase 11 §4 の schema 例に揃える |
| canonical 9 headings 不足 | Phase 12 の見出し漏れ | 本ファイル §2 に従い 9 headings を全部配置 |
| evidence_path drift | path 表記揺れ（絶対/相対） | workflow root 相対に統一 |

参照: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 8. 例外規定

- 本 SW は `[実装区分: 実装仕様書]` で `docs-only` 適用なし。よって evidence skip 規定（非 visual alternative evidence 等）は適用されない
- visual baseline が CI artifact のみで管理される運用は採用しない（Phase 9 §2 参照）。コミット必須

## 9. 監査ログ

`outputs/phase-11/verify-phase12-compliance.log` に exit code と検証結果が出力される。`artifacts.json` の `passed_at` フィールドは ISO 8601 で監査タイムスタンプとして残る。

## 10. 関連ドキュメント

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `.github/workflows/verify-phase12-compliance.yml`
- `.github/workflows/verify-gate-metadata.yml`
- `scripts/verify-pr-ready.sh`

## 11. SSOT 宣言

本 Phase 12 ファイルが、本 SW の Phase 11 evidence と Phase 8 DoD の **compliance に関する SSOT** である。`artifacts.json` の内容が本ファイルの検証ルール R-01..R-06 と矛盾する場合、本ファイルが優先する。
