# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

task-specification-creator skill の Phase 12 5 必須タスク + Task 6 compliance を満たす。production apply 状態の SSOT 同期を含む。

## 実行タスク

- Phase 12 strict 7 files を canonical filename で作成する。
- production apply 前の spec_created 状態と Phase 13 後の applied 状態を分離して記録する。
- aiworkflow-requirements への same-wave sync 対象と Phase 13 後 sync 対象を分ける。

## Part 1: 中学生レベル概念説明（Task 12-1 の前段）

> このタスクは「本番のデータベース」に新しい表（`schema_aliases`）を追加するための **適用作業** です。学校で例えると、図書室に新しい貸出カード入れの「箱」を 1 つ追加する作業です。
>
> - 「箱」を作る設計図（DDL ファイル）はもう用意してあります（`apps/api/migrations/0008_create_schema_aliases.sql`）。
> - 図書室の本棚（本番データベース）には、まだ箱が置かれていません。
> - 「箱を置いていいよ」と先生（ユーザー）から承認をもらってから、専用の指示書（`bash scripts/cf.sh d1 migrations apply`）に従って棚に置きます。
> - 置いたあとで「ちゃんと置けたか」を写真（PRAGMA の結果）で記録します。
>
> なぜ慎重にやるか?: 一度置いた箱を急に動かすと、図書室全体が混乱します（本番データなので影響が大きい）。なので **承認 → 適用 → 写真確認 → 記録** の順序を必ず守ります。

## Task 12-1: 実装ガイド（`outputs/phase-12/implementation-guide.md`）

| 区分 | 記述内容 |
| --- | --- |
| Part 1 | 上記「中学生レベル概念説明」を逐語コピー |
| Part 2 | 技術詳細：Cloudflare D1 / wrangler migrations / `scripts/cf.sh` ラッパー / op secret 注入 / PRAGMA verification / rollback DDL |
| 必須要素 | apply target / environment / pre-post evidence path / rollback / 承認境界 |

## Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

### Step 1-A: `database-schema.md`

- `schema_aliases` の production apply 状態を「local applied / production unapplied」→「production applied (yyyy-mm-dd)」へ更新（Phase 13 実行後）。
- 必須 column / index の記述を current SSOT として再固定。

### Step 1-B: `task-workflow-active.md`

- 本タスクを active workflow から completed workflow へ移動（Phase 13 実行後）。

### Step 1-C: 後続タスクへの propagation

- `task-issue-191-schema-questions-fallback-retirement-001` の前提条件「production apply 済み」へのチェックを記載。
- `task-issue-191-direct-stable-key-update-guard-001` の前提条件として同様の記載。

### Step 2（条件付き）

- `0008_schema_alias_hardening.sql` の production apply 状態は本タスクで変更しない（別タスクで扱う）。

## Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

| date | file | change |
| --- | --- | --- |
| 2026-05-02 | `docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/` | 新規タスク仕様書作成 |
| Phase 13 後 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production apply 状態 marker 更新 |
| Phase 13 後 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active → completed |

## Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）

検出候補（0 件でも出力必須）:

- `0008_schema_alias_hardening.sql` の production apply：別タスク化候補（本タスクの scope 外）。
- code deploy（Worker bundle 更新）：apps/api / apps/web 別々の deploy タスク化候補。
- production D1 backup runbook：本タスクではバックアップ取得を必須化していない（D1 は CREATE のみで破壊性が低い前提）。バックアップポリシー明文化の別タスク候補。

## Task 12-5: スキルフィードバック（`outputs/phase-12/skill-feedback-report.md`）

| 苦戦箇所 | promotion target | no-op reason / evidence path |
| --- | --- | --- |
| 「local apply 完了 ≠ production apply 完了」境界の明示 | `references/phase-11-non-visual-alternative-evidence.md` の production-operation セクション補強候補 | 本タスクの phase-11.md に境界を明記済み |
| `wrangler` 直叩き禁止の繰り返し説明 | `references/orchestration.md` の Cloudflare CLI policy 集約候補 | CLAUDE.md と本仕様書で重複明記 |
| Issue closed のままタスク仕様書を作る運用 | `references/create-workflow.md` に「closed issue from spec-only entry」 case を追加候補 | 本タスクで実例化 |

## Task 6: compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| 項目 | 期待 | 実体 |
| --- | --- | --- |
| Phase 12 必須 7 ファイル | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check | ✅ Phase 12 で実体作成 |
| root / outputs `artifacts.json` parity | root / outputs 同期 | `outputs/artifacts.json` を root `artifacts.json` と同値で作成済み。 |
| workflow_state | `spec_created` を据え置き、Phase 13 後に `completed` 化 | ✅ |
| Phase status parity | Phase 1-12 を `spec_created` → Phase 13 後に `completed`、Phase 13 は `blocked_until_user_approval` | ✅ |

## 完了条件

- [ ] Part 1 中学生レベル概念説明あり
- [ ] Phase 12 strict 7 files が canonical filename で実体化されている
- [ ] SSOT 更新範囲が `database-schema.md` と `task-workflow-active.md` に閉じている
- [ ] 本Phase内の全タスクを100%実行完了

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 files / parity |
| aiworkflow SSOT | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production apply marker |
| workflow tracking | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active / pending approval 状態 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| Phase 12 outputs | `outputs/phase-12/` | strict 7 files |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 11 | NON_VISUAL evidence 境界を継承 | `outputs/phase-11/*` |
| Phase 13 | approval-gated runtime evidence / SSOT applied marker | `outputs/phase-13/*` |

## 次Phase

Phase 13: 承認 + 実適用 + PR 作成
