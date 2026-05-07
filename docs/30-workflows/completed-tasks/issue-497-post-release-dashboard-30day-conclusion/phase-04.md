# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 (issue-497) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-06 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | docs-only（test-strategy） |
| taskType | docs-only（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |
| 検証種別 | NON_VISUAL / docs-only / read-only |

## 目的

本タスクはコード変更を伴わず、`gh run list` の read-only 集計結果を `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に追記し、changelog 1 行を加えるのみで完結する。したがって unit / integration / e2e の自動テスト戦略は **N/A** とし、検証は (1) `gh run list` 集計の **再現性**、(2) `gh run view --log-failed` に対する **redaction grep の網羅性**、(3) skill references 追記の **markdown 整合性**、の 3 点を manual verification で固定することに絞る。

AC-1〜AC-11 のすべてを 30 日 gate / raw JSON 保存 / 集計表 / 根本原因分類 / redaction / 次アクション判断 / changelog / Issue CLOSED 据え置き の 8 軸で 100% カバーする検証戦略を本 Phase で確定する。

## 完了条件チェックリスト

- [ ] テストレベル戦略表（unit / integration / e2e / manual）が記述され、コード系は **N/A（コード変更なし）** と明記されている
- [ ] manual verification の 3 観点（再現性 / redaction 網羅性 / markdown lint）が AC と紐付いている
- [ ] 検証ツール（`gh` CLI / `jq` / `rg` / markdown lint）が列挙されている
- [ ] 検証カバレッジ目標が AC-1〜AC-11 全件 100% で明記されている
- [ ] evidence 種別（raw JSON / aggregation / redaction-grep log）が `outputs/phase-11/` 配下のパスで予約されている
- [ ] 不変条件への影響が「なし（コード変更なし）」で明記されている
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が PASS 判定で根拠付き

## 検証戦略詳細

### 1. テストレベル戦略

| 層 | 対象 | 環境 | 判定 |
| --- | --- | --- | --- |
| unit | — | — | **N/A（コード変更なし）** |
| integration | — | — | **N/A（コード変更なし）** |
| e2e | — | — | **N/A（コード変更なし）** |
| manual verification | (1) `gh run list` 集計の再現性、(2) `gh run view --log-failed` の redaction grep 網羅性、(3) skill references markdown 整合性 | 開発者ローカル + GitHub Actions（read-only） | 本タスクの主検証経路 |

> 本タスクは `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` への markdown 追記と `changelog/20260506-issue497-30day-feedback.md`への 1 行追加に閉じるため、コード経路の自動検証は不要。検証は manual の 3 観点で固定する。

### 2. manual verification 詳細

#### 2.1 `gh run list` 集計の再現性

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json conclusion,createdAt,databaseId,status` の出力 |
| 検証方法 | 同一コマンドを 2 回実行し、conclusion 分布表（成功 / 失敗 / cancelled / startup_failure / timed_out / action_required の件数）が一致することを確認 |
| 期待 | (a) 最古 run の `createdAt` ≦ 着手日 - 30 日、(b) `jq 'group_by(.conclusion) \| map({conclusion: .[0].conclusion, count: length})'` の出力が再実行で一致、(c) 件数 ≧ 30（日次 schedule × 30 日） |
| 関連 AC | AC-1, AC-2, AC-7 |

#### 2.2 redaction grep の網羅性

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `gh run view <id> --log-failed` の出力ファイル群 |
| 検証方法 | `rg -i "(token\|bearer\|secret\|Authorization)" outputs/phase-11/log-failed-*.log` を実行し、マッチ行が `outputs/phase-11/redaction-grep.log` に保存される |
| 期待 | (a) コマンドが exit 0 / exit 1 のいずれでも `redaction-grep.log` が生成されている、(b) マッチがあった場合は該当原文を skill references に **転記しない**（要約のみ）、(c) マッチがゼロの場合も log を保存して証跡化 |
| 関連 AC | AC-8 |

#### 2.3 skill references markdown 整合性

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（追記後）/ `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` |
| 検証方法 | (a) `rg -n "30 日実測\|30-day\|post-release-dashboard 実測" .claude/skills/aiworkflow-requirements/references/deployment-gha.md` で追記節がヒット、(b) 追加された節の見出し構造（`### 30 日実測 feedback (since YYYY-MM-DD)` + サブセクション 4 つ）が崩れていない、(c) markdown lint がある場合 PASS |
| 期待 | 30 日実測 feedback 節が deployment-gha.md の post-release-dashboard 章配下に存在し、conclusion 分布表 / failure 根本原因分類表 / 連続 failure 区間 / 次アクション判断の 4 サブセクションが揃う |
| 関連 AC | AC-2, AC-3, AC-4, AC-5, AC-6 |

### 3. 検証ツール

| ツール | 用途 |
| --- | --- |
| `gh` CLI | `gh run list` / `gh run view --log-failed` / `gh issue view` |
| `jq` | conclusion 分布集計 / failure run id 抽出 / 連続 failure 区間算出 |
| `rg` (ripgrep) | redaction grep / skill references 追記 grep / changelog 1 行確認 |
| markdown lint（任意） | skill references 追記後の整合確認（必須ではない / lint 設定があれば実施） |

