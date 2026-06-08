# sidebar account popover 外側クリック閉じロジックの汎用 useDismissable hook 抽出 - タスク指示書

## メタ情報

```yaml
issue_number: 1102
```

## メタ情報

| 項目         | 内容                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| タスクID     | sidebar-footer-pinning-and-account-popover-ux-followup-001-usedismissable-hook-extraction |
| タスク名     | `SidebarUserMenu` の外側クリック / Escape 閉じロジックを汎用 `useDismissable(ref, onClose)` hook へ抽出 |
| 分類         | リファクタリング（共通化 / DRY）                                                |
| 対象機能     | `apps/web` shell — `SidebarUserMenu` popover の dismiss 挙動                     |
| 優先度       | 低                                                                              |
| 見積もり規模 | 小規模                                                                          |
| ステータス   | 実装済み（`docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/` で implemented_local_evidence_captured） |
| 発見元       | sidebar-footer-pinning-and-account-popover-ux（Phase 3 MINOR TECH-M-02 / Phase 10 引き継ぎ）|
| 発見日       | 2026-06-02                                                                      |

---

## 0. 解決記録（2026-06-06）

本 follow-up は `docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/` で実装済み。

- 実装: `apps/web/src/hooks/useDismissable.ts`
- テスト: `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`
- 移行: `SidebarUserMenu.tsx` / `DensityToggle.client.tsx`
- 証跡: focused vitest 3 files / 35 tests PASS
- 残 user gate: commit / push / PR / Issue mutation

このファイルは発見元の履歴として保持し、現行正本は上記 workflow root とする。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `sidebar-footer-pinning-and-account-popover-ux` の C3（account popover の外側クリック / Escape 閉じ）で、ネイティブ `<details>` 要素が「外側クリックで閉じる」標準挙動を持たない問題に対応した。実装は `SidebarUserMenu.tsx` 内の `useEffect` に閉じ込め、`browserDocument()` 経由で `pointerdown` / `keydown`(Escape) listener を登録し、`detailsRef.current.open = false` で閉じる方式に着地した（`apps/web/src/components/shell/SidebarUserMenu.tsx:33-57`）。

このロジックは「ref で囲った領域の外側クリック / Escape で onClose を呼ぶ」という、popover / dropdown / context menu で頻出する汎用パターンである。

### 1.2 問題点・課題

- 現状 dismiss ロジックは `SidebarUserMenu` 内の匿名 `useEffect` にインライン化されており、同種の popover / dropdown を追加した際にコピー実装される懸念がある。
- listener 登録（pointerdown + keydown）/ cleanup（removeEventListener）/ `browserDocument()` ガード（SSR 安全）という 3 つの定型処理が component 本体に混在し、`SidebarUserMenu` の責務（role 別 action 集約）と dismiss 機構の責務が同居している。
- 親タスクの不変条件 I-2（state owner 単一 = `<details>.open` が正本、React state は派生のみ）/ I-5（browser API 入口は `browserDocument()` 経由）を hook 化で明示境界として固定できていない。

### 1.3 放置した場合の影響

- 2 つ目の popover / dropdown（例: admin の通知ベル、bulk action の確認 popover 等）が追加された際、同じ pointerdown + keydown + cleanup ロジックが重複実装され、片側だけ Escape 対応漏れ / cleanup 漏れ（リーク）といった drift が発生しうる。
- `browserDocument()` ガードを忘れた素の `document.addEventListener` が混入すると、SSR / Workers ランタイム境界（I-5）を破る回帰の温床になる。

> **YAGNI 判断の明示**: 親タスク Phase 8 / Phase 10 では「現時点の再利用先は 1 箇所のみ（rule of three 未到達）」を理由に early abstraction を見送り、本サイクル内では `SidebarUserMenu` ローカル実装に閉じる判断をした。本タスクは **2 つ目の dismissable popover / dropdown が必要になった時点で着手する**前提の follow-up であり、それまでは候補として温存する。先行着手しても抽象が 1 利用者向けに歪むリスクがあるため、再利用需要の顕在化を着手トリガーとする。

---

## 2. 何を達成するか（What）

### 2.1 目的

`SidebarUserMenu` 内の外側クリック / Escape 閉じロジックを、再利用可能な `useDismissable(ref, onClose, options?)` hook として `apps/web/src/components/shell/`（または `apps/web/src/hooks/`）へ抽出し、`SidebarUserMenu` から呼び出す形に置き換える。挙動は完全不変。

### 2.2 最終ゴール

- 新規 hook `useDismissable(ref: RefObject<HTMLElement>, onClose: () => void, options?: { enabled?: boolean })` を追加する。
- `SidebarUserMenu` の `useEffect`（pointerdown / keydown 登録）を hook 呼び出し 1 行へ置換する。
- 既存の `SidebarUserMenu.spec.tsx` の外側クリック / Escape / 内側クリック維持 / route close のテストが無改修で全パスする（挙動不変の証跡）。
- hook 単体の spec（`useDismissable.spec.tsx`）を追加し、外側 pointerdown で onClose 発火 / 内側で非発火 / Escape で発火 / cleanup で listener 解除を保護する。

