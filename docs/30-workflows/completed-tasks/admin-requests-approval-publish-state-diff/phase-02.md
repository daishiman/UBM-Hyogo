# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 1（要件定義） |
| 下流 | Phase 3（設計レビュー） |
| 状態 | completed |

## 目的

Phase 1 で確定した要件をもとに、diff 表示の DOM 構造・純粋関数シグネチャ・CSS 設計・ダイアログ文言生成・テスト境界を確定する。後続の実装 Phase（5）がそのまま着手できる粒度の設計書を作成する。

## 実行タスク

1. **純粋関数の設計**: `formatPublishStateLabel` / `buildPublishStateDiff` のシグネチャ・入出力・fail-soft 挙動を確定する。
2. **DOM 設計**: `RequestQueueDetail.tsx` の dl 内に追加する diff 行の DOM 構造（`data-diff-side` span + `aria-hidden` 矢印）を確定する。
3. **note_type 分岐設計**: `visibility_request`（公開状態遷移）/ `delete_request`（在籍→退会）の意味軸分岐ロジックを確定する。
4. **ダイアログ文言生成設計**: `RequestQueuePanel.tsx` の `destructiveMessage` 生成箇所で具体遷移文言を組み立てる設計（props 非追加）を確定する。
5. **CSS 設計**: `globals.css` の `[data-diff-side]` クラスのトークンマッピングを確定する。
6. **既存表示との統合方針**: 現在値 dd（57-58 行）・申請内容 dd（70-73 行）と diff 行の関係（統合 or 併設）を確定する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | §2 確定方針・§4 新規 surface・§5 トークン |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-01.md | 要件・3 値限定・命名規則 |
| 必須 | apps/web/src/components/admin/RequestQueueDetail.tsx | dl 構造・`summarizePayload`・`NOTE_TYPE_LABEL`（改修主役） |
| 必須 | apps/web/src/components/admin/RequestQueuePanel.tsx | `destructiveMessage`（143-148 行）生成箇所 |
| 必須 | apps/web/src/styles/tokens.css | `--ubm-color-*` / `--ubm-space-*` 実在トークン確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | primitive 再利用方針・新規 primitive 禁止 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界 |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値正本・HEX 禁止 |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |

## 純粋関数シグネチャ（確定）

```typescript
// RequestQueueDetail.tsx 内（または同階層 helper）

/** publishState 生値を日本語ラベルへ写像。未知値は fail-soft で「不明」。throw しない。 */
function formatPublishStateLabel(state: string): string;
//   "public"      -> "公開"
//   "member_only" -> "会員限定"
//   "hidden"      -> "非公開"
//   それ以外       -> "不明"

/** note_type で意味軸分岐した diff を構築。対象外は null。 */
type PublishStateDiff =
  | { kind: "visibility"; before: string; after: string }   // 日本語ラベル
  | { kind: "delete"; before: string; after: string };      // "在籍" -> "退会（論理削除）"

function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null;
//   visibility_request:
//     before = formatPublishStateLabel(item.memberSummary.publishState)
//     after  = formatPublishStateLabel(desiredState)  // requestedPayload.desiredState を安全に抽出
//     desiredState が PUBLISH_STATES 外 / 取得不能なら after = "不明"（throw しない）
//   delete_request:
//     { kind: "delete", before: "在籍", after: "退会（論理削除）" }
//   その他 note_type / item=null:
//     null
```

> `desiredState` の抽出は `summarizePayload`（既存 12-20 行）と同じ unknown-narrowing パターン（`payload && typeof payload === "object" && !Array.isArray(payload)` で `obj["desiredState"]` を string 判定）を再利用する。

## DOM 設計（確定）

`RequestQueueDetail.tsx` の `<dl>` 内、`種別`（60-61 行）の直後に diff 行を追加する。

```tsx
{(() => {
  const diff = buildPublishStateDiff(item);
  if (!diff) return null;
  const dtLabel = diff.kind === "visibility" ? "公開状態の変更" : "レコード状態の変更";
  return (
    <>
      <dt>{dtLabel}</dt>
      <dd>
        <span className="admin-state-diff" data-diff-kind={diff.kind}>
          <span data-diff-side="before">{diff.before}</span>
          <span className="admin-state-diff__arrow" aria-hidden="true"> → </span>
          <span data-diff-side="after">{diff.after}</span>
        </span>
      </dd>
    </>
  );
})()}
```

