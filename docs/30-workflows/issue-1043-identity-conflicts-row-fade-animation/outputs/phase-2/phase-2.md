# Phase 2: 設計

`[実装区分: 実装仕様書]` / `implementation_mode: new`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| phase | 2（設計） |
| 入力 | `phase-1/phase-1.md`（要件定義 / AC-1〜AC-11） |
| 出力 | state machine 設計・timer 管理・reduced-motion 戦略・className 戦略 |

## 目的

Phase 1 の AC を満たす実装の設計を確定する。具体的には `IdentityConflictRow` の row 消失を「即時 `return null`」から「exiting 相（fade 中・DOM 残存）→ removed 相（DOM 除去）」へ分離する state machine と、timer/transitionend の安全管理、reduced-motion 抑制、design token gate 非抵触の className 戦略を設計する。

## 2.0 要件レビュー（一次結論 / skill 要件レビュー思考法）

| 観点 | 結論 |
| --- | --- |
| **真の論点** | merge 成功時の row 消失を「即時 `return null`」から「視覚的手がかりのある退場（fade/collapse）」へ置き換える。ただし optimistic 体感・rollback 整合・reduced-motion a11y を壊さないこと |
| **依存・責務境界** | `stage`（dialog 制御）/ `isExiting`（退場アニメ中・DOM 残存）/ `optimisticMerged`（除去確定・`return null`）の 3 state を責務分離。timer/transitionend を 1 箇所に閉じ込め、rollback で必ず解除する |
| **価値とコスト** | 価値 = 連続 row 処理時の「どの row が処理されたか」の視覚的手がかり。最大コスト = exit timer と rollback の競合（row が消えたまま戻らない事故）。次点 = screenshot flaky 化、reduced-motion 回帰 |
| **改善優先順位** | (1) timer 競合の安全設計（rollback 必ず復元）> (2) reduced-motion 抑制 > (3) screenshot 安定化 |
| **4条件評価** | 価値性○（運用者 UX）/ 実現性○（単一 component + Tailwind transition、1 サイクル）/ 整合性○（API/hook/page 不変、state 責務分離）/ 運用性○（既存 #988 screenshot の意味 drift を #1043 metadata 注記で防止） |

### 因果ループ（最低 1 本ずつ）

- **バランスループ（安全装置）**: error 発生 → `.catch` で `clearTimeout(exitTimerRef)` + `isExiting=false` → row 復元 → 運用者が再操作可能。timer 競合という強化リスクを打ち消す。
- **強化ループ（UX 向上）**: fade 退場 → 運用者が処理済み row を視認 → 連続処理の確信度向上 → 誤操作減少。

### 意思決定権の所在

- 退場アニメの開始/中断の意思決定権は **component-local**（`IdentityConflictRow` instance）に閉じる。各 row が独立 instance で自身の `isExiting` / `optimisticMerged` / `exitTimerRef` を持つため cross-row race は構造的に発生しない。page.tsx（Server Component）・hook は不変。

## 2.1 state machine 設計（核心）

### state 一覧

| state | 型 | 役割 | 初期値 |
| --- | --- | --- | --- |
| `stage` | `"idle" \| "merge-confirm" \| "merge-final" \| "dismiss"` | dialog 表示制御（既存・不変） | `"idle"` |
| `optimisticMerged` | `boolean` | **removed 相**: true で `return null`（DOM 除去確定）。既存 state を維持 | `false` |
| `isExiting` | `boolean`（新規） | **exiting 相**: true で row は可視のまま fade out class を適用（DOM 残存） | `false` |
| `exitTimerRef` | `useRef<ReturnType<typeof setTimeout> \| null>`（新規） | exit fallback timer の保持。rollback で clear | `null` |

### 相遷移図

```
        onMerge() success path
visible ───────────────────────▶ exiting ──(transitionend / timeout fallback)──▶ removed (return null)
  ▲                                  │
  │   error (.catch)                 │  error (.catch) — fade 中に失敗が来た場合
  └──────────────────────────────────┘
         clearTimeout + isExiting=false（復元 / rollback）
```

