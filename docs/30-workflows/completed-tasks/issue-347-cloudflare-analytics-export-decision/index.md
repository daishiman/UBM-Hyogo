# issue-347-cloudflare-analytics-export-decision — タスク仕様書 index

[実装区分: ドキュメントのみ仕様書]

判定根拠: 本タスクの目的は「Cloudflare Analytics 長期保存 export 方式の確定」であり、達成物は (1) 採用する export 方式・保存先・retention の正本決定、(2) 取得指標の集計値限定ルール、(3) PII 非保存ルール、(4) aiworkflow-requirements への導線追加、(5) 取得サンプル 1 回の保存、の 5 点。すべて Markdown ドキュメント・evidence ファイル配置・参照導線追加で完結し、`apps/api` / `apps/web` / `scripts/**` / `.github/workflows/**` への code change は伴わない。CONST_004 の docs-only 例外条件（純粋にドキュメント・調査・合意形成で完結）を満たす。後続でログ取得を自動化する場合は実装仕様書として別タスクで切り出すこととし、本サイクルでは方式確定までで完了させる（CONST_007 の「先送り」ではなく、自動化は本タスク完了後に発生する独立スコープのため別タスクが妥当）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-347-cloudflare-analytics-export-decision |
| ディレクトリ | docs/30-workflows/issue-347-cloudflare-analytics-export-decision |
| Issue | #347（CLOSED のまま再 open しない。`Refs #347` で参照） |
| 発見元 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md |
| 関連 unassigned-task spec | docs/30-workflows/unassigned-task/task-09c-cloudflare-analytics-export-001.md |
| Wave | 09c follow-up（post-release evidence formalization） |
| 実行種別 | sequential |
| 作成日 | 2026-05-04 |
| 担当 | release ops owner |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| 優先度 | 低 |
| 規模 | 小規模 |

## purpose

09c が扱う 24h post-release verification の範囲外に置かれていた「Cloudflare Analytics の長期保存形式」を一意に決定し、保存先・retention・取得指標粒度・PII 非保存ルールを正本化する。Cloudflare Free plan の制約内で、1 週間後・1 か月後の比較・postmortem 根拠として再利用できる証跡形態を確立する。

## scope in / out

### scope in

- Cloudflare Free plan で利用可能な analytics 取得手段（GraphQL Analytics API / dashboard 手動 CSV / dashboard screenshot）の比較と採用決定
- 採用 export 方式・保存先・retention（保持期間）の正本記述
- 取得指標の集計粒度限定（4 metric groups / 5 scalar values: req/day, error rate, D1 reads/writes, cron/event volume）
- PII 非保存ルール（URL query, request body, user data 除外）
- evidence contract と representative schema sample の配置、runtime 取得時の PII 不在確認手順
- aiworkflow-requirements の deployment-cloudflare 系参照への導線追加

### scope out

- 自動化スクリプト・CI workflow の追加（Free plan 制約検証後に独立タスクで起票）
- 有料 Logpush 等 Free plan 外機能の採用
- PII を含むログ収集
- branch protection / Cloudflare Secrets 設定変更
- 09c workflow root の state 書き換え（spec_created を維持）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 09c-serial-production-deploy-and-post-release-verification | 24h evidence 範囲外として残された未タスクの formalize |
| 必須参照 | docs/30-workflows/unassigned-task/task-09c-cloudflare-analytics-export-001.md | 元 unassigned-task spec |
| 必須参照 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | deployment 正本 |
| 必須参照 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | OpenNext Workers 正本 |
| 外部制約 | Cloudflare Free plan limits | 採用条件（無料枠内のみ） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-09c-cloudflare-analytics-export-001.md | 元仕様 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md | 発見元 phase-12 出力 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | aiworkflow-requirements 反映先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | aiworkflow-requirements 反映先 |
| 参考 | https://developers.cloudflare.com/analytics/graphql-api/ | GraphQL Analytics API 公式 |
| 参考 | https://developers.cloudflare.com/d1/observability/metrics-analytics/ | D1 metrics 公式 |

## AC（Acceptance Criteria）

