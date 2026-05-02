# Phase 8: リファクタリング（共通化 / SRP / lint pass）

> **本タスクは implementation である**。Phase 8 は Phase 5〜7 で確定した実装 / TC / matrix に対し、**共通化（log / redaction / cf.sh 呼び出しの 3 関数の SRP 化）/ shellcheck pass / 命名統一 / 重複排除 / 行数バジェット** を行う。挙動を変えない（golden 一致を維持）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target diff script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (テストカバレッジ確認) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | implementation（refactoring） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

Phase 5〜7 を通して肥大化した script 本体・redaction module・テストヘルパーに対し、**SRP 化 / 重複排除 / 命名統一 / shellcheck pass / 行数バジェット** を施す。リファクタは挙動を変えないため Phase 7 の golden 5 ファイルとの **diff ゼロ** を継続条件とする。redaction module の bypass 経路（直 `printf` / 直 file write）が増えていないことも本 Phase で再点検する。

## 真の論点

- script 本体に CLI parse / API 呼び出し / diff 計算 / redaction / 出力整形が混在しないこと（5 責務の分離）。
- redaction module は I/O を持たず純粋関数（stdin → stdout）として再利用可能であること。
- `cf.sh` 呼び出しは wrapper 関数 1 箇所に集約し、allowlist 違反を grep 1 行で検出可能にする。
- log 関数は redaction を **必ず最終段で** 通す責務を担うこと。

## 依存境界

| 依存先 | 種別 | 用途 |
| --- | --- | --- |
| Phase 5 実装 | 既存 | リファクタ対象 |
| Phase 7 golden | 不変条件 | リファクタ後も diff ゼロ |
| `shellcheck` | 静的解析 | lint pass |
| `shfmt` | フォーマッタ | 命名と整形 |

## Before / After

### 関数分離（SRP）

| 関数 | 責務 | 配置 |
| --- | --- | --- |
| `parse_args` | CLI 引数解析 + usage 出力 | `scripts/observability-target-diff.sh` |
| `cf_call` | `bash scripts/cf.sh <subcmd>` の唯一の呼び出し点（allowlist 強制） | 同上（または `scripts/lib/cf-call.sh` に分離） |
| `fetch_targets` | logpush / tail / analytics / workers-logs を順に呼び target snapshot を返す | 同上 |
| `compute_diff` | snapshot を比較し legacy-only / current-only / common を返す（純粋関数） | 同上（または `scripts/lib/diff.sh`） |
| `format_output` | md / json で整形（純粋関数 / I/O なし） | 同上 |
| `redact_stream` | stdin → stdout で R-01〜R-06 を適用（純粋関数） | `scripts/lib/redaction.sh` |
| `log_info` / `log_warn` / `log_error` | stderr 出力（最終段で `redact_stream` 通過） | 同上 or `scripts/lib/log.sh` |

### 命名統一

| 旧 | 新 | 理由 |
| --- | --- | --- |
| `LEGACY_NAME` / `legacy_worker` / `old_worker` の混在 | `LEGACY_WORKER` 一本化 | 揺れ防止 |
| `CUR_NAME` / `current_worker` / `new_worker` の混在 | `CURRENT_WORKER` 一本化 | 同上 |
| `redact_token` / `mask_secret` の混在 | `redact_stream` 一本化 | redaction module の窓口を 1 つに |
| `cf_run` / `wrangler_call` の混在 | `cf_call` 一本化 | allowlist の grep 検出を容易にする |

### 重複排除（DRY）

| 重複箇所 | 統合先 |
| --- | --- |
| 各サブシステム（logpush / tail / analytics）で同じ「呼んで JSON parse して空配列正規化」処理 | `fetch_targets` 内の helper `_normalize_target_list` |
| stderr に echo + redaction の流れが複数箇所で書かれる | `log_warn` 関数 1 箇所に集約 |
| usage メッセージ（TC-12 / `--help`） | usage 文字列を変数 `USAGE` に外出し |

### 行数バジェット

| ファイル | 上限 | 理由 |
| --- | --- | --- |
| `scripts/observability-target-diff.sh` | 300 行 | CLI / orchestrate のみに留め複雑さを `lib/*` に逃がす |
| `scripts/lib/redaction.sh` | 120 行 | 6 パターンと dispatch のみ |
| `scripts/lib/cf-call.sh`（分離した場合） | 80 行 | allowlist + 呼び出しのみ |
| `tests/unit/redaction.test.sh` | 200 行 | 6 観点 + 偽陽性回避 |
| `tests/integration/observability-target-diff.test.sh` | 350 行 | TC-01〜TC-12 |

