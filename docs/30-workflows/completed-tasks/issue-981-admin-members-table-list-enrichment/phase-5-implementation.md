# Phase 5: 実装手順

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 修正ファイルパス一覧（[Feedback RT-03] 必須）

| 区分 | パス | 操作 |
| --- | --- | --- |
| 実装（in-place 修正） | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | import 追加 + 「メンバー」列 / ヘッダ / 「区画 / ステータス」列 / 「タグ」列の描画変更 |
| テスト（拡張） | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | Phase 4 の TC-MT-06〜13 追加 + `mkMember` 拡張 |

- **新規ファイルは原則なし**。tag pill のヘルパー切り出し（例: `renderTagPills`）は Phase 8 で判定し、Phase 5 では `MembersTable.tsx` 内に inline 実装する。
- データ層（`apps/api/src/routes/admin/members.ts` / `packages/shared/src/zod/viewmodel.ts`）は **変更禁止**（`verify_existing`、P50 注記参照）。

## 2. import 追加

`MembersTable.tsx` 冒頭の import 群に以下を追加する。相対パス階層は同ディレクトリの `MemberStateChip.tsx` と同じ（`../../../../`）。

```tsx
import { Chip } from "../../../../components/ui/Chip";
import { zoneTone, statusTone } from "../../../../lib/tones";
```

既存 import（`EmptyState` / `Pagination` / `MemberAvatar` / `MemberStateChipRow` / `MemberPublishSwitch`）は維持する。

## 3. 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `MembersTableProps.items`（既存。`occupation` / `ubmZone` / `ubmMembershipType` / `tags` は型上 optional 既存） |
| 出力 | DOM（追加された occupation small text / zone chip / type chip / tag pill / `+N` chip / 未タグ warn chip）。戻り値型・`MembersTableProps` シグネチャは**不変** |
| 副作用 | なし（純描画）。tag pill / chip は onClick handler を持たない（AC-4 = 表示専用） |
| state | internal state（`useState`）を追加しない。値はすべて `items` props 経由 |

## 4. Before/After 差分

### 4-1. 「メンバー」列 — occupation 追加（現行 L88-100 付近）

**Before**:

```tsx
<td className="px-3 py-2">
  <div className="flex items-center gap-2">
    <MemberAvatar memberId={m.memberId} fullName={m.fullName} size="sm" />
    <div className="flex flex-col">
      <button
        type="button"
        className="text-left font-semibold text-[var(--ubm-color-text-primary)] hover:text-[var(--ubm-color-accent)] hover:underline"
        onClick={() => onOpenRow(m.memberId)}
      >
        {m.fullName}
      </button>
    </div>
  </div>
</td>
```

**After**（`flex flex-col` 内の button 直後に occupation small text を追加。存在時のみ）:

```tsx
<td className="px-3 py-2">
  <div className="flex items-center gap-2">
    <MemberAvatar memberId={m.memberId} fullName={m.fullName} size="sm" />
    <div className="flex flex-col">
      <button
        type="button"
        className="text-left font-semibold text-[var(--ubm-color-text-primary)] hover:text-[var(--ubm-color-accent)] hover:underline"
        onClick={() => onOpenRow(m.memberId)}
      >
        {m.fullName}
      </button>
      {m.occupation ? (
        <span className="text-xs text-[var(--ubm-color-text-muted)]">{m.occupation}</span>
      ) : null}
    </div>
  </div>
</td>
```

### 4-2. ヘッダ — 「ステータス」→「区画 / ステータス」（現行 L65）

**Before**:

```tsx
<th scope="col" className="px-3 py-2">ステータス</th>
```

**After**:

```tsx
<th scope="col" className="px-3 py-2">区画 / ステータス</th>
```

### 4-3. 「区画 / ステータス」列セル — zone chip + type chip 追加（現行 L105-110）

**Before**:

```tsx
<td className="px-3 py-2">
  <MemberStateChipRow
    publishState={m.publishState}
    isDeleted={m.isDeleted}
  />
</td>
```

**After**（`flex flex-wrap gap-1.5` ラッパで zone → type → 既存 `MemberStateChipRow` の順。zone/type は存在時のみ）:

```tsx
<td className="px-3 py-2">
  <div className="flex flex-wrap gap-1.5">
    {m.ubmZone ? (
      <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
    ) : null}
    {m.ubmMembershipType ? (
      <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
    ) : null}
    <MemberStateChipRow
      publishState={m.publishState}
      isDeleted={m.isDeleted}
    />
  </div>
</td>
```

> 既存 `MemberStateChipRow`（publishState 3 値 + 退会）は**維持**（Phase 2 Option A: info parity 保持）。

### 4-4. 「タグ」列セル — placeholder「—」を置換（現行 L111-113）

**Before**:

```tsx
<td className="px-3 py-2 text-xs text-[var(--ubm-color-text-muted)]">
  <span title="詳細は drawer で確認">—</span>
</td>
```

**After**（tags 存在時は最大 2 件 pill + `+N`、空/undefined は未タグ warn chip）:

```tsx
<td className="px-3 py-2">
  {m.tags && m.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {m.tags.slice(0, 2).map((t) => (
        <Chip key={t.code}>{t.label}</Chip>
      ))}
      {m.tags.length > 2 ? <Chip>{`+${m.tags.length - 2}`}</Chip> : null}
    </div>
  ) : (
    <Chip tone="warning" dot>未タグ</Chip>
  )}
</td>
```

- `key` は `t.code`（一意）。tag pill / `+N` chip / 未タグ chip いずれも onClick を持たない（表示専用 = AC-4）。
- 「タグ」列ヘッダ（現行 L66 `<th>タグ</th>`）は変更なし。

## 5. ローカル検証コマンド

```bash
# targeted test（RED→GREEN）
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx

# 型チェック / lint / build
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
```

design token gate（CI）: `verify-design-tokens`。追加クラスは `text-xs text-[var(--ubm-color-text-muted)]` と既存 `flex flex-wrap gap-1.5` のみで HEX 直書きゼロ。

## 6. P50 注記（データ層 = verify_existing）

- データ層（API `GET /admin/members` の enrichment SELECT / `AdminMemberListItemZ` の optional フィールド）は #968 で実装済。本タスクは**回帰確認のみ**で、API レスポンス shape / shared schema / Google Form 仕様には一切触れない。
- UI は `m.occupation` / `m.ubmZone` / `m.ubmMembershipType` / `m.tags` を参照するだけ。

## 7. DoD（Definition of Done）

- [ ] `mise exec -- pnpm build` 成功
- [ ] targeted test PASS（TC-MT-01〜13 + a11y）
- [ ] タグ列 placeholder「—」が DOM から消失
- [ ] tags 3 件以上で `+N` chip / 空・undefined で「未タグ」warn chip（`tone="warning"`）が描画される
- [ ] `mise exec -- pnpm typecheck` green / `mise exec -- pnpm lint` green
- [ ] `verify-design-tokens` PASS（HEX 直書き 0 件）
- [ ] `MembersTableProps` シグネチャ不変・internal state 追加なし

## 完了条件

- [ ] 修正ファイルパス一覧が記載された（[Feedback RT-03]）
- [ ] import 追加（Chip / zoneTone / statusTone）が明記された
- [ ] 4 箇所の Before/After 差分が現行コード引用付きで提示された
- [ ] 入力・出力・副作用が定義された
- [ ] ローカル検証コマンドと DoD が記載された
- [ ] P50 注記（データ層 verify_existing）が記録された
