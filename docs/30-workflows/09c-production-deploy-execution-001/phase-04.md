# Phase 4: verify suite 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-09c-production-deploy-execution-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | verify suite 設計 |
| Wave | 9 |
| Mode | serial（最終 / production mutation の execution 半身） |
| 作成日 | 2026-05-02 |
| 前 Phase | 3 (実装計画 + コマンド列 + rollback 分岐) |
| 次 Phase | 5 (preflight 実行 + user 承認 1 回目) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | REQUIRED（このタスク全体で固定 / Phase 4 自体は gate なし） |

## 目的

production deploy 実行（execution-only タスク）における **検証 suite 体系** を設計する。
親 09c が docs-only で固めた 13 ステップ runbook に対し、本タスクの execution が **何を / どのコマンドで / どんな evidence で** 検証するかを 3 層 suite に分割し、AC-2 / 3 / 4 / 5 / 7 / 10 / 11 / 13 を suite に対応付ける。

実コマンドは Phase 5 以降で実行する。本 Phase は **suite ID と検証コマンド一覧の固定**のみ行う。

## 実行タスク

1. 3 層 verify suite（preflight / production smoke + 認可境界 / 24h メトリクス）の suite ID 採番
2. 各 suite に検証コマンドを 1 つ以上紐付け（`bash scripts/cf.sh ...` / `curl` / `git rev-parse` / `grep`）
3. AC-2 / 3 / 4 / 5 / 7 / 10 / 11 / 13 ↔ suite ID matrix
4. 失敗時差し戻し先（Phase 5 / 6 / 7 / 9 / 11 のいずれに戻すか）
5. evidence 保存先（`outputs/phase-XX/` のどのファイルに残すか）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC 13 件 / scope |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-04.md | 親 verify suite テンプレ |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md | 親 runbook 本体 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / D1 / secrets / triggers の正本 |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper（直 wrangler 禁止） |

## 実行手順

### ステップ 1: 3 層 suite の採番

- preflight 層（PF-*）: main 同期 / Cloudflare identity / migrations dry-run / secrets 存在確認
- production smoke + 認可境界層（SM-*）: 10 ページ + admin / member 認可境界 + manual sync
- 24h メトリクス層（MT-*）: Workers req / D1 reads,writes / 不変条件 #5 #15 再確認

### ステップ 2: 検証コマンド一覧

```bash
# === preflight (PF-*) ===
git status --short
git rev-parse origin/main
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web

# === production smoke (SM-*) ===
curl -sI "${PRODUCTION_WEB}/" | head -1
curl -sI "${PRODUCTION_WEB}/members" | head -1
curl -sI "${PRODUCTION_WEB}/members/sample-id" | head -1
curl -sI "${PRODUCTION_WEB}/login" | head -1
curl -sI "${PRODUCTION_WEB}/profile" | head -1
curl -sI "${PRODUCTION_WEB}/admin" | head -1
curl -sI "${PRODUCTION_WEB}/admin/members" | head -1
curl -sI "${PRODUCTION_WEB}/admin/tags" | head -1
curl -sI "${PRODUCTION_WEB}/admin/schema" | head -1
curl -sI "${PRODUCTION_WEB}/admin/meetings" | head -1

# === 24h metrics (MT-*) ===
# Workers / D1 dashboard を click 取得（screenshots/）
rg "D1Database" apps/web/.vercel/output/ || echo "PASS: no D1 import in web bundle"
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml

# === Cloudflare CLI 経路 grep（AC-13）===
git grep -n "wrangler " -- ':!docs/' ':!scripts/cf.sh' ':!**/node_modules/**' || echo "PASS: no direct wrangler call"
```

### ステップ 3: AC ↔ suite matrix

| AC | 内容 | 対応 suite ID |
| --- | --- | --- |
| AC-2 | `git rev-parse origin/main` と production deploy 対象 commit が一致 | PF-1 |
| AC-3 | `bash scripts/cf.sh whoami` の Cloudflare account identity 一致 | PF-2 |
| AC-4 | D1 migration が `Applied` | PF-3 + Phase 6 実行結果 |
| AC-5 | 必須 7 種 secrets の存在 | PF-4 + PF-5 |
| AC-7 | production 10 ページ + 認可境界 smoke PASS | SM-1〜SM-5 |
| AC-10 | 24h Workers req < 5k/day, D1 無料枠 10% 以下 | MT-1 + MT-2 |
| AC-11 | 不変条件 #4 / #5 / #10 / #11 / #15 production 再確認 | SM-3 + SM-4 + MT-3 + MT-4 |
| AC-13 | 全 Cloudflare 操作が `bash scripts/cf.sh` 経由 | grep evidence |

