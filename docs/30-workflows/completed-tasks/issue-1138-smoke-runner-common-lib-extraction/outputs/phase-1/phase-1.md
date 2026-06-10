# Phase 1: 要件定義

[実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 1.1 タスクの主問題（1 文固定）

`scripts/smoke/` 配下の 3 本の runtime smoke runner にコピー重複している共通ボイラープレートを、新規共通 lib `scripts/smoke/lib/smoke-common.sh` へ**挙動非退化のまま**抽出し、共通機構の修正を 1 箇所で完結させる（drift 防止 / SSOT 化）。

## 1.2 スコープ

### 含む

| # | 作業 | 対象ファイル | 種別 |
| - | ---- | ------------ | ---- |
| 1 | 共通 lib の新設 | `scripts/smoke/lib/smoke-common.sh` | 新規 |
| 2 | 共通 lib 用 local test の新設 | `scripts/smoke/__tests__/smoke-common.test.sh` | 新規 |
| 3 | attendance runner を共通 lib へ移行 | `scripts/smoke/runtime-attendance-provider.sh` | 編集 |
| 4 | admin-web runner を共通 lib へ移行 | `scripts/smoke/runtime-admin-web.sh` | 編集 |
| 5 | tag-bulk runner を共通 lib へ移行 | `scripts/smoke/runtime-tag-bulk.sh` | 編集 |
| 6 | 既存 3 runner の local test 非退化確認（テスト本体は原則変更しない） | `scripts/smoke/__tests__/runtime-*.test.sh` | 検証 |

### 含まない（スコープ外）

- runner の機能追加・contract 変更・assertion 追加（NON_VISUAL の挙動変更禁止）。
- 新 endpoint 追加・D1 schema 変更・Google Form 仕様変更。
- 4 本目以降の新規 runner 作成（着手トリガであって本タスクの成果物ではない）。
- `commit` / `push` / `PR` 等の git 操作（Phase 13・user-gated）。
- `scripts/smoke/redact.sh` のロジック変更（SSOT として参照するのみ）。

## 1.3 受け入れ基準（AC）— issue #1138 を最新コードへ最適化

| ID | 受け入れ基準 | 検証方法 |
| -- | ------------ | -------- |
| AC-1 | `scripts/smoke/lib/smoke-common.sh` を新設し、共通機構（redact 経由ログ / summary 状態 + write_summary + summary_pass + fail entry builder / host-allowlist 照合 / env prefix 解決 / `run_d1` D1 ラッパー）を集約する | ファイル存在 + 関数定義 grep |
| AC-2 | 既存 3 runner が共通 lib を `source` し、各自のコピー重複定義を削除する | 各 runner の `source .../lib/smoke-common.sh` 行 + 重複定義削除を diff で確認 |
| AC-3 | 各 runner の挙動が**非退化**であること。既存 local test（attendance / admin-web / tag-bulk）が全 PASS する | 3 本の `*.test.sh` を実行し全 PASS |
| AC-4 | cleanup trap が**二重実行されない**こと。共通 lib は trap を登録せず純粋部品のみ提供、trap 登録は各 runner 責務 | lib に `trap` 行が無いこと + cleanup マーカーテスト（Phase 6） |
| AC-5 | runner 固有の差分（contract jq shape / fixture prefix / endpoint URL / `assert_target` 系 / `assert_all_status` 等）は共通 lib に巻き込まず各 runner に残す（境界が MECE） | lib に固有関数が無いこと + Phase 2 MECE 表との整合 |
| AC-6 | 共通 lib 自体の local test（`scripts/smoke/__tests__/smoke-common.test.sh`）を追加し、共通関数の単体挙動を検証する | 新 test ファイル存在 + 実行 PASS |
| AC-7 | shellcheck 相当の静的検証を通過すること（`source` 解決 / 未定義変数 / SC2034 等の指摘がない）。lib の外部公開変数は `SMOKE_` prefix で隔離、内部変数は `local` 化 | `shellcheck` 実行で対象 4 ファイルが clean |
| AC-8 | `scripts/smoke/redact.sh` の既存責務と整合（redact ロジックを lib に二重実装しない） | lib が `redact.sh` を `bash` 呼び出しで参照していること |
| AC-9 | **【最適化追加】** `write_summary` の JSON 配列キー分岐（attendance=`routes` / admin-web・tag-bulk=`checks`）を、共通 `smoke_write_summary` の **array_key 引数化**で非退化に再現する | attendance test の `.routes[...]` assert と admin-web test の `.checks[...]` assert が両方 PASS |
| AC-10 | **【最適化追加】** `runtime-tag-bulk.test.sh` の `source "$RUNNER"` → `assert_all_status`/`extract_count` 直接呼び出しが、移行後も成立する（lib を source した runner を source しても関数解決できる） | tag-bulk test の `assert-*` / `extract-count` ケースが PASS |

## 1.4 不変条件

1. **挙動非退化が最優先**: 既存 3 runner の local test が assert する挙動（summary.json shape / exit code / log 内容 / redaction）を 1 つも変えない。
2. **lib は `set` / `trap` を持たない**: フラグ・trap 登録は runner 責務（shell source の副作用回避）。
3. **`SMOKE_` prefix で名前空間隔離**: lib の公開変数・関数。内部変数は `local`。
4. **redact SSOT**: redact ロジックは `redact.sh` のみ。lib は参照のみ。
5. **CLAUDE.md 整合**: `wrangler` 直叩き禁止（`run_d1` は `scripts/cf.sh` 経由を維持）。

## 1.5 命名規則の分析（既存コードベースに合わせる）

| 観点 | 既存パターン | 本タスクでの方針 |
| ---- | ------------ | ---------------- |
| shell ファイル名 | kebab-case（`runtime-tag-bulk.sh` / `redact.sh`） | `smoke-common.sh`（kebab-case） |
| 既存 runner 内関数名 | snake_case（`fail_and_exit` / `write_summary` / `assert_target` / `run_d1`） | lib 関数も snake_case |
| lib 公開関数の prefix | （既存に lib なし） | `smoke_` prefix で衝突回避（`smoke_write_summary` 等） |
| lib 公開変数の prefix | 3 runner は `SUMMARY_ENTRIES` 等（prefix なし） | lib は `SMOKE_` prefix（`SMOKE_SUMMARY_ENTRIES` / `SMOKE_OVERALL_STATUS`）。runner 側ラッパーで吸収 |
| test ファイル | `<runner>.test.sh`（`scripts/smoke/__tests__/`） | `smoke-common.test.sh`（同ディレクトリ） |

> **注**: 既存 3 runner は `SUMMARY_ENTRIES` / `OVERALL_STATUS` という prefix なし変数を使う。lib では `SMOKE_` prefix に統一し、runner 側の薄いラッパー（`write_summary` / `fail_and_exit`）が lib 関数を呼ぶ形にすることで、runner 内の他コードへの影響を局所化する。

## 1.6 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| -------- | ---- | ---- |
| current branch に実装が存在する | ❌ なし | `scripts/smoke/lib/` 不在。通常の新規実装 Phase とする（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | ❌ なし | `grep -rn smoke-common` 0 件。未実装 |
| 前提タスク（依存タスク）が完了済み | ✅ | 親 issue-1081（3 本目 runner 追加元）は実装済み。3 runner が安定して存在 |

## 1.7 carry-over 確認（前タスク成果物の棚卸し）

| 確認 | 結果 |
| ---- | ---- |
| `git log --oneline -5 -- scripts/smoke/` | 最新は `e679722f5`（issue-1081 = tag-bulk runner 追加）。以降 smoke runner 構造変更なし |
| 既存 3 runner の現状行数 | attendance 291 / admin-web 217 / tag-bulk 310（合計 818） |
| 重複の実在 | `write_summary` / `fail_and_exit` / `SUMMARY_ENTRIES`+`OVERALL_STATUS` 初期化 / redact パイプ が 3 runner にコピー存在 |

## 1.8 タスク分類

- **タスク種別**: refactoring / NON_VISUAL（UI 変更なし・bash 内部構造の改善）。
- **Phase 11**: NON_VISUAL → スクリーンショット不要。代替証跡は local test 全 PASS ログ + shellcheck clean。
- **Phase 12 Step 2（システム仕様更新）**: 新規インターフェース追加なし（内部リファクタ）→ 原則 N/A。ただし `smoke_*` 共通 lib の公開関数 surface は Phase 12 で「内部開発者向け契約」として記録する。

## 1.9 完了条件（Phase 1）

- [x] AC-1〜AC-10 を確定した。
- [x] スコープ（含む / 含まない）を確定した。
- [x] 不変条件・命名規則・P50・carry-over を記録した。
- [x] NON_VISUAL 分類と Phase 11/12 への含意を記録した。
</content>
