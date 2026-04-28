# skill-ledger-a1-gitignore - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | skill-ledger-a1-gitignore |
| タスク名 | 自動生成 skill ledger の gitignore 化 |
| ディレクトリ | docs/30-workflows/skill-ledger-a1-gitignore |
| Wave | 0（infrastructure governance / merge-conflict 0 化） |
| 実行種別 | serial（A-2 完了後の単独 PR） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only（本ワークフロー = タスク仕様書作成。実 gitignore 適用は別タスク） |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |
| 既存タスク組み込み | task-conflict-prevention-skill-state-redesign Phase 5 runbook の派生実装タスク |
| 組み込み先 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md |
| GitHub Issue | #129 (CLOSED / spec_created で再起票) |

## 目的

`task-conflict-prevention-skill-state-redesign` Phase 5 で runbook 化された A-1 施策を、Phase 1〜13 の実行可能なタスク仕様書として `docs/30-workflows/skill-ledger-a1-gitignore/` 配下に固定する。実装ターゲットは「`.claude/skills/<skill>/indexes/keywords.json` / `index-meta.json` / `*.cache.json` / `LOGS.rendered.md` の `.gitignore` 化と untrack、hook の冪等ガード化、4 worktree 並列再生成 smoke で派生物 conflict 0 件」を運用の合格ラインとする。本ワークフロー自体は仕様書整備に閉じ、実 gitignore 適用は Phase 5 以降の別 PR で行う前提で粒度を区切る。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- A-2 完了を必須前提とする依存順序の明文化
- 4 worktree 並列再生成 smoke の検証コマンドの仕様レベル定義
- hook が tracked canonical を上書きしないという state ownership 境界の明文化

### 含まない

- 実 `.gitignore` への追記（Phase 5 実装ランブック以降）
- tracked 派生物の `git rm --cached` 実行（Phase 5 以降）
- post-commit / post-merge hook 実装本体（補助タスク T-6 task-skill-ledger-hooks）
- A-2（fragment 化）/ A-3（Progressive Disclosure 化）/ B-1（merge=union）の実施
- skill 改修ガイド (`task-specification-creator/SKILL.md`) への Anchor 追記（A-3 タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | task-skill-ledger-a2-fragment（A-2） | A-1 を A-2 より先に着手すると `LOGS.md` の履歴が gitignore 化で事故的に失われるため、A-2 で fragment / `_legacy.md` への退避が完了している必要がある |
| 上流 | task-conflict-prevention-skill-state-redesign Phase 5 | gitignore-runbook.md の「対象 glob」「ロールバック手順」の正本 |
| 並列 | task-skill-ledger-a3-progressive-disclosure（A-3） | skill 改修ガイドへの Anchor 追記は A-3 が担当。A-1 はその前段で派生物境界を確立 |
| 下流 | task-skill-ledger-b1-gitattributes（B-1） | A-1 untrack 後のファイル群に `merge=union` 等の attribute を設定するため A-1 完了が前提 |
| 下流 | task-skill-ledger-hooks（T-6） | 冪等 hook 本体実装。A-1 の hook ガード仕様を入力として継承 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md | 原典スペック（400 行）。本 workflow の Phase 1〜13 はこの内容の writable 版 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | Step 1〜4 とロールバック手順の正本 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/main.md | A-1 施策が派生物 / 正本境界に位置付けられた経緯 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 4 施策実装順序（A-2 → A-1 → A-3 → B-1） |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/unassigned-task-detection.md | T-1 (= A-1) の検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md | A-2 仕様（必須前提タスク） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 のテンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | skill ledger 系の repository 境界 |
| 参考 | https://git-scm.com/docs/gitignore | glob 解釈・優先度 |

## 受入条件 (AC)

