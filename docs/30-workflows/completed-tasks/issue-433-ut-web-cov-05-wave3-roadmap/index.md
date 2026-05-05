# issue-433-ut-web-cov-05-wave3-roadmap — タスク仕様書 index

[実装区分: 実装仕様書]

判定根拠: 本タスクの成果物は roadmap markdown だが、(1) 新規 markdown ファイル作成 `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md`、(2) `.claude/skills/aiworkflow-requirements/references/*` 編集、(3) `pnpm indexes:rebuild` による index 再生成、(4) CI gate `verify-indexes-up-to-date` の green 確認、を伴う。CONST_004 / CONST_005 に従いラベルより実態優先で「実装仕様書」として扱い、変更対象ファイル一覧・テスト方針・DoD を各 Phase で必須項目化する。コード実装の新規ロジックは無いが、リポジトリ実体（markdown / indexes 生成物）の差分を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-433-ut-web-cov-05-wave3-roadmap |
| ディレクトリ | docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap |
| Issue | #433 |
| Issue 状態 | CLOSED（後追いで仕様書を整備。再 open はしない。`Refs #433` のみ使用） |
| 親タスク | ut-coverage-2026-05-wave（wave-2 完了） |
| 関連 task spec | docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md（参照元・削除/移動禁止） |
| Wave | follow-up（wave-2 → wave-3 ブリッジ計画） |
| 実行種別 | sequential |
| 作成日 | 2026-05-04 |
| 担当 | UT coverage wave owner |
| 状態 | implemented-local（Phase 1〜12 completed / Phase 13 blocked_pending_user_approval） |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |

## purpose

UT coverage 2026-05 wave-2 完了時点の `apps/web` / `apps/api` / `packages` 配下の coverage 数値を layer 別に計測・可視化し、layer × coverage 種別（line / branch / function）の gap マッピング表と wave-3 候補タスクリスト（5〜10 件、優先度・規模見積つき）を `wave-3-roadmap.md` として確立する。さらに aiworkflow-requirements references から本 roadmap を参照可能にし、`pnpm indexes:rebuild` 後の `verify-indexes-up-to-date` CI gate を green に保つ。

## scope in / out

### scope in

- `apps/web` / `apps/api` / `packages/*` での `vitest --coverage` 実行と coverage JSON / summary 取得
- layer 別（admin component / public component / hook / lib / use-case / route handler / shared module）の集計テンプレート確立
- gap マッピング表スキーマ（layer × file × line% × branch% × function% × gap-class × delegation-target）の定義と充填
- NON_VISUAL coverage backlog（integration / e2e へ委譲する箇所）の wave-2 各 `skill-feedback-report.md` / `outputs/phase-12/implementation-guide.md` からの集約
- wave-3 候補タスクリスト（5〜10 件）の優先度スコアリング（業務影響 × 実装規模 × dependency）と規模見積
- 新規 markdown `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` の作成
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` への wave-3 roadmap link 追加
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` への active workflow 索引反映
- `pnpm indexes:rebuild` 実行と `verify-indexes-up-to-date` green 確認

### scope out

