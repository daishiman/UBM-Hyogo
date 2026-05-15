# Phase 1: 要件定義

## ゴール

新規 D1 migration 追加時に、誰がどの粒度で test を書くかの最低基準を文書として正本化し、`apps/api/migrations/**` 変更を含む PR で自動的にレビュー観点（runbook link）を提示する仕組みを構築する。

## 入力

- `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md`（オリジナル仕様）
- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §4
- `docs/30-workflows/completed-tasks/02b-*` の miniflare D1 integration test 実装
- `.github/workflows/d1-migration-verify.yml`（既存）
- `scripts/d1/__tests__/*.bats`（既存）

## Decision Record: 09b 追記から独立 runbook 化

オリジナル仕様は「09b runbook への追記」を起点にしているが、本仕様は `docs/30-workflows/runbooks/d1-migration-test-guideline.md` を独立正本にする。理由は、D1 migration test の最低基準が release / cron runbook である 09b よりも `apps/api/migrations/**` の恒常的レビュー観点に近く、CI comment / README / bats から単一リンクで再利用する方が重複を減らせるため。

09b は必要に応じて関連リンクのみを持つ。09b 本文に最低基準を重複記載しない。

## 機能要件

- FR-1: 最低基準 3 項目（forward apply green / contract test pass / repository or use-case test 追加 1 件以上）が文書として参照可能
- FR-2: 02b suite が initial schema 専用である責任境界が文書化
- FR-3: 新規 migration を含む PR で runbook link が自動コメントされる
- FR-4: runbook の必須見出しが欠落した場合に CI で fail する

## 非機能要件

- NFR-1: runbook 文書は単独で完結（外部ドキュメントへの過剰参照を避ける）
- NFR-2: CI comment step の追加 cost は < 30 秒（dedicated job ではなく既存 verify job の末尾 step として実装）
- NFR-3: comment は同一 PR で重複しない（既存コメント検知して update or skip）

## 不変条件（プロジェクト）

- D1 直接アクセスは `apps/api` 限定（本タスクは文書 + CI のみ、変更なし）
- 平文 secret コミット禁止
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（本タスクは bats script のため対象外）

## 既存実装の調査結果

| 項目 | 現状 | 判定 |
| ---- | ---- | ---- |
| 09b runbook の test 最低基準セクション | 不在 | 要作成 |
| 02b 責任範囲明記 | 不在 | 要作成 |
| migrations 変更 CI gate | `d1-migration-verify.yml` で bats + staging dry-run 実施済 | 流用可。comment step のみ追加 |
| `apps/api/migrations/README.md` | Phase 5 実行時に `test -f` で実測 | 状況次第で新規 or 追記 |

## 完了条件

- 上記 FR / NFR が網羅された Phase 2 設計書のインプットが揃っていること
- 既存 `d1-migration-verify.yml` の変更方針（既存 step 末尾 vs 新規 job）が決定可能な状態

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 1 |
| status | completed |

## 目的

D1 migration test guideline の要件、境界、既存調査を確定する。

## 実行タスク

- Source follow-up と既存 D1 migration workflow を確認する。
- 独立 runbook 化の decision record を固定する。

## 参照資料

- `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md`
- `.github/workflows/d1-migration-verify.yml`

## 成果物/実行手順

Phase 2 が実装設計へ進める入力をこのファイルに集約する。

## 統合テスト連携

後続 Phase 5/9 で bats presence test と CI workflow static check に接続する。
