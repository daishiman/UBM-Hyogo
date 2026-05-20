# issue-769-followup-001 useAutoFocusOnMount shared hook 抽出 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | issue-769-followup-001-use-auto-focus-on-mount-hook                                             |
| タスク名     | `useAutoFocusOnMount(ref)` 共通 a11y hook の抽出と i05 / i06 error boundary への適用            |
| 分類         | 改善 / a11y (accessibility) refactor / DRY 化                                                   |
| 対象機能     | Next.js App Router error boundary 群の自動 focus 制御共通化                                     |
| 優先度       | 低（既に i05 / i06 で個別実装済み・regression なし。横展開耐性向上が主目的）                    |
| 見積もり規模 | 小（hook 1 ファイル新規 + i05 / i06 各 4 行差分 + hook 用 spec 1 本）                           |
| ステータス   | pending                                                                                         |
| 発見元       | issue-769 Phase 12 unassigned-task-detection (`docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md`) |
| 発見日       | 2026-05-17                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/issue-769-root-error-focus/`（Phase 12 unassigned-task-detection で followup candidate として記録済み）
- 親 workflow 状態: `local_implementation_complete_followup_recorded`
- 直接の起点 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` §4.3、および i05 = `parallel-i05-login-loading-and-error-focus/spec.md`
- 関連実装（抽出元 / 置換対象）:
  - `apps/web/app/error.tsx`（i06 で実装済み / 置換対象）
  - `apps/web/app/login/error.tsx`（i05 で実装済み / 置換対象）
- 関連既存ファイル（参考のみ）:
  - `apps/web/app/__tests__/error.component.spec.tsx`
- 新規追加候補:
  - `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
  - `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.ts`(t)x

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-769（root `apps/web/app/error.tsx` の h1 自動 focus 実装）の Phase 12 unassigned-task-detection において、以下が followup candidate として明示的に記録された:

> `useAutoFocusOnMount(ref)` shared hook — not created in this cycle. Requires i05 and i06 to settle first; premature extraction would create cross-task coupling.

i05 (`apps/web/app/login/error.tsx`) と i06 (`apps/web/app/error.tsx`) は同根（error boundary h1 への自動 focus 移譲）でありながら、並列実行下での編集衝突を避けるためそれぞれ独立に実装された。結果として 2 ファイルに **ほぼ同一の useRef + useEffect + focus({ preventScroll: true }) パターンが二重化** している状態にある。

### 1.2 問題点・課題

- i05 / i06 両ファイルで以下 4 要素が二重に出現している:
  1. `useRef<HTMLHeadingElement>(null)` の生成
  2. `useEffect` 内での `headingRef.current?.focus({ preventScroll: true })` 呼び出し
  3. h1 への `ref={headingRef}` 付与
  4. h1 への `tabIndex={-1}` 付与
- これらは 1 要素でも欠けると a11y regression（screen reader へのエラー通知失敗 / モバイル viewport snap / tab order 汚染）に直結する。
- 将来 `/admin/error.tsx` `/profile/error.tsx` 等の boundary を追加する際、現状のコピー実装ベースだと **`preventScroll: true` の指定漏れ** や **`tabIndex={-1}` 付け忘れ** が再発しやすい。
- i06 の苦戦箇所 §3.2 で言及されている「`preventScroll: true` の指定漏れが過去に他プロジェクトで focus 移動時の画面トップ snap UX 回帰を起こした」事例が、共通 hook 不在のままだと UBM-Hyogo でも将来再発しうる。

### 1.3 放置した場合の影響

- 新規 error boundary 追加のたびに 4 要素チェックリストを人手で運用する必要があり、CONST_005 的な「漏れの構造的予防」が成立しない。
- i05 / i06 の実装が時間経過で微妙に diverge（例: 片方だけ `preventScroll` を消すリファクタが入る）し、a11y baseline が boundary ごとに不揃いになるリスク。
- task-22 regression smoke で a11y baseline を取りに行く際、boundary ごとに focus 挙動が微妙に異なると diff 検知が複雑化する。
- error boundary 以外の文脈（modal の見出し focus 等）で同じ hook が欲しくなった時、抽出資産が無く都度ローカル実装される。

---

## 2. 何を達成するか（What）

### 2.1 目的

i05 / i06 で二重化している「マウント直後に ref 対象要素へ `focus({ preventScroll: true })` を移譲する」パターンを `useAutoFocusOnMount(ref)` 共通 hook として抽出し、両 error boundary を hook 呼び出し 1 行に集約する。将来の boundary 追加時に focus 管理漏れを構造的に予防する。

### 2.2 最終ゴール

- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` が新規作成され、以下シグネチャを持つ:
  ```ts
  export function useAutoFocusOnMount<T extends HTMLElement>(
    ref: React.RefObject<T>,
    options?: FocusOptions,
  ): void;
  ```
