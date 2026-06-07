# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

> **automation-30 改善後の補正**: 本 Phase 作成時点ではAC判定基準のみだったが、今回の改善でAC-1〜AC-8のsource-level evidenceを取得済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED） |
| phase | 10（最終レビュー） |
| 編集対象 | `IdentityConflictAnnouncer.tsx`（新規）/ `identityConflictAnnouncements.ts`（新規）/ `IdentityConflictRow.tsx`（編集）/ `page.tsx`（編集）/ test 2 file |
| GATE 条件 | AC-1〜AC-8 全充足 + partial fix（producer/consumer 断絶）不在 + BLOCKER 0 件 |

## 目的

AC-1〜AC-8 を 1 件ずつ充足判定の観点で表にし（実装後に green / 充足を埋める前提の判定基準を提示）、BLOCKER / MINOR の判定基準を定め、partial fix（producer = row の announce 発火だけ動いて consumer = 親 region の読み上げまで通らない断絶）が起きないことを確認する。MINOR は Phase 12 で未タスク化を検討する。**本タスク本体は CONST_007 に従い 1 サイクルで完了するスコープであり、MINOR はすべて将来の独立改善である旨を明記する。**

## 実行タスク

### 10.1 受け入れ基準（AC）充足判定の観点

> 各行の「判定方法 / 判定基準」は実装後に green / 充足を埋める前提のチェックリスト。BLOCKER 列が Yes の AC は 1 件でも未達なら Phase 11（手動 SR 検証）に進まない。

| # | 受け入れ基準 | 判定方法 | 判定基準（充足条件） | BLOCKER |
| --- | --- | --- | --- | --- |
| AC-1 | optimistic 消失時にページレベル単一 `aria-live="polite"` region 経由でアナウンスされる（row-local status node 非使用） | vitest（TC-ANN-01 / TC-ROW-01）/ 手動 SR | region が DOM に 1 つ + optimistic 確定で `announce` が呼ばれ child が追加される。row-local `role="status"` 置換ブロック不在 | **Yes（中核）** |
| AC-2 | focus stealing に依存しない（操作直後にカーソルが sr-only node へ移動しない） | vitest（TC-ROW-02）/ grep（Phase 9 ゲート 7・8）/ 手動 SR | optimistic 確定後 `document.activeElement` が status node にならない + `optimisticStatusRef` / `.focus()` grep 0 件 | **Yes（中核）** |
| AC-3 | 複数 row 連続 dismiss/merge でアナウンスが競合・欠落しない（append-children） | vitest（TC-ANN-02 / TC-ROW-03）/ 手動 SR | 連続 `announce` で child が順番に追加され各メッセージが保持される（上書きされない） | **Yes（中核）** |
| AC-4 | merge / dismiss 文言が単一導出ロジック（`announcementFor`）から生成される | vitest（TC-ANN-04 / TC-ROW-06）/ diff 確認 | row 内インライン三項が消え、文言は `IDENTITY_CONFLICT_ANNOUNCEMENTS` map から `announcementFor()` 経由で取得 | Yes |
| AC-5 | 既存 rollback error（`role="alert"`）が非回帰で維持 | vitest（TC-ROW-04）/ diff 確認 | merge/dismiss 失敗時に inline error（`role="alert"`）surface + row 復元。alert markup（248-257 / 296-305）に diff なし | **Yes（中核）** |
| AC-6 | focused Vitest に live region / 非 focus-steal / 連続非競合 / rollback 非アナウンス assertion を追加し PASS | Phase 9 ゲート 3・4 | TC-ANN-01〜06 + TC-ROW-01〜06 all-green | Yes |
| AC-7 | `pnpm typecheck` / `pnpm --filter web lint` green | Phase 9 ゲート 1・2 | 型エラー / lint 違反 0 | Yes |
| AC-8 | legacy `@/lib/useAdminMutation` 未参照（0 件）。HEX 直書き / inline style 追加なし（`verify-design-tokens` green） | Phase 9 ゲート 5・6 | grep 0 件 + token gate PASS | Yes |

> AC-1〜AC-8 はいずれも自動テスト / 静的 gate で機械判定でき、staging 認証や user-gated 要素を BLOCKER に含まない（NON_VISUAL ゆえ screenshot 取得もない）。手動 SR 検証（Phase 11）は補強であり BLOCKER 外（実装後 user-gated）。

