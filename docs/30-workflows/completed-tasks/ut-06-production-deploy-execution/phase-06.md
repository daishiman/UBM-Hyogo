# Phase 6: 異常系・ロールバック検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・ロールバック検証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (本番デプロイ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | pending |

## 目的

Phase 5 実行中に発生し得る異常系シナリオ（OpenNext Workers / API Workers / D1 各層のデプロイ失敗、本番 URL 異常、binding 解決失敗、Secrets 未配置、DNS 伝播遅延）を網羅的に整理し、各シナリオの検出方法・原因切り分け・ロールバック手順・所要時間目安を確定する。
AC-8（ロールバック手順事前確認）の証跡として、ロールバック実行 dry-run 推奨手順を含む rehearsal 結果を記録する。
Phase 5 で実際に異常が発生した場合は本 Phase の手順に従って復旧する。

## 実行タスク

- 異常系シナリオを 8 件以上リストアップする
- 各シナリオの検出方法・原因切り分け・ロールバック手順・所要時間目安を整理する
- ロールバック手順の dry-run 推奨手順を確定する
- Phase 5 実行中に発生した異常があれば実記録としてマトリクスに反映する
- AC-8 の証跡として rollback-runbook 参照状況を確認する
- 未解決事項があれば Phase 7 / Phase 8 / Phase 9 への申し送り事項として記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-05.md | 本番デプロイ実行記録・失敗時即時アクション |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-04.md | verify suite 結果・前 deployment ID |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | rollback-runbook 設計・Mermaid フロー |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | AC・既存資産インベントリ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler ロールバックコマンド仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 方針 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/rollback-runbook.md | ロールバック runbook 本文 |

## 実行手順

### ステップ 1: 異常系シナリオのリストアップ

- 下記マトリクスの 8 シナリオ（A-1 〜 A-8）を起点に、Phase 5 で実際に観測された事象があれば追加する
- 各シナリオに対応する rollback-runbook 章番号を紐づける

### ステップ 2: 検出方法・原因切り分けの確定

- 各シナリオの一次検出（curl / wrangler tail / dashboard）と二次切り分け（ログ / binding / DNS）を確定する
- Phase 5 ステップ 5 の smoke test との対応関係を整理する

### ステップ 3: ロールバック手順の dry-run

- 実際にロールバックを発動せずに、各コマンドの構文・対象 ID 解決可否を verify する
- `wrangler deploy --config apps/web/wrangler.toml --env production list` / `wrangler deployments list --env production` で対象 ID が取得できることを再確認する
- D1 リストアは Phase 5 で取得した backup SQL の先頭部分を `head` で確認する dry-run のみ実施する

### ステップ 4: rehearsal 結果の記録

- `outputs/phase-06/rollback-rehearsal-result.md` に各シナリオの dry-run 結果を記録する
- 実発動が必要だったシナリオは「実発動」として区別し、実行時刻と結果を記録する

### ステップ 5: AC 整合と申し送り

- AC-8（ロールバック手順事前確認）の証跡として `outputs/phase-02/rollback-runbook.md` への参照を確認する
- 未解決事項があれば Phase 9（品質保証）/ Phase 10（GO-NOGO）/ UT-08（モニタリング）への申し送りとして記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | Phase 5 実行ログを本 Phase の input とする |
| Phase 7 | 異常系マトリクスを AC-8 の完了トレース根拠として使用 |
| Phase 8 | 未解決の運用事項を runbook 整備の input とする |
| Phase 11 | 本番 smoke test の異常時対応として再参照 |
| UT-08 | モニタリング設計の input として異常系マトリクスを引き継ぐ |

## 多角的チェック観点（AIが判断）

- 価値性: 異常系マトリクスが「失敗発生時に 5 分以内に判断・実行可能」な粒度か
- 実現性: 各ロールバックコマンドが wrangler@3.x で実在し、対象 ID が取得可能か
- 整合性: シナリオが OpenNext Workers / API Workers / D1 / DNS / Secrets / binding を網羅しているか
- 運用性: 初回デプロイ時の制約（Workers ロールバック不可・Pages 前 deployment 不在）が記載されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 異常系シナリオ A-1 〜 A-8 リストアップ | 6 | pending | 8 件以上 |
| 2 | 検出方法・切り分け手順確定 | 6 | pending | curl / wrangler tail / dashboard |
| 3 | ロールバック手順 dry-run | 6 | pending | 実発動なし |
| 4 | rehearsal 結果記録 | 6 | pending | outputs/phase-06/rollback-rehearsal-result.md |
| 5 | abnormal-case-matrix 記録 | 6 | pending | outputs/phase-06/abnormal-case-matrix.md |
| 6 | AC-8 証跡確認 | 6 | pending | rollback-runbook 参照 |
| 7 | 申し送り事項整理 | 6 | pending | UT-08 / Phase 9 / Phase 10 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/abnormal-case-matrix.md | 異常系シナリオ A-1 〜 A-8 のマトリクス（検出・切り分け・ロールバック・所要時間） |
| ドキュメント | outputs/phase-06/rollback-rehearsal-result.md | ロールバック dry-run 結果（および実発動があった場合の実記録） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 異常系シナリオが 8 件以上記録されている
- 各シナリオに検出方法・原因切り分け・ロールバック手順・所要時間目安が記載されている
- ロールバック dry-run が完了している（または実発動が記録されている）
- AC-8 の証跡として rollback-runbook 参照が確認されている
- 申し送り事項が整理されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 初回デプロイ時の制約（Workers ロールバック不可など）が明記されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: abnormal-case-matrix・rollback-rehearsal-result・申し送り事項を Phase 7 に渡す
- ブロック条件: 異常系シナリオが 8 件未満、または AC-8 の証跡が確認できない場合は次 Phase に進まない

