# Phase 8 確定事項サマリ — リファクタリング

Phase 5/6 の挙動を変えずに構造を改善する方針を確定。外部挙動（mint 出力フォーマット・smoke PASS/FAIL・coverage MISSING 判定・required context 名）はすべて不変。

## 原則（過度な抽象化の回避）

- YAGNI 優先。3 lane・1 サイクル完結のため推測的共通化はしない。
- 純粋関数と副作用の分離は行うが DI 層は増やさない。
- shell 関数抽出は可読性が落ちた箇所のみ。runner 全体は再構造化しない。
- ci.yml は YAML anchor / composite 化せず明示再掲に留める。

## リファクタリング記録（対象 / Before / After / 理由 = RT-03 準拠）

| lane | 対象 | 採否 | 要点 |
|---|---|---|---|
| A | mint helper 純粋関数/CLI 分離 | 採用 | `mintStagingBearers(env)` を純粋関数化、`process.env`/出力追記は `import.meta` guard 配下に隔離。parity test 容易化 |
| A | mask の責務境界 | 採用 | helper は出力追記のみ、`::add-mask::` は workflow 側 1 step に一元化（R-1） |
| A | 戻り値型 `MintedBearers` | 採用 | key 名 drift を typecheck で検出 |
| A | reason 判定の関数抽出 | **採用（範囲限定）** | `classify_failure_reason "$status" "$body"` を 1 関数に抽出。分岐 1→3 で可読性が落ちるため正当化。HTTP 実行・summary 書込は現状維持 |
| A | redact 重複 | 採用 | redact 済み body を引数で 1 度だけ渡す。生 body を関数内に持ち込まない |
| B/C | ci.yml step 順序 | 採用 | Fail closed を `--no-run` の前に確定配置 + 意図コメント付与 |
| B/C | checkout token 明示再掲 | 採用 | anchor 化せず両 checkout に `token`/`persist-credentials` を明示。diff で認証が一目で分かる |
| B/C | top-level permissions | 採用 | `contents: read` 追加、job 個別 permissions 据え置き（R-6） |
| B | coverage-guard メッセージ | 採用 | 文言強化のみ。判定ロジック不変（R-4）。重複時のみ変数集約 |

## 採用しないリファクタリング（見送り理由）

- mint helper を `packages/shared` へ昇格 → smoke 専用 CI スクリプト。再利用の事実が出てから。
- `signSessionJwt` の admin/me 専用ラッパー → 2 回呼ぶだけで十分、間接層が無価値。
- checkout/setup の composite 集約 → `setup-project` は checkout 非実施の既存契約。波及がスコープ外。
- coverage-guard の `--no-run` と group モード統合 → 責務が異なる、分岐増加のみ。
- runner 全体の bats 全面移植 → reason 分岐の unit 化で十分。

## 不変条件確認（Phase 9 へ引き継ぎ）

1. mint 出力 key 名（`admin_bearer`/`me_bearer`/`member_id`）不変。
2. `classify_failure_reason` 抽出後も既存 reason 回帰なし。
3. required status context 名不変。
4. MISSING 判定 exit code・対象 package 集合不変（メッセージのみ差分）。
5. JWT・鍵・secret 実値の console/log 出力なし。

## 結論

リファクタリング方針確定。挙動不変を維持しテスト容易性・診断性・回帰耐性を向上。Phase 9（QA）へ進む。
