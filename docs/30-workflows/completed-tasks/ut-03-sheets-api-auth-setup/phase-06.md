# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

Phase 5 runbook の各ステップで起きうる失敗パターンを洗い出し、それぞれにリカバリ手順とログメッセージ・モニタリング指針を定義する。UT-03 原典の苦戦箇所 4 件を本 Phase の異常系として固定する。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-06/failure-cases.md | 失敗ケース表とリカバリ手順 |

## 完了条件

- [ ] HTTP 401/403/429/5xx すべての対応方針を記述
- [ ] JWT 署名失敗・JSON parse 失敗の検出と log redact 方針
- [ ] Service Account 共有忘れ（403 PERMISSION_DENIED）の検出と runbook 戻り先
- [ ] Workers fetch timeout のリトライ戦略
- [ ] 苦戦箇所 4 件すべてが failure-cases.md にエントリを持つ