- 個別テスト実装（wave-3 以降の実装タスクで実施）
- coverage gate 値（threshold）の引き上げ（policy 議論として別タスク）
- wave-2 タスク（`ut-web-cov-01`〜`04` + `ut-08a-01-public-use-case-coverage-hardening`）の再オープン・補修
- 既存 `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` の削除・移動（参照元として残す）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | wave-2 5 タスク（`ut-web-cov-01`〜`04` + `ut-08a-01-public-use-case-coverage-hardening`） | 各タスクの skill-feedback-report / phase-12 implementation-guide が backlog 入力 |
| 上流 | `vitest --coverage` 実行可能環境 | layer 別数値の input |
| 上流 | aiworkflow-requirements skill / references | roadmap link / active workflow 索引の更新先 |
| external gate | `.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` | indexes drift 判定 |
| 関連 | `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` | 元 unassigned-task spec（参照元・残す） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md | 元 unassigned-task spec（正本ソース） |
| 必須 | docs/30-workflows/completed-tasks/ut-web-cov-01-admin-components-coverage/ | wave-2 タスク evidence（current canonical root） |
| 必須 | docs/30-workflows/completed-tasks/ut-web-cov-02-public-components-coverage/ | wave-2 タスク evidence |
| 必須 | docs/30-workflows/completed-tasks/ut-web-cov-03-auth-fetch-lib-coverage/ | wave-2 タスク evidence |
| 必須 | docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/ | wave-2 タスク evidence |
| 必須 | docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/ | wave-2 タスク evidence（current canonical implementation root） |
| 必須 | .claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md | inventory 追記対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active workflow 索引追記対象 |
| 必須 | .github/workflows/verify-indexes.yml | indexes drift CI gate |
| 必須 | CLAUDE.md | indexes 再生成 / CI gate 方針 |
| 参考 | vitest.config.ts | coverage 計測 root config |
| 参考 | apps/web/package.json / apps/api/package.json / packages/*/package.json | `test:coverage` script と package 名 |

## AC（Acceptance Criteria）

- AC-1: 現行 coverage 数値レポート（`apps/web` / `apps/api` / `packages` を layer 別に line / branch / function で集計した markdown）が `outputs/phase-06/` または roadmap 本体内に存在する。
- AC-2: layer × coverage 種別の gap マッピング表（line/branch/function カバレッジ % + gap 箇所 + 委譲先）が `outputs/phase-06/` および `wave-3-roadmap.md` に存在する。
- AC-3: wave-3 候補タスクリスト（5〜10 件）が slug + 概要 + 推定規模 + 優先度根拠つきで `wave-3-roadmap.md` に存在する。
- AC-4: `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` および `task-workflow-active.md` から `wave-3-roadmap.md` が参照可能であり、active workflow 索引にエントリが追加されている。
- AC-5: `pnpm indexes:rebuild` 実行後の indexes に drift がない。`verify-indexes-up-to-date` CI gate は push / PR 後に green を確認する。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（layer 単位 vs wave 単位の整合）と AC-1〜5 確定、artifacts.json metadata 確定 |
| 2 | 用語・ドメイン定義 | phase-02.md | layer / gap-class / delegation-target / scoring axis 等のユビキタス言語固定 |
| 3 | 設計 | phase-03.md | layer 集計テンプレート、gap マッピング表スキーマ、wave-3 スコアリング基準（業務影響×規模×dependency） |
| 4 | wave-2 inventory 抽出 | phase-04.md | 既存 wave-2 5 タスクの skill-feedback-report / phase-12 implementation-guide からの backlog 抽出 |
| 5 | coverage 数値計測 | phase-05.md | `vitest --coverage` 実行コマンド・対象パッケージ・JSON 取得手順 |
| 6 | layer 別集計と gap マッピング | phase-06.md | layer 集計表生成、gap マッピング表充填 |
| 7 | NON_VISUAL backlog 集約 | phase-07.md | integration / e2e に委譲する箇所の集約とラベリング |
| 8 | wave-3 候補タスクリスト作成 | phase-08.md | 5〜10 件の slug + 概要 + 規模 + 優先度スコアリング |
| 9 | roadmap markdown 統合 | phase-09.md | `wave-3-roadmap.md` 本体組成、章立て・表埋め込み |
| 10 | aiworkflow references 反映 + indexes 再生成 | phase-10.md | inventory / active workflow 索引追記、`pnpm indexes:rebuild` 実行 |
| 11 | 実測 evidence | phase-11.md | NON_VISUAL: coverage JSON / verify-indexes CI green / link check evidence 保存 |
| 12 | ドキュメント・未タスク・スキルフィードバック | phase-12.md | implementation-guide / system-spec / 未タスク / skill feedback / compliance（7 ファイル） |
| 13 | PR 作成 | phase-13.md | approval gate / change-summary / pr-template / diff-to-pr 連携 |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/glossary.md
outputs/phase-03/main.md
outputs/phase-03/layer-aggregation-template.md
outputs/phase-03/gap-mapping-schema.md
outputs/phase-03/wave3-scoring-rubric.md
outputs/phase-04/main.md
outputs/phase-04/wave2-backlog-inventory.md
outputs/phase-05/main.md
outputs/phase-05/coverage-run-commands.md
outputs/phase-05/coverage-summary-web.json
outputs/phase-05/coverage-summary-api.json
outputs/phase-05/coverage-summary-packages.json
outputs/phase-06/main.md
outputs/phase-06/layer-aggregation.md
outputs/phase-06/gap-mapping.md
outputs/phase-07/main.md
outputs/phase-07/non-visual-backlog.md
outputs/phase-07/gap-mapping-resolved.md
outputs/phase-08/main.md
outputs/phase-08/wave3-candidate-tasks.md
outputs/phase-09/main.md
outputs/phase-09/wave-3-roadmap-draft.md
outputs/phase-10/main.md
outputs/phase-10/aiworkflow-references-diff.md
outputs/phase-10/indexes-rebuild-log.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/verify-indexes-current.md
outputs/phase-11/evidence/link-check.md
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
outputs/phase-13/pr-creation-result.md
```

最終成果物（リポジトリ反映分）:

```
docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md（新規）
.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md（編集）
.claude/skills/aiworkflow-requirements/references/task-workflow-active.md（編集）
.claude/skills/aiworkflow-requirements/indexes/*（pnpm indexes:rebuild により再生成）
vitest.config.ts（coverage 実測の isolated node-linker 解決補正）
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| CI | GitHub Actions `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` | indexes drift gate（read-only 確認のみ） |
| 静的検査 | `pnpm indexes:rebuild` | repo root | 既存 script |
| coverage 計測 | `mise exec -- pnpm --filter <pkg> test --coverage` | apps/web / apps/api / packages | 既存 vitest config 利用 |
| Secrets | （新規導入なし） | — | public artefact のみ |

## invariants touched

- なし（不変条件 #1〜#7 は本タスクの成果物（roadmap markdown / indexes）では直接触らない。Phase 1 で再確認）

## completion definition

- Phase 1〜10 が completed、Phase 11 で coverage JSON / local indexes verification / link check の evidence が保存済み
- `wave-3-roadmap.md` が AC-1〜3 を満たす形で `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` に配置済み
- aiworkflow-requirements references 2 ファイルから本 roadmap が参照可能（AC-4）
- `pnpm indexes:rebuild` 後の indexes に drift なし。`verify-indexes-up-to-date` green は Phase 13 user 承認後に取得（AC-5）
- root `artifacts.json` と `outputs/artifacts.json` の parity が保たれている
- Phase 12 の 7 ファイルが実体存在し compliance check PASS
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 13 phase 仕様書と outputs skeleton 整備済み、roadmap 未生成 | 不可 |
| measuring | coverage 計測実行中（Phase 5〜6） | 不可 |
| roadmap_drafted | `wave-3-roadmap.md` ドラフトと aiworkflow references diff 確定 | 不可 |
| implemented-local | roadmap 完成、Phase 1〜12 completed、local indexes verification 済み、Phase 13 approval gate 待ち | PR 前のローカル完了 |
| completed | implemented-local + Phase 13 user approval gate 完了 + PR/CI evidence 記録済み | 可 |

## 実行モード

sequential。Phase 5 の coverage 数値計測が Phase 6 の集計を技術的に前提とし、Phase 9 の roadmap 統合は Phase 4/6/7/8 の出力を統合するため、並列化できない部分が多い。仕様書作成は本サイクル内で完了する（CONST_007）。
