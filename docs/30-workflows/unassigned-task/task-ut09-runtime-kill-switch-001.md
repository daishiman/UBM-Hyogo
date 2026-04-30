# UT-09 runtime kill-switch - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-runtime-kill-switch-001 |
| タスク名 | Sheets runtime kill-switch / cron 停止確認（B-01 削除前の暫定停止） |
| 分類 | runtime 安全化 |
| 対象機能 | Sheets to D1 sync（runtime 停止） |
| 優先度 | 高（次 wave） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 direction reconciliation レビュー |
| 発見日 | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-09 Phase 12 review により、`apps/api` には Sheets API 系の実装（`/admin/sync` エンドポイント、Sheets cron schedule）が残存していることが判明した。`task-ut09-direction-reconciliation-001` にて方針は Forms API 分割へ統一することが決定されたが、B-01（impl 撤回）/ B-02（migration 撤回）/ B-07（secret 削除）を実施する前に runtime 上で当該経路を安全に停止しておく必要がある。

本タスクは「実装削除の前に runtime を止める」という順序制御を保証するための暫定停止タスクである。

### 1.2 問題点・課題

B-01 の impl 削除を runtime kill-switch より先行させると、本番 cron が削除済みエンドポイントを叩いて 5xx を連発するリスクがある。`apps/api/wrangler.toml` の Sheets cron schedule が有効なまま B-01 を適用すると、Workers が存在しないハンドラを呼び出し、本番ログにエラーが蓄積する。

### 1.3 放置した場合の影響

- Sheets cron が削除済み endpoint を呼び続け、Cloudflare ダッシュボードに 5xx が積み上がる
- B-07 の secret 削除前に cron が走ると、`GOOGLE_SHEETS_SA_JSON` 参照エラーが本番ログに残る
- `/admin/sync` mount が残存したまま B-01 を適用すると、route 解決が壊れた状態でデプロイされる可能性がある
- 後続 blocker（B-01 / B-02 / B-07）の安全な実施順序が保証されない

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api` の Sheets 経路を runtime レベルで停止し、B-01 / B-02 / B-07 を安全に実施できる前提条件を整える。

### 2.2 最終ゴール

- `apps/api/wrangler.toml` から Sheets cron schedule が削除され、staging / production デプロイに反映されている
- `/admin/sync` の mount が解除（または 410 Gone 応答に変更）されており、cron trigger から到達不能になっている
- unknown cron fallback が適切に定義されており、想定外 cron trigger が 5xx を返さない
- 上記 3 点が AC として明文化されており、B-01 / B-02 / B-07 の前提条件として参照可能である

### 2.3 スコープ

#### 含むもの

- `apps/api/wrangler.toml` の Sheets cron schedule 行の削除
- `apps/api/src/routes/admin/sync.ts` の mount 解除、または `/admin/sync` への 410 Gone レスポンス実装
- unknown cron fallback ハンドラの有無確認・必要に応じた追加
- staging デプロイ後の `/admin/sync` 404 / 410 確認
- cron trigger 一覧からの Sheets 経路消滅確認

#### 含まないもの

- B-01（impl ファイル削除・routes からの完全撤去）
- B-02（`sync_locks` / `sync_job_logs` migration 撤回）
- B-07（`GOOGLE_SHEETS_SA_JSON` secret 削除）
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-ut09-direction-reconciliation-001` の方針決定（Forms 方針統一）が完了していること
- staging 環境へのデプロイ権限があること（`bash scripts/cf.sh` 経由）
- `apps/api/wrangler.toml` の現在の cron schedule 設定を把握していること

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut09-direction-reconciliation-001 | 方針決定（Forms 統一）の完了が前提 |
| 下流 | B-01（impl 撤回） | 本タスク完了後に安全に実施可能になる |
| 下流 | B-02（migration 撤回） | 本タスク完了後に安全に実施可能になる |
| 下流 | B-07（secret 削除） | 本タスク完了後に安全に実施可能になる |

### 3.3 必要な知識

- Cloudflare Workers Cron Triggers の設定方法（`wrangler.toml` の `[triggers]` セクション）
- Hono の route mount / dismount パターン
- HTTP 410 Gone の意味と使いどころ（リソースが意図的に削除されたことを示す）
- `bash scripts/cf.sh deploy` の実行方法と staging 確認手順

### 3.4 推奨アプローチ

1. まず `apps/api/wrangler.toml` の cron schedule を削除してデプロイ。これにより cron trigger が発火しなくなる。
2. 次に `/admin/sync` を 410 Gone に変更してデプロイ。残存 cron trigger や手動呼び出しに対して明示的なエラーを返す。
3. unknown cron fallback を確認・追加し、想定外 cron が 5xx を返さないようにする。
4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で staging 確認後、AC を検証する。

---

## 4. 実行手順

### Phase 1: 現状確認

1. `apps/api/wrangler.toml` を開き、`[triggers]` セクションの `crons` 設定を確認する。
2. `apps/api/src/routes/admin/sync.ts` を開き、現在の route 定義を確認する。
3. cron handler ファイル（`apps/api/src/jobs/sync-sheets-to-d1.ts` 等）を確認し、unknown cron fallback の有無を把握する。

