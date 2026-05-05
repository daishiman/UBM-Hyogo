# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

Phase 1〜9 の成果物を集約し、(a) GO / NO-GO 判定基準による最終確認、(b) 依存タスク 03a / 04a / 04b の AC 充足確認、(c) 採用方式（D1 column / static manifest / hybrid）の最終承認、(d) Phase 11（NON_VISUAL evidence 取得）への引き継ぎ事項確定を行う。本 Phase は実装変更を行わず、判定と引き継ぎに特化する。

## 前 Phase からの引き継ぎ

- Phase 7 ac-matrix.md の AC × 検証 Phase 表
- Phase 9 main.md / coverage-report.md の gate 結果と無料枠計測値
- Phase 8 で確定した呼出側変更最小化結果
- Phase 6 F-1〜F-5 mitigation の運用承認状態

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 1〜9 全成果物 | 判定材料 | GO / NO-GO 結論 |
| 並列 | 03a / 04a / 04b 仕様書 | 各タスクの AC 充足状態 | 整合確認結果 |
| 下流 | Phase 11 | NON_VISUAL evidence 取得計画 | 取得項目リスト |
| 下流 | Phase 13 | PR template 入力 | 最終承認フラグ |

## GO / NO-GO 判定基準

### GO 判定（すべて満たすこと）

| # | 判定項目 | 確認元 |
| --- | --- | --- |
| G-1 | AC-1〜10 の 8 列全充填、未トレース 0 件 | Phase 7 ac-matrix.md |
| G-2 | F-1〜F-5 すべてに mitigation / test coverage / 検出経路あり | Phase 6 main.md |
| G-3 | typecheck / lint / unit test 全 pass | Phase 9 main.md |
| G-4 | 変更行 coverage ≥ 90% | Phase 9 coverage-report.md |
| G-5 | AC-2 grep（fallback 削除）が 0 件 | Phase 9 main.md |
| G-6 | secret hygiene grep が 0 件 | Phase 9 main.md |
| G-7 | schema drift CI gate が green | Phase 9 main.md |
| G-8 | 採用方式（D1 column / static manifest / hybrid）が 1 つに確定 | Phase 2 / Phase 3 / Phase 5 |
| G-9 | 03a interface drift 時の代替（generated static manifest baseline）が動作確認済み | Phase 6 / Phase 9 |
| G-10 | 不変条件 #1 / #2 / #3 / #5 がすべて evidence 上で確認済み | Phase 7 ac-matrix.md |

### NO-GO 判定（いずれか 1 つでも該当）

| # | 判定項目 | 対応 |
| --- | --- | --- |
| N-1 | coverage < 90% | Phase 4 にバックポート → Phase 5 / 9 再実行 |
| N-2 | gate fail | Phase 5 / 6 に戻して修正 |
| N-3 | 03a / 04a / 04b の AC 影響欄に未確定行 | 当該タスクと整合再確認 → Phase 7 更新 |
| N-4 | 採用方式が未確定 | Phase 2 method-comparison.md に立ち戻り再選定 |
| N-5 | 不変条件のいずれかが evidence 不在 | Phase 4 / 9 に追加 testcase を起票 |

## 依存タスク AC 充足確認チェックリスト

### 03a (forms schema sync and stablekey alias queue)

- [ ] StableKey alias queue interface（`dryRun` / `apply` / 失敗通知）の戻り値型が `packages/shared` に存在し、本タスク resolver が型輸入のみで利用している
- [ ] 03a 未完成時は generated static manifest baseline で resolver が動作することが Phase 9 unit test で確認済み
- [ ] 03a 完成後の hybrid / D1 column 切替計画が Phase 12 implementation-guide.md に記載予定として登録済み

### 04a (public API contract hardening)

- [ ] `/public/*` の section / field 露出形式（label / kind enum / section_key）と resolver 出力が整合
- [ ] label が stable_key 文字列（例: `q_section1_company_name`）として露出しないことが unit test で保証
- [ ] consent kind の field が public ディレクトリで適切に分離される

### 04b (parallel me and profile API)

- [ ] `/me/*` read-only 境界（不変条件 #8 / #11 系）と矛盾しない resolver 出力
- [ ] admin-managed extension が `/me/*` に漏れない（resolver が source priority で隔離）
- [ ] 03a alias queue 経由の更新が `/me/*` でも整合的に反映される

## 採用方式の最終承認

採用方式（D1 column / static manifest / hybrid）は Phase 2 method-comparison.md と Phase 3 review-record.md で選定済み。Phase 10 ではそれを最終確認する。

| 確認項目 | 内容 |
| --- | --- |
| 採用方式の名称 | （Phase 5 で確定したものを転記） |
| 03a interface drift への耐性 | generated static manifest baseline の動作確認状況 |
| migration 必要性 | 採用方式が D1 column / hybrid なら migration 適用済み（`scripts/cf.sh d1 migrations list` で確認） |
| 無料枠への影響 | Phase 9 計測値（D1 row 数 / migration 時間 / bundle size）が許容内 |
| 切替計画 | 03a 完成後に hybrid / D1 column へ切替える場合の計画書ありなし |

最終承認は本 Phase の judgment ノートに記録（`outputs/phase-10/main.md`）。

## Phase 11 への引き継ぎ事項（NON_VISUAL evidence 取得計画）

