# Phase 8: リファクタリング

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

> **automation-30 改善後の補正**: 本 Phase 作成時点ではリファクタ方針のみだったが、今回の改善で実コードへ反映済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED） |
| phase | 8（リファクタリング） |
| 編集対象 | `IdentityConflictRow.tsx`（編集）/ `IdentityConflictAnnouncer.tsx`（新規）/ `identityConflictAnnouncements.ts`（新規）/ `page.tsx`（編集） |
| リファクタ観点 | duplicate 削減（文言三項分岐 → 単一 map）/ 責務分離（発火源 = row / 読み上げ先 = 親 region）/ navigation drift 不存在確認 |

## 目的

optimistic 消失アナウンスの最適化差分に対し、過剰な抽象化を避けつつ、(1) merge / dismiss の文言三項分岐を単一導出 map（`announcementFor`）へ集約、(2) row-local `role="status"` 置換ブロックと focus stealing `useEffect` 撤去による row の責務縮小、(3) アナウンス所有権の親 region への移譲（navigation drift の不存在確認）、を `対象/Before/After/理由` テーブルで記録する（Feedback RT-03）。

## 実行タスク

### 8.1 リファクタ方針

差分は **(a) 新規 pure module `identityConflictAnnouncements.ts`（文言 map + `announcementFor`）/ (b) 新規 client component `IdentityConflictAnnouncer.tsx`（ページレベル単一 live region + announce context）/ (c) `IdentityConflictRow.tsx` の row-local status node・focus `useEffect` 撤去と context 呼び出し化 / (d) `page.tsx` の `<ul>` ラップ** に限定される。観点は **duplicate 削減（文言の単一化）/ 責務分離（row → 親 region）/ navigation drift 不存在** の 3 軸に絞る。新規 primitive は生やさない（不変条件 #9）。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| duplicate（重複ロジック） | merge / dismiss のアナウンス文言が row 内のインライン三項（`IdentityConflictRow.tsx:74-79`）で個別定義 → §8.2 で単一 map `IDENTITY_CONFLICT_ANNOUNCEMENTS` + `announcementFor()` へ集約（AC-4） | 文言は `action` をキーに引ける純粋写像であり map 化が同型 |
| 責務分離（navigation drift 削減） | アナウンスの読み上げ所有権を row-local（複数 instance に分散）から親 `IdentityConflictAnnouncer` の単一 region へ移譲。row は「発火」のみ担い `announce()` を 1 回呼ぶ | SSOT 設計方針「発火源 = row / 読み上げ先 = 親の単一 region」。複数 row 連続処理の競合（AC-3）を構造的に回避 |

