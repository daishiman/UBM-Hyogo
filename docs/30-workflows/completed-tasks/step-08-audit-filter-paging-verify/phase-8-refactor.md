# Phase 8: リファクタ（重複・drift 点検、無変更判定）

**[実装区分: 実装仕様書（`verify_existing`）]**

> 監査タスク用テンプレ（`phase-template-audit-task.md`）§Phase 8 を「**重複・navigation drift 削減**」から「**重複・drift 点検 → 無変更判定**」へ再解釈する。
> `verify_existing` のためリファクタ（コード変更）は行わない（NFR-5：`apps/` 差分ゼロ）。本 Phase の責務は「リファクタ候補を洗い出し、各候補が `After=Before（無変更）` であることと、その理由を `対象 / Before / After / 理由` テーブル形式（FB-RT-03）で記録すること」である。

## 1. リファクタ点検結果（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由（無変更判定の根拠） |
|---|------|--------|-------|------------------------|
| R-1 | PII masking の二段防御（API `redactAuditPayload`/`redactString` + UI `maskAuditJson`/`maskAuditText`） | 二段でマスク（API 一次 + UI 二次） | 同左（無変更） | 「重複」に見えるが**意図的な多層防御（defense in depth）**。API がマスク漏れしても可視 DOM に PII を出さない設計（Phase 2 §3）。統合すると単一障害点になりセキュリティが劣化するためリファクタ対象外 |
| R-2 | JST 変換の二箇所実装（UI `jstLocalToUtcIso` + API `jstInputToUtcIso`） | UI / API 双方に JST→UTC 変換 | 同左（無変更） | レイヤ境界（`apps/web`／`apps/api`）をまたぐ共有はパッケージ依存を増やす。各層が自境界で入力を正規化する責務分離は妥当。両者は `*.spec.*` で from=start・to=end-exclusive の一貫性が担保済み（FR-5）。共通化は新規依存導入となり不変条件（API 変更禁止）に抵触するため対象外 |
| R-3 | filter 7 項目の URL ↔ defaultValue 同期（`buildAuditApiPath` / `buildAuditHref` / form `defaultValue`） | 値整形が複数箇所に分散 | 同左（無変更） | URL を単一の真実源（state owner）とする設計（Phase 2 §5）。整形関数は責務が分離されており、抽出すると逆に追跡性が下がる。監査で「改善不要」判定済み |
| R-4 | `AuditLogPanel.tsx` の helper 群（`maskAuditJson` / `summarizeAuditJson` / `formatJst` / `AuditRow` / `JsonDisclosure`） | 同一ファイル内に co-locate | 同左（無変更） | コンポーネント固有 helper であり外部再利用なし。ファイル分割は import 経路を増やすだけで利点なし。423 行 spec が全 helper を直接 import してテスト済みで、分割の必要性なし |
| R-5 | primitive 利用（`FormField` / `Input` / `EmptyState` / `Pagination`） | 既存 UI primitive を再利用 | 同左（無変更） | 不変条件9（`FormField` 経由）/ プロトタイプ正本順位に整合。新規 primitive を生やさない方針どおりで drift なし |
| R-6 | cursor encode/decode（base64url JSON） | `encodeAuditCursor` / `decodeAuditCursor` | 同左（無変更） | contract spec が encode→decode round-trip と不正 cursor reject を担保（FR-2 / FR-4）。形式・命名（`{Name}Z` / `encode/decode{Resource}`）が既存規約に整合し drift なし |

> 全 6 項目で `After = Before`。リファクタによるコード変更は発生しない（NFR-5 維持）。

## 2. navigation / 命名 drift 点検

| 観点 | 点検内容 | 判定 |
|------|---------|------|
| 命名規約整合 | PascalCase コンポーネント / camelCase helper / `{Name}Z` schema / `create{Resource}Route` | drift なし（Phase 1 §3 と一致） |
| test suffix | 既存テストが `*.spec.*` のみ（`*.test.*` なし） | 不変条件8 維持・drift なし |
| import 経路 | admin form は `FormField` 経由 / admin mutation hook 非依存（read-only） | 不変条件9・10 に整合（mutation surface なし） |
| route 構造 | `/(admin)/admin/audit` の page / loading / util 配置 | プロトタイプ・既存 admin route 群と整合・drift なし |

## 3. 重複点検の総合判定

| 重複候補 | 「真の重複」か | 措置 |
|----------|---------------|------|
| PII masking（R-1） | No（意図的多層防御） | 無変更 |
| JST 変換（R-2） | No（レイヤ境界の責務分離） | 無変更 |
| 値整形分散（R-3） | No（URL single source of truth） | 無変更 |

> 「真の重複（削減すべき冗長）」は 0 件。検出された重複はすべて設計意図（多層防御・レイヤ責務分離）に基づくものであり、削減はセキュリティ・保守性の劣化を招くためリファクタ対象外。

## 4. 無変更の証跡（Phase 5 / Phase 11 と連動）

```bash
# リファクタ未実施 = apps/ 差分ゼロ
git status --short -- apps packages    # 空であること（NFR-5）
git diff -- apps packages              # 空であること（NFR-5）
git status --short                     # workflow docs + aiworkflow sync のみ
```

> 本 Phase は `apps/` / `packages/` コードを一切変更しない。上記コマンドでアプリ差分が「空」を返すことが Phase 8 の成果（無変更判定の証跡）であり、Phase 5（diff 確認）と Phase 11（再現コマンド実行）で再確認する。

## 5. 完了条件（Phase 8 DoD）

- [ ] リファクタ点検を `対象 / Before / After / 理由` テーブル（§1、FB-RT-03）で記録し、全項目 `After=Before（無変更）` とした。
- [ ] PII 二段防御を「意図的多層防御でリファクタ対象外」と理由付きで記録した（R-1）。
- [ ] navigation / 命名 drift 点検（§2）で drift 0 件を確認した。
- [ ] 「真の重複」0 件の総合判定（§3）を記録した。
- [ ] 無変更の証跡コマンド（§4）を示し、`apps/` 差分ゼロ（NFR-5）を維持する旨を明記した。