| 相 | 条件 | render |
| --- | --- | --- |
| visible | `!optimisticMerged && !isExiting` | 通常 row（opacity-100） |
| exiting | `!optimisticMerged && isExiting` | row + fade out class（`opacity-0` 等） |
| removed | `optimisticMerged === true` | `return null` |

### ハンドラ設計

```ts
// 退場アニメの想定時間（ms）。Tailwind の duration-200 と一致させる。
const EXIT_ANIMATION_MS = 200;
// transitionend が来なかった場合の安全 fallback の余白
const EXIT_FALLBACK_BUFFER_MS = 50;

const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [isExiting, setIsExiting] = useState(false);

const finalizeRemoval = () => {
  if (exitTimerRef.current !== null) {
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
  }
  setOptimisticMerged(true); // removed 相へ
};

const onMerge = () => {
  setIsExiting(true); // exiting 相開始（fade out 視覚表現 = optimistic hide）
  // reduced-motion 環境では globals.css が transition-duration≈0 にするため、
  // transitionend がほぼ即時発火する。来ない環境向けに timeout fallback を張る。
  exitTimerRef.current = setTimeout(finalizeRemoval, EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS);
  void mergeMutation
    .trigger({ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() })
    .catch(() => {
      // rollback: exit timer を確実に解除し、exiting を解いて row を復元
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setIsExiting(false);
      // optimisticMerged は false のまま。既存 mergeError の inline 表示が surface する
    });
};

// JSX 側: 退場アニメ完了で removed へ
// <div onTransitionEnd={() => { if (isExiting) finalizeRemoval(); }} ... >

// アンマウント時の timer leak 防止
useEffect(() => () => {
  if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
}, []);
```

> **設計判断（timer/transitionend 二重化）**: `transitionend` は要素が複数 property（opacity + transform）を transition すると複数回発火しうる。`finalizeRemoval` 内で `clearTimeout` + `optimisticMerged=true` を行い、`optimisticMerged===true` 後は `return null` で再 render されないため、二重発火しても副作用は冪等。timeout fallback は `transitionend` が発火しない環境（要素が DOM detach 等）での removed 遷移を保証する。

## 2.2 CSS / className 設計（design token gate 非抵触）

| 相 | className（Tailwind utility 例） |
| --- | --- |
| 共通（root div） | 既存 `flex flex-col gap-3 rounded border ... p-4` に `transition-[opacity,transform] duration-200 motion-reduce:transition-none` を追加 |
| visible | （追加 class なし。opacity-100 既定） |
| exiting | `opacity-0 scale-[0.99]`（条件付きで付与） |

- 色は既存 `var(--ubm-color-*)` のまま。**HEX 直書き / inline `style={{}}` を一切追加しない** → `verify-design-tokens` gate green。
- `motion-reduce:transition-none` は Tailwind 標準 variant で `prefers-reduced-motion: reduce` 時に transition を無効化する。これに加え globals.css のグローバル `transition-duration: 0.001ms !important` が二重で保証する。
- `transform`（`scale`）は collapse 感の補助。opacity 単独でも AC を満たすため、`scale` は任意（実装者判断・Phase 8 で簡素化検討可）。

## 2.3 reduced-motion 戦略

| 機構 | 効果 |
| --- | --- |
| globals.css `@media (prefers-reduced-motion: reduce)`（既存・line 1998-2007） | 全要素の `transition-duration` を `0.001ms !important` 化。fade はほぼ即時完了し `transitionend` が即発火 → removed 即遷移 |
| Tailwind `motion-reduce:transition-none`（component に追加） | row root の transition を明示的に無効化（意図の可読性向上） |
| timeout fallback（`EXIT_ANIMATION_MS + BUFFER`） | transitionend 非発火環境でも removed 遷移を保証 |

→ reduced-motion 環境では「fade なしでほぼ即時に row が消える」= 旧 `return null` と同等の体感。AC-5 充足。

## 2.4 既存テストへの影響（回帰）