### 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分意図を 1 行で追えるようにする。SSOT（index.md「主要シグネチャ」）と矛盾しない。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 文言定義（`IdentityConflictRow.tsx` L74-79 付近） | merge / dismiss のアナウンス文字列を row 内のインライン三項で個別定義 | **新規 module へ移設**: `identityConflictAnnouncements.ts` に `IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string>` map + `announcementFor(action)` を定義し、row はこれを import して使う | 文言の三項分岐を単一導出（AC-4）。将来 action 追加時も map に 1 行足すだけで網羅。pure module ゆえ単体テスト容易（TC-ANN-04） |
| 型定義 | （なし・action 概念が文字列リテラルとして散在） | `export type IdentityConflictAction = "merge" \| "dismiss";` を新規 module に集約 | merge / dismiss を型で固定し、map の網羅性（`Record<IdentityConflictAction, string>`）を型で担保 |
| 単一 live region（新規 component） | row-local `role="status"` + `aria-live="polite"` の sr-only node を **row ごとに**描画（`IdentityConflictRow.tsx:136-148`） | 新規 client component `IdentityConflictAnnouncer.tsx` が `role="status"` + `aria-live="polite"` の sr-only node を **ページに 1 つだけ**永続描画。append-children + TTL 自動除去で複数メッセージを順次読み上げ | row 単位の region 分散を 1 region へ集約（AC-1）。連続処理の上書き / collapse を回避（AC-3）。region 永続化で aria-live の re-mount 起因の読み上げ欠落を防ぐ |
| announce context（新規） | （なし） | `IdentityConflictAnnouncer` 内に `AnnounceFn = (message: string) => void` の context provider と `useIdentityConflictAnnounce()` hook を定義。provider 外では no-op fallback | 「発火源 = row / 読み上げ先 = 親 region」を context で疎結合に配線。row は region の DOM 構造を知らずに `announce()` できる |
| append-children + TTL | （row-local node は単発・上書き） | `messages: { id: number; text: string }[]` を `useState` 管理。`announce()` で push、`ANNOUNCE_TTL_MS`（=1000）後に当該 id を除去、unmount 時に全 timer clear | 各メッセージを個別 DOM child として追加し SR が順番に読み上げる（AC-3）。TTL で DOM 肥大を防ぐ。timer leak 防止に cleanup を集約 |
| row-local status 置換ブロック（`IdentityConflictRow.tsx` L136-148） | optimistic 除去確定時に row 全体を `<p role="status">…</p>` の sr-only node へ置換して描画 | **撤去**し `if (optimisticMerged \|\| optimisticDismissed) return null;` へ単純化 | 読み上げは親 region が担うため row-local status node は不要。row の責務を「optimistic hide で null を返し、成功後に announceOnce を呼ぶ」へ縮小 |
| focus stealing（`IdentityConflictRow.tsx` L81-84） | `optimisticStatusRef.current?.focus()` の `useEffect` で操作直後にカーソルを sr-only node へ移動 | **撤去**。代わりに「除去確定検知 → `announce(announcementFor(action))` を 1 回」の `useEffect` を置く（`hasAnnouncedRef` で多重発火抑止） | focus 非依存で確実に読み上げ（AC-1 / AC-2）。`document.activeElement` が status node にならない。focus 奪取による操作体感の劣化を解消 |
| `optimisticStatusRef`（`IdentityConflictRow.tsx` L35） | row-local status node 参照用 ref | **削除** | status node 撤去に伴い参照不要。残存は Phase 9 grep gate（`optimisticStatusRef` 0 件）で検知 |
| `page.tsx`（Server Component） | `<ul aria-label="...">{rows}</ul>` を直接描画 | `<ul>` を `<IdentityConflictAnnouncer>` でラップ（Server Component が client wrapper に children を渡す） | 単一 region を list 親に 1 つ配置。Server Component から client provider へ children を渡す境界を明示 |
| rollback error（`role="alert"` L248-257 / L296-305） | merge / dismiss 失敗時に inline error を `role="alert"` で表示 + row 復元 | **変更なし**（維持）。加えて rollback catch で `hasAnnouncedRef.current = false;` を併記し再アナウンス可能化 | AC-5 非回帰。rollback は alert 経路を維持し、再試行成功時に再度 announce できるようフラグを reset |

### 8.3 文言の単一導出（三項分岐 → 単一 map）の集約判断

