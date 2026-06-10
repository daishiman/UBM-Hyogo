# Phase 11: 手動テスト（NON_VISUAL evidence・runner 非退化 ledger） — issue-1138-smoke-runner-common-lib-extraction

[実装区分: 実装仕様書] / NON_VISUAL

## 目的

`scripts/smoke/lib/smoke-common.sh` への共通機構抽出（bash 内部リファクタリング）について、**挙動非退化を保証する手動テスト計画と evidence ledger** を固定する。本タスクは UI 表示物・runtime 挙動の変更を一切伴わないため screenshot は不要であり、代替証跡として「既存 3 runner の local test 全 PASS ログ」「新規 `smoke-common.test.sh` の PASS ログ」「shellcheck clean ログ」を `outputs/phase-11/evidence/` 配下に配置する。

## NON_VISUAL 宣言 [WEEKGRD-03]

| 項目 | 内容 |
| ---- | ---- |
| タスク種別 | refactoring（bash 共通 lib 抽出 / SSOT 化）。新 endpoint・UI・D1 schema・Google Form 仕様の変更なし |
| 非視覚的理由 | 変更対象は `scripts/smoke/` 配下の shell スクリプト内部構造のみ。レンダリングされる UI 画面・コンポーネント・ルートが存在せず、視覚的に観察可能な成果物が無い（`artifacts.json.ui_routes` 空 / `visualEvidence=NON_VISUAL`） |
| スクリーンショットを作らない理由 | 視覚的変化が存在しないため screenshot は false green（無関係画像で「検証した」と誤認させる）を招く。NON_VISUAL では screenshot 生成を**禁止**する |
| 代替証跡（主ソース） | (1) 既存 3 runner の local test 全 PASS ログ、(2) 新規 `scripts/smoke/__tests__/smoke-common.test.sh` の PASS ログ、(3) `shellcheck` clean ログ（対象 4 ファイル） |

> **実地操作不可の明示 [Feedback BEFORE-QUIT-001]**: 本タスクには UI 表示物が無く、ブラウザ等での実地操作による目視確認は原理的に不可能である。したがって手動テストの実体は「自動テスト（shell test）結果 + 静的検証（shellcheck）」を代替証跡として採用することで成立させる。実地操作の代わりに、非退化を assert する既存 test の GREEN とリファクタ前後での結果不変を証跡とする。

## タスク種別とテスト方式

| 項目 | 値 |
| ---- | -- |
| タスク種別 | refactoring（NON_VISUAL・bash 内部リファクタ） |
| visualEvidence | NON_VISUAL（UI 表示物の変更なし。screenshot 不要・生成禁止＝false green 防止） |
| テスト方式 | 自動 shell test（既存 3 runner test の非退化 + 新規 lib test）＋ shellcheck 静的検証 |
| 状態語彙 | **`implemented_local_evidence_captured`**（実装・local test・shellcheck 完了。commit・PR は user-gated） |

> **状態語彙の根拠**: 本サイクルで lib 実装・3 runner 移行・test 実行・shellcheck 実行まで完了し、全 evidence は `present` である。commit / push / PR のみ user-gated として Phase 13 に残す。

## 3層評価

| 層 | 適用 | 内容 / N/A 理由 |
| -- | ---- | --------------- |
| Semantic | ✅ 該当 | 抽出した lib 共通関数（`smoke_redact_filter` / `smoke_redact_line` / `smoke_summary_init` / `smoke_summary_pass` / `smoke_summary_fail_entry` / `smoke_write_summary` / `smoke_assert_host_allow` / `smoke_env_prefix` / `smoke_run_d1`）の単体挙動が意味的に正しく、かつ 3 runner の薄ラッパー経由で既存 summary.json shape（`routes` / `checks`）・exit code・redaction を非退化に再現することを検証する |
| Visual | ❌ N/A | UI 表示物が存在しない（NON_VISUAL）。レンダリング対象が無く、視覚的に比較すべき画面が無いため適用不能。screenshot は生成しない |
| AI UX | ❌ N/A | 操作 UI / ユーザー導線が無い内部リファクタリングであり、運用者が対面する UI フロー・コピー・状態遷移が存在しない。lib の公開関数 surface は「内部開発者向け契約」として Phase 12 で記録し、本層の評価対象外とする |

## Phase 11 evidence file inventory

> evidence ディレクトリ `outputs/phase-11/evidence/` は本サイクルで作成済。下表のログファイル名を **canonical** として宣言し、全ログを `present` として保存済み。

