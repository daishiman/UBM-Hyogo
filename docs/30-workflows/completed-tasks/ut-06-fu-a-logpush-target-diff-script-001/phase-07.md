# Phase 7: テストカバレッジ確認（AC matrix / coverage threshold / golden 一致）

> **本タスクは implementation である**。Phase 7 は Phase 5 の実装と Phase 6 の異常系 TC を縦串で結ぶ AC マトリクスを完成させ、coverage threshold（line / branch ではなく shell script 用の **statement / case branch / redaction-pattern coverage**）と redaction golden 一致を品質ゲートとして固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target diff script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テストカバレッジ確認 |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系 TC) |
| 次 Phase | 8 (リファクタリング) |
| 状態 | spec_created |
| タスク分類 | implementation（coverage / traceability） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

Phase 1 で確定した **AC-1〜AC-5** を唯一の AC registry とし、Phase 4 検証戦略（TC-01〜TC-06）と Phase 6 異常系（TC-07〜TC-12）が AC を **1:1 対応** で網羅していることを matrix で確認する。shell script のため line/branch coverage の自動計測は弱いが、代替指標として **redaction pattern coverage / case branch coverage / exit code coverage** の 3 軸を定義し、Phase 9 で実測値を取得する。redaction の golden 一致は本 Phase で固定し、Phase 9 の quality gate で機械検証する。

## 真の論点

- AC-1〜AC-5 を 5 行 × 4 列（AC 内容 / 対応 TC / coverage 指標 / golden ファイル）の matrix で完結させる。
- shell script の coverage は標準ツール不在のため、redaction pattern（R-01〜R-06）と exit code（0 / 1 / 2 / 3）と script 内の case 分岐の 3 軸を **設計 coverage** として代替する。
- golden 一致は redaction 出力の **byte-level 安定性** を保証する唯一の手段。golden ファイル内に実値が含まれないことを Phase 9 で再監査する。

## 依存境界

| 依存先 | 種別 | 用途 |
| --- | --- | --- |
| Phase 1 AC-1〜AC-5 | 正本 AC | matrix 縦軸 |
| Phase 4 TC-01〜TC-06 | 正常系 | matrix 横軸 |
| Phase 6 TC-07〜TC-12 | 異常系 | matrix 横軸 |
| Phase 5 redaction module / CLI | 実装 | coverage 計測対象 |

## AC × TC × coverage マトリクス（骨格）

| AC# | AC 内容（要約） | 関連 TC（Phase 4 + Phase 6） | coverage 指標 | golden ファイル |
| --- | --- | --- | --- | --- |
| AC-1 | observability target を新 / 旧 Worker 双方について読み取り、diff として出力できる | TC-01 / TC-02 / TC-10 | exit code 0 と 1 が両方カバーされる / case branch 「両一致」「片側差分」 | `tests/golden/diff-match.md` / `tests/golden/diff-mismatch.md` |
| AC-2 | Logpush job / Analytics binding / Tail 接続 / Workers Logs 設定の 4 種を全て扱う | TC-03 / TC-04 / TC-05 | 4 サブシステム全てで read 呼び出しが発生 | `tests/golden/all-targets.md` |
| AC-3 | secret / token / sink URL query / dataset credential が出力に残らない | TC-07 / TC-08 | redaction pattern R-01〜R-06 が全て発火 | `tests/golden/redaction-applied.md` |
| AC-4 | API 失敗 / plan 制限を exit 2 で示し human-readable な error を返す | TC-09 / TC-11 | exit code 2 がカバー / stderr message が redaction 済み | `tests/golden/api-error.txt` |
| AC-5 | 引数欠落 / 不正値で exit 3 で usage を返す | TC-12 | exit code 3 / usage message | `tests/golden/usage.txt` |

> 1:1 対応の検証: AC-1〜AC-5 の各行に **少なくとも 1 つの正常系 TC と少なくとも 1 つの異常系 TC** が紐付くこと（AC-5 のみ異常系で完結）。

## coverage threshold（代替指標）

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| redaction pattern coverage | 100%（R-01〜R-06 全 6 パターン） | `tests/unit/redaction.test.sh` の実行ログで各 pattern が 1 回以上発火することを assert |
| exit code coverage | 100%（0 / 1 / 2 / 3 の 4 値全て） | TC 実行で全 exit code が観測されることを test runner で集計 |
| case branch coverage | 100%（CLI 引数解析の case 文 / cf.sh 失敗分岐 / format 切替） | script 内 `case` 分岐ごとに少なくとも 1 TC が触れる |
| golden 一致 | 100% | 5 golden ファイルと実出力の `diff -u` がゼロ |
| no-secret-leak audit | 0 件 | golden / fixture / outputs 内に token-like パターンがゼロ（Phase 9 で `rg` 実行） |

## 計測対象 allowlist（変更ファイル限定）

