# Google Form 反映 diagnostics FU-001 — H1 ingest 未稼働解消 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | google-form-reflection-diagnostics-fu-001-h1-ingest-recovery                        |
| タスク名     | H1 修復 — ingest 未稼働解消 (Spec-B-1)                                              |
| 分類         | 修復実装 (secrets 投入 + cron 設定中心)                                             |
| 対象機能     | Google Forms → D1 ingest パイプライン (`sync-forms-responses` job / cron / secrets) |
| 優先度       | 高 (パイプライン根本断絶のため)                                                     |
| 見積もり規模 | 中                                                                                  |
| ステータス   | 未実施                                                                              |
| 発見元       | google-form-reflection-diagnostics Phase 12 unassigned-task-detection (Spec-B-1)    |
| 発見日       | 2026-05-26                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`google-form-reflection-diagnostics` ワークフローでは、Google Form 回答が会員サイトに反映されない事象の原因切り分けのために `/admin/diagnostics/forms-pipeline` を整備し、ingest 稼働状況・secrets 健全性・最新 sync run の結果を `forms-pipeline-snapshot.json` として可視化する設計とした。Phase 01 (`phase-01-requirements.md`) では H1 仮説として「ingest job が一度も走っていない、または直近全 run が error 状態」を最優先の検証対象に位置付けている。

Spec-A (diagnostics endpoint 実装) は親ワークフロー側で進行するが、staging 投入後に H1 が立った場合の修復手順 (secrets 投入 + cron 設定 + sync-lock 整流) は単一責務原則 (CONST_005) に従い別タスクへ切り出す方針が Phase 12 で確定している。本タスクはその「H1 起点での修復実装」を担う。

### 1.2 問題点・課題

- `forms-pipeline-snapshot.json` の `hypothesisFlags.H1_ingestNeverRanOrAllErrors === true` が観測された場合、Forms ingest がそもそも稼働していないため、後続の H2/H3/H4 修復をどれだけ進めても表面化する症状 (Form 回答未反映) は解消しない。
- secrets 未投入 (`secretsReadiness.{googleServiceAccountEmail,googlePrivateKey,googleFormId}` の少なくとも 1 つが false) のままだと cron が起動しても Forms API 401 で連続失敗し、`sync_jobs` テーブルに error run が積み上がる。
- cron trigger が wrangler 上で未設定または不整合の場合、job 自体が起動せず `latestSyncRuns` が空となり、原因切り分けが「secrets 未投入」か「cron 未稼働」か判別困難になる。

### 1.3 放置した場合の影響

- Form 回答 → 公開ディレクトリ反映の根本パスが断絶した状態が継続し、新規入会者・既存会員の編集差分が会員サイトに 1 件も反映されない。
- diagnostics endpoint が「H1 を検出できる状態」になっても修復経路が用意されていないため、観測のみで対処不能な状態が固定化する。
- secrets readiness の falseを放置すると、Phase 11/12 で議論された H2/H3/H4 の修復 PR を投入しても改善せず、無駄な PR レビューコストが発生する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`forms-pipeline-snapshot.json` の H1 フラグを false に落とし、`latestSyncRuns` に success 状態の run が 1 件以上記録された状態を実現する。

### 2.2 最終ゴール

- `secretsReadiness.googleServiceAccountEmail / googlePrivateKey / googleFormId` がすべて true
- `hypothesisFlags.H1_ingestNeverRanOrAllErrors === false`
- `/admin/diagnostics/forms-pipeline` の `latestSyncRuns` が直近 1 件以上 success を返す
- `sheets-auth-classifier.ts` の reason code が `ok` または非 auth 系のみ

### 2.3 スコープ

#### 含むもの

- Cloudflare Secrets への `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` 投入 (`scripts/cf.sh secret put` 経由)
- `apps/api/wrangler.toml` の cron trigger 設定確認・調整 (既設定との drift があれば修正)
- `apps/api/src/jobs/sync-forms-responses.ts` の起動経路再確認 (cron handler binding が漏れていないか)
- `sheets-auth-classifier.ts` の reason code を用いた 401 切り分け証跡取得
- D1 `sync_jobs` テーブルに残存する running 状態の row が sync-lock 解放漏れで滞留している場合の手動 reset

#### 含まないもの

- H2/H3/H4 の修復実装 (Spec-B-2 / Spec-B-3 / Spec-B-4 で個別管理)
- diagnostics endpoint 本体の改修 (親ワークフロー Spec-A)
- D1 schema 変更 (CONST: schema 不変)
- Google Form 仕様変更 (formId / questionCount などの不変条件)

### 2.4 成果物

