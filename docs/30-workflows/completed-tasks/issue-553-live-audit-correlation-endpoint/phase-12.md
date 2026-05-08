# Phase 12: implementation guide / SSOT sync / strict 7 成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| Source | `outputs/phase-12/main.md` |
| 区分 | ドキュメント / SSOT 同期（task-specification-creator phase-12-spec.md 準拠） |
| 想定所要 | 0.75 人日 |
| 境界 | **本仕様書は spec_created で完結**。コード wave（route / scheduled / persist / notify-slack / migration / wrangler.toml の実装）は後続実装プロンプトの責務であり、Phase 12 はドキュメント / SSOT 同期 / 検出 / フィードバック / コンプライアンス検証の strict 7 成果物に限る |

## 目的

`.claude/skills/task-specification-creator/references/phase-12-spec.md` の Phase 12 必須タスクを完了し、固定名の 7 ファイルを実体出力する。実装ガイドは Part 1（中学生レベル）と Part 2（技術者レベル）の 2 部構成で記述し、Phase 13 PR 本文から参照される正本とする。

`spec_created` 状態の close-out ルールに従い、本仕様書は「Phase 1〜13 の仕様書記述完了」をもって完結する。コード変更そのものは後続実装プロンプトに委ね、Phase 12 では「実装ガイドが後続プロンプトのために十分か」「SSOT が drift していないか」「未タスクが取り漏れていないか」を担保する。

## strict 7 成果物（固定ファイル名）

### Task 1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

Part 1 / Part 2 の 2 部構成で記述する。

#### Part 1: 中学生レベル概念説明

以下の平易な比喩・絵解きで構成する。専門用語を使う場合は必ず日常語訳を併記する:

- 「audit-correlation を 15 分おきに自動実行して、危ない動きを Slack に通知する仕組み」全体像
- 「GitHub の入退室記録」と「Cloudflare の入退室記録」を同じ人物のものと判定する考え方（hash と salt の喩え: 「指紋を取るときに塩を混ぜて、誰の指紋か逆算できないようにする」）
- HIGH severity = 「特に危ない動き」の判定ロジックの直感的説明
- なぜ Slack に通知するのか（30 分以内に気づくため）
- なぜ「実値」ではなく「先頭 8 文字 + ドメイン + IP の前半 + UA の種類」しか保存しないのか（プライバシー保護）

#### Part 2: 技術者レベル

- **orchestration 全体像**: `route` (`POST /internal/audit-correlation/run`) / `scheduled` (`*/15 * * * *`) → 共通 entry `run-correlation.ts` → `github-fetch` → `correlate` → `persist` (D1) → `notify-slack`（HIGH のみ）の sequence diagram
- **redact-safe 不変条件**: D1 row / log / Slack payload / evidence のいずれにも secret / full IP / full email / full UA / salt literal / webhook URL を露出させない grep gate の実装位置
- **D1 schema**: `audit_correlation_findings` の列定義（id / fingerprint_hash_prefix / fingerprint_version / actor_domain / ip_prefix / ua_bucket / severity / event_type / observed_at / created_at）と migration ID
- **cron trigger**: `apps/api/wrangler.toml` の `[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]` の差分、Cloudflare Worker `scheduled` event の retry-after 制約（同期 sleep 不可、次の cron 待ち戦略）
- **Cloudflare Secrets 投入手順**: `bash scripts/cf.sh secret put GITHUB_AUDIT_PAT --config apps/api/wrangler.toml --env staging` ほか 4 種、1Password 参照のみを `.dev.vars.example` に記載
- **salt rotation 手順**: 旧 salt と新 salt を `fingerprintVersion` で識別、移行期間中は両 hash を保持、runbook の対応章へリンク
- **fingerprintVersion またぎ運用**: v1 から v2 への切替時、incident 履歴を `fingerprint_version` 列で分離する保存規約
- **PR base / branch / label**: `dev` / `feat/issue-553-live-audit-correlation-endpoint` / `priority:medium` `scale:medium` `type:security`

#### Task 1 セルフチェック

- [ ] Part 1 が中学生でも読める（専門用語に必ず注釈）
- [ ] Part 2 に orchestration / redact-safe / D1 schema / cron / Secrets / salt rotation / fingerprintVersion の 7 章を含む
- [ ] secret / webhook URL / salt literal を一切記載していない
- [ ] PR 本文から本ファイルへの相対リンクが貼れる

### Task 2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

