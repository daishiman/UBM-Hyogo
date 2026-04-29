# スキルフィードバックレポート — UT-GOV-001

> **改善点なしでも出力必須**。3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でテーブル必須。

## 観点別フィードバック

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | NON_VISUAL implementation（governance 適用）で「実 PUT は Phase 13 ユーザー承認後」という構造を Phase 11 docs-only 代替 evidence（必須 3 outputs）で表現できた。spec_created と user_approval_required: true の組合せが phase-template-phase11 / phase-13 で素直に分岐できる | Phase 13 `user_approval_required: true` と Phase 11 NOT EXECUTED の双方向参照を `phase-template-core.md` の「変数一覧」に追加するテンプレ注釈を検討 |
| テンプレ改善 | snapshot（GET 形 / PUT 不可）/ payload（PUT 形）の用途分離を `state ownership 表` で表現したのが境界事故防止に有効だった | `phase-template-phase11.md` の docs-only 代替 evidence セクションに「GET / PUT 用途分離 boundary」の表現例を追加候補 |
| ワークフロー改善 | snapshot / payload / rollback / applied の 4 ファイルを `{branch}` サフィックスで分離する戦略が、bulk 化禁止規約（親仕様 §8.5）と整合し、artifacts.json の `phases[13].outputs` と完全一致させやすかった | adapter（GET → PUT 変換）の jq 擬似コードを `patterns-workflow-generation.md` に再利用テンプレ化する候補。governance だけでなく外部 API 適用全般に汎化可能 |
| ワークフロー改善 | UT-GOV-004 完了前提を Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記する規約が、順序事故（contexts 未出現値で merge 不能）の予防として機能した | 「順序事故防止のための N 重明記」を `patterns-success-implementation.md` にパターン化する候補。skill-ledger-a1（A-2 完了前提を 3 重明記）とも整合する横断パターン |
| ドキュメント改善 | Part 1（中学生レベル）の例え話を「鍵 / 上履きチェック / 先生 / 写真と設定書 / リハーサル」で揃えたことで、専門用語セルフチェック表が機能した | `phase-12-spec.md` Part 1 専門用語セルフチェック表のサンプル例（バケット / プレサインド URL 等）に branch protection / snapshot / payload の例も追加候補 |
| ドキュメント改善 | `1Password secret URI` 混入チェックと計画系 wording 残存チェックを Phase 12 完了条件に組み込めた | 「他タスクで使うシークレット系の wording を docs-only タスクが誤混入させない」grep ガードを `validate-phase-output.js` に汎化する候補 |

## 観察事項なしの観点

なし（3 観点とも観察事項あり）。

## サマリ

| 観点 | 観察件数 | 改善提案件数 |
| --- | --- | --- |
| テンプレ改善 | 2 | 2 |
| ワークフロー改善 | 2 | 2 |
| ドキュメント改善 | 2 | 2 |
| 合計 | 6 | 6 |

> 3 観点とも 1 件以上の観察事項を記録（空テーブル禁止規約クリア）。

## 改善提案の扱い

6 件は task-specification-creator の横断テンプレ / validator 改善であり、UT-GOV-001 の branch protection 実適用と同一スコープで変更すると影響範囲が大きい。Phase 12 の候補止まりを避けるため、独立未タスクとして formalize した。

| 未タスク仕様 | 対象 |
| --- | --- |
| [task-task-specification-governance-template-hardening.md](../../../unassigned-task/task-task-specification-governance-template-hardening.md) | Phase 13 承認ゲート、GET/PUT用途分離、adapterテンプレ、N重明記、Part 1用語例、secret wording grep guard |

## 関連

- Phase 12 index: [./main.md](./main.md)
- 参考実例: [docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/skill-feedback-report.md](../../../skill-ledger-a1-gitignore/outputs/phase-12/skill-feedback-report.md)（A-2 3 重明記との整合）
- スキル正本: `.claude/skills/task-specification-creator/SKILL.md`
