# Phase 5: 実装（observability target diff script 本体 + redaction module + cf.sh integration）

> **本タスクは implementation である**。Phase 5 は `scripts/observability-target-diff.sh`（最終パス・実装言語は本 Phase で確定）と redaction module、`scripts/cf.sh` への integration を実装する責務を持つ。secret/token は redaction module を介して必ず伏字化する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target diff script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（script + redaction + cf.sh integration） |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系テスト拡充) |
| 状態 | spec_created |
| タスク分類 | implementation（observability tooling） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) |
| GitHub Issue | #329 |

## 目的

`ubm-hyogo-web-production`（新 Worker）と旧 Worker（rename 前 entity）の observability target（Workers Logs / Tail / Logpush / Analytics Engine）の差分を **読み取り専用** で出力する script を `scripts/` 配下に追加する。読み取りは `bash scripts/cf.sh` ラッパー経由のみで行い、出力 / ログ / 中間ファイルには **token-like 値 / sink URL / dataset credential** を残さない。redaction module を独立した責務として分離し、Phase 6 / 7 / 9 で golden test と secret-leak audit の対象にできる構造とする。

## 真の論点

- 「読み取り専用」を破壊的副作用ゼロでどう保証するか（`cf.sh` の許容サブコマンド allowlist）。
- secret 値が API レスポンスに混入してくる経路（Logpush sink URL の query string、Analytics Engine API token、dataset 認可情報）に対する redaction の網羅性。
- 旧 Worker 名は inventory 由来で動的のため、script は引数か環境変数経由で受け取る（hardcode 禁止）。
- diff 出力の安定化（key 並び順 / 順序非依存 / 改行差吸収）。Phase 7 で golden 一致を取るための前提。
- 「target」の定義域: Workers Logs（Tail 設定 + sampling）/ Logpush job 一覧 / Analytics Engine dataset binding / Workers Logs (Workers Observability) の 4 種を最小スコープとする。

## 依存境界

| 依存先 | 種別 | 用途 |
| --- | --- | --- |
| `scripts/cf.sh` | 既存ラッパー | Cloudflare API への read-only 呼び出し（`tail` 試行 / `logpush` 一覧 / Analytics dataset 一覧） |
| `apps/web/wrangler.toml` | 既存 config | 新 Worker 名（`ubm-hyogo-web-production`）取得元 |
| 1Password (`op://`) | secret store | `CLOUDFLARE_API_TOKEN` 等の動的注入元（実値は環境変数として揮発） |
| inventory（旧 Worker 名） | 引数 / env var | hardcode 禁止 |
| `mise exec --` | Node 24 / pnpm 10 確保 | shell script は mise exec 経由で起動 |

## 実行タスク

1. script 最終パスと実装言語を確定する（候補: `scripts/observability-target-diff.sh` を bash で実装、redaction module は `scripts/lib/redaction.sh` として分離）。完了条件: 配置パスと言語が本 Phase 文書で固定。
2. CLI インターフェース（引数 / 環境変数 / exit code / 出力フォーマット）を `outputs/phase-05/script-spec.md` に確定する。完了条件: AC-1〜AC-5 の入出力契約が表で固定。
3. redaction module の責務（token-like / sink URL / dataset credential のパターンと置換文字列）を `outputs/phase-05/redaction-module-spec.md` に確定する。完了条件: 6 種のパターンと unit test 観点が表で固定。
4. `scripts/cf.sh` integration（allowlist サブコマンド・op 注入の受け渡し方法・read-only 強制）を確定する。完了条件: 呼び出すサブコマンドが allowlist 化され破壊的操作（put / delete / deploy）が禁止される。
5. 旧 Worker 名と新 Worker 名の取得経路（引数・env var・wrangler.toml から派生）を確定する。完了条件: hardcode 0 件で `--legacy-worker` `--current-worker` 引数が必須化。
6. diff 出力フォーマット（key sort / 改行正規化 / JSON または markdown table）を確定する。完了条件: golden 比較で安定する diff 出力仕様が記述。
7. exit code 設計（0 = 一致, 1 = 差分あり, 2 = API エラー / plan 制限, 3 = 引数エラー）を確定する。完了条件: AC-1〜AC-5 と exit code の対応表。
8. logging ポリシー（stderr のみ・redaction 適用後のみ・1Password 値経路を log に残さない）を確定する。完了条件: log 関数経由必須化と禁止事項列挙。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-01.md 〜 phase-04.md | AC / 設計 / テスト戦略 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | 親タスクの runbook と TC（参照のみ） |
| 必須 | scripts/cf.sh | Cloudflare CLI ラッパー（直接 wrangler 呼び出し禁止の根拠） |
| 必須 | apps/web/wrangler.toml | `[env.production].name` 取得 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由必須 / 1Password 動的注入 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | observability 仕様 |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `scripts/observability-target-diff.sh` | 本 script 本体（読み取り専用 / diff 出力 / exit code） | `scripts/cf.sh` / `scripts/lib/redaction.sh` |
| `scripts/lib/redaction.sh` | redaction module（token-like / sink URL / dataset credential を伏字化） | （単独） |
| `outputs/phase-05/main.md` | 本 Phase 実装ノート（採用判断・差替候補） | （Phase 1〜4） |
| `outputs/phase-05/script-spec.md` | CLI 契約（引数 / env / 出力 / exit code） | Phase 4 テスト戦略 |
| `outputs/phase-05/redaction-module-spec.md` | redaction パターン定義 + unit test 観点 | （単独） |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `scripts/cf.sh` | 必要に応じて read-only サブコマンド（`logpush list` / `tail --once` 等）の通過を確認。破壊的サブコマンドは追加しない。値レベルの変更は最小限とし、変更があれば本 Phase で diff を記載する |