#### Step 1-A: `audit-correlation.md` への live wiring 章追加

- 対象: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
- 追加章: `## Live wiring（Issue #553）`
  - Worker route / scheduled / persist / notify-slack の役割
  - cron schedule (`*/15 * * * *`)
  - D1 schema へのリンク
  - Slack payload の redact-safe 構造
  - salt rotation / fingerprintVersion またぎ運用
  - runbook (`docs/runbooks/audit-correlation.md`) の Live wiring 章へのリンク

#### Step 1-B: `keywords.json` 更新

- 対象: `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- 追加キーワード:
  - `live wiring`
  - `cron trigger`
  - `audit-correlation slack`

#### Step 1-C: indexes 3 ファイル更新

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`: Issue #553 live wiring 即時導線を追加
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`: live wiring 章を resource として登録
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`: security topic に live wiring を追加

#### Step 2（条件付き）: SKILL.md / SKILL-changelog.md は変更不要

本タスクは reference 追加のみであり、skill API 契約の変更を伴わないため SKILL.md / SKILL-changelog.md は変更しない。判定根拠を `outputs/phase-12/main.md` に明記する。

#### Task 2 検証

```bash
mise exec -- pnpm indexes:rebuild
git diff .claude/skills/aiworkflow-requirements/indexes/
```

`pnpm indexes:rebuild` 後の `git diff` が **空** であること（drift 0 件）。CI gate `verify-indexes-up-to-date` が green であること。

### Task 3: ドキュメント更新履歴作成（`outputs/phase-12/documentation-changelog.md`）

以下の項目を表で記録:

| 更新対象 | 種別 | 概要 | 互換性 |
| --- | --- | --- | --- |
| `apps/api/src/routes/audit-correlation/` | 新規 | live route 追加 | 既存ランタイム非影響 |
| `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts` | 新規 | live orchestration | 既存 fixture engine 据え置き |
| `apps/api/wrangler.toml` | 編集 | `[triggers]` cron / secrets binding 追加 | secrets 注入後に有効 |
| `apps/api/migrations/NNNN_audit_correlation_findings.sql` | 新規 | D1 schema 追加 | apply 後に有効 |
| `scripts/audit-correlation/run.sh` | 編集 | `--mode=live` flag 追加 | fixture mode 既定 |
| `.github/workflows/audit-correlation-verify.yml` | 編集 | live mode grep gate | CI 強化のみ |
| `docs/runbooks/audit-correlation.md` | 編集 | Live wiring 章追加 | docs 追加のみ |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 | Live wiring 章追加 | docs 追加のみ |
| `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` | 編集 | live wiring index 化 | docs 追加のみ |

### Task 4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）

**0 件でも出力必須**。本タスクスコープでは新規未タスクは検出しない見込みだが、以下を明記する:

- FU-02（branch protection 必須化）は既存 Issue として存在し本タスク対象外
- FU-03（fingerprintVersion=2 自動 migrate）は既存 Issue として存在し本タスク対象外
- 親 Issue #408（Cloudflare 側 redaction 再設計）は別 owner スコープ
- Phase 11 の D1 schema parity verification で drift を検出した場合は `U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01-D1-PARITY-DRIFT-NN.md` を本タスク内で発行する（ファイル名・配置先・理由・実施時期を表で明記）

検出 0 件の場合でも本ファイルは「検出 0 件」と明記して出力する（CONST_007 整合の証跡）。

### Task 5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`）

3 観点固定で記述:

#### 観点 1: テンプレ改善

- task-specification-creator の Phase 11 evidence template に「runtime evidence の段階取得（reserved path → local PASS → staging → production）」と「RESERVED_RUNTIME_EVIDENCE_PENDING 状態語彙」を追加すべきかの提案
- Phase 13 multi-stage approval gate（G1 runtime / G2 D1 apply / G3 secrets / G4 commit-push-PR）を template 化する提案

#### 観点 2: ワークフロー改善

- Cloudflare Worker live wiring 系タスクは「D1 schema parity verification」「Cloudflare Secrets 投入手順」「cron trigger evidence」を Phase 11 で必ず取得する template の提案
- redact-safe 不変条件 grep gate を Phase 11 と Phase 7 (CI) の両方で適用する二重 gate 化の提案

#### 観点 3: ドキュメント改善

- 中学生レベル Part 1 / 技術者レベル Part 2 の 2 部構成は security タスクで効果的だった旨の記録
- aiworkflow-requirements `audit-correlation.md` の Live wiring 章追加は SKILL.md 改訂を伴わない reference 追加で十分という判定根拠の文書化提案

