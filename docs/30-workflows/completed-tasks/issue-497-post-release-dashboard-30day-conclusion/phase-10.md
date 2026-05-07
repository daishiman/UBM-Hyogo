# Phase 10: 最終レビューゲート / 30 日 gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| GitHub Issue | #497（CLOSED 維持 / 再 OPEN しない / `Refs #497, Refs #351`） |
| Phase 番号 | 10 / 13（**Gate Phase**） |
| Phase 名称 | 最終レビューゲート / 30 日 gate |
| 作成日 | 2026-05-06 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証 / NON_VISUAL 縮約 / 30 日 gh run 集計実行） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

Phase 1〜9 の成果（要件 / 設計 / 検証戦略 / runbook / 異常系 / AC マトリクス / DRY 化 / QA）を横断レビューし、Phase 11 着手の **3 つの gate** を通過するかを確定する:

- **Gate A: 30 日 gate**（外部時間依存）
- **Gate B: 設計レビュー再確認**
- **Gate C: user_approval**（commit / push / PR は user-gated）

本タスクは外部時間依存（main merge of issue-351 + 30 日経過）であり、Phase 10 で Gate A が DEFER となった場合は Phase 11 以降を実施せず、仕様書を `spec_created` のまま据え置く。

---

## Gate A: 30 日 gate（外部時間依存）

### 判定コマンド

```bash
# 取得範囲内の schedule run だけを対象に、最古 run の createdAt（UTC ISO8601）を取得
RUNS=$(gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt,event,status,conclusion,databaseId,updatedAt)
COUNT=$(jq '[.[] | select(.event=="schedule")] | length' <<<"$RUNS")
OLDEST=$(jq -r '[.[] | select(.event=="schedule")] | min_by(.createdAt) | .createdAt // empty' <<<"$RUNS")

# 着手日 - 30 日 を threshold として算出（macOS / GNU date）
THRESHOLD=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)

# 比較（schedule run が 30 件以上、かつ OLDEST <= THRESHOLD なら PASS 候補）
if [ "$COUNT" -eq 0 ] || [ -z "$OLDEST" ]; then
  echo "FAIL: no schedule runs found"
elif [ "$COUNT" -lt 30 ]; then
  echo "DEFER: schedule run count is $COUNT (< 30)"
elif [ "$OLDEST" \< "$THRESHOLD" ] || [ "$OLDEST" = "$THRESHOLD" ]; then
  echo "PASS_CANDIDATE: OLDEST=$OLDEST THRESHOLD=$THRESHOLD COUNT=$COUNT"
else
  echo "DEFER: OLDEST=$OLDEST THRESHOLD=$THRESHOLD COUNT=$COUNT"
fi
```

### 判定結果と分岐

| 結果 | 条件 | アクション |
| --- | --- | --- |
| **PASS_CANDIDATE** | schedule run `COUNT >= 30` かつ `OLDEST <= THRESHOLD` | Phase 11 着手可。ただし step 2 で日次 gap 0 を確認してから runtime PASS 判定へ進む |
| **DEFER（30 日未達）** | `COUNT < 30` または `OLDEST > THRESHOLD` | 仕様書を `spec_created` 据え置きで close。再起動条件: schedule run count 30 件以上かつ最古 `createdAt` ≦ 着手日 - 30 日 |
| **FAIL（取得失敗）** | `gh run list` が 0 件 / schedule run 0 件 / API エラー | workflow file (`.github/workflows/post-release-dashboard.yml`) の存在 / schedule 設定 / main 反映 / token 権限を再確認。原因解消後に再判定 |

### DEFER 時の据え置きルール

- Issue #497 は CLOSED のまま維持（再 OPEN しない）
- `artifacts.json` の `phases[*].status` は `spec_created` のまま据え置き
- DEFER 判定日 + 再起動条件を `outputs/phase-10/gate-a-defer.md` に記録（任意）
- 再起動時は本 Phase から再開、Phase 1〜9 は再実行不要

---

## Gate B: 設計レビュー再確認

### 確認項目

- [ ] **Phase 1〜9 が AC-1〜AC-11 を網羅**: AC マトリクス（Phase 7）の全 AC が Phase 1〜9 のいずれかの成果物で達成可能（空セル 0）
- [ ] **redaction 戦略が決定済み**: 対象 token（`token` / `bearer` / `secret` / `Authorization`）+ 適用箇所（`outputs/phase-11/redaction-grep.log` 取得 → skill references 転記前確認）が `phase-04.md` または `phase-06.md` に記述
- [ ] **next-action 分岐が決定済み**: failure 比率閾値 10% の `<` / `>=` 分岐（現状維持 / 別 unassigned task 起票）が `phase-05.md` runbook に記述
- [ ] **7 必須 Phase 12 成果物の構造が定義済み**: `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の draft 構造（見出しレベル）が `outputs/phase-12/` に揃う見込み
- [ ] **DRY 違反 0**: Phase 8 検出 grep で skill references 波及が `deployment-gha.md` のみ
- [ ] **Refs 方針統一**: `Refs #497, Refs #351`（`Closes #497` 不採用）が全 phase で統一