### 2.3 スコープ

#### 含むもの

- `useDismissable` hook の新規追加（`browserDocument()` 経由・SSR 安全・cleanup 込み）。
- `SidebarUserMenu` の dismiss ロジックの hook 呼び出しへの置換。
- hook 単体テスト + `SidebarUserMenu.spec` の回帰確認。

#### 含まないもの

- `<details>.open` を React state 化する変更（I-2 に反するため禁止。`open` の正本はネイティブ `<details>` のまま。hook は `onClose` コールバックを受け、呼び出し側が `details.open = false` を行う設計に限定）。
- 既存以外の popover / dropdown への横展開（本タスクは抽出 + 既存 1 箇所の置換まで。2 箇所目の適用は適用先タスクの責務）。
- `<details>` 以外（独自 state 駆動 popover）への汎用化拡張（必要になった時点で options を拡張）。

### 2.4 成果物

- `apps/web/src/components/shell/useDismissable.ts`（または `hooks/useDismissable.ts`）
- `apps/web/src/components/shell/__tests__/useDismissable.spec.tsx`
- `SidebarUserMenu.tsx` の差し替え + 既存 spec の回帰パス

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親タスク `sidebar-footer-pinning-and-account-popover-ux` の C3 実装が landed 済み（`SidebarUserMenu.tsx:33-57` に dismiss ロジックが存在する状態）。
- 2 つ目以降の dismissable popover / dropdown の再利用需要が顕在化していること（着手トリガー。rule of three を厳密適用しないとしても、最低 1 つの追加利用予定があること）。

### 3.2 依存タスク

- 親: `sidebar-footer-pinning-and-account-popover-ux`（C3 / AC-3）
- 着手トリガー: 2 つ目の dismissable UI を要するタスク（未起票）

### 3.3 必要な知識

- ネイティブ `<details>` の open 制御と、外側クリック非対応という標準仕様の限界。
- `browserDocument()`（`apps/web/src/lib/is-browser.ts`）による SSR / Workers 安全な document アクセス（不変条件 I-5）。
- React `useEffect` の listener cleanup パターン（removeEventListener の対称登録）。
- 親タスク不変条件 I-2（state owner は `<details>.open` 単一・React state は派生のみ）。

### 3.4 推奨アプローチ

1. `useDismissable(ref, onClose, options)` を作る。内部は現行 `SidebarUserMenu` の `useEffect` をほぼそのまま移植し、`details.open` チェックを汎用化して `options.enabled`（既定 true）でガードする形にする。
2. hook は `pointerdown`（外側判定 = `ref.current.contains(target)` 偽）と `keydown`(Escape) を `browserDocument()` 経由で登録し、cleanup で解除する。`onClose` は呼び出し側が `details.open = false` を行うコールバックとして渡す（hook は open state を所有しない = I-2 維持）。
3. `SidebarUserMenu` 側は `useDismissable(detailsRef, () => { if (detailsRef.current) detailsRef.current.open = false; })` の 1 行へ置換する。route close（pathname 監視）の `useEffect` は責務が別なので hook 化対象外に保つ。
4. hook spec で「外側 pointerdown → onClose 発火」「内側 → 非発火」「Escape → 発火」「unmount → listener 解除」を保護。`SidebarUserMenu.spec` は無改修で再実行し回帰ゼロを確認。

---

## 4. 実行手順

### Phase 構成

1. hook 抽出
2. `SidebarUserMenu` 置換
3. テスト追加 + 回帰確認

### Phase 1: hook 抽出

#### 目的

`SidebarUserMenu` の dismiss ロジックを `useDismissable` hook へ移植する。

#### 手順

1. `apps/web/src/components/shell/useDismissable.ts` を作成。
2. `browserDocument()` ガード → pointerdown / keydown 登録 → cleanup の構造を移植し、外側判定を `ref.current?.contains(target)` で汎用化。
3. `options.enabled === false` のとき listener を張らない早期 return を入れる。

#### 完了条件

hook が型エラーなくビルドでき、open state を所有しない（onClose コールバックのみ）設計になっている。

### Phase 2: `SidebarUserMenu` 置換

#### 目的

インライン `useEffect` を hook 呼び出しへ差し替える。

#### 手順

1. `SidebarUserMenu.tsx:33-57` の dismiss `useEffect` を削除。
2. `useDismissable(detailsRef, () => { if (detailsRef.current) detailsRef.current.open = false; })` を追加。
3. route close `useEffect`（pathname 依存）は残す。

#### 完了条件

`SidebarUserMenu` の挙動が変わらず、import が `useDismissable` 経由に整理されている。

### Phase 3: テスト追加 + 回帰確認

#### 目的

hook 単体保護 + 既存 spec 回帰ゼロ。

#### 手順

1. `useDismissable.spec.tsx` を追加（外側 / 内側 / Escape / cleanup）。
2. `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/shell/__tests__/useDismissable.spec.tsx` を実行。