- secrets 投入後の `bash scripts/cf.sh secret list --env production` 出力 (キー名のみ、値は記載禁止)
- cron trigger 設定 diff (wrangler.toml)
- `/admin/diagnostics/forms-pipeline` 再叩きスナップショット (H1 フラグ false / `latestSyncRuns` success 確認)
- `cf.sh tail` で取得した cron 起動ログ抜粋

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス                                                | 役割                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `apps/api/src/jobs/sync-forms-responses.ts`         | Forms → D1 ingest 本体。cron handler から呼ばれる             |
| `apps/api/wrangler.toml` (`[triggers] crons`)       | cron schedule 設定。worker 起動の起点                         |
| `apps/api/src/lib/sheets-auth-classifier.ts`        | Forms API レスポンスから auth エラー reason を分類            |
| `scripts/cf.sh secret put`                          | Cloudflare Secrets 投入ラッパー (wrangler 直叩き禁止)         |
| `scripts/cf.sh tail`                                | Worker 実行ログ取得 (cron 起動証跡)                           |
| D1 `sync_jobs` テーブル                             | running/success/error 状態を保持。lock 解放漏れの調査対象     |

### 3.2 検証手順

1. **事前スナップショット取得**
   - `/admin/diagnostics/forms-pipeline` を叩き、`forms-pipeline-snapshot.json` の `hypothesisFlags.H1_ingestNeverRanOrAllErrors` / `secretsReadiness` / `latestSyncRuns` の初期値を保存する。
2. **secrets 投入**
   - 1Password から値を参照しつつ `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --config apps/api/wrangler.toml --env production` などを 3 件実行。
   - 投入後 `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` でキー名のみ確認。値は出力・記録しない。
3. **cron 設定確認**
   - `apps/api/wrangler.toml` の `[triggers] crons` が想定スケジュールで設定されているか確認。drift があれば最小差分で修正。
4. **cron 起動確認**
   - `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` を起動し、次回 cron 発火を待って `sync-forms-responses` の実行ログを取得。
5. **sync-lock 滞留チェック**
   - cron が起動しても 1 件も success にならない場合、D1 `sync_jobs` テーブルの running 状態 row を `cf.sh d1 execute` で確認。lock 解放漏れがあれば該当 row を手動で reset (status を error または cancelled に更新)。
6. **再スナップショット取得**
   - 数 cycle 経過後に再度 `/admin/diagnostics/forms-pipeline` を叩き、`hypothesisFlags.H1_ingestNeverRanOrAllErrors === false` / `secretsReadiness` 全 true / `latestSyncRuns` success を確認。
7. **reason code 確認**
   - 失敗 run が残っている場合、`sheets-auth-classifier.ts` の reason code (`invalid_grant` / `invalid_form_id` / `unauthorized` 等) を `latestSyncRuns` 上で確認し、auth 起因か他要因かを切り分け。

---

## 4. 受け入れ基準

### 機能要件

- [ ] `forms-pipeline-snapshot.json` の `hypothesisFlags.H1_ingestNeverRanOrAllErrors === false`
- [ ] `secretsReadiness.googleServiceAccountEmail / googlePrivateKey / googleFormId` が全 true
- [ ] `/admin/diagnostics/forms-pipeline` の `latestSyncRuns` に success 状態の run が 1 件以上
- [ ] D1 `sync_jobs` テーブルに stale な running row が残存していない

### 品質要件

- [ ] `scripts/cf.sh` 経由のみで secrets 投入が完了している (wrangler 直叩き 0 件)
- [ ] secrets の実値が docs / code / コミット / ログのいずれにも記録されていない
- [ ] sheets-auth-classifier の reason code を用いた切り分け証跡が残っている

### ドキュメント要件

- [ ] 事前 / 事後の snapshot 差分が証跡として保存されている
- [ ] cron 起動ログ抜粋が `cf.sh tail` から取得されている
- [ ] 苦戦箇所が発生した場合は本ファイル §6 に追記済み

---

## 5. CONST 制約 (CLAUDE.md 不変条件への準拠)

- **CONST #5**: D1 への直接アクセスは `apps/api` に閉じる。`apps/web` からは触れない。
- **CONST #11**: 認証境界は fail-closed。secrets readiness false 時に fallback で許可しない。
- **D1 schema 不変**: `sync_jobs` の status reset は row 更新のみ。schema 変更禁止。
- **平文 secrets 禁止**: 値は 1Password に保管し、docs / code / コミットメッセージに転記しない。
- **wrangler 直叩き禁止**: 全 Cloudflare 操作は `scripts/cf.sh` 経由 (op 注入 + esbuild 解決 + mise exec)。

---

## 6. 苦戦箇所・予測される困難 【必須】

> Spec-B-1 を実機実行する際に高確率で詰まる箇所を事前に列挙する。実施時に追記すること。