- AC-1: 採用する export 方式が「GraphQL Analytics API」「dashboard 手動 CSV」「dashboard screenshot」のいずれか 1 つに確定し、本ディレクトリの `outputs/phase-02/decision-matrix.md` で他案を MINOR / MAJOR / REJECT で判定済み。
- AC-2: 保存先パスが `docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/` または後続 ops evidence 専用ディレクトリのいずれか 1 つに正本化され、`outputs/phase-05/storage-policy.md` に記述されている。
- AC-3: retention（保持期間）が「直近 N 件」または「N か月」のいずれか 1 つで定義され、超過分の取扱（破棄 / archive）が記述されている。
- AC-4: 取得指標が 4 metric groups / 5 scalar values（req/day・error rate・D1 reads/writes・cron/event volume）に限定されることが記述され、URL query / request body / user-identifiable data を保存しないルールが明文化されている。
- AC-5: Cloudflare Free plan の制約（GraphQL Analytics API 利用可否・retention 上限・rate limit）が `outputs/phase-09/free-plan-constraints.md` で明示確認されている。
- AC-6: `outputs/phase-11/evidence/sample-export/` に representative schema sample と redaction-check が保存され、runtime sample 取得時に同じ schema / redaction command で置換できる evidence contract が確認されている。
- AC-7: aiworkflow-requirements の deployment-cloudflare 系 reference に本ディレクトリへの導線（リンク 1 行）が追加され、`outputs/phase-12/system-spec-update-summary.md` に diff 計画が記載されている。
- AC-8: 09c workflow root の state は `spec_created` のまま据え置かれ、Phase 12 close-out で `completed` へ昇格しない（docs-only ルール）。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点・AC-1〜8・artifacts.json metadata 確定（taskType=docs-only / visualEvidence=NON_VISUAL） |
| 2 | 設計 | phase-02.md | 3 候補（GraphQL API / 手動 CSV / screenshot）の decision matrix と推奨案 |
| 3 | 設計レビュー | phase-03.md | 採用案を Free plan 制約 / PII 観点 / 運用継続性で PASS / MINOR / MAJOR 判定 |
| 4 | テスト戦略 | phase-04.md | docs-only のため grep / 文書整合検証マトリクス |
| 5 | 保存ポリシー定義 | phase-05.md | 保存先・retention・命名規則 |
| 6 | 異常系・PII 検証 | phase-06.md | PII 混入時の検出手順・redaction ルール |
| 7 | 統合検証 | phase-07.md | 09c phase-12 unassigned-task-detection との整合確認 |
| 8 | 運用負荷評価 | phase-08.md | 取得頻度・所要時間・担当 |
| 9 | Free plan 制約確認 | phase-09.md | API quota / retention 上限 / rate limit |
| 10 | リリース準備 | phase-10.md | 09c spec_created 据え置きと aiworkflow-requirements 同期順序 |
| 11 | 実測 evidence | phase-11.md | NON_VISUAL: 採用方式での取得サンプル 1 回 + redaction-check |
| 12 | ドキュメント・未タスク・スキルフィードバック | phase-12.md | implementation-guide / aiworkflow 同期 / 未タスク / skill feedback / compliance |
| 13 | PR 作成 | phase-13.md | approval gate / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/decision-matrix.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-05/main.md
outputs/phase-05/storage-policy.md
outputs/phase-06/main.md
outputs/phase-06/redaction-rules.md
outputs/phase-07/main.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/free-plan-constraints.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json
outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.redaction-check.md
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Analytics 取得 | Cloudflare GraphQL Analytics API（候補） | dashboard / API | Free plan 範囲内のみ採用 |
| 保存先 | docs/30-workflows/.../outputs/phase-11/ または ops evidence dir | repo 内 | PII 非保存 |
| Secrets | （新規導入なし） | — | 公開情報のみ |

## invariants touched

- なし（コード変更なし。docs-only。aiworkflow-requirements の参照導線追加のみ）

## completion definition

- Phase 1〜10 が completed
- Phase 11 で representative schema sample と redaction-check が保存され、runtime sample 取得時の evidence contract が PASS
- AC-1〜8 が Phase 7 で完全トレース
- aiworkflow-requirements への導線追加 diff 計画が Phase 12 で記述
- 09c workflow root の state は `spec_created` のまま据え置き
- Phase 13 で user 承認後に PR 作成

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 13 phase 仕様書と outputs 実体整備済み、Phase 13 user approval gate 未通過 | 不可 |
| decided | export 方式 / 保存先 / retention / PII ルールが Phase 5/9 で確定 | 不可 |
| sample_captured | Phase 11 で取得サンプル + redaction-check 取得済み | 不可 |
| documented | Phase 12 で aiworkflow-requirements 同期 diff 計画完了 | 不可 |
| completed | documented + Phase 13 user approval gate 完了 | 可 |

## 実行モード

sequential。docs-only のため code change は発生せず、決定 → 保存ポリシー → サンプル取得 → 文書同期 の順序で進める。