### 4. 検証カバレッジ目標

| 範囲 | 目標 |
| --- | --- |
| AC カバレッジ | AC-1〜AC-11 全 11 件 100% |
| 30 日連続期間 | 最古 run `createdAt` ≦ 着手日 - 30 日（AC-1） |
| failure log redaction | `token` / `bearer` / `secret` / `Authorization` の 4 キーワード grep 実施（AC-8） |
| changelog 反映 | 1 行追加（AC-6） |
| Issue 状態 | `gh issue view 497 --json state` が `CLOSED`（AC-9） |

### 5. evidence 種別と保存パス

| 種別 | パス | 内容 |
| --- | --- | --- |
| raw JSON | `outputs/phase-11/post-release-dashboard-30d.json` | `gh run list --limit=80 --json conclusion,createdAt,databaseId,status` の生出力 |
| 集計 | `outputs/phase-11/aggregation.md` | conclusion 分布表 / failure 根本原因分類表 / 連続 failure 区間（jq 集計結果を markdown 化） |
| redaction | `outputs/phase-11/redaction-grep.log` | `rg -i "(token\|bearer\|secret\|Authorization)"` の grep 結果（マッチゼロでも保存） |
| 30 日 gate | `outputs/phase-11/30day-gate-check.log` | 最古 run `createdAt` ≦ 着手日 - 30 日 の判定 log |
| failure log（任意） | `outputs/phase-11/log-failed-<id>.log` | failure run ごとの `--log-failed` 出力（redaction 後参照用） |
| skill references diff | `outputs/phase-12/skill-references-diff.md` | deployment-gha.md / changelog/20260506-issue497-30day-feedback.md への追記 diff |

### 6. 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード変更ゼロ。markdown 追記とシェル read-only 操作のみ |

### 7. 検証コマンド一覧（参考 / 詳細は Phase 5）

```bash
# 30 日 gate 確認
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq '.[0].createdAt'

# raw JSON 取得
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status \
  > outputs/phase-11/post-release-dashboard-30d.json

# conclusion 分布集計
jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  outputs/phase-11/post-release-dashboard-30d.json

# redaction grep
rg -i "(token|bearer|secret|Authorization)" outputs/phase-11/log-failed-*.log \
  > outputs/phase-11/redaction-grep.log || true

# skill references 追記確認
rg -n "30 日実測|30-day|post-release-dashboard 実測" \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md

# Issue CLOSED 据え置き確認
gh issue view 497 --json state
```

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | manual 3 観点（再現性 / redaction 網羅性 / markdown 整合）で AC-1〜AC-11 全件をカバー。schedule 沈黙的失敗の早期検知ベースラインが確定する |
| 実現性 | PASS | `gh` / `jq` / `rg` のみで完結。CI / production / Cloudflare 副作用ゼロ |
| 整合性 | PASS | コード変更なしのため不変条件 #1〜#7 への影響ゼロ。CONST_004 例外条件適用済み |
| 運用性 | PASS | 後続実行者が Phase 5 runbook をそのまま実行すれば evidence が揃う粒度。10〜30 分で完了想定 |

## 受入条件（AC）

本 Phase は **AC-1（30 日 gate） / AC-2 / AC-3（集計表）/ AC-7（raw JSON 保存）/ AC-8（redaction）** の検証手段を確定する責務を担う。AC-4 / AC-5 / AC-6 / AC-9 は Phase 5 runbook 経由で確定し、本 Phase は manual verification の 3 観点として裏付ける。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC-1〜AC-11 正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` | 起票元仕様 / 実行手順 / 検証方法 |
| 必須 | `.github/workflows/post-release-dashboard.yml` | 対象 workflow（schedule UTC 00:00 日次） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先 references |
| 参考 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-04.md` | フォーマット参照 |

## 苦戦箇所【記入必須】

- コード変更がないため自動テスト層は全 N/A だが、検証戦略を「manual だけ」と書くと AC との対応が曖昧になる。本 Phase では manual verification を 3 観点（再現性 / redaction / markdown 整合）に分解し、各観点を AC と 1:N で紐付けることでトレーサビリティを担保した。
- redaction grep のマッチゼロ時に log を残さないと「実施した証跡」が消えるため、`|| true` で exit 1 を吸収しつつ常に `redaction-grep.log` を生成する運用に固定した。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-04/test-strategy.md` | manual verification 3 観点 / 検証ツール / カバレッジ目標 / evidence パス予約 / AC 対応表 |
| メタ | `artifacts.json` | Phase 4 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 5（仕様 runbook 作成 / 実行可能 step sequence）
- 引き継ぎ事項:
  - manual verification 3 観点と AC 紐付け
  - evidence パス予約（`outputs/phase-11/` 配下 5 種）
  - 検証コマンド一覧（gh / jq / rg）
  - redaction grep の `|| true` 運用ルール
- ブロック条件:
  - manual 3 観点のいずれかが AC と紐付いていない
  - evidence パスが Phase 11 / 12 の成果物パスと矛盾
  - 不変条件への影響が「なし」と明記されていない

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
