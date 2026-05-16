# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase の成果物は `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/src/features/admin/components/_members/NoteForm.tsx` の関数シグネチャ・型・I/O 設計と、`MemberDrawer.tsx` の state 拡張設計を含む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した 4 論点採用案を実装可能な粒度の設計に落とし込む。本 Phase は以下 4 成果物を出力する。

1. `outputs/phase-02/hook-design.md` — `useAdminMutation` 関数シグネチャ・I/O・依存注入
2. `outputs/phase-02/note-form-design.md` — `NoteForm` props / form state / validation
3. `outputs/phase-02/drawer-extension-design.md` — `MemberDrawer` notes section state 拡張
4. `outputs/phase-02/dependency-matrix.md` — 共有モジュール owner / co-owner マトリクス

## 設計詳細

### 2.1 useAdminMutation hook

**配置先**: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（新規）

**シグネチャ**:
```typescript
export interface UseAdminMutationOptions<T> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;
```

**動作フロー**:
1. `trigger(payload)` 呼び出し → `isLoading = true`
2. `fetch(endpoint, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload), credentials: "same-origin" })`
3. 2xx 応答:
   - `const data = await response.json()`
   - `await options.onSuccess?.(data)`
   - `router.refresh()`
   - `toast.success(options.successMessage ?? "✓ 保存しました")`
   - `return data`
4. 4xx/5xx 応答:
   - 401 → `throw new FetchAuthedError(...)`（parallel-10 連携）
   - その他 → `const body = await response.json().catch(() => ({}))`
   - `const msg = body.message ?? body.error ?? "サーバーエラー"`
   - `toast.error(\`✗ \${msg}\`)`
   - `options.onError?.(err)`
   - `throw err`
5. finally: `isLoading = false`

**依存**:
- `next/navigation`: `useRouter`
- `react`: `useState`, `useCallback`, `useRef`
- toast lib（Phase 1 で特定済 — `sonner` 想定）
- `@/features/admin/lib/errors`（parallel-10 提供予定 / 未提供時は本 step で stub を置く）

**並行リクエスト防止**: `useRef<boolean>` で `isSubmittingRef` を持ち、`isSubmittingRef.current === true` のとき再 trigger は no-op（既存 RT-04 知見準拠）。

### 2.2 NoteForm component

**配置先**: `apps/web/src/features/admin/components/_members/NoteForm.tsx`（新規）

**Props**:
```typescript
export interface NoteFormProps {
  readonly memberId: string;
  readonly initialBody?: string;
  readonly noteId?: string;
  readonly onSuccess?: () => void | Promise<void>;
  readonly onCancel?: () => void;
}
```

**form state**:
- `body: string`（初期値 `initialBody ?? ""`）
- `validationError: string | null`

**client validation schema** (`zod`):
```typescript
const NoteBodySchema = z.object({ body: z.string().min(1, "本文は必須です").max(2000, "2000文字以内にしてください") });
```

**submit handler**:
- 編集モード (`noteId` あり): `PATCH /api/admin/members/${memberId}/notes/${noteId}`
- 新規モード: `POST /api/admin/members/${memberId}/notes`
- いずれも `useAdminMutation` 経由

**UI 構成**（design token のみ使用）:
- `<form>` wrapper
- `<label htmlFor="note-body">本文</label>`
- `<textarea id="note-body" aria-invalid={!!validationError} aria-describedby="note-body-error">`
- `<p id="note-body-error" role="alert">` （validation error 表示）
- `<button type="submit" disabled={isLoading}>` 文言: `noteId ? "更新" : "追加"`
- `<button type="button" onClick={onCancel}>キャンセル</button>`

### 2.3 MemberDrawer 拡張