### Task 6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

以下の整合性を表で確認:

- [ ] CONST_005（実装区分 / 変更ファイル / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）が Phase 1〜13 で揃う
- [ ] CONST_007（1 サイクル完了スコープ）整合: 全 13 Phase が後続実装プロンプトの 1 サイクル内で完結
- [ ] strict 7 成果物すべてが `outputs/phase-12/` に揃う
- [ ] redact-safe 不変条件が Phase 1 / 4 / 5 / 7 / 8 / 11 で一貫適用
- [ ] PR base = `dev`、Issue #553 CLOSED 据え置き、`Refs: #553` / `Refs: #516` 併記が Phase 13 で要求されている
- [ ] visualEvidence=NON_VISUAL ポリシーが Phase 11 / 13 で一貫

## 変更対象ファイル / 出力先

| パス | 種別 | 役割 |
| --- | --- | --- |
| `outputs/phase-12/main.md` | 新規 | Phase 12 サマリ + 6 タスクへのリンク |
| `outputs/phase-12/implementation-guide.md` | 新規 | Task 1 成果物（Part 1 + Part 2） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | Task 2 成果物 |
| `outputs/phase-12/documentation-changelog.md` | 新規 | Task 3 成果物 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | Task 4 成果物（0 件でも出力必須） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | Task 5 成果物（3 観点固定） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | Task 6 成果物 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 | Task 2 Step 1-A |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | Task 2 Step 1-B |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | Task 2 Step 1-C |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | Task 2 Step 1-C |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | Task 2 Step 1-C |

## 実行手順（チェックリスト）

## 実行タスク

1. [ ] Task 1: `implementation-guide.md` を Part 1 + Part 2 で記述
2. [ ] Task 2: `audit-correlation.md` に Live wiring 章追加 / keywords.json 3 語追加 / indexes 3 ファイル更新
3. [ ] Task 2 検証: `mise exec -- pnpm indexes:rebuild` 実行 → `git diff .claude/skills/aiworkflow-requirements/indexes/` が空
4. [ ] Task 3: `documentation-changelog.md` 作成
5. [ ] Task 4: `unassigned-task-detection.md` 作成（0 件でも出力。Phase 11 で D1 drift 検出時は followup task 発行）
6. [ ] Task 5: `skill-feedback-report.md` を 3 観点固定で作成
7. [ ] Task 6: `phase12-task-spec-compliance-check.md` 作成
8. [ ] `outputs/phase-12/main.md` から 6 ファイルへの相対リンクを記載

## 検証 / 期待出力

- [ ] `outputs/phase-12/` 配下に最低 7 ファイル（main.md + 6 task 成果物）が実体出力されている
- [ ] `pnpm indexes:rebuild` 後の `git diff` が空（CI gate `verify-indexes-up-to-date` が green）
- [ ] `implementation-guide.md` に Part 1 + Part 2 の両セクションが揃う
- [ ] `unassigned-task-detection.md` が 0 件でも実体出力されている
- [ ] `skill-feedback-report.md` が 3 観点固定で記述されている
- [ ] `phase12-task-spec-compliance-check.md` で CONST_005 / CONST_007 整合が確認されている

## 統合テスト連携

Phase 12 はドキュメント / SSOT 同期のみであり、コード実装は伴わないため統合テスト追加は無し。Phase 11 の `test.log` / `bats.log` / `actionlint.log` を `implementation-guide.md` から参照する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- 親ワークフロー Phase 12: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-12.md`
- CLAUDE.md「重要 — Phase 12 と Phase 13 の境界」

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（編集）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（編集）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（編集）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（編集）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（編集）

## 完了条件（DoD）

- [ ] strict 7 成果物すべてが揃う
- [ ] aiworkflow-requirements indexes drift なし（`pnpm indexes:rebuild` 後 git diff 空）
- [ ] CONST_005 / CONST_007 整合性が compliance-check で文書化
- [ ] `verify-indexes-up-to-date` CI gate が green
- [ ] `implementation-guide.md` に secret / webhook URL / salt literal を含めない
- [ ] `unassigned-task-detection.md` を 0 件でも実体出力
- [ ] `skill-feedback-report.md` を 3 観点固定で記述
- [ ] 本仕様書は `spec_created` で完結し、コード wave は後続実装プロンプトに委ねる旨 `main.md` に明記
