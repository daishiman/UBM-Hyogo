# Phase 3: 設計レビュー

[実装区分: 実装仕様書] / NON_VISUAL / Phase 4 への進行可否を判定する

## 3.1 要件レビュー思考法（一次結論：4 条件）

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | ✅ PASS | 共通機構の修正コストを「3 runner に分散適用」から「lib 1 箇所」へ下げる。drift（write_summary キー分岐・fail_and_exit 3 シグネチャ）の SSOT 化で false-green リスク低減。受益者＝smoke runner を保守する開発者・4 本目追加担当（issue-1137 production runner） |
| 実現性 | ✅ PASS | 初回スコープ＝lib 1 ファイル + 3 runner の薄ラッパー移行 + lib test 1 本。1 PR で完了可能（CONST_007）。新依存なし |
| 整合性 | ✅ PASS | MECE 境界が閉じている（共通化対象 / 固有を 2.4 で明示）。状態所有権は runner プロセス、lib は read/write 関数のみ。trap 登録は 100% runner（lib 非保持）で二重実行リスクが構造的にゼロ |
| 運用性 | ✅ PASS | 非退化基準＝既存 3 runner test 全 PASS（AC-3）+ lib test（AC-6）+ shellcheck（AC-7）。CI で smoke test を回す経路があれば自動 gate 化可能 |

→ **一次結論: 4 条件すべて PASS。Phase 4 へ進行可。**

## 3.2 真の論点

- **真の論点**: 「重複を消す」ことではなく「**挙動を 1 ビットも変えずに** SSOT 化する」こと。local test が summary.json の `routes`/`checks` キーや exit code を直接 assert しているため、共通化の過程でこれらを壊さないことが成否を分ける。
- **why now**: drift（write_summary キー分岐）が既に発生し、SSOT 不在の実害が顕在化した（issue YAGNI 解除トリガ充足）。issue-1137 で 4 本目 runner（production tag-bulk）が増える前に基盤を整える価値がある。
- **why this way**: 「全関数を lib に集約」ではなく「entry shape が一致する部分のみ lib 化、shape が異なる PASS/FAIL entry は runner 残置」。過剰共通化（引数膨張・分岐肥大）を避け、lib シグネチャを安定に保つ。

## 3.3 因果ループ（強化／バランス）

- **強化ループ（良循環）**: lib SSOT 化 → 4 本目 runner 追加コスト低下 → runner 増加でも保守容易 → さらに共通化の価値増大。
- **バランスループ（抑制）**: 過剰共通化 → 固有差分を無理に畳み込み → 引数/分岐肥大 → 柔軟性喪失 → 共通化が逆に保守困難化。**対策**: 2.4 MECE 境界で「entry shape が違う部分は runner 残置」を固定し、lib シグネチャを後方互換に保つ。

## 3.4 リスクと対策（issue リスク表を最新コードへ精緻化）

| リスク | 影響 | 対策 | AC |
| ------ | ---- | ---- | -- |
| `write_summary` の配列キー（routes/checks）を取り違え | attendance test の `.routes[]` assert / admin-web test の `.checks[]` assert が FAIL | `smoke_write_summary` に array_key を必須引数化。runner ラッパーで明示（attendance=routes / 他=checks） | AC-9 |
| `source "$RUNNER"` 二段 source で関数未解決 | tag-bulk test の `assert_all_status`/`extract_count` ケースが壊れる | runner 冒頭で lib を source。test→runner→lib の二段解決を Phase 6 で明示検証 | AC-10 |
| cleanup trap の二重実行 / 未実行 | tmp 残留・D1 二重 cleanup 副作用 | lib は trap を持たない。trap 登録は runner（3 shape を 2.5 で棚卸し済み・変更なし） | AC-4 |
| `source` 時のグローバル変数汚染 | runner 間で変数上書き | 公開変数 `SMOKE_` prefix、内部 `local`。`set -euo pipefail` を lib に書かない | AC-7 |
| 過剰共通化による柔軟性喪失 | 4 本目追加が逆に困難化 | entry shape 差は runner 残置（2.4）。lib は安定シグネチャ | AC-5 |
| 既存 runner の挙動退化（false green） | 本番 smoke 検知力低下 | 既存 3 runner test を非退化基準として全 PASS 必須 | AC-3 |
| redact 二重実装 | 機密値ログ流出 | lib は `redact.sh` を `bash` 呼び出しで参照（実装複製しない） | AC-8 |
| attendance の reason 任意 entry を共通形に畳む | attendance test の entry shape 不一致 | attendance の fail/pass entry は runner 残置。lib `smoke_summary_fail_entry` は tag-bulk 形のみ | AC-5/AC-9 |

## 3.5 代替案の検討

| 代替案 | 採否 | 理由 |
| ------ | ---- | ---- |
| A: 全 entry 構築を lib に集約し shape をフラグで分岐 | ❌ 不採用 | flag/分岐が肥大（routes vs checks、reason 任意、summary キー、record_check 単一形）。過剰共通化でバランスループ悪化 |
| B: entry shape が一致する部分のみ lib 化、差分は runner 残置（**採用**） | ✅ 採用 | lib シグネチャ安定・非退化が容易・MECE が閉じる |
| C: 共通化せず drift をドキュメントで注意喚起のみ | ❌ 不採用 | SSOT 不在の実害（3 箇所修正）が継続。issue の目的未達 |
| D: lib に `set -euo pipefail` / trap を持たせフル制御 | ❌ 不採用 | source 副作用で runner のフラグ/trap を上書き。AC-4/AC-7 違反 |

## 3.6 依存関係・責務境界の確認

- **状態所有権**: summary 状態 = runner プロセス所有。lib は関数提供のみ。混在なし。
- **phase 遷移**: 各 runner の実行フロー（assert_target → request → summary）は不変。lib 化は内部関数の置き換えのみで制御フロー非変更。
- **verify fail 後の意思決定**: 既存通り `fail_and_exit` で runner が exit code を決定（lib は entry 追加のみ）。

## 3.7 進行判定

| 判定項目 | 結果 |
| -------- | ---- |
| 4 条件すべて PASS | ✅ |
| MECE 境界が閉じている | ✅ |
| 非退化基準が明確（既存 test 全 PASS） | ✅ |
| ブロッカー | なし |

→ **Phase 4（テスト作成）へ進行する。**

## 3.8 完了条件（Phase 3）

- [x] 4 条件評価を一次結論として提示した。
- [x] 真の論点・因果ループ・代替案を記録した。
- [x] リスク表を最新コード（routes/checks 分岐・二段 source）へ精緻化した。
- [x] Phase 4 への進行を承認した。
</content>
