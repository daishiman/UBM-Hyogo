# UT-21 Phase 11 smoke 再実行（実 secrets / 実 D1 環境・NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-phase11-smoke-rerun-real-env-001 |
| タスク名 | Phase 11 smoke の実環境再実行（NON_VISUAL 証跡更新） |
| 分類 | 検証 / smoke 再実行 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2（Cloudflare secrets 配備後・09a / 09c smoke と並走可） |
| 状態 | 未実施 |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | 09b-parallel-cron-triggers-monitoring-and-release-runbook（runbook 内 smoke 章へ証跡を追加） |
| 検出元 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` (UT21-U04) |
| 親タスク | `task-ut21-forms-sync-conflict-closeout-001.md` |

---

## 1. 目的

UT-21 Phase 11 で残存した smoke 証跡の TBD 部分を、実 secrets（`SYNC_ADMIN_TOKEN` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`）と実 D1（staging）環境で再実行し、NON_VISUAL 証跡として `outputs/phase-11/` 配下を更新する。

UI 変更を伴わないため screenshot は取得しない（`visualEvidence=NON_VISUAL`）。代わりに以下のログ系証跡を残す:
- `bash scripts/cf.sh` 実行ログ
- `wrangler tail` 出力
- `sync_jobs` の実行履歴 SELECT 結果
- 認可境界（401 / 403 / 200 / 409）の curl 実行ログ

---

## 2. スコープ

### 含むもの

- `POST /admin/sync/schema` を staging 環境で Bearer 付き / 不正 Bearer / Bearer なし / 同種 job 実行中の 4 ケースで叩く
- `POST /admin/sync/responses` を同 4 ケースで叩く
- `sync_jobs` テーブルの結果 SELECT（status / metrics_json / started_at / finished_at）を証跡化
- `wrangler tail` でエラー有無を確認
- 結果を `outputs/phase-11/` 配下のログファイルへ追記（既存 TBD を実値に置換）

### 含まないもの

- production 環境での実行（staging のみ）
- 新規実装の追加
- screenshot（NON_VISUAL のため不要）
- commit / PR 作成

---

## 3. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out |
| 上流 | UT-25-cloudflare-secrets-sa-json-deploy | secrets が staging に配備されていること |
| 上流 | 03a / 03b 実装完了 | smoke 対象の sync 実装が staging に deploy 済み |
| 上流 | 09b runbook | smoke 手順の正本 |
| 上流 | UT-24-staging-deploy-smoke-test | staging 環境動作前提 |

---

## 4. 実行ステップ

### Step 1: 前提確認

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
```

`SYNC_ADMIN_TOKEN` / Google secrets が staging に配備済みかを `wrangler secret list --env staging` 相当で確認。

### Step 2: 認可境界 4 ケース実行

| ケース | 期待 | 記録項目 |
| --- | --- | --- |
| Bearer なし | 401 | HTTP status / response body |
| Bearer 不正 | 403 | 同上 |
| Bearer 正常 | 200 | 同上 + `sync_jobs` 行 |
| 同種 job 実行中 | 409 | 同上 + `sync_jobs.status='running'` 確認 |

### Step 3: `sync_jobs` 結果確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT id, job_kind, status, started_at, finished_at, metrics_json FROM sync_jobs ORDER BY started_at DESC LIMIT 10"
```

### Step 4: 証跡更新

`docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-11/` 配下のファイルで TBD と書かれている箇所を実値に置換。

---

## 5. 苦戦箇所【記入必須】

### 中学生レベルの説明

- 設計図ができても「本当に動くか」は実際にスイッチを入れてみないとわからない
- スプレッドシートの代わりに本物のフォーム回答とつながるか、合言葉（Bearer）を間違えたら本当に止まるか、を本物の環境で確認する
- 写真は撮らない（画面じゃなくて裏側の動きだから）。代わりに「動いた記録」をテキストで残す

### 技術詳細

| 項目 | 内容 |
| --- | --- |
| 症状 | Phase 11 smoke 証跡が TBD のまま残存 |
| 原因 | UT-21 実装当時、staging 環境の secrets / D1 が未配備で、模擬値での smoke しかできなかった |
| Bearer guard 実環境再現の難しさ | local ではトークンを mock しがちだが、実環境では `wrangler secret put` 経由の値と request header が一致するかが本物の検証ポイント。op:// 参照経由の `SYNC_ADMIN_TOKEN` が `bash scripts/cf.sh` 実行時に揮発的に注入されるため、CLI ログに値が残らないことも要確認 |
| 同種 job 409 の再現 | 単発呼び出しでは出ない。バックグラウンドで 1 本走らせて即座にもう 1 本叩く必要があり、タイミング設計が必要 |
| 証跡形式 | NON_VISUAL のため screenshot 不要。代わりに HTTP status / response body / `sync_jobs` SELECT 結果 / `wrangler tail` 抜粋の 4 点セットを揃える |
| 再発防止 | smoke 再実行は secrets 配備直後に runbook に組み込む。TBD 残しを許容しない |

---

## 6. システム仕様反映メモ

| 領域 | 反映先 | 内容 |
| --- | --- | --- |
| 認可境界 | `SYNC_ADMIN_TOKEN`（Bearer） | 401 / 403 / 200 / 409 の 4 状態を実環境で確認 |
| 監査台帳 | `sync_jobs` | smoke 実行ごとに 1 行追加されることを SELECT で確認 |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ | `wrangler` 直接実行禁止（CLAUDE.md） |
| secrets | 1Password Vault `Employee` / item `ubm-hyogo-env` | op:// 参照経由でのみ注入。実値はログ・ファイルに残さない |

---

## 7. 完了条件

- [ ] 認可境界 4 ケース（401 / 403 / 200 / 409）が staging で再現確認済み
- [ ] `sync_jobs` の SELECT 結果が証跡として残っている
- [ ] `outputs/phase-11/` 配下の TBD が実値に置換済み
- [ ] secret 値はログ・ファイルに転記していない
- [ ] commit / PR は実行しない

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-11/` | TBD 残存 smoke 証跡 |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` | 検出原典 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out |
| 必須 | `CLAUDE.md` Cloudflare 系 CLI 実行ルール | `bash scripts/cf.sh` 必須 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | secrets / D1 current facts |