## CLI 仕様（`outputs/phase-05/script-spec.md` の骨格）

| 項目 | 値 |
| --- | --- |
| invocation | `bash scripts/observability-target-diff.sh --legacy-worker <NAME> --current-worker ubm-hyogo-web-production [--format json\|md] [--config apps/web/wrangler.toml]` |
| 必須引数 | `--legacy-worker` / `--current-worker` |
| optional 引数 | `--format`（既定 `md`）/ `--config`（既定 `apps/web/wrangler.toml`） |
| 環境変数 | `CLOUDFLARE_API_TOKEN`（`op run` 経由で注入される前提・script 内では値を log しない） |
| 出力 stream | stdout = diff 結果 / stderr = 進捗・警告（redaction 後） |
| 副作用 | **なし**（read-only。put / delete / deploy / login を呼ばない） |
| exit 0 | observability target 一致 |
| exit 1 | 差分あり（旧 Worker 残存 binding 検出 等） |
| exit 2 | API 失敗 / plan 制限（Logpush 未契約等） / cf.sh 認証失敗 |
| exit 3 | 引数不足・引数不正 |

## redaction module 仕様（`outputs/phase-05/redaction-module-spec.md` の骨格）

| パターン ID | 対象 | 検出 regex（例） | 置換 |
| --- | --- | --- | --- |
| R-01 | Cloudflare API Token | `[A-Za-z0-9_-]{40,}` （文脈: `Authorization:` 近傍 / token field） | `***REDACTED_TOKEN***` |
| R-02 | OAuth Bearer | `Bearer\s+[A-Za-z0-9._-]+` | `Bearer ***REDACTED***` |
| R-03 | Logpush sink URL | `https?://[^ ]*\?[^ ]*` で query を含むもの | scheme + host のみ残し query を `?***REDACTED***` |
| R-04 | S3 / R2 access key | `(?i)access[_-]?key[_-]?id["':= ]+[A-Za-z0-9/+=]+` | `***REDACTED_ACCESS_KEY***` |
| R-05 | Dataset credential | `dataset_credential\s*[:=]\s*"?[^",\s]+` | `dataset_credential=***REDACTED***` |
| R-06 | email-like | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` | `***REDACTED_EMAIL***` |

> redaction は **必ず stdout / stderr 出力直前** に適用する（log 関数の最終段で実行）。一次取得した API レスポンスを生のまま file に書かない。

## `cf.sh` integration（read-only allowlist）

| 用途 | 呼び出し | 種別 |
| --- | --- | --- |
| 認証確認 | `bash scripts/cf.sh whoami` | read-only |
| Logpush job 一覧 | `bash scripts/cf.sh logpush list --config <config> --env production`（cf.sh 側未対応の場合は同等 read-only サブコマンドを追加せず API 経由で取得し、その経路も script 内で redaction を通す） | read-only |
| Tail 試行（接続確認のみ） | `bash scripts/cf.sh tail --config <config> --env production --once` または `--format json` で 1 件のみ受信 | read-only |
| Analytics Engine dataset 確認 | wrangler.toml の `[[analytics_engine_datasets]]` を静的に読む（API 経由が必要なら read-only エンドポイントのみ） | read-only |

> 破壊的操作（`secret put` / `secret delete` / `deploy` / `rollback` / `wrangler login`）は本 script から **呼ばない**。`cf.sh` 自体には追加しない。

## 出力フォーマット例

```markdown
# observability-target-diff
- legacy: <legacy-worker-name>
- current: ubm-hyogo-web-production

## Logpush jobs
| job_id | target_worker | dataset | sink (redacted) | status |
| --- | --- | --- | --- | --- |
| 12345 | <legacy> | workers_trace_events | https://example.r2.cloudflarestorage.com/?***REDACTED*** | enabled |

