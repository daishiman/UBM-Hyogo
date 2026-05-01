# Phase 4: 検証戦略（ADR 整合チェック手順）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略（ADR 整合チェック手順） |
| 作成日 | 2026-05-01 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL / docs-only ADR タスクのため、TDD の RED 対象は **文書整合性チェック**となる。本 Phase では (1) wrangler.toml / web-cd.yml / deployment-cloudflare.md / CLAUDE.md の deploy target 記述を抽出する `rg` コマンド体系、(2) ADR と判定表が同じ deploy target を指すかの照合手順、(3) 不変条件 #5 抵触検出（apps/web/wrangler.toml への `[[d1_databases]]` 追加検出）、(4) ADR 文書のレビューチェックリストを Phase 5 runbook に渡せる粒度で確定する。Phase 4 は命令セット定義を担当し、Phase 5 / Phase 9 / Phase 11 で消費する。

## 検証コマンド体系

### 1. deploy target キーワード抽出（4 ファイル横断）

```bash
rg -n "pages_build_output_dir|^main\s*=|\[assets\]|wrangler deploy|wrangler pages deploy|@opennextjs/cloudflare|\.open-next/worker\.js" \
  apps/web/wrangler.toml \
  .github/workflows/web-cd.yml \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
  CLAUDE.md
```

期待結果: 4 ファイルすべての deploy target 関連リテラルが行番号付きで列挙される。Phase 5 runbook で ADR 本文の Context セクションに貼り付ける証跡として利用。

### 2. ADR ⇔ 判定表 deploy target 一致照合

```bash
# ADR 本文（配置先は Phase 3 で決定）
rg -n "Decision:|Status:|deploy target" {{ADR_PATH}}
# 判定表
rg -n "現状|将来|deploy target|Pages|Workers" \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

期待結果: 双方の deploy target 記述（`Pages` / `Workers` のいずれか、または「現状=Pages・将来=Workers」など）が一致。不一致なら Phase 5 / Phase 8 で同期更新を要求する FAIL とする。

### 3. 不変条件 #5 抵触チェック（必須ガード）

```bash
rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
```

期待結果: **0 件**。1 件以上検出時は不変条件 #5 違反 = MAJOR ブロッカー。Phase 10 ゲートで NO-GO。

### 4. CLAUDE.md スタック表現と ADR Decision の整合

```bash
rg -n "Cloudflare Workers|Cloudflare Pages|@opennextjs/cloudflare" CLAUDE.md
```

期待結果: ADR Decision が cutover なら「Cloudflare Workers + @opennextjs/cloudflare」維持、保留なら「Cloudflare Pages + Next.js」修正済み。記述差分が判定表と矛盾していないこと。

### 5. 関連タスク重複チェック

```bash
rg -n "task-impl-opennext-workers-migration-001|UT-GOV-006-web-deploy-target-canonical-sync" docs/30-workflows/
```

期待結果: 本タスク以外の起票文書での参照が確認でき、責務分離が文書化されている。

## ADR 文書レビューチェックリスト雛形

Phase 5 で生成する ADR 本文に対し、以下を満たすことを確認する。

| # | チェック項目 | 期待 | 検証手段 |
| --- | --- | --- | --- |
| 1 | Status セクション存在 | `Accepted` または `Proposed` 明記 | grep |
| 2 | Context セクションが drift 4 ファイルすべてを参照 | wrangler.toml / web-cd.yml / deployment-cloudflare.md / CLAUDE.md の 4 ファイル | grep |
| 3 | Decision セクションが TBD 不在 | base case が実値で記述 | grep `TBD` ゼロ件 |
| 4 | Consequences セクションに不変条件 #5 維持の明示 | `[[d1_databases]]` を apps/web に追加しない方針 | grep |
| 5 | Related tasks セクションに 2 件記載 | task-impl-opennext-workers-migration-001 / UT-GOV-006 | grep |
| 6 | `Refs #287` 形式の参照（`Closes` 禁止） | `Refs #287` 表記 | grep |
| 7 | `@opennextjs/cloudflare` バージョン互換結果記載 | Phase 2 decision-criteria.md からの転記 | レビュー目視 |

## docs-only TDD RED の解釈