## shellcheck / shfmt

| ツール | 設定 | 期待 |
| --- | --- | --- |
| shellcheck | 既定 + `-x`（外部 source の追跡） | `error` / `warning` レベル 0 件 |
| shfmt | `-i 2 -ci -bn` | フォーマット差分 0 件 |

## redaction bypass 監査（リファクタ後）

```bash
# stdout / stderr に redaction を通さず直接出力していないか
grep -nE '^[[:space:]]*(printf|echo)[[:space:]]' scripts/observability-target-diff.sh scripts/lib/*.sh \
  | grep -v 'log_info\|log_warn\|log_error\|redact_stream'
# 期待: 0 件（log_* / redact_stream 経由のみ）

# cf.sh 以外の wrangler 直叩きが無いこと
grep -nE 'wrangler ' scripts/observability-target-diff.sh scripts/lib/*.sh
# 期待: 0 件
```

## golden 不変性

| 項目 | 検証 |
| --- | --- |
| Phase 7 golden 5 ファイル | 全 TC 再走で diff ゼロ |
| 出力 byte 一致 | `cmp -s actual golden` で差分 0 |
| 動的値 placeholder | リファクタ後も同一 placeholder で安定 |

## ナビゲーション / artifacts.json

| 対象 | 修正 |
| --- | --- |
| `artifacts.json` | Phase 8 状態 / file 一覧の path を再確認 |
| `index.md` | リファクタ後のファイル一覧と責務を更新 |
| 親タスク UT-06-FU-A の README | 本 script を「使う側」リンクとして追記（必要に応じて） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | golden 一致を維持していることを再走で確認 |
| Phase 9 | shellcheck / shfmt / `pnpm lint` / `pnpm typecheck` を quality gate で再実行 |

## 多角的チェック観点

- 価値性: SRP 化により Phase 9 以降の修正コストが下がるか。
- 実現性: 5 責務分離が shell の制約下で過剰設計になっていないか。
- 整合性: golden 5 ファイル diff ゼロが維持されるか。
- 運用性: 失敗時の log message が log_* 関数経由で安全か。
- 認可境界: cf_call allowlist が破られないか（grep で機械検出）。
- セキュリティ: redaction bypass 経路が増えていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 関数分離（SRP）7 関数 | spec_created |
| 2 | 命名統一表 | spec_created |
| 3 | 重複排除（DRY） | spec_created |
| 4 | 行数バジェット | spec_created |
| 5 | shellcheck / shfmt 適用 | spec_created |
| 6 | redaction bypass 監査 | spec_created |
| 7 | golden 不変性確認 | spec_created |
| 8 | navigation / artifacts.json 更新 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-08/main.md` | リファクタ Before/After + 監査結果 |
| script | `scripts/observability-target-diff.sh`（更新） | SRP 化済み |
| module | `scripts/lib/redaction.sh`（更新） | 純粋関数化 |
| メタ | artifacts.json | Phase 8 状態更新 |

## 完了条件

- [ ] 7 関数（parse_args / cf_call / fetch_targets / compute_diff / format_output / redact_stream / log_*）が SRP で分離
- [ ] 命名統一表どおりに変数名・関数名が揃う
- [ ] 行数バジェットを満たす
- [ ] shellcheck / shfmt が pass
- [ ] redaction bypass 経路 0 件（grep で確認）
- [ ] `wrangler` 直叩き 0 件（grep で確認）
- [ ] Phase 7 golden 5 ファイル diff ゼロ
- [ ] artifacts.json / index.md の navigation drift 0

## タスク100%実行確認【必須】

- 実行タスク 8 件が `spec_created`
- リファクタは挙動を変えず golden 不変
- bypass 経路と wrangler 直叩きの監査が grep で機械検証可能

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SRP 化済み 7 関数 → Phase 9 で typecheck / lint / shellcheck の対象
  - golden 不変 → Phase 9 で再走 diff ゼロ確認
  - allowlist + bypass 監査の grep → Phase 9 quality gate に組み込み
- ブロック条件:
  - golden に diff が出る
  - bypass 経路や wrangler 直叩きが残る
  - 行数バジェット超過
