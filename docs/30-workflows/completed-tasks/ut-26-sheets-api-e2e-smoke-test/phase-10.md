# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |
| タスク分類 | specification-design（final review gate） |

## 目的

Phase 1〜9 で蓄積した要件・設計・テスト戦略・実装ランブック・異常系・AC マトリクス・DRY 化・QA の各成果物を横断レビューし、AC-1〜AC-11 すべての達成状態と 4条件最終判定（PASS/MINOR/MAJOR）を確定する。**implementation completed・live smoke pending 段階の本タスクでは「実装済み・live smoke pending」状態を許容**し、Phase 11 の手動 smoke 着手前提（blocker）を明文化する。MINOR 判定は必ず未タスク化（`docs/30-workflows/unassigned-task/` への formalize）方針を取る。GO 判定軸は「実機認証保証 + 403 切り分け runbook 化」という Phase 1 真の論点に対して仕様が一意に決まっているか、で決定する。

## 実行タスク

1. AC-1〜AC-11 の達成状態を spec_created 視点で評価する（完了条件: 11 件すべてに「実装済み・live smoke pending」「実 staging 確認待ち」「仕様未確定」のいずれかが付与されている）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を Phase 1 から再トレースして確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
3. blocker 一覧（着手前提）を作成する（完了条件: UT-03 / UT-25 / 01c-parallel-google-workspace-bootstrap 完了確認 + Secret 登録完了確認 + SA Sheets 共有確認が含まれる）。
4. MINOR 判定が出た場合の未タスク化方針を確定する（完了条件: `docs/30-workflows/unassigned-task/` への formalize ルートが記述）。
5. GO/NO-GO 判定を確定し、Phase 11 へ進めるかを決定する（完了条件: `outputs/phase-10/go-no-go.md` に GO 判定が記述されている）。
6. open question を Phase 11/12 へ送り出す（完了条件: 残課題の受け皿 Phase が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-01.md | 真の論点 / 4条件初期判定 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-03.md | 設計レビュー base case 判定 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-07.md | AC × 検証 × 実装トレース |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-09.md | QA 結果（free-tier / secret hygiene / NON_VISUAL governance） |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md | AC-1〜AC-11 / 不変条件 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | unassigned-task formalize ルート |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-10.md | 最終レビュー参照事例 |

## GO 判定の判定軸（評価基準）

> implementation completed・live smoke pending 段階のため、「Phase 1 の真の論点（実機認証保証 + 403 切り分け runbook 化）に対して仕様が Phase 1〜9 で具体的に確定し、Phase 5 ランブックで実装可能粒度に分解されているか」で判定する。実装そのものは未着手で OK。

| 軸 | 評価内容 | 判定 |
| --- | --- | --- |
| 真の論点との整合 | 「実機認証 + 403 切り分け runbook」が Phase 2 設計 / Phase 6 異常系 / Phase 11 troubleshooting-runbook で具体化されているか | PASS |
| 4条件 | 価値性 / 実現性 / 整合性 / 運用性すべて PASS であるか | PASS |
| AC 充足 | AC-1〜AC-11 すべてに達成状態が付与され、PASS でないものが残らないか（条件付き PASS は OK） | PASS（AC-1/AC-3/AC-7 は条件付き） |
| 認可境界 | smoke route が production に露出せず、`SMOKE_ADMIN_TOKEN` で保護される設計が確定しているか | PASS |
| Secret hygiene | Phase 9 の 5 項目が PASS で、PR / commit / `.env` に SA JSON 平文が残らないか | PASS |
| free-tier | 4 サービスすべてで余裕度確保の試算が成立しているか | PASS |
| NON_VISUAL governance | 視覚証跡なしでも verifier が再検証可能なテキスト証跡が Phase 11 で約束されているか | PASS |
| navigation drift | artifacts.json / index.md / phase-XX.md の path 整合が 0 件のリンク切れで成立 | PASS |

