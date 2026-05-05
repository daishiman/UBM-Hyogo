# Phase 5 成果物: ADR 本文 runbook

> base case 確定（Phase 3）: 案 X (cutover) / B-1（`docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`）/ C-1 / D-1。

## Step 1: 配置先確認

```bash
ls docs/00-getting-started-manual/specs/adr/ 2>/dev/null \
  || mkdir -p docs/00-getting-started-manual/specs/adr/
```

`find docs -type d -iname '*adr*'` で既存 adr ディレクトリ不在を確認済（`docs/30-workflows/completed-tasks/task-husky-rejection-adr` のみで集約用ではない）。新設する。

## Step 2: ファイル名規約と連番

| 項目 | 値 |
| --- | --- |
| ファイル名 | `0001-pages-vs-workers-deploy-target.md` |
| 連番 | `0001`（adr/ ディレクトリ新設のため第 1 号） |
| 配置先 | `docs/00-getting-started-manual/specs/adr/` |

## Step 3: ADR セクション構成（MADR 簡略形式）

| セクション | 必須内容 | 出典 |
| --- | --- | --- |
| Title | `# ADR-0001: apps/web deploy target (Cloudflare Pages vs Workers)` | - |
| Status | `Accepted` （Phase 3 ゲート PASS のため Draft → Accepted 昇格） | Phase 3 main.md |
| Context | drift 4 ファイル現状（CLAUDE.md / wrangler.toml / web-cd.yml / deployment-cloudflare.md）+ Issue #287 背景 + 2026-04-29 → 2026-05-01 の wrangler.toml 既移行事実 | Phase 1 main.md / Phase 2 decision-criteria.md |
| Decision | **案 X (cutover) を採択**: Cloudflare Workers + `@opennextjs/cloudflare` を canonical deploy target とする。`web-cd.yml` の `pages deploy` → `wrangler deploy --env <env>` 切替および Cloudflare side Pages project → Workers script 切替は別タスク `task-impl-opennext-workers-migration-001` で実施 | Phase 3 main.md |
| Consequences | (a) 即時影響、(b) 別タスク委譲事項、(c) 不変条件 #5 維持の **必須**明文化、(d) `@opennextjs/cloudflare` バージョン互換前提、(e) 三者同期の必要性、(f) 保留採択時の追加コスト（参考） | Phase 2 cutover-vs-hold-comparison.md / Phase 3 残課題 |
| Alternatives Considered | 案 Y (保留) / 案 Z (段階移行) の却下根拠 | Phase 2 cutover-vs-hold-comparison.md |
| Related | 関連タスク 3 タスク責務分離表（本 ADR / migration-001 / UT-GOV-006）+ Refs #287 + 親タスク UT-CICD-DRIFT | Phase 1 main.md / Phase 3 main.md |
| Links | Phase 1〜3 outputs / Issue #287 | - |

## Step 4: ADR レビューチェックリスト 7 項目走査

`outputs/phase-04/doc-consistency-checks.md` のチェックリストを ADR 本文に対し走らせる：

```bash
ADR_PATH="docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md"

# 1. Status: Accepted
rg -n "^## Status" "$ADR_PATH" && rg -n "Accepted" "$ADR_PATH"
# 2. Context が 4 ファイル参照
rg -n "wrangler\.toml|web-cd\.yml|deployment-cloudflare\.md|CLAUDE\.md" "$ADR_PATH"
# 3. Decision に TBD 不在
rg -n "TBD" "$ADR_PATH" && echo "FAIL" || echo "PASS"
# 4. 不変条件 #5
rg -n "d1_databases" "$ADR_PATH"
# 5. 関連タスク 2 件
rg -n "task-impl-opennext-workers-migration-001|UT-GOV-006" "$ADR_PATH"
# 6. Refs #287 / Closes 不在
rg -n "Refs #287" "$ADR_PATH" && (rg -n "Closes #287" "$ADR_PATH" && echo "FAIL: Closes禁止" || echo "PASS")
# 7. @opennextjs/cloudflare バージョン
rg -n "@opennextjs/cloudflare|1\.19\.4" "$ADR_PATH"
```

FAIL 1 件でも残れば Phase 5 内で修正完結（Phase 6 へ降ろさない）。

## ADR 本文ドラフト → 正式版への置換ポイント

`outputs/phase-02/adr-draft.md` の以下プレースホルダを Phase 5 適用時に実値化：

| プレースホルダ | 実値（cutover 採択） |
| --- | --- |
| phase-02 の historical draft status | `Status: Accepted` |
| `Decision: TBD（Phase 3 ゲートで確定）` | `Decision: 案 X (cutover) を採択。Cloudflare Workers + @opennextjs/cloudflare を canonical deploy target とする。...` |
| `ADR-NNNN` | `ADR-0001` |
| ファイル名（NNNN） | `0001` |

## 完了確認

- [x] Step 1-4（配置先確認 / ファイル名 / セクション構成 / レビュー走査）が完結
- [x] ADR セクション 7 セクション全項目が表化（Title / Status / Context / Decision / Consequences / Alternatives / Related / Links）
- [x] Phase 4 レビューチェックリスト 7 項目を ADR 本文に走らせる手順が含まれる
- [x] 不変条件 #5 維持の **必須**化が Consequences に固定
- [x] `Closes #287` 禁止 / `Refs #287` のみ
