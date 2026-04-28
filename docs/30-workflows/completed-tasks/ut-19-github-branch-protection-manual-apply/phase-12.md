# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | completed |
| タスク種別 | docs-only / `spec_created` |

## 目的

本タスク（UT-19）は **docs-only / `spec_created`** タイプであり、Phase 12 close-out では **task-specification-creator skill SKILL.md の Phase 12 規定**に従って Task 1〜5 を全て完遂する。`spec_created` UI task の Phase 12 close-out ルール（Step 1-A〜1-C を **N/A にしない** same-wave sync）を遵守し、`deployment-branch-strategy.md` への適用結果反映と、後続 UT-05 / UT-06 への引き継ぎを確定させる。

## docs-only / spec_created close-out ルール【必須遵守】

| Step | 本タスクでの扱い | 根拠 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 + LOGS.md ×2 + topic-map.md を same-wave 更新（**N/A 不可**） | SKILL.md「`spec_created` UI task の Phase 12 close-out ルール」 |
| Step 1-B | 実装状況テーブルに `spec_created` を記録（`completed` ではない） | 同上 |
| Step 1-C | 関連タスクテーブルのステータスを current facts へ更新 | 同上 |
| Step 2 | 新規インターフェース追加なし → N/A。ただし `deployment-branch-strategy.md` への **適用結果反映**は必要 | 設定値の正本同期のため |

## 実行タスク（Task 1〜5）

- **Task 1**: 実装ガイド（Part 1 中学生レベル / Part 2 技術者レベル）の作成
- **Task 2**: システム仕様更新（Step 1-A / 1-B / 1-C / Step 2）
- **Task 3**: documentation-changelog の作成
- **Task 4**: unassigned-task-detection の作成（**0 件でも出力必須**）
- **Task 5**: skill-feedback-report の作成（**改善点なしでも出力必須**）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 規定 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A〜1-C 同期ルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド Part 1/2 構成 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | 適用結果反映先 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/apply-execution-log.md | 適用結果の正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-11/manual-smoke-log.md | smoke test 結果 |

## 実行手順

### ステップ 1: Task 1 実装ガイド作成（Part 1 / Part 2）

- `outputs/phase-12/implementation-guide.md` を作成する
- Part 1（中学生レベル）に日常の例え話を必ず含める
- Part 2（技術者レベル）に `gh api` ペイロード・JSON スキーマ・コマンド例を含める

### ステップ 2: Task 2 システム仕様更新（Step 1-A / 1-B / 1-C / Step 2）

- Step 1-A: 完了タスク記録 + `aiworkflow-requirements/LOGS.md` + `task-specification-creator/LOGS.md` + `topic-map.md` を same-wave 更新
- Step 1-B: 実装状況テーブルに `spec_created` を記録
- Step 1-C: 関連タスクテーブル（UT-05 / UT-06 / 01a）のステータス更新
- Step 2: `deployment-branch-strategy.md` に「UT-19 適用予定/証跡リンク」セクション追加（実適用後に結果値へ更新）

### ステップ 3: Task 3 documentation-changelog 作成

- 全変更ファイルを Step ごとに分けて記録（workflow-local sync と global skill sync を別ブロック）
- `outputs/phase-12/documentation-changelog.md` に出力

### ステップ 4: Task 4 unassigned-task-detection 作成（0 件でも出力）

- スコープ外項目・MINOR 指摘・コードコメント TODO を走査
- 0 件の場合も「検出 0 件」を明記したファイルを出力

### ステップ 5: Task 5 skill-feedback-report 作成（改善点なしでも出力）

- テンプレート / ワークフロー / ドキュメント観点でフィードバックを記録
- 改善点なしの場合も「改善点なし」を明記したファイルを出力

## Task 1: 実装ガイド構成【必須】

### Part 1（中学生レベル）の必須要素

| 要素 | 内容例 |
| --- | --- |
| 例え話 | 「学校で先生が貼った『この棚は触らないで』のシールがブランチ保護です。シールが貼ってある棚（`main` / `dev`）には、決められた手続き（CI チェック）を通った人しか物を入れられません」 |
| なぜ必要か | 「うっかりミスで本番が壊れるのを防ぐため。シールがないと誰でも勝手に書き換えられてしまう」 |
| 何をするか | 「`main` と `dev` という大事な棚に『CI が成功した PR だけ』というシールを貼る」 |
| 個人開発の特例 | 「先生（レビュアー）が自分一人なので『他の先生のサインが必要』というルールは外す。ただしシールそのものは外さない」 |

