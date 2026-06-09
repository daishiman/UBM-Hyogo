# Phase 10: 最終レビュー

[実装区分: 実装仕様書] / NON_VISUAL / 実装着手可否を判定する

## 10.1 AC 充足チェックリスト（AC-1〜AC-10）

| AC | 受け入れ基準 | 検証方法 | 想定結果 |
| -- | ------------ | -------- | -------- |
| AC-1 | `scripts/smoke/lib/smoke-common.sh` を新設し共通機構を集約 | `test -f scripts/smoke/lib/smoke-common.sh` + `grep -c 'smoke_' <lib>`（9 関数定義） | ファイル存在・9 関数定義あり |
| AC-2 | 3 runner が lib を `source` し重複定義を削除 | `grep -rln 'lib/smoke-common.sh' scripts/smoke/runtime-*.sh`（3 件）+ 自前重複が消えている diff | 3 runner に source 行・重複削除済み |
| AC-3 | 各 runner の挙動が非退化（既存 local test 全 PASS） | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` 他 3 本実行 | 3 本とも全 PASS（attendance / admin-web / tag-bulk） |
| AC-4 | cleanup trap が二重実行されない（lib は trap 非登録） | `grep -c 'trap' scripts/smoke/lib/smoke-common.sh`（0）+ Phase 6 cleanup マーカーテスト | lib に trap 行 0・cleanup 1 回のみ |
| AC-5 | runner 固有差分を lib に巻き込まない（MECE） | lib に `assert_target` / `assert_all_status` / `record_check` 等が**無い**ことを grep + Phase 2.4 表と整合 | lib に固有関数なし |
| AC-6 | lib の local test（`smoke-common.test.sh`）を追加し PASS | `bash scripts/smoke/__tests__/smoke-common.test.sh` 実行 | 新 test 全 PASS（Phase 7 対応表の 13 ケース） |
| AC-7 | shellcheck 相当の静的検証通過（source 解決 / 未定義 / SC2034） | `shellcheck` を 4 ファイルへ実行 | 0 件 clean。`# shellcheck source=` 付与・`SMOKE_` prefix・`local` 化済み |
| AC-8 | redact ロジックを lib に二重実装しない | `grep -n 'redact.sh' scripts/smoke/lib/smoke-common.sh`（`bash "$SMOKE_REDACT"` 参照のみ） | lib は redact.sh を呼ぶのみ・ロジック複製なし |
| AC-9 | `write_summary` 配列キー分岐を array_key 引数化で非退化再現 | attendance test の `.routes[0].reason` assert（L208/263/288/343）+ admin-web test の `.checks[]` assert（L84）が両 PASS | routes / checks 両 shape が非退化 |
| AC-10 | tag-bulk test の `source "$RUNNER"` → `assert_all_status`/`extract_count` 直接呼びが移行後も成立 | tag-bulk test の `assert-*`（L62-67）/ `extract-count`（L69）ケースが PASS | 二段 source（test→runner→lib）で全関数解決・PASS |

→ **全 AC が検証可能な形で定義され、想定結果はすべて PASS**。

## 10.2 blocker 判定

| 観点 | 判定 |
| ---- | ---- |
| MECE 境界が閉じているか（共通化対象 / 固有） | ✅ Phase 2.4 で確定。境界の漏れ・重複なし |
| 非退化基準が明確か | ✅ 既存 3 runner test 全 PASS（AC-3）+ lib test（AC-6）+ shellcheck（AC-7）+ grep 削除検証（Phase 9.5） |
| array_key 分岐（routes/checks）の取り違えリスク | ✅ array_key を必須引数化し runner ラッパーで明示（AC-9）。test が両 shape を直接 assert |
| 二段 source（test→runner→lib）の未解決リスク | ✅ runner 冒頭で lib source・`main` ガード維持で対処（AC-10） |
| trap 二重実行リスク | ✅ lib は trap 非保持・登録は 100% runner（AC-4） |
| redact 二重実装 / 機密流出 | ✅ lib は redact.sh 参照のみ（AC-8） |
| 新依存・新 endpoint・D1 schema 変更 | ✅ なし（スコープ外を厳守） |

→ **blocker なし**（想定どおり）。Phase 3 の 4 条件（価値性 / 実現性 / 整合性 / 運用性）も全 PASS を維持。

## 10.3 MINOR 指摘候補（Phase 12 未タスク検出ソース）

> 以下はいずれも本タスクの AC を満たすうえで**不要**であり、**YAGNI として未タスク化しない**方針。Phase 12 の未タスク検出で改めて起票要否を判定する材料として列挙する。

| # | MINOR 指摘 | 分類 | 起票方針 |
| - | ---------- | ---- | -------- |
| M-1 | 将来 attendance / admin-web の entry shape（reason 任意 / summary キー / record_check 単一形）を tag-bulk 形へ統一できれば、`fail_and_exit` / PASS entry も lib 化でき更なる共通化余地がある | YAGNI（過剰共通化回避の裏返し） | **非起票**。entry shape の統一は contract 変更（NON_VISUAL 逸脱）を伴うため、本タスクのスコープ外。必要が顕在化した時点で別 issue |
| M-2 | `assert_target` / `assert_staging_guard` の 3 実装に共通する「host 照合 → guard 判定」骨格を、`smoke_assert_host_allow` 以上に抽象化する余地 | YAGNI | **非起票**。3 実装の差（marker curl / allowlist のみ / D1名+production拒否）が大きく、抽象化は引数膨張を招く（AC-5 と矛盾） |
| M-3 | lib の公開変数 `SMOKE_REDACT` を `smoke_summary_init` 同様に `smoke_init` で一括設定する初期化関数の追加 | 改善余地 | **非起票**。現状は runner が `SMOKE_REDACT=...` を 1 行設定するのみで十分。関数化はオーバーエンジニアリング |
| M-4 | 4 本目 runner（issue-1137 production tag-bulk）追加時、本 lib の `smoke_run_d1` / `smoke_write_summary(checks)` がそのまま流用できるか | 将来確認事項 | **非起票**（観測項目）。issue-1137 実装時に lib 流用性を確認する旨を Phase 12 carry-over に記録 |

## 10.4 受け入れ判定（実装着手可否）

| 判定項目 | 結果 |
| -------- | ---- |
| AC-1〜AC-10 がすべて検証可能 | ✅ |
| blocker | なし |
| MINOR はすべて YAGNI / 観測項目（起票不要） | ✅ |
| 非退化基準（既存 test 全 PASS）が確立 | ✅ |
| スコープ逸脱（新 endpoint / schema / workflow 変更）なし | ✅ |

→ **受け入れ判定: 実装着手可（GO）**。Phase 5（実装）の手順に従い lib 作成 → 3 runner 薄ラッパー移行 → lib test 追加 → 既存 3 runner test 非退化確認を 1 cycle で完了できる。実装・commit・PR は user-gated。

## 10.5 完了条件（Phase 10）

- [x] AC-1〜AC-10 の充足チェックリスト（AC → 検証方法 → 想定結果）を作成した。
- [x] blocker 判定（なし）を記録した。
- [x] MINOR 指摘候補（M-1〜M-4）を列挙し、いずれも YAGNI / 観測項目として非起票方針を明記した（Phase 12 未タスク検出ソース）。
- [x] 受け入れ判定（実装着手可・GO）を提示した。
