# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制（全 package 一律 / CI hard gate / ローカル auto-loop） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke / baseline 計測) |
| 次 Phase | 13 (PR 作成 / 3 段階適用) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL（CI gate + script + skill 正本同期） |
| user_approval_required | false（Phase 13 の PR 作成承認 / 3 段階 merge 承認とは独立） |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 5 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）に加え、phase12-task-spec-compliance-check.md と main.md を含む計 7 ファイルの生成責務を持ち、Phase 2 §トポロジ・§coverage-guard.sh I/O・§3 段階 PR 段取りと、aiworkflow-requirements 既存 80%/65% → 全 package 80% への正本切替差分を直列追跡する。責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 の成果物（要件定義 / 設計 / 設計レビュー / テスト戦略 / 実装ランブック / 異常系検証 / AC マトリクス / DRY / 品質保証 / 最終レビュー / baseline 手動 smoke）を、本タスクの限界（実 CI merge / branch protection contexts 登録は Phase 13 ユーザー承認後）に整合する形でドキュメント化する。

具体的には Phase 12 必須 5 成果物 + main.md + phase12-task-spec-compliance-check.md を出力し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了」する境界を明示する。実装ガイドは中学生レベル（Part 1）と開発者技術詳細（Part 2）の 2 部構成必須。

## 実行タスク（Phase 12 必須 5 タスク + 索引 + compliance check）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2 判定）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（current / baseline 分離）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（3 観点必須）** — `outputs/phase-12/skill-feedback-report.md`
6. **Phase 12 索引** — `outputs/phase-12/main.md`
7. **Phase 12 task spec compliance check** — `outputs/phase-12/phase12-task-spec-compliance-check.md`

## docs-only / spec_created モード適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/coverage-80-enforcement` 等 docs validator のみ。実コード関連の typecheck / lint / app test は対象外 |
| implementation-guide Part 2 | vitest config / coverage-guard.sh 関数シグネチャ / exit code / CI YAML / lefthook YAML / 3 段階 PR 段取りの commit / branch / merge コマンド例 |
| Step 1-B 実装状況 | `spec_created`（実 CI merge / branch protection contexts 登録は Phase 13 ユーザー承認後の別オペレーション） |
| Step 2 判定 | aiworkflow-requirements `quality-requirements-advanced.md` の既存 80%/65% → 全 package 80% への切替が REQUIRED |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 例え話）必須項目**:

- 「カバレッジって何？」: テストが「コードのうち何%を試したか」の通信簿。80% は「8 割以上を試したよ」という合格ライン
- 「なぜ 80%？」: 100% は神話（テスト不能領域がある）、60% は穴だらけ。80% は「重要分岐は通ってるが過剰でない」現実解
- 「auto-loop の動き」: テスト実行 → 警告（不足 top10 + 推奨 test ファイルパス）→ テスト追加 → 再実行 の繰り返しが「自分でループする」仕組み
- 専門用語の言い換え（threshold / lines / branches / functions / statements / pre-push hook / soft gate / hard gate / Codecov / lefthook）

**Part 2（開発者向け技術詳細）必須項目**:

| セクション | 内容 |
| --- | --- |
| vitest config | `coverage.provider='v8'` / `thresholds=80` / `include` / `exclude` / `perFile=false` の正本（Phase 2 §vitest.config.ts 更新仕様を再掲） |
| coverage-guard.sh 関数シグネチャ想定 | `parse_args` / `collect_summary` / `aggregate_pkg_pct` / `format_top10_failure` / `emit_test_template_paths` の I/O 仕様 |
| exit code | `0` PASS / `1` 閾値未達 or summary 欠損 / `2` 環境エラー（jq 未導入 / vitest 失敗）|
| CI YAML | `coverage-gate` job の soft (PR①: `continue-on-error: true`) / hard (PR③: 削除 + branch protection contexts 登録) |
| lefthook YAML | `pre-push.commands.coverage-guard` の `--changed` モード / `skip: [merge, rebase]` |
| 3 段階 PR 段取り | PR① / PR② (sub PR 複数) / PR③ の commit メッセージテンプレ / branch 命名 / merge 順序 / rollback 経路 |

> **Part 2 で扱わない事項**: Cloudflare 系の外部シークレット注入形式は本タスクと無関係（CODECOV_TOKEN は GitHub Secrets / 既存運用流用）。Cloudflare CLI ラッパー `scripts/cf.sh` は本タスクで使わない。実 PUT / 実 merge コマンドは「Phase 13 user 承認後のみ実行」と明記する。

### ステップ 2: システム仕様更新サマリー

`outputs/phase-12/system-spec-update-summary.md` に **Step 1-A/1-B/1-C + Step 2 判定**を記述。

**Step 1-A: 完了タスク記録 + 関連 doc + LOGS×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | coverage-80-enforcement Phase 1〜13 の `spec_created` 行追記 |
| `.claude/skills/task-specification-creator/LOGS.md` | NON_VISUAL Phase 12（Part 1/2 構成）の適用例として記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `quality-requirements-advanced.md` の coverage 80% 一律切替見出しを index 再生成で同期 |
| 親リンク | `task-specification-creator/references/coverage-standards.md` から coverage-guard.sh への参照追記設計を Phase 13 PR③ で実施 |

**Step 1-B: 実装状況テーブル更新**: `docs/30-workflows/LOGS.md` の coverage-80-enforcement 行を `spec_created`。

**Step 1-C: 関連タスクテーブル更新**: UT-GOV-001 / UT-GOV-004 / int-test-skill との双方向リンク。UT-GOV-004 完了が PR③ の `required_status_checks.contexts` 登録の上流前提である旨を Phase 1 / 2 / 3 / 11 / 12 で 5 重明記。

