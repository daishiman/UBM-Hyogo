# 05b-parallel-smoke-readiness-and-handoff - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | smoke-readiness-and-handoff |
| ディレクトリ | docs/05b-parallel-smoke-readiness-and-handoff |
| Wave | 5 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | handoff |
| 状態 | spec_created |
| タスク種別 | spec_created |

## 目的

実装着手前の最終ゲートとして、infra readiness、rollback、handoff、未タスク formalize を閉じる。Pages / Workers / D1 / Sheets / CI/CD / branch strategy を人が説明して迷わない状態を作る。

## スコープ

### 含む
- readiness checklist
- handoff document
- rollback / incident entrypoint
- unassigned task formalize

### 含まない
- 機能実装そのもの
- 本番ユーザーデータでの E2E
- 通知配信本番送信

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | この task 開始前に必要 |
| 下流 | 実装フェーズ | この task の成果物を参照 |
| 並列 | 05a-parallel-observability-and-cost-guardrails | 同 Wave で独立着手し、Phase 10-12 で同期する |

注記: `05a` 完了待ちで開始するのではなく、Wave 5 では並列着手する。`05a` の証跡は downstream deployment 前の same-wave sync input として扱い、`05b` の docs-only close-out 自体の開始 blocker にはしない。

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api/data boundary |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | handoff / unassigned |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | same-wave sync |

## 受入条件 (AC)

- AC-1: readiness checklist が complete である
- AC-2: rollback / break-glass / incident entrypoint が一枚で見える
- AC-3: 未解決事項が unassigned task として formalize される
- AC-4: 実装担当が local / dev / main の違いを迷わない
- AC-5: 価値性 / 実現性 / 整合性 / 運用性の最終判定が PASS である

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/readiness-definition.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | セットアップ実行 | phase-05.md | completed | outputs/phase-05/handoff-checklist.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/final-readiness-gate.md |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/implementation-guide.md |
| 13 | PR作成 | phase-13.md | approval_required | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/readiness-definition.md | 着手可否の定義 |
| ドキュメント | outputs/phase-05/handoff-checklist.md | handoff checklist |
| ドキュメント | outputs/phase-10/final-readiness-gate.md | final gate |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare | web/api/db runtime | 無料枠 |
| GitHub | repo / CI / environments | 無料 |
| Google Sheets | input source | 無料 |

## Secrets 一覧（このタスクで導入）

なし。初期仕様 task のため、新規 secret は導入しない。

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 成果物命名方針

`outputs/phase-XX/main.md` はテンプレート上の既定成果物名である。Phase 2 / 5 / 10 / 11 / 12 は handoff 用の個別成果物名を正本とし、`artifacts.json` でも個別成果物を参照する。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- Legacy snapshot: 未作成（必要なら別 archive task で作成）
