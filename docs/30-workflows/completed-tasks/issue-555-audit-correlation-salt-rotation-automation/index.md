# タスク仕様書: Issue #555 — AUDIT_CORRELATION_SALT rotation 自動化と fingerprintVersion=2 移行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-555-audit-correlation-salt-rotation-automation |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/555 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/516 |
| 起票元 source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` |
| 親タスク | `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`（FU-01 live wiring 完了が着手前提） |
| 配置先 | `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/` |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local |
| workflow_state | implemented-local |
| runtimeEvidence | blocked_upstream_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — `scripts/audit-correlation/rotate-salt.sh` 新規作成・`apps/api/src/audit-correlation/redact.ts` の dual-hash 拡張・`correlate.ts` の version 跨ぎ merge ロジック追加・vitest 拡張・runbook 拡張・aiworkflow-requirements 反映を含む。CONST_004 の docs-only 例外条件には該当しない（コード変更が目的達成に必須）。 |
| Issue 状態 | **CLOSED** のまま運用。Issue #555 は既に CLOSED。本仕様書は Issue state を変更しない（ユーザー指示）。 |
| 優先度 | priority:medium |
| 規模 | scale:medium |
| 想定 PR 数 | 1（rotation script + dual-hash 機構 + version 移行 + runbook + SSOT 反映を同一サイクル内で完了させる） |
| 着手判断 | 親タスク FU-01 の live wiring が staging で 1 回以上成功し、`AUDIT_CORRELATION_SALT` が実 incident 履歴と紐づいた後。本仕様書は着手前提が満たされていなくても作成可能だが、Phase 11 staging evidence 取得は前提成立後に実施する。 |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#555`（`Refs: #555` を PR 本文に必ず含める。Issue は CLOSED のままにする） |
| GitHub Issue labels（継承） | `priority:medium`, `type:security`, `scale:medium`, `status:unassigned` |
| PR に付与する labels | `priority:medium`, `type:security`, `scale:medium`, `area:api`, `area:infra`（`status:unassigned` は PR には付けない） |
| `gh pr create` 引数 | `--label priority:medium --label type:security --label scale:medium --label area:api --label area:infra` |
| ブランチ名 | `feat/issue-555-audit-correlation-salt-rotation-automation` |
| PR タイトル | `feat(api,infra): issue-555 AUDIT_CORRELATION_SALT rotation automation and fingerprintVersion=2 migration` |
| 親 Issue | `#516` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。Issue 自体は CLOSED のまま維持し、PR から reopen はしない（`Refs:` のみ）。

## 目的

`AUDIT_CORRELATION_SALT` の rotation を半自動化し、`fingerprintVersion` を 1 → 2 に増分しても既存 incident 履歴との連続性を保つ仕組みを **rotation script + dual-hash redact + correlate version 跨ぎ merge + runbook** ベースで整える。

具体的には次を達成する:

1. `scripts/audit-correlation/rotate-salt.sh` を新規作成し、新 salt 生成 → 1Password (`AUDIT_CORRELATION_SALT_PREVIOUS` 退避 → `AUDIT_CORRELATION_SALT` 上書き) → Cloudflare Secrets 反映 → `fingerprintVersion` 増分 → dual-hash 期間設定までを 1 コマンドで実行（`--dry-run` / `--apply` / `--rollback` / `--end-rotation` の 4 モード）
2. `apps/api/src/audit-correlation/redact.ts` を編集し、`AUDIT_CORRELATION_SALT_PREVIOUS` が存在する rotation 期間中のみ「旧 salt + 新 salt」両方の fingerprintHash を計算する dual-hash モードを追加（`fingerprintHashes: { v1: string, v2: string }` を出力）
3. `apps/api/src/audit-correlation/correlate.ts` を編集し、`fingerprintVersion=1` の旧 fingerprint と `fingerprintVersion=2` の新 fingerprint を「同一 actor」として group merge する補助ロジックを追加
4. vitest に `fingerprintVersion=1 → 2` 移行 group 化テストを追加（rotation 期間中の dual-hash 動作・rotation 終了後の single-hash 動作の双方）
5. `docs/runbooks/audit-correlation.md` に rotation 自動化手順 / 緊急 rotation 手順 / fingerprintVersion=2 移行手順を追記
6. `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` および既存正本 `references/deployment-secrets-management.md` に rotation policy（周期・承認 workflow・1Password vault 構造）を追記し、並行する secrets 正本を新設しない

## スコープ

### 含む

