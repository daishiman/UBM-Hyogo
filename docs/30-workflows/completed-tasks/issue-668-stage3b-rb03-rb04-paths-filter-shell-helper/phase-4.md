# Phase 4: テスト設計

| 項目 | 値 |
|------|----|
| 対象 | YAML / bash |
| 既存 unit test | `scripts/coverage-guard.spec.ts` / `scripts/lint-boundaries.spec.ts` 等 |
| 新規 test | なし（YAML / bash の lint + dry-run PR で代替） |

---

## 1. テスト戦略

本タスクは shell + YAML のため、`*.spec.{ts,tsx}` 規約には該当しない。代替として以下の 4 層で品質を担保する。

| layer | tool | 検証内容 |
|-------|------|----------|
| L1 静的解析 | `shellcheck` | bash syntax / SC2086 等 |
| L2 構文解析 | `bash -n` / `actionlint` | shell parse / GitHub Actions schema |
| L3 単体回帰 | 既存 `scripts/coverage-guard.spec.ts` | helper source 化後も既存挙動が保たれる |
| L4 統合 dry-run | dummy PR 2 本 | docs-only / code 両ルートで required check が pass |

---

## 2. L1 shellcheck 期待値

### 対象 glob

```
scripts/**/*.sh
```

### 期待 violation 数

| ファイル | 期待 |
|---------|------|
| `scripts/lib/ci-shell-prelude.sh` | 0（新規実装で violation を出さない） |
| `scripts/coverage-gate-e2e.sh` | 0（refactor 後） |
| `scripts/coverage-guard.sh` | 0（refactor 後） |
| `scripts/cf.sh` 他既存 `.sh` | warning 0 が理想。violation 出現時は本 PR で最小修正 or `# shellcheck disable=SCxxxx` を関数単位で付与し根拠コメント記載 |

### CI assertion

`shellcheck --severity=warning --external-sources <files>` の exit code = 0。

---

## 3. L2 actionlint / bash -n 期待値

### actionlint

ローカル: `actionlint .github/workflows/e2e-tests.yml .github/workflows/lint-shell.yml`（未インストール時は CI runtime evidence で代替）
期待: violation 0。

### bash -n

```bash
bash -n scripts/lib/ci-shell-prelude.sh
bash -n scripts/coverage-gate-e2e.sh
bash -n scripts/coverage-guard.sh
```

期待: 全て exit 0。

---

## 4. L3 既存 unit test 回帰

### `scripts/coverage-guard.spec.ts`

`scripts/coverage-guard.sh` の prelude `source` 化後も既存テストが green であることを確認する。

実行:
```bash
mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts
```

期待:
- 既存 test case 全て pass
- `--changed` モード / merge commit skip / coverage 閾値判定が同一挙動

### `scripts/lint-boundaries.spec.ts` 等

本タスク対象外だが、prelude に副作用がないことの確認のため `pnpm test` が pass することを Phase 7 で確認する。

---

## 5. L4 dry-run PR シナリオ

### シナリオ A: docs-only PR

| 手順 | 期待 |
|------|------|
| `feat/issue-668-rb03-rb04-test-docs` ブランチで `docs/30-workflows/dummy.md` のみ追加 | — |
| PR を `dev` 向けに作成 | — |
| `gh pr checks <PR>` | `e2e-tests-coverage-gate` = `pass`（ 経由） |
| `gh run list --workflow=e2e-tests.yml --branch=feat/issue-668-rb03-rb04-test-docs` | 0 件（起動していない） |
| `gh run list --workflow=e2e-tests.yml --branch=feat/issue-668-rb03-rb04-test-docs` | 1 件 success |

### シナリオ B: code PR

| 手順 | 期待 |
|------|------|
| `feat/issue-668-rb03-rb04-test-code` ブランチで `apps/web/src/dummy.ts` を追加 | — |
| PR を `dev` 向けに作成 | — |
| `gh pr checks <PR>` | `e2e-tests-coverage-gate` = `pass`（`e2e-tests.yml` 経由） |
| `gh run list --workflow=e2e-tests.yml` | 1 件 success |
| `gh run list --workflow=e2e-tests.yml` | 1 件 success |

### シナリオ C: 混在 PR（`apps/web/**` + `docs/**`）

| 手順 | 期待 |
|------|------|
| 両方を含む PR を作成 | — |
| `e2e-tests.yml` 起動 /  不起動（precheck に該当しないため） | required check pass |

> シナリオ A/B/C は実 PR を作る前に `act` （ローカル GitHub Actions runner）または GitHub の "Re-run job" で workflow_dispatch によるエミュレートが可能。本タスクでは Phase 11 で実 PR 検証を正規評価とする。

---

## 6. coverage 回帰の dry-run

`scripts/coverage-gate-e2e.sh` refactor の回帰確認:

```bash
# 79% / 80% / 81% の 3 ケース
for pct in 79 80 81; do
  cat > /tmp/coverage-summary.json <<EOF
{ "total": { "lines": { "pct": ${pct} } } }
EOF
  mkdir -p apps/web/coverage
  cp /tmp/coverage-summary.json apps/web/coverage/
  bash scripts/coverage-gate-e2e.sh
  echo "exit=$? for pct=${pct}"
done
```

期待:
- 79% → exit 1 + `::error::line coverage 79 < 80`
- 80% → exit 0 + `::notice::line coverage 80 >= 80`
- 81% → exit 0

---

## 7. 完了条件

- [x] L1〜L4 全層の検証手順が記述
- [x] dry-run PR の期待値が表で確定
- [x] coverage 79/80/81 の 3 ケース回帰確認手順が記述
- [x] 既存 `coverage-guard.spec.ts` の green 維持が AC として明示
