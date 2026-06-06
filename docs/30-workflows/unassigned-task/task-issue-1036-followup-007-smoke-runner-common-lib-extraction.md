## メタ情報

```yaml
issue_number: 1138
task_id: task-issue-1036-followup-007-smoke-runner-common-lib-extraction
task_name: smoke runner 共通機構の共通 lib（scripts/smoke/lib/smoke-common.sh）抽出
category: リファクタリング
target_feature: scripts/smoke/ 配下の runtime smoke runner 群
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1081-bulk-tag-real-d1-runtime-smoke Phase 12 unassigned-task-detection UT-CANDIDATE-3 / Phase 10 MINOR M-1
created_date: 2026-06-03
dependencies: [issue-1081-bulk-tag-real-d1-runtime-smoke]
spec_path: docs/30-workflows/unassigned-task/task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---
## 1. 概要

`scripts/smoke/` 配下の runtime smoke runner 群（現状 3 本）で重複している機構を、共通 lib `scripts/smoke/lib/smoke-common.sh` へ抽出するリファクタリングタスク。

現状の runner は以下の 3 本:

| runner | 役割 | 備考 |
|--------|------|------|
| `scripts/smoke/runtime-attendance-provider.sh` | attendance provider の runtime smoke | 共通機構の雛形（origin） |
| `scripts/smoke/runtime-admin-web.sh` | admin-web 系の runtime smoke | |
| `scripts/smoke/runtime-tag-bulk.sh` | bulk tag の runtime smoke | issue-1081 で新規追加。`runtime-attendance-provider.sh` を雛形に作成され関数群が重複コピーされている |

共通化候補の機構（各 runner にコピー重複している）:

- `assert_target` / `assert_status`（assertion ヘルパー群。`runtime-tag-bulk.sh` では `assert_all_status` / `assert_status_file` 等として展開されている）
- `fail_and_exit`（失敗時の終了経路）
- `summary_pass`（成功サマリ記録）
- redact 経由ログ（`log_redacted` 等。`scripts/smoke/redact.sh` を再利用）
- `--ci-summary` の summary.json 出力（`write_summary` 等）
- `run_d1`（`scripts/cf.sh d1 execute` ラッパー）

`runtime-tag-bulk.sh` は `runtime-attendance-provider.sh` を雛形に作られており、上記関数群が重複コピーされている。このコピー重複が抽出の動機である。

---

## 2. 目的

- 3 本の runner に散在するコピー重複機構を単一の共通 lib `scripts/smoke/lib/smoke-common.sh` に集約し、SSOT 化する。
- 4 本目以降の runner 追加コストを下げ、共通機構の修正を 1 箇所で完結させる（drift 防止）。
- 挙動は一切変えない（NON_VISUAL）。各 runner の既存 local test が非退化で PASS することを完了条件とする。

> **YAGNI 注記**: 本タスクは「3 本の重複が安定し、かつ 4 本目追加時の重複が確実になった時点」で着手する YAGNI 解除タスクである。issue-1081 サイクル内での先行抽出は過剰設計であり、本タスクは別 Issue として切り出す。

---

## 3. 受け入れ基準

| ID | 受け入れ基準 |
|----|-------------|
| AC-1 | `scripts/smoke/lib/smoke-common.sh` を新設し、共通機構（`assert_target` / `assert_status` 系 / `fail_and_exit` / `summary_pass` / redact 経由ログ / `--ci-summary` summary.json 出力 / `run_d1`）を集約する |
| AC-2 | 既存 3 本の runner（`runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh`）が共通 lib を `source` し、各自のコピー重複定義を削除する |
| AC-3 | 各 runner の挙動が非退化であること。既存 local test（`runtime-attendance-provider.test.sh` / `runtime-admin-web.test.sh` / `runtime-tag-bulk.test.sh`）が全 PASS する |
| AC-4 | cleanup trap が二重実行されないこと。共通 lib と各 runner の `trap ... EXIT` 責務分界が明確で、cleanup の二重実行・未実行が発生しない |
| AC-5 | runner 固有の差分（contract jq shape / fixture prefix / endpoint URL）は共通 lib に巻き込まず各 runner に残すこと（境界が MECE であること） |
| AC-6 | 共通 lib 自体の local test（`scripts/smoke/__tests__/smoke-common.test.sh` 相当）を追加し、共通関数の単体挙動を検証する |
| AC-7 | shellcheck / actionlint 相当の静的検証を通過すること（`source` 解決・未定義変数・SC2034 等の指摘がない） |
| AC-8 | `scripts/smoke/redact.sh` の既存責務（redact ロジックの外出し）と整合した責務配置になっていること（redact ロジックを共通 lib に二重実装しない） |

---

## 苦戦箇所【記入必須】

将来この抽出を実施する担当者が踏み抜きやすい落とし穴を、具体粒度で記録する。

### 1. 抽出タイミングの判断（YAGNI 解除基準）

- 抽出の判断基準は **YAGNI 解除**: 「3 本の重複が安定し、かつ 4 本目追加時の重複が確実になった時点」である。
- 早すぎる抽出は危険。各 runner には固有の差分（fixture prefix / contract jq shape / endpoint URL）があり、3 本目までの重複が「たまたま似ている」段階で共通化すると、固有差分を無理に共通シグネチャへ畳み込み、引数・分岐が膨らんで柔軟性を損なう過剰設計になる。
- そのため本タスクは issue-1081 サイクルの AC には含めず、着手トリガ（4 本目追加 or 共通機構の drift 顕在化）が立った時点で起票する。

### 2. bash 共通 lib 化の shell 特有の落とし穴

- **`set -euo pipefail` の継承**: `source` 時に共通 lib 側で `set -euo pipefail` を設定すると呼び出し元の挙動を上書きする。フラグの設定責務は runner 側に置き、lib 側では前提として記述するに留める（lib 単体で `set` しない方針を明確にする）。
- **グローバル変数汚染**: `source` は同一シェルプロセスで実行されるため、共通 lib で宣言した変数名が runner 側の変数と衝突しうる。共通 lib 内の内部変数は `local` 化、外部公開する変数は命名規約（例: `SMOKE_*` prefix）で隔離する。
- **`trap ... EXIT` の二重登録**: bash の `trap` は同一シグナルに対し上書き（最後の登録勝ち）であり加算ではない。共通 lib と runner の双方で `trap ... EXIT` を登録すると、片方が消える（未実行）か、共通 lib が runner の cleanup を内包すると両方走って二重実行になる。
  - 現状の確認: `runtime-tag-bulk.sh` は `trap 'cleanup || true; rm -rf "$TMP_DIR"; write_summary' EXIT`、`runtime-attendance-provider.sh` は `trap 'rm -rf "$TMP_DIR"' EXIT`、`runtime-admin-web.sh` は `trap cleanup EXIT` と **trap の shape が runner ごとに異なる**。共通 lib に trap を持たせると、この差分を吸収できず二重実行/未実行を招く。
  - 対策: cleanup の **登録** は各 runner に残し、共通 lib は「cleanup として呼ばれる純粋関数（tmp 削除・summary 書き出し等の部品）」のみを提供する。trap の組み立て（どの部品をどう繋ぐか）は runner 責務とし、責務分界を明示する。

### 3. 共通化対象と runner 固有の境界線を MECE に引く

- 抽出の核心は、**共通化対象**（`assert_*` / redact 経由ログ / summary 出力 / `run_d1`）と **runner 固有**（contract jq shape / fixture prefix / endpoint URL / seed 内容）の境界を MECE に引くこと。
- `scripts/smoke/redact.sh` は既に redact ロジックを外出し済み。共通 lib はそれを `source`／呼び出す形で整合させ、redact 実装を共通 lib に二重実装しない（AC-8）。
- 共通関数は「runner 固有値を引数で受け取る純粋な部品」とし、固有の jq 抽出・URL 組み立ては runner 側に残すことで、共通 lib をシグネチャ安定（後方互換）に保つ。

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| cleanup trap の二重実行 / 未実行 | tmp ディレクトリ残留・staging D1 への二重 cleanup 副作用 | trap 登録は runner に残し、共通 lib は純粋部品のみ提供（AC-4）。3 runner の trap shape 差分を抽出前に棚卸し |
| `source` 時のグローバル変数汚染 | runner 間で予期せぬ変数上書き・誤動作 | 内部変数 `local` 化、公開変数は `SMOKE_*` prefix で隔離（AC-7） |
| 過剰共通化による柔軟性喪失 | runner 固有差分を無理に畳み込み、後続 runner 追加が逆に困難化 | 共通化対象と固有の境界を MECE に確定（AC-5）。固有値は引数注入 |
| 既存 runner の挙動退化 | 本番 staging smoke の検知力低下（false green） | 各 runner の既存 local test を非退化基準として全 PASS 必須（AC-3） |
| redact ロジックの二重実装 | redact 漏れ（機密値ログ流出） | `scripts/smoke/redact.sh` を SSOT とし共通 lib から参照（AC-8） |

---

## 検証方法

- **各 runner の非退化検証**: 抽出後に既存 local test を実行し、全 PASS を確認する。
  - `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh`
  - `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh`
  - `bash scripts/smoke/__tests__/runtime-admin-web.test.sh`
- **共通 lib 単体検証**: 共通 lib の各関数（`assert_*` / `summary_pass` / `fail_and_exit` / redact 経由ログ / summary.json 出力 / `run_d1` ラッパー）を対象とする local test を新規追加し PASS させる。
  - `bash scripts/smoke/__tests__/smoke-common.test.sh`（新規）
- **静的検証**: shellcheck（`source` 解決・未定義変数・SC2034 等）を共通 lib と 3 runner に対して通過させる。CI で smoke 系を lint している場合は actionlint 相当も通過させる。
- **trap 二重実行の検証**: cleanup が一度だけ実行されることを、cleanup 内にマーカーログを差し込む等で確認する test ケースを共通 lib test に含める。

---

## スコープ

### 含む

- `scripts/smoke/lib/smoke-common.sh` の新設。
- 既存 3 runner（`runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh`）の共通機構を共通 lib へ移行し、コピー重複定義を削除。
- 共通 lib 自体の local test 追加。
- 各 runner の既存 local test が非退化で PASS することの確認。

### 含まない

- runner の機能追加・contract 変更・assertion 追加。
- 新 endpoint の追加、D1 schema 変更、Google Form 仕様変更。
- `commit` / `push` / `PR` 等の git 操作（後続フェーズで起票・実施）。
- 4 本目以降の新規 runner 作成そのもの（着手トリガであって本タスクの成果物ではない）。

---

## 参照

- `scripts/smoke/runtime-tag-bulk.sh` — issue-1081 で追加された bulk tag runner（抽出動機となるコピー重複元）
- `scripts/smoke/runtime-attendance-provider.sh` — 共通機構の雛形（origin）
- `scripts/smoke/runtime-admin-web.sh` — admin-web 系 runner
- `scripts/smoke/redact.sh` — 既に外出し済みの redact ロジック（共通 lib の責務配置の整合先）
- `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` — 非退化検証の基準となる既存 local test
- `scripts/cf.sh` — `run_d1` がラップする `d1 execute` の経路
- 親 workflow: `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（Phase 12 UT-CANDIDATE-3 / Phase 10 MINOR M-1）
