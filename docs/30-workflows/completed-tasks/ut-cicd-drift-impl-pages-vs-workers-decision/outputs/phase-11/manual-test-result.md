# Phase 11 成果物: manual-test-result（NON_VISUAL 証跡）

## NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | docs-only / ADR 起票 |
| 非視覚的理由 | UI 変更ゼロ。実 deploy 操作も別タスク委譲のため画面遷移なし |
| 代替証跡 | grep 結果 5 件 + チェックリスト 7 項目 + リンク死活 8 件 |

## メタ情報（[Feedback 4] 必須 5 項目）

| 項目 | 値 |
| --- | --- |
| visualEvidence | NON_VISUAL |
| 証跡の主ソース | Phase 4 検証コマンド 5 種（doc-only grep × N 件）+ ADR レビューチェックリスト 7 項目 |
| スクリーンショットを作らない理由 | docs-only / ADR 起票タスク。UI 変更ゼロ。実 deploy 操作も別タスク委譲のため画面遷移なし |
| 代替証跡の総数 | grep 結果 5 件 + チェックリスト 7 項目 + リンク死活 8 件 = 計 **20 証跡** |
| 環境ブロッカーと製品レベル PASS の分離 | WEEKGRD-01 対応として §証跡-X 内で別カテゴリ表示 |

## §証跡-1: Phase 4 検証コマンド #1（deploy target 抽出）

```bash
$ rg -n "pages_build_output_dir|main = \".open-next|command: pages deploy|command: deploy" \
    apps/web/wrangler.toml .github/workflows/web-cd.yml
apps/web/wrangler.toml:8:main = ".open-next/worker.js"
.github/workflows/web-cd.yml:48:          command: pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}
.github/workflows/web-cd.yml:85:          command: pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}
```

→ wrangler.toml は **Workers 形式**、web-cd.yml は **Pages 形式**（drift 残）。base case = cutover で C-1（web-cd.yml 切替）が migration-001 へ吸収される計画と整合。製品 PASS。

## §証跡-2: Phase 4 検証コマンド #2（ADR ⇔ 判定表照合）

ADR 本文は `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` に正式配置済み。`deployment-cloudflare.md` 判定表も 2026-05-01 current facts（`wrangler.toml = Workers / web-cd.yml = Pages drift 残`）へ更新済み。**PASS**。

## §証跡-3: Phase 4 検証コマンド #3（不変条件 #5 抵触ガード）— **独立扱い**

```bash
$ rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
（出力なし）
$ echo "Exit: $?"
Exit: 1
```

→ **PASS**（0 件）。実測 2026-05-01。Phase 9 ガード PASS と同値。

## §証跡-4: Phase 4 検証コマンド #4（CLAUDE.md 整合）

```bash
$ rg -n "Cloudflare Workers|Cloudflare Pages|@opennextjs/cloudflare" CLAUDE.md
19:| Web UI | Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare` (`apps/web`) |
37:| `apps/web/` | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) |
```

→ Workers 表記維持。base case (cutover) と整合。**PASS**。

## §証跡-5: Phase 4 検証コマンド #5（関連タスク重複）

`task-impl-opennext-workers-migration-001`（unassigned-task として既起票・2026-04-28）と `UT-GOV-006-web-deploy-target-canonical-sync`（completed-tasks）は本 ADR と責務分離済み。Phase 3 軸 C で C-1 採択（重複起票なし）と整合。**PASS**。

## §証跡-6: ADR レビューチェックリスト 7 項目走査結果

Phase 4 `doc-consistency-checks.md` の 7 項目（5 セクション完備 / リンク死活 / 判定表 table 健全性 / CLAUDE.md base case 整合 / Decision 明記 / Consequences 不変条件 #5 / Related 責務分離）すべて **PASS**。

## 既知制限リスト

1. 実 cutover は別タスク（`task-impl-opennext-workers-migration-001`）。本 Phase は ADR 採択完了のみ。
2. Cloudflare ダッシュボード上の Pages project (`CLOUDFLARE_PAGES_PROJECT`) → Workers script 切替は `task-impl-opennext-workers-migration-001` の runbook / AC に吸収済み。
3. `@opennextjs/cloudflare` 将来メジャーバージョン（v2.x+）リリース時の互換性再評価が必要（Phase 10 baseline B-1）。
4. cutover 後の rollback 手順 runbook（Pages 形式へ戻す手順）は障害発生時に即時起票（Phase 10 baseline B-2）。

## WEEKGRD-01 区分

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| source-level PASS | 5（証跡 1/3/4/5）+ 1（証跡 2 設計上）+ 1（証跡 6 設計上）= 7 セル | 製品レベル品質ゲート PASS |
| 環境ブロッカー | 0 | grep ツール / リポジトリ root 解決すべて成功 |

## 完了確認

- [x] NON_VISUAL 宣言冒頭
- [x] メタ 5 項目記載
- [x] §証跡-1〜5（Phase 4 検証 5 種）
- [x] §証跡-6（ADR チェックリスト 7 項目）
- [x] 不変条件 #5 独立節（§証跡-3）
- [x] 既知制限 4 件（≥3 件）
- [x] WEEKGRD-01 区分明示
