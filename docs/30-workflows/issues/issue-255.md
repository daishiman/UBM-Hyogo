# [#255] [U-5] coverage threshold 3点同期 lint（codecov / coverage-guard / aiworkflow-requirements）

## メタ情報

```yaml
issue_number: 255
title: [U-5] coverage threshold 3点同期 lint（codecov / coverage-guard / aiworkflow-requirements）
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/255
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

coverage 80% 閾値が登場する3箇所（aiworkflow-requirements / coverage-guard.sh / codecov.yml）の値を node スクリプトで読み比較し、不一致時に CI で exit 1 する lint を導入する。

## 背景・課題

- 3 箇所の手動同期は誤りやすく drift しやすい
- 現状 `codecov.yml` は未配置だが将来導入時に lint がないと drift 検知不能
- 正本（aiworkflow-requirements）と実装（coverage-guard.sh）の整合 lint が存在しない

## 苦戦箇所

正本値が aiworkflow-requirements の Markdown テキスト中に埋め込まれているため機械可読でない。値の抽出は正規表現に依存し、Markdown の表現変更で誤検出する可能性が高い。フロントマター YAML キーまたは固定形式 Anchor の埋め込みなど、正本側の構造化が前提となる。

## 受入条件 (AC)

1. `scripts/coverage-threshold-lint.ts` が 3 ソースを読み比較・差分時 exit 1
2. CI に `coverage-threshold-lint` job 追加
3. `aiworkflow-requirements` を正本、他を実行設定とする対応表が runbook に明記
4. Codecov 未導入時は 2 点同期、`codecov.yml` 出現で 3 点に動的拡張

## 起動条件

Codecov 導入時、または正本値変更時の整合監査要請時。

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/task-codecov-threshold-sync-lint-001.md`
- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-5
