# automation-30 Compact Evidence

| 思考法 | Evidence | Improvement |
| --- | --- | --- |
| 批判的 | `spec_created` のまま実コード対象が明示されていた | implemented-local state へ再分類 |
| 演繹 | implementation task は実コード・test・Phase 12 同期が必要 | strict 7 と code diff を追加 |
| 帰納 | 近傍 workflow は same-wave aiworkflow sync を持つ | active/index/inventory を同期 |
| アブダクション | 最善説明は仕様作成後に実装も進めるべき状態 | docs-only では閉じない |
| 垂直 | footer 直前要件は相対順では不足 | `nextElementSibling` に修正 |
| 要素分解 | scope/code/test/evidence に分けると NavItem が余分 | implementation files を最小化 |
| MECE | 採用案と不採用案が混在 | 案 B direct anchor に統一 |
| 2軸思考 | local evidence present / staging observation user-gated を分離 | screenshot 3 枚を local fixture で present 化 |
| プロセス思考 | Phase 12 が予定扱い | outputs を物理配置 |
| メタ思考 | 真の論点は仕様書か実装 close-out か | 実装 close-out に切替 |
| 抽象化思考 | nav relabel は小さな DOM 契約変更 | shared primitive へ拡張しない |
| ダブル・ループ思考 | 後工程送り前提が drift の原因 | same-cycle completion に変更 |
| ブレインストーミング | NavItem prop / direct anchor / Link 化を比較 | direct anchor 採用 |
| 水平思考 | 実テストの `nextElementSibling` が docs より正確 | docs に逆輸入 |
| 逆説思考 | 共通化は一見良いが blast radius を増やす | 共通化しない |
| 類推思考 | admin topbar 等の implemented-local 同期に合わせる | aiworkflow ledgers を更新 |
| if思考 | strict 7 未配置なら PR 前 gate で落ちる | strict 7 を追加 |
| 素人思考 | 「ホーム」は管理画面ホームと誤読される | 「公開サイトに戻る」へ変更 |
| システム思考 | docs/code/aiworkflow が連動 | 3者を同期 |
| 因果関係分析 | placeholder path は探索不能を生む | 実 artifact path を作成 |
| 因果ループ | stale docs が次実装の誤変更を誘発 | state と file list を補正 |
| トレードオン思考 | coverage full run より focused regression が高価値 | focused Vitest + grep gate を採用 |
| プラスサム思考 | UX copy と test anchor が両立 | `data-role` 契約を追加 |
| 価値提案思考 | 管理者が公開サイトへ迷わず戻れる | footer-adjacent placement |
| 戦略的思考 | 親 Task F と独立 workflow の関係を維持 | parent trace を残す |
| why思考 | 根因は label と配置の文脈不一致 | label/placement を同時修正 |
| 改善思考 | 不要な prop 拡張を外すほど簡潔 | `AdminSidebarNavItem` unchanged |
| 仮説思考 | legacy skipped spec が gate を曖昧化 | active pointer に変更 |
| 論点思考 | 論点は runtime screenshot 単体ではなく local DOM contract + visual evidence | source guard 付き screenshot を追加 |
| KJ法 | state/scope/evidence/sync の4群に整理 | P0-P2 を同 cycle 修正 |
