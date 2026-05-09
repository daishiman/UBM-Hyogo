# Phase 7: AC マトリクス — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 / 13 |
| 入力 | Phase 1 AC-1〜AC-7 / Phase 4 テスト / Phase 6 異常系 |
| 出力 | `outputs/phase-07/main.md`（AC × evidence × test の対応マトリクス） |

## 目的

AC-1〜AC-7 の **全件が evidence path とテストに 1:1 で紐付く**ことを確認し、抜けがないことを保証する。

## マトリクス

| AC | 内容（要約） | evidence path | 紐付くテスト | 異常系 | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | workflow YAML 存在 + workflow_call / workflow_dispatch trigger | `outputs/phase-11/evidence/workflow-run-summary.md` で run id / trigger type を記録 | T-2 actionlint | E-9 reusable workflow call drift | pending |
| AC-2 | staging deploy → smoke → PASS evidence artifact upload (30 日保持) end-to-end | `workflow-run-summary.md` の artifact URL / retention | T-2 + Phase 11 実 run | E-1, E-10 | pending |
| AC-3 | artifact / log / Slack post に secret 実値が含まれない（grep gate 0 hit、base64 偽陰性対策含む） | `outputs/phase-11/evidence/artifact-redaction-grep.log` | T-1 (F-1〜F-5)、T-3 | E-6, E-7, E-12 | pending |
| AC-4 | failure 時のみ Slack 1 通 post、成功時 0 通 | `outputs/phase-11/evidence/slack-failure-injection.md` | T-5 dry-run + Phase 11 failure injection | E-1, E-5 | pending |
| AC-5 | ADR 2 本配置・required check に昇格させない（optional 維持） | `docs/40-architecture/adr/ADR-runtime-smoke-{secret-injection,required-status-check}.md` の存在 + 内容 grep | markdownlint | — | pending |
| AC-6 | Environment-scoped secret のみ参照、production secret と混線なし | `outputs/phase-11/evidence/workflow-run-summary.md` で `gh api .../secrets` の name 列挙 | E-11 検証コマンド | E-11 | pending |
| AC-7 | `::add-mask::` × `set -x` 事故再発防止（grep gate + test fixture） | `outputs/phase-11/evidence/grep-gate.log` | T-3 | E-8 | pending |

## 抜け確認

- ✅ 全 AC に evidence path が紐付け
- ✅ 全 AC にテスト or 異常系シナリオが紐付け
- ✅ Issue #571 §3.3 の 5 件（AC 候補）はすべて AC-1〜AC-7 に吸収済み:
  - 「staging deploy 完了 trigger で smoke 自動実行」→ AC-1, AC-2
  - 「artifact PASS evidence」→ AC-2, AC-3
  - 「grep gate 0 hit」→ AC-3, AC-7
  - 「failure 時 Slack post」→ AC-4
  - 「required check 化 ADR」→ AC-5

## 検証コマンド

```bash
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
for ac in AC-1 AC-2 AC-3 AC-4 AC-5 AC-6 AC-7; do
  grep -q "$ac" "$SPEC_DIR/outputs/phase-07/main.md" || echo "MISSING: $ac"
done
```

## 完了条件（DoD）

- [ ] AC-1〜AC-7 全件が evidence path / テスト / 異常系の少なくとも 1 列に紐付け
- [ ] Issue #571 §3.3 の 5 件 AC 候補が全て AC-1〜AC-7 に吸収されている
- [ ] 紐付け抜けが 0 件