| 項目     | 内容                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | secrets 投入後も cron が起動した形跡が `latestSyncRuns` に現れない                                                                                                |
| 原因     | cron worker 起動証跡は Cloudflare dashboard / `cf.sh tail` でしか観測できず、`/admin/diagnostics/forms-pipeline` だけでは「未起動」と「起動後即失敗」を判別できない |
| 対応     | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` を投入直後から張り、次 cron cycle まで継続して実行ログを観測する                       |
| 再発防止 | 修復完了後の SOP として「H1 検出 → secrets 投入 → tail で 1 cycle 観測 → snapshot 再取得」をランブック化する                                                       |

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | secrets 投入後も Forms API 401 が継続する                                                                                                                             |
| 原因     | service account への Forms 共有漏れ / private key の改行コード破損 / form_id typo など複数要因が同じ 401 として観測される                                              |
| 対応     | `sheets-auth-classifier.ts` の reason code (`invalid_grant` / `unauthorized` / `invalid_form_id` 等) を `latestSyncRuns.errorReason` 経由で確認し、原因を狭めて再投入 |
| 再発防止 | 投入直後に 1 cycle 分の reason code を必ず確認し、reason 分布を snapshot 証跡に残す                                                                                   |

| 項目     | 内容                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | cron が走っても `latestSyncRuns` に新 run が積まれない / `sync_jobs` に running 状態 row が滞留している                                              |
| 原因     | 前回 run の異常終了で sync-lock 解放漏れが起き、新 run が起動時 lock acquire 失敗で no-op になっている                                               |
| 対応     | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT id,status,started_at FROM sync_jobs WHERE status='running'"` で滞留 row を特定し、status を `error` / `cancelled` に手動 update して lock を解放する |
| 再発防止 | sync-forms-responses 側に lock TTL / stale lock 自動回収の lessons-learned を起こす (本タスク外、別 followup 候補)                                  |

| 項目     | 内容                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | secrets 投入を急ぐあまり wrangler を直接叩いてしまう                                                                                          |
| 原因     | `scripts/cf.sh` 経由でないと op による 1Password 注入 / ESBUILD_BINARY_PATH 解決 / mise exec が効かず、再現性のない手元状態で投入してしまう   |
| 対応     | 投入は必ず `bash scripts/cf.sh secret put ... --config apps/api/wrangler.toml --env production` で実施。CLAUDE.md「Cloudflare CLI ルール」厳守 |
| 再発防止 | 本タスクの完了条件チェックリストに「wrangler 直叩き 0 件」を含め、レビュー時にコマンド履歴を確認する                                          |

---

## 7. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                                                                |
| --------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| 投入手順ミスで secrets 値が一時的にログに残る                   | 高     | 低       | 投入は `cf.sh secret put` のみ。値は stdin / 1Password 参照のみで渡し、history に残さない |
| cron が起動した瞬間に 401 連発で error run が大量に積まれる     | 中     | 中       | reason code を snapshot で確認し、原因特定までは cron 周期を一時的に長くする選択肢を検討 |
| sync-lock 手動解放で進行中 run を誤って中断する                 | 中     | 低       | 解放前に `started_at` が明らかに stale (例: 1h 超) であることを確認してから更新     |
| H1 修復後に H2/H3/H4 が連鎖的に顕在化し本タスクスコープが膨らむ | 中     | 中       | スコープ外の事象は Spec-B-2/3/4 として個別起票し本タスクで巻き取らない              |

---

## 8. 関連リソース

### 親ワークフロー / 上位仕様

- `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md` (H1 仮説定義)
- `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md` (Spec-B-1 候補定義)

### CLAUDE.md 不変条件

- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる
- 不変条件 #11: 認証境界は fail-closed
- Cloudflare CLI 実行ルール: `scripts/cf.sh` 経由必須 (wrangler 直叩き禁止)

### ツール / スクリプト

- `scripts/cf.sh` (Cloudflare 操作ラッパー: op + esbuild + mise exec を解決)
- `apps/api/src/jobs/sync-forms-responses.ts` (ingest job 本体)
- `apps/api/src/lib/sheets-auth-classifier.ts` (Forms API 401 reason 分類)
- `apps/api/wrangler.toml` (cron trigger 設定)

### 参考: 1 仮説 = 1 Spec-B の単一責務原則

`outputs/phase-12/unassigned-task-detection.md` 末尾の運用方針に従い、本タスクは H1 のみを扱い、H2/H3/H4 が同時起票されても本タスクで巻き取らない。

---

## 9. 備考

- 本タスクは「diagnostics endpoint が H1 を検出した時のみ発動」する条件付き起票である。Spec-A の staging 投入と H1 観測が前提。
- secrets 投入と cron 設定は production 環境への直接影響があるため、必ず実施前に snapshot を取得し、実施後 1 cycle 観測してから受け入れ判定する。
- 実施完了後は本ファイルの §6 苦戦箇所を実体験ベースで更新し、後続 followup や横展開タスクの参考に残す。
