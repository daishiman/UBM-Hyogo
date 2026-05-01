# Phase 4: テスト作成（検証コマンド suite）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（docs-only 検証コマンド suite） |
| 前 Phase | 3 (設計レビューゲート) |
| 次 Phase | 5 (実装 / docs sync) |
| 状態 | spec_created |

## 目的

docs-only 改修につき、コードのテストではなく **「Phase 5 の差分が drift 解消条件を満たしたかを再現性高く検証するコマンド suite」** を作成する。
本 Phase 時点では全コマンドが期待値に達していない（TDD RED 相当）ことを記録し、Phase 5 の GREEN 条件として固定する。

## 検証コマンド suite

### T-1: drift 検出（5 workflow 全件列挙）

```bash
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

- 期待結果: 5 workflow の各ファイル名が **すべて 1 件以上ヒット** する。
- Phase 4 時点（RED）: 一部のみヒット（drift 状態）。

### T-2: Discord 通知 0 件 current facts 確認

```bash
grep -iE "discord|webhook|notif" \
  .github/workflows/ci.yml \
  .github/workflows/backend-ci.yml \
  .github/workflows/validate-build.yml \
  .github/workflows/verify-indexes.yml \
  .github/workflows/web-cd.yml
```

- 期待結果: ヒット 0 件（current facts として「通知未配線」を裏付け）。
- Phase 4 時点: SSOT に current facts 記載なし → SSOT 側を Phase 5 で追記する根拠。

### T-3: 旧 path 残存確認

```bash
rg -n "docs/05a-" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails
```

- 期待結果: 0 件（README 等の文脈で必要な場合は明示注記）。
- Phase 4 時点（RED）: 旧 path 参照が残存している箇所を Phase 5 で `docs/30-workflows/completed-tasks/05a-` に置換する。

### T-4: workflow 実体 name 一致確認

```bash
for f in ci backend-ci validate-build verify-indexes web-cd; do
  echo "$f:"
  awk '/^name:/{print}' .github/workflows/$f.yml
done
```

- 期待結果: 5 workflow すべて `name:` 行が出力される。
- 用途: SSOT の display name 列を Phase 5 で書き起こす際の正本ソース。

### T-5: required_status_checks 整合（Phase 11 への連携 fixture）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
```

- 期待結果: SSOT の「required status context」列に列挙する文字列と完全一致。
- Phase 4 ではコマンドの実行可能性のみ確認（出力値は Phase 11 で UT-GOV-001 と差分照合）。

## TDD RED 状態の記録

Phase 5 着手前に以下を満たすことを確認する:

| コマンド | RED 期待状態 |
| --- | --- |
| T-1 | 5 workflow のうち一部のみヒット（drift 残存） |
| T-2 | ヒット 0 件は確認できるが、SSOT に current facts セクションがない |
| T-3 | 旧 `docs/05a-` 参照が 1 件以上残存 |
| T-4 | 出力は得られるが SSOT 側未反映 |
| T-5 | API 応答は得られるが SSOT との照合材料が未整備 |

## 失敗条件 / 中断基準

- T-5 のみ環境依存で `gh` 認証が無効な場合は Phase 11 へスキップ可。それ以外の T-1〜T-4 は本タスク内で必ず実行する。

## 成果物

- `outputs/phase-04/main.md` — 検証コマンド suite と RED 状態のスナップショット