```
scripts/observability-target-diff.sh
scripts/lib/redaction.sh
tests/unit/redaction.test.sh
tests/integration/observability-target-diff.test.sh
tests/fixtures/observability/**
tests/golden/**
tests/helpers/cf-mock.sh
```

## 禁止パターン（広域指定）

```
apps/web/**       # コード変更は本タスク対象外
apps/api/**       # 本タスクは scripts/ のみ
.claude/**        # skill 資源は本タスクで更新しない
docs/**           # 本タスク仕様書ディレクトリ以外の docs は触らない
```

## golden 一致仕様

- golden ファイルは **改行コード LF / 末尾改行あり / UTF-8 / BOM なし**。
- 動的値（タイムスタンプ / 実行時の id 等）は redaction 後に固定 placeholder（例: `<TIMESTAMP>`）に置換してから比較する。
- golden 内には合成 redaction placeholder（`***REDACTED_TOKEN***` 等）のみを含み、実値は一切書かない。
- 失敗時は `diff -u expected actual` を test runner が出力する（ただし actual 側に実値が混入していた場合は redaction を通したうえで diff を取る安全層を入れる）。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-5 全てに正常 + 異常系 TC が紐付き、運用検出網羅 |
| 実現性 | PASS | shell script で実行可能、`scripts/cf.sh` allowlist で実機接続も再現可 |
| 整合性 | PASS | Phase 1 AC / Phase 4 TC / Phase 6 異常系 TC / Phase 5 実装 が matrix で 1:1 対応 |
| 運用性 | PASS | 失敗時 exit code と stderr message が運用者にとって判別可能 |

## カバレッジ未達時の差し戻し

| 未達状況 | 差し戻し先 |
| --- | --- |
| AC のいずれかが TC 列で空 | Phase 4 / Phase 6（TC を追加） |
| redaction pattern coverage が 100% 未満 | Phase 6（unit test 観点を追加） |
| exit code coverage が 100% 未満 | Phase 5（CLI 設計）または Phase 6（TC 追加） |
| golden 一致が失敗 | Phase 5（出力仕様の安定化）または Phase 8（出力整形） |
| no-secret-leak audit で検出 | Phase 5（redaction module 修正）/ Phase 6（fixture 修正） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | redaction / log / CLI 解析の重複を SRP で再構成、行数バジェット維持 |
| Phase 9 | `pnpm lint` / `pnpm typecheck` / `shellcheck` / golden test / secret-leak audit の実測値取得 |
| Phase 10 | go-no-go 判定の根拠として AC matrix と coverage threshold 実測値を提示 |

## 多角的チェック観点

- 価値性: AC-1〜AC-5 の matrix で空セル無しか。
- 実現性: 代替指標 3 軸（redaction / exit / case branch）が shell の制約下で計測可能か。
- 整合性: TC-01〜TC-12 が matrix で重複なく分配されているか。
- 運用性: golden 一致が CI で再現可能か。
- 認可境界: 計測のために production に接続する経路を作っていないか（mock 経由のみ）。
- セキュリティ: golden / fixture が実値を含まないことが secret-leak audit で再確認可能か。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC × TC × coverage matrix 5 行 | spec_created |
| 2 | coverage threshold 3 軸 + golden + secret-leak | spec_created |
| 3 | allowlist / 広域禁止パターン | spec_created |
| 4 | golden 一致仕様（改行 / placeholder / 動的値） | spec_created |
| 5 | 4 条件評価 | spec_created |
| 6 | 差し戻し条件 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-07/main.md` | カバレッジ確認サマリ |
| ドキュメント | `outputs/phase-07/ac-matrix.md` | AC × TC × coverage × golden の 5 行 matrix |
| ドキュメント | `outputs/phase-07/coverage-snapshot.md` | 代替指標 3 軸の計測仕様 + 実測値転記用骨格（Phase 9 で埋める） |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC-1〜AC-5 の 5 行が matrix で全て埋まる
- [ ] 各 AC に正常系 + 異常系 TC が 1 つ以上紐付く（AC-5 は異常系のみで可）
- [ ] coverage threshold 3 軸が定義され目標値 100%
- [ ] golden 5 ファイルのパスと内容仕様が確定
- [ ] allowlist が広域指定でない
- [ ] secret-leak audit ルールが Phase 9 で機械実行可能な形で記述
- [ ] no-secret-leak audit が 0 件目標で記述

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 3 文書が `outputs/phase-07/` に配置予定
- AC-1〜AC-5 全行に TC が紐付く
- golden / fixture に実値が含まれない原則が再宣言

## 次 Phase への引き渡し

- 次 Phase: 8 (リファクタリング)
- 引き継ぎ事項:
  - matrix → Phase 10 go-no-go の根拠
  - coverage threshold 3 軸 → Phase 9 で実測値取得
  - golden 5 ファイル → Phase 9 で diff 検証
- ブロック条件:
  - matrix 空セル残存
  - allowlist が広域指定に変質
  - golden に実値混入経路が残る