**配置先**: `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集）

**新規 state**:
```typescript
const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
```

**追加 section** (drawer 既存 content の下部):
```tsx
<section aria-labelledby="notes-heading">
  <h3 id="notes-heading">メモ</h3>
  <ul>{notes.map(n => <NoteRow key={n.noteId} note={n} onEdit={() => { setEditingNoteId(n.noteId); setIsEditingNote(true); }} />)}</ul>
  {isEditingNote ? (
    <NoteForm
      memberId={memberId}
      noteId={editingNoteId ?? undefined}
      initialBody={editingNoteId ? notes.find(n => n.noteId === editingNoteId)?.body : undefined}
      onSuccess={() => { setIsEditingNote(false); setEditingNoteId(null); }}
      onCancel={() => { setIsEditingNote(false); setEditingNoteId(null); }}
    />
  ) : (
    <button onClick={() => setIsEditingNote(true)}>メモを追加</button>
  )}
</section>
```

`notes` 配列は drawer 既存 fetch（member detail）に含まれている前提。含まれていない場合は Phase 3 で MAJOR 判定し、Phase 1 へ戻る。

### 2.4 dependency matrix

| モジュール | 用途 | owner | co-owner | 同期 |
| --- | --- | --- | --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation 共通 hook | step-01 (本タスク) | step-02..08 | step-01 merge 後すぐに re-export 経由で参照 |
| `apps/web/src/features/admin/hooks/index.ts` | barrel export | step-01 (本タスク) | step-02..08 | 同上 |
| toast wrapper / ToastProvider | success/error toast | parallel-08 | step-01..08 | parallel-08 completed が step-01 着手 gate。stub 実装で迂回しない |
| `FetchAuthedError` / `AuthRequiredError` 型 | 401/403 throw | parallel-10 | step-01..08 | parallel-10 completed が step-01 着手 gate。task-local replacement class は作らない |

## validation matrix (command 単位)

| command | scope | 成功条件 |
| --- | --- | --- |
| `pnpm typecheck` | repo 全体 | error 0 |
| `pnpm lint` | repo 全体 | error 0 |
| `pnpm --filter @ubm-hyogo/web test -- useAdminMutation.spec.ts` | hook unit | green |
| `pnpm --filter @ubm-hyogo/web test -- NoteForm.spec.tsx` | form unit | green |
| `bash scripts/coverage-guard.sh` | changed files | exit 0 |

## 実行タスク

- [ ] hook 設計を `outputs/phase-02/hook-design.md` に書き起こす
- [ ] NoteForm 設計を `outputs/phase-02/note-form-design.md` に書き起こす
- [ ] Drawer 拡張設計を `outputs/phase-02/drawer-extension-design.md` に書き起こす
- [ ] dependency matrix を `outputs/phase-02/dependency-matrix.md` に書き起こす
- [ ] `apps/web` 内 `import` graph で circular dependency が無いことを `rg` で確認

## 統合テスト連携

Phase 8 で hook + NoteForm + Drawer + API 実体を結合した integration test を実施することを前提に、本 Phase で test pyramid を:
- Unit (Phase 6): hook, NoteForm
- Integration (Phase 8): Drawer + NoteForm + MSW mock API
- E2E smoke (Phase 11): 既存 admin smoke flow に notes mutation 1 ケース追加

## 成果物

- `outputs/phase-02/hook-design.md`
- `outputs/phase-02/note-form-design.md`
- `outputs/phase-02/drawer-extension-design.md`
- `outputs/phase-02/dependency-matrix.md`

## 完了条件

- [ ] 設計成果物 4 件作成済
- [ ] 関数シグネチャが TypeScript として valid（type check 想定）
- [ ] dependency owner / co-owner が全行で埋まっている
- [ ] design token 違反の設計記述が無い（HEX 直書きを設計図に書かない）
- [ ] coverage Statements/Branches/Functions/Lines >=80% を完了条件に明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を Phase 6 / 9 / 11 完了条件として伝達

## タスク100%実行確認【必須】

- [ ] 設計成果物 4 件 commit-ready
- [ ] dependency matrix の空欄 0

## 次Phase

Phase 3 (設計レビュー): PASS / MINOR / MAJOR 判定と simpler alternative の検討。