## 異常系シナリオマトリクス（A-1 〜 A-8）

> 詳細は `outputs/phase-06/abnormal-case-matrix.md` に記録。本表は構造と必須シナリオを示す。

### A-1: OpenNext Workers デプロイ失敗（ビルドエラー）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `wrangler deploy --config apps/web/wrangler.toml --env production` がビルド失敗・upload 失敗で exit non-zero |
| 検出方法 | `wrangler deploy --config apps/web/wrangler.toml --env production` の exit code・stderr ログ・`wrangler deploy --config apps/web/wrangler.toml --env production list` で deployment status が `failure` |
| 一次切り分け | ローカルビルド再現（`mise exec -- pnpm --filter @ubm-hyogo/web build`）・adapter 出力先確認 |
| ロールバック手順 | `wrangler deploy --config apps/web/wrangler.toml --env production list --project-name <name>` で前 deployment ID を特定 → ダッシュボードまたは `wrangler deploy --config apps/web/wrangler.toml --env production rollback <id> --project-name <name>` |
| 所要時間目安 | 1-2 分 |
| 初回制約 | 前 deployment 不在の場合はロールバック不可。Pages を一旦無効化（プロジェクト削除またはトラフィック停止）で対応 |

### A-2: Workers デプロイ失敗

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `wrangler deploy --env production` が compile/upload エラーで失敗 |
| 検出方法 | `wrangler deploy` の exit code・`wrangler deployments list --env production` で前 version が active のまま |
| 一次切り分け | `wrangler.toml` の `[env.production]` 構文確認・binding 解決確認・型エラー確認 |
| ロールバック手順 | `wrangler deployments list --env production` で前 version_id を特定 → `wrangler rollback <version_id> --env production` |
| 所要時間目安 | 1-2 分 |
| 初回制約 | 前 version 不在の場合はロールバック不可。Workers を一旦未公開化（route 解除）で対応 |

### A-3: D1 マイグレーション中エラー

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `wrangler d1 migrations apply --env production` の途中で SQL エラー |
| 検出方法 | コマンド exit code・`wrangler d1 migrations list --env production` で部分適用状態を確認 |
| 一次切り分け | エラー SQL の特定・`SELECT name FROM sqlite_master WHERE type='table';` で適用範囲確認 |
| ロールバック手順 | Phase 5 ステップ 1 で取得した `backup-<timestamp>.sql` を用い `wrangler d1 execute <DB_NAME> --env production --file backup-<timestamp>.sql` で手動リストア |
| 所要時間目安 | スキーマサイズ依存（数分〜数十分） |
| 初回制約 | 初回適用は空 export からの復旧になるため、リストアは「テーブル DROP」相当の SQL を別途用意する必要がある |

### A-4: 本番 URL 404

| 項目 | 内容 |
| --- | --- |
| 発生条件 | デプロイは成功したが Pages URL が 404 / Workers route が 404 |
| 検出方法 | smoke test ステップ 5「Pages 200 OK」FAIL・`curl -sI https://<web-url>` |
| 一次切り分け | Pages project の routes 設定・カスタムドメイン設定・`wrangler deploy --config apps/web/wrangler.toml --env production list` の status 再確認 |
| ロールバック手順 | A-1 と同等。前 deployment への切戻し |
| 所要時間目安 | 1-2 分 |
| 初回制約 | カスタムドメイン未設定なら `*.pages.dev` で再確認 |

### A-5: /health が 5xx

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Workers がデプロイ成功するも `/health` が 500 / 503 を返す |
| 検出方法 | smoke test ステップ 5「/health healthy」FAIL・`wrangler tail --env production` でランタイムエラーログ確認 |
| 一次切り分け | binding 解決エラー・Secrets 未配置・初期化処理エラーを切り分け（A-7 / A-8 と相互参照） |
| ロールバック手順 | A-2 と同等。前 version_id への rollback |
| 所要時間目安 | 1-2 分 |
| 初回制約 | 前 version 不在の場合は Workers を未公開化 |

