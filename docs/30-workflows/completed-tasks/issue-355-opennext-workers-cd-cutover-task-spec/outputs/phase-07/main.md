# Phase 7 — AC マトリクス・カバレッジ確認サマリ outputs/main.md

## 目的

Phase 1 で確定した AC-1〜AC-6 と、Phase 4 で確定したテスト T-01〜T-42、Phase 11 で確定する evidence E-1〜E-5（NON_VISUAL）の対応関係をマトリクス化し、各 AC が「主検証 + 補助検証 + evidence」の 3 レイヤーでカバーされていることを確認する。本 Phase はカバレッジ抜け漏れの最終 gate であり、AC ↔ テスト ↔ evidence のいずれかが空になっている AC が存在しないことを保証する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 6（テスト拡充 / 異常系） |
| 次 Phase | 8（CI/CD 品質ゲート） |
| 状態 | spec_created |
| taskType | implementation |

## カバレッジ確認サマリ

| AC | 主検証テスト | 補助テスト | 主 evidence | カバレッジ判定 |
| --- | --- | --- | --- | --- |
| AC-1（OpenNext build 成立） | T-01 / T-02 / T-03 | T-05 / T-25 | E-1 / E-2 | OK（build 結果＋ artefact ＋ asset 配信を多層検証） |
| AC-2（web-cd.yml 改修） | T-10 / T-11 / T-12 | T-15 | E-1 | OK（contract grep ＋ 実 CD 起動を網羅） |
| AC-3（smoke S-01〜S-10 全 PASS） | T-20〜T-30 | — | E-3 / E-4 | OK（10 件直接検証） |
| AC-4（staging URL 稼働 / Web→API 連携） | T-13 / T-14 | T-15 | E-3 | OK（HTTP ＋ binding 経路 ＋ tail で 3 重） |
| AC-5（wrangler.toml 整合） | T-04 | — | E-2 | OK（contract grep で 1 行検査） |
| AC-6（cutover runbook 6 セクション） | T-42 | T-40 / T-41 | E-5 | OK（contract grep ＋ rollback drill ＋ Pages resume 確認） |

> 全 AC で「主検証 ≥ 1 件 / evidence ≥ 1 件」を満たし、空欄ゼロ。詳細は `outputs/phase-07/ac-matrix.md` の対応マトリクスを参照。

## 多角的カバレッジ評価

### 1. test 層の多層性

- L1（build smoke）: T-01〜T-05 が AC-1 / AC-5 をローカル早期検出
- L2（統合 deploy）: T-10〜T-15 が AC-2 / AC-4 を CI / staging で検出
- L3（公開 smoke）: T-20〜T-30 が AC-3 / AC-4 を実 URL で検出
- L4（rollback drill）: T-40〜T-42 が AC-6 / RISK-4 を実証

### 2. NO-GO ↔ AC のフィードバック

| NG | 触発時の保留 AC |
| --- | --- |
| NG-1（smoke FAIL） | AC-3 |
| NG-2（OpenNext build artefact 欠損） | AC-1 |
| NG-3（service binding 解決失敗） | AC-4 |
| NG-4（5xx burst） | AC-3 / AC-4 |
| NG-5（rollback drill 失敗） | AC-6 |
| NG-6（contract test 違反） | AC-2 / AC-5 / AC-6 |

NG が触発された場合、対応する AC は production cutover を保留する gate として機能する。

### 3. evidence カバレッジ（NON_VISUAL）

| evidence | 内容 | カバー AC |
| --- | --- | --- |
| E-1 | web-cd.yml の deploy log（CD 成功ログ / token mask 済） | AC-1 / AC-2 |
| E-2 | wrangler deploy output（VERSION_ID 含む / token mask 済） | AC-1 / AC-2 / AC-5 |
| E-3 | staging smoke results（T-20〜T-30 PASS 表 / HTTP status） | AC-3 / AC-4 |
| E-4 | route mapping snapshot（Workers / Pages 紐付け状態） | AC-3 / AC-6（traffic split 不在の証跡） |
| E-5 | rollback readiness（drill ログ / Pages resume ボタン活性確認） | AC-6 / RISK-4 |

screenshot は取得しない（NON_VISUAL）。

### 4. invariant への影響

- 不変条件 #5（D1 直アクセスは apps/api に閉じる）: T-14 が service binding 経由のみで Web→API 連携を実証。wrangler.toml 上に D1 binding を追加しないことを T-04 / E-2 で間接 gate。

## カバレッジ完全性 gate

- [x] AC-1〜AC-6 すべてに主検証テストが 1 件以上
- [x] AC-1〜AC-6 すべてに evidence が 1 件以上
- [x] NG-1〜NG-6 すべてが少なくとも 1 つの AC に紐付く
- [x] L1〜L4 のテスト層が AC-1〜AC-6 を漏れなく被覆
- [x] screenshot 不要の判断（NON_VISUAL）が evidence 設計に反映

## 残課題 / フォローアップ

- production cutover 後の AC-3 / AC-4 を production custom domain で再評価（runbook S3 操作 5）。本タスク close-out 時点では staging evidence で gate defined / pending follow-up execution とし、production 再評価は実装 follow-up issue で実行する。
- T-41（Pages resume ボタン活性）は Dashboard 操作確認のため evidence は runbook S6 への参照記載のみとする。

## 成果物

- `outputs/phase-07/main.md`（本ファイル）
- `outputs/phase-07/ac-matrix.md`（AC ↔ テスト ↔ evidence 対応マトリクス）

## 次の Phase

Phase 8: CI/CD 品質ゲート（contract test の CI 投入 / production manual approval / required status checks）。
