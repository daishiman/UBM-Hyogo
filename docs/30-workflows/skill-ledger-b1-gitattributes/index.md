# skill-ledger-b1-gitattributes - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | skill-ledger-b1-gitattributes |
| タスク名 | append-only skill ledger への `merge=union` 適用 |
| ディレクトリ | docs/30-workflows/skill-ledger-b1-gitattributes |
| Wave | 0（infrastructure governance / merge-conflict 0 化） |
| 実行種別 | serial（A-1〜A-3 完了後の単独 PR） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only（本ワークフロー = タスク仕様書作成。実 `.gitattributes` 適用は別タスク） |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |
| 既存タスク組み込み | task-conflict-prevention-skill-state-redesign Phase 7 runbook の派生実装タスク |
| 組み込み先 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md |
| GitHub Issue | #132 (CLOSED / spec_created で再起票) |

## 目的

`task-conflict-prevention-skill-state-redesign` Phase 7 で runbook 化された B-1 施策を、Phase 1〜13 の実行可能なタスク仕様書として `docs/30-workflows/skill-ledger-b1-gitattributes/` 配下に固定する。実装ターゲットは「リポジトリルート `.gitattributes` に B-1 セクションを追記し、`**/_legacy.md` 系の行独立 append-only Markdown のみに `merge=union` を適用、JSON / YAML / `SKILL.md` / lockfile / コードファイルへの誤適用 0 件、4 worktree 並列追記 smoke で衝突 0 件、A-2 fragment 化完了時の解除手順を明文化」を運用の合格ラインとする。本ワークフロー自体は仕様書整備に閉じ、実 `.gitattributes` 適用は本 design workflow から派生する別実装タスクで行う前提で粒度を区切る。

B-1 は A-1〜A-3 が main にマージされた **後** に着手される最後の保険施策であり、A-2 fragment 化で吸収しきれない `_legacy.md` 系（移行猶予中の集約 ledger / 外部仕様で行独立に保たざるを得ない Markdown）に対して、Git ビルトインの `merge=union` ドライバを限定適用することで並列 worktree の追記行衝突を機械マージ可能にする。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- A-1 / A-2 / A-3 完了を必須前提とする依存順序の明文化
- 適用対象 path 列挙（`git ls-files '.claude/skills/**/_legacy.md'` ベース）の仕様レベル定義
- 行独立性判定基準（front matter / コードフェンス / JSON-YAML 構造体除外）の明文化
- 除外マトリクス（JSON / YAML / `SKILL.md` / lockfile / `pnpm-lock.yaml` / コード）の固定
- 4 worktree 並列追記 smoke の検証コマンド系列の仕様レベル定義
- A-2 fragment 化完了時の解除条件・解除手順の明文化（負債化防止）

### 含まない

- 実 `.gitattributes` への追記（派生実装タスクで実施）
- A-1（`indexes/*` の `.gitignore` 化）の実施
- A-2（fragment 化と render script）の実施
- A-3（SKILL.md の Progressive Disclosure 分割）の実施
- root `CHANGELOG.md` への適用（skill ledger 範疇外）
- `merge=union` 以外の merge driver（custom driver / `merge=ours` 等）の導入
- `_legacy.md` 命名規約違反の CI 検出スクリプト（A-2 完了後の補助タスク）
- skill 自身の現役 fragment（`LOGS/<timestamp>-*.md`）への driver 適用（fragment は元々衝突しないため対象外）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | task-skill-ledger-a1-gitignore（A-1） | 派生物の `.gitignore` 化が完了し、tracked canonical と派生物の境界が確立されている必要がある。境界が曖昧なまま B-1 を適用すると、driver が派生物にも当たる事故が起きる |
| 上流（必須） | task-skill-ledger-a2-fragment（A-2） | fragment 化と `_legacy.md` 退避が完了している必要がある。A-2 未完で B-1 を先行適用すると、本来 fragment 化される `LOGS.md` 等にまで driver が残り、解除コストが増えて二重管理になる |
| 上流（必須） | task-skill-ledger-a3-progressive-disclosure（A-3） | SKILL.md 分割で「適用しない `SKILL.md`」境界が明確化される必要がある。A-3 未完だと Progressive Disclosure 化途中の SKILL.md に driver を当てるリスクが残る |
| 上流参照 | task-conflict-prevention-skill-state-redesign Phase 7 | `gitattributes-runbook.md` の「対象 / 除外マトリクス」「ロールバック手順」の正本 |
| 上流参照 | task-conflict-prevention-skill-state-redesign Phase 2 | `gitattributes-pattern.md` の許可マトリクス（行独立 Markdown 限定の根拠） |
| 並列 | なし | B-1 は単独 PR。並列実行する姉妹タスクなし |
| 下流 | A-2 completion review | B-1 は実装順序上最後の保険施策だが、A-2 完了レビューで B-1 attribute 残存確認と解除可否判定を行う |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md | 原典スペック（約 390 行）。本 workflow の Phase 1〜13 はこの内容の writable 版 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/main.md | B-1 施策が「行独立 append-only ledger 限定保険」として位置付けられた経緯 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md | Step 1〜N とロールバック手順の正本 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md | 許可マトリクス / 除外マトリクスの正本 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 4 施策実装順序（A-2 → A-1 → A-3 → B-1） |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/skill-feedback-report.md | F-2 / F-3（skill 自身の `_legacy.md` 発生）に関するドッグフーディング知見 |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md | A-1 仕様（必須前提） |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md | A-2 仕様（必須前提） |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | A-3 仕様（必須前提） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 のテンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | https://git-scm.com/docs/gitattributes | `merge` attribute / `union` driver の挙動 |

