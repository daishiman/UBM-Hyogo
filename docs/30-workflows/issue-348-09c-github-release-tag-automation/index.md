# タスク仕様書: Issue #348 — 09c release tag からの GitHub Release 自動作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-348-09c-github-release-tag-automation |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/348 (CLOSED) |
| 起票元 source | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` |
| 親タスク | `task-09c-github-release-tag-automation-001` |
| 配置先 | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local / release apply user-gated |
| workflow_state | implemented-local |
| runtimeEvidence | local deterministic PASS / GitHub Release mutation pending user approval |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — root cause: 「09c release tag から GitHub Release を作成し、release note を Phase 12 changelog / Phase 11 evidence と紐付ける」を達成するには、`scripts/release/`（または `.github/workflows/`）配下に release-note 生成スクリプトと `gh release create` ラッパー、および runbook と SSOT 更新が必要であり、コード変更を伴うため。docs-only では完了不能。 |
| 親 Issue 状態維持 | **CLOSED のまま運用**（ユーザー指示）。本仕様書は historical traceability のための後追いドキュメント化。Issue 再オープンは行わない。 |
| 優先度 | 中 |
| 規模 | 小規模 |
| 想定 PR 数 | 1（script + workflow + runbook + SSOT 同期） |
| coverage AC | `scripts/release/` 配下の bash ロジックは bats / shellcheck で SC0/lint clean、`.github/workflows/release-create.yml` は actionlint clean |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#348` (`Refs: #348` を PR 本文に必ず含める) |
| GitHub Issue labels（継承） | `priority:medium`, `scale:small`, `status:unassigned` |
| PR に付与する labels | `priority:medium`, `scale:small`（`status:unassigned` は PR には付けない） |
| `gh pr create` 引数 | `--label priority:medium --label scale:small` |
| ブランチ名 | `feat/issue-348-09c-github-release-tag-automation` |
| PR タイトル | `feat(release): issue-348 09c release tag からの GitHub Release 自動作成` |
| 親タスク参照 | `task-09c-github-release-tag-automation-001` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。

## 目的

09c production deploy 完了後の release tag (`vYYYYMMDD-HHMM`) から、以下を**自動かつ決定論的に**生成する:

1. tag format / target commit の事前検証（ローカル + CI 双方）
2. release note 本文（Phase 12 changelog + Phase 11 runtime evidence + rollback evidence + known follow-up へのリンクを含む）
3. `gh release create` の実行（dry-run と apply の 2 段ゲート）
4. release / tag / commit / Phase 11 evidence / Phase 12 changelog の対応関係を後から追跡できる evidence ファイル（`outputs/phase-11/release-evidence.md` 等）

production deploy 実行そのものは **task-09c-production-deploy-execution-001** の責務であり、本タスクは release note 生成と GitHub Release 作成の境界に限定する。

## スコープ

### 含む

- `scripts/release/generate-release-notes.sh` 新規実装（Phase 12 changelog + Phase 11 evidence URL を入力に release note 本文を組み立てる pure bash）
- `scripts/release/create-github-release.sh` 新規実装（tag format 検証 → dry-run 出力 → `gh release create` apply の 3 段ゲート）
- `scripts/release/release-notes.template.md` 新規（release note テンプレート本体。markdown placeholder 形式）
- `.github/workflows/release-create.yml` 新規（tag push 起動 / `workflow_dispatch` 起動の 2 トリガで release note 自動生成 + `gh release create`）
- `scripts/release/__tests__/generate-release-notes.bats` 新規（dry-run の決定論性 / tag format バリデーション / changelog 不在時の fallback）
- `docs/runbooks/release-create.md` 新規（manual fallback runbook）
- `.claude/skills/aiworkflow-requirements/references/release-runbook.md`（既存ならば編集 / 無ければ新規）に GitHub Release 作成導線を追加（SSOT）

### 含まない