- AC-1: `.gitignore` に Phase 5 runbook §Step 1 の glob（`indexes/keywords.json` / `indexes/index-meta.json` / `indexes/*.cache.json` / `LOGS.rendered.md`）が追加されている（仕様レベルで定義済み）。
- AC-2: tracked 派生物の棚卸しが「runbook 例示パス」ではなく実態（`git ls-files .claude/skills`）ベースで行われる旨が Phase 1 / 2 で固定されている。
- AC-3: A-2 完了を必須前提とする旨が Phase 1（前提）/ Phase 2（依存タスク順序）/ Phase 3（着手可否ゲートの NO-GO 条件）の 3 箇所で重複明記されている。
- AC-4: hook ガードが「tracked canonical を書かない」「未存在時のみ再生成する」冪等設計として state ownership 表に記載されている。
- AC-5: 4 worktree smoke のコマンド系列（`scripts/new-worktree.sh` × 2 + 並列 `generate-index.js` + `git merge --no-ff` × 2 + `git ls-files --unmerged | wc -l => 0`）が Phase 2 に固定されている。
- AC-6: ロールバック設計（`git add -f` で再追跡 / `revert(skill): re-track A-1 ledger files` 1 コミット粒度）が Phase 2 / Phase 3 のレビュー対象に含まれている。
- AC-7: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- AC-8: Phase 3 で代替案（A: 純 gitignore / B: hook 単独で再生成 / C: submodule 分離 / D: A + hook 冪等化 = base case）の 4 案以上が PASS/MINOR/MAJOR で評価され、base case が PASS で確定している。
- AC-9: 4 worktree 並列開発で派生物由来の merge conflict が 0 件になる、という最終受入が Phase 1 の AC として固定されている。
- AC-10: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 の `status` は `completed`、Phase 4〜13 は `pending`。
- AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）がすべて PASS であることが Phase 1 と Phase 3 の双方で確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke test（4 worktree 検証） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / target globs / スコープ / AC / 4 条件評価） |
| 設計 | outputs/phase-02/main.md | トポロジ・SubAgent lane 4 本・ファイル変更計画・state ownership・ロールバック |
| レビュー | outputs/phase-03/main.md | 代替案 4 案以上比較・PASS/MINOR/MAJOR・着手可否ゲート（PASS with notes） |
| Phase 12 | outputs/phase-12/main.md | 必須 5 成果物の統合インデックス |
| Phase 12 | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 実装ガイド |
| Phase 12 | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C と Step 2=N/A の実態記録 |
| Phase 12 | outputs/phase-12/documentation-changelog.md | 実変更と N/A の更新履歴 |
| Phase 12 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離と T-6 未タスク作成記録 |
| Phase 12 | outputs/phase-12/skill-feedback-report.md | skill / workflow / docs への改善提案 |
| メタ | artifacts.json | Phase 1〜13 の機械可読サマリー |
| 仕様書 | phase-NN.md × 13 | Phase 別仕様（Phase 1〜3 のみ本ワークフローで作成、4〜13 は後続） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Git | gitignore / index 操作 | 無料 |
| GitHub | Issue #129 連携 | 無料枠 |
| lefthook | post-commit / post-merge hook の正本配置 | 無料 |
| pnpm | `pnpm indexes:rebuild` 経由で派生物再生成 | 無料 |

## Secrets 一覧

本タスクは Secret を導入しない。`.gitignore` / git index / hook script の編集のみで完結する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない（spec のみ）。違反なし |
| - | skill ledger は派生物 / 正本を分離する（task-conflict-prevention-skill-state-redesign Phase 5 で確立した repository 規約） | 本タスクは派生物 = `indexes/*.json` / `*.cache.json` / `LOGS.rendered.md` を git 非管理化することで規約を強化する |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）
- AC-1〜AC-11 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- A-2 完了が必須前提として 3 箇所（Phase 1 / 2 / 3）で重複明記されている
- 本ワークフローはタスク仕様書作成までで完了し、実 gitignore 適用は Phase 4 以降の別 PR で実施する旨が明文化されている

## 苦戦箇所・知見

**1. A-1 を A-2 より先に着手すると `LOGS.md` 履歴が事故的に失われる**
`LOGS.md` は append-only の正本であり、A-2 完了前に gitignore 化すると worktree 削除や別 PR の checkout で履歴が消える。原典スペック §9 で最重要苦戦箇所として明記されている。本ワークフローでは Phase 1（前提）/ Phase 2（依存タスク順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記して再発防止する。

**2. runbook 例示 glob と実態のズレ**
runbook は例示として特定 skill のパスを書いているが、実際は全 skill 横断で派生物棚卸しが必要。Phase 1 / Phase 2 で「`git ls-files .claude/skills` ベースの実態確認」を完了条件として固定する。

**3. hook が tracked canonical を書き続けて untrack が無効化されるリスク**
`git rm --cached` した直後に hook が再 add する循環を防ぐため、Phase 2 の state ownership 表で「hook は canonical を書かない」「未存在時のみ再生成」を境界として固定する。

**4. `.git/info/exclude` ではなく正本 `.gitignore` への記述**
`.git/info/exclude` はリポジトリ間で共有されないため、必ず正本 `.gitignore` を編集する。Phase 2 のファイル変更計画で `.gitignore` のみを編集対象として固定する。

**5. 4 worktree smoke の再現コスト**
`scripts/new-worktree.sh` で 2〜4 worktree を作るのは時間コストがかかる。Phase 2 では smoke コマンド系列を仕様レベルで固定し、実走は Phase 11 に委ねる。

## 関連リンク

- 上位 README: ../README.md
- 原典スペック: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/129
- Phase 5 runbook: ../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md
- 並列タスク仕様書群:
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md