## AC × 達成状態マトリクス（AC-1〜AC-11 サマリー）

> 詳細は Phase 7 の ac-matrix.md を正本とし、ここでは implementation completed・live smoke pending 段階の達成状態サマリーを記す。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | staging Workers から `spreadsheets.values.get` が HTTP 200 で成功 | 仕様確定（実 staging 確認は Phase 11） | Phase 2 smoke-test-design.md / Phase 5 runbook | PASS（条件付き） |
| AC-2 | JWT 生成 → access token → API 呼び出しの end-to-end が Workers Edge Runtime で動作 | 仕様確定（UT-03 sheets-fetcher.ts 再利用） | Phase 8 sheets-fetcher.ts 再利用契約 / Phase 5 runbook | PASS |
| AC-3 | 対象 Sheets（formId 紐付き）から値取得・サマリー記録 | 仕様確定（実取得は Phase 11） | Phase 2 設計 / Phase 11 manual-smoke-log.md | PASS（条件付き） |
| AC-4 | access token cache が機能、2 回目以降 OAuth fetch 省略 | 仕様確定（UT-03 in-memory cache 前提） | Phase 2 cache-and-error-mapping.md | PASS |
| AC-5 | 401 / 403 / 429 の各ケースで期待されるエラー分類とログ | 仕様確定（`SmokeErrorKind` で分類） | Phase 6 failure-cases.md / Phase 8 mapping | PASS |
| AC-6 | ローカル `.dev.vars` + `wrangler dev` で同等疎通確認成功 | 仕様確定（実確認は Phase 11） | Phase 5 runbook / index.md 苦戦箇所 #4 | PASS（条件付き） |
| AC-7 | 疎通結果（成功日時 / 環境 / サマリー / トラブルシュート手順）が verification-report として記録 | 仕様確定（成果物 outputs/phase-11/*） | Phase 11 manual-smoke-log.md / troubleshooting-runbook.md | PASS（条件付き） |
| AC-8 | SA JSON は Cloudflare Secrets / 1Password 経由のみで注入、平文残存 0 | 仕様確定（Phase 9 secret hygiene 5 項目 PASS） | Phase 9 main.md / index.md Secrets 表 | PASS |
| AC-9 | 403 原因切り分け（SA 共有 / JSON 改行 / Sheets API 有効化 / formId vs spreadsheetId）が runbook 化 | 仕様確定（成果物 troubleshooting-runbook.md） | Phase 6 / Phase 11 troubleshooting-runbook.md | PASS |
| AC-10 | UT-09 が本番 Sheets API に安全アクセスできる前提が満たされたとマーク | 仕様確定（Phase 11 完了で UT-09 引き渡し） | Phase 12 documentation-changelog.md / index.md 依存関係 | PASS（条件付き） |
| AC-11 | 4条件最終判定 PASS | 本 Phase で確定 | 下記 4条件最終評価 | PASS |

> 「条件付き PASS」: implementation completed・live smoke pending 段階では実 staging / 実 wrangler dev での疎通が行えないため、Phase 11 の手動 smoke 完了が要件となる。本 Phase では blocker ではなく Phase 11 への送り事項として扱う。

## 4条件最終再評価（Phase 1 から再トレース）

| 条件 | Phase 1 初期 | Phase 3 base case | Phase 9 QA | Phase 10 最終 | 根拠 |
| --- | --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | **PASS** | UT-09 着手前に実機認証起因の障害切り分けコストを排除する真の論点と整合。Phase 9 で free-tier 余裕度確認済み。 |
| 実現性 | PASS | PASS | PASS | **PASS** | UT-03 / UT-25 / 01c が完了済みで、smoke route 1 個（~50 LOC）+ CLI script の追加で完結。Workers Edge Runtime + sheets-fetcher.ts 再利用で実装可能。 |
| 整合性 | PASS | PASS | PASS | **PASS** | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離 = 書き込み無し）/ #5（D1 アクセスは apps/api 内閉鎖、本タスクは D1 触れず）すべて satisfied。Phase 8 DRY 化で命名・path・endpoint を統一済み。 |
| 運用性 | PASS | PASS | PASS | **PASS** | troubleshooting-runbook により 403 切り分けが再現可能、`SMOKE_ADMIN_TOKEN` rotation 手順が 4 ステップで runbook 化、NON_VISUAL governance 5 項目 PASS で証跡再検証性確保。 |

**最終判定: GO（PASS）**

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | UT-03（Sheets API 認証方式設定）完了 | 上流タスク | `apps/api/src/jobs/sheets-fetcher.ts` の `getAccessToken` が export 済み | UT-03 の artifacts.json / outputs |
| B-02 | UT-25（Cloudflare Secrets 本番配置）完了 | 上流タスク | `GOOGLE_SHEETS_SA_JSON` が staging に登録済み | `bash scripts/cf.sh secret list --env staging` |
| B-03 | 01c-parallel-google-workspace-bootstrap 完了 | 上流タスク | Service Account メールに対象 Sheets の閲覧権限が共有設定済み | Sheets 「共有」タブで SA メール確認 |
| B-04 | `SMOKE_ADMIN_TOKEN` の生成・配置完了 | 環境準備 | staging Cloudflare Secrets と 1Password staging vault に登録 | `wrangler secret list` / 1Password 目視 |
| B-05 | `SHEETS_SPREADSHEET_ID` の確定（Variable または Secret） | 環境準備 | Forms「回答」タブから取得した spreadsheetId が staging 環境に配置 | `wrangler.toml` `[env.staging.vars]` または secret list |
| B-06 | apps/api のルーティング基盤に `/admin/*` mount 可否確認 | 内部前提 | 既存 admin ルーター（あれば）への mount or 新設の方針が Phase 5 で確定 | Phase 5 runbook |
| B-07 | production への smoke route 露出禁止の wrangler.toml ガード | 内部前提 | `[env.production]` で route 未 mount または `enabled=false` フラグ | Phase 5 runbook / wrangler.toml 設計 |

> B-01〜B-03 のいずれかが未完了の場合、Phase 11 着手は NO-GO となる。B-04〜B-07 は Phase 11 直前で再確認する手順を runbook 化する。

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4条件すべて PASS）。
- 仮に今後 Phase 11/12 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する（本タスク内で抱え込まない）。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 例: 「複数 isolate 跨ぎでの token cache 挙動」は本タスク out-of-scope（index.md 苦戦箇所 #5）。仮に Phase 11 で必要性が判明した場合は MINOR として未タスク化。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | wrangler dev `--local` での外部 fetch 制約の実機差分 | Phase 11 | 引き渡し（実機で remote モードに切替の判断） |
| 2 | token cache の isolate 跨ぎ挙動の formal 化 | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 3 | UT-10 への error mapping 標準化引き渡しタイミング | Phase 12 documentation-changelog | UT-10 着手時に再評価 |
| 4 | smoke route を Cron 起動の自動疎通 health-check に格上げするか | Phase 12 unassigned-task-detection | unassigned-task 候補（将来検討） |
| 5 | Sheets API の per-minute quota 監視機構の必要性 | UT-08 monitoring 連携 | Phase 12 で UT-08 へ引き継ぎ |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-11 すべて PASS（条件付き PASS は OK）
- [ ] 4条件最終判定が PASS
- [ ] blocker B-01〜B-03（上流タスク）が `completed` で、Phase 11 着手前に再確認可能
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] production への smoke route 露出禁止が wrangler.toml レベルで担保される設計

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある（条件付き PASS は除く）
- blocker B-01〜B-03 のいずれかが未完了
- MINOR を未タスク化せず本タスク内に抱え込む
- production への smoke route 露出可能性が残る

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に、spec_created 視点で 11 件評価。

### ステップ 2: 4条件最終判定（Phase 1 から再トレース）
- Phase 1 / Phase 3 / Phase 9 の判定を継承し、Phase 10 で最終確定。

### ステップ 3: blocker 一覧作成
- 上流タスク 3 件 + 環境準備 2 件 + 内部前提 2 件 = 7 件。

### ステップ 4: MINOR 未タスク化方針の明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 5: GO/NO-GO 確定
- `outputs/phase-10/go-no-go.md` に判定を記述。

### ステップ 6: open question を次 Phase へ送出
- 5 件すべてに受け皿 Phase 指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test 実施。条件付き PASS の AC（AC-1/AC-3/AC-6/AC-7/AC-10）の最終確認 |
| Phase 12 | unassigned-task 候補（open question #2/#4）を formalize、UT-10 / UT-08 引き渡し記述 |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| UT-09 | 本タスク完了で「本番 Sheets API への安全アクセス前提」が確立される旨を引き渡し |
| UT-10 | `SmokeErrorKind` を error mapping 標準化の入力として渡す |

## 多角的チェック観点

- 価値性: UT-09 着手前の認証起因障害切り分けコスト削減が Phase 1 真の論点と一致。
- 実現性: Phase 9 free-tier 試算で 4 サービスとも余裕、Phase 5 runbook で実装可能粒度。
- 整合性: 不変条件 #1/#4/#5 すべて satisfied、Phase 8 で命名・path 統一。
- 運用性: troubleshooting-runbook + rotation 手順 + NON_VISUAL governance 5 項目 PASS。
- 認可境界: smoke route が production で runtime 404 を返す設計を再確認、`SMOKE_ADMIN_TOKEN` で staging 保護。
- 無料枠: 4 サービスすべてで月間試算余裕。
- Secret hygiene: PR / commit / `.env` に SA JSON 平文 0。
- 書き込み禁止: production 環境への書き込みが構造的に発生しない（smoke route 自体が non-existent）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 |
| 2 | 4条件最終判定（Phase 1 から再トレース） | 10 | spec_created | PASS |
| 3 | blocker 一覧作成 | 10 | spec_created | 7 件 |
| 4 | MINOR 未タスク化方針確定 | 10 | spec_created | ルール明文化 |
| 5 | GO/NO-GO 判定 | 10 | spec_created | GO |
| 6 | open question 送出 | 10 | spec_created | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・判定軸・AC サマリー・blocker・4条件再トレース |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-11 全件に達成状態が付与されている
- [ ] 4条件最終判定が PASS（Phase 1 → Phase 3 → Phase 9 → Phase 10 の再トレース付き）
- [ ] blocker 一覧に 7 件以上が記述され、解消条件が記述されている
- [ ] MINOR 未タスク化方針が明文化されている
- [ ] GO/NO-GO 判定が GO で確定
- [ ] open question 5 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/go-no-go.md が生成対象として定義され、実行時に作成される
- [ ] production への smoke route 露出禁止が GO 条件として明記

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × blocker × MINOR × GO/NO-GO × open question の 6 観点すべて記述
- 4条件再トレース表（Phase 1 → Phase 3 → Phase 9 → Phase 10）が記載
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test)
- 引き継ぎ事項:
  - GO 判定（implementation completed・live smoke pending 段階）
  - blocker 7 件（Phase 11 着手前に B-01〜B-03 を再確認、B-04〜B-07 は直前確認）
  - 条件付き PASS の AC（AC-1 / AC-3 / AC-6 / AC-7 / AC-10）を Phase 11 で実機確認
  - open question #1（wrangler dev `--local` 制約）を Phase 11 で実機確認・remote 切替判断
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないもの（条件付き PASS は除く）が残る
  - blocker B-01〜B-03 のいずれかが未完了
  - production への smoke route 露出可能性が残る
