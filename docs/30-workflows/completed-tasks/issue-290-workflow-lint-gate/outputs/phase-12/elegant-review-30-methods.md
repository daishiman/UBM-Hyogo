# Elegant review - 30 methods compact evidence

| 思考法 | 適用結果 |
| --- | --- |
| 批判的思考 | 「新規 job 追加必須」は過剰で、既存 owner job 拡張へ修正 |
| 演繹思考 | AC-1 全件検査なら `.github/workflows/*.yml` glob が最小十分条件 |
| 帰納的思考 | #526 の限定列挙が drift 原因なので列挙維持は再発する |
| アブダクション | 未カバー 21 件の根因は tool 不足ではなく対象指定の固定化 |
| 垂直思考 | 解くべき核は workflow 追加時の対象漏れ |
| 要素分解 | 実装を CI gate、local command、runbook、decision、Phase evidence、aiworkflow sync に分解 |
| MECE | branch protection、yamllint、shellcheck 範囲拡大を混ぜず、必要な既存 shellcheck 指摘のみ修正 |
| 2軸思考 | 高価値低複雑は actionlint pin + glob、低価値高複雑は yamllint 導入 |
| プロセス思考 | 先に全件 actionlint、露出した既存 shell 指摘を最小修正、その後 evidence 化 |
| メタ思考 | 仕様書作成と実装 evidence captured を混同せず状態語彙で分離 |
| 抽象化思考 | runbook は workflow lint 復旧に限定し、汎用 CI 復旧へ広げない |
| ダブル・ループ思考 | required check 追加は今回不要。既存 `ci` context 内の local reproduction で担保 |
| ブレインストーミング | glob / generated manifest / allowlist を比較し、glob を採用 |
| 水平思考 | 新規専用 workflow ではなく既存 `workflow-shell-lint` 拡張で運用負荷を抑制 |
| 逆説思考 | yamllint 追加は品質向上ではなくノイズ増加になり得る |
| 類推思考 | #526 subset gate を #290 all-workflows gate へ自然拡張 |
| if思考 | `.yaml` 追加時は別検討。本タスクは現行 `.yml` 32 件 AC に固定 |
| 素人思考 | 「全部チェック」は `*.yml` 1 行で説明できる設計にする |
| システム思考 | `ci.yml`、`package.json`、self-lint、aiworkflow index を同一 contract に同期 |
| 因果関係分析 | 列挙固定が新規 workflow 漏れを生み、topology drift につながる |
| 因果ループ | runbook + decision で同じ採否議論と N/A 判定の再発を止める |
| トレードオン思考 | self-lint 重複は数秒コストで独立性を維持できるため許容 |
| プラスサム思考 | actionlint 単独化で CI 安定性と運用単純性を同時に得る |
| 価値提案思考 | 価値は PR 時点で workflow 構文事故を止めること |
| 戦略的思考 | UT-CICD-DRIFT 再発防止に直結し、UT-GOV mutation は user gate に残す |
| why思考 | なぜ漏れるか: 人手列挙だから。glob で構造的に解消 |
| 改善思考 | 仕様矛盾、missing outputs、artifacts parity、same-wave sync を今回修正 |
| 仮説思考 | all-workflows actionlint が exit 0 なら gate は実運用可能 |
| 論点思考 | 主論点は yamllint ではなく全 workflow を必ず検査する入口 |
| KJ法 | リスクを仕様矛盾、evidence 欠落、正本同期、scope creep に集約して解消 |

## Four-condition final verdict

| 条件 | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | completed | 既存 job 拡張、状態語彙、Phase 13 user gate を統一 |
| 漏れなし | completed | 実コード、runbook、decision、Phase 12 strict 7、artifacts、aiworkflow sync を反映 |
| 整合性あり | completed | CI と local command が actionlint `1.7.7` + `.github/workflows/*.yml` で一致 |
| 依存関係整合 | completed | source unassigned consumed、#526 subset から #290 all-workflows gate へ接続 |
