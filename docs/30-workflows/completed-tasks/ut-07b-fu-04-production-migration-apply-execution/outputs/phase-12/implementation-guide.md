# Phase 12 Implementation Guide

## Part 1: 中学生レベル

本番のデータ置き場は、学校で先生が使う大切な出席簿のようなものです。すでに新しい欄が書き足されている出席簿に、同じ欄をもう一度書き足すと、どれが本物かわからなくなります。

今回やることは、もう書き足されたことを確認し、同じ作業を二回しないように記録することです。もし本当に確かめる必要がある場合だけ、先生の許可をもらって中身を見ます。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| D1 | クラウド上の大切な出席簿 |
| migration | 出席簿に新しい欄を足す手順 |
| production | みんなが実際に使う本番の出席簿 |
| preflight | 作業前の確認 |
| post-check | 作業後の確認 |
| redaction | 見せてはいけない文字を隠すこと |
| forward-fix | 間違いを消さず、次の訂正で直すこと |

## Part 2: 技術者レベル

This workflow is an operations verification spec. It does not change `apps/api/migrations/0008_schema_alias_hardening.sql`.

| AC | Evidence |
| --- | --- |
| AC-1 runbook reread | `phase-02.md`, `outputs/phase-02/main.md` |
| AC-2 already-applied verification | `outputs/phase-11/preflight-list.log`（未承認時は placeholder、runtime PASS ではない） |
| AC-3 approval boundary | `outputs/phase-11/user-approval-record.md` |
| AC-4 duplicate apply prohibition | `outputs/phase-11/apply.log` |
| AC-5 post-check contract | `outputs/phase-11/post-check.log`（hardening 2 カラムのみ。未承認時は placeholder） |
| AC-6 redaction | `outputs/phase-11/redaction-checklist.md` |
| AC-7 system spec sync | `outputs/phase-12/system-spec-update-summary.md` |

Runtime verification is blocked until explicit user approval. Duplicate production migration apply is forbidden. `schema_aliases` table and its UNIQUE indexes belong to `0008_create_schema_aliases.sql`, not `0008_schema_alias_hardening.sql`.