#### 完了条件

両 spec が全パス。`pnpm typecheck` / `pnpm lint` 緑。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `useDismissable` が外側 pointerdown で onClose を呼ぶ
- [ ] 内側クリックでは onClose を呼ばない
- [ ] Escape キーで onClose を呼ぶ
- [ ] unmount 時に listener が解除される（リークなし）
- [ ] `SidebarUserMenu` の外側クリック / Escape / 内側維持 / route close が無改修 spec で回帰ゼロ

### ドキュメント要件

- [ ] hook の JSDoc に「open state を所有しない（I-2）」「`browserDocument()` 経由（I-5）」を明記
- [ ] 親タスク implementation-guide からの相互リンク（任意）

### 品質要件

- [ ] `<details>.open` を React state 化していない（I-2 維持）
- [ ] 素の `document.addEventListener` を使わず `browserDocument()` 経由（I-5）
- [ ] HEX 直書きなし（CSS 変更を伴わないため非該当だが grep gate 通過）
- [ ] `pnpm typecheck` / `pnpm lint` 緑

---

## 6. 苦戦箇所・知見（再発防止）

親タスク `sidebar-footer-pinning-and-account-popover-ux` の C3 実装で実際に詰まった点と、本 hook 抽出時に注意すべき点を、将来の popover / dropdown dismiss 系タスクで活かせる粒度で記録する。

### 6.1 ネイティブ `<details>` は外側クリックで閉じない

- HTML 標準の `<details>` / `<summary>` は summary クリックでのトグルのみを提供し、「popover の外側をクリックしたら閉じる」挙動を持たない。CSS だけでは実現不能で、JS listener が必須だった。
- 対策: `pointerdown`（click より早く確実に拾える）+ `keydown`(Escape) を document に登録し、`details.contains(event.target)` が偽のときだけ `details.open = false` にした。
- 教訓: `<details>` ベース popover を採用する利点（ネイティブ a11y / キーボード操作 / `open` 属性の単純さ）と引き換えに「外側クリック閉じは自前」になる。この trade-off を hook 化で隠蔽し、利用側が listener 管理を意識しなくて済む形にするのが本タスクの主眼。

### 6.2 state owner を二重化しない（I-2 が最重要制約）

- 外側クリック閉じを React state（`const [open, setOpen]`）で持ちたくなるが、`<details>` はネイティブに `open` 属性を持つため、React state と二重管理すると hydration mismatch / トグルの取りこぼしが起きる。
- 対策: open の正本はあくまでネイティブ `<details>.open`。listener は `detailsRef.current.open` を直接読み書きし、React state を導入しなかった。
- 教訓: hook 抽出時も `useDismissable` に open state を持たせてはいけない。hook は「外側 / Escape を検知して `onClose` を呼ぶだけ」に責務を限定し、`open = false` の実行は呼び出し側に委ねる。これにより I-2（state owner 単一）を hook の型シグネチャで強制できる。

### 6.3 browser API は必ず `browserDocument()` 経由（I-5 / SSR・Workers 境界）

- `apps/web` は Cloudflare Workers + Next.js App Router（`@opennextjs/cloudflare`）で SSR されるため、module top-level や render 中に素の `document` を触ると Workers ランタイムで落ちる。
- 対策: `browserDocument()`（`apps/web/src/lib/is-browser.ts`）が browser 文脈でのみ document を返し、それ以外は null を返す。`useEffect` 内 + null ガードで安全化した。
- 教訓: hook 化で `document.addEventListener` を直書きすると、利用側が SSR 境界を意識せず使えてしまい I-5 を破る回帰の温床になる。hook 内部で `browserDocument()` を必ず通し、null のとき no-op にする実装に固定する。

### 6.4 早期抽象化の誘惑と rule of three

- C3 実装時点で「これは汎用 dismissable だ」と気付いたが、再利用先が `SidebarUserMenu` 1 箇所のみだったため、親タスクでは抽出を見送り Phase 12 で未タスク化候補として記録した。
- 教訓: 「汎用に見える」だけで抽出すると、唯一の利用者向けに API が歪む（例: `<details>` 専用 API になり他 popover で使えない）。2 つ目の利用者が現れて初めて「本当に共通な部分」が見える。本 follow-up は再利用需要の顕在化を着手トリガーとし、それまで温存する判断が正しい。

---

## 7. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-2-design.md`（C3 設計）
- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-3-design-review.md`（MINOR TECH-M-02）
- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-10-final-review.md`（Task 10-3 / Phase 12 引き継ぎ）
- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-12/implementation-guide.md`

### 関連コード

- `apps/web/src/components/shell/SidebarUserMenu.tsx`（dismiss ロジック 33-57 行）
- `apps/web/src/lib/is-browser.ts`（`browserDocument()`）
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`

### 関連 issue / task

- 親: `sidebar-footer-pinning-and-account-popover-ux`
- 兄弟候補: `sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation`