## 受入条件 (AC)

- AC-1: `.gitattributes` に B-1 セクション（コメント + `merge=union` pattern 群）が追加され、リポジトリルート単一ファイルに閉じる構造で固定されている。
- AC-2: pattern が `**/_legacy.md` 系（`.claude/skills/**/_legacy.md` / `.claude/skills/**/LOGS/_legacy.md` / `.claude/skills/**/changelog/_legacy.md` / `.claude/skills/**/lessons-learned/_legacy*.md` 等）の **行独立 append-only Markdown のみ** に限定されており、`**/*.md` のような broad な glob を一切含まない。
- AC-3: JSON（`**/*.json` 全般 / `indexes/keywords.json` / `indexes/index-meta.json`） / YAML（`**/*.yaml` / `**/*.yml` / `lefthook.yml` / `wrangler.toml` 関連） / `**/SKILL.md` / lockfile（`pnpm-lock.yaml`） / コードファイル（`*.ts` / `*.tsx` / `*.js` / `*.json5`）に対して `git check-attr merge` が `unspecified` を返すことを Phase 2 / 3 の検証マトリクスで担保している。
- AC-4: A-1 / A-2 / A-3 完了を必須前提とする旨が Phase 1（前提）/ Phase 2（依存タスク順序 + state ownership）/ Phase 3（着手可否ゲートの NO-GO 条件）の 3 箇所で重複明記されている。
- AC-5: 4 worktree（最低 2 worktree、推奨 4 worktree）並列追記 smoke のコマンド系列（`scripts/new-worktree.sh` × N + 各 worktree から `_legacy.md` 末尾 1 行追記 + main で `git merge --no-ff` × N + `git ls-files --unmerged | wc -l => 0` + `grep` による全 worktree 追記行残存確認）が Phase 2 に固定されている。
- AC-6: 行独立性判定基準（front matter `^---$` / コードフェンス ` ``` ` / JSON-YAML 構造体 / インデント階層構造を持つもの）が Phase 1 の判定スクリプト仕様で明記され、対象から除外される。
- AC-7: A-2 fragment 化完了時の **解除条件**（A-2 完了レビュー時に該当 `_legacy.md` が空 / 退避済になった時点で `.gitattributes` の該当行を削除）と **解除手順**（`git revert` または対象行の削除コミット）が `.gitattributes` 内コメントおよび Phase 2 / 3 の解除設計セクションに明文化されている。
- AC-8: ロールバック設計（`.gitattributes` 該当行の `git revert` 1 コミット粒度。attribute は merge 時のみ作用するため既存ファイルへの副作用なし）が Phase 2 / Phase 3 のレビュー対象に含まれている。
- AC-9: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` / `priority: LOW` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- AC-10: Phase 3 で代替案（A: 純 `merge=union` 単一行 / B: skill-ledger 全体に `**/*.md` で広範適用 / C: custom merge driver / D: B-1 対象限定 + 解除手順明記 = base case）の 4 案以上が PASS/MINOR/MAJOR で評価され、base case D が PASS で確定している。
- AC-11: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 の `status` は `completed`、Phase 4〜13 は `pending`。4 条件（価値性 / 実現性 / 整合性 / 運用性）がすべて PASS であることが Phase 1 と Phase 3 の双方で確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test（4 worktree 検証） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | PR 作成 | phase-13.md | blocked | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / 適用対象 path / 行独立性判定基準 / スコープ / AC / 4 条件評価 / carry-over 確認） |
| 設計 | outputs/phase-02/main.md | トポロジ・ファイル変更計画（`.gitattributes` 単一）・pattern 設計（許可 / 除外マトリクス）・state ownership・SubAgent lane・validation path・4 worktree smoke 設計・ロールバック・解除手順 |
| レビュー | outputs/phase-03/main.md | 代替案 4 案以上比較・PASS/MINOR/MAJOR・着手可否ゲート（PASS with notes / NO-GO 条件 = A-1〜A-3 未完） |
| メタ | artifacts.json | Phase 1〜13 の機械可読サマリー |
| 仕様書 | phase-NN.md × 13 | Phase 別仕様（Phase 1〜3 の成果物本体を本ワークフローで作成し、4〜13 は派生実装タスク用の予約仕様として後続） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Git | `.gitattributes` / `merge=union` ドライバ / `git check-attr` | 無料 |
| GitHub | Issue #132 連携 | 無料枠 |
| lefthook | hook の正本配置（B-1 では新規 hook なし。既存 hook と attribute の独立性のみ確認） | 無料 |
| pnpm | 既存スクリプト（`pnpm typecheck` / `pnpm lint`）による副作用なし確認 | 無料 |

