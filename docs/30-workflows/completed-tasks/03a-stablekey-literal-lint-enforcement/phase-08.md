# Phase 8: パフォーマンス・運用

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | パフォーマンス・運用 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (統合検証) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ESLint custom rule（または ts-morph 静的検査）の **CI 実行時間影響** と **運用フロー（false positive 対応 / allow-list 追加レビュー / 監視）** を確定し、Phase 11 以降の運用に渡す。

## パフォーマンス目標

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| CI 全体への lint job 増加率 | **+5% 以内**（baseline 比） | `actions/runs` の duration 推移を本タスク導入前後で比較 |
| `apps/api` 全件 lint 実行時間 | **30 秒以内** | `time pnpm --filter @ubm-hyogo/api lint` を 3 回計測し中央値 |
| `apps/web` 全件 lint 実行時間 | **30 秒以内** | 同上 |
| monorepo 全件 lint 実行時間 | **120 秒以内** | `time pnpm lint` を 3 回計測し中央値 |
| rule 単体 unit test 実行時間 | **10 秒以内** | `time pnpm --filter <lint-package> test` |

## 大量ファイル時の挙動

| 観点 | 設計 / 確認方法 |
| --- | --- |
| AST visitor 範囲 | `Literal` / `TemplateLiteral` のみに限定し、Program / 全 Node を走査しない |
| parser 共有 | `@typescript-eslint/parser` の `parserOptions.cacheLifetime` を活用し、ファイル間で type info を再利用 |
| allow-list 解決 | 起動時 1 回だけ glob で resolve し、ファイル毎の I/O を避ける |
| memoize | stableKey 命名規則の regex は module top-level で 1 度コンパイル |
| ピーク時の挙動 | apps/api 全件（想定 200+ ファイル）で 30 秒以内に完了することを Phase 11 で実測 |

## 運用: false positive 発生時の allow-list 申請フロー

```
1. 開発者が違反 report を確認
2. 真の違反 → コード修正で対応（allow-list モジュール経由 import に書き換え）
3. false positive と判断 → allow-list / exception 申請
   3-1. 該当 literal の owner と正本モジュール候補を記録
   3-2. PR 説明欄に根拠（issue link / 設計判断）を記載
   3-3. レビュアーは allow-list 追加レビュー基準の妥当性を確認
4. レビュー承認後 merge
```

inline `eslint-disable` は baseline 0 を維持する。どうしても例外が必要な場合も、コードコメントではなく allow-list / exception glob の変更としてレビューし、Phase 12 の system spec update summary に記録する。

## 運用: allow-list 追加レビュー基準

allow-list（正本モジュール）への新規追加は **設計責任を伴う変更** とみなし、以下の基準を満たすときのみ承認する。

| 基準 | 内容 |
| --- | --- |
| 単一責務 | 当該モジュールが「stableKey 定数の export 専用」であること（補助 util 等を含めない） |
| schema 由来 | stableKey が Google Form schema or D1 schema から導出されており、勝手な命名でないこと |
| owner 明示 | CODEOWNERS で owner が明示されていること |
| 試験対象 | 当該モジュール自体に unit test があり、stableKey の整合性が test される |

allow-list 追加 PR は **Phase 7 の AC マトリクス** を更新し、新規 evidence（新 allow-list モジュールの unit test 結果）を追加する責務を負う。

## 監視: CI lint job の失敗率トレンド

| 監視項目 | しきい値 | 取得方法 |
| --- | --- | --- |
| lint job 失敗率（直近 30 日） | 平常時 < 10%、超過で alert | `gh run list --workflow ci.yml --status failure` の集計 |
| lint job 平均実行時間 | baseline +5% 超で alert | `gh run list --json conclusion,createdAt,updatedAt` から duration 算出 |
| `eslint-disable-next-line no-stablekey-literal` 出現件数 | 0 件固定。1 件以上で fail | `git grep -c 'eslint-disable.*no-stablekey-literal'` |
| 03a 違反コミット数（main） | 0 件維持 | dry-run と同等の条件で main をスキャン |

これらの監視は **本タスクのスコープでは設計のみ**。実装（dashboard / cron / alert）は別タスク（automation-30 系の運用基盤）で扱う。

## 運用ドキュメントの配置

| 配置先 | 内容 |
| --- | --- |
| `outputs/phase-08/main.md` | パフォーマンス目標 + 運用フロー サマリ |
| `outputs/phase-08/suppression-flow.md` | suppression 申請フロー詳細 |
| `outputs/phase-08/allow-list-review.md` | allow-list 追加レビュー基準 |
| `outputs/phase-08/monitoring.md` | CI 監視項目としきい値 |

## 例外ポリシーの最終文書化

Phase 5 で定めた例外パターン（tests / fixtures / migration seed）の **policy ステートメント** を `outputs/phase-08/exception-policy.md` に確定し、03a workflow 側 implementation-guide からも参照される正本にする。

| 例外 | policy |
| --- | --- |
| `**/*.test.ts` / `**/*.spec.ts` | 「テストはリテラルでアサート可能」を明文化 |
| `**/__fixtures__/**` | 「fixture は schema 同期前の history を保持する」を明文化 |
| `apps/api/migrations/**` / `**/seed/**` | 「migration は当時の literal を保存し改変しない」を明文化 |

## 実行タスク

- [ ] `outputs/phase-08/main.md` にパフォーマンス目標と運用フローのサマリ配置
- [ ] `suppression-flow.md` 配置
- [ ] `allow-list-review.md` 配置
- [ ] `monitoring.md` 配置
- [ ] `exception-policy.md` 配置
- [ ] CI 全体 +5% 以内、apps/api 全件 30 秒以内の数値目標明示

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 実装 Step（Step ⑥ CI 組み込み） |
| 必須 | outputs/phase-06/main.md | failure case（F-4 / F-8） |
| 必須 | outputs/phase-07/ac-matrix.md | AC × evidence トレース |

## 完了条件

- [ ] パフォーマンス目標 5 指標明示
- [ ] allow-list 申請フロー 4 step 明示
- [ ] allow-list 追加レビュー基準 4 項目明示
- [ ] 監視 4 項目としきい値明示
- [ ] 例外ポリシー 3 パターン文書化

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: パフォーマンス計測値、suppression 申請フロー、allow-list レビュー基準、監視しきい値

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-08/main.md` | performance / operations サマリ |

## 統合テスト連携

Phase 11 は本 Phase の performance target と suppression baseline 0 を manual smoke log の確認項目に含める。
