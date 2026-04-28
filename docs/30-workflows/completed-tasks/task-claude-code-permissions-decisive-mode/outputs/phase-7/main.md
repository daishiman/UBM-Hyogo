# Phase 7: カバレッジ確認 — main

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6（テスト拡充） |
| 下流 | Phase 8（リファクタリング） |
| 種別 | docs-only / NON_VISUAL / spec_created |

## 目的

設定ファイル変更タスクのため line / branch カバレッジは N/A。代わりに **要件カバレッジマトリクス**（要件 → 設計 → 主テスト → 補助テスト）と **AC トレース** で 100% 網羅性を可視化する。

## 要件一覧（再掲）

| 要件 ID | 概要 |
| --- | --- |
| F-1 | settings 3 層の `defaultMode` 統一（案 A: `bypassPermissions` 統一） |
| F-2 | `cc` alias 強化（`--dangerously-skip-permissions` 併用） |
| F-3 | `permissions.allow` / `deny` whitelist 整備 |
| F-4 | 階層優先順位の文書化（`claude-code-config.md`） |

## 要件カバレッジマトリクス

| 要件 ID | 概要 | 設計 (Phase 2) | 主テスト (Phase 4) | 補助テスト (Phase 6) | カバー状況 |
| --- | --- | --- | --- | --- | --- |
| F-1 | settings 3 層統一 | `settings-diff.md` | TC-01, TC-02 | TC-F-01 | 100% |
| F-2 | cc alias 強化 | `alias-diff.md` | TC-01, TC-03 | TC-F-02, TC-R-01 | 100% |
| F-3 | whitelist 整備 | `whitelist-design.md` | TC-04, TC-05 | TC-R-01 | 100% |
| F-4 | 階層優先順位の文書化 | `outputs/phase-3/impact-analysis.md` | TC-03（参照） | - | 100%（Phase 12 で claude-code-config.md 追記により完結） |

未カバー要件: **0 件**。

## AC カバレッジマトリクス

| AC | 概要 | 紐付け Phase / 成果物 | カバー状況 |
| --- | --- | --- | --- |
| AC-1 | 統一後 3 層 settings.json 完全形 diff | Phase 2 `settings-diff.md` | 100% |
| AC-2 | `cc` alias 書き換え diff（before / after） | Phase 2 `alias-diff.md` | 100% |
| AC-3 | `permissions.allow` / `deny` 設計 | Phase 2 `whitelist-design.md` | 100% |
| AC-4 | 階層優先順位ドキュメント追記方針 | Phase 12 で `docs/00-getting-started-manual/claude-code-config.md` に追記（方針確定済み） | 100%（方針） |
| AC-5 | 手動テストシナリオ | Phase 4 `test-scenarios.md` + Phase 11 `manual-smoke-log.md` | 100% |
| AC-6 | 影響範囲レビュー | Phase 3 `impact-analysis.md` | 100% |
| AC-7 | NON_VISUAL 証跡 | Phase 11 `manual-smoke-log.md` を主証跡 | 100%（方針） |
| AC-8 | Phase 12 6 成果物 | Phase 12 で 6 ファイル生成予定（artifacts.json 通り） | 100%（方針） |

## TC ⇄ 要件 ⇄ AC 双方向トレース

| TC | 要件 | AC | 種別 |
| --- | --- | --- | --- |
| TC-01 | F-1, F-2 | AC-1, AC-2, AC-5 | 主 |
| TC-02 | F-1 | AC-1, AC-5 | 主 |
| TC-03 | F-2, F-4 | AC-4, AC-5, AC-6 | 主 |
| TC-04 | F-3 | AC-3, AC-5 | 主 |
| TC-05 | F-3 | AC-3, AC-5 | 主 |
| TC-F-01 | F-1 | AC-1, AC-5 | 補助（fail path） |
| TC-F-02 | F-2 | AC-2, AC-5 | 補助（fail path） |
| TC-R-01 | F-2, F-3 | AC-2, AC-3, AC-5 | 補助（回帰 guard） |

## カバレッジ目標達成状況

| 観点 | 目標 | 実績 |
| --- | --- | --- |
| 要件カバレッジ | F-1〜F-4 すべて 100% trace | 達成 |
| AC カバレッジ | AC-1〜AC-8 すべて trace | 達成（AC-4 / AC-7 / AC-8 は方針確定での達成） |
| 未カバー要件 | 0 件 | 0 件 |
| 未カバー AC | 0 件 | 0 件 |
| TC 完備 | 主 5 件 + 補助 3 件 | 達成 |

## 残課題（Phase 8 以降への申し送り）

- AC-4 の実テキスト追記は Phase 12（`claude-code-config.md` 編集）で実体化する
- AC-7 の `manual-smoke-log.md` 実記入は Phase 11 で本実施する
- AC-8 の 6 成果物は Phase 12 で生成する
- 実装そのものは別タスク（spec_created の境界）

## 主成果物

- `outputs/phase-7/main.md`（本ファイル / マトリクス）

## 完了条件

- [x] 全要件 F-1〜F-4 にトレースが付与
- [x] 全 AC AC-1〜AC-8 にトレースが付与
- [x] 未カバー 0 件
- [x] TC ⇄ 要件 ⇄ AC の双方向トレース表が存在

## 参照

- Phase 2: `outputs/phase-2/{main,settings-diff,alias-diff,whitelist-design}.md`
- Phase 3: `outputs/phase-3/{main,impact-analysis}.md`
- Phase 4: `outputs/phase-4/{main,test-scenarios}.md`
- Phase 6: `outputs/phase-6/main.md`
- index: `../index.md`
- 仕様: `phase-07.md`
