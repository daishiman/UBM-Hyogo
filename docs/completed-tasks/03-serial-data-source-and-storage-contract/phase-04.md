# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-23 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | completed |
| implementation_mode | new |
| task_kind | NON_VISUAL（インフラ・data contract） |

## 目的

Phase 5 の Sheets→D1 sync 実装着手前に、(1) Google Sheets API 接続性、(2) Cloudflare D1 binding 疎通、(3) Sheets row → D1 row mapping 単体検証、(4) 冪等性検証、(5) 異常系（rate limit / partial failure / drift）の事前検証手順を CLI/curl/SQL ベースで確定する。UI 検証は対象外。

## 実行タスク

- Sheets API 接続テスト手順の確定（service account 認証 / 読取権限 / spreadsheets.values.get）
- D1 binding 疎通テスト手順の確定（`wrangler d1 execute` による select 1）
- mapping 単体テスト想定（Sheets 1 row → D1 row への型変換 / consent キー正規化 / responseEmail 取扱）
- sync 冪等性テスト想定（同一 responseId 再投入 → 重複 0 件）
- 異常系テスト想定（Sheets API 429 / D1 transaction 失敗 / partial sync 中断 → resume）
- verification-commands.md と test-plan.md の整備

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/data-contract.md | mapping table（型変換・consent 正規化） |
| 必須 | outputs/phase-02/sync-flow.md | manual / scheduled / backfill / recovery |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler d1 execute / binding 確認 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31問 / 6section / consent キー |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 無料枠（writes 100K/day） |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | GOOGLE_SERVICE_ACCOUNT_JSON 配置 |

## 実行手順

### ステップ 1: Sheets API 接続テスト手順の確定
- service account JSON を 1Password から取得し、ローカルに `GOOGLE_SERVICE_ACCOUNT_JSON` として export
- `curl -H "Authorization: Bearer $TOKEN" "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID/values/A1:AE2"` で 200 / 1 row を確認
- 失敗パターン: 401（service account 未共有）/ 403（権限不足）/ 429（rate limit）を test-plan.md に記載

### ステップ 2: D1 binding 疎通テスト手順の確定
- `wrangler d1 list` で対象 D1 が表示されること
- `wrangler d1 execute <DB_NAME> --command "select 1"` で `[{"1":1}]` を確認
- staging/production 双方の binding を `--env` で切り替えて確認する手順を記載

### ステップ 3: mapping / 冪等性 / 異常系 test plan
- mapping 単体: Sheets 仮想 1 row（fixture）→ 期待 D1 row（fixture）を test-plan.md にケース化（consent yes/no / responseEmail 欠損 / admin_* 列）
- 冪等性: 同一 fixture を 2 回 sync → `select count(*) from member_member_responses where response_id=?` が 1 のまま
- 異常系: Sheets 429 → exponential backoff、D1 transaction 失敗 → 全件 rollback、partial sync 中断 → audit log の resume_from を起点に再実行

### ステップ 4: 成果物の出力
- outputs/phase-04/test-plan.md（テスト観点 / fixture / 期待値）
- outputs/phase-04/verification-commands.md（curl / wrangler / sql コマンド集）
- outputs/phase-04/main.md（サマリ・blocker・next handoff）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verification-commands.md を実装後の smoke に再利用 |
| Phase 6 | 異常系シナリオの起点（rate limit / transaction failure / partial sync） |
| Phase 7 | AC-1〜AC-5 のトレースに test-plan.md を引用 |
| Phase 10 | gate 判定で test-plan の網羅性を確認 |

## 多角的チェック観点（AIが判断）

- 価値性: Phase 5 実装者がそのままコピペで疎通確認できる粒度か
- 実現性: D1 無料枠を消費しすぎない検証コマンド構成か（writes は最小限）
- 整合性: 不変条件 5（apps/web からの D1 直接アクセス禁止）を検証手順自体が破っていないか
- 運用性: 失敗時の切り分け手順（Sheets / network / D1 / mapping）が一意か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Sheets API 接続テスト手順 | 4 | completed | curl + service account |
| 2 | D1 binding 疎通テスト手順 | 4 | completed | wrangler d1 execute |
| 3 | mapping 単体テスト想定 | 4 | completed | fixture ベース |
| 4 | 冪等性テスト想定 | 4 | completed | responseId 重複 0 |
| 5 | 異常系テスト想定 | 4 | completed | 429 / tx fail / partial |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-plan.md | テスト観点 / fixture / 期待値 |
| ドキュメント | outputs/phase-04/verification-commands.md | curl / wrangler / sql コマンド集 |
| ドキュメント | outputs/phase-04/main.md | サマリ・blocker・handoff |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

依存Phase 2 / Phase 3: `outputs/phase-02/data-contract.md` / `outputs/phase-02/sync-flow.md` / `outputs/phase-03/main.md`

依存成果物参照: `outputs/phase-02/data-contract.md` / `outputs/phase-02/sync-flow.md` / `outputs/phase-03/main.md`

- [ ] test-plan.md が mapping / 冪等性 / 異常系の 3 カテゴリを網羅
- [ ] verification-commands.md の各コマンドが Phase 5 でコピペ実行可能
- [ ] Sheets API / D1 binding 双方の PASS 条件が記述済み
- [ ] 不変条件 2 / 3 / 4 / 5 / 7 を検証する観点が test-plan に含まれる

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（rate limit / tx 失敗 / partial sync / drift）の検証手順を含む
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: verification-commands.md を Phase 5 の事前疎通と事後 smoke の双方に流用
- ブロック条件: Sheets API 認証または D1 binding 疎通の手順が未確定なら次 Phase に進まない

## 検証コマンド一覧

| コマンド | 目的 | 期待 |
| --- | --- | --- |
| `wrangler d1 list` | D1 一覧表示 | 対象 DB が表示 |
| `wrangler d1 execute <DB> --command "select 1"` | binding 疎通 | `1` が返る |
| `curl -H "Authorization: Bearer $TOKEN" "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID?fields=spreadsheetId"` | Sheets 認証確認 | 200 + spreadsheetId |
| `curl ".../values/A1:AE2"` | 1 row 読取 | 200 + values |
| `wrangler d1 execute <DB> --command "select count(*) from member_responses"` | 冪等性事前計測 | ベースライン件数 |

## 期待出力表

| 検証 | PASS 条件 |
| --- | --- |
| Sheets API 接続 | 200 応答 / values にヘッダ行が含まれる |
| D1 binding 疎通 | select 1 が成功 / staging/production 両方 |
| mapping 想定 | 全 fixture が期待 D1 row に一致 |
| 冪等性 | 2 回投入後も responseId 件数が 1 |
| 異常系 | 429 でリトライ / tx 失敗で rollback / partial で resume |

## verify suite (CLI/curl/SQL ベース)

- 自動: `wrangler d1 execute` で疎通と件数取得
- 自動: curl で Sheets API 200 / 401 / 403 / 429 の応答コードを切り分け
- 手動: test-plan.md fixture を mapping ロジック仕様に対しレビューし整合確認
