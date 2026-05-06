# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| GitHub Issue | #497（CLOSED 維持 / `Refs #497, Refs #351`） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-06 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

issue #497 は親タスク issue-351 の Phase 12 で `unassigned-task-detection.md` に検出され、起票元 `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` として形式化された follow-up である。本仕様書（issue-497 ディレクトリ）はその起票元 unassigned task spec を **正本（formalized task specification）** に昇格させる位置付けとなる。

本 Phase は、起票元 unassigned task spec / 親タスク issue-351 の Phase 12 検出記述 / `aiworkflow-requirements` skill references の 3 系統に **重複・矛盾** が残ったまま Phase 11 着手に進まないことを担保する。重複が残ると、後続実行者が「30 日 feedback の追記先 / runbook の正本 / 判定ロジック」をどの文書から読むべきかを判断できず、skill references への二重追記事故・matching not found 事故を誘発する。

implementation を伴わない docs-only タスクであるため、DRY 化対象は (1) 起票元 unassigned task spec の昇格境界、(2) 親 issue-351 Phase 12 の trace 追記、(3) skill references 単一追記章の 3 軸に絞る。

---

## DRY 化対象表

| # | 重複候補 | 削除方針 | 単一正本 | 適用範囲 |
| --- | --- | --- | --- | --- |
| 1 | 起票元 unassigned task spec（`docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md`）の runbook 記述 | 本仕様書 Phase 5（runbook）に **昇格**。起票元には「本仕様書（`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`）に昇格済み」trace を 1 行残し、runbook 本文は link 参照に縮約 | 本仕様書 `phase-05.md` | 起票元 unassigned task spec / 本仕様書 全 phase |
| 2 | 親タスク Phase 12 `unassigned-task-detection.md`（`docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`）の U-1 検出記述 | Phase 12 detection 表に「本仕様書（issue-497）にて formalize 済み」trace を追記。検出根拠はそのまま残し、formalize 後の正本 path を 1 行 link で示す | 本仕様書 `index.md` + 親 issue-351 Phase 12 detection 表 | 親 issue-351 Phase 12 outputs |
| 3 | `aiworkflow-requirements` skill references への 30 日 feedback 追記 | `references/deployment-gha.md` の **post-release-dashboard 章配下にのみ** 30 日 feedback サブ章を追加。他 references（api-endpoints.md / database-schema.md / task-workflow-active.md 等）には書かない | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | skill references 全体 |
| 4 | conclusion 分布 / failure root cause / 連続 failure 区間 / next-action 判断の表 | Phase 11 で取得する raw JSON（`outputs/phase-11/post-release-dashboard-30d.json`）が唯一の数値正本、Phase 12 system-spec-update-summary は集計済みサマリー転記のみ、skill references 追記は表のリンクなしで自己完結する markdown スナップショット | `outputs/phase-11/post-release-dashboard-30d.json` | 本仕様書全 phase + skill references |
| 5 | 30 日 gate 判定ロジック（最古 run createdAt vs 着手日 - 30 日） | 本仕様書 `phase-10.md`（Gate A）のみ正本。Phase 11 / Phase 12 は判定結果のみ参照、ロジック再記述しない | 本仕様書 `phase-10.md` | 本仕様書全 phase |
| 6 | redaction 対象 token 列挙（`token` / `bearer` / `secret` / `Authorization`） | `phase-04.md`（検証戦略）または `phase-06.md`（異常系）のいずれか 1 箇所のみ正本、他は link 参照 | 本仕様書 `phase-04.md` または `phase-06.md` | 本仕様書全 phase + skill references |

---

## 仕様間整合確認チェックリスト

- [ ] `artifacts.json` の `phases[*]` と `index.md` の Phase 一覧表が **Phase 番号 / 名称 / spec ファイル名** で完全一致
- [ ] `artifacts.json` の `ac` と `index.md` の AC 一覧（AC-1〜AC-11）が件数・内容で完全一致
- [ ] `aiworkflow-requirements` skill 正本（`references/deployment-gha.md` の post-release-dashboard 章 + `indexes/`）への影響が他 references（api-endpoints / database-schema / task-workflow-active 等）に **波及していない**
- [ ] GitHub Issue 番号「#497」と Refs 表記「`Refs #497, Refs #351`」が全 phase ファイル / index.md / artifacts.json で統一
- [ ] 起票元 unassigned task spec の status が「formalized」trace 1 行で更新されている（本タスクの Phase 12 ドキュメント更新で実施予定）
- [ ] 親 issue-351 Phase 12 `unassigned-task-detection.md` の U-1 行に「本仕様書にて formalize 済み」trace 追記が予定されている（本タスクの Phase 12 で実施予定）
- [ ] skill references に追記する 30 日 feedback サブ章の見出し / 表構造が `references/deployment-gha.md` の既存 markdown 規約（テーブル列順 / 見出しレベル）と整合している

---

## DRY 違反検出コマンド例

```bash
# 30 日連続 / post-release-dashboard 30 日関連の記述が複数 references に
# 散らばっていないかを機械検証する
rg -n "30 日連続|post-release-dashboard.*30" docs/30-workflows/ \
  .claude/skills/aiworkflow-requirements/

# Refs 表記の統一確認（#497 / #351 / Refs 表記の drift 検出）
rg -n "#497|#351|Closes #497" docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/

# skill references への波及範囲確認（deployment-gha.md 以外への
# 30 日 feedback 追記が混入していないかを検出）
rg -n "30 日 feedback|30-day feedback|conclusion 分布" \
  .claude/skills/aiworkflow-requirements/references/
```

期待される結果:

- 1 つ目: 本仕様書配下と `references/deployment-gha.md` のみに hits、他は 0 件
- 2 つ目: PR 文面方針が `Refs #497, Refs #351` で統一、`Closes #497` 0 件
- 3 つ目: `deployment-gha.md` 以外の references で 0 件

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | コード変更なし・docs-only タスクのため、不変条件 1〜7 すべてに影響しない |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 起票元 unassigned task / 親 issue-351 Phase 12 / skill references の 3 系統重複を整理し、後続実行者が 30 日 feedback を skill references の単一章に追記する経路を確定 |
| 実現性 | PASS | grep + 文書追記のみで完結、新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 への影響なし、CONST_004 例外（docs-only）と整合 |
| 運用性 | PASS | DRY 違反検出 grep コマンドが Phase 9 機械検証として再利用可能 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（昇格境界 / 親 trace / skill references 単一章 / 違反検出 grep 結果） |
| メタ | artifacts.json | Phase 8 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] DRY 化対象表（6 件）すべてに単一正本 path が指定されている
- [ ] 仕様間整合確認チェックリスト 7 項目すべて確認済み
- [ ] DRY 違反検出 grep が想定結果（他 references 波及 0 件）を返す
- [ ] 起票元 unassigned task spec への trace 追記方針が Phase 12 引き渡し条件として記述
- [ ] 親 issue-351 Phase 12 detection 表への trace 追記方針が Phase 12 引き渡し条件として記述
- [ ] outputs/phase-08/main.md が作成済み

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、変更対象は markdown ファイルのみ。

---

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項: DRY 化済み単一正本 path 表（Phase 9 link 検証 / 用語統一の前提）、skill references 単一追記章の方針、起票元 / 親 Phase 12 への trace 追記計画
- ブロック条件: skill references への波及範囲が `deployment-gha.md` を超える / 起票元 spec への trace 追記計画が未確定 / Refs 表記が `Refs #497, Refs #351` で統一されていない

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