### 10.2 BLOCKER / MINOR 判定基準

| 区分 | 判定基準 |
| --- | --- |
| **BLOCKER** | AC-1〜AC-8 のうち BLOCKER=Yes が未達 / partial fix（row の announce 発火だけ動いて region 読み上げまで通らない）検出 / 不変条件 #1・#2・#9・#10 違反 / focus stealing 残存（`optimisticStatusRef` / `.focus()` grep ヒット）/ rollback alert 回帰 / token gate fail のいずれか。1 件でも該当すれば Phase 11 進行不可 |
| **MINOR** | AC を阻害しない改善余地（aria-atomic 最適値・TTL 動的調整・announcer 汎用化等）。Phase 11 進行は阻害せず、Phase 12 の unassigned-task-detection で未タスク化を検討。**本タスク本体のスコープには含めない（CONST_007 / 将来の独立改善）** |

### 10.3 partial fix 検出（producer/consumer wiring 断絶の不在確認）

本タスクは「**row が `announce()` を発火（producer）したが、親 `IdentityConflictAnnouncer` の region に届かず / region が child を描画せず読み上げまで通らない（consumer 断絶）**」partial fix が起きやすい。row 単一 component に閉じた #1043 と異なり、本タスクは **row → context → 親 region の cross-component 配線**を持つため、以下の連結を明示確認する。

| 連結ポイント | producer | consumer | partial fix の兆候 |
| --- | --- | --- | --- |
| announce 配線 | row の `useEffect` で `announce(announcementFor(action))` | context provider（`IdentityConflictAnnouncer`）の `announce` 実体 | `page.tsx` が `<ul>` を `<IdentityConflictAnnouncer>` でラップし忘れ → row が no-op fallback を掴み読み上げゼロ |
| region 描画 | `announce()` が `messages` に push | `<div role="status" aria-live="polite">{messages.map(...)}</div>` が child を描画 | push しても map 描画漏れ → DOM に child が出ず SR 無音 |
| 連続処理順序 | 連続 `announce()` | append-children（id 採番で個別 child） | id 衝突 / 同一 key で上書き → 後続メッセージが欠落（AC-3 破れ） |
| TTL 除去 | `setTimeout(removeById, ANNOUNCE_TTL_MS)` | 該当 id の child を `messages` から除去 | TTL 漏れ → child 蓄積で DOM 肥大 / leak |
| 非 focus-steal | `optimisticStatusRef` / `.focus()` 撤去 | render が status node を描画しない（`return null`） | 撤去取り残し → focus 奪取が残り AC-2 破れ |

> **consumer wiring 確認**: `page.tsx` の wrapper 配線（`<IdentityConflictAnnouncer>` で `<ul>` をラップ）が断絶すると row は context の no-op fallback を掴み、読み上げが**静かに**ゼロになる（throw しないため気づきにくい）。Phase 9 ゲート 3・4 の vitest は `renderWithAnnouncer` 配下で「child が DOM に追加された（consumer まで通った）」を assert し、context 値のみの assertion にしない。

### 10.4 不変条件・スコープ最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は 新規 2 file + 既存 3 file 編集 + 新規 test 1 file（+ 任意 Playwright 1 file）のみ | 範囲逸脱なし |
| `useAdminMutation` hook 未変更 | 維持 |
| `tokens.css` / `globals.css` 未変更（sr-only のため色変更なし） | 維持 |
| API endpoint / contract / D1 schema 未変更（#1） | 維持 |
| rollback alert 経路不変（AC-5） | 維持 |
| 全変更 `apps/web` 内・単一 PR・1 実装サイクルで完了（CONST_007） | 維持 |

### 10.5 MINOR 指摘と未タスク化候補（Phase 12 へ送る）

> 下記はいずれも AC-1〜AC-8 を阻害せず Phase 11 進行を妨げない。**本タスク本体は 1 サイクルで完了するスコープであり、以下 MINOR はすべて将来の独立改善**（CONST_007）。Phase 12 の unassigned-task-detection で formalize 要否を判定する。