- 内部実装は `useEffect(() => { ref.current?.focus({ preventScroll: true, ...options }); }, []);` を基本形とし、`preventScroll: true` を **default かつ明示的な opt-out のみ許容** する設計。
- `apps/web/app/error.tsx` の `useEffect` 内 focus 呼び出しが `useAutoFocusOnMount(headingRef)` に置換される（`logger.error` の副作用は分離した既存 `useEffect` として残す or 同一 effect 内で順序維持）。
- `apps/web/app/login/error.tsx` も同様に置換される。
- `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` で hook 単体の挙動が検証される（mount 後に `focus` が呼ばれる / `preventScroll: true` がデフォルト適用される / unmount で 2 重呼び出しが起きない）。
- 既存 `apps/web/app/__tests__/error.component.spec.tsx` および i05 側 boundary テストが置換後も PASS を維持する（外部から見た挙動の不変性）。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 関連 vitest が 0 fail。

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` の新規作成
- `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` の新規作成
- `apps/web/app/error.tsx` への hook 適用（i06 既存実装の置換）
- `apps/web/app/login/error.tsx` への hook 適用（i05 既存実装の置換）
- 既存 error boundary component test の通過確認

#### 含まないもの

- error.tsx 以外のコンポーネント（modal / dialog / toast 等）の focus 管理改修
- `/admin/error.tsx` `/profile/error.tsx` 等 **未存在の boundary** の新規作成
- `useAutoFocusOnMount` を利用する側の文言・スタイル変更
- `logger.error` 呼び出しシグネチャ・タイミングの変更（hook 抽出と独立に既存挙動を保つ）
- focus trap や roving tabindex 等、別カテゴリの a11y hook の同時導入
- `apps/api` 側への変更

### 2.4 成果物

- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`
- `apps/web/app/error.tsx` の差分（約 4 行 → 2 行への置換）
- `apps/web/app/login/error.tsx` の差分（同上）
- 既存 / 新規テスト PASS の evidence（typecheck / lint / vitest log）
- 本タスク用 spec (`docs/30-workflows/issue-769-followup-001-use-auto-focus-on-mount-hook/` 配下 or 親 workflow 下、実行時に Phase 1-13 で決定)

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 i05 / i06 並列実行下で抽出できなかった経緯

i05 と i06 は同根の問題（error boundary h1 への自動 focus 移譲未実装）でありながら、parallel-07 retrospective で「共通 hook 抽出を i05 / i06 並列実行中に同時投入するとファイル衝突を起こす」と判断され、各々が独立に useRef / useEffect / tabIndex を直接書く形で実装された。i06 の苦戦箇所 §3.3 解決策候補 4 でも明示的に「**i05 と i06 を独立に完了させた後、別 followup として hook 抽出するのが安全**（並列実行中の i05 と本タスクで同じファイルを編集して衝突するのを避ける）」と記録されている。

このため本タスクの **前提依存** として「i05 (`apps/web/app/login/error.tsx`) と i06 (`apps/web/app/error.tsx`) の両方が `dev` に merge 済み」であることが必須となる。merge 前に抽出を始めると、それぞれの parallel-07 派生ブランチでの衝突が再発する。

### 3.2 `preventScroll: true` の default 指定責任の所在

i06 苦戦箇所 §3.2 で記録されている通り、`focus({ preventScroll: true })` の `preventScroll` を落とすと **モバイル viewport が画面トップへ snap する UX 回帰** を起こす。共通 hook を抽出する際、この指定責任を呼び出し側に委ねると hook 化のメリットが半減するため、以下の設計判断が必要:

- (A) hook が `preventScroll: true` を強制し、呼び出し側からは変更不能
- (B) hook が `preventScroll: true` を default とし、`options` 引数で opt-out 可能
- (C) hook は何もデフォルト指定せず、呼び出し側が毎回明示

本タスクは **(B) を採用** する。理由は、scroll を許可したい legitimate ケース（例: 長文 boundary でユーザーに見出し位置までスクロールさせたい）が将来出る可能性を残しつつ、デフォルトの安全側を hook が握ることで「**指定漏れによる UX 回帰**」を構造的に予防できるため。`options` を `FocusOptions` 型で受け取り、`{ preventScroll: true, ...options }` の順で merge することで opt-out を明示的にする。

### 3.3 `useEffect` 依存配列と `logger.error` 副作用の分離

i06 既存実装では 1 つの `useEffect` 内で `logger.error → focus` の順を厳守している（i06 §3.3-2 で固定された運用ルール）。共通 hook を抽出すると `useAutoFocusOnMount` 内部に `useEffect` が独立で生まれるため、`logger.error` 用 `useEffect` と focus 用 hook の **実行順序保証** が課題になる。

React 18+ では `useEffect` の実行順序は宣言順に従うため、呼び出し側で以下順序を守れば既存挙動を維持できる:

```tsx
useEffect(() => {
  logger.error({ event: "error.boundary.caught", ... });
}, [error]);
useAutoFocusOnMount(headingRef);
```

ただし `useAutoFocusOnMount` 側の deps が `[]`（mount only）であるのに対し、`logger.error` 側は `[error]` 依存である点に注意。error が再 throw された際に focus が再実行されない設計（mount only）で問題ないかは、i06 親 spec の DoD と整合させて確認する必要がある。

