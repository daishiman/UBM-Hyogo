# Implementation Guide

## Part 1: Concept

### なぜ必要か

The admin audit screen is used to find records such as identity merges and dismissed identity conflicts. Before this change, an operator had to type `identity.merge` or `identity.dismiss` exactly. A typo meant the audit record could be missed even though the backend had recorded it correctly.

### 何をするか

This is like adding a small candidate list beside a search box in a classroom notebook. The イメージ is that the operator can choose the common entries from the list, but the notebook still accepts any other action name typed by hand.

### 今回作ったもの

| Item | Mechanism | Role |
|---|---|---|
| Action candidate list | `<datalist id="audit-action-presets">` | Browser-native suggestions for common identity actions. |
| Merge preset | `identity.merge` | Filters audit logs for identity merge actions. |
| Dismiss preset | `identity.dismiss` | Filters audit logs for identity dismiss actions. |
| Existing action field connection | `<Input list="audit-action-presets">` | Keeps the text input and attaches the suggestion list. |

The field remains a free-text input. Values such as `member.delete` still work because the list is only an input aid, not a select box.

## Part 2: Technical Notes

### DOM structure

`apps/web/src/components/ui/Input.tsx` forwards native input props, so no primitive API change is needed. The implementation adds only the native `list` attribute and an adjacent datalist:

```tsx
type AuditActionPreset = "identity.merge" | "identity.dismiss";

const auditActionPresets: AuditActionPreset[] = ["identity.merge", "identity.dismiss"];

<Input
  name="action"
  defaultValue={values.action ?? ""}
  placeholder="attendance.add"
  list="audit-action-presets"
/>
<datalist id="audit-action-presets">
  {auditActionPresets.map((value) => (
    <option key={value} value={value} />
  ))}
</datalist>
```

The production code keeps the two options inline in `AuditLogPanel.tsx` because there are only two values and no other consumer. The TypeScript block above documents the effective value set without introducing a shared type.

### APIシグネチャ

No API route changes. The existing query contract remains:

```ts
function buildAuditHref(values: AuditSearchValues, cursor?: string | null): string;
```

`name="action"` still submits the same query key, and `buildAuditHref` is unchanged. The page regression verifies that `searchParams.action = "identity.dismiss"` calls:

```bash
/admin/audit?action=identity.dismiss&limit=25
```

### 使用例

```bash
pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/app/'(admin)'/admin/audit/page.page.spec.ts
```

```tsx
render(
  <AuditLogPanel
    values={{ action: "member.delete", limit: "50" }}
    data={{ items: [], nextCursor: null }}
  />,
);
```

The second example proves free-text restoration is still valid even when the value is not in the datalist.

### エラーハンドリング

The datalist does not add an error path. If the API request fails, the existing `AuditLogPanel` error banner still renders. If the browser does not show native datalist suggestions, the input still behaves as a plain text field and the query contract remains valid.

### エッジケース

| Case | Expected behavior |
|---|---|
| `values.action` is empty | Input renders with an empty value and still has `list="audit-action-presets"`. |
| `values.action` is `identity.dismiss` | Input restores that exact value and submits the existing `action` query key. |
| `values.action` is `member.delete` | Free-text value is preserved; the datalist does not restrict it. |
| Cursor pagination is used | `buildAuditHref` remains unchanged and keeps existing filters. |

### 設定項目と定数一覧

| Setting / constant | Value | Location |
|---|---|---|
| datalist id | `audit-action-presets` | `AuditLogPanel.tsx` |
| input list attribute | `audit-action-presets` | `AuditLogPanel.tsx` |
| merge option | `identity.merge` | Matches `apps/api/src/repository/identity-merge.ts` producer action. |
| dismiss option | `identity.dismiss` | Matches `apps/api/src/repository/identity-conflict.ts` producer action. |

### テスト構成

| Layer | File | Coverage |
|---|---|---|
| component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | Datalist id/options, `name="action"`, list wiring, free-text preservation. |
| page | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | `?action=identity.dismiss` SSR restoration and unchanged API path. |
| visual evidence | `outputs/phase-11/screenshots/audit-action-filter-datalist-open.png` | Local visual harness showing the candidate list. |
| visual evidence | `outputs/phase-11/screenshots/audit-action-filter-restored.png` | Local visual harness showing restored `identity.dismiss`. |

Staging authenticated screenshots remain user-gated, but Phase 11 now contains local screenshot evidence for the UI contract.
