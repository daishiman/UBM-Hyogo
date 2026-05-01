# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

index.md で確定した AC-1〜AC-7 と不変条件 #5 監査を縦軸に、検証手段（grep / 文書レビュー / 該当 Phase 番号）と証跡パスを横軸にした AC マトリクスを生成し、Phase 10 最終レビューゲートで参照する判定基盤を構築する。各 AC の合否判定ルールと、PASS / MINOR / MAJOR の境界線を明文化する。

## AC マトリクス

| AC | 内容 | 検証手段 | 担当 Phase | 証跡パス | 合否ルール |
| --- | --- | --- | --- | --- | --- |
| **AC-1** | ADR が `docs/00-getting-started-manual/specs/` または該当 ADR ディレクトリに起票される | `ls docs/00-getting-started-manual/specs/adr/` + ADR ファイル存在確認 | Phase 5 (runbook), Phase 12 (実起票指示) | outputs/phase-05/adr-runbook.md, outputs/phase-12/documentation-changelog.md | ADR 配置先 + ファイル名規約準拠 = PASS / 配置先未確定 = MAJOR |
| **AC-2** | 決定が `deployment-cloudflare.md` 判定表に反映される（更新差分の指示が文書化） | Phase 4 検証コマンド #2（ADR ⇔ 判定表照合） | Phase 5 (手順), Phase 12 (実反映指示) | outputs/phase-05/doc-update-procedure.md, outputs/phase-12/documentation-changelog.md | 判定表「現状 / 将来」更新差分が文書化 = PASS / 差分未記述 = MAJOR |
| **AC-3** | cutover 決定時は `apps/web/wrangler.toml` / `web-cd.yml` 同期 PR タスク仕様（別タスク）が起票される | unassigned-task-detection.md に stub 3 件記載確認 | Phase 5 (stub 記述), Phase 12 (起票) | outputs/phase-05/doc-update-procedure.md, outputs/phase-12/unassigned-task-detection.md | cutover 採択時 stub 3 件記載 = PASS / 保留採択時 N/A 明記 = PASS / cutover で stub 欠落 = MAJOR |
| **AC-4** | 不変条件 #5 抵触なし（cutover 後も apps/web に `[[d1_databases]]` を追加しない方針が明文化） | Phase 4 検証コマンド #3（抵触ガード）+ ADR Consequences grep | 全 Phase（Phase 5 / 9 / 11 で再実行） | outputs/phase-04/test-strategy.md, outputs/phase-09/main.md | grep 0 件 + Consequences 明記 = PASS / どちらか欠落 = MAJOR |
| **AC-5** | `task-impl-opennext-workers-migration-001` / `UT-GOV-006` との重複/統合判断が明示される | Phase 3 軸 C 結果 + ADR Related セクション grep | Phase 3 (判定), Phase 5 (ADR 反映) | outputs/phase-03/main.md, outputs/phase-05/adr-runbook.md | C-1（分離）採択 + Related に責務分離表 = PASS / C-2/C-3 未却下 = MAJOR |
| **AC-6** | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS で根拠付き | Phase 1 / Phase 3 4 条件評価表 | Phase 1, Phase 3 | outputs/phase-01/main.md, outputs/phase-03/main.md | 4 セルすべて PASS + 根拠記述 = PASS / 1 件でも MINOR/MAJOR = 該当判定 |
| **AC-7** | Phase 12 で canonical 7 ファイルが揃う | Phase 12 outputs ディレクトリ実体確認 | Phase 12 | outputs/phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md | 7 ファイル全存在 + 内容空でない = PASS / 1 件でも欠落 = MAJOR |
| **不変条件 #5 監査（独立行）** | apps/web/wrangler.toml に `[[d1_databases]]` セクションが追加されていない | `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` | Phase 4 (定義), Phase 9 / 11 (再実行) | outputs/phase-09/main.md, outputs/phase-11/main.md | 0 件 = PASS / 1 件以上 = MAJOR ブロッカー（Phase 10 NO-GO） |

## 判定境界線

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 検証手段で期待結果を満たし、証跡パスが実体化 | Phase 10 最終ゲートで GO 投票 |
| **MINOR** | 軽微な記述漏れ / 整形不良（Phase 5 / 8 で吸収可能） | Phase 12 unassigned-task-detection に格下げ未タスク化 |
| **MAJOR** | AC の本質を満たさない / 不変条件違反 / Phase 12 canonical 7 ファイル欠落 | Phase 10 NO-GO、該当 Phase に差し戻し |