| # | evidence 名 | file path（canonical） | status | 対応 AC | notes |
| - | ----------- | ---------------------- | ------ | ------- | ----- |
| 1 | 新規 lib local test 実行ログ | `outputs/phase-11/evidence/smoke-common-test.log` | **present** | AC-1 / AC-6 / AC-9 | `bash scripts/smoke/__tests__/smoke-common.test.sh` の全 PASS 出力。lib 共通関数の単体挙動・`smoke_write_summary` の array_key 切替（routes/checks）を検証する主証跡 |
| 2 | attendance runner test 非退化ログ | `outputs/phase-11/evidence/runtime-attendance-provider-test.log` | **present** | AC-3 / AC-9 | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` の全 PASS 出力（11 ケース）。`.routes[]` shape の非退化証跡 |
| 3 | admin-web runner test 非退化ログ | `outputs/phase-11/evidence/runtime-admin-web-test.log` | **present** | AC-3 | `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` の全 PASS 出力（16 ケース）。`.checks[]` shape の非退化証跡 |
| 4 | tag-bulk runner test 非退化ログ | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` | **present** | AC-3 / AC-10 | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` の全 PASS 出力。`source "$RUNNER"` 二段 source 後の `assert_all_status` / `extract_count` 直接呼び出しが成立する証跡（assert-assigned / assert-noop / assert-unassigned / assert-empty-fails / assert-mixed-fails / assert-batch-required / summary-pass / redaction） |
| 5 | shellcheck 検証ログ | `outputs/phase-11/evidence/shellcheck.log` | **present** | AC-7 / AC-8 | `shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh` の出力（clean = 指摘 0）。`source` 解決・未定義変数・SC2034 等の指摘が無いことの証跡 |

## AC ごとの検証結果

| AC | 内容 | 検証 evidence | 検証方法 | 現状 status |
| -- | ---- | ------------- | -------- | -------------------------- |
| AC-1 | 共通 lib `smoke-common.sh` を新設し共通機構を集約 | #1 lib test log | lib test が各 `smoke_*` 関数を source して単体呼び出しし期待出力を assert | **present / PASS** |
| AC-2 | 3 runner が lib を `source` し重複定義を削除 | #2 / #3 / #4 runner test log | 各 runner test が PASS = source 解決成功 + 薄ラッパー経由で既存挙動維持 | **present / PASS** |
| AC-3 | 各 runner の挙動が**非退化**（既存 3 runner test 全 PASS） | #2 / #3 / #4 runner test log | リファクタ前後で 3 test の結果が不変（全 PASS）。summary.json shape / exit code / log 内容を assert | **present / PASS** |
| AC-4 | cleanup trap が二重実行されない（lib は trap 非保持） | #5 shellcheck log + #1 lib test | lib に `trap` 行が無いことを静的確認。trap 登録は runner 残置 | **present / PASS** |
| AC-5 | runner 固有差分（contract jq / fixture prefix / `assert_target` / `assert_all_status` 等）を lib に巻き込まない（MECE） | #5 shellcheck log + #4 tag-bulk test | lib に固有関数が無いこと + tag-bulk 固有関数が runner 側で解決すること（AC-10 と連動） | **present / PASS** |
| AC-6 | 共通 lib 自体の local test を追加 | #1 lib test log | `smoke-common.test.sh` が存在し全ケース PASS | **present / PASS** |
| AC-7 | shellcheck 相当の静的検証を通過 | #5 shellcheck log | `shellcheck` で対象 4 ファイルが clean（指摘 0）。`SMOKE_` prefix 隔離・内部 `local` 化 | **present / PASS** |
| AC-8 | `redact.sh` の責務と整合（redact を lib に二重実装しない） | #5 shellcheck log + #1 lib test | lib が `bash "$SMOKE_REDACT"` 呼び出しで redact.sh を参照していること（実装複製なし） | **present / PASS** |
| AC-9 | `write_summary` の array_key 分岐（attendance=routes / 他=checks）を非退化再現 | #1 lib test log + #2 attendance test + #3 admin-web test | lib test が `smoke_write_summary ... routes` / `... checks` の両出力を assert。attendance test の `.routes[]` assert と admin-web test の `.checks[]` assert が両方 PASS | **present / PASS** |
| AC-10 | `runtime-tag-bulk.test.sh` の `source "$RUNNER"` → `assert_all_status` / `extract_count` 直接呼び出しが移行後も成立 | #4 tag-bulk test log | test→runner→lib の二段 source で全関数解決。tag-bulk test の assert-* / count 系ケースが PASS | **present / PASS** |

## 検証手順（本サイクルで実行済み）

> 下記は本サイクルで実行済み。出力は上表の canonical ファイル名で `outputs/phase-11/evidence/` に配置した。

```bash
ROOT=docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction
EV="$ROOT/outputs/phase-11/evidence"

# (1) 新規 lib local test（AC-1 / AC-6 / AC-9）
bash scripts/smoke/__tests__/smoke-common.test.sh \
  | tee "$EV/smoke-common-test.log"

# (2) attendance runner 非退化（AC-3 / AC-9・11 ケース）
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh \
  | tee "$EV/runtime-attendance-provider-test.log"

# (3) admin-web runner 非退化（AC-3・16 ケース）
bash scripts/smoke/__tests__/runtime-admin-web.test.sh \
  | tee "$EV/runtime-admin-web-test.log"

# (4) tag-bulk runner 非退化（AC-3 / AC-10）
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh \
  | tee "$EV/runtime-tag-bulk-test.log"

# (5) shellcheck clean（AC-7 / AC-8・対象 4 ファイル）
shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh \
  | tee "$EV/shellcheck.log"
```

- 期待: (1)〜(4) は全ケース PASS、(5) は出力なし（= clean / 指摘 0）。
- evidence #1〜#5 は `present`。`artifacts.json` の Gate-B は `passed`。

## Phase 11 で発見した HIGH 問題のフィードバックループ

本サイクルで HIGH 問題なし。scope 外問題は検出していない。

## 完了条件（Phase 11）

- [x] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / スクリーンショットを作らない理由 / 代替証跡）を冒頭に明記した [WEEKGRD-03]
- [x] 実地操作不可（UI 表示物なし）を明示し、自動テスト結果 + shellcheck を代替証跡とする旨を記録した [Feedback BEFORE-QUIT-001]
- [x] 3層評価で Semantic のみ該当・Visual / AI UX を N/A と理由付きで明記した
- [x] Phase 11 evidence file inventory（5 行）を canonical ファイル名で固定した（`smoke-common-test.log` / `runtime-{attendance-provider,admin-web,tag-bulk}-test.log` / `shellcheck.log`）
- [x] AC-1〜AC-10 ごとに検証 evidence・検証方法・PASS 状態を記録した
- [x] 検証手順（本サイクルで実行済みのコマンド列）を記載した
- [x] 全 evidence を present として保存し、Gate-B を passed に更新した
