# Phase 7: production deploy 実行（API / Web）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-09c-production-deploy-execution-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | production deploy 実行（API Workers / Web Workers via @opennextjs/cloudflare） |
| Wave | 9 |
| Mode | serial（最終 / production mutation の execution 半身） |
| 作成日 | 2026-05-02 |
| 前 Phase | 6 (production D1 migration 適用) |
| 次 Phase | 8 (release tag 付与 + push) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | REQUIRED（Phase 5 GO の継続有効性に依存。新規 mutation を伴うため Phase 5 GO 後 24h 以内に実行） |

## 目的

Phase 6 で D1 migration を適用した production schema に対し、API Workers と Web Workers（`@opennextjs/cloudflare` 経由 / `apps/web`）を **production deploy** する。
各 deploy の VERSION_ID を保存し、rollback 用 payload とする。deploy URL の疎通を `curl -sI` で初期確認する（本格 smoke は Phase 9）。

## 実行タスク

1. API deploy（`pnpm --filter @ubm/api deploy:production`）
2. API VERSION_ID の保存
3. Web deploy（`pnpm --filter @ubm/web deploy:production`）
4. Web VERSION_ID の保存
5. 各 deploy URL の初期 200/302 疎通確認
6. exit 0 確認 + deploy 出力の evidence 保存
7. 異常時 rollback 手順の明示（`bash scripts/cf.sh rollback <VERSION_ID> --config ...`）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-6 / AC-13 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-05.md | preflight + GO log |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-06.md | migration apply 完了確認 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | 親 runbook Step 7 / Step 8 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | deploy spec |
| 必須 | apps/api/wrangler.toml / apps/web/wrangler.toml | env production 設定 |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper |

## 実行手順

### ステップ 1: deploy 開始前の同期確認

```bash
git rev-parse origin/main
# expected: Phase 5 preflight-evidence.md の SHA と一致
git status --short
# expected: 空
```

- evidence 保存先: `outputs/phase-07/deploy-evidence.md` の "deploy 開始時 commit 整合" セクション
- 不一致なら Phase 5 から再起動（main 再 fetch + user 再承認）

### ステップ 2: API deploy

```bash
pnpm --filter @ubm/api deploy:production
# 内部で実行: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
# expected:
#   - "Deployed ubm-hyogo-api triggers ..." の表示
#   - Version ID: <UUID> 行
#   - exit 0
```

- evidence 保存先: `outputs/phase-07/deploy-evidence.md` の "API deploy 出力" セクション（stdout 全文）
- 対応 AC: AC-6（API 側）

### ステップ 3: API VERSION_ID 保存

- deploy stdout から `Version ID:` の値を抽出
- 保存先: `outputs/phase-07/version-ids.md` の "API" セクション
- フォーマット例:
  ```
  ## API
  - service: ubm-hyogo-api
  - env: production
  - deployed_at: <ISO8601>
  - version_id: <UUID>
  - rollback_command: bash scripts/cf.sh rollback <UUID> --config apps/api/wrangler.toml --env production
  ```

### ステップ 4: Web deploy

```bash
pnpm --filter @ubm/web deploy:production
# 内部で実行: pnpm build && bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
# expected:
#   - "Deployed ubm-hyogo-web ..." の表示
#   - Version ID: <UUID> 行
#   - exit 0
```

- evidence 保存先: `outputs/phase-07/deploy-evidence.md` の "Web deploy 出力" セクション
- 対応 AC: AC-6（Web 側）
- 注意: 不変条件 #5（apps/web から D1 直接アクセス禁止）に違反する build 出力でないこと → Phase 11 で `rg D1Database apps/web/.vercel/output/` 確認

### ステップ 5: Web VERSION_ID 保存

- 保存先: `outputs/phase-07/version-ids.md` の "Web" セクション
- フォーマット例:
  ```
  ## Web
  - service: ubm-hyogo-web
  - env: production
  - deployed_at: <ISO8601>
  - version_id: <UUID>
  - rollback_command: bash scripts/cf.sh rollback <UUID> --config apps/web/wrangler.toml --env production
  ```

### ステップ 6: deploy URL 初期疎通

```bash
PRODUCTION_API="<deploy 出力に含まれる workers.dev URL>"
PRODUCTION_WEB="<deploy 出力に含まれる Web URL>"

curl -sI "${PRODUCTION_API}/healthz" | head -1
curl -sI "${PRODUCTION_WEB}/" | head -1
```

- expected: API healthz 200、Web `/` 200
- evidence 保存先: `outputs/phase-07/deploy-evidence.md` の "初期疎通" セクション
- 注意: 認可が必要なページの確認は Phase 9 smoke で実施。本 Phase は **入口疎通のみ**

### ステップ 7: 異常時 rollback 手順の明示

