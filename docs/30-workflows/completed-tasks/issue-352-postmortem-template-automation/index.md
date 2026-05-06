# issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| owner | - |
| 状態 | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| visualEvidenceClass | NON_VISUAL |
| priority | low |
| 規模 | small |
| 作成日 | 2026-05-05 |
| GitHub Issue | #352 |
| dependency order | 09c-serial-production-deploy-and-post-release-verification → **本タスク** |
| invariants touched | - |
| artifact ledger | root `artifacts.json` + `outputs/artifacts.json` parity（実体配置済み） |

## purpose

incident / rollback 発生時に、production 担当者が **同じ品質の postmortem を blame なしで一定時間内に書き起こせる** 自動生成手順を整備する。

09c Phase 11 evidence（`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/`）と release metadata（release tag / commit / rollback evidence）を入力に、Node.js スクリプトで markdown postmortem を生成する。

template 見出しは「timeline / impact / root cause / detection / response / prevention / follow-up issues」に限定し、blame 表現を構造的に排除する。incident response runbook 本文の置換は行わず、本タスクは postmortem 生成「のみ」を担う。

## why this is not a restored old task

本タスクは過去タスクの復活ではない。
09c Phase 12 の `outputs/phase-12/unassigned-task-detection.md` で「Postmortem template automation. — Future task after first incident exercise.」として識別された未割当タスクであり、`docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` に登録されたものを、本タスクで初めて正式な実装仕様書に昇格させる。GitHub Issue #352 が単一の正本トラッカーとなる。

## scope in / scope out

### Scope In

- Node.js スクリプト `scripts/postmortem/generate-postmortem.ts` 新規作成（CLI / pure 関数 `generatePostmortem(input)` の二層）
- markdown テンプレート `docs/30-workflows/runbooks/postmortem/template.md` 新規作成（固定見出し）
- 運用 runbook `docs/30-workflows/runbooks/postmortem/README.md` 新規作成（実行手順 / follow-up issue 作成ルール）
- pnpm スクリプト統合: `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <path> --rollback-evidence <path> --out <path>`
- 09c Phase 11 evidence path を **必須入力**として参照（欠落時はエラー終了 / exit code 非 0）
- 入力検証（release tag 形式 / commit sha 形式 / evidence path 実在チェック）
- unit test（generatePostmortem 関数の決定論的出力 / 必須入力欠落時の例外）
- follow-up issue 作成ルール（gh CLI スニペット）の文書化

### Scope Out

- incident response runbook 本文の置換・編集（既存 runbook はそのまま）
- Slack 通知連携（task-09c-incident-runbook-slack-delivery-001 の責務）
- GitHub Releases 自動生成（task-09c-github-release-tag-automation-001 の責務）
- postmortem 内容の AI 生成（root cause の自動推論等は行わない・人が記入する空欄を残す方針）
- 09c Phase 11 evidence 構造の変更（読み取りのみ）
- 1 サイクル外への先送り前提のスコープ分割（CONST_007 遵守）

## dependencies

### Depends On

- 09c-serial-production-deploy-and-post-release-verification（Phase 11 evidence path / Phase 6 rollback procedures）

### Blocks

- なし（運用補助タスクのため、後続実装タスクをブロックしない）

## refs

- GitHub Issue: #352
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md（rollback 4 種）
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md（manual evidence）
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/（evidence path の実体）
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md（本タスクの発見元）
- docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md（旧 unassigned 登録）
- scripts/cf.sh（rollback 実行ラッパー / 参照のみ）
- scripts/coverage-guard.sh（既存 Node.js 系 script の構成参考）
- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/phase-template-phase1.md

## AC（受入条件サマリ）

