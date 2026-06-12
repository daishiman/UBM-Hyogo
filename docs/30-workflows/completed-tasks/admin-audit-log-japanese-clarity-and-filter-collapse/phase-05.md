[実装区分: 実装仕様書]

# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 4（テスト作成・Red 設計） |
| 下流 | Phase 6（テスト拡充） |
| 状態 | completed |

## 目的

Phase 4 で設計したテストケース（TC-XX）を Green にする、`/admin/audit`（監査ログ）画面の **日本語化 + フィルタ段階開示 + カード整列** を実装する。具体的には (1) `auditGlossary.ts` に SSOT §4 C1 のラベルマップ（`AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS`）と 3 つの describe helper を追加、(2) `AuditLogPanel.tsx` のフォームラベルを `describeAuditField(key)` 経由の日本語へ置換し「常時表示」5 項目 + `<details>`「詳細な絞り込み」3 項目の 2 層へ再構成、(3) `AuditLogCard.tsx` の `action` / `targetType` / `auditId` ラベルを日本語化、(4) `auditAppliedFilters.ts` のチップ label / value を describe helper 経由で日本語化、(5) `globals.css` に `.chip-row` の wrap 明示・`.admin-audit-glossary` / `.admin-audit-card__meta` の整列・`.admin-audit-filter-advanced`（details）スタイルを全て `var(--ubm-*)` トークンで追加する。**API / D1 / Google Form / shared 型は一切変更せず（AC-9）、`<input name>`（= query param キー）は英語のまま維持する（API 契約）。新規 primitive 追加ゼロ（AC-10）。HEX 直書きゼロ（AC-8）**。本 Phase の手順は後続実装者がそのまま着手できる粒度で `outputs/phase-05/runbook.md` に記述する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装方針概要 + 変更対象ファイル / signature / 入出力副作用 / テスト方針 / 検証コマンド / DoD |
| ドキュメント | outputs/phase-05/runbook.md | 後続実装者向け実装手順書（新規/修正ファイルパス一覧 / 各ファイル Before→After / glossary コード / CSS / 検証） |
| メタ | artifacts.json | Phase 5 を completed に維持 |

## 実行タスク

1. **実装方針概要の確定**: `outputs/phase-05/main.md` に変更対象ファイル一覧・helper signature・入出力/副作用・テスト方針・検証コマンド・DoD を集約する。
2. **runbook 作成**: `outputs/phase-05/runbook.md` に「新規/修正ファイルパス一覧テーブル（[Feedback RT-03]）」「各ファイル Before の該当箇所 → After の変更内容」「`auditGlossary.ts` に追加する SSOT §4 C1 のコードそのまま」「`AuditLogPanel.tsx` の 2 層段階開示の JSX 構造」「`globals.css` 追加クラス（全色 token・HEX ゼロ）」「ローカル検証コマンド（SSOT §9 転記）」を書く。
3. **未登録 raw fallback の理由明記**: `describeAuditAction` / `describeAuditTargetType` が未登録コード時に生コードを返す理由（情報欠落防止の安全弁）をコメントとして runbook に記載する。
4. **API 契約の保護手順**: `<input name>` / `buildAuditHref` の `set(key, ...)` キー名 / datalist の `id` を変更しないことを runbook に明記する。
5. **検証コマンドの確定**: typecheck / lint / verify:tokens / vitest 対象限定 / apps/api・packages/shared diff ゼロ を runbook に書く。jsdom は CSS を評価しないため CSS 検証はクラス付与（構造）に限定する旨を注記する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md §4 | C1/C2/C3 の実装方針・glossary コードそのもの |
| 必須 | _shared-context.md §5 | AC-1〜AC-12（Green 化対象） |
| 必須 | _shared-context.md §6 | 変更対象ファイル一覧 |
| 必須 | _shared-context.md §9 | ローカル検証コマンド正本 |
| 必須 | outputs/phase-04/test-plan.md | Green 化対象 TC-XX / 追加 spec パス |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | `FormField` / `Input` / `Select` / `Chip` / ネイティブ `<details>` の再利用（新規 primitive 非追加） |
| 実装パターン | `.claude/skills/aiworkflow-requirements/references/architecture-implementation-patterns-core.md` | server component / 表現層の責務境界 |

## 実行手順

### ステップ 1: 実装方針概要（main.md）

- `outputs/phase-05/main.md` に変更対象ファイル一覧・helper signature・入出力副作用・テスト方針・検証コマンド・DoD を集約する。

### ステップ 2: runbook（runbook.md）

- 新規/修正ファイルパス一覧テーブル → 各ファイル Before→After → glossary 追加コード → `AuditLogPanel` 2 層 JSX → `globals.css` 追加 → 検証コマンド の順で書く。

