# Phase 11: 手動 smoke / 実測 evidence — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

coverage 実測値を取得・保存し、user approval gate を発火するに足る evidence を提示する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/

## CONST_005 必須項目

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `outputs/phase-11/evidence/coverage-report.txt`, `outputs/phase-11/evidence/coverage-summary.json`（コピー）, `outputs/phase-11/main.md` |
| シグネチャ | N/A（evidence 取得のみ） |
| 入出力 | 入力: vitest 実行結果。出力: テキスト/JSON evidence |
| テスト | Phase 9 で実行した coverage run の最終 artifact を流用 |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage \| tee outputs/phase-11/evidence/coverage-report.txt` |
| DoD | evidence ファイル 2 種が存在し、対象 7 component の threshold 達成行を含む |

## coverage report 取得・保存手順

1. evidence ディレクトリを準備:
   ```bash
   mkdir -p docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence
   ```
2. coverage を再実行し stdout を保存:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/web test:coverage \
     | tee docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence/coverage-report.txt
   ```
3. JSON サマリを evidence へコピー:
   ```bash
   cp apps/web/coverage/coverage-summary.json \
     docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence/coverage-summary.json
   ```
4. 7 component の Stmts/Lines/Funcs/Branches を outputs/phase-11/main.md に表として転記する（baseline=39.39% との delta を併記）。

## user approval gate の発火条件

以下を全て満たすときのみ approval を要求する:

- `coverage-report.txt` 内に対象 7 component それぞれが threshold 達成と読み取れる行が存在する
- `coverage-summary.json` 内 `total` および対象ファイルの metric が DoD 値以上
- regression（既存 test 件数低下、未関連 component の coverage 低下）がない
- snapshot を新規作成していない

未達がある場合は approval を要求せず Phase 5 / 9 へループバックする。

## 実行手順

- 上記取得手順を順に実行
- evidence サマリを outputs/phase-11/main.md にまとめる
- approval gate 条件を満たす場合のみ user に確認依頼する旨を main.md に明記

## 統合テスト連携

- 上流: phase-10 final review
- 下流: phase-12 documentation update

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する

## サブタスク管理

- [ ] evidence ディレクトリを作成
- [ ] coverage-report.txt を保存
- [ ] coverage-summary.json をコピー
- [ ] outputs/phase-11/main.md に delta 表を記載
- [ ] approval gate 条件を判定

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/evidence/coverage-report.txt
- outputs/phase-11/evidence/coverage-summary.json

## 完了条件

- evidence 2 種が保存されている
- delta 表が main.md に記載されている
- approval gate 判定結果が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ evidence path、delta 表、approval 判定結果を渡す。
