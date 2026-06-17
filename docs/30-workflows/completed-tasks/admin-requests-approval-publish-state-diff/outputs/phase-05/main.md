# Phase 5 成果物: 実装方針概要（CONST_005 集約）

> 状態: completed。コードは実装しない。後続実装者が着手できる粒度の実装方針記録。

## ① 変更対象ファイル一覧

| パス | 区分 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | 編集 | `formatPublishStateLabel` / `buildPublishStateDiff` 追加（export）。dl 内に diff 行（`data-diff-side` span + `aria-hidden` 矢印 + `data-diff-kind`）新設。visibility 時は申請内容 dd を diff 行へ統合 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | `destructiveMessage`（143-148 行）を `buildPublishStateDiff` ベースの具体遷移文言生成へ |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 編集 | 92-94 行の表示条件を `isDestructive && destructiveMessage` → `destructiveMessage`（中身があれば表示）へ緩和。`isDestructive` は警告トーン制御に限定 |
| `apps/web/src/styles/globals.css` | 編集 | `.admin-state-diff` / `[data-diff-side]` / `[data-diff-kind]` 強調クラス追加（既存トークンのみ） |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | 編集 | diff 行（V01/V02/D01）assertion 追加 |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 編集 | `destructiveMessage` 具体化 assertion 追加 |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 編集 | 92 行緩和の追従 assertion 追加 |

> helper を別ファイル化する場合のみ `apps/web/src/components/admin/publishStateDiff.ts`（新規）+ `publishStateDiff.spec.ts`（新規・`*.spec.ts`）を追加してよい（配置は runbook 案 i/ii で選択）。`*.test.tsx` 禁止（不変条件 #8）。

## ② 主要関数・型のシグネチャ

```typescript
function formatPublishStateLabel(state: string): string;
//   "public" -> "公開" / "member_only" -> "会員限定" / "hidden" -> "非公開" / それ以外 -> "不明"

type PublishStateDiff =
  | { kind: "visibility"; before: string; after: string }
  | { kind: "delete"; before: string; after: string };

function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null;
```

`RequestQueueItem` は `RequestQueuePanel.tsx`（20-34 行）の既存 type を import（新規 `packages/shared` 型を追加しない）。

## ③ 入力・出力・副作用

- 入力: `RequestQueueItem`。参照するのは `noteType` / `memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState` の 3 値（+ note_type）のみ。
- 出力: 日本語ラベル文字列 / `PublishStateDiff | null`。
- 副作用: **なし**（純粋関数。fetch / state / DOM 変更なし）。`desiredState` 抽出は既存 `summarizePayload`（12-20 行）の unknown-narrowing パターンを再利用。
- 例外: throw しない（未知値は「不明」、対象外 note_type / null は `null`）。

## ④ テスト方針

Phase 4 の TC-01〜TC-12（正常系）+ Phase 6 の TC-E-XX（異常系）を Green 化。既存 3 spec を追従。新規 spec は `*.spec.{ts,tsx}`（`*.test.tsx` 禁止）。色値は test で直接 assert せず `verify-design-tokens` gate で担保。

## ⑤ ローカル実行・検証コマンド（_shared-context §9 転記）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（repo ルート基準・3 spec 限定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
# design token gate（HEX 直書き検出）
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
# apps/api 非変更確認
git diff --name-only -- apps/api packages/shared   # 空であること
```

## ⑥ DoD

- `mise exec -- pnpm typecheck` exit 0。
- `mise exec -- pnpm lint` exit 0。
- focused vitest 3 spec 全 PASS（diff 行 / `destructiveMessage` / a11y の新 assertion 含む）。
- HEX grep gate = PASS（対象 3 ファイルで 0 件）。
- `git diff --name-only -- apps/api packages/shared` が空（AC-7）。
- `verify-design-tokens` CI gate PASS（AC-5）。
- 新規 primitive 追加なし（AC-6）。
- 想定動作確認（Phase 11）: V01=公開→非公開 / V02=非公開→公開 / D01=在籍→退会 の 3 ケースで diff が表示される。