- AC-1: `pnpm postmortem:generate --release v0.0.0 --commit <sha> --evidence <path> --rollback-evidence <path> --out <out>` が exit code 0 で markdown を出力する。
- AC-2: 出力された markdown には timeline / impact / detection / response / root cause / prevention / follow-up issues の 7 見出しが順序通り含まれる。
- AC-3: 出力された markdown に **blame 表現（人名・"〇〇 が悪い" 等の責任帰属表現）が含まれない**。テンプレ・スクリプトともに blame 列を生成しない。
- AC-4: `--evidence` で指定された 09c Phase 11 evidence path が存在しない場合、exit code 非 0 + stderr にエラー理由を出力する。
- AC-5: `--release` / `--commit` の形式バリデーション（release は `v\d+\.\d+\.\d+` / commit は 40 桁 hex を緩めた `[0-9a-f]{7,40}`）が機能し、不正値は exit code 非 0 で拒否される。
- AC-6: `generatePostmortem(input)` 関数は副作用なしで markdown 文字列を返す pure 関数として unit test 可能。
- AC-7: 同一入力で 2 回実行した結果が完全一致する（冪等性 / タイムスタンプ等の非決定要素は input から渡す）。
- AC-8: runbook README に follow-up issue 作成手順（`gh issue create` テンプレ）が記載される。
- AC-9: `docs/30-workflows/runbooks/postmortem/README.md` から incident response runbook 本文への参照リンクはあっても、本文置換は行わない（grep gate で確認）。
- AC-10: ユニット line 80%+ / branch 60%+、結合は CLI smoke 1 件以上で合格。

## 苦戦箇所（仕様書全 phase に転記）

- **S1: blame 表現禁止** — テンプレ見出しに "誰が" 列を作らない。スクリプト出力にも個人名 placeholder を入れない。レビュー観点に grep gate（人名候補・"責任" "blame" "fault" 等）を含める。
- **S2: evidence link 必須** — 09c Phase 11 evidence path を必須入力とし、欠落時は明示的に失敗する。リンクが切れた markdown を生成して "後で誰かが書く" 状態を作らない。
- **S3: runbook 責務分離** — 既存 incident response runbook 本文を置換しない。本タスクは「postmortem 生成」のみで、「incident 対応手順」「Slack 通知」は別タスク（task-09c-incident-runbook-slack-delivery-001 等）の責務。
- **S4: 自動生成の冪等性** — 同一入力 → 同一出力。`Date.now()` 等の非決定要素はスクリプト内で参照しない（時刻も `--occurred-at` のような明示入力で受ける）。
- **S5: pnpm スクリプト統合** — `package.json` の `scripts.postmortem:generate` を追加し、CLI エントリを `node --experimental-strip-types scripts/postmortem/generate-postmortem.ts` で叩けるようにする。Node 24 / pnpm 10 / mise 経由前提を README で明示。`tsx` は現 worktree の esbuild host/binary mismatch により本CLIのrunnerに使わない。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-09/coverage-summary.md
- outputs/phase-09/grep-result.txt
- outputs/phase-09/secret-hygiene.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/script-execution.md
- outputs/phase-11/template-headings-grep.md
- outputs/phase-11/blame-vocabulary-check.md
- outputs/phase-11/idempotency-check.md
- outputs/phase-11/redaction-check.md
- outputs/phase-11/rollback-evidence-warning.md
- outputs/artifacts.json
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md
- outputs/phase-13/change-summary.md
- outputs/phase-13/local-check-result.md
- outputs/phase-13/pr-creation-result.md
- outputs/phase-13/pr-info.md

## invariants touched

- なし（運用ツール / docs 追加が中心。`apps/api` `apps/web` の不変条件には触れない）

## completion definition

`scripts/postmortem/generate-postmortem.ts` / template.md / README.md が存在し、`pnpm postmortem:generate` が決定論的に markdown を生成する。AC-1..AC-10 を満たし、unit test が green。実装本体は local branch に反映済み。staging deploy は不要（運用ツールのため）。commit / push / PR 作成はユーザー承認後に Phase 13 で実行する。