## Secrets 一覧

本タスクは Secret を導入しない。`.gitattributes` の追記のみで完結し、ランタイムシークレット / CI シークレット / 1Password 参照のいずれも追加・変更しない。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない（spec のみ）。違反なし |
| - | skill ledger は派生物 / 正本を分離する（task-conflict-prevention-skill-state-redesign Phase 5 / 7 で確立した repository 規約） | 本タスクは A-1 で確立された境界（派生物 = gitignore / canonical = tracked）を前提に、canonical のうち行独立 append-only Markdown に限定して `merge=union` を適用することで、規約の最終ピースを埋める |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜3 = `completed` / Phase 4〜12 = `pending` / Phase 13 = `blocked`）
- AC-1〜AC-11 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- A-1 / A-2 / A-3 完了が必須前提として 3 箇所（Phase 1 / 2 / 3）で重複明記されている
- 本ワークフローはタスク仕様書作成までで完了し、実 `.gitattributes` 適用は 派生実装タスク で実施する旨が明文化されている
- 解除条件・解除手順（A-2 fragment 化完了時に該当行を削除）が `.gitattributes` 内コメント仕様および Phase 2 / 3 で 2 重に明文化されている

## 苦戦箇所・知見

**1. JSON / YAML への glob 誤適用で構造体が静かに壊れるリスク**
`merge=union` は両 worktree の追記行をそのまま並べる行単位機械マージのため、JSON / YAML / lockfile に当てると構造体が静かに破損し人手で気付きにくい。原典スペック §7 / §9 で最重要苦戦箇所として明記。本ワークフローでは Phase 2 で除外マトリクスを `**/*.json` / `**/*.yaml` / `**/*.yml` / `**/SKILL.md` / `pnpm-lock.yaml` を含めて固定し、Phase 2 / 3 の検証で `git check-attr merge` が除外側で `unspecified` を返すことを必須化する。

**2. front matter 重複・順序逆転**
`merge=union` は front matter（`^---$`）を持つ Markdown に当てると `---` が重複したり順序が逆転して意味が壊れる。Phase 1 の行独立性判定基準で「front matter を持つ Markdown は対象外」を明記し、Phase 1 棚卸しで判定スクリプト（`grep -l '^---$'` 等）による除外を仕様化する。

**3. 行順非保証による時系列性破壊**
`merge=union` は行順を保証しないため、時系列性が必要な ledger（古い記録 → 新しい記録の順）には不適。これらは A-2 fragment 化（ファイル名 timestamp）で対応し、B-1 対象から除外する旨を Phase 1 / 2 で明文化する。

**4. A-2 完了後の負債化（解除忘れ）**
B-1 を入れた後 A-2 fragment 化で `_legacy.md` が空になっても `.gitattributes` 該当行を削除し忘れると、技術負債として永続する。Phase 2 / 3 で「`.gitattributes` 内コメントに解除条件と判定基準を明記」「A-2 完了レビューチェックリストに B-1 attribute 残存確認を追加」を解除設計として固定する。

**5. A-1〜A-3 未完での先行適用リスク**
B-1 を A-1〜A-3 より先に着手すると、本来 fragment 化される `LOGS.md` / 派生物境界未確立の skill 配下にまで driver が残り、二重管理化する。Phase 1 / 2 / 3 の 3 箇所で「A-1〜A-3 main マージ済み」を着手前提として重複明記し、Phase 3 では NO-GO 条件として明示する。

## 関連リンク

- 上位 README: ../README.md
- 原典スペック: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/132
- Phase 7 runbook: ../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md
- Phase 2 pattern: ../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md
- 上流タスク仕様書群:
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md
  - ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md
- 姉妹タスク原典: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md
