# Admin Identity Conflicts Clarity & Meetings Rename FU-004 — `/admin/meetings` ページ本体 UX（命名整合） - タスク指示書

## メタ情報

```yaml
issue_number: 1227
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-clarity-and-meetings-rename-followup-004-admin-meetings-page-body-ux |
| タスク名 | `/admin/meetings`（開催・出席管理）ページ本体の文言整合と非エンジニア向け平易化（M-2） |
| 分類 | 改善 |
| 補足分類 | UX 改善 / 命名整合（post-MVP） |
| 対象機能 | `/admin/meetings`（開催・出席管理）ページ本体UX |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| GitHub Issue | #1227 |
| 発見元 | `admin-identity-conflicts-clarity-and-meetings-rename` Phase 3 design-review M-2 / Phase 12 unassigned-task-detection baseline / shared-context §9 |
| 発見日 | 2026-06-12 |
| canonical source | `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `admin-identity-conflicts-clarity-and-meetings-rename` は、**サイドバーの命名のみ**を `開催日` → `開催・出席管理` に変更した（`apps/web/src/components/shell/shell-config.ts:86`）。設計（Phase 3 / shared-context §9）では「本タスクはサイドバー命名のみ。`/admin/meetings`（開催・出席管理）の**ページ本体（カード/フォーム/出席管理UX）そのものは本タスク範囲外**」と明示分離され、M-2 として baseline 検出された。

このフォローアップは、その分離された「ページ本体の UX」のうち、**サイドバー命名変更と本来整合すべき残課題に限定**して扱う。

### 1.2 問題点・課題

サイドバーは `開催・出席管理` に統一されたが、ページ本体側はまだ旧来の表記が残っており、命名が画面間で不整合になっている。

- ページタイトル / パンくずが `開催日 / 出席管理` のまま（`apps/web/app/(admin)/admin/meetings/page.tsx:21,29`）。サイドバーの `開催・出席管理` と表記がずれている。
- 画面内の見出し・ラベル・トーストにも `開催日` / `開催` / `開催追加` / `開催削除` / `開催更新` 等の表記が混在する（`MeetingCreateForm.tsx`・`MeetingsClientShell.tsx`・`MeetingAttendanceDrawer.tsx`）。
- これらは非エンジニア運用者にとって「サイドバー名と画面名が違う」「同じ操作の呼び方が画面内で揺れている」という小さな迷いを生む。

### 1.3 放置した場合の影響

- 機能上の問題はないが、サイドバー名（`開催・出席管理`）と画面タイトル（`開催日 / 出席管理`）が一致せず、ナビゲーションの一貫性が損なわれる。
- カードUXそのものは別タスクで改善済み（後述 1.4）のため、ここで命名整合を取りこぼすと「命名だけ中途半端に揃っていない」状態が固定化する。

### 1.4 重複回避の前提（重要）

`/admin/meetings` の**カード/ドロワー/出席管理のレイアウト・視覚情報設計**は、既存の完了タスク `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/` で**改善済み**。その横展開（`.admin-detail-section*` / `.admin-attendee-row*` primitive を他 admin 詳細画面へ段階適用）は **Issue #1211（OPEN）** で追跡されている。

したがって本タスクは、**カードUXの再設計でも primitive 横展開でもなく**、サイドバー命名変更に伴って取りこぼした **画面内文言（タイトル/パンくず/見出し/ラベル/トースト）の整合と非エンジニア向け平易化** という、`admin-meetings-card-ux-clarity` と #1211 のいずれも未着手の残領域に限定する。実コード確認の結果、レイアウト面の残課題は当該完了タスクと #1211 で実質的に尽きており、本タスクの妥当な残スコープは「命名整合と文言平易化」に絞られる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`/admin/meetings` のページ本体の文言を、サイドバー命名 `開催・出席管理` と整合させ、画面内で揺れている表記を統一して非エンジニア運用者に分かりやすくする。

### 2.2 最終ゴール

- ページタイトル / パンくずが、サイドバー命名 `開催・出席管理` と整合した表記になる。
- 画面内の見出し・フォームラベル・トーストの表記揺れ（`開催日` / `開催` / `開催追加` 等）が、一貫した呼称に統一される。
- 機能・API・testid / aria / role の機械可読契約は不変で、既存 vitest spec が green を保つ。

### 2.3 受け入れ基準

- [ ] `apps/web/app/(admin)/admin/meetings/page.tsx` のタイトル / パンくずがサイドバー命名 `開催・出席管理` と整合する表記に更新されている。
- [ ] 画面内の見出し・フォームラベル・トーストの呼称が一貫した日本語に統一されている（同一操作で表記が揺れない）。
- [ ] `data-testid` / `aria-label` / `role` / `name` 等の機械可読契約が不変で、既存 `_meetings` 配下の vitest spec が PASS する。
- [ ] API / D1 / Google Form の変更がない（`git diff dev -- apps/api` が空）。
- [ ] HEX 直書き / `bg-[#...]` 等の追加がなく `verify-design-tokens` が PASS する（文言変更主体のため原則無関係だが確認する）。

### 2.4 スコープ要約

