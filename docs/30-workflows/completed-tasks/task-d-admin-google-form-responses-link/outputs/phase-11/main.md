# Phase 11 主証跡（VISUAL / local 自動テスト主証跡・screenshot は user-gated）

## 結論

本タスクは admin サイドバー nav へ外部リンク項目（「Form回答 ↗」）を 1 件追加する **VISUAL** 変更である。
通常 VISUAL は screenshot を主証跡とするが、対象画面 `/(admin)/admin/**` は **staging 認証（admin ログイン）
必須**で、認証を伴う staging 操作は **user-gated** である。

したがって本フェーズの主証跡は **`apps/web` の jsdom render unit / 純関数 unit / 定数 unit（自動テスト）** とし、
**screenshot は取得せず保留（pending / user-gated）** とする。

- local test 証跡: **present**（2026-06-01 にローカル実行済み・green）
- screenshot 証跡: **pending（user-gated）**（staging 認証必須のため取得計画のみ提示）

実装は dev へ landed 済み（親 PR #1064 / commit `745c95115`）であり、workflow_state は
`implemented_local_evidence_captured`。

## screenshot を取得しない（保留する）理由

- 対象は `/(admin)/admin/**` の admin shell であり、表示には **admin ロールでの認証** が前提。
- 認証情報を用いた staging 操作は **user-gated**（ユーザーの明示操作なしに実行しない方針）。
- 視覚的な振る舞い（外部リンクの anchor 属性・active 非付与・collapsed 時の sr-only ラベル・
  別タブ遷移）は **jsdom render unit で機械的に検証可能** であり、視覚回帰の核心は local test で担保できる。
- よって screenshot は「取らない」のではなく「user-gated として保留（pending）」であり、取得計画を後述する。

## Phase 11 evidence inventory（compliance 参照テーブル）

> Phase 12 compliance がパースする evidence inventory。status は `present` / `pending` / `n/a` の 3 値。

| Classification | Path | Status |
| --- | --- | --- |
| local jsdom render unit | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | present |
| local nav config unit | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | present |
| local constant unit | `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | present |
| screenshot（admin sidebar に Form回答 リンク表示） | `outputs/phase-11/screenshots/admin-sidebar-form-responses.png` | pending |
| screenshot（クリックで別タブに Google Form 編集画面） | `outputs/phase-11/screenshots/form-responses-new-tab.png` | pending |

## 証跡の主ソース（自動テスト）

| ソース | パス | 役割 |
| --- | --- | --- |
| jsdom render unit | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 外部 anchor の `target`/`rel`/`href`、active 非付与、collapsed sr-only を DOM 検証 |
| nav config unit | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | `buildNavForRole("admin")` の admin group に form-responses external 項目が含まれることを検証 |
| constant unit | `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | `FORM_RESPONSES_EDIT_URL` が canonical URL（CLAUDE.md formId 由来）に一致することを検証 |

## テストケース計画（TC 一覧）と AC マッピング

> 件数は landed 実装の実テストと対応付け済み。

### jsdom render unit（`SidebarNavItem.spec.tsx`・3 test）

| TC ID | 内容 | 対応 AC |
| --- | --- | --- |
| TC-R-01 | external item を `target=_blank` / `rel=noopener noreferrer` 付き anchor で描画し、`href=FORM_RESPONSES_EDIT_URL`、`aria-current=null` / `data-active=null`（active 非付与）、`textContent` に "Form回答" を含む | AC-D1 / AC-D2 / AC-D3 / AC-D4 |
| TC-R-02 | 内部 item は pathname 一致時に active（`aria-current="page"` / `data-active="true"`、`target=null`）を出す（AC-D4「外部項目に active を付けない」の裏返し回帰） | AC-D4 |
| TC-R-03 | `collapsed` のとき label span が `sr-only` になる | （UI 回帰・collapsed 表示維持） |

### nav config unit（`shell-config.spec.ts`）

| TC ID | 内容 | 対応 AC |
| --- | --- | --- |
| TC-C-01 | `buildNavForRole("admin")` の admin group に form-responses external 項目（`href` / `external` / `label` 一致）が含まれる | AC-D1 / AC-D3 |

### constant unit（`form-responses.spec.ts`）

| TC ID | 内容 | 対応 AC |
| --- | --- | --- |
| TC-K-01 | `FORM_RESPONSES_EDIT_URL` が canonical URL（CLAUDE.md フォーム固定値 `formId` 由来の `/edit` URL）に一致する | AC-D3 |

### AC 充足サマリ

| AC | 概要 | 充足証跡 |
| --- | --- | --- |
| AC-D1 | admin サイドバーに Google Form 回答編集への外部リンク項目を 1 件追加 | TC-R-01 / TC-C-01 |
| AC-D2 | 別タブで開く（`target=_blank`）かつ `rel=noopener noreferrer` を付与 | TC-R-01 |
| AC-D3 | リンク先 URL は `FORM_RESPONSES_EDIT_URL` 定数経由（hardcode しない・canonical 一致） | TC-R-01 / TC-C-01 / TC-K-01 |
| AC-D4 | 外部項目は active（`aria-current` / `data-active`）扱いにしない | TC-R-01 / TC-R-02 |

## 実テスト実行結果（2026-06-01 実測）

実装済みコードに対し、リポジトリルートから下記コマンドを実行する。

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/lib/constants/__tests__/form-responses.spec.ts
```

| spec | 実行結果 |
| --- | --- |
| `SidebarNavItem.spec.tsx` | 3 tests passed |
| `shell-config.spec.ts` | 9 tests passed |
| `form-responses.spec.ts` | 1 test passed |

合計: Test Files 3 passed (3) / Tests 13 passed (13) / exit 0。

> 補足: vitest はリポジトリルートから実行すること（worktree 内の `node_modules` / 2 config 分離のため）。
> 上記 spec は `*.spec.{ts,tsx}` 命名（不変条件 #8 準拠）であり、main glob で自動発見される。

## screenshot 取得計画（user-gated）

ユーザーが staging 認証操作を許可した場合、以下手順で視覚証跡を取得し、Status を `present` へ更新する。

1. staging の admin としてログインする（`/(admin)/admin` へ到達）。
2. サイドバー nav に「Form回答 ↗」項目が表示されることを撮影
   → `outputs/phase-11/screenshots/admin-sidebar-form-responses.png`。
3. 「Form回答 ↗」をクリックし、**別タブ**で Google Form 編集画面（`FORM_RESPONSES_EDIT_URL`）が開くことを撮影
   → `outputs/phase-11/screenshots/form-responses-new-tab.png`。
4. 元 admin 画面（撮影元タブ）が遷移していないこと、外部項目に active 表示が付かないことを目視確認。
5. 取得後、本 main.md の evidence inventory の該当 2 行を `pending` → `present` に更新する。

## 完了条件

完了条件は以下をすべて満たすこと。

1. 結論で VISUAL かつ screenshot が user-gated（pending）であること、local jsdom render を主証跡とすることが明記されている。
2. evidence inventory に local test 3 件が `present`、screenshot 2 件が `pending` で列挙されている。
3. 主ソース 3 spec と TC↔AC マッピング（AC-D1〜AC-D4）が記載されている。
4. 実テスト実行コマンドと実測 green 結果が記録されている。
5. screenshot 取得計画（user-gated）が手順として記載されている。