| 既存テスト（`IdentityConflictRow.spec.tsx`） | 影響 | 対応 |
| --- | --- | --- |
| `merge 実行直後に server 応答前でも row を optimistic に非表示にする`（line 99, `toBeNull()`） | fade 導入で「即 `toBeNull`」が成立しなくなる可能性。jsdom は transitionend を自動発火しないため timeout fallback 経由で removed になる | Phase 4/6 でテストを「`isExiting` 適用 → `finalizeRemoval`（transitionEnd 発火 or timer 進行）で `toBeNull`」へ更新。fake timers（`vi.useFakeTimers`）で fallback を制御 |
| `merge 失敗 (409) で optimistic 非表示を rollback し ...`（line 155） | rollback ロジック変更（exiting キャンセル）。意味は不変 | exiting=false 復元 + error 残存を検証する形へ更新 |
| dismiss 系テスト | 影響なし（dismiss 不変） | 変更なし |

> **jsdom の transitionend 制約**: jsdom は CSS transition を実行せず `transitionend` を自動発火しない。テストでは (a) `fireEvent.transitionEnd(rowEl)` で明示発火、または (b) `vi.useFakeTimers()` + `vi.advanceTimersByTime(EXIT_ANIMATION_MS + BUFFER)` で timeout fallback を進める、の 2 系統で removed 遷移を再現する。Phase 4 で両系統を明記する。

## 2.5 ステップ間 state 引き渡しテーブル（Feedback W1-02b-2）

本タスクは単一 component 内の state 機構であり multi-step wizard ではないが、相間の引き渡しを明記する。

| 遷移元相 | 遷移先相 | トリガ | 引き渡し / 副作用 |
| --- | --- | --- | --- |
| visible | exiting | `onMerge()` | `isExiting=true`、`exitTimerRef` セット、`mergeMutation.trigger` 発火 |
| exiting | removed | `transitionend` または timeout fallback | `finalizeRemoval()`: `clearTimeout` + `optimisticMerged=true` |
| exiting | visible | `trigger().catch`（error） | `clearTimeout` + `isExiting=false`（`optimisticMerged` は false 維持）、`mergeError` 表示 |

## 2.6 ロック変数の解放経路テーブル（Feedback STATE-DETAIL-01）

`exitTimerRef` を「解放責務のあるリソース」として全経路で clear する。

| 経路 | clear 箇所 |
| --- | --- |
| 正常（removed 到達） | `finalizeRemoval()` 内 |
| エラー（rollback） | `.catch` 内 |
| アンマウント | `useEffect` cleanup |

## 実行タスク

1. state machine（`stage` / `optimisticMerged` / `isExiting` / `exitTimerRef`）と相遷移を設計する（§2.1）。
2. timer/transitionend の二重化と rollback での確実な解放を設計する（§2.1 / §2.6）。
3. design token gate 非抵触の className 戦略を確定する（§2.2）。
4. reduced-motion 3 重保証を設計する（§2.3）。
5. 既存テストへの回帰影響と jsdom transitionend 制約への対応を整理する（§2.4）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 1 要件 | `../phase-1/phase-1.md` | AC-1〜AC-11 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 設計対象 |
| reduced-motion 基盤 | `apps/web/src/styles/globals.css`（line 1998-2007） | グローバル transition-duration 0 化 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-2/phase-2.md` | 設計書（要件レビュー / state machine / CSS className / reduced-motion 戦略 / 回帰影響 / ステップ間 state 引き渡し / ロック変数解放経路） |

## 統合テスト連携

- §2.4 の既存テスト回帰影響（line 99 / line 155）と jsdom transitionend 2 系統対応が Phase 4 のテスト設計の前提になる。
- §2.1 の相遷移と §2.6 のロック解放経路が Phase 4 の TC-EXIT / TC-ROLLBACK / TC-UNMOUNT-SAFE の期待値根拠。

## 完了条件（Phase 2）

- state machine（3 相 + timer ref）と相遷移を確定した。
- timer/transitionend の二重化と rollback での確実な解放を設計した。
- reduced-motion 3 重保証（globals.css / Tailwind variant / timeout fallback）を確定した。
- design token gate 非抵触の className 戦略を確定した。
- 既存テストへの回帰影響と jsdom transitionend 制約への対応方針を明記した。
- Phase 4（テスト作成）へ進行可能な設計を確定した。
