# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-05-31 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

Phase 9 の品質保証結果を受け、AC-1〜AC-8 の達成判定基準と blocker 判定を確定し、Phase 11 の CLI 回帰 smoke を実走できる状態か GO / NO-GO を判定する。MINOR 指摘があれば Phase 12 の未タスク化対象として記録する。

## AC 達成判定基準

| AC | 判定基準 | blocker 判定 | 確認ゲート |
| --- | --- | --- | --- |
| AC-1 途中 throw で非ゼロ exit | 失敗注入時 exit code = 1 | 未達なら blocker（fail-fast 不成立） | QG（fail-fast 確認）/ TC-03 |
| AC-2 atomic write | 途中失敗で本ファイル不変 + tmp 残存 0 | 未達なら blocker（部分書き込みが残る） | TC-01 / TC-02 |
| AC-3 decisive log | stderr に `[generate-index] <skill> / <index-file> (<step>) 失敗: <message>` | 未達なら blocker（原因特定不能） | TC-03 |
| AC-4 回帰維持 + byte-identical | hook/CI 回帰グリーン + `git diff` 0 | 未達なら blocker（CI drift fail） | QG-4 / pre-push / verify-pr-ready |
| AC-5 silent catch 分離 | ENOENT 空継続 / その他 throw | 未達なら MINOR〜blocker（破損握り潰し再発なら blocker） | TC-04 / TC-05 |
| AC-6 scope 再最適化 | index.md 調査結論に単一経路 / task-spec-creator scope 外が記録 | 未達なら MINOR（記録漏れ） | index.md レビュー |
| AC-7 回帰 spec test | `scripts/__tests__/generate-index-fail-fast.spec.ts` の TC-01〜07 全 PASS | 未達なら blocker（回帰ガード不成立） | QG-3 |
| AC-8 4 条件 PASS | 価値性 / 実現性 / 整合性 / 運用性 が全 PASS | 未達なら blocker（着手不可） | Phase 1 / Phase 3 |

## blocker 判定ルール

- **GO**: AC-1〜AC-8 が全て達成基準を満たし、blocker 該当 0 件。Phase 11 CLI 回帰 smoke へ進行可。
- **NO-GO**: blocker 該当 1 件以上。戻し先 Phase（実装は Phase 5 ランブック / 設計は Phase 2）へ戻す。
- **MINOR**: blocker でない指摘（記録漏れ・命名の微調整・scope 外の改善余地）は Phase 12 の未タスク検出（unassigned-task-detection）対象として記録し、本タスクのマージは妨げない。

## MINOR / 未タスク候補（Phase 12 へ記録）

| # | 指摘 | 区分 | Phase 12 での扱い |
| --- | --- | --- | --- |
| M-1 | `task-specification-creator/scripts/generate-index.js` は `indexes:rebuild` に未配線で本タスク scope 外だが、同等の fail-fast / atomic 化が将来必要になりうる | 未タスク候補 | unassigned-task-detection に記録（新規 Issue 起票は user-gated） |
| M-2 | rename の EXDEV リスク（tmp が別 FS の場合）は同一 dir 配置で回避済みだが、出力先が将来変わる場合の再確認が必要 | MINOR（対応方針あり） | Phase 2 D-1 / 苦戦箇所に記録済み。追記のみ |

## 実行タスク

1. AC-1〜AC-8 の達成判定基準と blocker 判定を確定する（完了条件: AC 達成判定基準表が本 Phase に存在）。
2. GO / NO-GO 判定ルールを明示する（完了条件: blocker 判定ルールが存在）。
3. Phase 3 の MINOR（EXDEV / silent catch）が解消方針付きで残っているか確認する（完了条件: M-2 として記録）。
4. MINOR / 未タスク候補を Phase 12 未タスク検出対象として記録する（完了条件: M-1 / M-2 が表に存在）。
5. Phase 11 の evidence 保存先（outputs/phase-11/）を確定する（完了条件: 保存先記載）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-03.md | GO / NO-GO 基準 / 代替案 PASS-MINOR-MAJOR |
| 必須 | （本ワークフロー）phase-07.md | AC / カバレッジマトリクス |
| 必須 | （本ワークフロー）phase-09.md | 7 品質ゲート結果 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | レビュー gate 基準 |

## スコープ

### 含む

- AC-1〜AC-8 達成判定基準と blocker 判定
- GO / NO-GO 判定ルール
- MINOR / 未タスク候補（M-1 / M-2）の Phase 12 記録

### 含まない

- 実コマンドの実走（Phase 11 / 実装サイクル）
- 新規 Issue の起票（user-gated）
- Issue #229 の状態変更（CLOSED のまま）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 / evidence 保存先 / 実走基準（exit 0 + git diff 0、失敗注入で exit 1） |
| Phase 12 | MINOR / 未タスク候補（M-1 / M-2）のドキュメント反映 |

## 多角的チェック観点

- smoke 実走済みに仕様・設計・品質保証の依存が閉じているか。
- NO-GO を GO と誤判定する曖昧条件が残っていないか（blocker 判定が明確か）。
- MINOR を blocker と混同してマージを不要にブロックしていないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-8 達成判定基準確定 | completed | blocker 判定付き |
| 2 | GO / NO-GO 判定ルール明示 | completed | Phase 11 gate |
| 3 | Phase 3 MINOR 解消確認 | completed | M-2 |
| 4 | MINOR / 未タスク候補記録 | completed | M-1 / M-2 → Phase 12 |
| 5 | Phase 11 evidence 保存先確定 | completed | outputs/phase-11/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 最終レビュー | outputs/phase-10/main.md | GO / NO-GO 判定・AC 達成基準・blocker 判定・MINOR 記録 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-8 の達成判定基準と blocker 判定が明記されている
- [ ] GO / NO-GO 判定ルールが明示されている
- [ ] MINOR 指摘（M-1 / M-2）が Phase 12 未タスク化対象として記録されている
- [ ] Phase 11 の evidence 保存先が確定している

## タスク100%実行確認【必須】

- [ ] 全実行タスク（5 件）が記録されている
- [ ] 成果物が `outputs/phase-10/main.md` に配置済み
- [ ] artifacts.json の Phase 10 状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / CLI 回帰検証)
- 引き継ぎ事項: GO 判定 / 実走基準（exit 0 + git diff 0、失敗注入で exit 1 + decisive stderr）/ evidence 保存先
- ブロック条件: blocker 該当 AC が 1 件以上残る場合（NO-GO）
