# Phase 2: 影響範囲 / スコープ境界 / 参照仕様

> Issue #255 は CLOSED。本ワークフローは実装仕様書のみを生成する。

## 2.1 変更対象ファイル（CONST_005）

| 区分 | パス | 操作 | 役割 |
| --- | --- | --- | --- |
| 新規 | `scripts/coverage-threshold-lint.ts` | add | lint 本体 |
| 新規 | `scripts/__tests__/coverage-threshold-lint.spec.ts` | add | vitest（CLAUDE.md 不変条件 #8 で `.spec.ts` 必須） |
| 新規 | `.github/workflows/coverage-threshold-lint.yml` | add | CI gate（独立 workflow） |
| 編集 | `package.json` | edit | `scripts."lint:coverage-threshold"` を追加 |
| 編集 | `docs/30-workflows/issue-255-coverage-threshold-sync-lint/index.md` | edit | runbook 対応表（既記載） |

## 2.2 参照（read-only）ファイル

| パス | 役割 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | 正本 / coverage 表の数値抽出元 |
| `scripts/coverage-guard.sh` | 実行設定 1 / `^THRESHOLD=` 抽出元 |
| `codecov.yml` | 実行設定 2 / 任意 / 存在時のみ抽出 |

これらは本タスクで**書き換えない**。

## 2.3 スコープに含まないもの

| 事象 | 理由 |
| --- | --- |
| `quality-requirements-advanced.md` への YAML frontmatter 追加 / Anchor 埋め込み | 正本側を構造化するとレビュー範囲が広がる。lint 側で行 anchor の正規表現で吸収する |
| `scripts/coverage-guard.sh` の挙動変更 | issue-255 は drift 検知のみ。閾値ロジックは現状維持 |
| Codecov SaaS の課金プラン / 導入意思決定 | 別タスク。本 lint は `codecov.yml` 出現時の動的拡張で吸収 |
| 閾値値そのものの変更（80 → 70 等） | 別タスク。drift 検知だけが本タスクの責務 |
| `apps/web` / `apps/api` / `packages/*` の coverage 計測ロジック変更 | 無関係 |
| `apps/api` の D1 直接アクセス境界（CLAUDE.md 不変条件 #5） | 本タスクと無関係（影響なしを明示） |

## 2.4 既存システムとの境界

| 境界 | 影響 |
| --- | --- |
| `coverage-guard.sh` の `--changed` モード / shard モード | 影響なし。lint は read-only |
| lefthook pre-push `coverage-guard` | 影響なし。lint は pre-push でなく CI で実行 |
| GitHub Actions `verify-test-suffix` | 影響あり。新規 `.spec.ts` は許容パターンなので pass |
| GitHub Actions `verify-indexes-up-to-date` | 影響あり。skill index 更新が必要な場合は `pnpm indexes:rebuild` を Phase 12 で実施 |
| `verify-phase12-compliance` | 影響あり。本 workflow root の strict 7 を生成 |

## 2.5 ブランチと PR base

| 項目 | 値 |
| --- | --- |
| 作業ブランチ | `feat/issue-255-coverage-threshold-sync-lint` |
| baseRef | `origin/dev` |
| 想定 PR base | `dev`（main 直 PR は禁止 / CLAUDE.md ブランチ戦略） |
| Issue handling | `Refs #255`（reopen しない） |

## 2.6 参照仕様（正本順位）

1. `docs/30-workflows/issue-255-coverage-threshold-sync-lint/index.md`（本ワークフローの正本）
2. `docs/30-workflows/issues/issue-255.md`（issue 本体）
3. `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md`（元タスク指示書 / consumed trace）
4. `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`（coverage 閾値の SSOT）
5. CLAUDE.md（不変条件 #5 / #8 / ブランチ戦略）

衝突時は上位を優先する。
