# Phase 9: QA

> **実装区分: 実装仕様書** — implemented_local_runtime_pending 段階の QA 観点（line budget / link / mirror parity / コード差分）を定義する。

## 9.0 本タスクの QA 前提

- 本タスクは **implemented_local_runtime_pending**。Phase 9 時点で **apps/web の Playwright spec 差分はあり、apps/web 本番ソース・apps/api・D1・Form の差分は無い**。
- したがって Phase 9 QA は **仕様書の整合性 QA**（doc QA）と、local/runtime 検証コマンドの **境界定義** に分かれる。

## 9.1 doc QA（implemented_local_runtime_pending で今やる）

| 観点 | 内容 | 判定 |
| --- | --- | --- |
| line budget | 各 phase ファイル 50〜120 行程度。本仕様群はいずれも閾値内 | 目視 + `wc -l` |
| link 整合 | index.md の phase-6..10 リンクが実ファイルと一致 | リンク先存在確認 |
| canonical 名一致 | `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` が phase-6 / phase-8 / phase-11 / implementation-guide / artifacts `canonical_screenshots` で完全一致（AC-4） | 文字列 grep 照合 |
| mirror parity | workflow root の `artifacts.json` と `outputs/artifacts.json` が byte 一致 | `diff` / md5 |
| セレクタ実在 | spec が使う locator が実コードに存在（`aria-label="一括操作"` / `"タグ一括付与・解除"` / `"付与モード"` / `aria-label="{fullName} を選択"` / `data-testid="admin-members-row-{id}"` / `data-testid="bulk-tag-result"`） | apps/web grep 済み（Phase 6/8 で確認） |
| 不変条件 | apps/api・apps/web ソース・D1・Form 非変更を宣言（AC-7） | スコープ宣言 |

## 9.2 検証コマンド

以下を検証コマンドとする。認証付き staging Playwright だけは secret / baseline 更新を伴うため user-gated。

| コマンド | 目的 | 期待 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | 新 spec の型整合（Playwright `Page` 型等） | exit 0 |
| `mise exec -- pnpm lint` | lint（HEX 直書きなし・spec 命名） | exit 0 |
| focused vitest（`BulkActionBar.spec.tsx`） | 機能本体の回帰（apps 非変更ゆえ無変更緑） | TC-BAB-TAG-01..05 + a11y PASS |
| 認証付き staging Playwright（`staging-visual-authenticated` project / 新 spec） | baseline snapshot 生成 | assign / unassign 2 baseline 生成・mutation 0 |

> **注意**: staging Playwright は user-gated。local typecheck / lint / focused vitest は本 wave の検証対象。

## 9.3 削除ファイル

- **削除ファイルなし**。新 spec の追加のみ。既存 `issue1036-bulk-member-tags.spec.ts`（local fixture）は **残置**（local 担保として価値が残るため削除しない）。

## 9.4 リスクと緩和（QA 観点）

| リスク | 緩和 |
| --- | --- |
| staging seed の member/tag 不足で空 baseline | FP-01..03 の前提 guard で snapshot 前に明示 fail（Phase 6） |
| 誤って apply を押し staging D1 を汚す | `bulk-tag-result` count 0 assert + apply 非 click のコードレビュー（Phase 6/8） |
| canonical 名のドリフト | `SNAP` const 集約 + artifacts ledger 照合（Phase 8 / §9.1） |
| storageState 出力先ドリフト | 既存 authenticated spec と同一 path 採用（Phase 8） |

## 9.5 完了条件（Phase 9）

- doc QA 観点（line budget / link / canonical / mirror parity / セレクタ実在 / 不変条件）が定義されている
- local / runtime 検証コマンドが定義され、staging Playwright の user-gated 境界が明記されている
- 削除ファイルなしが明記されている
