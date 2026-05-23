# Phase 7: AC マトリクス

## AC × verify × evidence × 不変条件 trace

| AC | 内容 | verify 手段 | evidence パス | 不変条件 trace |
| --- | --- | --- | --- | --- |
| AC-1 | 追跡 repo / キーワード / 頻度固定 | `outputs/phase-02/main.md` 読込で 3 repo / 6 キーワード / 月次 trigger 確認 | `outputs/phase-02/main.md` | aiworkflow-requirements 不変 |
| AC-2 | 直近 release を実 triage | `gh api repos/{owner}/{repo}/releases` 実行ログ + triage 表 | `outputs/phase-11/evidence/{workers-sdk,undici,workerd}-releases.json` + `triage-table.md` | #5 D1 不変 |
| AC-3 | 改善なし時 package.json 未変更 | `git status apps/api/package.json` 出力（変更行 0） | `outputs/phase-11/evidence/pkg-unchanged.log` | #5 D1 不変 / CONST_002 |
| AC-4 | 改善あり時 A/B evidence で 133/133 PASS / 0 EADDRNOTAVAIL | 連続 3 回 vitest 実行ログ + 集計 | `outputs/phase-11/evidence/ab-{N}-run-{1,2,3}.log` + `ab-summary.md` | aiworkflow-requirements 不変 |
| AC-5 | secret hygiene 0 件 | `grep -rE "ghp_\|cf_\|CLOUDFLARE_API_TOKEN" outputs/phase-11/evidence/` 結果 0 | `outputs/phase-11/evidence/secret-hygiene-grep.log` | CONST_002 |
| AC-6 | apps/api ロジック / D1 schema 不変 | `git diff --stat apps/api/src apps/api/migrations` 出力 0 | `outputs/phase-11/evidence/apps-api-untouched.log` | #5 D1 不変 |

## 改善検知の場合分けマトリクス

| 状況 | 必須 evidence | 充足 AC |
| --- | --- | --- |
| 改善なし | triage-table.md / pkg-unchanged.log / secret-hygiene-grep.log / apps-api-untouched.log | AC-1, AC-2, AC-3, AC-5, AC-6 |
| 改善あり + 採用可 | 上記 + ab-{N}-run-{1,2,3}.log × 候補数 + ab-summary.md | AC-1, AC-2, AC-4, AC-5, AC-6 |
| 改善あり + 全候補不採用 | 上記 + ab-summary.md（不採用根拠 / 維持決定） | AC-1, AC-2, AC-3, AC-4(部分), AC-5, AC-6 |

## 不変条件 trace 総括

| 不変条件 | 検証パス |
| --- | --- |
| #5 D1 直接アクセス禁止 | AC-3 / AC-6（package.json scripts のみ編集対象 / src・migrations 不変） |
| CONST_002 commit/push/PR 禁止（user 指示前） | Phase 13 で user 承認 evidence |
| CONST_007 先送り禁止 | Phase 1 / Phase 12 で明記、改善検知時は今回サイクルで A/B 完了 |
| aiworkflow-requirements | Cloudflare runtime / Workers binding 仕様変更なし |

## ギャップ確認

- すべての AC に対応 evidence パスが定義済み
- 場合分け 3 パターンすべてに必須 evidence が紐づく
- 不変条件 trace に未確認項目なし

## 次フェーズへの引き継ぎ事項

Phase 8 で triage 表 / A/B 結果記録の DRY テンプレを定義する。
