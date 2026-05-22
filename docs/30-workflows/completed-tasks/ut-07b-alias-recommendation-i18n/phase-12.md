# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | ドキュメント更新 |
| 必須成果物 | 7 ファイル |

## 目的

実装内容を実装ガイド（中学生レベル + 技術者レベル）に落とし込み、システム仕様 / ledger / LOGS / 未タスク検出 / skill feedback を全て同期する。

## 実行タスク

1. `implementation-guide.md` を Part 1（中学生レベル）+ Part 2（技術者向け）で作成する
2. `system-spec-update-summary.md` に Step 1-A / 1-B / 1-C / Step 2 の判定を記録する
3. `documentation-changelog.md` に全 Step の更新結果を列挙する
4. `unassigned-task-detection.md` を作成（0 件でも出力必須）
5. `skill-feedback-report.md` を作成（改善点なしでも出力必須）
6. `phase12-task-spec-compliance-check.md` で artifacts.json parity を diff 確認する
7. `completed-tasks/UT-07B-alias-recommendation-i18n-001.md` に source task の完了 trace を残す
8. LOGS.md × 2（aiworkflow-requirements / task-specification-creator）を更新する

## 必須成果物（strict 7）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | Part 1 + Part 2 |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-C + Step 2 判定 |
| `outputs/phase-12/documentation-changelog.md` | 全 Step 更新結果（該当なしも記録） |
| `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須 |
| `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力必須 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence |

## Task 12-1: 実装ガイド要点

**Part 1（中学生レベル）**: 「全角・半角・空白の表記揺れを揃えてから比較する」前処理を日常の例え話で説明。

**Part 2（技術者向け）**: 
- インターフェース: `export function normalizeLabelForCompare(s: string): string`
- 内部: `s.normalize("NFKC").trim().replace(/\s+/g, " ")`
- 適用ポイント: `recommendAliases` 内 `levenshtein` 両辺
- API contract: `GET /admin/schema/diff` の response shape 不変
- 視覚証跡: UI 変更なしのため Phase 11 screenshot 不要

## Task 12-2: システム仕様更新

| Step | 内容 |
| --- | --- |
| Step 1-A | task-workflow-completed.md / `unassigned-task/` → `completed-tasks/` 移動 / LOGS × 2 / topic-map |
| Step 1-B | aiworkflow-requirements references に「label 比較は NFKC + trim + whitespace 圧縮」を追記、status `completed` |
| Step 1-C | Issue #292 を closed、`UT-07B-schema-alias-hardening-001` との責務分離を明記 |
| Step 2 | `docs/00-getting-started-manual/specs/01-api-schema.md` に helper 名と振る舞いを 2-3 行追記 |

## Task 12-3: documentation-changelog.md

Step 1-A / 1-B / 1-C / Step 2 の結果を個別列挙。該当なしも明記。

## Task 12-4: 未タスク検出

| 観点 | 検出結果 |
| --- | --- |
| 元仕様書スコープ外 | 大小文字統一 / カタカナ↔ひらがな / 記号除去 / embedding ベース → 意図的にスコープ外。再オープン基準は admin 運用フィードバック待ち |
| Phase 3 / 10 MINOR | Phase 10 結果による |
| Phase 11 発見 | NON_VISUAL のため UI 発見なし |
| TODO/FIXME | 新規追加なし |

関連タスク差分: `UT-07B-schema-alias-hardening-001` は DB constraint / back-fill 強化を扱い、本タスクと重複なし。

## Task 12-5: skill-feedback-report.md

| 観点 | 記録 |
| --- | --- |
| テンプレ改善 | closed Issue × 実装未消化 を早期検出する仕組みが有用 |
| ワークフロー改善 | `audit-unassigned-tasks.js` で closed Issue の未実装検出を確認 |
| ドキュメント改善 | aiworkflow-requirements に再オープン基準を追記 |

## Task 12-6: artifacts parity

```bash
diff -q docs/30-workflows/ut-07b-alias-recommendation-i18n/artifacts.json \
        docs/30-workflows/ut-07b-alias-recommendation-i18n/outputs/artifacts.json
```

## 参照資料

- `outputs/phase-01/` 〜 `outputs/phase-11/` 全成果物
- `apps/api/src/services/aliasRecommendation.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/30-workflows/completed-tasks/UT-07B-alias-recommendation-i18n-001.md`

## 成果物

上記 7 ファイルを `outputs/phase-12/` 配下に作成。

## 完了条件

- [x] strict 7 成果物すべて存在する
- [x] `artifacts.json` / `outputs/artifacts.json` parity 確認済み
- [x] `completed-tasks/UT-07B-alias-recommendation-i18n-001.md` へ移動済み
- [x] LOGS.md × 2 が更新済み
- [x] Step 2（spec 追記）が完了している
