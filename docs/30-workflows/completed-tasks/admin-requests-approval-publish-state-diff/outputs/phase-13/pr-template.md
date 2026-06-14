# Phase 13 — PR 本文テンプレート

> ステータス: `implemented_local_runtime_pending`。base = `dev`。commit / PR は user 明示承認後のみ。本テンプレートは実装サイクル完了後に実測値で埋める。

---

## タイトル案

```
feat(admin): /admin/requests 承認時に公開状態の「変更前 → 変更後」diff を表示
```

---

## PR 本文（雛形）

### 背景

起点 Issue: [#1188](https://github.com/daishiman/UBM-Hyogo/issues/1188)

`/admin/requests`（会員からの申請キュー）の承認導線では、対象会員の**今の公開状態**（例: `公開状態: public`）と**申請された希望**（例: `desiredState: hidden`）が別々の `dd` にバラバラに表示され、英語の生値のまま露出していた。管理者は目で照合して「何から何へ変わるか」を頭の中で計算する必要があり、確認コスト増・誤承認リスクがあった。機能不足ではなく**遷移の視認性**が真因。

### 変更内容

API / D1 / Google Form schema / projection は不変のまま（既存 GET `/admin/requests` の 3 値 `publishState` / `isDeleted` / `desiredState` のみ使用）、表現層（`apps/web/src/components/admin/`）+ `globals.css` で diff を表示する:

- **公開状態 diff**: `RequestQueueDetail` の dl に `変更前 → 変更後`（例 `公開 → 非公開`）の遷移を 1 箇所へ強調表示。`formatPublishStateLabel`（純関数・日本語ラベル化・未知値 fail-soft）+ `buildPublishStateDiff`（純関数・note_type 意味軸分岐）を追加。
- **note_type 分岐**: `visibility_request` は公開状態遷移、`delete_request` は「在籍 → 退会（論理削除）」のレコード状態遷移として別表現にし誤読を防ぐ。
- **承認確認ダイアログ**: `RequestQueuePanel` の `destructiveMessage` 生成箇所で「公開 → 非公開 に変更します」の具体遷移文言を組み立て（`RequestConfirmDialog` の props は追加せず文言で完結）。
- diff 強調は `[data-diff-side="before|after"]` 属性 + 既存 OKLch トークン（`--ubm-color-text-secondary` / `--ubm-color-accent`）のみ。新規 primitive・新規 token・新規 endpoint はゼロ。

### 受入条件チェックリスト

- [ ] AC-1 公開状態 diff（`公開 → 非公開` を 1 箇所に強調表示）
- [ ] AC-2 退会レコード状態遷移（`在籍 → 退会（論理削除）`・公開状態 diff と混同しない）
- [ ] AC-3 publishState 日本語ラベル化（英語生値が露出しない）
- [ ] AC-4 OKLch トークン整合（`design-tokens.md` 準拠）
- [ ] AC-5 HEX 0 件（`verify-design-tokens` PASS）
- [ ] AC-6 新規 primitive 0 件（`data-diff-side` 属性 + 既存 primitive）
- [ ] AC-7 API / D1 / Form / shared 型 diff 0 件（`apps/api`・`packages/shared` 空）
- [ ] AC-8 ダイアログ具体遷移文言（`visibility_request`）/ 退会文言維持（`delete_request`）
- [ ] AC-9 a11y（矢印 `aria-hidden="true"` / before・after テキスト担保 / 既存 aria 不変）
- [ ] AC-10 既存 3 spec green 維持 + note_type 別 diff assertion PASS

### スクリーンショット（実装後・user-gated）

> 現時点では `outputs/phase-11/screenshots/` に PNG 実体なし。PR 作成時点でも未取得なら、このセクションは削除する（CLAUDE.md フロー準拠）。

| 状態 | 画像 |
| --- | --- |
| 公開 → 非公開（V01） | `outputs/phase-11/screenshots/request-approve-visibility-public-to-hidden.png` |
| 非公開 → 公開 + ダイアログ文言（V02） | `outputs/phase-11/screenshots/request-approve-visibility-hidden-to-public.png` |
| 在籍 → 退会（論理削除）（D01） | `outputs/phase-11/screenshots/request-approve-delete-enroll-to-withdraw.png` |

### テスト結果（実装後に埋める）

| コマンド | 結果 |
| --- | --- |
| focused vitest（requests admin 3 spec） | — |
| `mise exec -- pnpm typecheck` | — |
| `mise exec -- pnpm lint` | — |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | — |
| `git diff --name-only -- apps/api packages/shared`（空であること） | — |

### スコープ外（本 PR では扱わない）

- 承認時 publish_state 遷移ロジック（`apps/api` `inferDesiredPublishState` / `resolveRequestAtomic`）の変更
- 新 endpoint 追加・D1 schema 変更・GET `/admin/requests` projection 拡張
- `/admin/requests` 以外の画面への波及

🤖 Generated with [Claude Code](https://claude.com/claude-code)