### A-6: D1 バインディング未解決

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Workers が起動するが D1 SELECT で `Cannot read properties of undefined (reading 'prepare')` 等が発生 |
| 検出方法 | smoke test ステップ 5「D1 SELECT 疎通」FAIL・`wrangler tail --env production` でエラーログ確認 |
| 一次切り分け | `wrangler.toml` の `[env.production]` の `[[d1_databases]]` セクションの `binding` 名・`database_id` の正当性確認 |
| ロールバック手順 | wrangler.toml 修正後に Workers 再デプロイ（A-2 のロールバックを併用するかは判断） |
| 所要時間目安 | 5-10 分 |
| 初回制約 | binding 名の typo は本番でしか露見しない場合があるため、Phase 4 verify suite チェック 10 で予防 |

### A-7: Secrets 未配置で起動失敗

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `GOOGLE_CLIENT_ID` 等が `wrangler secret put --env production` で配置されておらず Workers 起動時に undefined エラー |
| 検出方法 | smoke test ステップ 5「/health」FAIL・`wrangler tail --env production` で `env.<SECRET_NAME>` が undefined |
| 一次切り分け | `wrangler secret list --env production` で配置状況確認・Phase 4 verify suite チェック 9 と照合 |
| ロールバック手順 | A-2 のロールバック（前 version へ rollback）または `wrangler secret put --env production <NAME>` で即時補充の上 Workers 再デプロイ |
| 所要時間目安 | 5 分 |
| 初回制約 | 04-serial 完了が前提。完了していなければ即時補充は不可 |

### A-8: DNS 伝播遅延

| 項目 | 内容 |
| --- | --- |
| 発生条件 | カスタムドメイン使用時に DNS 伝播未完了で smoke test が一時的に FAIL |
| 検出方法 | `*.pages.dev` では PASS だがカスタムドメインで FAIL・`dig +short <domain>` で AAAA/CNAME 確認 |
| 一次切り分け | Cloudflare DNS レコード確認・TTL 値確認・伝播状況を `https://www.whatsmydns.net/` 等で確認 |
| ロールバック手順 | DNS 起因の場合はロールバックではなく待機。`*.pages.dev` 経由で smoke を仮 PASS とし、伝播完了後に再 smoke |
| 所要時間目安 | 5 分 〜 数時間（TTL 依存） |
| 初回制約 | 本タスクスコープではデフォルト `*.pages.dev` を優先し、カスタムドメインは別タスク |

## ロールバック実行確認（dry-run 推奨手順）

### Pages dry-run

```bash
# 前 deployment ID を取得
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production list \
  --project-name <project-name> | head -n 5

# 実発動はしない。コマンド構文と対象 ID の解決可否のみ確認
echo "rollback target: <deployment_id>"
```

### Workers dry-run

```bash
# 前 version_id を取得
bash scripts/cf.sh deployments list --env production | head -n 5

# 実発動はしない。コマンド構文と対象 ID の解決可否のみ確認
echo "rollback target version_id: <version_id>"
```

### D1 dry-run

```bash
# Phase 5 で取得したバックアップの先頭部分を確認
head -n 50 outputs/phase-05/backup-<timestamp>.sql

# 実リストアはしない。SQL 構文の妥当性のみ確認
```

### dry-run 記録テンプレ

| シナリオ | dry-run 実施日時 | 対象 ID 取得可否 | 構文確認 | 推定所要時間 | 備考 |
| --- | --- | --- | --- | --- | --- |
| A-1 Pages | YYYY-MM-DD HH:MM | OK / NG | OK / NG | 1-2 分 | |
| A-2 Workers | | | | 1-2 分 | |
| A-3 D1 | | | | 数分〜数十分 | |
| A-4 本番 URL 404 | | | | 1-2 分 | |
| A-5 /health 5xx | | | | 1-2 分 | |
| A-6 D1 binding 未解決 | | | | 5-10 分 | |
| A-7 Secrets 未配置 | | | | 5 分 | |
| A-8 DNS 伝播 | | | | 5 分〜数時間 | |

## AC-8 証跡確認

| 項目 | 確認方法 | 状態 |
| --- | --- | --- |
| `outputs/phase-02/rollback-runbook.md` の存在 | ファイル存在確認 | TBD |
| OpenNext Workers / API Workers / D1 の 3 系統が runbook に記載されている | runbook 章構成確認 | TBD |
| 各 runbook 手順が abnormal-case-matrix の各シナリオから参照されている | 相互リンク確認 | TBD |
| dry-run 結果が `rollback-rehearsal-result.md` に記録されている | ファイル存在確認 | TBD |

## 申し送り事項

| 区分 | 内容 | 申し送り先 |
| --- | --- | --- |
| 未解決事項 | （Phase 5 / 6 で解消できなかった事象） | Phase 9 / Phase 10 |
| モニタリング設計への input | 異常系マトリクスの検出指標 | UT-08 |
| runbook 反映事項 | dry-run で発見した手順改善点 | Phase 8（runbook 整備） |
| 初回制約の継続管理 | Workers / Pages 初回時のロールバック不可制約 | Phase 8 / UT-08 |