文言は `action`（merge / dismiss）をキーに引ける純粋写像であり、**単一 map + `announcementFor()` へ集約する**（duplicate 削減・AC-4）。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()`（採用案） | **採用** | merge / dismiss / 将来 action を `Record<IdentityConflictAction, string>` で網羅。型で全 action 対応を強制。pure module で単体テスト容易（TC-ANN-04） |
| row 内のインライン三項のまま維持 | 却下 | merge / dismiss の文言が row component に密結合し、複数 component で再利用できない。将来 action 追加で三項が連鎖し可読性が低下 |
| 翻訳辞書 / i18n フレームワーク導入 | 却下 | 本タスクは sr-only 日本語固定 2 文言。i18n は過剰抽象（スコープ外・CONST_007）。将来 i18n 要件が立ったら独立タスク化 |

### 8.4 row 責務縮小の判断（status node / focus を親へ移譲）

row-local `role="status"` 置換ブロック（136-148）と focus `useEffect`（81-84）を撤去し、row の責務を「optimistic hide で `return null` し、mutation success 後に announce を 1 回呼ぶ」へ縮小する。

| 要素 | Before の責務 | After の責務 | 移譲先 |
| --- | --- | --- | --- |
| 読み上げ DOM（`role="status"`） | row が sr-only node を描画 | row は描画しない | 親 `IdentityConflictAnnouncer` の単一 region |
| focus 移動 | row が `focus()` で読み上げを誘発 | **撤去**（focus 非依存読み上げ） | aria-live の DOM mutation 検知（focus 不要） |
| アナウンス発火 | （focus + status node 描画で暗黙発火） | `announce(announcementFor(action))` を 1 回明示呼び | row（発火源として残す） |
| 除去確定 | row 全体を status node へ置換描画 | `return null` | row（責務縮小） |

> row は「いつアナウンスするか（発火タイミング）」だけを持ち、「どう読み上げるか（region 構造・順序制御・TTL）」は親へ移譲する。これにより複数 row が同一 region を共有し連続処理の競合が消える（AC-3）。

### 8.5 多重発火抑止フラグを維持する判断（reset 経路を明示）

`hasAnnouncedRef`（boolean ref）で「同一除去確定で複数回 announce しない」を保証する。rollback 時は reset し再アナウンス可能にする。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `hasAnnouncedRef` で 1 回保証 + rollback で reset（確定案） | **採用・維持** | `useEffect` 依存（`optimisticMerged` / `optimisticDismissed`）の再評価で多重 announce が起きるのを抑止。rollback（再表示）後に再度 merge/dismiss 成功したら再アナウンスできるよう reset |
| フラグなし（毎 effect で announce） | 却下 | 依存変化や再 render で同一文言が複数回読み上げられ、SR がノイズになる（AC-3 の「欠落・競合しない」に反する過剰読み上げ） |
| state（`useState`）でフラグ管理 | 却下 | announce 発火は描画に影響しない副作用。state 化すると不要な re-render を誘発。ref が適切 |

### 8.6 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | `IdentityConflictRow.tsx` / `page.tsx` / 新規 2 component のみ編集。endpoint / contract / D1 schema 不変 |
| #2 OKLch トークン正本 | 追加 markup は sr-only（`className="sr-only"`）の live region のみ。色 token を持たず HEX 直書き・`bg-[#xxx]` / `text-[#xxx]`・inline `style={{}}` ゼロ。新規 token 不要 |
| #5 D1 直接アクセス禁止 | client component は D1 binding を参照しない（既存 hook 経由のまま） |
| #9 admin primitive 範囲内 | 新規 `<input>` なし。`IdentityConflictAnnouncer` は sr-only 構造のみで視覚 primitive を生やさない |
| #10 legacy hook 不使用 | `useAdminMutation` は `@/features/admin/hooks` 経由のまま。新規 announce context は legacy `@/lib/useAdminMutation` に依存しない |

### 8.7 navigation drift / duplicate なし確認

- **navigation drift なし**: アナウンスの読み上げ所有権が row-local（複数 instance に分散）から親 `IdentityConflictAnnouncer` の単一 region へ **一方向に集約**する。row は発火（`announce()` 呼び出し）のみ担い、region 構造・順序制御・TTL を親に閉じる。page.tsx は wrapper を 1 つ置くだけで mutation/状態を持たない。責務が API / hook / 別画面へ漏れない。
- **duplicate なし**: 文言を `announcementFor()` に集約（§8.3）。row-local status node を撤去し region を 1 つに集約（§8.4）。連続処理の order 制御は append-children に一本化され重複ロジックなし。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF SSOT | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/index.md` | 設計方針（単一 region / append-children / focus 撤去 / 文言単一導出）/ 主要シグネチャ / AC-1〜AC-8 |
| 兄弟テンプレート（Before/After 書式） | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-8/phase-8.md` | 対象/Before/After/理由 テーブル書式・duplicate 集約判断・navigation drift 確認の書式 |
| 既存実装（Before 参照元） | `apps/web/src/components/admin/IdentityConflictRow.tsx` | row-local status node（136-148）/ focus useEffect（81-84）/ `optimisticStatusRef`（35）/ 文言三項（74-79） |
| 消費元タスク仕様書 | `docs/30-workflows/completed-tasks/admin-identity-conflicts-followup-006-optimistic-aria-live-announcement.md` | 苦戦箇所「発火源 = row / 読み上げ先 = 親の単一 region」 |

## 成果物

- 対象/Before/After/理由 テーブル（§8.2）。
- 文言三項 → 単一 map の集約判断（§8.3）。
- row 責務縮小（status node / focus を親へ移譲）判断（§8.4）。
- 多重発火抑止フラグ維持判断（§8.5）/ 不変条件再確認（§8.6）/ navigation drift・duplicate 不存在確認（§8.7）。

## 統合テスト連携

- §8.2 の After は Phase 4/6 の vitest 期待値（announce 1 回 / 連続非競合 / rollback 再アナウンス可）と整合する。`announcementFor()` 集約により Phase 7 の文言分岐 coverage が pure module 側 1 関数へ収束する。
- §8.4 の row 責務縮小（focus 撤去）は Phase 11 の手動 SR 検証（focus が移動しないことの確認）と直結する。

## 完了条件（Phase 8）

| 項目 | 基準 |
| --- | --- |
| Before/After 記録 | §8.2 で全変更が `対象/Before/After/理由` テーブル化されている |
| 文言単一導出 | merge/dismiss 三項 → `announcementFor()` 単一 map への集約方針が確定（duplicate 削減・AC-4） |
| row 責務縮小 | row-local status node（136-148）/ focus `useEffect`（81-84）/ `optimisticStatusRef`（35）撤去が明記されている |
| navigation drift | アナウンス所有権が親 region へ一方向集約し drift・新規 duplicate が不存在と確認済み |
| スコープ注記 | automation-30 改善後は local 実装済み・external ops のみ user-gated として同期済み |
