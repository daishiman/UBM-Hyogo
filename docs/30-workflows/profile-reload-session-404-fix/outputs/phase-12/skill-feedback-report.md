# Phase 12: skill feedback report

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

task-specification-creator / aiworkflow-requirements の運用で得た、テンプレート観点・ワークフロー観点・ドキュメント観点の気づきを記録する。改善点なしでも出力する。

## テンプレート観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| VISUAL_ON_EXECUTION の Phase 11 証跡分離 | NON_VISUAL タスク（T01/T02）と VISUAL タスク（T03）が同一ワークフローに混在する場合、Phase 11 の証跡主ソースを「自動テスト名・件数」と「jsdom render + static UI contract screenshot」に分けて記録すると compliance check の Phase 11 inventory で captured/user-gated の整合が取りやすい | 本 WF の manual-test-result.md で NON_VISUAL/VISUAL を節分割し反映済（改善は WF 内で吸収） |
| VISUAL_ON_EXECUTION の screenshot 行 | implementation 済みでも authenticated staging runtime screenshot は user-gated にできる。local jsdom evidence、static UI contract screenshot、staging runtime visual user-gated を分けると状態語彙の矛盾を避けられる | 既存 two-tier evidence 運用として WF 内に反映済 |

## ワークフロー観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| Server Component が API を直接叩く場合の 404/401 区別 UX | SC（`/profile`）が `fetchAuthed` で API を直接叩く構成では、401（→`/login` redirect）と 404（ルート解決層 / リソース不在）で UX を明確に区別すべき。404 は「再ログイン CTA」、5xx は「時間をおいて再読み込み」と写像を分けるパターンが再利用価値あり | 本 WF のコード・artifact inventory へ反映。汎用 reference 追記は今回必須ではない |
| ルート解決層 404 とハンドラ 404 の切り分け | 「ハンドラに 404 分岐が無いのに 404 が返る」場合はマウント/末尾スラッシュなどルート解決層を疑う、という診断手順が有効だった。contract テストがサブアプリ直叩きでマウントをバイパスしていた盲点も同種 | 「フルアプリ・マウント統合テスト」を回帰検知の標準として recommend |

## ドキュメント観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 不変条件の引用が有効 | index.md が CLAUDE.md の不変条件（#5 D1 直接禁止 / #11 memberId / env アクセサ / OKLch トークン）を逐条引用しており、設計判断の根拠が追いやすかった | 既存運用が良好・新規改善要求なし |

## 改善要求サマリ

- **緊急の skill 改善要求: なし。** 本 WF は既存テンプレート・既存パターンで完結する。
- **将来提案: なし。** 今回検出した改善は本 wave 内でコード・テスト・artifact inventory に反映済み。

## 完了条件

- [x] テンプレート/ワークフロー/ドキュメントの 3 観点で記録
- [x] SC が API を直接叩く場合の 404/401 区別 UX パターン化の気づきを記録
- [x] 改善要求サマリ（緊急なし・将来提案 1 件）を記録

## 成果物

- `outputs/phase-12/skill-feedback-report.md`（本ファイル）

## 参照資料

- `outputs/phase-2/phase-2.md`（再利用判定・責務境界）
- `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md`（将来提案の対象）
