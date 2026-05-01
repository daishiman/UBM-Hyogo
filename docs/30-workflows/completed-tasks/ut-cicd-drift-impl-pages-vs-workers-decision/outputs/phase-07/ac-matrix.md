# Phase 7 成果物: AC マトリクス

## AC マトリクス（AC-1〜AC-7 + 不変条件 #5 監査独立行 = 8 行）

| AC | 内容 | 検証手段 | 担当 Phase | 証跡パス | 合否ルール |
| --- | --- | --- | --- | --- | --- |
| **AC-1** | ADR が `docs/00-getting-started-manual/specs/` または該当 ADR ディレクトリに起票される | `ls docs/00-getting-started-manual/specs/adr/` + ADR ファイル存在確認 | Phase 5 (runbook), Phase 12 (実起票指示) | outputs/phase-05/adr-runbook.md, outputs/phase-12/documentation-changelog.md | ADR 配置先 + ファイル名規約準拠 = PASS / 配置先未確定 = MAJOR |
| **AC-2** | 決定が `deployment-cloudflare.md` 判定表に反映される（更新差分の指示が文書化） | Phase 4 検証コマンド #2 | Phase 5 (手順), Phase 12 (実反映指示) | outputs/phase-05/doc-update-procedure.md, outputs/phase-12/documentation-changelog.md | 判定表「現状 / 将来」更新差分が文書化 = PASS / 差分未記述 = MAJOR |
| **AC-3** | cutover 決定時は `apps/web/wrangler.toml` / `web-cd.yml` 同期 PR タスク仕様が起票される | `unassigned-task-detection.md` に stub 記載確認 | Phase 5 (stub 記述), Phase 12 (起票) | outputs/phase-05/doc-update-procedure.md, outputs/phase-12/unassigned-task-detection.md | cutover 採択時 stub 記載 = PASS / 保留採択時 N/A 明記 = PASS / cutover で stub 欠落 = MAJOR |
| **AC-4** | 不変条件 #5 抵触なし（`[[d1_databases]]` を apps/web に追加しない方針が明文化） | Phase 4 検証コマンド #3 + ADR Consequences grep | 全 Phase（5/9/11 で再実行） | outputs/phase-04/test-strategy.md, outputs/phase-09/main.md, outputs/phase-11/manual-test-result.md | grep 0 件 + Consequences 明記 = PASS / どちらか欠落 = MAJOR |
| **AC-5** | `task-impl-opennext-workers-migration-001` / `UT-GOV-006` との重複/統合判断が明示 | Phase 3 軸 C 結果 + ADR Related grep | Phase 3 (判定), Phase 5 (ADR 反映) | outputs/phase-03/main.md, outputs/phase-05/adr-runbook.md | C-1 採択 + Related 責務分離表 = PASS / C-2/C-3 未却下 = MAJOR |
| **AC-6** | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS で根拠付き | Phase 1 / Phase 3 4 条件評価表 | Phase 1, Phase 3 | outputs/phase-01/main.md, outputs/phase-03/main.md | 4 セルすべて PASS + 根拠記述 = PASS / 1 件でも MINOR/MAJOR = 該当判定 |
| **AC-7** | Phase 12 で canonical 7 ファイルが揃う | Phase 12 outputs ディレクトリ実体確認 | Phase 12 | outputs/phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md | 7 ファイル全存在 + 内容空でない = PASS / 1 件でも欠落 = MAJOR |
| **不変条件 #5 監査（独立行）** | apps/web/wrangler.toml に `[[d1_databases]]` セクションが追加されていない | `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` | Phase 4 (定義), Phase 9 / 11 (再実行) | outputs/phase-09/main.md, outputs/phase-11/manual-test-result.md | 0 件 = PASS / 1 件以上 = MAJOR ブロッカー（Phase 10 NO-GO） |

## 判定境界線

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 検証手段で期待結果を満たし、証跡パスが実体化 | Phase 10 ゲートで GO 投票 |
| **MINOR** | 軽微な記述漏れ / 整形不良（Phase 5 / 8 で吸収可能） | Phase 12 unassigned-task-detection に格下げ未タスク化 |
| **MAJOR** | AC の本質を満たさない / 不変条件違反 / Phase 12 canonical 7 ファイル欠落 | Phase 10 NO-GO、該当 Phase に差し戻し |

## AC ⇔ Phase 1 苦戦箇所マッピング

| Phase 1 苦戦箇所 | 対応 AC | 担保手段 |
| --- | --- | --- |
| 1: 三者整合崩壊（wrangler.toml / web-cd.yml / Cloudflare side） | AC-2, AC-3 | 判定表更新 + cutover stub 起票 |
| 2: 不変条件 #5 抵触リスク | AC-4 + 独立行 | ADR Consequences 必須化 + Phase 9/11 ガード |
| 3: 関連タスク重複起票リスク | AC-5 | Phase 3 軸 C C-1 採択 + ADR Related 責務分離表 |
| 4: `@opennextjs/cloudflare` バージョン互換不確定 | AC-6 (実現性) | Phase 2 decision-criteria.md に互換結果固定（`1.19.4` 実証済） |
| 5: 保留判断の継続維持コスト看過 | AC-2, AC-6 (運用性) | 比較表で保留時の wrangler.toml ロールバック追加コストを明記 |

## base case 別 AC 適用差分

| AC | cutover（採択） | 保留 | 段階移行 |
| --- | --- | --- | --- |
| AC-1 | 適用（adr/0001-...md 起票） | 適用 | 適用 |
| AC-2 | 適用（判定表「現状 / 将来」を Workers / cutover 残作業に更新） | 適用（Pages 形式維持を明記） | 適用（環境別表記） |
| AC-3 | **適用**（cutover stub 起票必須）| **N/A**（stub 不要を明記）| 適用（環境別 stub） |
| AC-4 | 適用（必須） | 適用（必須） | 適用（必須） |
| AC-5 | 適用 | 適用 | 適用 |
| AC-6 | 適用 | 適用 | 適用 |
| AC-7 | 適用 | 適用 | 適用 |
| 不変条件 #5 監査 | **適用（必須）** | **適用（必須）** | **適用（必須）** |

## Phase 10 連動手順

Phase 10 最終レビューゲートで以下を実行：

1. 本マトリクス全 8 行を走査
2. 各行に Phase 9 結果（quality-gate-checklist.md）を反映した最終判定（PASS/MINOR/MAJOR）を付与
3. MAJOR 1 件以上 → NO-GO（該当 Phase 戻し）
4. MAJOR 0 / MINOR ≤ 3 → GO (PASS / MINOR 許容)
5. MINOR は Phase 12 `unassigned-task-detection.md` へ格下げ（task-specification-creator skill 漏れパターン対策）

## 完了確認

- [x] AC-1〜AC-7 すべてに 5 カラム
- [x] 不変条件 #5 監査独立行
- [x] 判定境界線（PASS/MINOR/MAJOR）明文化
- [x] AC ⇔ 苦戦箇所マッピング 5 件
- [x] base case 別適用差分
- [x] Phase 10 連動手順
- [x] 証跡パスが outputs/phase-N/...md レベルまで具体記述
