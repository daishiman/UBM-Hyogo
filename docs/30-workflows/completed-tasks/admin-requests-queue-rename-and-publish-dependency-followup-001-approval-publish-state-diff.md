# admin 申請承認時の before→after 公開状態 diff 表示 - タスク指示書

## メタ情報

```yaml
issue_number: 1188
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-requests-queue-rename-and-publish-dependency-followup-001-approval-publish-state-diff |
| タスク名 | admin 申請キューの承認操作で変更前後の公開状態差分を強調表示する |
| 分類 | 改善 |
| 補足分類 | UX 改善 (post-MVP) |
| 対象機能 | `/admin/requests` 会員申請キューの承認確認 UI（公開状態の遷移表示） |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | consumed_by `docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/`（implemented_local_runtime_pending） |
| GitHub Issue | [#1188](https://github.com/daishiman/UBM-Hyogo/issues/1188) |
| 発見元 | `admin-requests-queue-rename-and-publish-dependency` Phase 12 unassigned-task-detection.md B-2 |
| 発見日 | 2026-06-09 |
| canonical source | `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-requests-queue-rename-and-publish-dependency` workflow は、`/admin/requests`（会員からの申請キュー）について「申請の存在の可視化（申請中バッジ）」と「会員管理との 2 軸が独立している旨の役割明確化（バッジ + 相互リンク + 説明文）」をスコープとして AC-13 まで充足した。

その Phase 12 unassigned-task-detection.md で B-2 として、承認操作時に「公開 → 非公開」のような変更前後の公開状態の差分を画面で強調表示すると管理者が承認結果を直感的に把握できる、という UX 改善が baseline 候補として分離記録された。これは親ワークフローの Q4 で非選択となり、承認 UI への diff 表示は追加 UI 設計を要する別軸としてスコープ外送りされた。

現状の承認導線は次の通り：

- `apps/web/src/components/admin/RequestQueueDetail.tsx`（55-58 行）が会員サマリとして `公開状態: {item.memberSummary.publishState}` を**現在値のみ**列挙し、`申請内容`（70-73 行）として `desiredState: ...` を**別の dd**にテキスト表示する。
- `apps/web/src/components/admin/RequestConfirmDialog.tsx`（92-94 行）の承認確認ダイアログは destructive メッセージ（退会時）または「公開状態を申請内容に応じて変更します。」という汎用文言（`RequestQueuePanel.tsx` 143-148 行）を出すのみで、**何から何へ変わるか**を具体的に提示しない。

つまり現在値と申請内容は同一画面に存在するが、**before→after を 1 つの遷移として視覚的に結びつける表現が無い**。

### 1.2 問題点・課題

- 承認確認ダイアログは「公開状態を申請内容に応じて変更します」とだけ告げ、`public → hidden` のような具体的な遷移を提示しないため、管理者は承認ボタンを押す前に詳細パネルの `公開状態` と `申請内容` を目で照合する必要がある。
- `RequestQueueDetail` 上でも現在値（`memberSummary.publishState`）と目標値（`requestedPayload.desiredState`）が別々の dd に分かれており、差分として強調されていない。
- 結果として「承認すると何が起きるか」が一目で分からず、誤承認・確認コストの増加につながりやすい。

### 1.3 放置した場合の影響

- 機能上の問題は無い。承認時の publish_state 遷移ロジックは `apps/api` 側（`requests.ts` 373-401 行 `inferDesiredPublishState` → `resolveRequestAtomic`）で正しく確定しており、データ正確性・操作可否に影響しない。
- 影響は承認時の視認性・確認体験のみに限定されるため優先度は**低**。MVP 完了後の磨き込みとして扱う。
- 放置しても回帰やデータ不整合は発生しない。親タスクの依存可視化（バッジ + 相互リンク + 説明文）で「2 軸が独立」という整合は既に達成済みであり、diff 表示が無くても AC-13 は満たされている。

---

## 2. 何を達成するか（What）

### 2.1 目的

承認操作時に、対象会員の公開状態（または退会時のレコード状態）が「変更前 → 変更後」へどう遷移するかを 1 つの diff として画面で強調表示し、管理者が承認結果を直感的に把握できるようにする。

### 2.2 最終ゴール

- `RequestQueueDetail` と承認確認ダイアログのいずれか（または両方）で、`変更前 → 変更後` の遷移が視覚的に結びついた diff として表示される。
- diff の強調色はすべて OKLch トークン（`apps/web/src/styles/tokens.css`）経由で定義され、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が一切ない。
- 既存 primitive（`card` / `ui-badge` 等）を再利用し、新規 primitive を増やさない。
- 既存 API のみで完結し、新 endpoint 追加・D1 schema 変更・projection 拡張を行わない。
- 既存テストおよび新規 diff 表示テストが green。

### 2.3 受け入れ基準

- [ ] `visibility_request` の承認時、対象会員の現在の公開状態（`memberSummary.publishState`）と申請された目標状態（`requestedPayload.desiredState`）が `変更前 → 変更後` の遷移として 1 箇所に強調表示される。
- [ ] `delete_request` の承認時は公開状態の遷移ではなく「退会（論理削除）」というレコード状態の遷移として表現され、`visibility_request` の公開状態 diff と意味が混同されない。
- [ ] diff の強調色はすべて `tokens.css` の OKLch トークン経由であり、`docs/00-getting-started-manual/specs/design-tokens.md` に整合する（新規トークンを追加する場合は両正本に反映）。
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がなく、CI gate `verify-design-tokens` が PASS。
- [ ] 新規 primitive を増やさず、既存 primitive の variant（modifier class / data 属性）で構成する。
- [ ] 新 endpoint 追加・D1 schema 変更・既存 GET `/admin/requests` の projection 拡張を行わず、表示層のみで完結する。
- [ ] 既存 `RequestQueueDetail.spec.tsx` / `RequestConfirmDialog.spec.tsx` / `RequestQueuePanel.component.spec.tsx` が green を維持し、diff 表示の新規 assertion が PASS。
- [ ] 表示テキスト・ルート `/admin/requests`・API パス・既存 data-* / テストセレクタの不変方針を踏襲する（新規 data 属性を足す場合は既存命名規則に沿う）。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | 現在値（55-58 行 `memberSummary.publishState`）と目標値（70-73 行 `summarizePayload` の `desiredState`）を `変更前 → 変更後` diff として再構成。`delete_request` は退会遷移として分岐 |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 承認確認ダイアログ（92-94 行）に diff サマリを表示（強調を承認直前にも提示する場合） |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | `destructiveMessage`（143-148 行）の生成元。diff 表示に必要な現在値・目標値を子へ渡す配線（既存 props の範囲で完結） |
| `apps/web/src/styles/tokens.css` | diff 強調用 OKLch トークン（before=中立トーン / after=accent トーン等）。既存トークンで足りる場合は追加せず流用 |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | `visibility_request` / `delete_request` 別の diff 表示 assertion 追加 |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | ダイアログ diff サマリの assertion 追加（ダイアログに表示する場合） |
| `docs/00-getting-started-manual/specs/design-tokens.md` | トークンを新規追加する場合の正本反映 |

### 3.2 実装方針

- diff の入力はすべて**既存レスポンスに含まれる**値で賄う。`memberSummary.publishState`（変更前）と `requestedPayload.desiredState`（変更後）は GET `/admin/requests` の projection（`apps/api/src/routes/admin/requests.ts` 162-182 行 `projectListItem`）で既に返っており、`RequestQueueItem`（`RequestQueuePanel.tsx` 20-34 行）に揃っている。よって API 変更は不要。
- `visibility_request`: `publishState`（例 `public`）→ `desiredState`（例 `hidden`）を `変更前 → 変更後` の遷移として 1 行に再構成し、矢印 + トーン差で強調する。日本語ラベル（`公開` / `会員限定` / `非公開`）への変換は既存の表示テキスト方針に沿って表示層で行う。
- `delete_request`: `desiredState` は持たない（catalog 76-98 行で `payload: {}`）。公開状態 diff ではなく「在籍 → 退会（論理削除）」というレコード状態の遷移として別表現にし、destructive メッセージ（`RequestQueuePanel.tsx` 146 行）と整合させる。
- 強調は既存 primitive の modifier class / data 属性（例 `data-diff-side="before|after"`）に閉じ込め、`ui-badge` / `card` 本体の既定スタイルは変更しない。
- 強調色は既存の `--ubm-color-text-secondary`（中立）/ `--ubm-color-accent*`（after 強調）等で賄えるか先に確認し、賄えない場合のみ新規トークンを `tokens.css` に追加して `design-tokens.md` に反映する。
- publish_state の確定遷移ロジック（`apps/api` 側 `inferDesiredPublishState` / `resolveRequestAtomic`）には一切手を入れず、表示層のみで完結させる。

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260609-141355-wt-11/apps/web/src/components/admin/RequestQueueDetail.tsx`
- 症状: `visibility_request`（`desiredState` = `hidden` / `public` / `member_only`）と `delete_request`（catalog 92-97 行で `payload: {}`・`desiredState` 無し）で「before→after」の意味が根本的に異なる。前者は**公開状態**の遷移、後者は**レコード状態**（在籍 → 論理削除）の遷移である。NOTE_TYPE_LABEL（7-10 行）は両者を区別済みだが、diff 表現を 1 つの汎用コンポーネントに無理に統一すると `delete_request` で「公開状態が変わる」という誤解を生む。両 note_type で diff の意味軸を分岐させる設計判断が必要。

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260609-141355-wt-11/apps/web/src/components/admin/RequestQueuePanel.tsx`
- 症状: 承認前の「現在の公開状態」を UI が知る必要がある点が最大の難所だが、調査の結論として `RequestQueueItem.memberSummary.publishState` / `isDeleted`（20-34 行）に**既に含まれている**。これは GET `/admin/requests` の `AdminRequestListItemZ.memberSummary`（`apps/api/src/routes/admin/requests.ts` 55-60 行、`.strict()`）が `member_status` を bulk SELECT（同 272-292 行）して返しているためで、API 変更なしで before 値を取得できる。逆に **projection を拡張すると `.strict()` schema・「既存 API のみ利用」制約と即衝突する**ため、diff に使ってよいのは `publishState` / `isDeleted` / `requestedPayload.desiredState` の 3 値に限定し、これ以上のフィールドを欲しがらないことを設計の前提に固定する必要がある。

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260609-141355-wt-11/apps/web/src/styles/tokens.css`
- 症状: diff の before / after を色トーンで区別する場合、強調色を新規 OKLch トークンとして足すと `tokens.css` だけでは不十分で、`docs/00-getting-started-manual/specs/design-tokens.md`（トークン正本仕様）と CI gate `verify-design-tokens` の**両方**を整合させる必要がある。片方だけ更新すると gate が fail する。before=中立（`--ubm-color-text-secondary` 等）/ after=accent（`--ubm-color-accent*` 等）の既存トークンで賄えるなら新規追加自体を回避できるため、流用可否の見極めが先決。

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260609-141355-wt-11/apps/web/src/components/admin/RequestConfirmDialog.tsx`
- 症状: 承認確認ダイアログ（76-124 行）は `kind` / `isDestructive` / `destructiveMessage` の最小 props しか受け取らず、現在値・目標値そのものは渡っていない。ダイアログ内にも diff を出す場合、props を増やすか `destructiveMessage`（`RequestQueuePanel.tsx` 143-148 行）の生成箇所で diff 文言を組み立てる必要がある。props を増やす際は `RequestConfirmDialogProps`（9-17 行）の readonly 契約と既存テスト（`RequestConfirmDialog.spec.tsx`）への影響を見極める。詳細パネル（`RequestQueueDetail`）のみに diff を出してダイアログは現状維持とする選択肢もあり、表示箇所の範囲確定が必要。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| diff の before 値（現在の公開状態）を得るために GET `/admin/requests` の projection を拡張してしまう | 高 | 既に `memberSummary.publishState` / `isDeleted` が返っている事実を前提に、追加フィールドを欲しがらない。projection・`.strict()` schema・「既存 API のみ利用」制約に触れない |
| `delete_request` を公開状態 diff として表現し「公開状態が変わる」という誤解を生む | 中 | note_type で意味軸を分岐し、退会は「在籍 → 退会（論理削除）」のレコード状態遷移として別表現にする。destructive メッセージと整合させる |
| HEX 直書き / `bg-[#xxx]` 混入で `verify-design-tokens` gate に抵触する | 中 | 強調色は `tokens.css` の OKLch トークン経由のみとし、実装後に HEX grep と `verify-design-tokens` をローカル実行して PASS を確認する |
| 強調色トークンを新規追加し片方の正本のみ更新する | 中 | 新規追加時は `tokens.css` + `design-tokens.md` を同時更新。既存 `--ubm-color-accent*` / `--ubm-color-text-secondary` で賄えるなら新規追加を回避 |
| `ui-badge` / `card` 本体変更による他画面への波及 | 低 | diff 強調は modifier class / data 属性に閉じ込め、共有 primitive 本体の既定スタイルは変更しない |
| 表示箇所（詳細パネル / 確認ダイアログ）が曖昧でスコープが広がる | 低 | まず詳細パネルの diff 化を最小スコープとし、ダイアログ表示は props 影響を見極めて任意拡張とする |

---

## 検証方法

### 単体検証

apps/web に `vitest.config.ts` が無いためリポジトリルートから実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
```

期待: 既存の承認/却下・公開状態表示の assertion が green を維持し、`visibility_request` / `delete_request` 別の `変更前 → 変更後` diff 表示の新規 assertion が PASS。新規テストは `*.spec.tsx`（`*.test.tsx` は禁止）。

### 統合検証（VISUAL）

- staging での承認 diff 表示の screenshot 取得は user-gated。ユーザー承認後に staging で `visibility_request`（`public → hidden` / `→ public`）と `delete_request`（在籍 → 退会）の見た目差分を確認する。
- テストアカウント catalog（`apps/api/src/testing/test-accounts/catalog.ts` 76-98 行）に `TEST-NOTE-V01`（desiredState=hidden）/ `TEST-NOTE-V02`（desiredState=public）/ `TEST-NOTE-D01`（delete_request）が揃っており、3 ケースを再現できる。

### 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/components/admin/RequestQueueDetail.tsx apps/web/src/components/admin/RequestConfirmDialog.tsx
```

加えて CI gate `verify-design-tokens` を実行し、トークン正本（`design-tokens.md`）と `tokens.css` の整合 / HEX 直書き不在を確認する。`apps/api` に差分が出ていないこと（`git diff --stat apps/api` が空）も確認する。

期待: typecheck / lint が 0 error、HEX・`bg-[#xxx]`・`text-[#xxx]` の grep ヒットが 0 件、`verify-design-tokens` が PASS、`apps/api` 差分 0。

---

## スコープ

### 含む

- `/admin/requests` 承認操作時の `変更前 → 変更後` 公開状態 diff の強調表示（詳細パネル / 任意で確認ダイアログ）。
- `visibility_request`（公開状態遷移）と `delete_request`（退会＝レコード状態遷移）の意味軸分岐。
- diff 強調に必要な OKLch トークンの定義（新規追加時は `tokens.css` + `design-tokens.md` の両正本反映）。
- 上記 component の `*.spec.tsx` への diff 表示 assertion 追加。

### 含まない

- 承認時の publish_state 遷移ロジック（`apps/api/src/routes/admin/requests.ts` の `inferDesiredPublishState` / `resolveRequestAtomic`）の変更。
- 新 endpoint 追加・D1 schema 変更・GET `/admin/requests` projection 拡張（`memberSummary` 以外のフィールド追加）。
- `apps/web` からの D1 直接アクセス（不変条件 #5 を継続）。
- `/admin/requests` 以外の画面・他 diff 表現への波及。
- API / Google Form 仕様の変更。
- 表示テキスト・ルート・API パス・既存テストセレクタの破壊的変更。
- production / staging deploy、commit、push、PR、Issue 起票・close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/`
- canonical source（B-2 baseline 記録）: `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/outputs/phase-12/unassigned-task-detection.md`
- 親 workflow 共有コンテキスト（AC・命名マップ・データ契約）: `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/_shared-context.md`
- 対象 component: `apps/web/src/components/admin/RequestQueueDetail.tsx` / `apps/web/src/components/admin/RequestConfirmDialog.tsx` / `apps/web/src/components/admin/RequestQueuePanel.tsx`
- 既存テスト: `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` / `RequestConfirmDialog.spec.tsx` / `RequestQueuePanel.component.spec.tsx`
- データ契約（projection / desiredState 遷移）: `apps/api/src/routes/admin/requests.ts`
- テストアカウント catalog（申請 fixture）: `apps/api/src/testing/test-accounts/catalog.ts`
- トークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
