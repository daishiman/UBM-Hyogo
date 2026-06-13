# Phase 2: 設計

> SSOT: [`shared-context.md`](./shared-context.md) §5, §6, §7。本 Phase は topology・関数シグネチャ・状態所有権・既存コンポーネント再利用可否を確定する。

## 目的

C1〜C5 を実装するための内部設計（新規/編集ファイル、関数・型シグネチャ、state 所有権、既存 primitive 再利用方針、Lane 並列性）を確定し、Phase 4（テスト計画）以降が迷わず着手できる粒度に固定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要 UI | 再利用するか | 採用 primitive |
|---------|-------------|----------------|
| 説明カード（ガイド） | ✅ 再利用 | `Card`（`src/components/ui/Card.tsx`）+ `Icon` |
| 画面間リンク | ✅ 再利用 | 既存 admin 内部遷移パターン（Next.js `Link` / `ButtonLink` 相当。存在を Phase 5 で確認し再利用） |
| フォーム入力 | ✅ 再利用 | `FormField` + `Input`（既存 `TagDefinitionCreateForm` 構成を維持） |
| 状態バッジ（自動生成中） | ✅ 再利用 | `Chip`（`src/components/ui/Chip.tsx`） |

新 primitive を生やさない（不変条件 §7-3）。`TagManagementGuide` は上記の合成のみ。

## topology（Lane 並列性）

```
C1 (tagCodeAutogen.ts 新規 + TagDefinitionCreateForm 編集)  ─┐
C2 (shell-config.ts label 変更)                              ─┼─ 互いに独立（別ファイル）→ 並列実装可
C3 (tagManagementGlossary.ts + TagManagementGuide.tsx 新規  ─┘   ただし C4 文言は C1/C3 のファイルに内包
    + 2 page.tsx 編集)
C5 (各 __tests__)  ← C1〜C4 完了後に焦点テストで締める（直列）
```

仕様作成（本サイクル）の Lane 割り（Phase 4-13 生成）: Lane A = Phase 4-6、Lane B = Phase 7-10、Lane C = Phase 11/13 + outputs。3 並列以下（ベストプラクティス遵守）。

## 関数・型シグネチャ（確定）

SSOT §6 を正本とする。要点:

### C1 `tagCodeAutogen.ts`

- `export function generateTagCode(label: string): string` — 純関数・throw しない・返り値は常に `TAG_CODE_PATTERN` 適合。アルゴリズム 8 ステップは SSOT §6。
- `export const KANA_ROMAJI_MAP: Readonly<Record<string, string>>` — かな→ローマ字最小表。
- `export const TAG_CODE_PATTERN: RegExp` — `/^[a-z0-9][a-z0-9_]{0,63}$/`（既存 `CODE_PATTERN` と同値・重複ロジックを SSOT 化）。

### C3 `tagManagementGlossary.ts`

- `export interface TagGlossaryTerm { key; label; description }`
- `export const TAG_MANAGEMENT_GLOSSARY: readonly TagGlossaryTerm[]`（必須キー: SSOT §6 の 8 キー）
- `export function getTagTerm(key: string): TagGlossaryTerm | undefined`

### C3 `TagManagementGuide.tsx`

- `export interface TagManagementGuideProps { variant: "definition" | "assignment"; className?: string }`
- `export function TagManagementGuide(props): JSX.Element` — stateless。variant で説明文・相互リンク向きを切替。

## state 所有権（C1 フォーム）

| state | 所有者 | 遷移 |
|-------|--------|------|
| `label` | `TagDefinitionCreateForm` 内部 useState | 表示名入力で更新 |
| `code` | `TagDefinitionCreateForm` 内部 useState | (a) `!codeDirty` 時 `label` 変更で `generateTagCode(label)` 自動補完 (b) code 手動入力で直接更新 |
| `codeDirty` | `TagDefinitionCreateForm` 内部 useState（初期 false） | code を手動編集した瞬間に `true`（以後自動上書き停止）。送信成功でフォーム reset 時に false へ戻す。 |

> ロック/上書き解放経路（正常 / リセット）を明記（STATE-DETAIL-01）: 送信成功時に `label`/`code`/`codeDirty` を初期化する。エラー時は入力値を保持し `codeDirty` を維持する。

## 既存コードへの影響範囲

- `TagDefinitionCreateForm.tsx`: state 追加 + onChange 配線 + ヒント表示 + 説明文平易化。送信 payload（`createTag` 引数 shape）は不変 → 既存 `tags.create.spec.ts` 非破壊。
- `shell-config.ts`: label 文字列のみ変更。href / key 不変 → active 判定・既存 nav テスト非破壊。
- 2 page.tsx: 冒頭に `<TagManagementGuide />` を 1 要素追加 + `tags/page.tsx` の説明文変更。`AdminPageHeader` の title / testid 不変 → 既存 page spec 非破壊。

## 実行タスク

- 既存 `Card`/`FormField`/`Chip`/`Link` の再利用可否を確認し採用する。
- `generateTagCode` / `getTagTerm` / `TagManagementGuide` のシグネチャを SSOT §6 で確定する。
- フォーム state（`label`/`code`/`codeDirty`）の所有権と遷移を確定する。
- Lane 並列性と既存テストへの非破壊性を確認する。

## 参照資料

- [`shared-context.md`](./shared-context.md) §5, §6, §7
- `apps/web/src/components/ui/{Card,FormField,Input,Chip,Icon}.tsx`
- `apps/web/src/lib/admin/schemaHistoryGlossary.ts`（用語集パターン）
- `apps/web/src/components/admin/TagDefinitionCreateForm.tsx`（現状 state 構成）

## 成果物

- 本 `phase-2-design.md`（topology・シグネチャ・state 所有権・再利用方針）。
- SSOT §6 の関数シグネチャ確定。

## 統合テスト連携

- フォーム state の `code`（自動補完）/ `codeDirty`（手動上書き）は **内部 state**（VSCPKR-03）。Phase 4 テストはこの内部 state を操作対象として設計する（props 経由ではない）。
- `TagManagementGuide` は外部 props（`variant`）駆動。Phase 4 は variant 別レンダリングを検証する。

## 完了条件

- [ ] 既存 primitive 再利用方針を確定済み（新 primitive 0）。
- [ ] `generateTagCode` / `getTagTerm` / `TagManagementGuide` のシグネチャ確定済み。
- [ ] フォーム state 所有権（`label`/`code`/`codeDirty`）と遷移を確定済み。
- [ ] 既存テスト非破壊（DOM contract 維持）を設計レベルで保証済み。
- [ ] Lane 並列性を確定済み。
