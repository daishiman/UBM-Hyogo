# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | specification-design（QA） |

## 目的

Phase 8 までで確定した命名・パス・型・エンドポイントの整合を前提に、無料枠余裕度（Cloudflare Workers / D1 / Google Sheets API）・secret hygiene・line budget・link 整合・mirror parity の 5 観点で品質保証チェックを行い、Phase 10 の GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（バックエンドジョブのため）と明記する。

## 実行タスク

1. 無料枠見積もりを別ファイル `outputs/phase-09/free-tier-estimation.md` に詳細化する（完了条件: Workers / D1 / Sheets 3 サービス × dev/main 2 環境すべての試算が記述されている）。
2. secret hygiene チェックリストを作成し、`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN` の 3 Secret について注入経路と rotation 手順を確認する（完了条件: 4 項目チェックすべてが記述されている）。
3. line budget を確認する（完了条件: 各 phase-XX.md が 100-250 行、index.md が 250 行以内）。
4. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md 間のリンク切れが 0）。
5. mirror parity を確認する（完了条件: 本タスクは N/A 判定であることが明記されている）。
6. a11y 対象外を明記する（完了条件: 「バックエンドジョブのため a11y 対象外」と記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化済みの命名・path |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | Secrets / 関連サービス無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret hygiene 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cron / wrangler / 無料枠 |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠公式 |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 無料枠公式 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota 公式 |

## 無料枠見積もり（サマリー）

詳細は `outputs/phase-09/free-tier-estimation.md` を参照。本仕様書には主要数値のみ記載する。

### Cloudflare Workers（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Cron 間隔 | 6h | `0 */6 * * *` |
| 1 日の scheduled 起動 | 4 req/day | 24 / 6 |
| 月間 | 約 120 req/month | |
| 無料枠 | 100,000 req/day | |
| 余裕度 | 0.004% | 極めて余裕 |

### Cloudflare D1（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 同期あたり upsert | 推定 100 records | batch=100 で 1 batch |
| 1 同期あたり log 書き込み | 1 record（sync_job_logs） + lock acquire/release で 2 record | |
| 1 日の writes | 4 sync × （100 upsert + 3 log/lock） ≒ 412 writes | upsert=conflict 多発時は変動 |
| 月間 writes | 約 12,360 writes | |
| 無料枠 | 50,000 writes/month | |
| 余裕度 | 24.7% | 余裕（実 records が増えても十分） |

### Google Sheets API（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 同期あたり request | 最大 5 range（5,000 行想定） | A1 range 分割 |
| 1 日の request | 4 sync × 5 page = 20 req | |
| 月間 request | 約 600 req | |
| 無料枠 | 300 req/min/project | per-minute 制約 |
| 余裕度 | 1 sync が 5 req（数秒で完結）→ 1 分換算でも 5 req/min で 1.7% | 十分 |

### dev 環境（Cron 1h）

| 項目 | 値 |
| --- | --- |
| Workers req/day | 24 |
| D1 writes 月間 | 24 × 30 × 約 103 ≒ 74,160 writes/month → ⚠️ 無料枠超過リスク |
| 対策 | dev は records 数を絞る（テスト fixture 100 → 10 records）or Cron を 6h に揃える or batch 集約で writes を最小化（lock/log 込みで 1 sync = 3 writes） |

> **重要**: dev 1h × 100 records/sync は 月 50K writes を超えるため、Phase 5 実装時に「dev は records を絞る」「lock/log を効率化（1 sync で writes 最大 5 まで）」のいずれかを採用する。本仕様書では後者を採用前提とし、free-tier-estimation.md で再計算する。

## secret hygiene チェックリスト

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | SA JSON が Secret 経由で注入される | `apps/api/src/index.ts` で `env.GOOGLE_SHEETS_SA_JSON` 参照のみ | コード / .env / git に平文存在 0 |
| 2 | `wrangler secret list` で 3 Secret 登録済み | `wrangler secret list --env production` | `GOOGLE_SHEETS_SA_JSON` `SHEETS_SPREADSHEET_ID` `SYNC_ADMIN_TOKEN` が並ぶ（※ `SHEETS_SPREADSHEET_ID` は Variable でも可。Phase 2 設計で Variable を採用する場合は 2 Secret + 1 Variable） |
| 3 | 1Password Environments に 3 Secret 登録済み | UBM-Hyogo / dev / main vault を目視確認 | 3 件すべて存在 |
| 4 | `SYNC_ADMIN_TOKEN` rotation 手順が runbook に記載 | Phase 5 implementation-runbook.md / Phase 12 implementation-guide.md | rotation 手順（generate → put → 1Password 更新 → 旧 token 失効）が 4 ステップで記述 |

