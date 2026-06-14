# Phase 9 出力: token-audit（AC-4 / AC-5 / AC-6 / AC-7）

> 状態: `completed`（仕様書作成のみ）。下記は実装者が CSS 実装時に守る token 監査指針であり、監査済み・PASS 済みを主張するものではない。

## 1. 使用する `--ubm-color-*` トークン一覧（新規追加なし）

`[data-diff-side]` / `.admin-state-diff` の diff 強調に使うトークンは全て既存の `tokens.css` 正本に存在するものに限定する。**新規トークン追加は原則不要**（diff の before/after/delete/arrow を既存トークンで区別できるため）。

| 役割 | 適用箇所 | トークン | 備考 |
| --- | --- | --- | --- |
| before（変更前・中立） | `.admin-state-diff [data-diff-side="before"]` | `var(--ubm-color-text-secondary)` | 控えめなトーン |
| after（変更後・強調） | `.admin-state-diff [data-diff-side="after"]` | `var(--ubm-color-accent-ink)` | 強調文字色 + `font-weight: 600` |
| delete（退会・警告） | `.admin-state-diff[data-diff-kind="delete"] [data-diff-side="after"]` | `var(--ubm-color-warn)` | `delete_request` の after を警告トーンへ上書き |
| arrow（区切り） | `.admin-state-diff__arrow` | `var(--ubm-color-text-muted)` | 装飾矢印（`aria-hidden="true"`） |

> 補助で `var(--ubm-space-*)`（`gap`）を使う場合は実在トークン名を `tokens.css` で確認する（未定義なら既存値へ調整）。`accent-ink` / `warn` の正確なトークン名は実装時に `apps/web/src/styles/tokens.css` で実在を確認する（`_shared-context.md §5` の候補名と照合）。万一 `accent-ink` 系が未定義の場合のみ既存 accent 系トークンへ置換し、新規トークンは追加しない。

## 2. AC-5 HEX 直書き検査（0 件 = PASS）

```bash
# 対象 3 コンポーネント
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
# helper（新設時）
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/requestPublishStateDiff.ts 2>/dev/null && echo "FAIL" || echo "PASS"
# globals.css の .admin-state-diff ブロック
grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/styles/globals.css | grep -i "admin-state-diff" && echo "FAIL" || echo "PASS"
```

- 期待結果: いずれも `PASS`（HEX / `bg-[#` / `text-[#` が 0 件）。
- CI gate: `mise exec -- pnpm verify:tokens`（`verify-design-tokens`）をローカル実行し PASS を確認する。

## 3. AC-4 デザイントークン正本整合

- 使用トークンは全て `var(--ubm-color-*)` 経由で `apps/web/src/styles/tokens.css` の OKLch 値を参照する。
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`（トークン値 JSON 正本）と整合する。
- 新規トークンを追加する場合（原則発生しない想定）は `tokens.css` と `09b-design-tokens.md` の両正本を同時更新する。本タスクでは既存トークンで賄うため両正本更新は不要見込み。

## 4. AC-6 新規 primitive ゼロ

```bash
# components/ui/ への新規ファイル追加が無い（新規追加は helper のみ）
git status --porcelain apps/web/src/components/ui/   # 出力 0 行
```

- diff 表現は `data-diff-side` / `data-diff-kind` 属性 + `globals.css` クラスで構成し、`components/ui/` に新規 primitive を増やさない。
- `requestPublishStateDiff.ts` は純粋関数 helper（component / primitive ではない）であり AC-6 に抵触しない。

## 5. AC-7 diff ゼロ（apps/api / packages/shared）

```bash
git diff --name-only -- apps/api packages/shared   # 空であること
```

- 期待結果: 出力 0 行。projection 拡張・新 endpoint・schema 変更が一切ないことを保証する。
- diff 入力は 3 値（`memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState`）に限定され、`memberSummary` の `.strict()` schema を拡張しない。

## 6. 監査サマリ（期待値）

| 監査 | コマンド | 期待 | 担保 AC |
| --- | --- | --- | --- |
| HEX 直書き | grep HEX / `bg-[#` / `text-[#` | 0 件（PASS） | AC-5 |
| CI gate | `pnpm verify:tokens` | PASS | AC-5 |
| トークン正本整合 | tokens.css / 09b 照合 | 既存トークンのみ・新規追加 0 | AC-4 |
| 新規 primitive | `git status` `components/ui/` | 0 件 | AC-6 |
| データ層 diff | `git diff --name-only -- apps/api packages/shared` | 空 | AC-7 |