### Phase 2: wrangler.toml の cron 削除

1. `apps/api/wrangler.toml` の `[triggers]` セクションから Sheets 経路の cron schedule 行を削除する。
2. 削除後、`[triggers]` セクション自体が空になる場合はセクションごと削除する。

### Phase 3: /admin/sync の mount 解除

1. `apps/api/src/routes/admin/sync.ts` の route mount を解除するか、すべてのパスに 410 Gone を返すハンドラに置き換える。
2. 410 Gone を選択する場合は以下のレスポンスを返す:
   ```json
   { "error": "This endpoint has been deprecated. Use /admin/sync/schema and /admin/sync/responses instead." }
   ```

### Phase 4: unknown cron fallback 確認

1. cron ハンドラのエントリーポイントを確認し、定義外の cron schedule が来た場合のフォールバック処理が実装されているか確認する。
2. フォールバックがない場合は、ログ出力のみで正常終了する fallback を追加する（5xx を返さない）。

### Phase 5: staging デプロイと検証

1. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` を実行して staging に反映する。
2. `curl -X POST https://<staging-host>/admin/sync` を実行し、404 または 410 が返ることを確認する。
3. Cloudflare ダッシュボードの「Cron Triggers」タブで Sheets 経路の cron が消えていることを確認する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/wrangler.toml` から Sheets cron schedule が削除されている
- [ ] `/admin/sync` が 404 または 410 を返す（または mount 解除されている）
- [ ] unknown cron fallback が定義されており、想定外 cron で 5xx が発生しない
- [ ] staging デプロイ後に上記 3 点が確認されている

### 品質要件

- [ ] B-01 / B-02 / B-07 の前提条件として本タスクの AC が参照可能な形で明文化されている
- [ ] `/admin/sync` の停止が Forms 分割方針（`/admin/sync/schema` / `/admin/sync/responses`）と矛盾しない
- [ ] 410 Gone を選択した場合、エラーメッセージに移行先エンドポイントが明記されている

### ドキュメント要件

- [ ] B-01 / B-02 / B-07 の実施順序に本タスクが先行条件として記録されている
- [ ] `unassigned-task-detection.md` または Phase 12 成果物に本タスクが記録されている

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| wrangler.toml scan | `[triggers]` セクションの crons 設定 | Sheets 経路の cron schedule が存在しない |
| endpoint smoke | `POST /admin/sync` へのリクエスト | 404 または 410 が返る |
| cron trigger 一覧 | Cloudflare ダッシュボード / CF API | Sheets 経路の cron trigger が存在しない |
| unknown cron | 未定義 cron schedule の発火 | 5xx ではなく正常終了（ログ出力のみ）する |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| impl 削除を runtime kill-switch より先行させると、本番 cron が削除済み endpoint を叩いて 5xx 連発するリスク | 高 | 高 | 本タスクを B-01 / B-02 / B-07 の前提条件として AC 化し、順序制御を保証する |
| `/admin/sync` を 404 に変更した場合、Cloudflare がリトライして短期的にアクセスが集中する | 低 | 低 | 410 Gone を選択することでリトライを抑止する |
| unknown cron fallback 未実装のまま wrangler.toml を更新すると、既存 cron が変化して未定義 cron が発火する | 中 | 低 | Phase 4 で必ず fallback の存在を確認してからデプロイする |
| staging 確認なしに production へデプロイするミス | 高 | 低 | `--env production` を staging URL で先行確認してから本番適用する |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 方針決定（本タスクの前提） |
| 必須 | `apps/api/wrangler.toml` | cron schedule 設定の正本 |
| 必須 | `apps/api/src/routes/admin/sync.ts` | 停止対象 route の実装 |
| 参照 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | Forms 分割方針（移行先 endpoint の確認） |
| 参照 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron runbook 正本 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | impl 削除を runtime kill-switch より先行させると、本番 cron が削除済み endpoint を叩いて 5xx 連発するリスクが発生する |
| 原因 | B-01（impl 撤回）/ B-02（migration 撤回）/ B-07（secret 削除）の実施順序に、runtime 停止ステップが明示されていなかった |
| 対応 | runtime kill-switch タスク（本タスク）を B-01 / B-02 / B-07 の前提条件として独立タスク化し、停止条件を AC 化することで実行中の Sheets 経路を安全に止める順序制御を保証する |
| 再発防止 | 実装削除タスクを作成する際は、runtime 上で稼働中のエンドポイント・cron が存在するかを先に確認し、kill-switch タスクを依存タスクとして明示する |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 direction reconciliation レビューで、B-01 削除前の runtime 停止が必要なことを確認。task-ut09-runtime-kill-switch-001 として formalize。

### 補足事項

- 本タスクは runtime 設定変更が目的であり、impl ファイル削除（B-01）は含まない。
- `bash scripts/cf.sh` 経由のデプロイのみ許可。`wrangler` 直叩きは禁止。
- staging 確認後に production へ適用する。staging と production の確認を混同しないこと。
- 本タスク完了後に B-01 / B-02 / B-07 を安全に実施できる。