### Part 2（技術者レベル）の必須要素

| 要素 | 内容 |
| --- | --- |
| `gh api` payload (main) | `PUT /repos/:owner/:repo/branches/main/protection` の JSON body 全文 |
| `gh api` payload (dev) | 同上 dev 版 |
| 期待 response スキーマ | `required_status_checks.contexts[]` / `required_pull_request_reviews.required_approving_review_count: 0` / `allow_force_pushes.enabled: false` / `allow_deletions.enabled: false` |
| Environments 設定 | UI 操作手順 + `gh api` での検証コマンド |
| 適用前後の検証コマンド | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq` |
| エラーハンドリング | 422 (status check 未登録) / 403 (権限不足) / 404 (branch 不在) |
| 設定可能パラメータ一覧 | `enforce_admins` / `lock_branch` / `required_linear_history` 等 |

## Task 2: システム仕様更新【必須】

### Step 1-A: 完了タスク記録 + LOGS.md ×2 + topic-map.md

| 対象ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-19 完了エントリ追加（`spec_created`） |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-19 仕様書化完了エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | branch protection / Environments トピック行を追加または更新 |

### Step 1-B: 実装状況テーブル更新

| テーブル | 旧ステータス | 新ステータス |
| --- | --- | --- |
| 01a-parallel-github-and-branch-governance 配下の「branch protection 適用」 | 未実装 | `spec_created`（UT-19 で仕様書化） |
| `deployment-core.md` の「CI ゲート確定」 | 未適用 | `spec_created` + 適用予定証跡リンク |

### Step 1-C: 関連タスクテーブル更新

| 仕様書 | 更新対象テーブル | 更新内容 |
| --- | --- | --- |
| 01a Phase 12 unassigned-task-detection.md | UT-19 行 | `unassigned` → `spec_created` |
| UT-05 index.md（存在すれば） | 上流依存 | CI context 登録確認が UT-19 の上流条件であることを反映 |
| UT-06 index.md（存在すれば） | 上流依存 | branch protection 適用完了後に本番デプロイ前提が満たされることを反映 |

### Step 2: 適用結果反映（新規インターフェース追加なし → 部分適用）

| 対象 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | 「UT-19 適用予定/証跡リンク」セクション追加。実適用後に `required_status_checks.contexts` 実値・`required_approving_review_count: 0` を記録 |
| 新規インターフェース | なし → N/A |

## Task 3: documentation-changelog【必須】

| 日付 | Step | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- | --- |
| 2026-04-27 | Step 1-A | 追加 | aiworkflow-requirements/LOGS.md | UT-19 完了エントリ |
| 2026-04-27 | Step 1-A | 追加 | task-specification-creator/LOGS.md | UT-19 仕様書化エントリ |
| 2026-04-27 | Step 1-A | 更新 | topic-map.md | branch protection 行更新 |
| 2026-04-27 | Step 1-B | 更新 | 01a 実装状況テーブル | `spec_created` 反映 |
| 2026-04-27 | Step 1-C | 更新 | 01a Phase 12 unassigned-task-detection.md | UT-19 ステータス更新 |
| 2026-04-27 | Step 2 | 追加 | deployment-branch-strategy.md | UT-19 適用予定/証跡リンクセクション追加 |
| 2026-04-27 | Phase 12 | 新規 | outputs/phase-12/*.md | Task 1〜5 全成果物 |

> workflow-local sync（本タスク配下）と global skill sync（`.claude/skills/...`）を別ブロックで記録すること。

## Task 4: unassigned-task-detection（0 件でも出力必須）【必須】

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| (該当があれば記録) | - | - | - |

> 0 件の場合は「検出 0 件。Phase 10 MINOR 指摘・スコープ外項目・コードコメント TODO のいずれもなし」と明記する。

## Task 5: skill-feedback-report（改善点なしでも出力必須）【必須】

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレート | docs-only / spec_created で Phase 11 NON_VISUAL の必須 3 点セットが SKILL.md に明記され適切 | 維持 |
| ワークフロー | 422 エラー回避（CI 1 回先行実行）が SKILL.md の苦戦防止 Tips にあると Phase 4 設計が容易 | 検討 |
| ドキュメント | `gh api` payload テンプレートを `references/deployment-branch-strategy.md` に直接埋め込むと再利用性向上 | 検討 |

> 改善点なしの場合も「改善点なし」を明記したセクションを残す。

## phase12-task-spec-compliance-check【必須】

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| Task 1 implementation-guide が Part 1/2 を満たす | Part 1 に例え話、Part 2 に gh api payload を含む | pending |
| Task 2 Step 1-A 〜 1-C が全て実施されている | `spec_created` でも N/A にしない | pending |
| Task 2 Step 2 適用結果反映が完了している | deployment-branch-strategy.md に追記済み | pending |
| Task 3 documentation-changelog が全 Step を網羅 | workflow-local / global を別ブロック | pending |
| Task 4 unassigned-task-detection が出力されている | 0 件でもファイル存在 | pending |
| Task 5 skill-feedback-report が出力されている | 改善点なしでもファイル存在 | pending |
| LOGS.md ×2 同時更新 | aiworkflow + task-specification-creator | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 適用結果（apply-execution-log.md）を deployment-branch-strategy.md へ反映 |
| Phase 11 | manual-smoke-log の結果を documentation-changelog に記録 |
| Phase 13 | Phase 12 の全成果物一覧を PR の change-summary に引き継ぐ |

## 多角的チェック観点（AIが判断）

- 価値性: 実装ガイド Part 1 で非エンジニアでも branch protection の意図を理解できるか。Part 2 で UT-05 / UT-06 着手者が即座に再適用できるか。
- 実現性: docs-only / spec_created の Step 1-A〜1-C が N/A にされず実行されているか。
- 整合性: documentation-changelog が全 Step + global sync を網羅し、`outputs/phase-12/` 実体と 1 対 1 で突合できるか。
- 運用性: 個人開発前提（承認不要・enforce_admins=false）が将来チーム化時の差し替え点として明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Task 1 implementation-guide.md (Part 1/2) | 12 | pending | 例え話 + gh api payload |
| 2 | Task 2 Step 1-A LOGS.md ×2 + topic-map | 12 | pending | same-wave sync |
| 3 | Task 2 Step 1-B 実装状況テーブル | 12 | pending | `spec_created` 記録 |
| 4 | Task 2 Step 1-C 関連タスクテーブル | 12 | pending | UT-05 / UT-06 / 01a 更新 |
| 5 | Task 2 Step 2 deployment-branch-strategy.md 反映 | 12 | pending | 適用結果セクション追加 |
| 6 | Task 3 documentation-changelog.md | 12 | pending | workflow-local / global 分離 |
| 7 | Task 4 unassigned-task-detection.md | 12 | pending | 0 件でも出力 |
| 8 | Task 5 skill-feedback-report.md | 12 | pending | 改善点なしでも出力 |
| 9 | phase12-task-spec-compliance-check | 12 | pending | 全項目 PASS |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part 1 中学生レベル / Part 2 技術者レベル） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | システム仕様更新サマリ（Step 1-A/1-B/1-C/Step 2） |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴（workflow-local / global 分離） |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート（0 件でも出力必須） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック（改善点なしでも出力必須） |
| メタ | artifacts.json | Phase 状態の更新（root + outputs 同期） |

## 完了条件

- Task 1 implementation-guide.md が Part 1 / Part 2 両方を満たしている
- Task 2 Step 1-A / 1-B / 1-C が `spec_created` でも N/A にされず全実施されている
- Task 2 Step 2 として `deployment-branch-strategy.md` へ適用結果反映が完了している
- Task 3 documentation-changelog が全 Step + global sync を網羅している
- Task 4 unassigned-task-detection が 0 件でも出力されている
- Task 5 skill-feedback-report が改善点なしでも出力されている
- phase12-task-spec-compliance-check の全項目が PASS である
- LOGS.md ×2（aiworkflow-requirements + task-specification-creator）が同時更新されている

## タスク100%実行確認【必須】

- 全実行タスク（Task 1〜5）が completed
- 全成果物（5 点）が指定パスに配置済み
- 全完了条件にチェック
- root `artifacts.json` と `outputs/artifacts.json` の二重 ledger が同期されている（UBM-005 対策）
- 異常系（Step 1-A〜1-C を N/A にしてしまうパターン）を回避している
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: Phase 12 全成果物一覧・documentation-changelog・変更ファイルリスト・compliance-check 結果を Phase 13 の change-summary に引き継ぐ。
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目がある場合 Phase 13 に進まない。
