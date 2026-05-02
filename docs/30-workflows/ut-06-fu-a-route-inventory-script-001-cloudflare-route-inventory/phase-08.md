# Phase 8: E2E / NON_VISUAL 代替検証（production read-only smoke）

> **本タスクは docs-only / infrastructure-automation かつ NON_VISUAL である。** Playwright 等の UI E2E は対象外とし、代替として **production read-only API smoke** を `bash scripts/cf.sh` 経由で 1 回手動実行し、出力 JSON / Markdown を Phase 11 evidence に貼る計画を本 Phase で確定する。本 Phase 自体は spec のみで成果物を作成し、実打ちは受け側実装タスクが script 実装後に実施する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | E2E / NON_VISUAL 代替検証（production read-only smoke） |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (統合テスト / API mock) |
| 次 Phase | 9 (ステージング検証) |
| 状態 | spec_created |
| タスク分類 | infrastructure-automation（NON_VISUAL smoke spec） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

NON_VISUAL タスクのため Playwright 等の UI E2E は対象外。代替検証として **production Cloudflare API への read-only smoke** を `bash scripts/cf.sh` 経由で 1 回だけ手動実行し、その出力 JSON / Markdown を Phase 11 evidence として記録する計画を確定する。本 Phase ではあくまで「実行手順 / 期待結果 / secret 漏洩防止チェック」の **runbook** を仕様化するに留め、実 production への hit は受け側実装タスクが script 実装後に行う。

## 実行タスク

1. NON_VISUAL タスクで Playwright E2E を実施しない理由を明文化する（完了条件: 「UI を持たない」「inventory script の出力は CLI / ファイル」が本文に記述される）。
2. production read-only smoke の実行手順を runbook 化する（完了条件: 認証確認 → script 実行 → 出力検証 → secret grep の 4 ステップが順序付きで記述）。
3. `bash scripts/cf.sh whoami` の前提確認を runbook 冒頭に固定する（完了条件: コマンドと期待出力が記述）。
4. script 実行コマンドの placeholder を `bash scripts/cf.sh` ラッパー経由形式で仮置きする（完了条件: `wrangler` 直接実行が含まれず、実装後に確定する旨が明示）。
5. 出力 JSON / Markdown の secret 不在検証を grep 手順として確定する（完了条件: Phase 7 で定義した 4 種類以上の正規表現が再掲され、期待値 0 件が固定）。
6. 出力ファイルを Phase 11 evidence へ転記する経路を定義する（完了条件: 出力ファイル名と Phase 11 evidence path の対応が明示）。
7. production mutation を一切行わない境界を再掲する（完了条件: deploy / route 付け替え / secret 投入 / 旧 Worker 削除 を実行しない宣言が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | 正本仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-08.md | 親タスク Phase 8（フォーマット踏襲元） |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由強制 |
| 必須 | scripts/cf.sh | ラッパー実体（op + esbuild 解決） |
| 必須 | docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-07.md | 統合テスト仕様（secret-leak 正規表現の正本） |

## NON_VISUAL である根拠

| 観点 | 内容 |
| --- | --- |
| UI 不在 | inventory script の出力は CLI 標準出力 / JSON ファイル / Markdown ファイル。ブラウザに描画される画面が存在しない |
| 操作主体 | 運用者が CLI から 1 回実行するワンショット script。ユーザー操作のフローを持たない |
| 視覚的副作用 | Cloudflare ダッシュボードへの DOM 変更を伴わない（read-only API のみ） |
| Playwright 適用可否 | 不適用。ブラウザコンテキストを必要とする AC が無い |

## production read-only smoke runbook

### ステップ 1: 認証確認

```bash
bash scripts/cf.sh whoami
```

期待: 認証済み account / API token scope が出力される。token 値そのものは出力されない（whoami は account 情報のみ）。

### ステップ 2: script 実行（実装後に確定）

```bash
# 実装後に受け側タスクで確定する placeholder
# bash scripts/cf.sh <route-inventory-subcommand> --config apps/web/wrangler.toml --env production --output outputs/phase-11/inventory.json
```

> **重要**: コマンド形は受け側実装タスクが確定する。本 Phase では `bash scripts/cf.sh` ラッパー経由であること、`--env production` 指定であること、出力先が `outputs/phase-11/` 配下であることのみ固定する。`wrangler` 直接実行は禁止。

### ステップ 3: 出力ファイル検証

| 検証項目 | コマンド例 | 期待結果 |
| --- | --- | --- |
| 出力 JSON の存在 | `test -f outputs/phase-11/inventory.json` | 存在 |
| 出力 Markdown の存在 | `test -f outputs/phase-11/inventory.md` | 存在 |
| `ubm-hyogo-web-production` の出現 | `grep -c 'ubm-hyogo-web-production' outputs/phase-11/inventory.json` | >= 1 |
| `mismatches` セクションの記載 | `grep -E 'mismatches' outputs/phase-11/inventory.json` | 想定どおり（空配列なら split-brain なし） |

### ステップ 4: secret 漏洩 grep（必須）

Phase 7 §「secret-leak 検出テスト」で確定した正規表現を出力ファイルに対して実行する。