## Tail
- legacy reachable: yes
- current reachable: yes

## Analytics Engine
- legacy bindings: 1
- current bindings: 1

## Diff summary
- legacy-only targets: 1
- current-only targets: 0
- exit_code: 1
```

## セキュリティガード

- `.env` 中身を `cat` / `Read` / `grep` しない（CLAUDE.md ルール）。
- `wrangler login` を呼ばない / OAuth トークン file を保持しない。
- API Token 値・sink URL の query string・dataset credential を **stdout / stderr / file / commit / PR** に残さない。
- redaction module を bypass する経路（直 `echo` / 直 `printf`）を script 内に作らない。log 関数経由を必須化。
- ターミナル history への漏洩を避けるため、引数に値を取らない設計を維持（値は環境変数で 1Password 経由）。

## canUseTool 適用範囲

- 自動編集を許可: `scripts/observability-target-diff.sh` / `scripts/lib/redaction.sh` / `outputs/phase-05/*` の新規作成。
- 人手承認必須: `scripts/cf.sh` を実機実行する全コマンド（read-only であっても production への接続のため）。
- 該当なし: コード本体の typecheck / lint（Phase 9 で実施）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | redaction module の異常系（token-like 値検出 / API 失敗 / 空 target / plan 制限）を unit test で網羅 |
| Phase 7 | AC-1〜AC-5 と CLI / exit code / redaction の対応マトリクス + golden 一致 |
| Phase 8 | log 関数 / redaction 関数の SRP 化と共通化 |
| Phase 9 | shellcheck / typecheck / lint / 1Password ref / no-secret-leak audit |

## 多角的チェック観点

- 価値性: AC-1〜AC-5 が CLI / exit code / 出力フォーマットで完全に表現されているか。
- 実現性: `scripts/cf.sh` の read-only サブコマンドのみで diff が取れるか。
- 整合性: 親タスク UT-06-FU-A の runbook と Worker 名・config・env が一致するか。
- 運用性: `bash scripts/observability-target-diff.sh --legacy-worker X --current-worker Y` で誰が実行しても再現するか。
- 認可境界: 破壊的操作が物理的に呼ばれない設計（allowlist + 引数設計）か。
- セキュリティ: redaction が stdout / stderr / file の全経路で適用されるか。bypass 経路が存在しないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | script パス・言語確定 | spec_created |
| 2 | CLI 仕様確定 | spec_created |
| 3 | redaction module 仕様確定 | spec_created |
| 4 | `cf.sh` integration allowlist | spec_created |
| 5 | 旧 / 新 Worker 名取得経路 | spec_created |
| 6 | diff 出力フォーマット | spec_created |
| 7 | exit code 設計 | spec_created |
| 8 | logging ポリシー | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| script | `scripts/observability-target-diff.sh` | 本 script 本体 |
| module | `scripts/lib/redaction.sh` | redaction 共通関数 |
| ドキュメント | `outputs/phase-05/main.md` | 実装ノート |
| ドキュメント | `outputs/phase-05/script-spec.md` | CLI 契約 |
| ドキュメント | `outputs/phase-05/redaction-module-spec.md` | redaction パターン定義 |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] script 最終パスと実装言語が固定
- [ ] CLI 引数 / env / 出力 / exit code の全契約が `script-spec.md` に記述
- [ ] redaction の 6 パターンが `redaction-module-spec.md` に記述
- [ ] `cf.sh` 経由の read-only サブコマンド allowlist 確定（破壊的サブコマンド 0 件）
- [ ] 旧 / 新 Worker 名が hardcode されず引数経由で受け渡し
- [ ] diff 出力が key sort / 改行正規化済みで golden 一致可能
- [ ] exit code 0 / 1 / 2 / 3 が AC-1〜AC-5 と対応
- [ ] log 関数 / redaction 関数経由を必須化し bypass 経路 0
- [ ] `wrangler` 直叩きが script 内に 0 件

## タスク100%実行確認【必須】

- 実行タスク 8 件が `spec_created`
- 成果物 3 文書が `outputs/phase-05/` に配置予定
- redaction module が分離され Phase 9 の golden test 対象になる構造
- 破壊的操作呼び出しが script 内に存在しない設計

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系テスト拡充)
- 引き継ぎ事項:
  - CLI 契約 / exit code → 異常系 TC の入力
  - redaction 6 パターン → 異常系 TC で token-like 値検出の対象
  - allowlist サブコマンド → API 失敗 / plan 制限の異常系入力
- ブロック条件:
  - script 内に `wrangler` 直叩きが残る
  - redaction bypass 経路が残る
  - 旧 / 新 Worker 名が hardcode される
  - 破壊的サブコマンドが allowlist に紛れる
