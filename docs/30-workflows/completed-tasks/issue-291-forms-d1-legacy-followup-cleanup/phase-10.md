# Phase 10: 最終レビュー

[実装区分: ドキュメントのみ]

**判定根拠**: go/no-go 判定のみで、runtime code 変更なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 7 AC マトリクスと Phase 9 品質保証結果を突合し、Phase 11（手動 smoke）→ Phase 12（ドキュメント更新）→ Phase 13（PR）へ進める準備が整っているかを最終判定する。

---

## 2. スコープ

### 対象

- Phase 7 AC マトリクス全件の達成判定
- Phase 9 scan 結果の go 判定
- MINOR 指摘の有無と未タスク化判断
- blocker（Phase 13 進行不可事項）の検出

### 対象外

- 新規 AC の追加（Phase 7 確定後の AC 追加は禁止）
- 実コミット / PR 作成（Phase 13）

---

## 3. 前提条件

- Phase 7 AC マトリクス確定済み
- Phase 9 品質保証全件 PASS

---

## 実行タスク

### 4.1 AC マトリクス突合

Phase 7 `ac-matrix.md` の全 AC（機能 8 + 品質 5 + ドキュメント 4 + recovery 3 + CONST_007 2 = 22 件）に対して PASS / FAIL を記録。

| カテゴリ | AC 数 | 期待 PASS |
|---------|-------|----------|
| 機能要件 | 8 | 8 |
| 品質要件 | 5 | 5 |
| ドキュメント要件 | 4 | 4 |
| recovery 要件 | 3 | 3 |
| CONST_007 | 2 | 2 |
| **合計** | **22** | **22** |

### 4.2 MINOR 指摘の検出と未タスク化判断

レビュー中に発見された改善余地を以下カテゴリで仕分け:

| 指摘種別 | 対応 |
|---------|------|
| CRITICAL（AC FAIL） | 本タスク内で修正、Phase 5 ランブックを再適用 |
| MAJOR（AC は PASS だが推奨改善あり） | 本タスク内で修正 OR Phase 12 unassigned-task-detection.md に必ず起票 |
| MINOR（"機能影響なし"） | 必ず unassigned-task-detection.md に起票（"機能影響なし"は不要判定の理由にならない） |

### 4.3 blocker 検出

| blocker 候補 | 判定 |
|-------------|------|
| `verify-pr-ready.sh` exit != 0 | Phase 13 進行不可。Phase 5/9 へ差し戻し |
| 3 物理タスクのうちいずれかが PR 進行中で逆リンク追記不可 | 進行中タスクは Phase 13 PR 本文の followup として明記し、本タスクは進める。04c / 09b は現 worktree に物理 root がないため ledger fallback で同期する |
| umbrella close-out 成果物自体に drift | 別 follow-up として unassigned-task-detection.md に起票し、本タスクは進める |

### 4.4 go/no-go 判定

- **go**: AC 22/22 PASS + blocker 0 件
- **conditional-go**: AC 22/22 PASS + MINOR/MAJOR が unassigned-task-detection.md に全件起票済み
- **no-go**: AC に FAIL 1 件以上、または CRITICAL blocker 検出

no-go の場合は該当 Phase に差し戻し、再実行後に本 phase を再度実施。

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-10/main.md` | レビュー結果サマリ |
| `outputs/phase-10/go-no-go.md` | AC 22 件の PASS/FAIL 表 + MINOR 起票一覧 + go/no-go 判定 |

---

## 完了条件

- [ ] AC 22 件の判定結果が記録済み
- [ ] MINOR/MAJOR 指摘が unassigned-task-detection.md 起票対象として列挙
- [ ] blocker 検出結果が記録済み
- [ ] go / conditional-go / no-go のいずれかを宣言
- [ ] `artifacts.json` phase 10 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| MINOR を「機能影響なし」で未起票にする | 機能影響なしは不要判定の理由にならないルールを徹底 |
| AC PASS の自己申告と scan 実測が乖離 | Phase 9 scan 出力（実測ログ）を AC PASS の根拠として添付 |
| no-go 判定後に差し戻し phase が不明確 | FAIL AC ごとに差し戻し先 phase を明記（例: AC-F-04 FAIL → Phase 5 ランブック再適用） |

---

## 参照資料

- Phase 7 `outputs/phase-07/ac-matrix.md`
- Phase 9 `outputs/phase-09/main.md`
- `.claude/skills/task-specification-creator/references/unassigned-task-guidelines.md`

---

## 9. 次フェーズへの引き継ぎ

go / conditional-go の場合は Phase 11 へ。no-go の場合は該当 Phase に差し戻し、修正後に Phase 9 と Phase 10 を再実施。
