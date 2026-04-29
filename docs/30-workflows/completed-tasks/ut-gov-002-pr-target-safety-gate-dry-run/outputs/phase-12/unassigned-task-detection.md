# Phase 12: 未割当タスク検出 (unassigned-task-detection)

本タスク (UT-GOV-002) は `docs-only` / `spec_created` のため、実装行為は意図的に scope 外。
完了後に発生する未タスクを以下に列挙する。**0 件でも出力必須**だが、本タスクでは 4 件検出。

## サマリー

| ID 案 | 配置先 | 起票方針 | 優先度 |
| --- | --- | --- | --- |
| U-1 | UT-GOV-002-IMPL-pr-target-safety-gate | `docs/30-workflows/unassigned-task/UT-GOV-002-IMPL-pr-target-safety-gate.md` | high |
| U-2 | UT-GOV-002-SEC-security-review-apply | `docs/30-workflows/unassigned-task/UT-GOV-002-SEC-security-review-apply.md` | high |
| U-3 | UT-GOV-002-OBS-secrets-inventory-automation | `docs/30-workflows/unassigned-task/UT-GOV-002-OBS-secrets-inventory-automation.md` | medium |
| U-4 | UT-GOV-002-EVAL-oidc-and-workflow-run | `docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md` | medium |

## 詳細

### U-1: UT-GOV-002-IMPL（実 workflow 編集と dry-run 実走）

| 項目 | 内容 |
| --- | --- |
| 種別 | implementation（`docs-only` ではない） |
| visualEvidence | VISUAL（GitHub Actions UI / branch protection の設定画面） |
| 入力 | 本タスク `outputs/phase-2/design.md`, `outputs/phase-5/runbook.md`, `outputs/phase-4/test-matrix.md` |
| 苦戦予想 | required status checks の job 名同期、fork PR からの実行有無の判別、`workflow_run` 採用可否 |
| リスクと緩和 | (a) safety gate 導入で既存 triage が break → 単一コミット粒度で revert（AC-9）/ (b) secrets 露出 → secrets rotate runbook を別タスクで先行整備 |
| 検証方法 | actionlint / fork PR labeled trigger / scheduled trigger の 3 経路で smoke |
| スコープ | `.github/workflows/pr-target-safety-gate.yml` の追加と既存 triage workflow の境界調整のみ。secrets rotate / OIDC 化は含まない |

### U-2: UT-GOV-002-SEC（security review 本適用）

| 項目 | 内容 |
| --- | --- |
| 種別 | review-only |
| visualEvidence | NON_VISUAL（review コメントの Markdown のみ） |
| 入力 | 本タスク `outputs/phase-3/review.md`, `outputs/phase-9/quality-gate.md` |
| 苦戦予想 | pwn request 非該当の判断根拠を、後続 IMPL の実 workflow に対して再評価する必要 |
| リスクと緩和 | review 時点で AC-4 の根拠が劣化していた場合、IMPL タスクへ手戻り |
| 検証方法 | GitHub Security Lab pwn request 解説の 5 観点と diff を突き合わせ |
| スコープ | review 記録の追加。実 workflow 編集は U-1 で完結 |

### U-3: UT-GOV-002-OBS（secrets 棚卸し自動化）

| 項目 | 内容 |
| --- | --- |
| 種別 | observability / governance |
| visualEvidence | NON_VISUAL |
| 入力 | 本タスク `outputs/phase-6/failure-cases.md`（secrets 露出ケース） |
| 苦戦予想 | Cloudflare Secrets / GitHub Secrets / GitHub Variables の 3 系統横断 |
| リスクと緩和 | 自動化スクリプトが secrets 値を log に流す事故 → dry-run mode 必須 |
| 検証方法 | 1Password 参照のみで動作するかを scripts/with-env.sh 経由で確認 |
| スコープ | 棚卸し列挙ロジックのみ。rotate の自動化は含まない |

### U-4: UT-GOV-002-EVAL（OIDC 化と `workflow_run` 採用評価）

| 項目 | 内容 |
| --- | --- |
| 種別 | evaluation / spike |
| visualEvidence | NON_VISUAL |
| 入力 | 本タスク Decision Log（`workflow_run` 採用は将来検討と記録） |
| 苦戦予想 | Cloudflare 側 audience 検証の追加要件 |
| リスクと緩和 | OIDC 化が現状の secrets binding を上回る価値を提供するかは不確実 → 評価のみで実装は scope 外 |
| 検証方法 | Decision matrix（コスト / 攻撃面削減効果 / 実装負荷）を出力 |
| スコープ | 評価 doc の作成のみ |

## 起票方針

- 4 件すべて **未タスク台帳ファイルとして本レビューで作成済み**。
- 起票形式: `docs/30-workflows/unassigned-task/UT-GOV-002-{IMPL,SEC,OBS,EVAL}-*.md` を 1 ファイルずつ作成し、後続でフルワークフロー（Phase 1-13）へ昇格させる。
- 実行順序: U-1 を先行し、U-2 は U-1 の実 workflow 差分を input としてレビューする。U-3 / U-4 は次 Wave でよいが、`workflow_run` 採用時は U-4 を high に再分類する。

## 必須セクション（将来タスクファイルが備えるべきもの）

各未タスクファイルには以下を必ず含める:

1. 苦戦ポイント（Phase 4-6 で発生しやすい論点）
2. リスクと緩和策
3. 検証方法（actionlint / yq / gh / fork PR トリガ等）
4. スコープ（含む / 含まない）
5. 上流タスクへの参照（本タスクの outputs パス）