| 区分 | 内容 |
| --- | --- |
| 含む | `/admin/meetings` ページ本体の文言（タイトル/パンくず/見出し/ラベル/トースト）整合・平易化 |
| 含まない | カード/ドロワーのレイアウト再設計（完了タスクで対応済）・primitive 横展開（#1211）・API/schema 変更 |

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/app/(admin)/admin/meetings/page.tsx` | ページタイトル / パンくず（`開催日 / 出席管理` → サイドバー整合表記） |
| `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 一覧見出し / KPI ラベル / トースト文言 |
| `apps/web/src/features/admin/components/_meetings/MeetingCreateForm.tsx` | 追加フォーム見出し / ラベル / トースト（`開催日を追加` 等） |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | ドロワー見出し / ラベル（出席編集 / 出席追加 等） |
| `apps/web/src/features/admin/components/_meetings/__tests__/` | 文言を参照する既存 spec（assertion 文字列の追従要否確認） |

### 3.2 実装方針

- まず「サイドバー命名 `開催・出席管理` に画面タイトル/パンくずを揃える」ことを最小単位として確定する。
- 画面内の `開催日` / `開催` 表記は、操作の意味（開催回そのものを指すか、追加/削除/更新といった操作を指すか）を保ったまま、揺れだけを統一する。意味を変える大幅リライトはしない。
- 文言変更に伴い、`data-testid` / `aria-label` / `role` / `FormField` の `name` は機械可読契約として不変に保つ。表示テキストのみ変更する。
- 文言を直接参照している既存 spec があれば、assertion 文字列のみ最小追従する（DOM 構造・契約は変えない）。
- 色 / レイアウト / primitive には手を入れない（それらは完了タスク / #1211 の領域）。

---

## 苦戦箇所【記入必須】

- M-2 は設計で「サイドバー命名のみが本タスク・ページ本体は別」と明示分離されたが、`/admin/meetings` のページ本体は既に別の完了タスク（`admin-meetings-card-ux-clarity`）でカードUXが改善済みであり、さらにその横展開は Issue #1211（OPEN）で追跡されている。**Issue 化・着手時の最大の難所は「重複範囲の切り分け」**で、残課題が #1211 や完了タスクと被ると無駄な再着手になる。
- 起票/着手前に必ず `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/` と #1211 の差分を取り、本当に未対応の残領域（= サイドバー命名変更に伴う画面内見出し/タイトル/トーストの整合）だけに絞る必要がある。実コード上、レイアウト/primitive の残課題はこの2者で尽きているため、本タスクは「命名整合と文言平易化」の小〜中スコープに限定するのが正しい判断である。
- 具体的な不整合点: サイドバーは `開催・出席管理`（`shell-config.ts:86`）だが、ページタイトル/パンくずは `開催日 / 出席管理`（`page.tsx:21,29`）のまま。この食い違いを基点に、画面内の `開催日`/`開催` 表記揺れまで整合範囲を見極める。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| カードUX再設計や primitive 横展開に踏み込み #1211 / 完了タスクと重複する | 中 | 本タスクは文言整合のみと宣言し、レイアウト/CSS/primitive 変更を「含まない」に固定する |
| 文言変更で `data-testid` / `aria-label` / `name` を巻き込み既存 spec が壊れる | 中 | 表示テキストのみ変更し機械可読契約は不変、変更後に `_meetings` 配下の vitest を実行して green を確認 |
| 表記統一の過程で操作の意味（開催回 vs 操作名）を取り違える | 低 | 「開催回そのもの」と「追加/削除/更新の操作」を区別し、意味を変えず揺れのみ統一する |
| 文言変更にトークン無関係の CSS / HEX を巻き込む | 低 | 文言のみ変更し、色/レイアウトは触らず `verify-design-tokens` で確認する |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings
```

期待: 文言整合後も `_meetings` 配下の既存 spec が PASS（機械可読契約不変）。

### 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
git diff dev -- apps/api   # 空期待
```

期待: typecheck / lint / token gate PASS、API 差分なし。

### 命名整合確認

```bash
cd apps/web && grep -rn "開催日 / 出席管理\|開催・出席管理" app/(admin)/admin/meetings/page.tsx src/components/shell/shell-config.ts
```

期待: ページタイトル/パンくずとサイドバー命名の表記が整合している。

---

## スコープ

### 含む

- `/admin/meetings` ページ本体の文言整合：タイトル / パンくずをサイドバー命名 `開催・出席管理` に揃える。
- 画面内の見出し / フォームラベル / トーストの表記揺れ（`開催日` / `開催` / `開催追加` 等）の統一と非エンジニア向け平易化。
- 文言を参照する既存 spec の assertion 文字列の最小追従。

### 含まない

- カード / ドロワーのレイアウト・視覚情報設計の再設計（完了タスク `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/` で対応済み）。
- admin 共通 primitive（`.admin-detail-section*` / `.admin-attendee-row*`）の他 admin 詳細画面への段階展開（**Issue #1211** で追跡中）。
- API / D1 schema / shared schema / Google Form 仕様の変更。
- 出席管理の mutation contract / `data-testid` / `aria-label` / `role` / `name` の変更。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/`
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md`（M-2）
- 関連完了タスク（重複確認必須）: `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/`
- 関連 OPEN Issue: #1211（admin 共通 primitive の他 admin 詳細画面への段階展開）
- 対象ページ: `apps/web/app/(admin)/admin/meetings/page.tsx`
- 対象コンポーネント群: `apps/web/src/features/admin/components/_meetings/`
- サイドバー命名正本: `apps/web/src/components/shell/shell-config.ts`（`開催・出席管理`）