NON_VISUAL タスクのため screenshot は取得せず、以下の代替 evidence を Phase 11 で取得する。

| evidence | パス | 取得方法 |
| --- | --- | --- |
| builder unit test 結果 | outputs/phase-11/builder-unit-test-result.txt | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose 2>&1 | tee builder-unit-test-result.txt` |
| schema drift 検知ログ | outputs/phase-11/drift-detection-log.md | `scripts/verify-schema-resolver.mjs` 実行ログを抜粋し、unknown / conflict / consent 補正の各 1 ケースを再現 |
| 3 view 同一導出確認 | outputs/phase-11/three-view-parity-check.md | public / member / admin の repository chain で同一 stable_key 集合を resolve した結果が一致することを示す手動 manifest |
| migration 適用ログ（採用時） | outputs/phase-11/main.md 内追記 | `bash scripts/cf.sh d1 migrations list` 出力を before / after で記録 |
| manual-test-result.md | outputs/phase-11/manual-test-result.md | resolver の手動 invoke ノート |
| non-visual-evidence.md | outputs/phase-11/non-visual-evidence.md | 上記 4 evidence のインデックス + screenshot 不要の理由 |

## 実行タスク

- [ ] G-1〜G-10 の判定項目をチェックリスト化し全 GO 確認
- [ ] N-1〜N-5 のいずれかが該当した場合の差し戻し先 Phase を確定
- [ ] 03a / 04a / 04b 各タスクの AC 充足チェックリストを充填
- [ ] 採用方式の最終承認ノートを記述
- [ ] Phase 11 evidence 取得計画を main.md に明記
- [ ] judgment（GO / NO-GO）を main.md に明記し artifacts.json status を更新

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC 充足確認 |
| 必須 | outputs/phase-09/main.md / coverage-report.md | gate 結果 |
| 必須 | outputs/phase-06/main.md | failure mitigation 確認 |
| 必須 | outputs/phase-02/method-comparison.md | 採用方式選定根拠 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1/#2/#3/#5 |
| 参考 | 03a / 04a / 04b 仕様書 | 依存タスク AC |

## 実行手順

### ステップ 1: GO 判定チェックリスト
- G-1〜G-10 を順に確認し、各項目の確認元 path と OK / NG をテーブルで記録
- 1 件でも NG なら N-* に従って差し戻し

### ステップ 2: 依存タスク AC 充足確認
- 03a / 04a / 04b の最新仕様書を確認し各チェック項目を充填
- 不一致が出た場合は Phase 7 ac-matrix.md の影響列を更新

### ステップ 3: 採用方式の最終承認
- 採用方式名 / 切替計画 / 無料枠影響を main.md に記述
- migration 採用時は `bash scripts/cf.sh d1 migrations list` の出力サマリを引用

### ステップ 4: Phase 11 evidence 取得計画
- 上記 evidence 表を Phase 11 引き継ぎとして main.md に転記
- screenshot 不要理由（implementation / NON_VISUAL）を明記

### ステップ 5: judgment 確定
- GO / NO-GO を 1 行で結論
- NO-GO の場合は差し戻し先 Phase を明記

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | evidence 取得計画 |
| Phase 12 | implementation-guide.md に転記する 03a/04a/04b 契約引渡内容 |
| Phase 13 | PR template の change-summary 入力 |

## 多角的チェック観点

- 不変条件 **#1**: G-1 / G-5 / G-7 / G-10 で複合的に観測
- 不変条件 **#2**: G-7（schema drift CI gate の `consentMisclassified` 検出）で恒常確認
- 不変条件 **#3**: 03a alias queue 経由でも `responseEmail` が system field として扱われることを 04b 充足チェックで確認
- 不変条件 **#5**: 採用方式承認時に migration / resolver の配置が apps/api 内に閉じていることを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | G-1〜G-10 GO チェック | 10 | pending | 全 GO 必須 |
| 2 | 03a AC 充足確認 | 10 | pending | static fallback 動作 |
| 3 | 04a AC 充足確認 | 10 | pending | public view 整合 |
| 4 | 04b AC 充足確認 | 10 | pending | me view 整合 |
| 5 | 採用方式最終承認 | 10 | pending | 1 方式に確定 |
| 6 | Phase 11 evidence 計画 | 10 | pending | 6 evidence |
| 7 | judgment 記録 | 10 | pending | GO / NO-GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO / NO-GO 判定 / 依存タスク AC 充足チェック / 採用方式最終承認 / Phase 11 evidence 取得計画 |
| メタ | artifacts.json | phase 10 status を completed に更新 |

## 完了条件

- [ ] G-1〜G-10 すべて GO
- [ ] 03a / 04a / 04b の AC 充足チェックがすべて充填
- [ ] 採用方式が確定し承認ノートが存在
- [ ] Phase 11 evidence 取得計画が記述済み
- [ ] judgment（GO / NO-GO）が明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（NO-GO ハンドリング / 依存タスク未確定）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (手動 smoke / NON_VISUAL evidence 取得)
- 引き継ぎ: 6 evidence 取得計画、採用方式名、判定 GO / NO-GO
- ブロック条件: judgment が NO-GO の場合は差し戻し先 Phase へ戻り、Phase 11 へは進めない