- 既存の `申請内容`（70-73 行 `summarizePayload`）は diff 行で意味が冗長になるため、`visibility_request` のときは diff 行へ役割を統合する設計とする（Phase 3 で代替案検討。最小スコープでは申請内容 dd を残しつつ diff 行を追加でも可）。
- 既存の `会員`（55-59 行）の `公開状態: {publishState}` は会員サマリの現在値表示として残す（diff 行とは役割が異なる：会員の素性 vs 承認による遷移）。

## CSS 設計（globals.css・既存トークンのみ）

```css
.admin-state-diff { display: inline-flex; align-items: center; gap: var(--ubm-space-2, 0.5rem); }
.admin-state-diff [data-diff-side="before"] { color: var(--ubm-color-text-secondary); }
.admin-state-diff [data-diff-side="after"] { color: var(--ubm-color-accent-ink); font-weight: 600; }
.admin-state-diff__arrow { color: var(--ubm-color-text-muted); }
.admin-state-diff[data-diff-kind="delete"] [data-diff-side="after"] { color: var(--ubm-color-warn); }
```

> HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を使わない。`--ubm-space-*` の実在トークン名は実装時に `tokens.css` で確認する（未定義なら fallback 値を許容するか既存値へ調整）。新規トークン追加は原則不要。

## ダイアログ文言生成設計（RequestQueuePanel.tsx）

`destructiveMessage`（143-148 行）の生成を以下に置き換える:

```typescript
const destructiveMessage =
  dialogKind === "approve" && dialogItem
    ? dialogItem.noteType === "delete_request"
      ? "退会申請を承認すると、当該会員は論理削除されます（公開ディレクトリから削除）。この操作は取り消しできません。"
      : (() => {
          const diff = buildPublishStateDiff(dialogItem);
          return diff && diff.kind === "visibility"
            ? `公開状態を「${diff.before}」から「${diff.after}」へ変更します。会員へ即時反映されます。`
            : "公開状態を申請内容に応じて変更します。会員へ即時反映されます。"; // fallback（既存文言）
        })()
    : undefined;
```

- `buildPublishStateDiff` を `RequestQueueDetail` と共有するため、helper は import 可能な位置（`RequestQueueDetail.tsx` から export、または `apps/web/src/components/admin/` 配下の小 helper ファイル）に置く。配置は Phase 5 で確定。
- `isDestructive` の現行ロジック（142 行・`delete_request` のみ true）は不変。`visibility_request` の diff 文言は `destructiveMessage` が undefined でない限り `RequestConfirmDialog` の `isDestructive && destructiveMessage`（92-94 行）の条件で表示されない点に注意。→ Phase 3 で「visibility でもダイアログに diff を出すか」を判断（出す場合は `RequestConfirmDialog` 92 行の表示条件を `destructiveMessage` 単独 or 新 props で見直す。最小スコープでは詳細パネル diff を主役とし、ダイアログは delete のみ destructive 表示維持でも AC-8 を満たすか Phase 3 で確定）。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-02/main.md | 設計サマリ（シグネチャ / DOM / CSS / ダイアログ文言 / 統合方針） |
| outputs/phase-02/diff-design.md | diff 表示の DOM・純粋関数・CSS の詳細設計（実装者向け） |

## 統合テスト連携

- 本 Phase の DOM 設計（`data-diff-side` / `data-diff-kind` 属性）が Phase 4 のテストセレクタになる。
- 純粋関数シグネチャが Phase 4 の unit test 対象になる。

## 完了条件

- [ ] `formatPublishStateLabel` / `buildPublishStateDiff` のシグネチャ・入出力・fail-soft を確定した。
- [ ] diff 行の DOM 構造（`data-diff-side` span + `aria-hidden` 矢印）を確定した。
- [ ] note_type 分岐（visibility / delete）の意味軸を確定した。
- [ ] `destructiveMessage` の具体文言生成設計（props 非追加）を確定した。
- [ ] CSS の `[data-diff-side]` トークンマッピングを既存トークンのみで確定した。
- [ ] ダイアログへの diff 表示範囲（AC-8 の充足方法）を Phase 3 判断事項として明記した。