```bash
# Bearer prefix
grep -E 'Bearer\s+[A-Za-z0-9._-]+' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件

# CLOUDFLARE_API_TOKEN 直書き
grep -E 'CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件

# OAuth token プレフィックス
grep -E 'ya29\.|ghp_|gho_' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件
```

> いずれかが 1 件でも検出された場合は **出力ファイルを即削除し** 、受け側実装タスクへ差し戻す。

## production mutation 非実行境界（再掲）

本タスクは Phase 1 / 3 と整合し、以下を **本 Phase 内で一切実行しない**。

| 操作 | 状態 |
| --- | --- |
| `bash scripts/cf.sh deploy` | 非実行 |
| route の付け替え（dashboard / API） | 非実行 |
| custom domain の付け替え | 非実行 |
| `bash scripts/cf.sh secret put` | 非実行 |
| 旧 Worker の削除 / 無効化 | 非実行 |
| DNS record の編集 | 非実行 |

read-only API hit のみが本 Phase で許容される操作である。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | mock fixture で確立した出力形状を、本 Phase 実打ちで実値突合 |
| Phase 9 | 同 runbook を staging Worker（`ubm-hyogo-web-staging` 等）にも適用し、staging fixture を別 evidence として取得 |
| Phase 10 | smoke 実行計画（secret 0 件 / `ubm-hyogo-web-production` 出現 >=1 の期待条件）を Design GO/NO-GO 根拠に使用 |
| Phase 11 | 本 Phase で取得した JSON / Markdown を `outputs/phase-11/` 配下 evidence として保存 |
| 受け側実装タスク | runbook をそのまま実装後の手動検証手順として handoff |

## 多角的チェック観点

- 価値性: production の split-brain を実値で 1 回検証することで、AC を実証ベースで充足できる。
- 実現性: `bash scripts/cf.sh` ラッパーが既に整備済（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。
- 整合性: Phase 7 mock fixture と本 Phase 実打ちで、出力形状が乖離しないことが Phase 11 で再確認される。
- 運用性: 4 ステップの runbook が PR レビュー時に再現可能。
- 認可境界: production mutation 非実行が Phase 1 / 3 / 8 / 9 で重複明記される。
- セキュリティ: secret 漏洩 grep が必須ステップとして runbook に組み込まれる。
- 無料枠: read-only API hit は Cloudflare API rate limit の通常枠内（数 request 規模）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Playwright E2E 不適用の根拠明文化 | spec_created |
| 2 | production read-only smoke runbook 作成 | spec_created |
| 3 | `bash scripts/cf.sh whoami` 前提確認固定 | spec_created |
| 4 | script 実行コマンド placeholder 仮置き | spec_created |
| 5 | secret 不在 grep 手順確定 | spec_created |
| 6 | Phase 11 evidence への転記経路定義 | spec_created |
| 7 | production mutation 非実行境界再掲 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/non-visual-smoke-plan.md | NON_VISUAL 代替検証計画（Playwright 不適用根拠 / 4 ステップ runbook 概要 / Phase 11 連携） |
| ドキュメント | outputs/phase-08/manual-execution-runbook.md | 手動実行 runbook（認証 → 実行 → 出力検証 → secret grep）と production mutation 非実行境界 |
| メタ | artifacts.json | Phase 8 状態更新 |

## 完了条件

- [ ] Playwright E2E 不適用の根拠が本仕様書本文に記述
- [ ] 4 ステップ runbook が順序付きで定義（whoami → 実行 → 出力検証 → secret grep）
- [ ] `wrangler` 直接実行が本仕様書内 0 件（`bash scripts/cf.sh` 経由のみ）
- [ ] secret 漏洩 grep が Phase 7 と同じ正規表現で再掲
- [ ] 出力ファイルが `outputs/phase-11/` 配下へ転記される経路が明示
- [ ] production mutation 非実行が 6 操作以上で表化
- [ ] 成果物 2 ファイルが `outputs/phase-08/` 配下に配置予定

## タスク100%実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`（タスク 100% 実行確認は spec_created で OK）
- 成果物 2 ファイルが `outputs/phase-08/` 配下に配置予定
- NON_VISUAL である根拠が観点表で 4 行
- 実打ちは「受け側実装タスクが script 実装後に実施する」ことが明示
- secret 値の **記述例** にも実トークンが登場しない（key 名のみ）
- `wrangler` 直叩きが本仕様書内ゼロ件

## 次 Phase への引き渡し

- 次 Phase: 9 (ステージング検証)
- 引き継ぎ事項:
  - 4 ステップ runbook → Phase 9 で staging Worker に適用
  - 出力 JSON / Markdown 形式 → Phase 9 の multi-env config table の比較基準
  - secret 漏洩 grep → Phase 9 でも staging 出力に対して同パターン適用
  - production mutation 非実行境界 → Phase 9 / Phase 11 で同一文言で再掲
- ブロック条件:
  - runbook に `wrangler` 直叩きが残存
  - secret grep 正規表現が Phase 7 と乖離
  - production mutation 非実行が Phase 1 / 3 と矛盾