### ステップ 3: 後続実装者の着手保証

- runbook 単体で「どのファイルのどの行をどう変えるか」が自明であること（既存 shared 型のみ使用 / 新規型ゼロ / `<input name>` 不変）を確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-XX を Green 化する実装単位を runbook の各ファイルにマップ |
| Phase 6 | fail path（未登録 action raw fallback / targetType=null / details 開閉 / チップ非表示）の前提を提供 |
| Phase 7 | AC × TC × 実装ファイルのトレーサビリティ起点 |
| Phase 9 | typecheck / lint / verify:tokens / vitest / diff ゼロ を実行 |
| Phase 11 | VISUAL タスクの screenshot 取得（日本語ラベル / 2 層フィルタ / カード整列） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| API/D1/shared 不変 | AC-9 / invariant #5 | `apps/api/**` / `packages/shared/**` の diff ゼロ。`<input name>` / query param キー不変 |
| 新規 primitive ゼロ | AC-10 / invariant #3 | `components/ui/` への追加なし。`<details>` はネイティブ |
| HEX ゼロ | AC-8 / invariant #2 | `globals.css` 追加分が全て `var(--ubm-*)`。HEX / `bg-[#xxx]` / `text-[#xxx]` なし |
| raw fallback の安全弁 | AC-3 | `describeAuditAction` が未登録時のみ生コードを返す（throw しない） |
| 段階開示の既定 open | AC-2 | 詳細フィルタ 3 項目に値があれば `<details open>` |
| 挙動不変温存 | AC-12 | 検索 / リセット / ページネーション / PII マスク / JSON 開示 / エラーメッセージが不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装方針概要 | 5 | completed | main.md |
| 2 | 新規/修正ファイルパス一覧 | 5 | completed | runbook（[Feedback RT-03]） |
| 3 | `auditGlossary.ts` ラベルマップ + helper | 5 | completed | C1 / raw fallback コメント |
| 4 | `AuditLogPanel.tsx` 2 層段階開示 | 5 | completed | C2 / `<details>` |
| 5 | `AuditLogCard.tsx` / `auditAppliedFilters.ts` 日本語化 | 5 | completed | C1/C3 |
| 6 | `globals.css` 整列（HEX ゼロ） | 5 | completed | C3 / token のみ |
| 7 | 検証コマンド + jsdom CSS 注記 | 5 | completed | runbook |

## 完了条件

- [ ] `outputs/phase-05/main.md` に変更対象ファイル / helper signature / 入出力副作用 / テスト方針 / 検証コマンド / DoD が集約されている
- [ ] `outputs/phase-05/runbook.md` に新規/修正ファイルパス一覧テーブル（[Feedback RT-03]）が記載されている
- [ ] 各ファイルの「Before の該当箇所 → After の変更内容」が具体的に記載されている
- [ ] `auditGlossary.ts` に追加する SSOT §4 C1 のコード（3 ラベルマップ + 3 helper）がそのまま記載され、未登録 raw fallback の理由がコメント明記されている
- [ ] `AuditLogPanel.tsx` の常時表示 5 項目 + `<details className="admin-audit-filter-advanced">` 3 項目の 2 層構造と `open` 既定（詳細 3 項目に値あり）が記載されている
- [ ] `<input name>` / datalist `id` / `buildAuditHref` キー名が不変であることが明記されている
- [ ] `globals.css` 追加クラス（`.chip-row` / `.admin-audit-glossary` / `.admin-audit-card__meta` / `.admin-audit-filter-advanced`）が全て `var(--ubm-*)` で記述され HEX ゼロである
- [ ] ローカル検証コマンド（SSOT §9 転記）と jsdom CSS 非評価の注記が記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-05/{main,runbook}.md` が配置済み
- [ ] runbook が後続実装者の着手保証粒度（Before→After 行特定 / 新規型ゼロ / name 属性不変）を満たしている
- [ ] AC-8 / AC-9 / AC-10 が runbook 上で機械検証可能（HEX grep / diff ゼロ / primitive 追加なし）になっている
- [ ] Phase 4 の全 TC-XX が runbook のどのファイル変更で Green になるか対応づけられている
- [ ] artifacts.json の Phase 5 ステータスが completed に整合している

## 次Phase

- 次: Phase 6（テスト拡充）
- 引き継ぎ事項: runbook の変更ファイル / describe helper の raw fallback 分岐 / details 開閉条件 / 検証コマンド
- ブロック条件: AC-8/9/10 のいずれかが runbook で保証できない場合は Phase 2（設計）に戻る
