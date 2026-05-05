# Phase 4 成果物: 検証戦略（5 種コマンド体系）

## docs-only TDD RED の解釈

| 通常タスク | 本タスク（docs-only） |
| --- | --- |
| 失敗テストを書く | 文書整合性チェックコマンドを定義し、現状で FAIL することを確認 |
| 実装で GREEN にする | Phase 5 runbook 実行で ADR / 判定表 / CLAUDE.md を整合させて GREEN 化 |
| カバレッジ計測 | 4 ファイル × deploy target 整合 + 不変条件 #5 + ADR レビューチェックリスト 7 項目の網羅 |

## 5 種検証コマンド

### #1: deploy target キーワード抽出（4 ファイル横断）

```bash
rg -n "pages_build_output_dir|^main\s*=|\[assets\]|wrangler deploy|wrangler pages deploy|@opennextjs/cloudflare|\.open-next/worker\.js" \
  apps/web/wrangler.toml \
  .github/workflows/web-cd.yml \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
  CLAUDE.md
```

| 期待 | 4 ファイルの deploy target 関連リテラルが行番号付きで列挙される |
| --- | --- |
| 用途 | ADR Context セクションへ証跡として貼り付け |
| FAIL 時 | 期待リテラルが欠落 → 該当 doc 戻し（Phase 5） |

### #2: ADR ⇔ 判定表 deploy target 一致照合

```bash
ADR_PATH="docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md"
rg -n "Decision:|Status:|deploy target|Cloudflare Workers|Cloudflare Pages" "$ADR_PATH"
rg -n "現状|将来|deploy target|Pages|Workers" \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

| 期待 | ADR Decision と判定表「現状 / 将来」列が同じ deploy target（Workers）を指す |
| --- | --- |
| FAIL 時 | Phase 5 / Phase 8 で同期更新を要求（Phase 5 戻し or Phase 12 で吸収） |

### #3: 不変条件 #5 抵触チェック（**必須ガード・スキップ禁止**）

```bash
rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
echo "Exit: $?"
```

| 期待 | **0 件**（exit 1） |
| --- | --- |
| FAIL 時 | **MAJOR ブロッカー**。Phase 10 NO-GO。該当行を即時削除し Phase 5 戻し |
| 再実行 | Phase 9 / Phase 11 で必ず再実行（一度 PASS でもスキップ禁止） |

### #4: CLAUDE.md スタック表現と ADR Decision の整合

```bash
rg -n "Cloudflare Workers|Cloudflare Pages|@opennextjs/cloudflare" CLAUDE.md
```

| 期待 | base case = cutover のため `Cloudflare Workers + @opennextjs/cloudflare` 表記が維持されている |
| --- | --- |
| FAIL 時 | CLAUDE.md と ADR Decision が乖離 → Phase 5 戻し |

### #5: 関連タスク重複チェック

```bash
rg -ln "task-impl-opennext-workers-migration-001|UT-GOV-006-web-deploy-target-canonical-sync" docs/30-workflows/
```

| 期待 | 本 ADR / `unassigned-task/task-impl-opennext-workers-migration-001.md` / `completed-tasks/UT-GOV-006-...md` の責務分離が文書化されている。重複起票なし |
| --- | --- |
| FAIL 時 | C-1 採択（Phase 3 軸 C）と矛盾 → Phase 3 / 5 戻し |

## 全コマンド要約表

| # | チェック対象 | 期待結果 | FAIL 時アクション |
| --- | --- | --- | --- |
| 1 | deploy target 抽出 | 4 ファイルすべて行番号付き抽出 | Phase 5 戻し |
| 2 | ADR ⇔ 判定表照合 | deploy target 一致 | Phase 5 戻し（軽微なら Phase 12 吸収） |
| 3 | 不変条件 #5 抵触ガード | 0 件 | **MAJOR / Phase 10 NO-GO / 即時削除 + Phase 5 戻し** |
| 4 | CLAUDE.md 整合 | Workers 表記維持 | Phase 5 戻し |
| 5 | 関連タスク重複 | C-1 と整合（重複起票なし） | Phase 3/5 戻し |

## 多角的チェック観点

- **過剰実行回避**: Read / grep / 文書比較に閉じる。`wrangler` / `gh` / `op` 等の CLI 実行は不要
- **不変条件 #5 強制**: ガードコマンドは Phase 9 / Phase 11 で **毎回再実行**（スキップ禁止）
- **再現性**: 全コマンドはリポジトリルートからの相対パスで記述
- **双方向検証**: ADR ⇔ 判定表の片方向更新を 2 項目（#1 + #2）で検出

## 完了確認

- [x] 5 種検証コマンドが期待結果 + FAIL アクション付きで記述
- [x] 不変条件 #5 ガードが必須項目として識別
- [x] docs-only TDD RED 解釈が文書化
- [x] Phase 5 / 9 / 11 で再実行する command suite として固定
