# Phase 8: リファクタリング

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 8（リファクタリング） |
| 編集対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx`（単一 component） |
| リファクタ観点 | duplicate 削減 / navigation drift 削減 / 定数 module スコープ化 / MINOR-1 簡素化確定 |

## 目的

exiting fade の実装差分（`isExiting` state + `exitTimerRef` + `finalizeRemoval` + timeout/transitionEnd 二重化 + rollback の timer clear）に対し、過剰な抽象化を避けつつ、(1) timer clear ロジックの重複集約可否、(2) module スコープ定数化、(3) MINOR-1（scale 簡素化）の確定、(4) duplicate / navigation drift の不存在確認、を `対象/Before/After/理由` テーブルで記録する（Feedback RT-03）。

## 実行タスク

### 8.1 リファクタ方針

差分は **単一 component への state 1 個（`isExiting`）+ ref 1 個（`exitTimerRef`）+ helper 1 個（`finalizeRemoval`）+ JSX の transition class / `onTransitionEnd` 追加 + `onMerge` 差し替え** に限定される。hook 化・別 file 切り出しはしない（不変条件: 新規 primitive / hook を生やさない）。観点は **duplicate 削減 / navigation drift（責務分散）削減** の 2 軸 + 定数 module スコープ化に絞る。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| duplicate（重複ロジック） | timer clear が `.catch` 内と `finalizeRemoval` 内の 2 箇所に出現 → §8.3 で集約方針を確定 | clear は `if (ref !== null) { clearTimeout; ref = null; }` の同型 |
| navigation drift（責務分散） | row 可視性所有権を row-local（`isExiting` / `optimisticMerged` / `exitTimerRef`）に閉じる | Phase 2.1 確定。page.tsx / hook / API には触れない |

### 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分意図を 1 行で追えるようにする。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| state 宣言（`IdentityConflictRow.tsx` L28-29 付近） | `stage` / `optimisticMerged` / `mergeReason` / `dismissReason` | 末尾に `const [isExiting, setIsExiting] = useState(false);` と `const exitTimerRef = useRef<ReturnType<typeof setTimeout> \| null>(null);` を追加 | exiting 相を row-local state で所有（Phase 2.1）。`stage` union には混ぜない |
| module スコープ定数 | なし（magic number 不在） | file 冒頭（component 外）に `const EXIT_ANIMATION_MS = 200;` `const EXIT_FALLBACK_BUFFER_MS = 50;` を追加 | duration を 1 箇所に集約し Tailwind `duration-200` との整合を可読化。render 毎の再生成も避ける |
| timer clear helper | （なし） | `clearExitTimer()`（`if (exitTimerRef.current !== null) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null; }`）を component 内に定義し、`finalizeRemoval` / `.catch` / `useEffect` cleanup から呼ぶ | §8.3。clear ロジックの 3 経路重複を 1 helper に集約（duplicate 削減） |
| `finalizeRemoval` | （なし） | `clearExitTimer()` → `setOptimisticMerged(true)`（removed 相へ） | exiting → removed の確定。冪等（removed 後は `return null` で再 render されない） |
| `onMerge`（L64-75） | `setOptimisticMerged(true)` → `trigger().catch(() => setOptimisticMerged(false))` | `setIsExiting(true)` → `exitTimerRef.current = setTimeout(finalizeRemoval, EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS)` → `trigger().catch(() => { clearExitTimer(); setIsExiting(false); })` | optimistic hide を即時 `return null` から exiting fade 経由へ置換。rollback で timer 解放 + exiting 解除 |
| JSX root `<div>`（L95） | `className="flex flex-col gap-3 rounded border ... p-4"` | `transition-[opacity,transform] duration-200 motion-reduce:transition-none` を追加し、`isExiting` 時に `opacity-0`（+ 任意 `scale-[0.99]`）を条件付与。`onTransitionEnd={() => { if (isExiting) finalizeRemoval(); }}` を付与 | exiting 相の視覚 fade + transitionEnd→removed。HEX / inline style は追加しない |
| `useEffect` cleanup | （なし） | `useEffect(() => () => clearExitTimer(), [])` を追加 | アンマウント時の timer leak 防止 |
| `mergeMutation.onSuccess`（L42-45） | `setStage("idle")` / `setMergeReason("")` | **変更なし**（維持） | success 時は exiting → removed のまま。`router.refresh()`（既存 hook 内）が list を後追い整合 |
| dismiss 経路（`onDismiss` / `cancelDismiss` / dismiss markup） | 既存のまま | **変更なし**（不変） | Issue #1043 スコープ外（AC-6: dismiss 不変） |

### 8.3 timer clear ロジックの集約判断

clear は 3 経路（`finalizeRemoval` / `.catch` / `useEffect` cleanup）に出現し、いずれも同型のため **`clearExitTimer()` helper に集約する**（duplicate 削減）。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `clearExitTimer()` helper に集約（採用案） | **採用** | 3 経路の clear が `if (ref !== null) { clearTimeout; ref = null; }` で完全同型。集約で解放漏れリスクを構造的に低減（Phase 2.6 の 3 経路を 1 helper に束ねる） |
| 各経路にインライン展開のまま維持 | 却下 | 3 箇所コピペで解放忘れ / null 代入忘れの事故が起きやすい |
| 専用 hook（`useExitTimer`）へ切り出し | 却下 | 単一 component 内の小ロジックに対し過剰抽象。新規 hook を生やさない方針に反する |

### 8.4 MINOR-1 の確定（scale 簡素化）

Phase 3.4 MINOR-1 をここで確定する。

| 要素 | 確定 |
| --- | --- |
| opacity fade | **主**（必須）。`isExiting` 時 `opacity-0` を付与し、transition-[opacity] で fade out |
| scale | **任意**（補助）。collapse 感が欲しい場合のみ `scale-[0.99]` を付与可。なくても AC を満たす |
| height collapse（行高縮小） | **行わない**。layout reflow が grid/flex 構成に依存し Playwright flaky リスク（Phase 3.4 MINOR-1） |

> 実装は opacity 主・scale 任意で確定。height collapse は本タスクで実施しない。

### 8.5 独立 boolean / 独立 state を維持する判断（union に戻さない guard）

Phase 1.5 / Phase 2.1 で `stage`（dialog 制御）/ `isExiting`（退場アニメ中・DOM 残存）/ `optimisticMerged`（除去確定）の 3 責務分離が確定済み。リファクタで union 化しないこと。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `isExiting: boolean` + `optimisticMerged: boolean` 独立（確定案） | **採用・維持** | exiting（可視 fade 中）と removed（DOM 除去）を分離。rollback 復元先（exiting 解除 → visible）が曖昧にならない |
| `stage` に `"exiting"` / `"removed"` を足して union 化 | **却下（リファクタで戻さない）** | dialog 表示制御と row 可視性が結合し、rollback で復元すべき stage が判別不能になる。責務境界を崩す |

### 8.6 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | `IdentityConflictRow.tsx` のみ編集。endpoint / contract 不変 |
| #2 OKLch トークン正本 | 追加 markup は transition utility（`transition-[opacity,transform]` / `duration-200` / `motion-reduce:transition-none` / `opacity-0`）のみ。HEX 直書き・`bg-[#xxx]` / `text-[#xxx]`・inline `style={{}}` ゼロ |
| #9 admin form は primitive 経由 | `Button` / `Textarea` / `Badge` 既存 primitive のまま。新規 `<input>` なし |
| #10 legacy hook 不使用 | `useAdminMutation` は `../../features/admin/hooks` 経由のまま |

### 8.7 navigation drift / duplicate なし確認

- **navigation drift なし**: row 可視性の所有権は component-local の `isExiting` / `optimisticMerged` / `exitTimerRef` に閉じ、page.tsx（Server Component）・hook・API へ責務が漏れない。各 row は独立 instance で cross-row race が構造的に発生しない。
- **duplicate なし**: timer clear を `clearExitTimer()` に集約（§8.3）。他に重複ロジックなし。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF Phase 2 設計 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-2/phase-2.md` | ハンドラ設計（§2.1）/ className 戦略（§2.2）/ timer 解放経路（§2.6） |
| 本WF Phase 3 レビュー | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-3/phase-3.md` | MINOR-1（scale 簡素化）§3.4 |
| 兄弟テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-8/phase-8.md` | Before/After テーブル書式・union 化しない guard |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | Before の参照元 |

## 成果物

- 対象/Before/After/理由 テーブル（§8.2）。
- timer clear の `clearExitTimer()` 集約判断（§8.3）。
- MINOR-1 確定: opacity 主・scale 任意・height collapse なし（§8.4）。
- union 化しない guard（§8.5）/ 不変条件再確認（§8.6）/ drift・duplicate 不存在確認（§8.7）。

## 統合テスト連携

- §8.2 の After は Phase 4/6 の vitest 期待値（exiting → removed → rollback）と整合する。`clearExitTimer()` 集約により Phase 7 の timer 解放 3 経路 coverage が 1 helper に収束する。
- MINOR-1 の opacity 主・height collapse なしは、Phase 9 ゲート 4（Playwright 安定 locator state 待ち）の flaky 防止に直結する。

## 完了条件（Phase 8）

| 項目 | 基準 |
| --- | --- |
| Before/After 記録 | §8.2 で全変更が `対象/Before/After/理由` テーブル化されている |
| timer clear 集約 | `clearExitTimer()` への集約方針が確定（duplicate 削減） |
| MINOR-1 確定 | opacity 主・scale 任意・height collapse なし が明記されている |
| union 化しない guard | `isExiting` / `optimisticMerged` 独立維持が明記されている |
| drift / duplicate | navigation drift・新規 duplicate がいずれも不存在と確認済み |
