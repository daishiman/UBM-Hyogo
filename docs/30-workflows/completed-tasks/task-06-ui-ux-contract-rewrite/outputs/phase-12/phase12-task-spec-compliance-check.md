# phase12-task-spec-compliance-check.md

## サマリ

13 phase 全準拠表。`task-specification-creator` skill の phase-template に対する適合性、artifacts parity、same-wave sync を確認。

## 13 Phase 準拠表

| Phase | template 準拠 | Phase 別追加セクション | 不変条件マッピング |
| --- | :---: | --- | :---: |
| 1（要件定義） | OK | 4 条件 / 真の論点 4 件 / 依存境界 4 区分 / 価値とコスト | OK（#2/#3/#5/#6） |
| 2（設計） | OK | 章立て差分 / module 設計（§2 10 列・§3 8 列）/ link 委譲先（09a..09h） | OK |
| 3（設計レビュー） | OK | alternative 3 案（A/B/C）/ PASS-MINOR-MAJOR / 案 A 採用 | OK |
| 4（テスト戦略） | OK | verify suite（grep gate / markdown lint / structure check / trace check） | OK |
| 5（実装ランブック） | OK | runbook（書き換え 13 ステップ + ロールバック） | OK |
| 6（異常系） | OK | failure cases 10 件（視覚詳細混入 / API 列乖離 / 19 routes 漏れ等） | OK |
| 7（AC マトリクス） | OK | AC-1〜AC-14 全 PASS / evidence link | OK |
| 8（DRY 化） | OK | Before/After（旧 160 行 → 新 396 行）/ DRY 5 観点 | OK |
| 9（品質保証） | OK | a11y 章独立（§5.1〜§5.4）/ OKLch 規則（§6.1〜§6.3） | OK |
| 10（最終レビュー） | OK | GO/NO-GO / 後続 5 系統 task GO 判定 | OK |
| 11（手動 smoke） | OK | NON_VISUAL 縮約 / 代替 evidence 4 種 | OK |
| 12（ドキュメント更新） | OK | 必須 6 ドキュメント | OK |
| 13（PR 作成） | OK（次） | approval gate / diff scope 規律 | （Phase 13 で確認） |

## 集計

- 全 Phase 数: 13
- template 準拠: 13/13
- 不変条件マッピング: 12 phase で OK（Phase 13 は次フェーズで確認）

## phase-template 準拠の核心観点

| 観点 | 状態 |
| --- | :---: |
| 各 Phase に「メタ情報 / 目的 / 実行タスク / 参照資料 / 多角的チェック観点 / サブタスク管理 / 統合テスト連携 / 成果物 / 完了条件 / タスク 100% 実行確認 / 次 Phase」が揃っている | OK |
| 不変条件 #2 / #3 / #5 / #6 が全 Phase の「多角的チェック観点」に伝播している | OK |
| AC が quantitative（exit code / 件数 / grep 0 件）で定義されている | OK |
| outputs/phase-N/ に主成果物 markdown が配置されている | OK |
| artifacts.json で Phase 1-12 completed / Phase 13 pending_user_approval が追跡可能 | OK |
| strict 7 files が正規名で存在する | OK |
| `artifacts.json` と `outputs/artifacts.json` が一致する | OK |
| same-wave skill/index sync が `system-spec-update-summary.md` に列挙されている | OK |

## workflow_state

- 開始時: `spec_created`
- 終了時: `implemented-local`
- UI 実装コードは別 task が引き受ける。primary spec rewrite は本 task の実装成果物として完了済み。

## artifacts parity

`artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

## 最終判定

PASS。矛盾なし / 漏れなし / 整合性あり / 依存関係整合の 4 条件を、review feedback 反映後の状態語彙・AC・trace evidence・diff scope 同期で再確認した。
