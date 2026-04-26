# Phase 11 出力: manual-smoke-log.md
# 手動確認ログ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 11 / 13 (手動 smoke test) |
| 作成日 | 2026-04-23 |
| 状態 | completed |

---

## 手動確認ログ

| # | 確認日 | 確認者 | 確認内容 | 確認方法 | 結果 |
| --- | --- | --- | --- | --- | --- |
| LOG-01 | 2026-04-23 | daishiman | `doc/00-serial-architecture-and-scope-baseline/` ディレクトリの存在確認 | `find doc/00-serial-architecture-and-scope-baseline -type d` 相当の確認 | PASS |
| LOG-02 | 2026-04-23 | daishiman | `index.md` の存在確認 | ファイル存在確認 | PASS |
| LOG-03 | 2026-04-23 | daishiman | `artifacts.json` の存在確認 | ファイル存在確認 | PASS |
| LOG-04 | 2026-04-23 | daishiman | `phase-01.md` 〜 `phase-13.md` の存在確認 (13ファイル) | ファイル存在確認 | PASS |
| LOG-05 | 2026-04-23 | daishiman | `outputs/phase-01/baseline-inventory.md` の存在と内容確認 | ファイル存在 + 内容目視確認 | PASS |
| LOG-06 | 2026-04-23 | daishiman | `outputs/phase-02/canonical-baseline.md` の存在と内容確認 (アーキテクチャ構成・ブランチ対応表・責務境界・シークレット配置マトリクス・downstream参照パスの記載) | ファイル存在 + 内容目視確認 | PASS |
| LOG-07 | 2026-04-23 | daishiman | `outputs/phase-02/decision-log.md` の存在と内容確認 (採用理由6件・非採用理由3件・スコープ外8件の記載) | ファイル存在 + 内容目視確認 | PASS |
| LOG-08 | 2026-04-23 | daishiman | `outputs/phase-03/main.md` の存在と内容確認 (4条件レビュー全PASS・AC-1〜5全PASS・総合判定PASS) | ファイル存在 + 内容目視確認 | PASS |
| LOG-09 | 2026-04-23 | daishiman | `outputs/phase-04/main.md` の存在と内容確認 (検証コマンド7件・期待出力表・Phase 5への引き継ぎ) | ファイル存在 + 内容目視確認 | PASS |
| LOG-10 | 2026-04-23 | daishiman | `outputs/phase-05/main.md` の存在と内容確認 (docs-only方針・実行手順・sanity check 3件全PASS) | ファイル存在 + 内容目視確認 | PASS |
| LOG-11 | 2026-04-23 | daishiman | `outputs/phase-06/main.md` の存在と内容確認 (異常系7件・検出方法・検証結果全PASS) | ファイル存在 + 内容目視確認 | PASS |
| LOG-12 | 2026-04-23 | daishiman | `outputs/phase-07/main.md` の存在と内容確認 (AC×検証項目マトリクス・カバレッジマトリクス・未カバーなし) | ファイル存在 + 内容目視確認 | PASS |
| LOG-13 | 2026-04-23 | daishiman | `outputs/phase-08/main.md` の存在と内容確認 (Before/After表3件・共通化パターン・削除対象7件全不在確認) | ファイル存在 + 内容目視確認 | PASS |
| LOG-14 | 2026-04-23 | daishiman | `outputs/phase-09/main.md` の存在と内容確認 (命名規則チェック・参照整合性・無料枠・Secrets漏洩チェック / QA総合PASS) | ファイル存在 + 内容目視確認 | PASS |
| LOG-15 | 2026-04-23 | daishiman | `outputs/phase-10/main.md` の存在と内容確認 (AC全項目PASS表・blockerなし・Phase 11進行GO) | ファイル存在 + 内容目視確認 | PASS |
| LOG-16 | 2026-04-23 | daishiman | ブランチ記法の統一確認: 全 outputs で `dev` / `main` / `feature/*` のみ使用されていることを確認 | 内容目視確認 | PASS |
| LOG-17 | 2026-04-23 | daishiman | data ownership の確認: `Sheets = 入力源 (non-canonical)` / `D1 = canonical` が canonical-baseline.md セクション3 で明確に記述されていることを確認 | 内容目視確認 | PASS |
| LOG-18 | 2026-04-23 | daishiman | シークレット実値の不在確認: 全 outputs ファイルに API キー・token の実値が含まれていないことを確認 | 内容目視確認 | PASS |
| LOG-19 | 2026-04-23 | daishiman | scope 外の不混入確認: canonical-baseline.md のアーキテクチャ図と採用コンポーネント表に通知基盤・モニタリング等が含まれていないことを確認 | 内容目視確認 | PASS |
| LOG-20 | 2026-04-23 | daishiman | artifacts.json の内容確認: task_path・phase status・external_services・doc_references の記載内容を確認 | ファイル内容目視確認 | PASS (task_path は Phase 12 で更新済み) |

---

## smoke test 総合結果

| 確認ログ件数 | PASS 件数 | FAIL 件数 | 備考 |
| --- | --- | --- | --- |
| 20 | 20 | 0 | LOG-20 の artifacts.json task_path は Phase 12 で更新済み |

**smoke test 総合判定: PASS**
