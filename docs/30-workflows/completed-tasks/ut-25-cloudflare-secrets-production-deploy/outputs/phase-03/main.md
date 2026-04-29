# Phase 3 成果物 — 設計レビュー

## 1. レビュー方針

Phase 2 設計（4 lane / stdin 投入 / staging-first / rollback / `.dev.vars`）を、**5 軸の代替案比較**と**4 条件再評価**で監査する。CLAUDE.md ルール直結項目は代替案不採用。

## 2. 代替案比較サマリ

| 軸 | 採用 | 不採用 | 理由 |
| --- | --- | --- | --- |
| A: ラッパー経路 | A1 cf.sh ラッパー | A2 直接 wrangler | CLAUDE.md「wrangler 直接禁止」直結 |
| B: 順序 | B1 staging-first | B2 production-first | 失敗時の影響範囲を staging に閉じ込める |
| C: ローカル | C1 `.dev.vars` あり | C2 Cloudflare 単独 | `.gitignore` 除外で leak 抑止 + ローカル dev 体験維持 |
| D: 投入手段 | D1 `op read \| stdin` | D2 `cat sa.json \| stdin`（サブ案）/ D3 tty | D2 はディスク残留 / D3 は自動化不可 |
| E: rollback | E1 delete + 再 put | E2 上書き put のみ | 誤値の即時除去で fail-fast |

## 3. 4 条件再評価

| 条件 | Phase 1 | Phase 3 後 |
| --- | --- | --- |
| 価値性 | PASS | PASS |
| 実現性 | PASS | PASS |
| 整合性 | PASS | PASS |
| 運用性 | PASS | PASS |

## 4. PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 備考 |
| --- | --- | --- |
| ラッパー経路 (A) | PASS | A1 採用 |
| 順序 (B) | PASS | B1 採用 |
| ローカル取扱 (C) | MINOR | UT25-M-01: `.gitignore` 除外確認を smoke test 必須化 |
| 投入手段 (D) | PASS | D1 採用 |
| rollback (E) | PASS | E1 採用 |
| 値読取不能前提 | PASS | UT-26 へ機能確認委譲 |
| `--env` 漏れ事故 | MINOR | UT25-M-02: 異常系テスト追加（`--env` 無し実行 → top-level 投入されないこと確認） |
| 履歴汚染 | PASS | `set +o history` + op stdin pipe 二重防御 |
| `private_key` 改行 | PASS | stdin バイト透過で構造的保全 |

**総合判定: PASS（MINOR 2 件は Phase 4 / Phase 6 で吸収）**

## 5. MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase |
| --- | --- | --- | --- |
| UT25-M-01 | `apps/api/.dev.vars` の `.gitignore` 除外確認を smoke test 必須項目化 | Phase 4 / Phase 11 | Phase 11 |
| UT25-M-02 | `--env` 漏れ事故シナリオを異常系テストに追加 | Phase 6 | Phase 9 |

## 6. NO-GO 条件 (Phase 4 着手禁止)

- 4 条件のいずれかが MAJOR
- A2 / B2 / D3 / E2 が手順に残存
- `apps/api/.dev.vars` `.gitignore` 除外確認手順が無い
- `wrangler secret list` の name 確認手順が無い

## 7. Phase 13 blocked 条件 (実投入禁止)

- UT-03 が completed でない
- 1Password に SA JSON が無い
- apps/api Workers staging / production 未作成
- `apps/api/.dev.vars` が `.gitignore` 除外されていない
- staging への投入 + name 確認が PASS していない（production 単独 GO 禁止）

## 8. 簡素化検討

| 項目 | 結論 |
| --- | --- |
| ラッパー緩和 | NO（CLAUDE.md ルール直結） |
| staging スキップ | NO（運用性 MAJOR） |
| `.dev.vars` 省略 | 開発者次第（仕様書には残す） |
| evidence 統合 | NO（bulk 化禁止） |
| runbook merge | NO（緊急時参照性低下を避ける） |

## 9. Phase 4 着手判定

- [x] 代替案 A〜E すべて評価済み
- [x] 4 条件再評価で全 PASS
- [x] MINOR 2 件が追跡テーブルに登録
- [x] NO-GO 条件のいずれにも該当しない
- [x] Phase 13 blocked 条件が明文化されている

**結論: Phase 4 着手可能。**

## 10. 引き渡し

Phase 4（テスト戦略）へ：

- 採用設計 = A1 / B1 / C1 / D1 / E1
- MINOR UT25-M-01 → smoke test 計画に組み込み
- MINOR UT25-M-02 → 異常系テストに組み込み
- Phase 13 blocked 条件をユーザー承認チェックリストへ転記する責務は Phase 12 / 13