**Step 2: aiworkflow-requirements 仕様更新 = REQUIRED**

理由: 既存 `quality-requirements-advanced.md` L125-144 の package 別閾値（apps=80% / shared=65%）を全 package 一律 80% に切り替えるため、運用正本の更新は必須。詳細 diff は `system-spec-update-summary.md` に明記。

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に Step 1-A/1-B/1-C/Step 2 を**個別記録**。新規 / 編集 / 同期 / 追記の区分を明示。

### ステップ 4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` に **current / baseline 分離形式**で記述。本タスクで必ず含める current 5 件（U-1〜U-5）：

- U-1: Turborepo / Nx 導入による coverage cache（代替案 E）
- U-2: E2E（Playwright）導入で Next.js page を coverage に乗せる
- U-3: vitest workspace 移行（per-package config 統一）
- U-4: soft → hard 切替期限の cron リマインダ
- U-5: codecov.yml と vitest.config の閾値同期 lint

### ステップ 5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）テーブル必須。改善点なしでも「観察事項なし」で行を埋める。

### ステップ 6: Phase 12 索引

`outputs/phase-12/main.md` に 5 成果物 + compliance check + 完了判定を統合。

### ステップ 7: Phase 12 task spec compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` に必須 5 タスク / NON_VISUAL evidence / Phase 13 承認ゲート / aiworkflow-requirements 反映判定 / 4 条件チェックを記載。

## 統合テスト連携

NON_VISUAL implementation のため app 統合テストは対象外。Phase 11 の baseline 計測 evidence と Phase 12 の 7 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | outputs/phase-12/main.md | Phase 12 統合 index |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C と Step 2=REQUIRED |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴（個別記録） |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | U-1〜U-5 を必須含む |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | テンプレ準拠チェック |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12-detail.md | Phase 12 詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 / Part 1/2 詳細 |
| 必須 | .claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md | compliance check テンプレ |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-02/main.md | トポロジ / coverage-guard.sh 仕様の正本 |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC-1〜AC-14 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-12.md | NON_VISUAL Phase 12 構造リファレンス |

## 完了条件

- [ ] 必須 5 ファイル + main.md + compliance check（計 7 ファイル）が `outputs/phase-12/` 配下に揃う
- [ ] implementation-guide が Part 1（中学生レベル / 例え話 / 専門用語言い換え表）+ Part 2（vitest config / coverage-guard.sh 関数シグネチャ / exit code / CI YAML / lefthook YAML / 3 段階 PR コマンド例）構成
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C + Step 2 = REQUIRED（理由明記）と既存 80%/65% → 全 package 80% diff
- [ ] documentation-changelog に Step 1-A/1-B/1-C/Step 2 が個別記録
- [ ] unassigned-task-detection に U-1〜U-5 を必須包含し、current / baseline 分離
- [ ] skill-feedback-report が 3 観点テーブル必須
- [ ] Cloudflare 系の外部シークレット注入形式が implementation-guide に**含まれていない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**
- [ ] UT-GOV-004 完了前提が Phase 12 でも再掲されている（5 重明記の 5 箇所目）

## 検証コマンド

```bash
# 必須 7 ファイル確認
ls docs/30-workflows/coverage-80-enforcement/outputs/phase-12/

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-12/ \
  || echo "計画系 wording なし"

# Cloudflare 系の外部シークレット注入形式混入チェック（本タスク無関係のため 0 件期待）
rg -n "op://|secret URI" docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md \
  || echo "外部シークレット注入形式の混入なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md

# Step 1-A/B/C と Step 2 REQUIRED 確認
rg -n "Step 1-[ABC]|Step 2.*REQUIRED" docs/30-workflows/coverage-80-enforcement/outputs/phase-12/system-spec-update-summary.md

# U-1〜U-5 必須包含確認
rg -n "^\| U-[1-5] " docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md
```

## 苦戦防止メモ

1. **Cloudflare 系の外部シークレット注入形式を Part 2 に書かない**: 本タスクは GitHub CI / Vitest / lefthook の編集のみ。Cloudflare op シークレット注入は無関係。
2. **Part 1 の例え話で専門用語を残さない**: threshold / pre-push 等は必ず日常語へ言い換える。
3. **既存 codecov.yml と矛盾しない**: 既存 `project.target=80%` `patch.target=80%` `threshold=1%` と vitest config 80% の整合を system-spec-update-summary で確認。
4. **U-1〜U-5 を current 区分で必ず記載**: 既存タスクではないため baseline ではなく current。
5. **改善点なしでも skill-feedback-report 3 観点テーブル必須**。
6. **CI hard gate 化（PR③）の commit / merge は Phase 13 user 承認後のみ**: Phase 12 では仕様化のみ、実 push / merge / branch protection PUT は実施しない。
7. **UT-GOV-004 完了前提の N 重明記**: Phase 1 / 2 / 3 / Phase 11 / Phase 12 で 5 重明記。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / **user_approval_required: true**)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR① / PR② / PR③ description 草案の根拠
  - 必須 5 + 索引 + compliance の 7 成果物 PASS 判定 → Phase 13 承認ゲートの前提
  - unassigned-task-detection U-1〜U-5 → PR body の「related work」節
  - implementation-guide Part 2 の YAML / コマンド例 → Phase 13 pr1/pr2/pr3 runbook の正本
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - U-1〜U-5 のいずれかが unassigned-task-detection から欠落
  - 計画系 wording / 外部シークレット注入形式の混入
  - UT-GOV-004 完了前提の 5 重明記が崩れている
