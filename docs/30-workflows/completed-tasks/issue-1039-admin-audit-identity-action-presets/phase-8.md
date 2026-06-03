# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]**。Phase 4-7 の TDD・実装・テスト拡充・カバレッジ確認完了後に、重複排除・責務明確化・保守性向上を目的とした最小差分リファクタリングを行う。**新規機能追加・振る舞い変更は禁止。** リファクタリング前後でテストが全件 PASS であることを各変更の受入基準とする。本タスクは単一ファイル（`AuditLogPanel.tsx`）の小改修であり、結論として **リファクタ不要（YAGNI）** と判定する。以下にその根拠と判定基準を `対象/Before/After/理由`（FB-RT-03）で明示する。

---

## 対象変更一覧（FB-RT-03 テーブル形式）

### RT-001 — datalist option の定数配列抽出（条件付き・**初回は実施しない**）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Before | `<datalist id="audit-action-presets">` 内に `<option value="identity.merge" />` / `<option value="identity.dismiss" />` を inline 直書き（2 値） |
| After（将来条件付き） | option が **3 値以上**に増える場合に限り、`const AUDIT_ACTION_PRESETS = ["identity.merge", "identity.dismiss", ...] as const;` を同ファイル先頭に宣言し、`AUDIT_ACTION_PRESETS.map((v) => <option key={v} value={v} />)` へ抽出する |
| 理由 | Phase 3 M-2 の決定に従う。**初回 2 値では inline 直書きを維持し、定数配列 + `.map()` 抽出は行わない（YAGNI = 過剰抽象化の回避）**。2 値の inline は重複コストより可読性が勝り、抽象化は将来 3 値以上に増えて重複が顕在化した時点で初めて正当化される |
| 判定基準（抽出を実施するトリガ） | option 数 ≥ 3 になる変更が同サイクルに含まれる場合のみ。本サイクルは 2 値固定のため **スキップ（YAGNI により不実施）** |
| 確認コマンド | `grep -c '<option value="identity' apps/web/src/components/admin/AuditLogPanel.tsx` — 期待値 `2`（inline 2 option のまま。3 以上になっていない＝抽出トリガ未到達） |

---

### RT-002 — duplicate / navigation drift の確認（本サイクルは drift なし）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Before | datalist 追加が単一箇所（action `<Input>` 周辺）に閉じている |
| After | 変更なし（drift がないことを確認するのみ） |
| 理由 | datalist の `id="audit-action-presets"` と input の `list="audit-action-presets"` の対応が同一ファイル内の隣接箇所に閉じており、複数箇所への重複定義・別コンポーネントへの分散（navigation drift）が発生しない。`buildAuditHref` も無変更で、import 追加・型アサーション増殖もない |
| 確認コマンド | `grep -rn "audit-action-presets" apps/web/src apps/web/app` — ヒットは `AuditLogPanel.tsx` 内の `id` 定義 1 件 + `list` 参照 1 件のみ（他ファイルへの drift 0 件）を期待 |

---

### RT-003 — unused import / lint drift の除去（自動修正のみ・必要時）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Before | 実装時に unused import・不要な型アサーションが残っている可能性 |
| After | `pnpm lint --fix` で自動修正可能な ESLint 違反を解消。残る手動修正のみ最小差分で対応 |
| 理由 | Phase 9 の lint green を事前通過させ修正ループを回避する。datalist 追加は新規 import を基本的に増やさない（`<datalist>` / `<option>` は標準 DOM 要素）ため、drift があっても軽微 |
| 確認コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 \| grep -E "error\|warning"` — リファクタリング後にエラー 0 件を確認 |

---

## リファクタリング実施順序

1. RT-001（定数配列抽出）→ **スキップ（option 2 値・YAGNI）**。`grep -c '<option value="identity'` が `2` であることを確認し、完了条件に「スキップ（重複なし・2 値固定）」と記録。
2. RT-002（drift 確認）→ `grep -rn "audit-action-presets"` で drift 0 件を確認。変更なし。
3. RT-003（import / lint drift）→ `pnpm lint --fix` で自動修正。修正があれば `pnpm --filter @ubm-hyogo/web test:unit` PASS を確認。

> **注意**: 本タスクは単一ファイルの静的 JSX 追加であり、構造的にリファクタ対象（重複・責務混在・レイヤー越境）が発生しない。RT-001 は将来 3 値以上に増えた時の判断基準を記録するための条件付き項目であり、本サイクルでは適用しない。

---

## リファクタリング禁止事項

- `buildAuditHref`（AuditLogPanel.tsx:91-107）の変更（振る舞い変更）
- `name="action"` / URL query 契約の変更
- action `<Input>` の `<select>` 化・値制約化（AC-3 違反 = 自由入力を殺す）
- server component 構成・SSR `defaultValue` 復元経路の変更
- `apps/web/src/components/admin/` 配下での直接 `<input>` 増設（不変条件 #9）
- 新規 primitive コンポーネントの追加（不変条件 #3: 既存 primitive 拡張のみ）
- テストファイル名の変更（artifact canonical 名 = Phase 1 で確定済み）

---

## 完了条件（Phase 8）

- [ ] RT-001: datalist option が inline 2 値のまま（`grep -c '<option value="identity'` = `2`）であり、定数配列抽出は **YAGNI によりスキップ**と記録している（option < 3 のため抽出トリガ未到達）
- [ ] RT-002: `audit-action-presets` のヒットが `AuditLogPanel.tsx` の `id` 定義 + `list` 参照のみで、他ファイルへの drift が 0 件である
- [ ] RT-003: `pnpm --filter @ubm-hyogo/web lint` でエラー 0 件
- [ ] リファクタリング（実質 lint --fix のみ）後に `pnpm typecheck` PASS（全 workspace）
- [ ] リファクタリング後に `AuditLogPanel.component.spec.tsx` が全件 PASS（振る舞い不変）
- [ ] `<input>` を直接増やしていない（datalist は input ではない・不変条件 #9）
- [ ] `*.test.{ts,tsx}` ファイルが増えていない（不変条件 #8）

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
単一ファイルの静的 JSX 追加に対し、過剰抽象化（2 値の定数配列化）を避けつつ、drift / import の軽微な乱れのみを最小差分で整える。

## 実行タスク
- RT-001 を YAGNI でスキップ判定し、抽出トリガ（option ≥ 3）を記録する。
- drift 0 件と lint green を確認する。

## 参照資料
- `phase-5.md`
- `phase-7.md`
- `phase-3.md`（M-2: 初回 2 値は inline・増加時のみ抽出）

## 成果物
- Phase 8 リファクタリング仕様（結論: リファクタ不要 = YAGNI）

## 統合テスト連携
Phase 4-7 のテストを維持したまま（振る舞い不変で）refactor 判定を完了する。
