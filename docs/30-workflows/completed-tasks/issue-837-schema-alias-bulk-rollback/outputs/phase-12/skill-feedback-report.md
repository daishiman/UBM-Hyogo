# スキルフィードバックレポート — issue-837-schema-alias-bulk-rollback

Phase 12 Task 5。改善点なしでも出力必須。task-specification-creator skill を本タスク（`implemented_local_evidence_captured` / UI task / VISUAL）に適用した際の運用上の気づきを記録する。

## 有効だった点

| 観点 | 内容 |
| --- | --- |
| テンプレート workflow の構造複製 | 兄弟参照 workflow #776（bulk resolve）の client-side bounded fan-out 構造を rollback 用にそのまま複製できた。`postSchemaAliasBulk` → `rollbackSchemaAliasBulk`、`SchemaAliasBulkRowResult` → `SchemaAliasRollbackBulkRowResult`、`SchemaDiffBulkResolveModal` → `SchemaDiffBulkRollbackModal`、`useSchemaDiffBulkSelection` → `useSchemaDiffBulkRollbackSelection` の 1:1 対応が成立し、設計の不確実性を大幅に削減できた |
| 命名一貫性表（FB-SDK-07-4） | Phase 1 で既存 #776 命名と新規命名を 1:1 で固定する表を作ったことで、Phase 2 以降の型名・component 名・hook 名の設計衝突を未然に防げた。`rollbackSchemaAliasBulk` が `postSchemaAliasBulk` と対称になる命名根拠が明確 |
| アーキテクチャ決定表（index.md） | 元 unassigned-task spec の「苦戦箇所」（transaction 境界 / version mismatch 応答 / audit 粒度 / Workers timeout / 誤操作防止）を確立済みパターンへの決定として明示でき、per-alias 独立 commit の採用理由と全件 atomic 不採用理由を Phase 12 implementation-guide まで一貫して引用できた |
| CONST_004/005 の再判定 | `implementation` task を仕様書だけで閉じていた矛盾を検出し、同サイクルで実コード・focused tests・正本仕様同期へ昇格できた |
| VISUAL 証跡 canonical 名の事前固定（FB-VISUAL-CAP-001） | `bulk-rollback-{select,modal,partial-failure,success}-*.png` を artifacts.json の `planned_visual_evidence_files` で先に固定したことで、implementation-guide の screenshot 参照と完全一致させられた |

## 改善余地（軽微）

| 観点 | 内容 |
| --- | --- |
| 補助証跡ファイル名の表記ゆれ | 当初 `phase-09-quality-assurance.md` が NFR-5 証跡を `outputs/phase-11/nfr5-performance.md` と記載していたが、`artifacts.json` の planned 名は `perf-30rows.md` で不一致だった。本 Phase 12 で phase-09 / phase-11 / artifacts の canonical を `perf-30rows.md` に統一済み。証跡ファイル名を task root 生成時に 1 箇所で固定すると、この種の表記ゆれを防げる（テンプレート横展開時の SSOT 候補） |

## 結論

テンプレート workflow（#776）の構造複製と命名一貫性表が本タスクの設計効率を大きく高めた。重大な skill 改善要求はなし。ただし `implementation` task を `spec_created` で閉じる記述を検出した場合は、Phase 12 中に current facts へ即時再分類する運用を継続する。
