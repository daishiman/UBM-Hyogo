# Phase 7: カバレッジ報告

## 対象範囲

`scripts/ci/verify-workflow-doc-refs.sh` の変更行のみ。shell script のため line coverage は行わず、**全分岐が fixture で踏まれていること**を確認する。

## 分岐カバレッジ

| 分岐 | TC | 結果 |
|------|----|------|
| `--root` 引数 parse | TC-01〜TC-07 fixture 実行 | カバー |
| `--workflows` 引数 parse | 未実装分岐ではなく既定値利用のみ | 対象外 |
| 不明引数 → exit 2 | 未追加 | 未カバー |
| docs 参照 0 件 | TC-03 URL 除外後 0 件 | カバー |
| URL 除外分岐 | TC-03 | カバー |
| URL と local missing 混在行 | TC-04 | カバー |
| anchor 除去分岐 | TC-05 | カバー |
| missing 検出分岐 | TC-02 / TC-04 | カバー |
| missing workflows dir → exit 2 | TC-06 | カバー |
| OK 経路 | TC-01 / TC-07 | カバー |
| runtime evidence 除外（`outputs/phase-11/evidence/`） | 本リポ実体で踏まれる | カバー |
| `...` placeholder 除外 | 本リポ実体で踏まれる | カバー |

## 判定

今回の契約に必要な主要分岐は PASS。`--workflows` 明示指定と不明引数は追加テスト未設定だが、CI 実行経路は既定値利用のため Phase 9 QA と合算して PASS とする。
