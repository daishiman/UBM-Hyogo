# Implementation Guide

## Part 1: 中学生レベル

学校の校外学習に行く前、先生は「しおりの場所」と「必要な持ち物」を確認します。今回の自動確認も同じです。しおりの場所が古いままだと、困った人が正しい案内にたどり着けません。また、テスト用の合言葉が金庫に入っていないと、自動確認は出発前に止まります。

今回やったことは三つです。まず、古い案内先を今ある正しいしおりに直しました。次に、同じ間違いがまた入らないように、案内先が本当にあるか調べる見回り係を追加しました。最後に、合言葉そのものは人が金庫に入れるものとして分け、値を文書やログに残さないルールを守りました。

| 用語 | 日常語での説明 |
| --- | --- |
| GitHub Actions | 自動で確認作業をしてくれる係 |
| workflow | 確認作業の手順書 |
| secret | 金庫に入れる合言葉 |
| staging | 本番前の練習場所 |
| runbook | 困ったときに見るしおり |
| evidence | 確認した証拠メモ |

## Part 2: 技術者レベル (C12P2-1)

本パートは本タスクで導入した workflow / script / test 構成と、その実行インターフェース・終了コード・シークレット境界を技術的に明示する。プロジェクト構造としては `.github/workflows/`（CI gate 群）、`scripts/ci/`（doc-ref 検証スクリプト本体）、`scripts/ci/__tests__/`（spec）の 3 群が連動し、`docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` 配下の Phase 出力を canonical 参照先とする。

### Implemented Files / API Signature (C12P2-2)

| Path | Change |
| --- | --- |
| `.github/workflows/runtime-smoke-staging.yml` | stale runbook path corrected to the current `completed-tasks/` path |
| `.github/workflows/ci.yml` | actionlint target list includes `verify-workflow-doc-refs.yml` |
| `.github/workflows/verify-workflow-doc-refs.yml` | new CI guard for workflow markdown references |
| `.github/workflows/{incident-runbook-slack-delivery,pr-build-test,pr-target-safety-gate,verify-indexes,verify-test-suffix}.yml` | stale or placeholder docs references made existence-checkable |
| `scripts/ci/verify-workflow-doc-refs.sh` | verifies repository-local `docs/...md` references in workflow YAML files |
| `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | shell test suite for OK, missing, URL, anchor, missing dir, and real repo cases |

### Script Interface / Commands (C12P2-3)

```bash
scripts/ci/verify-workflow-doc-refs.sh [--root <repo-root>] [--workflows <dir>]
```

#### Exit codes / Error Handling (C12P2-4)

| Code | Meaning |
| --- | --- |
| 0 | all checked repository-local doc references exist |
| 1 | one or more checked references are missing |
| 2 | usage or input directory error |

Generated runtime evidence paths under `outputs/phase-11/evidence/` are ignored
because those files are created by workflow runs. External URLs and human input
placeholders are also outside this guard.

### Secret Boundary / Security (C12P2-5)

Provisioning inventory is five secret names:

- `STAGING_API_BASE`
- `STAGING_ADMIN_BEARER`
- `STAGING_MEMBER_ID`
- `STAGING_ME_BEARER`
- `SLACK_WEBHOOK_INCIDENT`

`runtime-smoke-staging.yml` early-fails on the four smoke-body credentials only.
`SLACK_WEBHOOK_INCIDENT` is required by the failure-summary post step and is
guarded there. This preserves the existing workflow boundary while keeping
operator provisioning complete.
