# Phase 5 成果物: runbook（`bash scripts/cf.sh` ベース起動手順 spec）

> 本 runbook は **spec / 雛形** であり、本 PR では実行・evidence 取得を行わない。
> 受け側実装タスク（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）が本 spec を入力に実 runbook を完成させ、親 UT-06 production deploy runbook に統合する。
> CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い、**全コマンドは `bash scripts/cf.sh` 経由**。`wrangler` 直叩きは本 runbook 内ゼロ件。

## 0. 前提と禁止事項

- 本 runbook は **read-only** であり、Cloudflare API の mutation endpoint（`POST` / `PUT` / `PATCH` / `DELETE`）を呼び出さない。
- すべての CLI 呼び出しは `bash scripts/cf.sh` ラッパー経由とし、`wrangler` 直叩き / `wrangler login` を禁止。
- `.env` の中身を `cat` / `Read` / `grep` で読まない（実値は op 参照のみだが慣性事故防止）。
- secret 値 / OAuth トークン / API Token を log・出力・コミット・PR 説明に転記しない。
- `expectedWorker` は `ubm-hyogo-web-production` で固定。
- 本 runbook は production deploy / DNS 変更 / route update / Worker delete を含まない（Phase 3 NG-5）。

## 1. 事前確認

### 1.1 認証確認

```bash
# CLOUDFLARE_API_TOKEN を op 経由で揮発的に注入し whoami を確認
bash scripts/cf.sh whoami
```

期待: 自分の Cloudflare account / scope が表示され、token は標準出力に現れない。

### 1.2 環境バージョン

```bash
mise install                # Node 24 / pnpm 10 が固定済み
mise exec -- pnpm install   # ワークツリーごとに依存解決
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 2. inventory 取得

### 2.1 script 実行（受け側実装後の標準手順）

```bash
bash scripts/cf.sh route-inventory \
  --account-id <ACCOUNT_ID プレースホルダ> \
  --output-dir outputs/ \
  --expected-worker ubm-hyogo-web-production
```

期待 exit code:

| exit code | 意味 | 次アクション |
| --- | --- | --- |
| 0 | 全 route / custom domain が `ubm-hyogo-web-production` を指す（mismatches = 0） | production deploy 承認 OK |
| 1 | mismatch あり（旧 Worker route 残存等） | 後続調査・dashboard 確認 → 別タスク起票 |
| 2 | script error（API 401/403/429/5xx / parse error） | log を確認し再試行 |

### 2.2 出力ファイル確認

```bash
# JSON / Markdown が生成されたか
ls -la outputs/route-inventory.json outputs/route-inventory.md

# entries / mismatches 件数を目視（実値は mask 済）
jq '{entriesCount: (.entries|length), mismatchesCount: (.mismatches|length), expectedWorker}' outputs/route-inventory.json
```

## 3. secret-leak gate

### 3.1 grep gate（出力 / log すべてに適用）

```bash
# secret pattern 検出（マッチで非 0 終了）
grep -nEi '(api[_-]?token|secret|bearer\s|authorization:\s|password|cf[_-]?api[_-]?key)' \
  outputs/route-inventory.json outputs/route-inventory.md && echo "FAIL" || echo "PASS"
```

期待: `PASS`（マッチ 0 件）。マッチした場合は **直ちに output を破棄**し受け側タスクで原因調査。

### 3.2 mutation method gate

```bash
# script ソース内に mutation method がないこと（ST-02 / NG-1 連動）
grep -nE '"(POST|PUT|PATCH|DELETE)"' scripts/cloudflare/route-inventory.* 2>/dev/null && echo "FAIL" || echo "PASS"
```

### 3.3 `wrangler` 直叩き gate

```bash
# scripts/cf.sh 内部・docs 内禁止例を除外して直叩き有無を確認（ST-03 / NG-2 連動）
grep -rnE 'wrangler\s+(deploy|secret|tail|d1|kv|r2|publish)' scripts/cloudflare/ 2>/dev/null && echo "FAIL" || echo "PASS"
```

## 4. 親 UT-06 production deploy runbook との統合

本 runbook は親タスクの runbook（`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`）に対して、以下 3 箇所に追記される（受け側実装タスクで実施）:

| 親 runbook 節 | 追記内容 |
| --- | --- |
| 節 0（前提と禁止事項） | inventory script が read-only / mutation 不実行 / `bash scripts/cf.sh` 経由のみ |
| 節 2（Worker inventory）末尾 | dashboard 手動 + 本 script API 出力 の二重化 |
| route / custom domain 突合手順の前段 | dashboard 操作前に script を実行し JSON / Markdown を evidence 添付 |

## 5. ロールバック / 緊急時

本 runbook は read-only のため **rollback 対象は存在しない**。万一以下の状況が発生した場合:

| 状況 | 対応 |
| --- | --- |
| 出力に secret 値が混入 | 直ちに output ファイルを削除（`rm outputs/route-inventory.{json,md}`）/ コミット禁止 / 受け側タスクで grep mask 強化 |
| script が mutation を発行した形跡 | 即時停止 / NG-1 違反として受け側タスクを差し戻し |
| `wrangler` 直叩きが script に混入 | NG-2 違反として受け側タスクを差し戻し |

## 6. 完了条件（runbook 単位）

- [ ] `bash scripts/cf.sh whoami` が成功
- [ ] `outputs/route-inventory.json` / `.md` が生成される
- [ ] mismatches = 0 件（exit code 0）
- [ ] secret-leak grep が 0 マッチ（PASS）
- [ ] mutation method grep が 0 マッチ（PASS）
- [ ] `wrangler` 直叩き grep が 0 マッチ（PASS）
- [ ] log / 出力に secret 値・Token 値が混入していない目視確認

## 7. 検証コマンド一覧（チートシート）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test                                  # 受け側実装後
bash scripts/cf.sh whoami
bash scripts/cf.sh route-inventory --account-id <…> --output-dir outputs/ --expected-worker ubm-hyogo-web-production
```

> 本 runbook spec は `template_created` 状態。実 runbook（実値・実 evidence 含む）は受け側実装タスクが完成させる。
