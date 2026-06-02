# Admin Identity Conflicts FU-005 — optimistic row 消失の fade animation - タスク指示書

## メタ情報

```yaml
issue_number: 1043
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-005-row-fade-animation |
| タスク名 | optimistic row 消失に fade animation を追加 (FU-AIDC-007) |
| 分類 | 改善 |
| 補足分類 | UX 改善 (post-MVP) |
| 対象機能 | `/admin/identity-conflicts` の row 消失表現 |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | #1043 |
| 発見元 | `issue-988-identity-conflicts-merge-optimistic-update` Phase 12 unassigned-task-detection 候補 2 |
| 発見日 | 2026-05-30 |
| canonical source | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #988 では merge 実行直後に row を `return null` で即時非表示にした。これは受け入れ基準「操作直後に row が一覧から消える」を満たす最小実装であり、animation は scope creep として Phase 12 で保留された。

### 1.2 問題点・課題

- row が瞬時に消えるため、運用者によっては「どの row が処理されたか」が唐突に見える可能性がある。
- fade animation を入れる場合、`prefers-reduced-motion`、rollback、screenshot baseline を同時に扱う必要がある。

### 1.3 放置した場合の影響

- 機能上の問題はないが、複数 row を連続処理する操作では視覚的な手がかりが不足する可能性がある。
- 後から個別に animation を足すと、merge / dismiss の optimistic state と rollback 設計を再確認する必要がある。

---

## 2. 何を達成するか（What）

### 2.1 目的

optimistic hide 時に短い fade / collapse 表現を追加し、処理対象 row が消えたことを視覚的に分かりやすくする。

### 2.2 最終ゴール

- merge optimistic hide は即時の体感を維持しつつ、短時間の fade で消える。
- `prefers-reduced-motion: reduce` では animation を抑制する。
- rollback 時は row が復元し、error 表示が見える。

### 2.3 受け入れ基準

- [ ] optimistic hide 時に row が短時間で fade out / collapse する。
- [ ] `prefers-reduced-motion` 環境では animation が無効または最小化される。
- [ ] rollback 時に row が復元し、error alert が視認できる。
- [ ] Playwright screenshot が animation 後の安定状態で取得され、flaky にならない。
- [ ] 既存 `identity-conflict-row-optimistic-removed.png` の意味が drift しないよう、capture metadata が更新される。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | row visibility / animation state |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | reduced motion / rollback test |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | screenshot timing / visual evidence |
| `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/phase11-capture-metadata.json` | screenshot canonical 名と撮影状態 |
| `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md` | 現行 `return null` 設計の正本 |

### 3.2 実装方針

- まず現行 `return null` の即時削除を、短い exiting state に置き換えるか判断する。
- animation 追加時も API payload / mutation hook は不変にする。
- animation のためだけに design token 体系を増やさず、既存 token / CSS utility / reduced-motion variant を使う。
- Playwright では animation 中ではなく安定後の DOM 状態を待つ。

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260529-211028-wt-18/apps/web/src/components/admin/IdentityConflictRow.tsx`
- 症状: Issue #988 の現行実装は `if (optimisticMerged) return null;` により DOM を即時削除するため、CSS transition を当てる DOM が残らない。
- 参照: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md`
- 知見: fade を入れるには「非表示フラグ」と「DOMを残す exiting phase」を分ける必要があり、rollback 時には exiting timer をキャンセルする設計が必要になる。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| animation timer が rollback と競合して row が消えたままになる | 中 | timeout / transitionend を1箇所に閉じ込め、reject 時に exiting state を必ず解除する test を追加する |
| screenshot が animation 中に撮影されて flaky になる | 中 | Playwright で animation 完了後の stable locator state を待ってから screenshot を撮る |
| motion preference を無視して a11y 回帰になる | 中 | `prefers-reduced-motion` 時の挙動を unit または Playwright context で確認する |
| UI token を直接色指定して design token gate に抵触する | 低 | 既存 `var(--ubm-color-*)` / utility の範囲に限定し、HEX 直書きを避ける |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

期待: fade/collapse state、rollback、reduced motion 分岐の assertion が PASS。

### 統合検証

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR="$PWD/docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/screenshots" \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --grep "optimistic|animation|rollback"
```

期待: animation 後に対象 row が消え、rollback error state の screenshot が安定して取得される。

### 静的検証

```bash
rg -n "#[0-9a-fA-F]{3,8}|style=\\{\\{" apps/web/src/components/admin/IdentityConflictRow.tsx
```

期待: animation 追加に伴う HEX 直書き / inline style 追加がない。

---

## スコープ

### 含む

- optimistic row hide の fade / collapse 表現。
- reduced-motion 対応。
- focused unit / Playwright evidence の更新。
- screenshot metadata / implementation-guide の必要最小更新。

### 含まない

- API / D1 schema / shared schema の変更。
- merge / dismiss の mutation contract 変更。
- dismiss optimistic update そのもの（完了済み canonical workflow `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/` に分離・実装済み）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/`
- Phase 12 実装ガイド: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md`
- 未タスク検出: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/unassigned-task-detection.md`
- screenshot metadata: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/phase11-capture-metadata.json`
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 起点 Issue: https://github.com/daishiman/UBM-Hyogo/issues/988
