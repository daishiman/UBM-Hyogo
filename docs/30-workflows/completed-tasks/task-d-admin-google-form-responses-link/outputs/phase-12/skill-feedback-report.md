# Phase 12 — skill feedback report（Task D: admin サイドバー外部リンク）

本タスクで得た再利用可能な知見と、skill（task-specification-creator / aiworkflow-requirements）への同一 wave 反映結果。

## 知見 1: VISUAL だが screenshot が user-gated の two-tier evidence

### 観測

本タスクは admin サイドバー nav に項目を 1 件追加する **VISUAL** 変更だが、対象画面 `/(admin)/admin/**` は
staging 認証（admin ログイン）必須であり、認証を伴う staging 操作は user-gated である。よって screenshot は
取得できず、`pending`（user-gated）として保留した。

### 知見

VISUAL タスクでも、対象画面が認証境界の内側にある場合は **two-tier evidence** を採るのが妥当:

- **tier 1（主証跡・present）**: `apps/web` の jsdom render unit / 純関数 unit / 定数 unit。
- **tier 2（補助・pending）**: staging screenshot は user-gated として保留。

compliance の Phase 11 evidence inventory では screenshot を `pending` とし、`workflow_state` を
`implemented_local_evidence_captured`（screenshot 完了を待たない）に置く。

### 反映結果

`task-specification-creator` の Phase 11 ガイドへ「VISUAL かつ認証必須画面のとき screenshot=pending /
local render unit=主証跡 とする two-tier evidence パターン」を同一 wave で追記済み。

- 反映先: `.claude/skills/task-specification-creator/references/phase-template-phase11.md`

## 知見 2: 網羅型 Record による icon 追加の型強制

### 観測

nav icon は `Record<ShellNavIcon, ReactNode>`（網羅型）で管理されており、`ShellNavIcon` union に
`"form-responses"` を追加すると、対応する icon entry を `icons.tsx` に足さない限り **型エラー**になる。

### 知見

union 拡張 + 網羅型 Record の組み合わせは、「新 nav 項目の icon 追加忘れ」を CI（typecheck）で機械的に強制できる。
新 nav 項目追加時は (1) union に key 追加 → (2) Record に entry 追加 がワンセットで型に守られる。

### 反映結果

`aiworkflow-requirements` の UI/shell 正本へ「nav icon は網羅型 Record で管理し key 追加を型強制する」契約を同一 wave で記録済み。

- 反映先: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- 反映先: `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- 反映先: `.claude/skills/aiworkflow-requirements/references/workflow-task-d-admin-google-form-responses-link-artifact-inventory.md`

## 知見 3: 外部リンクの active 除外パターン

### 観測

サイドバー nav は現在ページを active（`aria-current` + 強調）で示すが、外部リンクは「サイト外」なので
アプリ内の現在地と一致しない。external 項目は active 判定から**除外**するのが正しい。

### 知見

`external?: boolean` フラグで描画分岐するとき、external 分岐では:

- `<a target="_blank" rel="noopener noreferrer">` で描画（不変条件 #7・タブナビング防止）、
- `↗`（`aria-hidden`）+ `sr-only`「（外部リンク）」で判別、
- **active 判定（`aria-current` / 強調クラス）を付与しない**。

href はハードコードせず定数（`FORM_RESPONSES_EDIT_URL`）を単一正本とする。

### 反映結果

`task-specification-creator` の patterns に「external nav 項目テンプレ（target/rel/↗/sr-only/active 除外/URL 定数化）」を
汎用パターンとして同一 wave で追加済み。

- 反映先: `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md`

## promote サマリ

| # | 知見 | promote 先 | 種別 |
| --- | --- | --- | --- |
| 1 | two-tier evidence（VISUAL + 認証必須 → screenshot pending） | task-specification-creator Phase 11 | 反映済み |
| 2 | 網羅型 Record による icon 型強制 | aiworkflow-requirements UI/shell 参照 | 反映済み |
| 3 | external nav 項目テンプレ（active 除外含む） | task-specification-creator patterns | 反映済み |

> skill feedback は候補記録で止めず、今回サイクルで owning skill/reference へ反映済み。

## 完了条件

- 本タスクで得た知見が 3 件以上記録されていること。
- 各知見に反映先 skill/reference が示され、同一 wave で反映済みであること。
- two-tier evidence / 網羅型 Record 型強制 / external active 除外が含まれること。