| 通常タスク | 本タスク（docs-only） |
| --- | --- |
| 失敗テストを書く | 文書整合性チェックコマンドを定義し、現状で FAIL することを確認 |
| 実装で GREEN にする | Phase 5 runbook 実行で ADR / 判定表 / CLAUDE.md を整合させて GREEN 化 |
| カバレッジ計測 | 4 ファイル × deploy target 整合 + 不変条件 #5 + ADR レビューチェックリスト 7 項目の網羅 |

## 完了条件チェックリスト

- [ ] 5 種の検証コマンド（deploy target 抽出 / ADR-判定表照合 / 不変条件 #5 ガード / CLAUDE.md 整合 / 関連タスク重複）が記述
- [ ] 各コマンドの期待結果と FAIL 時のアクション（Phase 戻し or 次 Phase 修正）が明示
- [ ] ADR レビューチェックリスト 7 項目が雛形化
- [ ] docs-only TDD RED の解釈が文書化
- [ ] 不変条件 #5 抵触検出ガードが必須項目として識別
- [ ] Phase 5 / Phase 9 / Phase 11 で再実行する command suite として固定

## 実行タスク

1. `outputs/phase-04/test-strategy.md` に 5 種コマンド体系と期待結果を表形式で記述（完了条件: 5 セクション完了）。
2. `outputs/phase-04/doc-consistency-checks.md` に ADR レビューチェックリスト 7 項目と各項目の grep スニペットを記述（完了条件: 7 行 + 検証手段カラム）。
3. 不変条件 #5 抵触ガードを Phase 9 / Phase 11 必須実行項目として固定する旨を明記（完了条件: 注記セクション追加）。

## 多角的チェック観点

- **過剰実行回避**: 検証は Read / grep / 文書比較に閉じ、`wrangler` / `gh` / `op` 等の CLI 実行を要求しない。
- **不変条件 #5 強制**: ガードコマンドは Phase 9 / Phase 11 で **毎回再実行**。一度 PASS したからスキップは禁止。
- **コマンドの再現性**: 全コマンドはリポジトリルートからの相対パスで記述し、worktree でも実行可能。
- **ADR ⇔ 判定表 双方向検証**: ADR 側だけ更新して判定表が古い、または逆の片方向更新を検出する仕組みを 2 項目で確保。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | deploy target 抽出コマンド定義 | 4 | pending |
| 2 | ADR-判定表照合コマンド定義 | 4 | pending |
| 3 | 不変条件 #5 抵触ガード定義 | 4 | pending |
| 4 | CLAUDE.md 整合チェック定義 | 4 | pending |
| 5 | 関連タスク重複チェック定義 | 4 | pending |
| 6 | ADR レビューチェックリスト 7 項目雛形化 | 4 | pending |
| 7 | docs-only TDD RED 解釈の文書化 | 4 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 5 種検証コマンド体系 + 期待結果 + FAIL 時アクション |
| ドキュメント | outputs/phase-04/doc-consistency-checks.md | ADR レビューチェックリスト 7 項目 |
| メタ | artifacts.json | Phase 4 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- 5 種コマンドすべてに期待結果と FAIL アクションが付与
- 不変条件 #5 ガードが必須項目として識別
- ADR レビューチェックリスト 7 項目が完備
- artifacts.json の `phases[3].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 5（仕様 runbook 作成）
- 引き継ぎ事項:
  - 5 種検証コマンド体系（Phase 5 / 9 / 11 で再利用）
  - ADR レビューチェックリスト 7 項目
  - 不変条件 #5 抵触ガードの必須実行ルール
- ブロック条件:
  - 検証コマンドが手動操作（GUI / 対話 CLI）を要求している
  - 不変条件 #5 ガードが任意項目に格下げされている
  - ADR レビューチェックリストが Phase 5 で消費可能な粒度に達していない

## 参照資料

- `outputs/phase-02/adr-draft.md`
- `outputs/phase-02/cutover-vs-hold-comparison.md`
- `apps/web/wrangler.toml`
- `.github/workflows/web-cd.yml`

## 統合テスト連携

検証は grep / link check / JSON parity に限定する。実 deploy 統合テストは後続 migration task の責務。
