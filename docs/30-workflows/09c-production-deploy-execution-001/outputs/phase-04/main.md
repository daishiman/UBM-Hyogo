# Phase 4 main: verify suite 設計

production deploy execution の検証を 3 層 suite に分割し、AC-2 / 3 / 4 / 5 / 7 / 10 / 11 / 13 を suite に対応付ける。実コマンドは Phase 5 以降で実行する。本 Phase は **suite ID と検証コマンド一覧の固定**のみ。

詳細は `outputs/phase-04/verify-suite.md` を参照。

## 概要

| 層 | suite ID prefix | 担当 Phase | 主目的 |
| --- | --- | --- | --- |
| Preflight | PF-* | 5 | mutation 開始前の整合性確認 |
| Production smoke + 認可境界 | SM-* | 9 | 10 ページ + 認可 + 不変条件 #4/#11 |
| 24h メトリクス | MT-* | 11 | 無料枠 + 不変条件 #5/#10/#15 |

## AC ↔ suite 対応 (要約)

| AC | suite ID |
| --- | --- |
| AC-2 | PF-1 |
| AC-3 | PF-2 |
| AC-4 | PF-3 + Phase 6 |
| AC-5 | PF-4 + PF-5 |
| AC-7 | SM-1 〜 SM-5 |
| AC-10 | MT-1 + MT-2 |
| AC-11 | SM-3 + SM-4 + MT-3 + MT-4 |
| AC-13 | grep evidence (Phase 12) |