判定: 全 6 項目充足で **PASS**、いずれか 1 件未充足で **NO-GO**（差し戻し先: 該当 phase）。

---

## Gate C: user_approval（commit / push / PR は user-gated）

- [ ] Phase 13 PR 作成は **明示承認後のみ**（ユーザーが「PR 作成」「diff-to-pr」等を明示するまで実行しない）
- [ ] GitHub Issue #497 は **CLOSED 据え置き**、再 OPEN しない方針を再確認
- [ ] PR 文面は `Refs #497, Refs #351`（`Closes #497` を採用しない）
- [ ] `git commit` / `git push` / `gh pr create` はユーザー明示承認後の操作

判定: 上記 4 項目すべて方針確認済みで **PASS**（実行はユーザー明示後）。

---

## 4 条件評価最終確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 30 日実測 feedback により schedule 沈黙的失敗（cron 停止 / token 失効 / GraphQL drift / retention 漏れ）の早期検知ベースラインが skill references に正本化される |
| 実現性 | PASS | `gh run list` + `jq` + markdown 追記のみで完結、新規ツール導入なし、コスト増 0 |
| 整合性 | PASS | 不変条件 1〜7 への影響 0、CONST_004 例外（docs-only）と整合、Phase 8 DRY 化で skill references 単一追記章を確定 |
| 運用性 | PASS | failure 比率に応じた next-action 分岐（< 10%: 現状維持 / >= 10%: 別 unassigned task 起票）が runbook で明確、再起動条件も明文化 |

すべて PASS。

---

## ゲート結果テンプレ表

下記は Phase 10 実行時に `outputs/phase-10/gate-result.md` に記入するテンプレート。

| 項目 | 値 |
| --- | --- |
| 結論 | **PASS** / **NO-GO** / **DEFER（30 日未達）** のいずれか |
| Gate A 判定 | PASS / DEFER / FAIL（OLDEST / THRESHOLD 値を併記） |
| Gate B 判定 | PASS / NO-GO（差し戻し先 phase を併記） |
| Gate C 判定 | PASS（方針確認のみ、実行は user 明示後） |
| レビュー日 | YYYY-MM-DD |
| レビュアー | （担当者名） |
| 次アクション | Phase 11 着手 / 仕様書据え置き（再起動条件: …） / 該当 phase 差し戻し |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | コード変更なし・docs-only タスクのため、不変条件 1〜7 すべてに影響しない |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/gate-result.md | 3 Gate 判定結果（A: 30 日 gate / B: 設計レビュー / C: user_approval）+ 結論 + 次アクション |
| ドキュメント（任意） | outputs/phase-10/gate-a-defer.md | DEFER 時の判定日 + 再起動条件記録 |
| メタ | artifacts.json | Phase 10 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] Gate A 判定コマンドが実行され OLDEST / THRESHOLD 値が記録
- [ ] Gate A 結果が PASS / DEFER / FAIL のいずれかで明示
- [ ] Gate B の 6 項目すべてが PASS / NO-GO で評価
- [ ] Gate C の 4 項目すべてが方針確認済み
- [ ] 4 条件評価が全 PASS
- [ ] ゲート結果テンプレ表に従い `outputs/phase-10/gate-result.md` 作成
- [ ] DEFER 時は据え置きルール（Issue CLOSED 維持 / artifacts.json `spec_created` 据え置き / 再起動条件明記）が記録

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、コード単体テスト・統合テスト・E2E テストは存在しない。

---

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証 / NON_VISUAL 縮約 / 30 日 gh run 集計実行）— ただし Gate A が DEFER の場合は実施せず据え置き
- 引き継ぎ事項:
  - Gate A 判定結果（PASS なら Phase 11 着手可）
  - Gate B 設計レビュー結果（差し戻し 0 で Phase 11 へ）
  - Gate C user_approval 方針（Phase 13 まで保留）
  - 再起動条件（DEFER 時のみ）
- ブロック条件:
  - Gate A が DEFER（30 日未達）→ 仕様書据え置き、Phase 11 以降は実行しない
  - Gate B のいずれかが NO-GO → 該当 phase に差し戻し
  - Gate C 方針が未確認 → Phase 13 PR 作成不可

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
