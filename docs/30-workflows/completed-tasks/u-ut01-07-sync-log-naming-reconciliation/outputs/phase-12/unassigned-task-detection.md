# Phase 12 未割当タスク検出レポート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 |
| 作成日 | 2026-04-30 |
| taskType | docs-only-design-reconciliation |
| 検出件数 | **1 件**（UT-09 実装受け皿未確定） |

---

## 結論

本ワークフロー（U-UT01-07）から派生する **新規 unassigned task は 1 件**。

設計 reconciliation 自体の派生作業は既存の下流タスクまたは直交タスクに包含される。ただし、canonical 名のコード参照実装を受ける UT-09 implementation task の実パスが現ワークツリーで確認できなかったため、受け皿確定だけを follow-up として formalize する。

---

## SF-03 設計タスク 4 パターン照合

設計タスク特有の未タスク検出パターンを照合した結果:

| パターン | 該当 | 説明 |
| --- | --- | --- |
| **型定義 → 実装** | 該当（follow-up 化） | canonical 名を実装で参照 → UT-09 実装受け皿が未確定のため `U-UT01-07-FU01` を作成 |
| **契約 → テスト** | 該当（既存タスクへ委譲） | reconciliation 結果の D1 schema 確定 → UT-04 既存タスクで包含 |
| **UI 仕様 → コンポーネント** | 非該当 | 本タスクは UI を持たない（NON_VISUAL） |
| **仕様書間差異 → 設計決定** | **本タスクで解決済** | `sync_log`（論理） vs `sync_job_logs` / `sync_locks`（物理）の差異を本タスクで canonical 決定 |

---

## 委譲先一覧（新規起票しない理由）

| 検出項目 | 種別 | 委譲先 | 起票しない理由 |
| --- | --- | --- | --- |
| `idempotency_key` の物理追加判定 | 設計 / 実装 | **UT-04（D1 データスキーマ設計）既存** | UT-04 のスコープに「論理設計の物理化判定」が含まれるため、新規起票不要 |
| `processed_offset` の物理追加判定 | 設計 / 実装 | **UT-04 既存** | 同上 |
| `status` / `trigger` enum 値 canonical 決定 | 設計 | **U-UT01-08（enum 統一）既存** | 直交タスクとして既に独立起票済 |
| `DEFAULT_MAX_RETRIES` / resume 戦略 | 設計 | **U-UT01-09（retry / offset 統一）既存** | 直交タスクとして既に独立起票済 |
| canonical 名のコード参照実装 | 実装 | **U-UT01-07-FU01** | UT-09 実装タスクの実パスが確認できないため、受け皿確定を新規 formalize |
| `database-schema.md` への DDL 反映 | docs | **UT-04 同期 PR / 別途 doc-only PR** | 物理整合と並行適用のほうが drift リスクが低いため、本タスクでは diff plan のみ |
| shared `Zod` schema 実装 | 実装 | **U-10（shared 契約）既存** | shared 契約実装は U-10 スコープ |

---

## 起票見送り（起票候補だが採否判断で却下）

| 候補 | 採否 | 理由 |
| --- | --- | --- |
| 「`sync_log` view 化」専用タスク | **見送り** | 後方互換戦略比較表で view 化を却下したため、独立タスク起票は不要 |
| 「物理 rename」タスク | **見送り** | 採択戦略 = no-op（rename しない）のため不要 |
| 「sync 系 enum 統一」追加タスク | **見送り** | U-UT01-08 既存で包含済 |

---

## Phase 10 MINOR 追跡

| MINOR ID | 指摘内容 | 解決Phase | 解決確認Phase | 解決方法 | ステータス |
| --- | --- | --- | --- | --- | --- |
| (該当なし) | - | - | - | - | - |

> 本ワークフローは設計 reconciliation のみで、Phase 10 で MINOR 判定された指摘は無い前提（実 Phase 10 実行時に追記）。

---

## 新規 formalized task

| ID | パス | 理由 |
| --- | --- | --- |
| U-UT01-07-FU01 | `docs/30-workflows/unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md` | UT-09 implementation task path が未確認のため、canonical 名の実装反映受け皿を確定する |

---

## 配置先確認

新規未タスク指示書 1 件を配置済み。

委譲先タスクの実在確認:

- `docs/30-workflows/ut-04-d1-schema-design/` — **存在**（実在 workflow）
- `docs/30-workflows/unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md` — **存在**（UT-09 実装受け皿確定 follow-up）
- `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` — **存在**
- `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` — **存在**

---

## summary

- 新規起票: **1 件**
- 既存タスクへの委譲: 6 項目
- 起票見送り: 3 項目
- 設計タスク特有の全タスク実装化パターン: **本タスクは設計 reconciliation のみ**。実装派生そのものは本タスク外だが、UT-09 実装受け皿が未確定だったため、受け皿確定のみ `U-UT01-07-FU01` として分離した。
