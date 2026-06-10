# Phase 12: skill feedback report

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

task-specification-creator / aiworkflow-requirements の運用で得た、テンプレート観点・ワークフロー観点・ドキュメント観点の気づきを記録する。改善点なしでも出力する。本ワークフローは「調査主導 × 観測性コード変更」のハイブリッドタスクであり、audit-task テンプレと実装タスク骨格の併用判断という固有の論点があった。

## テンプレート観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 調査主導 × 観測性コード変更のハイブリッド判断基準 | 本タスクは「調査・原因特定のみ」だが、原因を**確認可能にする**目的の達成に観測性コード変更（区別表示・ログ・診断スクリプト）が必須のため、純 docs-only でも純 implementation でもない。`phase-template-audit-task.md`（read-only audit）の Phase 再解釈を「参考」にしつつ、コード変更があるため実装タスク骨格（RED/GREEN・カバレッジ）を「主」とするハイブリッドが妥当だった。**判断基準として「コード diff が docs/skill 同期のみ→audit テンプレ」「観測性でも `apps/` に diff が出る→実装骨格主 + audit テンプレ補助」を併用基準としてテンプレ化する候補** | 提案: `phase-template-audit-task.md` に「観測性向上を含む調査タスク」の併用節を追記する候補（今回は WF 内で吸収・必須改善ではない） |
| 真因未確定時の Phase 11 証跡 = 自動テストでなく実機 status | 通常の implementation タスクは Phase 11 で自動テストを主証跡にするが、調査タスクは **staging 実機の `/me` HTTP status / 診断スクリプト stdout / D1 read-only** が AC-1/AC-2 の主証跡になる。manual-test-result.md を「実機切り分け手順（MT-A〜MT-D）+ 真因収束判定フロー」中心に構成すると compliance の証跡整合が取りやすい | 本 WF の manual-test-result.md で MT-A〜MT-D + 判定フローを節分割し反映済 |
| implemented_local_evidence_captured で未タスク 0 件を回避する formalize パターン | 「調査のみ」を選択したタスクは本格修正が必ずスコープ外になり 0 件化しやすい。SSOT §3 OUT を `deferred_pending_root_cause`（真因確定待ち）として current 未タスクに formalize する型が有効だった | 既存運用で吸収（unassigned-task-detection.md に current 4 件） |

## ワークフロー観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 症状から真因仮説を排除法で絞るパターン | `/profile` の症状（「時間をおいて再読み込み」= 非404・非redirect）と `session-guard` 分岐を突き合わせ、**401=redirect されバナーにならない / 404=再ログイン CTA になる**ことから H2・404 を一次除外し、H3/H4/H5 に収束させた。「症状の見え方（redirect / CTA / 集約バナー）から候補 status を排除する」診断手順は再利用価値が高い | **提案: 「症状 → 候補 status 排除法（redirect=401 除外 / CTA=404 除外）」を aiworkflow-requirements の診断パターンとしてテンプレ化する候補**（今回は WF 内に反映・必須ではない） |
| 観測性欠如を因果ループで主問題化 | 「観測性欠如(H6) → 真因不明 → 場当たり対処 → 再発」のバランスループを断ち切る対象として、区別表示(D1)+構造化ログ(D2)+診断スクリプト(D3) を設計した。「複数 root cause が 1 つのエラー文言に集約される」観測性アンチパターンの検出と是正は他の SC×API 直叩き画面にも適用余地がある | 本 WF のコード・実装ガイドへ反映。汎用 reference 追記は今回必須ではない |

## ドキュメント観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 不変条件の逐条引用が有効 | SSOT / index.md が CLAUDE.md の不変条件（#5 D1 直接禁止 / #11 memberId 非露出 / env アクセサ / OKLch トークン / apps/api 非接触）を逐条引用しており、観測性変更が surface を侵さない根拠が追いやすかった | 既存運用が良好・新規改善要求なし |

## 改善要求サマリ

- **緊急の skill 改善要求: なし。** 本 WF は既存テンプレート（audit-task 参考 + 実装骨格主）で完結する。
- **将来提案: 2 件（任意）。** (1) `phase-template-audit-task.md` への「観測性向上を含む調査タスク」併用判断基準節、(2) 「症状 → 候補 status 排除法」診断パターンのテンプレ化。いずれも今回は WF 内でコード・テスト・実装ガイドに反映済で、緊急の skill 更新は不要。

## 完了条件

- [x] テンプレート/ワークフロー/ドキュメントの 3 観点で記録
- [x] 調査主導 × 観測性コード変更のハイブリッドタスクでの audit テンプレ × 実装骨格の併用判断基準を記録
- [x] 症状から真因仮説を排除法で絞る（401=redirect / 404=CTA で除外）パターンのテンプレ化候補を記録
- [x] 改善要求サマリ（緊急なし・将来提案 2 件）を記録

## 成果物

- `outputs/phase-12/skill-feedback-report.md`（本ファイル）

## 参照資料

- `_shared-context.md` §1（実装区分判定根拠）/ §2（H1-H6）/ §7（Phase 構成・因果ループ）
- `.claude/skills/task-specification-creator/references/phase-template-audit-task.md`（併用判断の対象）
