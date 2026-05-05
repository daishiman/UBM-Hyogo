# Phase 6: テスト拡充（異常系 / エッジケース TC 設計）

> **本タスクは implementation である**。Phase 6 は Phase 5 で実装した script と redaction module に対し、異常系（token-like 値検出 / API 失敗 / 空 target / plan 制限）の **追加テストケース TC-07〜TC-12** を設計する責務を持つ。実装は本 Phase で行い、Phase 9 で品質ゲートに通す。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target diff script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（異常系 TC） |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装) |
| 次 Phase | 7 (テストカバレッジ確認) |
| 状態 | spec_created |
| タスク分類 | implementation（test-design） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

Phase 5 で確定した CLI 契約 / redaction 6 パターン / `cf.sh` allowlist に対し、本番運用で発生しうる **異常系・エッジケース** を TC-07〜TC-12 として網羅する。redaction module の bypass 経路を絶対に作らないため、token-like 値が **意図的に流入する fixture** で出力に値が一切残らないことを golden で検証する。fixture には実値を一切記載せず、すべて合成サンプル文字列を使う。

## 真の論点

- 「token-like 値が出力に残らない」を網羅するには、redaction 入力 fixture が現実の API レスポンス形状を模倣する必要がある（生 JSON / 改行入り / 複数値混在）。
- API 失敗時（401 / 403 / 429 / 5xx / timeout）の exit code 2 への一貫した収束。
- 空 target（Logpush job 0 件 / Analytics binding 0 件）が「障害」ではなく「正常一致 = exit 0」になる境界。
- plan 制限（Logpush は Workers Paid / Logs Engine 等の有料 plan 必須）で 403 が返る場合の exit code と message の一貫性。
- 引数欠落 / 不正値での exit 3 と stderr メッセージの redaction 適用。

## 依存境界

| 依存先 | 種別 | 用途 |
| --- | --- | --- |
| Phase 5 `outputs/phase-05/script-spec.md` | CLI 契約 | TC 入力の根拠 |
| Phase 5 `outputs/phase-05/redaction-module-spec.md` | redaction パターン | TC-07 / TC-08 の入力 |
| `scripts/lib/redaction.sh` | 実装 | unit test の対象 |
| Cloudflare API レスポンス形状 | 公開仕様 | fixture 形状の参考のみ（実値は使わない） |

## 異常系 TC 一覧

| TC ID | 目的 | 関連 AC | 期待 exit code |
| --- | --- | --- | --- |
| TC-07 | token-like 値（API Token 形式）が API レスポンスに含まれた場合に redaction module で完全伏字化されること | AC-3 (no-leak) | 0 または 1（diff 結果に依存）/ 出力に token 値 0 件 |
| TC-08 | Logpush sink URL の query string（access key / signature 含む）が redaction される | AC-3 | 同上 |
| TC-09 | Cloudflare API が 401 / 403 / 429 / 5xx / timeout を返した場合の終了挙動 | AC-4 | 2 |
| TC-10 | Logpush job が 0 件 / Analytics binding が 0 件のとき「両 Worker とも空＝一致」「片側のみ空＝差分」の境界判定 | AC-1 / AC-2 | 0 または 1 |
| TC-11 | plan 制限（Logpush 未契約・Workers Logs 上位機能未契約）で 403 が返るときの message と exit code | AC-4 | 2（message に「plan 制限の可能性」を含む） |
| TC-12 | 引数欠落 / 不正値（`--legacy-worker` 未指定 / 空文字 / 異常文字）の入力検証 | AC-5 | 3 |

### TC-07: token-like 値の redaction

| 項目 | 内容 |
| --- | --- |
| Pre | `scripts/lib/redaction.sh` が R-01〜R-06 を実装済み / fixture `tests/fixtures/observability/logpush-with-token.json` に合成 token-like 文字列を埋め込む |
| Steps | 1. fixture を `redact_stream` 関数に流し込む / 2. stdout 出力をキャプチャ / 3. 元 fixture に含まれる合成 token 文字列が出力に **0 件** であることを検査 |
| Expected | 出力に合成 token 文字列が 0 件 / `***REDACTED_TOKEN***` で置換されている |
| 失敗時の rollback 余地 | redaction の regex 修正のみ（破壊的影響なし） |

### TC-08: sink URL query 部 redaction

| 項目 | 内容 |
| --- | --- |
| Pre | fixture に `https://example.r2.cloudflarestorage.com/bucket?X-Amz-Signature=AKIAFAKE...` 形式の URL を含める |
| Steps | 1. redaction 通過後に query string が `?***REDACTED***` になっていること / 2. host / scheme / path は維持されていること |
| Expected | query 部のみ伏字化 / host は判別可能 |

### TC-09: API 失敗時の挙動

| 項目 | 内容 |
| --- | --- |
| Pre | `cf.sh` 呼び出しを mock または fake 化（PATH 上に同名 stub を置く）し、5 種の終了コード / 出力を強制 |
| Steps | 401 / 403 / 429 / 5xx / timeout（127 と仮定）で script を起動し exit code を観測 |
| Expected | いずれも exit 2 / stderr に redaction 適用後の error message |

### TC-10: 空 target

| 項目 | 内容 |
| --- | --- |
| Pre | mock で「Logpush job 0 件」「Analytics binding 0 件」を返す |
| Steps | 1. legacy / current 両方が空 → 一致と判定 → exit 0 / 2. 片側のみ空 → 差分 → exit 1 |
| Expected | diff summary が `legacy-only=0 / current-only=0` または対応値 |

