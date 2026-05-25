---
phase: 12
title: Compliance check — Phase 11 evidence existence validator gate
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 12 — Compliance check（中学生レベル概念説明込み）

[実装区分: 実装仕様書]

## 1. なぜ Phase 12 が必要か（中学生レベル説明）

Phase 11 で「この場所にこのファイルを置く」と決めても、人が忘れて置き忘れると、あとから「ちゃんとやった」と言えなくなる。Phase 12 では「Phase 11 で決めた場所に本当にファイルがあるか」を機械（CI）が自動で確認する。先生が「宿題の写真を出して」と言って、本当に写真があるかチェックするのと同じ。

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

Phase 11 で定義した evidence inventory（15 entry）が物理存在し、`artifacts.json` が gate-metadata zod schema を通過していることを CI で機械検証する。これにより本タスクの DoD（Phase 8）が満たされ、parent root workflow の `VISUAL_RUNTIME_OK` 解除が evidence 裏付き状態になることを gate にする。

## 4. 適用範囲

| 範囲 | 内容 |
|------|------|
| 対象ディレクトリ | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-11/` |
| 対象 evidence | Phase 11 §2.1 ログ 7 件 / §2.2 screenshot 4 件 / §2.3 metadata 4 件 = 計 15 件 |
| 対象 schema | 本 workflow `artifacts.json` および `outputs/phase-11/artifacts.json`（gate-metadata） |
| 対象 gate | `verify-phase12-compliance` / `verify-gate-metadata` |
| 対象 parent | parent `index.md` / `artifacts.json` の `VISUAL_RUNTIME_OK` 整合 |

## 5. 検証ルール

| Rule | 内容 | 検証 |
|------|------|------|
| R-01 | Phase 11 inventory 表の全 15 path が物理存在 | evidence existence validator |
| R-02 | 各ファイルのサイズ > 0 | 同上 |
| R-03 | `artifacts.json` が zod schema を満たす（`status` enum / `passed_at` ISO 8601 / `evidence_path` 相対パス） | `gate-metadata:validate` |
| R-04 | `artifacts.json.gates[].evidence_path` が R-01 の存在チェックリストに含まれる | gate-metadata:validate |
| R-05 | Phase 12 compliance check の canonical 9 headings が `outputs/phase-12/phase12-task-spec-compliance-check.md` に存在 | `verify-phase12-compliance` |
| R-06 | workflow root（`index.md` / `SCOPE.md` 既存）と本タスク Phase 1 の参照整合 | `verify-phase12-compliance` |
| R-07 | parent `index.md` / `artifacts.json` が `VISUAL_RUNTIME_OK` + Gate-B/C `passed` に更新済（M-04 と整合） | 手動 + `grep` |

## 6. 実行コマンド

```bash
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
# local
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee "$WF/outputs/phase-11/verify-phase12-compliance.log"
mise exec -- pnpm gate-metadata:validate

# CI
# - .github/workflows/verify-phase12-compliance.yml
# - .github/workflows/verify-gate-metadata.yml
```

## 7. 失敗時の対応

| 失敗パターン | 原因 | 対応 |
|------------|------|-----|
| evidence path 不在 | コマンド未実行 / 配置漏れ | Phase 10 のコマンドを再実行し配置 |
| ファイルサイズ 0 | コマンド失敗 → 空ログ | エラー解決後に再生成 |
| artifacts.json schema violation | enum / datetime 形式違反 | Phase 11 §4 の schema 例に揃える |
| canonical 9 headings 不足 | 見出し漏れ | 本ファイル §2 の 9 headings を全配置 |
| evidence_path drift | path 表記揺れ | workflow root 相対に統一 |
| parent gate 未解除 | `VISUAL_RUNTIME_PENDING` のまま | Phase 5 §7 の diff を適用し M-04 と整合 |

参照: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 8. 例外規定

- 本タスクは `[実装区分: 実装仕様書]` で `docs-only` 適用なし。よって evidence skip 規定（NON_VISUAL alternative evidence 等）は適用されない。
- staging visual baseline は git にコミット必須（CI artifact のみ管理は不採用 / Phase 9 §2）。
- 認証後 profile / admin の runtime 描画は本タスクスコープ外（未認証 guard 描画で代替）。不足分は Phase 9 §5 のフォロー候補として記録し、未タスク化を本 Phase Task 4 で判定する。

## 9. 監査ログ

`outputs/phase-11/verify-phase12-compliance.log` に exit code と検証結果が出力される。`artifacts.json` の `passed_at` は ISO 8601 で監査タイムスタンプとして残る。`outputs/phase-11/root-gate-release.md`（M-04）が parent gate 解除の監査記録となる。

## 10. 関連ドキュメント

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `.github/workflows/verify-phase12-compliance.yml`
- `.github/workflows/verify-gate-metadata.yml`
- `scripts/verify-pr-ready.sh`
- parent: `docs/30-workflows/ui-prototype-design-system-foundation/{index.md,artifacts.json}`

## 11. SSOT 宣言

本 Phase 12 ファイルが、本タスクの Phase 11 evidence と Phase 8 DoD の **compliance に関する SSOT** である。`artifacts.json` の内容が本ファイルの検証ルール R-01..R-07 と矛盾する場合、本ファイルが優先する。
