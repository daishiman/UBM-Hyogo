# Phase 3: 設計レビュー（Phase 4 進行可否ゲート / Gate-A）

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点が固定されているか | PASS | 論点 = read-only / mutation 副作用境界の正確な判定（Phase 2 §2.0）|
| 責務境界・状態所有権 | PASS | spec ファイルのみ新規所有。基盤（project/mint/CI）は issue-1077 所有で不変。プロダクトコード不変 |
| 価値とコストの均衡 | PASS | 価値=5 画面実機回帰検出 / コスト=雛形コピー 5 本。不均衡なし |
| 4 条件（価値性/実現性/整合性/運用性）| PASS | Phase 2 §2.0 で 4 条件全て ○ |
| selector / heading の実在性 | PASS | 5 画面全ての heading・data 属性を実コードで検証（下表）|
| 副作用境界の網羅性 | PASS | 5 画面の mutation トリガーを列挙し、spec 非クリック + ガード assertion で遮断（Phase 2 §2.3）|
| CONST_007（今サイクル完了）| PASS | read-only 5 画面を今サイクルで完了。mutation result は恒久境界として C-1 系へ根拠付き分離 |

### selector / heading 実コード検証結果（2026-06-07）

| route | heading（AdminPageHeader title → role=heading）| 安定 container selector | 実コード |
| --- | --- | --- | --- |
| `/admin/audit` | `監査ログ` | `[data-component="admin-audit"]` | `apps/web/src/components/admin/AuditLogPanel.tsx:188` / `app/(admin)/admin/audit/page.tsx:66` |
| `/admin/requests` | `依頼キュー` | `[aria-labelledby="admin-requests-filter-h"]`（filter region 常時）| `apps/web/src/components/admin/RequestQueuePanel.tsx:151,154` |
| `/admin/identity-conflicts` | `Identity 重複候補` | `section[data-route="admin"]`（常時）| `app/(admin)/admin/identity-conflicts/page.tsx:38` |
| `/admin/schema` | `スキーマ差分のレビュー` | `[data-page="admin-schema"]` | `app/(admin)/admin/schema/page.tsx:138,141` |
| `/admin/meetings` | `開催日 / 出席管理` | `[aria-label="開催 KPI"]`（KPI group 常時）| `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx:237` / `app/(admin)/admin/meetings/page.tsx:21` |

> 注: 一覧/リスト container（`依頼一覧` ul / `Identity 重複候補一覧` ul）は D1 データ有無で empty state に切り替わるため、
> spec の安定待機は **AdminPageHeader 由来の heading（常時描画）** を主とし、上表 container は補助とする。

## 3.2 リスクと残課題

| リスク | 対策 | 残課題化 |
| --- | --- | --- |
| read-only と判断した画面が実は mutation を誘発 | 各 spec は goto → assert → screenshot のみで mutation 要素を**操作しない**。ガード assertion（mutation result/modal/toast の count 0）で証跡化 | なし |
| staging D1 が空で画面が empty state を撮る | heading 待機で画面到達は保証。empty/populated いずれも有効な visual baseline（回帰検出目的）| なし（execution 時に baseline 確定）|
| screenshot baseline drift | snapshot 名を canonical 化（Phase 5 §5.2）し 5 spec で一貫 | なし |

## 3.3 ゲート判定

**Gate-A: PASS** — Phase 4（テスト作成）へ進行可。設計 backbone（Phase 1-3）完成。
5 spec の canonical 名・selector・副作用境界が確定し、4 条件評価 PASS。