- tag 命名規則（`vYYYYMMDD-HHMM`）の変更（本タスクは既存命名規則を所与とする）
- production deploy 実行（`task-09c-production-deploy-execution-001` の責務）
- changelog 生成ロジックそのもの（Phase 12 `documentation-changelog.md` を入力として受け取るだけ）
- Slack / メール通知（後続タスク `task-09c-incident-runbook-slack-delivery-001` 等の責務）
- production rollback 実行（runbook 参照のみ。実行コードは含めない）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-09c-production-deploy-execution-001`（completed-tasks） | release tag を生成する側 |
| 上流 | 09c Phase 12 `documentation-changelog.md` | release note の入力 |
| 上流 | 09c Phase 11 runtime evidence (`outputs/phase-11/`) | release note へのリンク先 |
| 下流 | `task-09c-post-release-dashboard-automation-001` | release URL を dashboard に転記する側 |
| 下流 | aiworkflow-requirements `release-runbook` | SSOT 反映先 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| 既存 09c 仕様の release tag セクションが参照可能 | `test -f docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md` |
| 既存 09c Phase 12 changelog が参照可能 | `test -f docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md` |
| `actionlint` / `shellcheck` / `bats` が利用可能 | `which actionlint shellcheck bats` |

## 苦戦箇所・知見（unassigned-task 仕様から継承）

1. **tag と release の分離境界**: production deploy 実行と release 作成が同一スクリプトに混在すると、release 作成失敗時に rollback 判断が複雑化する。本タスクは「release 作成のみ」に境界を固定する。
2. **release note の入力 SSOT**: Phase 12 `documentation-changelog.md` が唯一の入力。スクリプト内に changelog ロジックを再実装しない。
3. **dry-run 必須**: `gh release create` は冪等でないため、apply 前に必ず dry-run（render markdown のみ）でレビューする。
4. **tag format 検証**: `vYYYYMMDD-HHMM` のフォーマット検証を CI / ローカル両方で先に gate しないと、誤 tag からの release 作成事故が起きる。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/release/release-notes.template.md` | 新規 | release note の placeholder テンプレ |
| `scripts/release/generate-release-notes.sh` | 新規 | template + changelog + evidence URL → release note 本文を stdout 出力 |
| `scripts/release/create-github-release.sh` | 新規 | tag 検証 → dry-run → apply（`--dry-run` / `--apply` フラグ） |
| `scripts/release/__tests__/generate-release-notes.bats` | 新規 | bats テスト（決定論性・tag 検証・fallback） |
| `.github/workflows/release-create.yml` | 新規 | tag push / workflow_dispatch トリガで release 自動作成 |
| `docs/runbooks/release-create.md` | 新規 | manual fallback runbook |
| `.claude/skills/aiworkflow-requirements/references/release-runbook.md` | 新規 or 編集 | SSOT に GitHub Release 作成導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 新 reference を index に追加 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定 / tag format SSOT 確定 | completed |
| [2](phase-02.md) | release note template 設計 / placeholder 仕様 | completed |
| [3](phase-03.md) | スクリプト I/F 設計 / `.github/workflows/release-create.yml` 設計 | completed |
| [4](phase-04.md) | 統合テスト設計（bats / actionlint / shellcheck） | completed |
| [5](phase-05.md) | スクリプト実装（`generate-release-notes.sh` / `create-github-release.sh`） | completed |
| [6](phase-06.md) | template 実装（`release-notes.template.md`） | completed |
| [7](phase-07.md) | GitHub Actions workflow 実装（`release-create.yml`） | completed |
| [8](phase-08.md) | runbook 実装（`docs/runbooks/release-create.md`） | completed |
| [9](phase-09.md) | SSOT 反映（aiworkflow-requirements `release-runbook.md` / indexes） | completed |
| [10](phase-10.md) | 単体テスト実装（bats / actionlint） | completed local fallback / optional tools unavailable |
| [11](phase-11.md) | runtime evidence 取得（dry-run dump / 既存 tag への 1 件 release 作成検証） | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| [12](phase-12.md) | implementation guide / SSOT 更新 / unassigned 検出 / skill feedback / compliance | completed_local_sync |
| [13](phase-13.md) | commit / PR 作成（user gate） | blocked_pending_user_approval |

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
| 11 | [outputs/phase-11/main.md](outputs/phase-11/main.md) |
| 12 | [outputs/phase-12/main.md](outputs/phase-12/main.md) |
| 13 | [outputs/phase-13/phase-13.md](outputs/phase-13/phase-13.md) |

## 完了条件（DoD: タスク全体）

- [x] `scripts/release/generate-release-notes.sh` が Phase 12 changelog と Phase 11 evidence URL を受け取り、決定論的に release note 本文を stdout 出力する
- [x] `scripts/release/create-github-release.sh` が tag format 検証 → dry-run → apply の 3 段ゲートを通る
- [ ] `.github/workflows/release-create.yml` が `actionlint` clean
- [x] bats テスト（dry-run 決定論性 / tag format / fallback）が緑（bats 未導入環境向け `run-all.sh` fallback PASS）
- [x] runbook と SSOT に GitHub Release 作成導線が追加され、aiworkflow-requirements の indexes に反映
- [ ] 既存 tag から release を 1 件作成できる手順が runtime evidence として記録される（user gate 後）
- [ ] PR に `priority:medium` / `scale:small` label が付与され、本文に `Refs: #348` が含まれる

## 参照情報

- 起票元: `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md`
- 09c Phase 5: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- 09c Phase 12 changelog: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md`
- GitHub CLI: `gh release create`
- 類似実装: `docs/30-workflows/issue-402-admin-request-retention-physical-delete/`（spec フォーマット参照）