| 失敗ケース | 検出 | 復旧コマンド |
| --- | --- | --- |
| API deploy が exit 非 0 | stdout / stderr | 直前の API VERSION_ID（前回 deploy）に rollback: `bash scripts/cf.sh rollback <PREV_API_VERSION_ID> --config apps/api/wrangler.toml --env production` |
| Web deploy が exit 非 0 | stdout / stderr | 直前の Web VERSION_ID に rollback: `bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID> --config apps/web/wrangler.toml --env production` |
| 初期疎通で 5xx | `curl -sI` non-2xx | 該当サービスのみ前 VERSION_ID に rollback、Phase 11 incident-log.md 作成 |
| API は成功 / Web 失敗 | 片側 deploy 後 | 成功側を維持し失敗側のみ rollback。組み合わせ整合性は Phase 9 smoke で再判定 |
| migration と code の整合崩れ | smoke で 5xx | 1) Web/API rollback、2) Phase 6 で revert SQL 適用、3) user 再承認後に再 deploy |

- rollback 用 PREV_VERSION_ID は **前回 production deploy 時の VERSION_ID**。本タスクの初回 deploy では Cloudflare dashboard の deployments 履歴から取得。dashboard URL を `version-ids.md` に記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | migration 適用後 schema を deploy 対象 commit が前提に |
| Phase 8 | deploy 成功した main commit に対して release tag を付与 |
| Phase 9 | API/Web URL に対して 10 ページ + 認可境界 smoke |
| Phase 10 | deploy 出力 + 初期疎通を GO/NO-GO 判定資料に転記 |
| Phase 11 | 24h メトリクスで Workers req / D1 reads/writes を観測 |

## 多角的チェック観点（不変条件）

- #4: deploy 後の `/profile` 編集 form 不在は Phase 9 smoke で確認（本 Phase では入口疎通のみ）
- #5: Web deploy 出力に `apps/web` → D1 binding が無いこと（`wrangler.toml` の bindings は API 側に閉じる）→ Phase 11 で `rg D1Database` 再確認
- #10: deploy 自体の Workers req は数回 / 微小、無料枠影響なし
- #11: admin UI 編集 form 不在は Phase 9 で確認
- #15: attendance テーブル不変条件は Phase 11 で SQL 再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | deploy 開始時 commit 整合 | 7 | pending | `git rev-parse origin/main` 再確認 |
| 2 | API deploy | 7 | pending | `pnpm --filter @ubm/api deploy:production` |
| 3 | API VERSION_ID 保存 | 7 | pending | rollback 用 |
| 4 | Web deploy | 7 | pending | `pnpm --filter @ubm/web deploy:production` |
| 5 | Web VERSION_ID 保存 | 7 | pending | rollback 用 |
| 6 | 初期疎通 | 7 | pending | API healthz / Web `/` |
| 7 | rollback 手順明示 | 7 | pending | 失敗ケース 5 種 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/deploy-evidence.md | API/Web deploy stdout + 初期疎通 + commit 整合 |
| ドキュメント | outputs/phase-07/version-ids.md | API / Web の VERSION_ID + rollback コマンド |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 完了条件

- [ ] API deploy が exit 0 + stdout に `Version ID` を含む
- [ ] Web deploy が exit 0 + stdout に `Version ID` を含む
- [ ] version-ids.md に API / Web の VERSION_ID + rollback コマンドが完備
- [ ] API healthz / Web `/` の初期疎通が 200
- [ ] 全 Cloudflare コマンドが `bash scripts/cf.sh` または `pnpm --filter ... deploy:production`（内部で `cf.sh` 経由）（AC-13）
- [ ] deploy stdout に **secret 値が含まれていない**（含まれていた場合は masking してから evidence 化）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- deploy-evidence.md / version-ids.md 配置済み
- API / Web とも VERSION_ID が記録され rollback 即時可能な状態
- artifacts.json の phase 7 を completed に更新

## 次 Phase

- 次: 8 (release tag 付与 + push)
- 引き継ぎ事項: deploy 対象 commit SHA / API VERSION_ID / Web VERSION_ID / 初期疎通結果
- ブロック条件: いずれかの deploy が exit 非 0 / 初期疎通が non-2xx / VERSION_ID 未取得

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| API/Web どちらかの deploy が失敗 | サービス断絶 / 整合崩れ | 失敗側のみ前 VERSION_ID に即 rollback、Phase 11 incident-log 作成 |
| migration と deploy の commit 不一致 | runtime error 大量発生 | ステップ 1 で `git rev-parse origin/main` を Phase 5 SHA と照合、不一致なら deploy 中止 |
| VERSION_ID 取得漏れ | rollback 不能 | stdout を **全文転記**してから VERSION_ID 抽出。dashboard 履歴 URL も記録 |
| `wrangler` 直実行 | AC-13 違反 | `pnpm --filter ... deploy:production` 経由 or `bash scripts/cf.sh deploy ...` のみ。`wrangler deploy` 等は禁止 |
| deploy stdout に secret 値 | 漏洩 | evidence 化前に masking、生 log は削除 |
| Web bundle に D1 binding 混入 | 不変条件 #5 違反 | Phase 11 の `rg D1Database apps/web/.vercel/output/` で 0 hit を確認、混入時は 02c 設定へ差し戻し |
| 初期疎通だけでは smoke 完結しない | 認可境界 / form 不在の見落とし | 本 Phase は入口疎通のみで完了とせず、Phase 9 smoke 完了を AC-7 の正本とする |
| **rollback 自体が再 mutation** | Phase 5 GO の射程 | rollback 1 回までは Phase 5 GO 内、再 deploy は user 再承認必須 |