### 3.4 解決策候補（実施順）

1. **前提確認**: i05 / i06 の両 PR が `dev` に merge 済みか確認。未 merge であれば本タスクを着手しない。
2. **hook 単体実装**: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` を作成し、`FocusOptions` opt-out 設計（§3.2 (B)）で実装。
3. **hook 単体テスト**: vitest + `@testing-library/react` の `renderHook` で mount 後 focus 呼び出し / `preventScroll: true` デフォルト / opt-out 動作を検証。
4. **i06 置換**: `apps/web/app/error.tsx` の useRef は維持（hook 引数として渡すため）、focus 呼び出しのみ hook に委譲。`logger.error` の `useEffect` は分離した独立 effect として残し、§3.3 の宣言順を厳守。
5. **i05 置換**: `apps/web/app/login/error.tsx` も同様に置換。
6. **既存 component test 再実行**: 既存の boundary test がそのまま PASS することを確認（外部から見た挙動の不変性）。
7. **typecheck / lint**: hook の型推論と既存呼び出し側の型整合を確認。

### 3.5 学んだこと / 横展開メモ

- 「並列実行中の共通化抽出は禁止」というのは parallel-07 retrospective から得られた構造的教訓であり、本タスクのような followup として明示的に切り出して順序依存を可視化することで安全に DRY 化できる。
- 共通 hook の `options` 設計では、**安全側 default を hook が握る** ことで指定漏れ regression を構造的に予防できる（i06 §3.2 の `preventScroll` 教訓を hook 設計に内在化）。
- `useEffect` を hook 内部に隠す場合、呼び出し側の他 `useEffect` との実行順序を docstring / spec で明示しないと、後続改修で順序入れ替えが発生しやすい。
- 将来 `useAutoFocusOnMount` が modal 系で再利用される際は、`tabIndex={-1}` 付与責任が hook 利用側に残る点を docstring に明記する（hook は ref 経由でしか DOM に触れないため tabIndex を強制できない）。

---

## 4. 受入条件 (AC)

- **AC-1**: 前提依存「i05 (`apps/web/app/login/error.tsx`) と i06 (`apps/web/app/error.tsx`) の両方が `dev` へ merge 済み」が満たされていることを着手時に確認している。
- **AC-2**: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` が新規作成され、`useAutoFocusOnMount<T extends HTMLElement>(ref: React.RefObject<T>, options?: FocusOptions): void` のシグネチャを持つ。
- **AC-3**: hook 内部で `preventScroll: true` がデフォルト適用され、`options` 引数で opt-out 可能（`{ preventScroll: true, ...options }` の merge 順）。
- **AC-4**: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` が存在し、以下を検証して PASS する:
  - mount 後に ref 対象要素へ `focus` が呼ばれる
  - `preventScroll: true` がデフォルトで渡る
  - `options` で opt-out が機能する
  - unmount 時に副作用が漏れない
- **AC-5**: `apps/web/app/error.tsx` の focus 呼び出しが `useAutoFocusOnMount(headingRef)` に置換され、h1 の `ref={headingRef}` / `tabIndex={-1}` は維持されている。
- **AC-6**: `apps/web/app/login/error.tsx` も同様に hook 呼び出しに置換されている。
- **AC-7**: 既存 `apps/web/app/__tests__/error.component.spec.tsx` および i05 側 boundary test が hook 適用後も PASS を維持する（外部挙動の不変性）。
- **AC-8**: `mise exec -- pnpm typecheck` が 0 error。
- **AC-9**: `mise exec -- pnpm lint` が 0 error / 既存 baseline と同等の warning 数以下。
- **AC-10**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run a11y/useAutoFocusOnMount` および同 boundary test が 0 fail。
- **AC-11**: hook の docstring に「`tabIndex={-1}` の付与は呼び出し側責任」「実行順序保証は呼び出し側の `useEffect` 宣言順に依存」が明記されている。
- **AC-12**: issue-769 Phase 12 unassigned-task-detection の followup candidate 表で本タスクが `consumed_by_followup_001` 相当の状態に更新できる（親 workflow の status sync が可能な状態）。

---

## 5. 参照資料

- `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` — followup candidate の発見元
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` — i06 タスク指示書（§3.3-4 / §3.4 で hook 抽出時期を規定）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` — i06 親 spec（Before/After 実装パターン）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md` — i05 親 spec
- `apps/web/app/error.tsx` — i06 抽出元 / 置換対象
- `apps/web/app/login/error.tsx` — i05 抽出元 / 置換対象
- `apps/web/app/__tests__/error.component.spec.tsx` — i06 既存テスト（regression 監視）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 継承
- React 公式: [`useEffect` execution order](https://react.dev/reference/react/useEffect) — §3.3 実行順序保証の根拠
- WAI-ARIA: [`tabindex="-1"` programmatic focus pattern](https://www.w3.org/WAI/ARIA/apg/) — AC-11 docstring の根拠
