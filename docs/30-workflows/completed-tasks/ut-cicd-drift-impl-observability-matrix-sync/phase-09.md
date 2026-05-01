# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |

## 目的

Phase 5 で更新した SSOT (observability-matrix.md) と Phase 8 で整理した
記述が、line budget / link 有効性 / mirror parity / AC 全件の品質基準を
満たすことを確認する。docs-only スコープのため CI ジョブは新規追加しない。

## line budget 確認

```bash
wc -l docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

| 指標 | 基準 | 期待 |
| --- | --- | --- |
| 全体行数 | 200 行を大きく超えないこと（+30% = 260 行 を上限ガイド） | ≤ 260 行 |
| 追加行数 | Phase 5 で増えた行数を `git diff --stat` で集計 | 50〜100 行程度 |

```bash
# 追加行数の集計（base は本タスク開始時点の commit）
git diff --stat origin/main -- \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

行数が上限ガイドを超える場合は、4 列分離 mapping 表を SSOT に集約し、
環境別表は workflow 名のみの参照に切り詰めることで圧縮する。

## link 有効性

```bash
# 文書内の markdown link を列挙
rg -n "\]\(([^)]+)\)" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

各 link について以下のいずれかであることを目視確認する。

1. リポジトリ内の既存ファイル相対 path（`ls` で存在確認）
2. `.github/workflows/<name>.yml` への参照（実体 5 本のいずれか）
3. 外部 URL（GitHub Docs / Cloudflare Docs 等）

## mirror parity

本タスクの SSOT は `docs/30-workflows/` 配下のため、`.claude/` / `.agents/`
mirror への影響はない。以下を確認するコマンドで「mirror に意図せず影響していない」
ことを担保する。

```bash
git diff --name-only origin/main \
  | rg "^\.claude/|^\.agents/" || echo "mirror への変更なし"
```

→ 期待出力: `mirror への変更なし`

## AC 全件再確認

| AC | 検証コマンド | 合格条件 |
| --- | --- | --- |
| AC-1: 5 workflow 全件列挙 | `rg -c "ci\.yml\|backend-ci\.yml\|validate-build\.yml\|verify-indexes\.yml\|web-cd\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 出力 ≥ 5 |
| AC-2: trigger / job 構造記述 | 4 列分離 mapping 表に `workflow / display / job id / context` 列が揃うことを目視 + `rg -n "job id" outputs/phase-02/observability-matrix.md` | mapping 表 1 セクションが存在 |
| AC-3: Discord 通知注記 | `grep -c "Discord 通知" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | ≥ 1 |
| AC-4: documentation-changelog 同期記録 | Phase 12 で `documentation-changelog.md` への追記を確認 | 本 Phase ではスコープ外（後段で確認） |
| AC-5: 4 列分離 mapping 表 | `rg -n "workflow.*display.*job.*context" outputs/phase-02/observability-matrix.md` | mapping 表のヘッダ行が 1 行ヒット |

### AC-1 補足コマンド

```bash
rg -c "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

### AC-3 補足コマンド

```bash
grep -c "Discord 通知" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | AC 全件が grep / rg で機械的に再判定可能 |
| 実現性 | 全コマンドが ripgrep + grep + git のみで完結 |
| 整合性 | mirror parity と line budget が docs-only タスクの逸脱を防止 |
| 運用性 | 同種 docs タスクの QA template として再利用可能 |

## 成果物

- `outputs/phase-09/main.md` — 各検証コマンドの実行ログ / AC 判定マトリクス
