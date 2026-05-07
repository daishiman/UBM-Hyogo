[実装区分: 実装仕様書]

# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動テスト検証) |
| 状態 | spec_created |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |
| 依存 | UT-07B-FU-03 (main merged) |
| Gate | MAJOR 判定の場合は Phase 1〜8 のいずれかに戻る |

---

## 目的

Phase 1〜9 の成果物を集約し、本タスクが Issue #438 の受入条件
「aiworkflow-requirements skill の indexes から D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` が逆引きでき、`bash scripts/cf.sh d1:apply-prod` が quick-reference から即時参照可能で、`pnpm indexes:rebuild` 後に CI gate `verify-indexes-up-to-date` がローカル相当で PASS する」
を満たしているかを最終評価し、GO / NO-GO を確定する。
solo dev policy のため self-review を正本とし、CODEOWNERS による必須レビュアーは存在しない。

---

## 実行タスク

1. GO/NO-GO 判定基準表を作成し、Phase 1〜9 の成果物 / 判定を投入
2. Phase 1 の 4 条件（価値性・実現性・整合性・運用性）の最終判定を確定
3. Blocker 一覧を作成し、未解消ブロッカーがある場合は戻り Phase を明示
4. レビュー観点（スコープ逸脱なし / 既存 references 改変なし / topic-map.md は rebuild 結果のみ / D1 migration spec 変更なし / UT-07B-FU-03 と二重逆引きしていないこと）を確定
5. Self-review を実施し approver セクションに記録（CODEOWNERS 該当なし）
6. Phase 11 への引き継ぎ条件を確定

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | 4 条件仮判定 / AC |
| 必須 | phase-02.md | 追従対象表 |
| 必須 | phase-07.md | AC マトリクス |
| 必須 | phase-08.md | DRY 化結果 |
| 必須 | phase-09.md | Quality Gate Q-1〜Q-12 |
| 必須 | CLAUDE.md | solo dev policy / branch protection |
| 参考 | `docs/30-workflows/ut-07b-fu-03-*/` | 上流タスクとの責務境界確認 |

---

## GO / NO-GO 判定基準表

| # | 判定項目 | 入力 Phase | 期待値 | 実測 | 判定 |
| --- | --- | --- | --- | --- | --- |
| G-1 | AC（逆引きエントリ存在 / 追記行 1〜2 行）すべて達成 | Phase 7 | 「未達」0 件 | PASS | completed |
| G-2 | typecheck / lint pass | Phase 9 (Q-1, Q-2) | 0 error | PASS | completed |
| G-3 | `pnpm indexes:rebuild` 冪等性 PASS | Phase 9 (Q-3) | 再実行で diff 空 | PASS | completed |
| G-4 | CI gate `verify-indexes-up-to-date` ローカル相当 PASS | Phase 9 (Q-4) | exit 0 | PASS | completed |
| G-5 | resource-map 追記行が grep で hit | Phase 9 (Q-5) | hit ≥ 1 | PASS | completed |
| G-6 | quick-reference 追記行が grep で hit | Phase 9 (Q-6) | hit 1 件 | PASS | completed |
| G-7 | topic-map は rebuild 結果のみ（手書き混入なし）| Phase 9 (Q-7) | 手書き commit 0 | PASS | completed |
| G-8 | dead path claim 補正のみ | Phase 9 (Q-8) | diff 0 件 | PASS | completed |
| G-9 | UT-07B-FU-03 との二重逆引きなし | Phase 9 (Q-9) | 役割注記が区別される | PASS | completed |
| G-10 | D1 migration spec への変更 0 件 | Phase 9 / 8 | docs/00-getting-started-manual/specs/ 配下に diff 0 件 | PASS | completed |
| G-11 | Free-tier ±0 / Secret 追加 0 | Phase 9 (Q-10, Q-11) | すべて ±0 / 0 件 | PASS | completed |

---

## レビュー観点（本タスク固有）

| # | 観点 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| R-1 | スコープ逸脱なし | `git diff main...HEAD --name-only` | indexes 配下と本タスク docs/ 配下のみ |
| R-2 | 既存 references 改変なし | `git diff main...HEAD -- .claude/skills/aiworkflow-requirements/references/` | dead path claim 補正以外 0 件 |
| R-3 | topic-map.md は rebuild 結果のみ | `git log -1 --name-only -- .claude/skills/aiworkflow-requirements/indexes/topic-map.md` | rebuild commit のみ |
| R-4 | D1 migration spec 変更なし | `git diff main...HEAD -- docs/00-getting-started-manual/specs/` | dead path claim 補正以外 0 件 |
| R-5 | UT-07B-FU-03 と二重逆引きなし | resource-map.md の hit 行を目視 | 役割注記が「runbook 本体」「runbook + scripts + workflow」で区別される |
| R-6 | CLAUDE.md「wrangler 直接実行禁止」と整合 | quick-reference 追記行 | `bash scripts/cf.sh ...` 形式である |

---

## 4 条件 最終判定

| 条件 | Phase 1 仮判定 | Phase 10 最終判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | PASS | PASS | skill 利用者が「D1 を本番反映する手順」を 1 行から逆引き可能になり認知負荷が低下 |
| 実現性 | PASS | PASS | 追記スコープは 1〜2 行 + rebuild のみで Phase 5 で完了 |
| 整合性 | PASS | PASS | UT-07B-FU-03 と責務境界を分離（R-5）/ references 改変なし（R-2）|
| 運用性 | PASS | PASS | `verify-indexes-up-to-date` CI gate が drift を継続検知 |

---

## Blocker 一覧（最終）

| # | 内容 | 元 Phase | 状態 | 解消 evidence |
| --- | --- | --- | --- | --- |
| B-1 | UT-07B-FU-03 main merged 必須 | 依存条件 | 解消 | merged 確認済（依存表 参照）|
| B-2 | indexes:rebuild が決定論的に動作すること | Phase 5 / 9 | TBD | Q-3 / Q-4 PASS |
| B-3 | references 本体への副作用 | Phase 9 | TBD | Q-8 が diff 0 件 |
| B-4 | UT-07B-FU-03 との二重逆引き | Phase 8 / 9 | TBD | Q-9 / R-5 で役割注記区別 |
| B-5 | D1 migration spec への波及 | Phase 9 / 10 | TBD | Q-10 / R-4 で 0 件 |

---

## `spec_created` → `completed` 化条件

| 条件 | 達成判定 |
| --- | --- |
| Phase 1〜10 が completed | 本 Phase 終了時点 |
| Phase 11（手動テスト検証）evidence 取得 | Phase 11 終了時 |
| Phase 12（docs 同期）達成 | Phase 12 終了時 |
| Phase 13（PR 作成）#438 close 条件記述 | Phase 13 終了時 |
| artifacts.json 全 phase = completed | Phase 13 終了時 |

> 上記すべてを満たした時点で artifacts.json の `task.status` を `spec_created` から `completed` に遷移させる。

---

## Self-review（solo dev policy）

| 項目 | 値 |
| --- | --- |
| Reviewer | @daishiman（自己レビュー） |
| CODEOWNERS 該当 | `.claude/skills/**/references/**` のみ owner 明示。本タスクは indexes 配下を主対象とするため CODEOWNERS 該当なし |
| Required reviewers | 0（CLAUDE.md branch protection 記載どおり） |
| 検証手段 | Self-checklist（本 Phase の R-1〜R-6 + Q-1〜Q-12）|
| Approval ログ | `outputs/phase-10/main.md` に記録 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence（grep + CI gate ローカル相当 PASS）を再利用 |
| Phase 12 | UT-07B-FU-03 との責務境界記述を docs 反映時に転記 |
| Phase 13 | #438 close 条件 / `completed` 化条件を PR body に転記 |

---

## 多角的チェック観点

- 不変条件 #5 / #10: Phase 9 までで個別確認済、本 Phase で再 cross-check
- DRY: Phase 8 の D-1〜D-4 が hit 期待値どおりに収束しているか再確認
- 後方互換: 既存 anchor / topic を改名していない
- 整合性: Phase 1 4 条件の最終判定がすべて PASS
- 運用性: Blocker B-1〜B-5 が解消 or 持ち越し条件付き

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準表記入 | 10 | completed | G-1〜G-11 |
| 2 | レビュー観点 R-1〜R-6 確認 | 10 | completed | スコープ / 副作用 / 二重逆引き |
| 3 | 4 条件最終判定 | 10 | completed | 価値性 / 実現性 / 整合性 / 運用性 |
| 4 | Blocker 一覧確定 | 10 | completed | B-1〜B-5 |
| 5 | `spec_created` → `completed` 条件記述 | 10 | completed | Phase 11〜13 達成条件 |
| 6 | Self-review 実施 | 10 | completed | solo dev policy |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO/NO-GO 判定 / レビュー観点 / 4 条件最終判定 / Blocker / Self-review |
| メタ | artifacts.json | Phase 10 を completed に更新 |

---

## 完了条件 (DoD)

- [ ] GO/NO-GO 判定基準表 G-1〜G-11 がすべて判定済（pass / conditional / fail）
- [ ] レビュー観点 R-1〜R-6 がすべて期待を満たしている
- [ ] 4 条件の最終判定がすべて PASS
- [ ] Blocker B-1〜B-5 がそれぞれ「解消 / 持ち越し条件付き」で記録済
- [ ] Self-review approver / CODEOWNERS 該当なし / required reviewers=0 が記録済

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-10/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 判定が NO-GO の場合は戻り Phase（Phase 1 / 2 / 5 / 8 のいずれか）を明記
- 判定が conditional GO の場合は条件解消を Phase 11 / 12 / 13 のどこで達成するか明記
- artifacts.json の phase 10 を completed に更新

---

## 次 Phase

- 次: 11 (手動テスト検証)
- 引き継ぎ事項: GO/NO-GO 結果 / NON_VISUAL evidence 一式 / R-1〜R-6 達成
- ブロック条件: G-1〜G-10 のいずれかが fail の場合は戻り Phase を実行
