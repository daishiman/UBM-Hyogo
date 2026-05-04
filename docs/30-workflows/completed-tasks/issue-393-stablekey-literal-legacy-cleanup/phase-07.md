[実装区分: 実装仕様書]

# Phase 7: 統合検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 統合検証 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (パフォーマンス・運用) |
| 状態 | pending |

## 目的

Phase 5 の置換ランブックと Phase 6 の異常系結果を統合し、apps/web / apps/api / packages/* 全域で typecheck / lint / focused vitest / strict 検査が PASS することを実測 evidence として保存する。AC-1〜7 の完全トレース表を Phase 7 で完成させ、workflow_state を `strict_ready` に持ち込む。

## 検証マトリクス

### コマンド一覧（順序通り実行）

| # | コマンド | 期待 | evidence ファイル |
| --- | --- | --- | --- |
| 1 | `node scripts/lint-stablekey-literal.mjs --strict`（before 値の参考保管が必要なら branch 作成前に取得） | 参考: 148 violations | `outputs/phase-07/evidence/lint-strict-before.txt` |
| 2 | `node scripts/lint-stablekey-literal.mjs --strict`（実装完了後） | exit 0 / 0 violations / stableKeyCount=31 | `outputs/phase-07/evidence/lint-strict-after.txt` |
| 3 | `mise exec -- pnpm typecheck` | exit 0 | `outputs/phase-07/evidence/typecheck.txt` |
| 4 | `mise exec -- pnpm lint` | exit 0 | （ESLint 出力） |
| 5 | `mise exec -- pnpm exec vitest run scripts/lint-stablekey-literal.test.ts apps/api/src/jobs/ apps/api/src/repository/ apps/api/src/use-cases/ apps/api/src/view-models/ apps/api/src/routes/admin/ apps/web/app/profile/ apps/web/src/components/public/ packages/shared/src/utils/` | exit 0 / all PASS | `outputs/phase-07/evidence/vitest-focused.txt` |
| 6 | `git diff main...HEAD --stat` | family A〜G + test-update が反映 | `outputs/phase-07/evidence/per-family-diff.txt` |
| 7 | `git diff main...HEAD \| grep -E "eslint-disable\|@ts-ignore\|as any"` | 0 件 | （integration-check.md 内に記録） |

> **注**: コマンド 1（before）は本タスク開始前にすでに 148 violation で確認済み。Phase 7 では「after」の保存を必須とし、before は参考情報として記録する。

## AC トレース表

| AC | 検証 evidence | 期待 | 結果記録欄 |
| --- | --- | --- | --- |
| AC-1: strict violation 0 | `lint-strict-after.txt` | violation 0 / 14 ファイル不在 | （Phase 7 実行時に記入） |
| AC-2: stableKeyCount=31 維持 | `lint-strict-after.txt` | `stableKeyCount=31` 文字列含む | （実行時記入） |
| AC-3: focused test PASS | `vitest-focused.txt` | all PASS | （実行時記入） |
| AC-4: typecheck PASS | `typecheck.txt` | exit 0 | （実行時記入） |
| AC-5: lint PASS | `pnpm lint` 出力 + `lint-strict-after.txt` | 両方 exit 0 | （実行時記入） |
| AC-6: suppression 0 | grep 結果 | 0 件 | （実行時記入） |
| AC-7: 親 AC-7 strict 昇格可能 state | 上記 AC-1〜6 すべて PASS / Phase 12 で更新計画 | strict_ready | （実行時記入） |

## 実行タスク

- [ ] コマンド 1〜7 を順次実行し evidence を保存
- [ ] AC トレース表に結果を記入
- [ ] `outputs/phase-07/integration-check.md` に AC トレース表 + 異常系 (Phase 6) サマリーを統合記載
- [ ] `outputs/phase-07/main.md` に Phase 7 全体サマリー
- [ ] workflow_state を `strict_ready` に更新可能であることを確認
- [ ] artifacts.json の workflow_state 更新候補を Phase 12 引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/main.md | DoD 7 項目 |
| 必須 | outputs/phase-05/runbook.md | 実装完了後 state 前提 |
| 必須 | outputs/phase-06/violation-fixture-spec.md | 異常系結果 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 統合検証サマリー |
| ドキュメント | outputs/phase-07/integration-check.md | AC トレース表 + 異常系統合サマリー |
| evidence | outputs/phase-07/evidence/lint-strict-before.txt | before 参考 |
| evidence | outputs/phase-07/evidence/lint-strict-after.txt | strict 0 violation 確認 |
| evidence | outputs/phase-07/evidence/typecheck.txt | typecheck PASS |
| evidence | outputs/phase-07/evidence/vitest-focused.txt | focused vitest PASS |
| evidence | outputs/phase-07/evidence/per-family-diff.txt | family 別 diff stat |
| メタ | artifacts.json | phase 7 status |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | lint 走行時間 / CI gate 時間影響評価（別エージェント） |
| Phase 11 | evidence の最終 artifact 化（別エージェント） |
| Phase 12 | 親 03a workflow AC-7 更新計画 / workflow_state = strict_ready |

## 多角的チェック観点

- 全 evidence ファイル 5 種が outputs/phase-07/evidence/ 配下に揃っていること
- AC-1〜7 すべての結果欄が埋まっていること
- 不変条件 #1 / #2 / #4 が破られていないこと（identity 置換のため自動的に PASS）
- workflow_state 更新条件（strict_ready）に必要な前提がすべて満たされること
- vitest focused 実行で stale snapshot が出ていないこと

## 完了条件

- [ ] 5 evidence ファイル保存完了
- [ ] AC-1〜7 トレース表完成
- [ ] integration-check.md 完成
- [ ] workflow_state strict_ready 到達確認
- [ ] Phase 12 引き継ぎ事項整理（AC-7 親 workflow 更新計画）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（focused test 一部 fail / 型 narrowing 残存 / suppression 検出）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (パフォーマンス・運用) — 別エージェント担当
- 引き継ぎ: AC-1〜7 トレース完成状態 / strict_ready state / 親 03a workflow AC-7 更新計画
- ブロック条件: AC-1〜7 のいずれかが PASS でない場合 strict_ready 不可、Phase 8 以降は実装やり直しが必要
