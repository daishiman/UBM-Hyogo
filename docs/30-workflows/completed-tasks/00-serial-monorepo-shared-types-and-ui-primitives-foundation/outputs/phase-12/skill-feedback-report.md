# Phase 12 / skill-feedback-report.md — Skill フィードバックレポート

## 対象 Skill

`task-specification-creator` skill

## フィードバックサマリ

Wave 0 のような「scaffold（骨格作り）タスク」に 13 フェーズ構造を適用した際に得られた知見。

## 良かった点

| 観点 | 内容 |
| --- | --- |
| フェーズゲート | Phase 10 の GO/NO-GO 判定が、「この Wave で何が決まり何が残るか」を整理する良い機会になった |
| AC 明示 | Phase 7 の AC 検証により、「空 module が意図的であること」を文書で証明できた |
| 不変条件マッピング | 各 Phase に不変条件の適用マッピングがあることで、後続 Wave への引き継ぎが明確になった |
| 中学生説明（Phase 12） | Part 1 の例え話を書くことで、「なぜ型の置き場所が必要か」を整理できた |

## 改善提案

| ID | 提案内容 | 重大度 |
| --- | --- | --- |
| FB-01 | scaffold タスク用フラグ（`implementation: false`）があると、「空実装が意図的である」旨をテンプレートで示しやすい | MINOR |
| FB-02 | Phase 5「コア実装」で「実装なし（docs only）」を明示するためのテンプレート節があると良い | MINOR |
| FB-03 | Wave マトリクス（`_design/phase-2-design.md`）と task spec の依存関係を自動検証する仕組みがあると整合性チェックが楽になる | LOW |

## 苦戦箇所（将来の課題解決に向けた記録）

| 課題 | 詳細 | 解決策 |
| --- | --- | --- |
| 空モジュールと AC の整合 | 「実装がない」のに AC を「PASS」とするのは矛盾に見えるが、「骨格の確立」が AC だと定義することで解消 | Phase 1 の真の論点定義で AC を「骨格の存在確認」に絞り込む |
| pnpm workspace の path 解決 | `packages/shared` を `@ubm-hyogo/shared` として import させるには tsconfig paths と pnpm-workspace.yaml の両方の設定が必要。片方だけでは動かない | 両ファイルを同時に設定し、`pnpm install` 後に `pnpm typecheck` で確認 |
| lint-boundaries の Node API | `import.meta.resolve` が Node 22 未満では動作しないため、Node 24 必須 | `mise exec --` 経由で実行することで回避 |

## 完了条件

- [x] 良かった点を列挙
- [x] 改善提案を具体的に記述
- [x] 苦戦箇所を将来の解決に役立つ粒度で記述
