# Phase 3: 設計レビュー

## 4 条件レビュー

| 条件 | 判定 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | task-01 (user mutation) と task-03 (gate) は責務分離。task-02 と task-03 は workflow YAML 編集対象が重ならない（task-02 = 既存隣接 workflow / task-03 = 新規 workflow + script のみ） |
| 漏れなし | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | 暫定件数を 15 件 inventory に正規化。staging-runtime-smoke 5 件は task-01 に網羅。検知 gate は task-03 に実装済み。secret mutation / runtime rerun は user-gated |
| 整合性あり | PASS | 命名規約 (`scripts/ci/verify-*.sh`, `.github/workflows/verify-*.yml`) は既存 `verify-indexes.yml` / `verify-test-suffix.yml` / `verify-workflow-doc-refs.yml` と整合 |
| 依存関係整合 | PASS | task-03 gate は task-01 / task-02 完了後に green。逆順依存（gate を red で merge）は不変条件で禁止 |

## ハイリスク項目と緩和策

| リスク | 影響 | 緩和策 | 担当タスク |
|--------|------|--------|----------|
| `GITHUB_TOKEN` で Environment secret API の name 列挙が不可 | preflight gate が CI で動かない | task-03 spec 内で fine-grained PAT への切替手順を事前準備 | task-03 |
| user が `op read` 経由の投入を忘れる / 後回しにする | gate が red のまま merge できない | task-01 runbook に「投入完了 evidence を取得するまで PR を出さない」DoD を明記 | task-01 |
| 隣接 15 件の一部が「実は別経路で代替済み・workflow が dead」だった | 廃止判断が必要だが情報不足 | task-02 内で各 workflow の最後の run と発火条件を `gh run list` で確認する手順を含める | task-02 |
| preflight gate の false-positive で開発体験が悪化 | gate が信頼されなくなり muted される | allow-list 機構と test ケース TC-04 で抑止。false-positive 発覚時は allow-list 追加 + 根本対応 issue 起票の運用フロー spec に明記 | task-03 |
| workflow_call の `secrets: inherit` を静的解析できない | caller-callee 経路の false-positive | `runtime-smoke-staging.yml` を含む reusable workflow は standalone PR/push 対象ではなく、caller workflow / runtime evidence 境界で検証する | task-03 |
| OIDC federation を導入したら本 gate が不要になる | サイクル外候補との衝突 | gate は federation 移行後も「未 OIDC 化 secret」検知として有用。共存設計可能なので無問題 | （長期） |

## トレードオフ判断

| 選択肢 | 採用 | 不採用理由 |
|--------|------|----------|
| A. preflight gate を Repository scope 単純検査だけにする | × | env scope 検知不可で今回事象を見逃す。価値が薄い |
| B. preflight gate を本案（env + repo + allow-list）にする | ○ | 今回事象を確実に検知。false-positive 抑止機構あり |
| C. OIDC federation を本サイクルで実施 | × | Cloudflare 側設定 + 全 workflow 改修で独立大規模スコープ。CONST_007 例外要件「明確な技術的破綻」に該当（1 サイクルでは不可能） |
| D. task-02 を本サイクルから外し別 workflow へ | × | CONST_007 に反する。「分量が多い」は分離理由にならない |
| E. task-02 を本サイクル内 15 件すべて完結 | ○ | 各 secret は数行の判定・YAML 編集・user 投入手順記述で完了するため 1 サイクル内で十分処理可能 |

## エスカレーション項目

- なし。本 phase で repository-local 方針は確定。secret 投入・workflow_dispatch は user-gated operation として Phase 13 で扱う。

## サイクル外候補の再確認

- OIDC federation 化 → 既存 unassigned `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md`
- production runtime smoke 新設 → 既存 unassigned `docs/30-workflows/unassigned-task/task-issue-531-production-runtime-smoke-attendance-provider-001.md`

両者の理由は phase-1.md 末尾に記載済み。本 phase でも妥当性を再確認した。

## 次フェーズへの引き継ぎ

phase-4 以降は 3 タスクの個別仕様書（`task-01-*/index.md`、`task-02-*/index.md`、`task-03-*/index.md`）として並列起こす。各仕様書は CONST_005 必須項目を全件含むこと:

1. 変更対象ファイル一覧（パス）と変更種別
2. 主要な関数・型・モジュールのシグネチャまたは構造
3. 入力・出力・副作用の定義
4. テスト方針（追加するテストファイル・ケース）
5. ローカル実行・検証コマンド
6. DoD

## 完了条件

- 上記 4 条件すべて PASS
- リスクと緩和策が各タスク担当に紐付いている
- サイクル外候補の理由が phase-1 と整合している