### TC-11: plan 制限

| 項目 | 内容 |
| --- | --- |
| Pre | mock で Logpush API が 403 を返し body に plan 制限を示唆する文字列を含める |
| Steps | script 実行 → exit code と stderr message を観測 |
| Expected | exit 2 / stderr に「plan 制限の可能性」相当の human-readable message / response body 内 token-like 値は redaction 済み |

### TC-12: 引数検証

| 項目 | 内容 |
| --- | --- |
| Pre | （特になし） |
| Steps | `--legacy-worker` 未指定 / 空文字 / 制御文字混入 / 既知でない `--format` 値で起動 |
| Expected | 全て exit 3 / usage を stderr に出力 / 入力値の echo 時も redaction 通過 |

## fixture 配置

| パス | 内容 | 禁則 |
| --- | --- | --- |
| `tests/fixtures/observability/logpush-with-token.json` | 合成 token を埋め込んだ Logpush job レスポンス | 実 token / 実 sink URL を一切含めない |
| `tests/fixtures/observability/logpush-empty.json` | 空配列 | （特になし） |
| `tests/fixtures/observability/api-error-403.json` | plan 制限を模した 403 body | （特になし） |
| `tests/fixtures/observability/sink-url-with-query.txt` | sink URL 行を含む raw テキスト | 実 access key / signature を含めない |

## redaction unit test 観点

| 観点 | 入力 | 期待 |
| --- | --- | --- |
| 単一 token 行 | `Authorization: Bearer aaa.bbb.ccc` | `Bearer ***REDACTED***` |
| 複数 token 同一行 | `key1=AAAA1111 key2=BBBB2222` | 両方とも置換 |
| URL query | `https://x.example/?sig=ZZZ&exp=123` | `?***REDACTED***` |
| email | `user@example.com` | `***REDACTED_EMAIL***` |
| 短文字列の偽陽性回避 | `abc123` (8 文字未満) | 置換しない（誤判定回避） |
| Unicode / 日本語 | `トークン: ABC...` | token 部のみ置換、日本語は維持 |

## 異常系における共通禁則

- fixture / テスト出力 / log に **実値** を一切記載しない（合成サンプルのみ）。
- mock / stub は PATH 上に置くか関数 override で実装し、production API へ実通信しない。
- redaction を bypass する経路（直 `printf` / 直 file write）が増えていないことを Phase 9 で grep で再確認。
- API 失敗時の error body をそのまま file に書き出さない（必ず redaction を通す）。

## 実行手順

1. fixture 4 ファイルを `tests/fixtures/observability/` に作成（合成値のみ）。
2. TC-07〜TC-12 を test runner（bats / shellspec / または `bash` test harness）で実装。
3. redaction unit test を `tests/unit/redaction.test.sh` に実装し、6 観点を網羅。
4. mock 経路（`PATH` 先頭に stub `cf.sh` を置く方式）を `tests/helpers/cf-mock.sh` として整備。
5. Phase 7 の AC マトリクスへ TC-07〜TC-12 を引き渡す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | TC-07〜TC-12 が AC-1〜AC-5 のいずれかにマッピング |
| Phase 9 | redaction golden test を quality gate として実行 / fixture 内に実値が無いことを secret-leak audit で確認 |
| Phase 11 | staging 相当の dry-run でこれらの TC を実機 mock で再現 |

## 多角的チェック観点

- 価値性: 異常系 6 種が AC-1〜AC-5 を網羅しているか。
- 実現性: mock 経路で本番 API に当てずに再現できるか。
- 整合性: exit code 2 / 3 の境界が CLI 仕様と一致するか。
- 運用性: 失敗時 stderr が redaction を通り運用者にも安全に表示できるか。
- 認可境界: テストが production への副作用を起こさないことを stub 必須化で保証できているか。
- セキュリティ: fixture / 出力 / log に実値が混入しない設計か。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | TC-07〜TC-12 設計 | spec_created |
| 2 | fixture 4 ファイル定義 | spec_created |
| 3 | redaction unit test 6 観点 | spec_created |
| 4 | mock helper 定義 | spec_created |
| 5 | exit code 異常系の対応表 | spec_created |
| 6 | 共通禁則の列挙 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-06/main.md` | TC 設計サマリ |
| ドキュメント | `outputs/phase-06/anomaly-cases.md` | TC-07〜TC-12 の詳細表 + redaction unit test 観点 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] TC-07〜TC-12 の 6 件が Pre / Steps / Expected / rollback 余地で記述
- [ ] fixture 4 ファイルの内容と禁則が表で固定
- [ ] redaction unit test 6 観点が定義
- [ ] mock 経路が production 非接触で実装可能
- [ ] exit code 2 / 3 の境界が AC と矛盾しない
- [ ] fixture / 出力 / log に実値混入経路がない

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 2 文書が `outputs/phase-06/` に配置予定
- 全 TC で実値非混入の fixture 設計が明記
- redaction bypass を増やす経路が無い

## 次 Phase への引き渡し

- 次 Phase: 7 (テストカバレッジ確認)
- 引き継ぎ事項:
  - TC-07〜TC-12 → AC マトリクスの「関連 TC」列
  - redaction unit test → coverage threshold の対象
  - fixture → golden 一致の入力
- ブロック条件:
  - fixture に実値が混入
  - mock が production API に到達する経路を持つ
  - redaction bypass 経路が追加される