## AC ⇔ 苦戦箇所マッピング

Phase 1 で識別した苦戦箇所 5 件と AC の対応関係を明示。

| Phase 1 苦戦箇所 | 対応 AC | 担保手段 |
| --- | --- | --- |
| 1: 三者整合崩壊（wrangler.toml / web-cd.yml / Cloudflare 側） | AC-2, AC-3 | 判定表更新 + cutover stub 3 件起票 |
| 2: 不変条件 #5 抵触リスク | AC-4 + 独立行 | ADR Consequences 必須化 + Phase 9/11 ガード |
| 3: 関連タスク重複起票リスク | AC-5 | Phase 3 軸 C C-1 採択 + ADR Related 責務分離表 |
| 4: `@opennextjs/cloudflare` バージョン互換不確定 | AC-6 (実現性) | Phase 2 decision-criteria.md に互換結果固定 |
| 5: 保留判断の継続維持コスト看過 | AC-2, AC-6 (運用性) | 判定表「再検討トリガ」セクション必須 |

## 完了条件チェックリスト

- [ ] AC-1〜AC-7 すべてに検証手段 / 担当 Phase / 証跡パス / 合否ルールが付与
- [ ] 不変条件 #5 監査が独立行として記載
- [ ] 判定境界線（PASS / MINOR / MAJOR）が明文化
- [ ] AC ⇔ Phase 1 苦戦箇所マッピングが完成
- [ ] Phase 10 ゲートで参照可能な形式（表形式 + 証跡パス具体記述）

## 実行タスク

1. `outputs/phase-07/ac-matrix.md` に AC マトリクス表を記述（AC-1〜AC-7 + 不変条件 #5 = 8 行）。
2. 判定境界線表を追加。
3. AC ⇔ 苦戦箇所マッピング表を追加。
4. base case 別の AC 適用差分（cutover / 保留 / 段階移行）を補足セクションで記述。
5. Phase 10 で再評価する手順（マトリクス全行を走査し PASS / MINOR / MAJOR 判定）を末尾に明記。

## 多角的チェック観点

- **網羅性**: AC-1〜AC-7 すべてが index.md と一字一句一致しているか。
- **証跡パス具体性**: 「outputs/phase-N/...」レベルまで具体記述されているか（「該当 Phase」のみは不可）。
- **base case 非依存記述**: AC-3 のように cutover 採択時のみ適用される項目に「保留採択時の N/A 判定基準」が併記されているか。
- **不変条件 #5 独立性**: AC-4 とは別に独立行で記載され、二重監査される構造が確認できるか。
- **Phase 10 連動**: 本マトリクスが Phase 10 ゲート判定の入力となることが明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-7 マトリクス記述 | 7 | pending |
| 2 | 不変条件 #5 監査独立行 | 7 | pending |
| 3 | 判定境界線表 | 7 | pending |
| 4 | AC ⇔ 苦戦箇所マッピング | 7 | pending |
| 5 | base case 別 AC 適用差分補足 | 7 | pending |
| 6 | Phase 10 連動手順末尾記載 | 7 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC マトリクス + 判定境界線 + 苦戦箇所マッピング + base case 差分 |
| メタ | artifacts.json | Phase 7 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- AC マトリクス 8 行（AC-1〜7 + 不変条件 #5）すべてに 5 カラム
- 判定境界線が PASS / MINOR / MAJOR の 3 段階で明示
- AC ⇔ 苦戦箇所 5 件が対応付け
- Phase 10 連動手順が記載
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC マトリクス（Phase 8 で重複記述削減 / Phase 10 で最終判定入力）
  - 判定境界線（Phase 10 で適用）
  - 苦戦箇所マッピング（Phase 12 unassigned-task-detection の baseline 候補抽出に利用）
- ブロック条件:
  - AC マトリクスに空セル
  - 不変条件 #5 が独立行化されていない
  - 証跡パスが「該当 Phase」止まりで outputs パス未記述

## 参照資料

- `outputs/phase-07/ac-matrix.md`
- `index.md`
- `artifacts.json`

## 統合テスト連携

AC は文書証跡で閉じる。実 deploy 成功条件は migration task の AC として管理する。
