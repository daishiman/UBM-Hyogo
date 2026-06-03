# Phase 9: 品質保証

> **[実装区分: 実装仕様書]**。Phase 8 完了後、実装全体に対して一括品質ゲートを実行する。各 gate のコマンドと PASS 基準を明記し、line budget / lint / typecheck / 既存テスト非退化を一括判定する。1 つでも FAIL があれば修正してから次 Phase に進む。本タスクは UI 小改修（datalist 追加・単一ファイル）であり、**ファイル削除を伴わないため削除確認は N/A（FB-UI-02-1）**。

---

## QA-001 — TypeScript 型チェック全 workspace

```bash
mise exec -- pnpm typecheck
```

**PASS 基準**: 全 workspace（`@ubm-hyogo/api`・`@ubm-hyogo/web`・`@ubm-hyogo/shared`）でエラー 0 件。

**FAIL 時の対処**: エラーメッセージを確認し、unused import・型注釈不整合を最小差分で修正する。datalist 追加は HTML 標準属性（`list`）のパススルーであり新規型を導入しないため、型エラーは基本的に発生しない想定。

---

## QA-002 — Lint 全 workspace（OKLch token gate 整合含む）

```bash
mise exec -- pnpm lint
```

**PASS 基準**: エラー 0 件（warning は許容するが datalist 追加箇所では 0 件を目標）。

**OKLch token gate（`verify-design-tokens`）整合確認**: native `<datalist>` / `<option>` はブラウザ標準描画でありカスタム CSS を追加しない。したがって HEX 直書き（`#xxxxxx`）・Tailwind 任意値ブラケット（`bg-[#...]`/`text-[#...]`）を一切導入しない。

```bash
grep -nE '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#|border-\[#|fill-\[#' \
  apps/web/src/components/admin/AuditLogPanel.tsx
```

**PASS 基準**: ヒット 0 件（datalist 追加で HEX / bracket 値が混入していない＝`verify-design-tokens` gate に抵触しない）。

**FAIL 時の対処**:
1. まず `pnpm lint --fix` を試みる。
2. 自動修正で解消しない違反のみ手動修正する。
3. HEX / bracket が検出された場合は `apps/web/src/styles/tokens.css` の OKLch token（`var(--color-*)`）または semantic class に置き換える。ただし native datalist は CSS 不要のため通常ヒットしない。

---

## QA-003 — invariant #9: `apps/web/src/components/admin/` 配下で `<input>` を直接増やしていない

**目的**: datalist 追加が `<input>` の新規増設を伴っていないことを確認する。`<datalist>` / `<option>` は `<input>` ではなく、既存の action `<Input>`（`FormField` 経由 primitive）に `list` 属性を付与するだけである。

```bash
# AuditLogPanel.tsx 内で直接 <input> を新規追加していないこと（既存は FormField/Input primitive 経由）
grep -nE '<input[ >]' apps/web/src/components/admin/AuditLogPanel.tsx
```

**PASS 基準**: ヒット 0 件（直接 `<input>` の追加なし。action フィールドは既存 `<Input>` primitive を継続使用し、`list` 属性のみ付与）。

```bash
# datalist / option は input ではないことの可視確認
grep -nE '<datalist|<option' apps/web/src/components/admin/AuditLogPanel.tsx
```

**PASS 基準**: `<datalist id="audit-action-presets">` 1 件 + `<option>` 2 件がヒット（これらは `<input>` 増設に該当しない）。

**FAIL 時の対処**: 直接 `<input>` を追加していた場合、`FormField` / `Input` primitive 経由（不変条件 #9）に修正する。

---

## QA-004 — URL query 契約 / 自由入力 / server component 非退化ゲート（AC-2/AC-3/AC-4）

**目的**: datalist 追加が `buildAuditHref`・`name="action"`・自由入力・server component 構成を変えていないことを確認する。

```bash
# name="action" と buildAuditHref が無変更で残っていること
grep -nE 'name="action"|buildAuditHref' apps/web/src/components/admin/AuditLogPanel.tsx
```

**PASS 基準**: `name="action"` と `buildAuditHref` が存在する（削除・改名されていない）。

```bash
# action フィールドが <select> 化されていない（自由入力維持 = AC-3）
grep -nE '<select' apps/web/src/components/admin/AuditLogPanel.tsx
```

**PASS 基準**: ヒット 0 件（`<select>` への置換なし＝自由入力を殺していない）。

