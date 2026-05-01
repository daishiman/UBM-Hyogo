# Phase 1 Output: 要件定義

## AC quantitative

| AC | 完了判定 | 必須 evidence |
| --- | --- | --- |
| AC-1 | local `/profile` logged-in 表示を目視確認できる | M-08-profile.png |
| AC-2 | local read-only DOM が form/input/textarea/submit 0 件 | M-09-no-form.png, M-09-no-form.devtools.txt |
| AC-3 | local `/profile?edit=true` でも 0 件 | M-10-edit-query-ignored.png, M-10-edit-query-ignored.devtools.txt |
| AC-4 | staging で親 06b の残証跡を取得 | M-14-staging-profile.png, M-15-edit-cta.png, M-16-localstorage-ignored.png, M-16-localstorage-ignored.devtools.txt |
| AC-5 | 親 workflow の M-08〜M-10 / M-14〜M-16 を captured 化 | manual-smoke-evidence-update.diff |
| AC-6 | 不変条件 #4/#5/#8/#11 の observation を記録 | outputs/phase-11/main.md |
| AC-7 | runbook と secret hygiene gate を通す | outputs/phase-05/runbook.md, Phase 9/13 grep |

## 真の論点

| 論点 | 採用判断 | 根拠 |
| --- | --- | --- |
| local と staging の扱い | 両方取得 | 再現性と実環境裏付けを両立するため |
| screenshot だけで足りるか | DevTools txt 併用 | form 不在は視覚だけでは曖昧なため |
| `?edit=true` の観測 | URL と DOM count の二重 evidence | 編集経路なしを明確にするため |
| secret hygiene | evidence には token / Cookie / Authorization を残さない | Phase 9/13 で grep gate |

## 4 条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | evidence 数を 10 files（6 screenshots + 3 DevTools txt + 1 diff）に統一 |
| 漏れなし | PASS | AC-1〜7 と evidence / metadata が対応 |
| 整合性あり | PASS | taskType=implementation / visualEvidence=VISUAL |
| 依存関係整合 | PASS | 04b/05a/05b/06b → 本 task → 09a の境界を明記 |
