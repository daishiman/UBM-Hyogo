# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| GitHub Issue | #497（CLOSED 維持 / `Refs #497, Refs #351`） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-06 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート / 30 日 gate 含む） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

docs-only / NON_VISUAL タスクとしての品質保証を行う。本タスクの成果物は `gh run list --workflow=post-release-dashboard.yml` の read-only 集計結果を `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に追記し、`changelog/20260506-issue497-30day-feedback.md`に 1 行追加することに完結する。コード変更を伴わないため、QA 観点は (1) markdown lint、(2) link 整合、(3) JSON 整合、(4) redaction、(5) 用語統一の 5 項目に絞り、Phase 10（30 日 gate）への引き渡し条件と Phase 11 着手前のセルフレビュー項目を確定する。

---

## 品質基準

| # | 基準 | 確認内容 | PASS 条件 |
| --- | --- | --- | --- |
| 1 | markdown lint | skill references 追記行が既存テーブル列と整合（列数・ヘッダ名・並び順が `references/deployment-gha.md` の post-release-dashboard 章既存表と一致） | markdown lint エラー 0 / 既存表構造保持 |
| 2 | link 整合 | 追記内に書く GitHub Actions run URL が `https://github.com/daishiman/UBM-Hyogo/actions/runs/<id>` の形式で valid（404 / リダイレクトなし） | run URL 全件で 200 OK |
| 3 | JSON 整合 | `outputs/phase-11/post-release-dashboard-30d.json` が `jq empty` でパース可能、かつ schema（配列 root、各要素に `databaseId`, `conclusion`, `status`, `createdAt`）を保持 | `jq empty <file>` 終了コード 0 |
| 4 | redaction | `outputs/phase-11/redaction-grep.log` 確認後、`token` / `bearer` / `secret` / `Authorization` の機微情報を skill references に **転記していない** | redaction grep で skill references 側に hits 0 件 |
| 5 | 用語統一 | 「conclusion」「failure rate」「連続 failure 区間」表記がすべての追記（references / changelog / outputs）で統一 | 表記 drift 0（同一概念の別表記が混在しない） |

### 品質基準確認コマンド例

```bash
# (1) markdown lint（プロジェクト規約に従う）
mise exec -- pnpm lint --filter docs 2>&1 || true

# (2) link 整合（GitHub Actions run URL）
rg -o "https://github\.com/daishiman/UBM-Hyogo/actions/runs/[0-9]+" \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md

# (3) JSON 整合
jq empty docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json

# (4) redaction（skill references への転記後）
rg -i "token|bearer|secret|authorization" \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md

# (5) 用語統一
rg -n "conclusion|failure rate|連続 failure" \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
  .claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/
```

---

## 品質ゲート（Phase 10 への引き渡し条件）

Phase 10（最終レビューゲート / 30 日 gate）に進むためには、以下のすべてが揃っている必要がある:

- [ ] 上記品質基準 5 項目すべて PASS
- [ ] AC マトリクス（Phase 7 で確定済み）の **全 AC（AC-1〜AC-11）が verifiable**（追記後の references / outputs / Issue 状態を見て真偽判定可能）
- [ ] Phase 12 で作成する 7 必須成果物（`implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）の **draft 構造** が `outputs/phase-12/` に揃う見込み（タイトル・主要見出しのみで可、本文は Phase 12 で執筆）

---

## セルフレビュー項目（後続実行者が Phase 11 着手前にチェック）

| # | チェック項目 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| 1 | 30 日 gate 判定ロジックの理解 | `phase-10.md` Gate A の「最古 run の `createdAt` ≦ 着手日 - 30 日」を読む | OLDEST <= THRESHOLD で PASS、それ以外は DEFER と即答できる |
| 2 | redaction 対象 token の理解 | `token` / `bearer` / `secret` / `Authorization` の 4 種を暗記 | grep 漏れなく redaction 適用可能 |
| 3 | failure rate 閾値 10% の next-action 分岐 | `< 10%`: 現状維持（追記のみ） / `>= 10%`: retry または alert 追加を **別 unassigned task で起票**（本タスクではトリガーのみ） | 分岐判断と起票要否を即答可能 |
| 4 | skill references 単一追記章の方針 | `references/deployment-gha.md` の post-release-dashboard 章配下にのみ追記、他 references に書かない | DRY 違反 grep で他 references hits 0 件を再確認 |
| 5 | Issue #497 / Refs 方針 | CLOSED 維持、再 OPEN しない、PR 文面は `Refs #497, Refs #351` | `Closes #497` を誤って書かない |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | コード変更なし・docs-only タスクのため、不変条件 1〜7 すべてに影響しない |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 5 項目の品質基準 + Phase 10 引き渡し条件 + Phase 11 セルフレビューにより、後続実行者が手戻り 0 で Phase 11 / 12 を実行可能 |
| 実現性 | PASS | markdown lint / `jq` / `rg` のみで完結、新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 への影響なし、CONST_004 例外（docs-only）と整合、Phase 8 DRY 化結果と矛盾なし |
| 運用性 | PASS | redaction / 用語統一が runbook の機械検証ステップとして再利用可能 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 品質基準 / 引き渡し条件 / セルフレビュー） |
| メタ | artifacts.json | Phase 9 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 品質基準 5 項目（markdown lint / link / JSON / redaction / 用語統一）すべて PASS 方針
- [ ] AC-1〜AC-11 全件が追記後に verifiable
- [ ] 7 必須 Phase 12 成果物の draft 構造が `outputs/phase-12/` に揃う見込み
- [ ] セルフレビュー 5 項目が phase-09 outputs に記述
- [ ] outputs/phase-09/main.md が作成済み

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、コード単体テスト・統合テスト・E2E テストは存在しない。品質保証は markdown / JSON / grep ベースの機械検証に置き換える。

---

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート / 30 日 gate 含む）
- 引き継ぎ事項: 5 品質基準の合否、AC verifiable 状態、7 必須 Phase 12 成果物 draft の存在、セルフレビュー 5 項目
- ブロック条件: 品質基準のいずれかが FAIL / AC が verifiable でない / 7 必須成果物 draft が揃わない見込み / redaction grep で機微情報混入が判明

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #497 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
