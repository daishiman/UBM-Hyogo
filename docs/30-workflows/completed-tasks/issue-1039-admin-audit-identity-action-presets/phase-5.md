# Phase 5: 実装

> **[実装区分: 実装仕様書]**。Phase 4 の RED spec を GREEN にするための変更対象ファイルと実装方針を記載する。

---

## 1. 変更対象ファイル一覧（FB-RT-03 必須記載）

### 新規作成

| ファイルパス | 責務 |
|---|---|
| （なし） | 本タスクは新規ファイルを作成しない |

### 編集

| ファイルパス | 変更内容 |
|---|---|
| `apps/web/src/components/admin/AuditLogPanel.tsx` | action `FormField` 内（L181-183）に `<datalist id="audit-action-presets">` を追加し、`<Input>` に `list="audit-action-presets"` を付与 |

> テストファイル（`AuditLogPanel.component.spec.tsx` / `page.page.spec.ts`）は Phase 4 で追記済み。本 Phase での新規作成はない。
> `buildAuditHref` / `audit-query.ts` / `page.tsx` / `Input.tsx` / shared schema / `apps/api` は **一切編集しない**。

---

## 2. `AuditLogPanel.tsx` 差分

### Before（現状 L181-183）

```tsx
<FormField name="action" label="action">
  <Input name="action" defaultValue={values.action ?? ""} placeholder="attendance.add" />
</FormField>
```

### After（datalist 追加版）

```tsx
<FormField name="action" label="action">
  <Input
    name="action"
    defaultValue={values.action ?? ""}
    placeholder="attendance.add"
    list="audit-action-presets"
  />
  <datalist id="audit-action-presets">
    <option value="identity.merge" />
    <option value="identity.dismiss" />
  </datalist>
</FormField>
```

- `<Input>`（`apps/web/src/components/ui/Input.tsx`）は `InputHTMLAttributes` を継承し `...props` を透過するため、
  `list` 属性はそのまま DOM の `<input list>` へ渡る（`Input.tsx` の改修不要）。
- `<datalist>` は action `FormField` 内に同居させ、`<input list>` ↔ `<datalist id>` の参照を `audit-action-presets` で結ぶ。
- option は `identity.merge` / `identity.dismiss` の 2 値のみ（Phase 3 §3 過剰提示回避）。
- option の並び順は producer 出現順に合わせ `identity.merge` → `identity.dismiss`（Phase 4 DATALIST-2/3/4 と一致）。

---

## 3. 不変点（変更してはならない契約）

| 対象 | 不変条件 | 理由 |
|---|---|---|
| `buildAuditHref`（L91-107） | 無変更。`set("action", values.action)` のまま | URL query `action=<value>` 契約・cursor pagination 保持（AC-4） |
| `<Input name="action">` の `name` | `action` 固定 | URL query key 契約（AC-2） |
| `<Input>` の `defaultValue={values.action ?? ""}` | 無変更 | SSR/reload 時の自由入力値復元（AC-2 / AC-3） |
| placeholder | `attendance.add` 維持 | identity 以外を提示し過剰提示を回避（Phase 3） |
| component 種別 | `AuditLogPanel` は server component のまま（`"use client"` 追加しない） | React state を増やさない・運用性 PASS の前提（Phase 3 §1） |
| OKLch token / CSS | 追加 CSS なし。native datalist のため tokens.css 変更不要 | invariant #2（HEX 直書き禁止）に抵触しない（CSS 追加自体が無い） |
| 自由入力 | text input を維持し datalist は候補提示のみ | 任意 action（`member.delete` 等）が退化しない（AC-3） |

---

## 4. ローカル実行・検証コマンド

```bash
# 型チェック
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# Phase 4 RED → GREEN 確認（リポジトリルートから実行）
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/audit/page.page.spec.ts"
```

---

## 完了条件（Phase 5） / DoD（Definition of Done）

- [ ] AC-1: datalist `#audit-action-presets`（option = `identity.merge` / `identity.dismiss`）が描画され、action `<Input>` に `list` 属性が付く（DATALIST-1〜5 GREEN）
- [ ] AC-2: URL query `action=<value>` 契約維持、SSR/reload で `defaultValue` 復元（PAGE-ACTION-1〜3 GREEN）
- [ ] AC-3: 任意 action（`member.delete` 等）の自由入力が退化しない（DATALIST-6〜8 GREEN）
- [ ] AC-4: cursor pagination の next URL が action filter を保持（`buildAuditHref` 無変更＝既存 pagination テスト非退化）
- [ ] AC-5: component tests / page tests が GREEN
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] 既存 6+ テスト（filter form primitives / mask / pagination / 404 hint 等）が非退化
- [ ] 変更ファイルが `AuditLogPanel.tsx` のみ（`apps/api` / shared / `Input.tsx` 非接触）

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Phase 4 の RED テストを満たす最小実装で、action フィルタへ identity action プリセット（datalist）を付与する。

## 実行タスク
- `AuditLogPanel.tsx` の action FormField に datalist と list 属性を追加する。
- RED テストを GREEN にする。

## 参照資料
- `phase-4.md`
- `outputs/phase-12/implementation-guide.md`

## 成果物
- Phase 5 実装仕様

## 統合テスト連携
Phase 6 は本 Phase の実装差分に対し fail path・回帰ガードを追加する。