**FAIL 時の対処**: `<input list=...>` 方式に戻す。`buildAuditHref` / `name="action"` を変更していたら Phase 2 設計（無変更契約）に従って復元する。

---

## QA-005 — `*.test.*` ファイル不在ゲート（不変条件 #8）

**目的**: 追記したテストが `*.spec.{ts,tsx}` であり `*.test.{ts,tsx}` を新規追加していないことを確認する。

```bash
find apps/web/src/components/admin apps/web/app/\(admin\)/admin/audit \
  -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null
```

**PASS 基準**: 出力 0 件。

**FAIL 時の対処**: 該当ファイルを `*.spec.ts` / `*.spec.tsx` に改名する。

---

## QA-006 — 既存 AuditLogPanel テスト全 PASS（非退化）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/audit/page.page.spec.ts"
```

**PASS 基準**: 既存テスト + Phase 4 追記テストが全件 PASS。特に Phase 3 M-1 の `getByLabelText(/action/)` が datalist 追加後も複数マッチしないこと（datalist には `<label>` 紐付けがない）を確認する。

**FAIL 時の対処**: 失敗テストのエラーを確認し、実装との不整合を修正する。テストの期待値を緩める方向の変更は禁止（実装を修正して PASS させる）。`getByLabelText` が複数マッチした場合は datalist option に誤って label を紐付けていないか確認する。

---

## QA-007 — web パッケージ unit test 全 PASS

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:unit
```

**PASS 基準**: web パッケージの全 spec が PASS（datalist 追加による他コンポーネントへの副作用なし）。

**FAIL 時の対処**: 失敗テストを確認。AuditLogPanel 以外で失敗する場合は無関係な既存問題か、本変更の予期せぬ副作用かを切り分ける。

---

## QA まとめ判定表

実施後に以下のチェックリストを埋める。

| Gate ID | コマンド | PASS/FAIL | 備考 |
|---------|---------|-----------|------|
| QA-001 | `pnpm typecheck` | — | 全 ws |
| QA-002 | `pnpm lint` + HEX/bracket grep | — | OKLch token gate 整合 |
| QA-003 | `<input>` 直接増設 grep | — | invariant #9 |
| QA-004 | `name="action"` / `buildAuditHref` / `<select>` grep | — | AC-2/3/4 非退化 |
| QA-005 | `find ... -name "*.test.*"` | — | invariant #8 |
| QA-006 | AuditLogPanel + page spec | — | 既存テスト非退化 / M-1 |
| QA-007 | `pnpm --filter @ubm-hyogo/web test:unit` | — | web 全 unit |
| 削除確認 | — | **N/A** | ファイル削除なし（FB-UI-02-1） |

---

## 完了条件（Phase 9）

- [ ] QA-001（typecheck）が PASS
- [ ] QA-002（lint + OKLch token gate 整合）が PASS（HEX / bracket ヒット 0 件・`verify-design-tokens` 非抵触）
- [ ] QA-003（invariant #9: `apps/web/src/components/admin/` で直接 `<input>` を増やしていない）が PASS（datalist は input ではない）
- [ ] QA-004（URL query 契約 / 自由入力維持 / server component 非退化）が PASS
- [ ] QA-005（`*.test.*` 不在・invariant #8）が PASS
- [ ] QA-006（既存 AuditLogPanel component spec / page spec 全件 PASS・M-1 複数マッチなし）
- [ ] QA-007（web パッケージ unit test 全 PASS）
- [ ] 各 gate の実行結果が判定表に記録されている
- [ ] FAIL 修正により新たなテスト失敗が発生していない（修正の副作用なし）
- [ ] ファイル削除を伴わないため削除確認は N/A と記録済み（FB-UI-02-1）

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
datalist 追加が型・lint・OKLch token gate・不変条件 #8/#9・既存テストを満たし、URL query 契約 / 自由入力 / SSR 復元を退化させないことを確認する。

## 実行タスク
- typecheck / lint / 不変条件 grep gate / 既存テスト非退化を一括実行する。
- FAIL があれば同一サイクルで修正する。

## 参照資料
- `phase-8.md`
- `phase-3.md`（M-1: getByLabelText 非複数マッチ）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物
- Phase 9 QA 仕様

## 統合テスト連携
Phase 10 の AC 判定（AC-1〜AC-5）は本 Phase の gate 結果を根拠にする。
