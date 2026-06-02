# スキルフィードバックレポート — issue-229-indexes-rebuild-fail-fast

> task-specification-creator Phase 12 の必須成果物（改善点なしでも必須出力）。本タスク（NON_VISUAL / tooling / implemented_local_evidence_captured）の遂行で気づいた skill テンプレ改善観点を記録する。

## 1. task-specification-creator への観点

| # | 観点 | 内容 | 種別 |
| --- | --- | --- | --- |
| F-1 | NON_VISUAL tooling の Phase 11 代替証跡パターン | UI/UX のない CLI tooling タスクでは Phase 11 スクリーンショットが原理的に存在しない。代替証跡 = (a) CLI 回帰 smoke の `manual-test-result.md`（exit code + byte-identical drift 0）、(b) 自動テスト（vitest）の 2 系統に統一すると、`implementation-guide.md` の `## 視覚証跡` 記述が機械的に書ける。テンプレに「NON_VISUAL 代替証跡 2 系統」を例示として明記すると漏れが減る | 提案 |
| F-2 | 実装状態の判定 suffix | `phase12-task-spec-compliance-check.md` の各 AC/Step 判定に `implemented_local_evidence_captured` suffix を必須化すると、仕様書だけで閉じる drift FAIL を構造的に防げる。canonical 9 見出しと並んで suffix 規約をテンプレに固定すると良い | 提案 |
| F-3 | Phase 11 evidence テーブル列見出し | `## 4. Phase 11 evidence file inventory` の列見出しが `Classification` / `Path` / `Status` の逐語一致を要求される点は、テンプレ側にサンプル行（spec-only は `n/a`）を載せると CI gate の落とし穴を回避しやすい | 提案 |

## 2. aiworkflow-requirements への観点

| # | 観点 | 内容 | 種別 |
| --- | --- | --- | --- |
| F-4 | generate-index.js の resilience | 本タスクが対象とする `generate-index.js` 自身が、index 生成途中失敗で部分書き込みを残しうる点は skill ledger 運用の安全網の穴。本タスクの hardening が landing すれば aiworkflow-requirements の index 再生成が decisive になる（メタ的フィードバック・本タスクで解決予定） | 記録のみ |

## 3. 改善点総括

- 致命的な skill テンプレ欠陥は **なし**。
- F-1〜F-3 はいずれも「NON_VISUAL tooling タスク向けのテンプレ例示追加」という同系統の改善で、テンプレに 1 セクション足すだけで複数タスクの再現性が上がる。
- 本レポートは改善点の有無に関わらず必須出力であり、上記のとおり出力済み。