- `scripts/audit-correlation/rotate-salt.sh` 新規（`--dry-run` / `--apply` / `--rollback` / `--end-rotation` モード、`op` CLI 経由で 1Password 更新、`bash scripts/cf.sh secret put/delete` 経由で Cloudflare Secrets 反映）
- `apps/api/src/audit-correlation/redact.ts` の dual-hash 機構（`AUDIT_CORRELATION_SALT_PREVIOUS` 環境変数の存在検知 + 期間 wrap）
- `apps/api/src/audit-correlation/correlate.ts` の version 跨ぎ merge ロジック
- vitest（`apps/api/src/audit-correlation/__tests__/redact.test.ts` / `correlate.test.ts`）の rotation 移行テスト追加
- `docs/runbooks/audit-correlation.md` の rotation 章追記
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` rotation 章追記
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 1Password vault 構造追記（既存正本へ統合し、`secrets-management.md` は新設しない）
- `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json}` 反映（`mise exec -- pnpm indexes:rebuild` で再生成）
- grep gate スクリプト拡張（rotation 期間中の dual-hash 出力で salt literal / secret 非露出を検査）
- secret rotation policy（rotation 周期・承認 workflow・1Password ↔ Cloudflare Secrets 同期）のドキュメント化

### 含まない

- live audit-correlation Worker route 実装（親タスク FU-01 の責務）
- branch protection 登録（FU-02 の責務）
- 全 secret 共通の rotation 基盤（本タスクは `AUDIT_CORRELATION_SALT` に限定）
- `fingerprintVersion=3 以降` の移行実装（本タスクは v1 → v2 のみ）
- production への実 rotation 実行（runtime gate は staging までに留め、production は user gate 後の別段ゲート）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 親タスク `issue-516-github-audit-log-cross-source-correlation/` の FU-01 live wiring | redact.ts / correlate.ts / `AUDIT_CORRELATION_SALT` 環境変数解釈の base 実装が必要。Phase 1 で current state を再確認する |
| 上流 | `docs/runbooks/audit-correlation.md` 既存版 | rotation 章を追記する母体ドキュメント |
| 上流 | 1Password Production vault | `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS` の 2 item 体制に拡張 |
| 上流 | `scripts/cf.sh` | Cloudflare Secrets 反映の wrapper |
| 下流 | aiworkflow-requirements skill (`references/audit-correlation.md` / `references/deployment-secrets-management.md` / `indexes/`) | rotation policy 反映先 |
| 下流（独立） | 親 Issue #516 | 本タスク完了で「rotation 自動化は follow-up」の責務が回収される |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が解決済 | `mise install && mise exec -- node -v`（v24.15.0 期待） |
| `op` (1Password) CLI が利用可能 | `op --version` |
| `scripts/cf.sh` 経由で Cloudflare API token 解決可能 | `bash scripts/cf.sh whoami` |
| 親タスク Issue #516 spec が参照可能 | `test -d docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/` または unassigned source `test -f docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` |
| 既存 redact.ts が参照可能（FU-01 完了時のみ） | `test -f apps/api/src/audit-correlation/redact.ts`（未着手なら Phase 1 で current state を `not_yet_implemented` 記録） |
| staging 環境到達確認 | `bash scripts/cf.sh d1 list` |

> **着手前提の特例**: 親タスク FU-01 が未完了でも本仕様書の Phase 1 〜 Phase 10（local 実装まで）は着手可能。Phase 11（staging evidence）のみ FU-01 完了が前提。Phase 1 で「親タスク現状」を必ず再確認し、未完了なら Phase 11 を `blocked_upstream_pending` で開始する。

## 苦戦箇所・知見（unassigned-task §4 継承）

1. **redact-safe join key の改訂教訓（Issue #516）**: `email|ip|ua` 入力では HIGH severity 「IP 急変検知」と矛盾するため email-based 方式へ改訂された。**再現対策**: rotation 設計でも「同一 actor の identity 連続性」と「IP 変化検知」が両立する hash 入力かを Phase 1 で再確認する。
2. **salt literal 非露出の grep gate**: secret pattern 検出が緩く、`ghp_*` / `github_pat_*` 検出を PR レビューで追加した。**再現対策**: dual-hash 期間中は「旧 salt の literal が cache / log / error path に残っていないか」を grep gate に明示追加する（Phase 8 で gate 設計、Phase 10 で test 化）。
3. **fixture 駆動と live 運用のギャップ**: Issue #516 は fixture-only スコープにとどめ、rotation の実 incident 連続性は未検証。**再現対策**: Phase 11 staging evidence は親タスク FU-01 live wiring 完了後にのみ取得し、completion を runtime gate とする。
4. **`op` CLI の non-interactive 制約**: 1Password CLI rotation 自動化はインタラクティブ承認が必要なケースがある。Phase 1 で `op` の non-interactive モード制約（`OP_SERVICE_ACCOUNT_TOKEN` 利用可否）を確定し、CI から完全 headless にできない場合は手動承認ステップを runbook 側で明示する。
5. **dual-hash 期間中の永続化レコード schema**: incident 永続化が D1 に行われる場合、`fingerprintVersion` カラムの migration が必要になる可能性。Phase 2 で永続化 schema 影響を再確認し、本タスクスコープ内で migration が必要なら 0016（番号は Phase 2 で実態確認後に確定）として追加、不要なら追加しない判断を記録する。
6. **rotation 終了タイミングの自動検知**: `AUDIT_CORRELATION_SALT_PREVIOUS` 環境変数の削除を rotation 終了の signal として扱う。runbook では rotation 終了手順（previous 削除 → Worker 再 deploy）を明示し、削除忘れによる「永続的 dual-hash」を防ぐ（CPU 2 倍コスト回避）。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/audit-correlation/rotate-salt.sh` | 新規 | rotation オーケストレーション script（`--dry-run` / `--apply` / `--rollback` / `--end-rotation`） |
| `scripts/audit-correlation/lib/op-helpers.sh` | 新規（必要時） | `op item get/edit/create` の thin wrapper（rotate-salt.sh から source） |
| `apps/api/src/audit-correlation/redact.ts` | 編集 | `AUDIT_CORRELATION_SALT_PREVIOUS` 検知 + dual-hash 計算ロジック追加（`fingerprintHashes: { v1, v2 }` 返却） |
| `apps/api/src/audit-correlation/correlate.ts` | 編集 | `fingerprintVersion` を見て v1/v2 fingerprint を group merge（同一 actor 扱い） |
| `apps/api/src/audit-correlation/types.ts` | 編集 | 既存 `NormalizedAuditEvent` / `CorrelationKey` を拡張し、後方互換 `fingerprintHash` + optional `fingerprintHashes` を追加。並行 record modelは作らない |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | 編集 | dual-hash 期間中 / 終了後の双方 path test |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | 編集 | v1 + v2 mix の同一 actor merge test |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/*.json` | 新規 | rotation 期間 fixture（旧 salt + 新 salt + 期待 group） |
| `apps/api/migrations/0016_*.sql` | 新規（必要時のみ） | 永続化 schema に `fingerprintVersion` カラム追加（Phase 2 で要否判定。番号は Phase 2 で実態確認後に確定） |
| `docs/runbooks/audit-correlation.md` | 編集 | rotation 自動化 / 緊急 rotation / version 移行手順 / 終了手順を追記 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 | rotation 章（周期・承認 workflow・dual-hash 設計）追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 or 新規 | 1Password vault 構造（`AUDIT_CORRELATION_SALT` / `_PREVIOUS`）追記 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 再生成 | `salt rotation` / `fingerprintVersion` anchor 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 再生成 | `salt rotation` / `fingerprintVersion` / `dual-hash` keyword 追加 |
| `scripts/grep-gate/audit-correlation-secrets.sh` | 編集 or 新規 | dual-hash 期間中の salt literal 非露出 gate（既存 grep gate に統合可） |
| `outputs/phase-12/implementation-guide.md` | 新規 | 中学生レベル + 技術者レベル 2 層構成の実装ガイド |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定 / rotation policy フレームワーク確定（rotation 周期・dual-hash 期間・しきい値） | completed |
| [2](phase-02.md) | dual-hash データモデル設計 / 永続化 schema 影響判定 / migration 番号確定（必要時） | completed |
| [3](phase-03.md) | rotation script I/F 設計 / redact.ts / correlate.ts 関数シグネチャ確定 | completed |
| [4](phase-04.md) | 統合テスト設計（vitest / dual-hash 期間中・終了後・rotation rollback シナリオ） | completed |
| [5](phase-05.md) | 永続化 migration 実装（必要時のみ Phase 2 判定に従う。不要時は本 Phase をスキップ記録） | completed_skipped_no_migration |
| [6](phase-06.md) | redact.ts 実装（`AUDIT_CORRELATION_SALT_PREVIOUS` 検知 + dual-hash 計算） | completed |
| [7](phase-07.md) | correlate.ts 実装（v1 + v2 group merge） | completed |
| [8](phase-08.md) | rotation script 実装（`scripts/audit-correlation/rotate-salt.sh` / grep gate 拡張） | completed |
| [9](phase-09.md) | runbook / SSOT 反映ドラフト（runbook 章 + aiworkflow-requirements references / indexes 草案） | completed |
| [10](phase-10.md) | 単体テスト実装 + local 実行（typecheck / lint / vitest / shellcheck for `rotate-salt.sh`） | completed_local_evidence |
| [11](phase-11.md) | runtime evidence 取得（staging で dry-run rotation 1 回 + dual-hash 期間中の HIGH alert 不分裂観察）— 親 FU-01 完了が前提 | blocked_upstream_pending |
| [12](phase-12.md) | implementation-guide / SSOT 反映実書き込み / unassigned 検出 / skill feedback / compliance | completed_local_runtime_pending |
| [13](phase-13.md) | commit / PR 作成（user gate） | pending_user_approval |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | [outputs/phase-2/phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | [outputs/phase-3/phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | [outputs/phase-4/phase-4.md](outputs/phase-4/phase-4.md) |
| 5 | [outputs/phase-5/phase-5.md](outputs/phase-5/phase-5.md) |
| 6 | [outputs/phase-6/phase-6.md](outputs/phase-6/phase-6.md) |
| 7 | [outputs/phase-7/phase-7.md](outputs/phase-7/phase-7.md) |
| 8 | [outputs/phase-8/phase-8.md](outputs/phase-8/phase-8.md) |
| 9 | [outputs/phase-9/phase-9.md](outputs/phase-9/phase-9.md) |
| 10 | [outputs/phase-10/phase-10.md](outputs/phase-10/phase-10.md) |
| 11 | [outputs/phase-11/phase-11.md](outputs/phase-11/phase-11.md) |
| 12 | [outputs/phase-12/phase-12.md](outputs/phase-12/phase-12.md) |
| 13 | [outputs/phase-13/phase-13.md](outputs/phase-13/phase-13.md) |

## 完了条件（DoD: タスク全体）

### 機能要件

- [ ] `scripts/audit-correlation/rotate-salt.sh` が `--dry-run` / `--apply` / `--rollback` / `--end-rotation` の 4 モードで動作することを local + staging で確認
- [ ] `apps/api/src/audit-correlation/redact.ts` が `AUDIT_CORRELATION_SALT_PREVIOUS` 存在時のみ dual-hash を出力し、未設定時は単一 hash のみを返す（unit test 緑）
- [ ] `apps/api/src/audit-correlation/correlate.ts` が v1 + v2 fingerprint を同一 actor として group merge する（unit test 緑）
- [ ] vitest で「rotation 期間中 dual-hash」「rotation 終了後 single-hash」「rotation rollback」「v1+v2 mix の HIGH alert 連続性」の 4 シナリオが緑
- [ ] grep gate が rotation 期間中の dual-hash 出力に対して salt literal / secret literal を検出しない（test 化）

### 品質要件

- [ ] `mise exec -- pnpm typecheck` clean
- [ ] `mise exec -- pnpm lint` clean
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` で audit-correlation 関連 test 緑
- [ ] `shellcheck scripts/audit-correlation/rotate-salt.sh` clean
- [ ] dual-hash 計算コストが「rotation 終了後は通常 path（single-hash）」になることを test で保証（永続的 dual-hash の防止）

### ドキュメント要件

- [ ] `docs/runbooks/audit-correlation.md` に rotation 自動化 / 緊急 rotation / version 移行 / rotation 終了の 4 手順が追記されている
- [ ] `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` に rotation 章が追記されている
- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に 1Password vault 構造（`AUDIT_CORRELATION_SALT` / `_PREVIOUS`）が記載されている
- [ ] `mise exec -- pnpm indexes:rebuild` 後に skill indexes drift が無い（CI `verify-indexes-up-to-date` gate PASS）
- [ ] `outputs/phase-12/implementation-guide.md` が Phase 12 6 必須タスクのうち Task 1 として実体配置済（中学生レベル + 技術者レベル）

### Runtime / Staging 要件（user gate）

- [ ] 親タスク FU-01 live wiring 完了後、staging で `rotate-salt.sh --apply` を 1 回成功し、dual-hash 期間中の HIGH alert が rotation 直前/直後で分裂しないことを `outputs/phase-11/staging-evidence.md` に記録
- [ ] production rotation は本タスクスコープ外（user gate 後の別段ゲート）

### PR / Issue 要件

- [ ] PR 本文に `Refs: #555` / `Refs: #516` を含む
- [ ] PR labels に `priority:medium` / `type:security` / `scale:medium` / `area:api` / `area:infra` が付与
- [ ] Issue #555 は CLOSED のまま維持（PR から reopen しない）

## 参照情報

- 起票元 unassigned spec: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md`
- 親タスク（着手前提）: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`（存在しない場合は親 Issue #516 のみ参照）
- runbook: `docs/runbooks/audit-correlation.md`
- CLAUDE.md: 「シークレット管理」「ローカル `.env` の運用ルール」「Cloudflare 系 CLI 実行ルール」セクション
- aiworkflow-requirements: `references/audit-correlation.md` / `references/deployment-secrets-management.md`
- 類似 spec フォーマット: `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/`
