# sidebar collapse 状態の cookie 永続化（lint-boundaries storage 禁止回避） - タスク指示書

## メタ情報

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | unified-sidebar-shell-public-and-admin-followup-001-sidebar-collapse-cookie-persistence           |
| タスク名     | SidebarShell の collapse（展開/折り畳み）状態を cookie ベースで永続化する                          |
| 分類         | 改善 / UX 永続化                                                                                   |
| 対象機能     | `apps/web/src/components/shell/` SidebarShell の collapse 状態（現状 in-memory・リロードでリセット） |
| 優先度       | 低                                                                                                |
| 見積もり規模 | 小規模                                                                                            |
| ステータス   | pending (Issue 起票済み・実装未着手)                                                               |
| 発見元       | admin-layout-sidebar-shell-migration Phase 12 (FU-ALSSM-001)                                       |
| 発見日       | 2026-05-29                                                                                         |
| GitHub Issue | [#1024](https://github.com/daishiman/UBM-Hyogo/issues/1024)                                       |

## Canonical Workflow Status

- 親 workflow（所有者）: `docs/30-workflows/unified-sidebar-shell-public-and-admin/`（shell primitive の所有 workflow）
- 検知元 workflow: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/`（Task A/B/D/E 一括実装で検出）
- 検知元 outputs: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md`（FU-ALSSM-001）
- 実装記録: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/implementation-summary.md`（補正 #1）
- 関連実装:
  - `apps/web/src/components/shell/useSidebarState.ts` — collapse 状態 hook（現状 in-memory のみ）
  - `apps/web/src/components/shell/SidebarShell.server.tsx` — server 側 shell（初期 `collapsed` seed 受け口）
- 制約根拠:
  - `scripts/lint-boundaries.mjs` — `localStorage` / `sessionStorage` トークンを **forbidden** とする境界 lint（`apps/web/src` 使用例ゼロ）
- 分離理由（CONST_008 条件1）: 検知元タスクのスコープ（admin layout 移行 + 旧 sidebar 削除 + DOM contract 検証）とは独立した別関心事。cookie ベースの新方式（SSR/CSR 両対応・読み取り箇所の追加）が必要なため、検知元 wave に混入させると DOM contract 検証の焦点がぼやける。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-layout-sidebar-shell-migration`（Task A/B/D/E 一括実装）で `SidebarShell` 系 primitive を新設した際、当初仕様では sidebar の collapse（展開 / 折り畳み）状態を Web Storage（`localStorage` / `sessionStorage`）に永続化する想定だった。

しかし `scripts/lint-boundaries.mjs` が `localStorage` / `sessionStorage` トークンを **forbidden**（`apps/web/src` での使用例ゼロ）としているため、`apps/web/src/components/shell/useSidebarState.ts` では永続化を撤廃し **in-memory（session 単位・リロードでリセット）** に限定して実装を完了させた。

### 1.2 問題点・課題

- collapse 状態がページリロード / 再訪問でリセットされ、ユーザーが毎回折り畳み直す必要がある（UX 低下）
- プロトタイプ / 一般的な admin shell の挙動（collapse 状態の記憶）と実装に乖離が残る
- storage 禁止制約があるため、永続化には storage を使わない代替経路（cookie / server 側 seed）の設計が別途必要

### 1.3 放置した場合の影響

- in-memory 限定のまま MVP 公開され、admin 利用者がリロードのたびに sidebar 状態をリセットされる UX が継続
- 後続で public / member shell（親 workflow Task C）にも同じ collapse 永続化が求められた場合、各 shell で個別実装が発生し SSOT が分散する
- storage 禁止制約を知らない後続実装者が `localStorage` で安易に永続化を試み、lint-boundaries で再度ブロックされる（同じ落とし穴の再発）

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/lint-boundaries.mjs` の storage 禁止制約を遵守したまま、SidebarShell の collapse 状態を **cookie ベース**で永続化し、リロード / 再訪問でも展開 / 折り畳み状態が保持されるようにする。

### 2.2 最終ゴール

- collapse トグル時に cookie へ状態を書き込む（CSR）
- `SidebarShell.server.tsx`（server）が cookie を読み取り、初期 `collapsed` seed として渡す（SSR）
- 初期描画でのちらつき（hydration mismatch / 展開→折り畳みのフラッシュ）が発生しない
- `localStorage` / `sessionStorage` を一切使用せず `scripts/lint-boundaries.mjs` を pass する
- `useSidebarState.ts` の既存 in-memory 挙動を回帰させず、cookie seed を初期値として受け取る形に拡張

### 2.3 スコープ

#### 含むもの

- cookie 読み書きユーティリティの追加（既存 cookie アクセサがあれば再利用、なければ shell スコープに最小追加）
- `apps/web/src/components/shell/useSidebarState.ts` の初期値を cookie seed から受け取れるよう拡張
- `apps/web/src/components/shell/SidebarShell.server.tsx` の server 側 cookie 読み取り → 初期 `collapsed` seed 配線
- collapse トグル時の cookie 書き込み（CSR・SameSite / path / expires の妥当な既定値設定）
- 上記の focused Vitest（cookie seed → 初期 collapsed 反映 / トグル → cookie 書き込み / cookie 不在時 default）

#### 含まないもの

- `localStorage` / `sessionStorage` を用いた永続化（`scripts/lint-boundaries.mjs` 違反のため恒久禁止）
- public / member shell（親 workflow Task C）への collapse 永続化横展開（Task C 完了後の別判断）
- 新規 API endpoint / D1 schema / Google Form 仕様の変更（親不変条件 #1）
- collapse 状態の server 側 DB / KV 永続化（cookie で十分・過剰設計回避）

### 2.4 成果物

- cookie 読み書きユーティリティ差分
- `useSidebarState.ts` の cookie seed 受け取り差分
- `SidebarShell.server.tsx` の server 側 cookie 読み取り差分
- focused Vitest spec
- 親 workflow `unified-sidebar-shell-public-and-admin` Phase 12 / 検知元 `admin-layout-sidebar-shell-migration` の FU-ALSSM-001 を consumed に更新

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 storage 禁止制約に実装途中で衝突した

`useSidebarState.ts` 実装時、当初の自然な選択肢である `localStorage.setItem('sidebar-collapsed', ...)` を書いた段階で `scripts/lint-boundaries.mjs` が `localStorage` / `sessionStorage` トークンを forbidden とすることが判明した（`apps/web/src` 配下で使用例ゼロ）。永続化方式そのものを再設計する必要があり、検知元タスク（layout 移行 + 旧 sidebar 削除）のクリティカルパス上で永続化まで完遂させると関心が分裂するため、**in-memory に限定して検知元タスクを green で完了させ、永続化は本 follow-up に分離する**判断を採った（CONST_008 条件1）。

### 3.2 storage を使わない永続化経路の選定

storage 禁止下で collapse 状態を永続化する経路として以下を比較した:

- **cookie（採用方針）**: SSR で server が直接読めるため初期描画でのちらつきを防げる。`SidebarShell.server.tsx` が既に server component であり、cookie 読み取り → 初期 seed の配線が自然。容量も真偽値 1 つで十分小さい。
- server DB / KV 永続化（不採用）: 真偽値 1 つの UI 状態に DB / KV を使うのは過剰。API 追加変更も親不変条件 #1 に抵触する。
- in-memory 継続（現状）: 実装は最小だが UX 課題が残るため follow-up 化の対象。

cookie 方式は SSR/CSR 両対応かつ既存 server component 構造に乗せやすい点で最有力。実装時は SameSite / path / expires の既定値、および hydration mismatch（server seed と client 初期値の不一致）の回避が要注意点となる。

### 3.3 ちらつき（hydration mismatch）回避

cookie seed を server 側で読んで初期 `collapsed` を確定させないと、CSR 初期値（既定: 展開）と cookie 値（折り畳み）が食い違い、初回描画で「展開→折り畳み」のフラッシュや hydration mismatch warning が発生する。`SidebarShell.server.tsx` で cookie を読み取り、`useSidebarState.ts` がその seed を初期値として受け取る形にすることで、server レンダリング時点から正しい collapse 状態を確定させる設計が必須。

### 3.4 後続実装者向けの落とし穴メモ

- collapse 永続化で `localStorage` / `sessionStorage` を使うと `scripts/lint-boundaries.mjs` で必ずブロックされる。cookie 一択であることを前提に着手すること。
- public / member shell（親 Task C）に横展開する場合、cookie key の名前空間（admin / public / member で共有するか分けるか）を先に決めること。

---

## 4. 受入条件 (AC)

- **AC-1**: SidebarShell の collapse 状態をトグルすると cookie に書き込まれる（CSR）
- **AC-2**: ページリロード / 再訪問後も直前の collapse 状態が復元される（cookie seed → 初期 `collapsed` 反映）
- **AC-3**: `SidebarShell.server.tsx`（server）が cookie を読み取り、初期描画時点から正しい collapse 状態でレンダリングされる（hydration mismatch warning なし・初回フラッシュなし）
- **AC-4**: `localStorage` / `sessionStorage` を一切使用せず、`scripts/lint-boundaries.mjs`（`pnpm lint` 経由）を pass する
- **AC-5**: cookie 不在（初回訪問）時は既定の collapse 状態（既存 in-memory default）で描画される
- **AC-6**: focused Vitest が green（cookie seed → 初期 collapsed 反映 / トグル → cookie 書き込み / cookie 不在 → default の 3 観点）
- **AC-7**: `pnpm typecheck` / `pnpm lint` / web Vitest 既存スイートが回帰なし（既存 in-memory 挙動を壊さない）
- **AC-8**: API / D1 / Google Form 仕様変更なし。OKLch トークン正本（HEX 直書きなし）。`apps/web` から D1 直接アクセスなし（親不変条件 #1 / #5 / OKLch 不変条件）
- **AC-9**: 親 workflow `unified-sidebar-shell-public-and-admin` および検知元 `admin-layout-sidebar-shell-migration` Phase 12 `unassigned-task-detection.md` の FU-ALSSM-001 を consumed に更新済み

---

## 5. 参照資料

- [GitHub Issue #1024](https://github.com/daishiman/UBM-Hyogo/issues/1024) — 本 follow-up の起票 Issue（priority:low / type:followup / area:web,admin-ui / wave:2-plus / scale:small）
- `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md` — FU-ALSSM-001 検知元
- `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/implementation-summary.md` — 補正 #1（in-memory 限定の判断記録）
- `docs/30-workflows/unified-sidebar-shell-public-and-admin/` — 親 workflow（shell primitive 所有者）
- `apps/web/src/components/shell/useSidebarState.ts` — collapse 状態 hook（現状 in-memory）
- `apps/web/src/components/shell/SidebarShell.server.tsx` — server 側 shell（cookie seed 受け口）
- `scripts/lint-boundaries.mjs` — storage 禁止制約の正本
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション — 不変条件1（既存 API のみ）/ 不変条件2（OKLch トークン正本化）