### ステップ 4: 失敗時差し戻し先

| suite | 失敗 | 差し戻し先 |
| --- | --- | --- |
| PF-1 | `origin/main` 未同期 | Phase 5 main fetch から再実行 |
| PF-2 | account identity 不一致 | Phase 5 を中断、`.env` op 参照と 1Password を確認 |
| PF-3 | Applied 不足 | Phase 6 で apply 実行 |
| PF-4 / PF-5 | 必須 secret 欠落 | Phase 5 中断、04 infra task で secret 登録 |
| SM-1〜SM-5 | smoke 失敗 | Phase 9 で原因切り分け、必要なら Phase 7 で rollback |
| MT-1 / MT-2 | 無料枠超過 | Phase 11 で incident、cron 頻度低下 / query 最適化 |
| AC-13 grep | `wrangler` 直呼び出し検出 | 該当箇所を `bash scripts/cf.sh` ラッパーに修正 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | PF-* suite を preflight evidence に紐付け |
| Phase 6 | PF-3 結果を migration apply の前提として使う |
| Phase 7 | deploy 後の SM-* 入口疎通を deploy evidence に転記 |
| Phase 9 | SM-* suite を smoke evidence に展開 |
| Phase 10 | suite PASS / FAIL 一覧を GO/NO-GO 判定資料に |
| Phase 11 | MT-* suite を 24h-metrics.md / share-evidence.md に紐付け |

## 多角的チェック観点（不変条件）

- #4: SM-3 で `/profile` の編集 form 不在を click 確認
- #5: MT-3 で `apps/web/.vercel/output/` に `D1Database` import が無いことを `rg` 確認
- #10: MT-1 / MT-2 で 24h Workers / D1 が無料枠 10% 以下
- #11: SM-4 で admin UI に本人本文編集 form 不在を click 確認
- #15: MT-4 で attendance 重複防止 SQL が 0 行

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 3 層 suite ID 採番 | 4 | pending | PF / SM / MT |
| 2 | 検証コマンド一覧固定 | 4 | pending | `bash scripts/cf.sh` 経由 |
| 3 | AC ↔ suite matrix | 4 | pending | AC-2/3/4/5/7/10/11/13 |
| 4 | 差し戻し先 | 4 | pending | Phase 5/6/7/9/11 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | verify suite 設計サマリ |
| ドキュメント | outputs/phase-04/verify-suite.md | 3 層 suite × 検証コマンド × AC matrix × 差し戻し先 |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] 3 層 × 各層 3 件以上 = 計 9 件以上の suite 定義
- [ ] AC-2 / 3 / 4 / 5 / 7 / 10 / 11 / 13 すべてが suite に対応付け済み
- [ ] 各 suite に `bash scripts/cf.sh` 経由（または `curl` / `git` / `rg`）の検証コマンドが付与
- [ ] 各 suite に失敗時差し戻し先が記載
- [ ] verify-suite.md 内に `wrangler` 直呼び出し記述が 0 件

## タスク100%実行確認【必須】

- 全実行タスクが completed
- verify-suite.md / main.md が `outputs/phase-04/` 配下に存在
- AC ↔ suite matrix で対応付け漏れが 0 件
- artifacts.json の phase 4 を completed に更新

## 次 Phase

- 次: 5 (preflight 実行 + user 承認 1 回目)
- 引き継ぎ事項: PF-* suite の検証コマンド + AC matrix + 差し戻し先
- ブロック条件: AC-2/3/4/5/7/10/11/13 のいずれかが suite 未対応で次 Phase に進まない

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| suite 設計が docs-only 親 09c と乖離 | execution が runbook を逸脱 | 親 phase-04 / phase-12 implementation-guide を必須参照に固定 |
| `wrangler` 直記述が suite に紛れる | AC-13 違反 | verify-suite.md 完成後に `git grep wrangler` で 0 件確認 |
| AC-13 の grep が誤検知 | 偽陽性で先に進めない | `':!docs/'` `':!scripts/cf.sh'` `':!**/node_modules/**'` で除外パスを固定 |