| 候補 | 区分 | 根拠 | 本サイクルで formalize するか / 未タスク化か（判断軸） |
| --- | --- | --- | --- |
| `aria-atomic` の最適値検討（region に `aria-atomic="true"` を付すべきか） | MINOR | append-children では各 child が独立追加されるため `aria-atomic` 既定（false）で個別読み上げが成立するが、SR 実機での読み上げ粒度（部分更新を全文読み直すか）に挙動差がある可能性 | **未タスク化**。判断軸: 既定で AC-1/AC-3 を満たすため本体スコープ外。実機 SR（VoiceOver/NVDA）の差異が観測された場合のみ tuning タスク化 |
| `ANNOUNCE_TTL_MS` の動的調整（メッセージ長 / 連続数に応じた TTL） | MINOR | 固定 1000ms は短文 2 文言には十分だが、将来の長文 action や高頻度連続処理で読み上げ途中除去のリスク | **未タスク化**。判断軸: 現行 2 文言は固定 TTL で十分（AC-3 充足）。長文/高頻度 action 追加時に動的 TTL を独立検討 |
| 複数 admin 画面への live-region 横展開（announcer の汎用化） | MINOR / followup | `IdentityConflictAnnouncer` は identity-conflicts 専用。tags / members / meetings 等の optimistic 操作でも同じ a11y 課題が再発し得る。汎用 `AdminLiveRegion` への抽出余地 | **未タスク化**。判断軸: 横展開は本 Issue スコープ外（#1094 は identity-conflicts 限定）。汎用化は他画面の要件確定後に独立タスク。本タスクで先取り汎用化すると YAGNI |
| Playwright での実 SR 検証（CI 制約で不可） | MINOR | aria-live の実読み上げは CI 上の Playwright（headless）では検証不可。実機 SR が必要 | **未タスク化（恒久制約）**。判断軸: CI で実 SR は構造的に不可能。Phase 11 の手動 SR 検証（user-gated）で代替し、自動側は「region 存在 + row-local status 非存在」の非回帰 e2e に留める |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF SSOT | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/index.md` | AC-1〜AC-8 原文 / 主要シグネチャ / スコープ（CONST_007） |
| 本WF Phase 8 | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/outputs/phase-8/phase-8.md` | 撤去要素 / 責務分離（発火源 = row / 読み上げ先 = 親 region） |
| 本WF Phase 9 | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/outputs/phase-9/phase-9.md` | 品質ゲート一括判定セット / 撤去 grep |
| 兄弟テンプレート | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-10/phase-10.md` | AC 表 / partial fix 検出 / MINOR 未タスク化書式 |

## 成果物

- AC-1〜AC-8 の充足判定観点表（§10.1）。
- BLOCKER / MINOR 判定基準（§10.2）。
- partial fix（row → context → 親 region の cross-component 配線断絶）不在確認（§10.3）。
- 不変条件・スコープ最終確認（§10.4）/ MINOR 未タスク化候補 4 件（§10.5・各 MINOR に formalize/未タスク化の判断軸付与）。

## 統合テスト連携

- §10.1 の AC 判定は Phase 7 coverage・Phase 9 ゲート結果を集約して埋める。
- §10.3 の partial fix 確認は Phase 9 ゲート 3・4（vitest が `renderWithAnnouncer` 配下で child の DOM 追加を assert）と連動。
- §10.5 の MINOR は Phase 12 の unassigned-task-detection へ接続する。

## 完了条件（Phase 10）

| 項目 | 基準 |
| --- | --- |
| AC 充足表 | AC-1〜AC-8 が 1 件ずつ判定方法 / 判定基準 / BLOCKER 区分とともに表化されている |
| GATE 条件 | AC-1〜AC-8 の BLOCKER=Yes が全充足 + partial fix 不在 + BLOCKER 0 件 のとき Phase 11 進行可 |
| partial fix | row → context → 親 region の cross-component 配線（5 連結）が断絶しないことを明記 |
| MINOR | MINOR 4 件を Phase 12 未タスク化候補として記録し、各々に formalize/未タスク化の判断軸を付与。本体は 1 サイクル完了スコープである旨を明記 |
| スコープ注記 | 本サイクルは spec 作成のみ・AC 実測は実装後 user-gated である旨が冒頭に明記されている |
