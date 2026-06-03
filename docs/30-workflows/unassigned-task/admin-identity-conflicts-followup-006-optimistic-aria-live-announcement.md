# Admin Identity Conflicts FU-006 — optimistic 消失時の aria-live アナウンス最適化 - タスク指示書

## メタ情報

```yaml
issue_number: 1094
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-006-optimistic-aria-live-announcement |
| タスク名 | optimistic row 消失時の screen reader live region アナウンス最適化 (FU-AIDC-008) |
| 分類 | 改善 |
| 補足分類 | a11y 改善 (post-MVP) |
| 対象機能 | `/admin/identity-conflicts` の optimistic 消失アナウンス |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | #1094 |
| 発見元 | `issue-1042-identity-conflicts-dismiss-optimistic-update` Phase 10 §10.4 MINOR 候補 2 / Phase 12 detection 記録漏れ |
| 発見日 | 2026-06-02 |
| canonical source | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-10/phase-10.md`（§10.4 行 63） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1042（dismiss optimistic update）/ Issue #988（merge optimistic update）で、merge / dismiss 実行直後に該当 row を `optimisticMerged || optimisticDismissed` の render guard で非表示にした。アナウンスは `IdentityConflictRow.tsx` で `role="status"` + `aria-live="polite"` の sr-only `<p>` を表示し、`optimisticStatusRef.current?.focus()` で focus を移譲して支援技術へ通知している。

### 1.2 問題点・課題

- 現行は row 全体を sr-only status node に**置換**したうえで `focus()` を奪う。focus stealing は支援技術利用者にとって文脈を失う原因になりうる（操作直後にカーソルが別ノードへ飛ぶ）。
- 複数 row を連続処理した場合、各 row の `role="status"` が同時に live region として読み上げられ、アナウンスが重複・競合する可能性がある（debounce / 集約の余地）。
- merge と dismiss でアナウンス文言が個別定義されており、将来 action 追加時にメッセージ整合が崩れやすい。

### 1.3 放置した場合の影響

- 機能・視覚要件は #1042 / #988 で充足済みのため緊急性はないが、screen reader 利用者の連続操作時に体感が劣化する余地が残る。
- a11y 回帰を後から個別修正すると、optimistic state（`optimisticMerged` / `optimisticDismissed`）と focus 制御の設計を再確認する必要がある。

---

## 2. 何を達成するか（What）

### 2.1 目的

optimistic 消失時の screen reader 通知を、focus stealing に依存しない / 連続処理でも競合しない形に最適化し、merge・dismiss で一貫したアナウンス体験を提供する。

### 2.2 最終ゴール

- optimistic 消失のアナウンスが、focus を奪わずに（または最小限の focus 制御で）確実に読み上げられる。
- 複数 row 連続処理時にアナウンスが重複・取りこぼしされない。
- merge / dismiss のアナウンス文言が単一の導出ロジックで一貫する。

### 2.3 受け入れ基準

- [ ] optimistic 消失時に `aria-live` 経由でアナウンスが読み上げられる（focus stealing に依存しない、もしくは focus 制御が a11y 上妥当であることを確認）。
- [ ] 複数 row を連続 dismiss / merge してもアナウンスが競合・欠落しない。
- [ ] merge / dismiss のアナウンス文言が単一の導出ロジックから生成される。
- [ ] 既存の rollback error（`role="alert"`）通知が非回帰で維持される。
- [ ] focused vitest に live region / focus 制御の assertion が追加され PASS。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | optimistic status / aria-live / focus 制御 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | live region / focus / 連続処理 test |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | a11y 通知の e2e 検証（任意） |
| `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/implementation-guide.md` | 現行 `role="status"` + focus handoff 設計の正本 |

### 3.2 実装方針

- row 単位の `role="status"` 置換 + `focus()` 移譲を見直し、ページレベルの単一 `aria-live` polite region に集約するか、focus を奪わない通知に切り替えるかを評価する。
- アナウンス文言は merge / dismiss / 将来 action を単一マップから導出する（現行の三項分岐を関数化）。
- API payload / mutation hook / D1 schema は不変（不変条件 #1）。
- 既存 `role="alert"`（rollback error）には手を入れない。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/components/admin/IdentityConflictRow.tsx`（`optimisticStatus` 導出 / `useEffect` focus handoff / render guard `if (optimisticStatus) return ...`）
- 症状: 現行は `optimisticMerged || optimisticDismissed` 成立時に row 全体を sr-only status node へ置換し `optimisticStatusRef.current?.focus()` で focus を奪う。各 row が独立 component instance のため、複数 row 同時消失で live region が複数発火し、screen reader のアナウンスが重複・上書きされうる。
- 参照: `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/implementation-guide.md`（render 分岐セクション）/ `outputs/phase-10/phase-10.md` §10.4 行 63
- 知見: row-local の live region は「消える DOM 自身に live region を載せる」構造のため、unmount タイミングと読み上げが競合しやすい。focus stealing を避けつつ確実に読み上げるには、(a) 親（一覧コンテナ）側の永続 `aria-live` region に集約する、(b) アナウンス文言を action 種別から単一導出する、の 2 点を分離設計するのが安全。#988 の「state は分離・合流は render guard のみ」の知見と同様、アナウンスも「発火源は row・読み上げ先は親の単一 region」へ責務分離するとよい。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| live region 集約で読み上げが取りこぼされる | 中 | 単一 region への文言更新を queue 化し、連続更新でも最後の状態が読まれる test を追加する |
| focus 制御変更で既存の操作フローが回帰する | 中 | focus を奪わない方式に変える場合、dismiss/merge 後のキーボード操作起点が妥当か unit / Playwright で確認する |
| rollback error（`role="alert"`）への波及 | 低 | error 通知のコードには触れず、optimistic status のみ変更する |
| アナウンス文言の導出関数化で文言 drift | 低 | merge / dismiss の文言を単一 map に固定し snapshot で固定する |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

期待: live region 通知・focus 制御・連続処理時の非競合 assertion が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --grep "optimistic|status|aria"
```

期待: optimistic 消失後にアナウンス相当の DOM 状態が安定して観測され、rollback error も非回帰。

### 静的検証

```bash
rg -n "role=\"status\"|aria-live|optimisticStatusRef|\.focus\(\)" apps/web/src/components/admin/IdentityConflictRow.tsx
```

期待: live region / focus 制御の実装箇所が単一導出に集約されている。

---

## スコープ

### 含む

- optimistic 消失時の `aria-live` アナウンス方式の最適化（focus stealing 見直し / 連続処理競合解消）。
- merge / dismiss アナウンス文言の単一導出化。
- focused unit / 任意の Playwright evidence の更新。

### 含まない

- API / D1 schema / shared schema の変更。
- merge / dismiss の mutation contract 変更。
- optimistic 消失そのものの挙動変更（#988 / #1042 で確定済み）。
- row fade animation（別タスク `admin-identity-conflicts-followup-005-row-fade-animation` / #1043 に分離）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/`
- Phase 12 実装ガイド: `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/implementation-guide.md`
- 最終レビュー（MINOR 候補出典）: `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-10/phase-10.md`（§10.4 行 63）
- 兄弟 followup（fade animation）: `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md` / Issue #1043
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 起点 Issue: https://github.com/daishiman/UBM-Hyogo/issues/1042
