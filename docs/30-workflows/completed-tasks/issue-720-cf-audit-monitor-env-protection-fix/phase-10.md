# Phase 10: リファクタ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リファクタ |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | completed |

## 目的

AC 全 PASS 後に、本タスクで生じた差分の構造的な改善余地を点検する。本タスクは workflow yaml 1 行削除のため大規模なリファクタ余地は無いが、以下の観点で簡素化 / 削除可能箇所を確認する。

## リファクタ候補

### 1. 他 monitor 系 workflow への適用可否確認

`cf-audit-log-7day-summary.yml` など他の集計系 / 監視系 workflow が `environment: production` を指定していないか確認し、指定がある場合は本タスクと同方針で削除する followup を切り出す。

```bash
grep -rn 'environment: production' .github/workflows/
```

期待: `cf-audit-log-monitor.yml` 以外で hit が出た場合は別 followup（本タスクスコープ外）として記録。

### 2. workflow yaml 全体の冗長性

L36-L146 を読み直し、以下を確認:

- 不要な step が無いか
- env mapping の重複が無いか
- `if-no-files-found: warn` 等の保守的設定が現在も妥当か

本タスクではこれらに踏み込まない（スコープ外）。改善余地があれば follow-up issue として登録するに留める。

### 3. ADR / runbook の文体統一

`15-infrastructure-runbook.md` 既存記述と新規追加セクションの heading レベル / 用語が揃っているか確認。

### 4. CLAUDE.md secret 管理ルールとの整合

「監視系 read-only secret に限定」原則が CLAUDE.md secret 管理セクションと衝突しないか確認。衝突が無いことを記録するだけで CLAUDE.md は更新しない（運用層は infrastructure runbook に集約）。

## 削除候補

なし。本タスクで追加するのは「workflow から 1 行削除」「runbook に 1 セクション追加」「ADR を accepted に昇格」のみで、削除すべき過剰な構造は存在しない。

## リファクタ実施判定

| 候補 | 実施 / 見送り | 理由 |
| --- | --- | --- |
| 1. 他 workflow への適用 | 見送り (followup) | スコープ外。grep 結果のみ記録 |
| 2. yaml 全体冗長性 | 見送り | スコープ外 |
| 3. 文体統一 | 実施 | runbook 追記時に既存スタイルに合わせる |
| 4. CLAUDE.md 整合確認 | 実施 (検証のみ) | 衝突無しを確認 |

## 実行タスク

- [ ] grep `environment: production` で他 workflow を列挙
- [ ] 結果を `outputs/phase-10/refactor-summary.md` に記録
- [ ] 文体統一のチェックを実施
- [ ] CLAUDE.md との整合性確認結果を記録

## 完了条件

- [ ] `outputs/phase-10/refactor-summary.md` が作成され、リファクタ実施判定が記録されている
- [ ] 他 workflow への波及候補が明示されている（followup 化判断含む）

## 次 Phase

- 次: 11 (NON_VISUAL evidence)
- 引き継ぎ事項: 他 workflow followup 候補があれば Phase 12 unassigned-task-detection に転記