### rotation 手順（runbook 抜粋）

```
1. 新トークン生成: openssl rand -hex 32
2. Cloudflare に登録: wrangler secret put SYNC_ADMIN_TOKEN --env production
3. 1Password 更新: UBM-Hyogo / main vault の SYNC_ADMIN_TOKEN を新値に更新
4. 旧トークン失効確認: 旧 token で /admin/sync を叩き 401 が返ること
```

## a11y 対象外の明記

- 本タスクは Cloudflare Workers の scheduled handler および admin API（JSON 入出力）のみで構成され、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は UI を含むタスク（admin dashboard 系の別 UT）で行う。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 193 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-250 行 | 100-250 行 | 全 PASS（Phase 12 は複数成果物の関係で上限近くを許容） |
| outputs/phase-XX/*.md | 個別判定（main.md は 200-400 行を目安） | 個別 | 個別チェック |

> 仕様書（phase-XX.md）が 100 行未満の場合は内容不足、250 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/*.md` | 実在確認 |
| 原典 unassigned-task 参照 | `docs/30-workflows/unassigned-task/UT-09-sheets-d1-sync-job-implementation.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/11` | 200 OK |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。
- 仮に Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務が発生する。その場合は同 wave のタスクの sync 規約に従う。

## 実行手順

### ステップ 1: free-tier-estimation.md 作成
- 3 サービス × 2 環境のすべてを表化。
- dev 環境で writes が無料枠超過しないか再計算。

### ステップ 2: secret hygiene 4 項目を outputs/phase-09/main.md に記述
- rotation 手順を 4 ステップで記述。

### ステップ 3: line budget 計測
- 各 phase-XX.md の `wc -l` を取り、100-250 行範囲内を確認。

### ステップ 4: link 検証
- artifacts.json / index.md / phase-XX.md の path 整合。
- リンク切れ 0 を確認。

### ステップ 5: mirror parity 判定
- 本タスクは N/A と明記。

### ステップ 6: a11y 対象外の明記
- 「バックエンドジョブのため a11y 対象外」を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠余裕度・secret hygiene 結果を GO/NO-GO の根拠に使用 |
| Phase 11 | 手動 smoke test 時の secret 確認手順として再利用 |
| Phase 12 | implementation-guide.md の運用パートに rotation 手順を転記 |
| UT-08 | monitoring 設計に sync_job_logs ボリューム見積もりを引き渡し |

## 多角的チェック観点

- 価値性: 無料枠を超えない範囲で admin-managed data の鮮度を担保できるか。
- 実現性: dev 環境で writes 超過リスクが確認され、対策が立てられているか。
- 整合性: 不変条件 #1/#4/#5 と Phase 8 DRY 化結果の維持。
- 運用性: rotation 手順が runbook に存在し、誰でも実行できるか。
- 認可境界: 3 Secret すべて Cloudflare Secrets / 1Password で管理されているか。
- 無料枠: Workers / D1 / Sheets で年間試算しても余裕があるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | free-tier-estimation.md 作成 | 9 | spec_created | 別ファイル |
| 2 | secret hygiene 4 項目チェック | 9 | spec_created | 3 Secret |
| 3 | rotation 手順記述 | 9 | spec_created | 4 ステップ |
| 4 | line budget 計測 | 9 | spec_created | 100-250 行 |
| 5 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 6 | mirror parity 判定 | 9 | spec_created | N/A |
| 7 | a11y 対象外明記 | 9 | spec_created | バックエンドジョブ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 観点） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | 3 サービス × 2 環境の詳細試算 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] free-tier-estimation.md に 3 サービス × 2 環境の試算が記載
- [ ] secret hygiene 4 項目すべてが PASS
- [ ] rotation 手順が 4 ステップで記述
- [ ] line budget が全 phase で 100-250 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity が N/A と明記
- [ ] a11y 対象外と明記
- [ ] dev 環境の writes 超過リスクに対する対策が確定

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 無料枠余裕度が定量化されている
- secret hygiene 4 項目すべてチェック済み
- a11y 対象外が明記されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 無料枠余裕度（Workers 0.004% / D1 24.7% / Sheets 1.7%）
  - dev 環境 writes 対策の確定方針
  - secret hygiene PASS 結果
  - line budget / link 整合 / mirror parity（N/A）
  - a11y 対象外の判断
- ブロック条件:
  - dev 環境の D1 writes 試算が無料枠を超え対策が無い
  - secret hygiene 4 項目に NG が残る
  - link 切れが残る
