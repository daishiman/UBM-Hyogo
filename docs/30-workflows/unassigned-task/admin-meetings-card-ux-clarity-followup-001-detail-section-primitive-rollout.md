# admin 共通 primitive（.admin-detail-section* / .admin-attendee-row*）の他 admin 詳細画面への展開 - タスク指示書

## メタ情報

```yaml
issue_number: 1211
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-meetings-card-ux-clarity-followup-001-detail-section-primitive-rollout |
| タスク名 | `admin-meetings-card-ux-clarity` で新設した詳細ドロワー共通 primitive を他 admin 一覧画面へ段階適用する |
| 分類 | 改善 |
| 補足分類 | リファクタリング / UX 整合 (post-MVP) |
| 対象機能 | `/admin/members`・`/admin/tags`・`/admin/audit`・`/admin/schema`・`/admin/requests`・`/admin/identity-conflicts` の詳細ドロワー / 展開セクション |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| GitHub Issue | [#1211](https://github.com/daishiman/UBM-Hyogo/issues/1211) |
| 発見元 | `admin-meetings-card-ux-clarity` Phase 12 unassigned-task-detection OOS-1 |
| 発見日 | 2026-06-10 |
| canonical source | `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-meetings-card-ux-clarity` workflow で、`/admin/meetings` 開催日カードの展開ドロワーを「見出し付きサブカード」へ整理する過程で、再利用可能な汎用 primitive を `apps/web/src/styles/globals.css` に新設した。

- `.admin-detail-section` / `.admin-detail-section__title` / `.admin-detail-section__body`（見出し付きサブカード）
- `.admin-attendee-list` / `.admin-attendee-row` / `.admin-attendee-row__name`（行リスト chrome）

これらはすべて `var(--ubm-*)` トークン経由で定義済み（globals.css 1716-1766）で、`/admin/meetings` でのみ使用されている。設計時点から「他 admin 詳細ドロワーが将来採用可」（implementation-guide §4.2）と明記されており、当該 workflow の unassigned-task-detection で **OOS-1（独立スコープの follow-up）** として切り出された。

### 1.2 問題点・課題

- 他 admin 一覧（members / tags / audit / schema / requests / identity-conflicts）の詳細ドロワー / 展開セクションは、見出しの有無・余白・行区切りが画面ごとにバラバラで、視覚情報設計が統一されていない。
- 同種の「見出し付きサブカード」「行リスト」表現が各画面で独自の className / アドホックなスタイルで描画されており、`admin-meetings` で確立した primitive と二重定義になっている。
- 共通 primitive が `/admin/meetings` 専用のように見え、横展開の意図（implementation-guide §4.2）が形骸化するリスクがある。

### 1.3 放置した場合の影響

- 機能上の問題は一切ない。各画面のデータ表示・操作は正しく動作する。
- 影響は admin 横断の視覚一貫性のみに限定されるため、優先度は**低**。MVP 完了後の磨き込みとして扱う。
- 放置すると各画面で個別スタイルが増殖し、将来的にデザイン言語の一貫性維持コストが上がる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`admin-meetings-card-ux-clarity` で確立した `.admin-detail-section*` / `.admin-attendee-row*` primitive を、他 admin 詳細画面の同種表現（見出し付きサブカード・行リスト）へ段階的に適用し、admin 横断の視覚情報設計を統一する。

### 2.2 最終ゴール

- 各 admin 詳細画面の「見出し付きサブカード」「行リスト」表現が、`admin-meetings` と同一 primitive で描画される。
- 新規 primitive を増やさず、既存 `.admin-detail-section*` / `.admin-attendee-row*` を流用する（足りない場合のみ既存 primitive の variant で拡張）。
- 色はすべて `apps/web/src/styles/tokens.css` の OKLch トークン経由で、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が一切なく `verify-design-tokens` が PASS。
- 各画面の `data-testid` / `aria` / `role` 契約を破壊せず、既存テストが green を維持する。
- 1 PR = 1 画面（または密接に関連する 2 画面）を上限とし、CONST_007（1 サイクル完了スコープ）を遵守する段階適用とする。

### 2.3 受け入れ基準

- [ ] 対象画面のうち少なくとも 1 画面の詳細ドロワー / 展開セクションが `.admin-detail-section*` primitive で描画される（段階適用の 1 単位）。
- [ ] 適用画面で `data-testid` / `aria-label` / `role` の機械可読契約が一切 drift せず、既存 vitest spec が green。
- [ ] 新規 primitive を増やさず既存 primitive を流用（または既存 primitive の modifier / data 属性で variant 化）。
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がなく CI gate `verify-design-tokens` が PASS。
- [ ] API（`apps/api`）/ D1 schema / Google Form 仕様に一切手を入れず、`git diff dev -- apps/api` が空。
- [ ] 適用前後の見た目差分を staging screenshot で確認（user-gated・VISUAL）。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/styles/globals.css` | 既存 `.admin-detail-section*` / `.admin-attendee-row*`（1716-1766）を流用。不足時のみ既存 primitive の variant 追加 |
| `apps/web/src/features/admin/components/_members/`（および tags / audit / schema / requests / identity-conflicts の各 component ディレクトリ） | 対象画面の詳細ドロワー / 展開セクションを `.admin-detail-section` でラップ・行リストを `.admin-attendee-row` 系へ |
| 各画面の `__tests__/*.spec.tsx` | className 付与・既存契約維持の構造 assertion 追加（既存ケース維持） |

### 3.2 実装方針

- **段階適用**: 6 画面を 1 PR に詰め込まない。まず DOM 構造が `admin-meetings` に最も近い 1 画面を選び、primitive 適用の型を確立する。残りは同型 follow-up として後続 PR に分離する（CONST_007）。
- **契約保持優先**: 各画面の詳細ドロワーは既存 spec が `data-testid` / `getByRole` / `aria-label` で要素を query している。primitive 適用は wrapper 追加と className 付与のみに留め、機械可読 id・role・aria は不変とする（`admin-meetings-card-ux-clarity` の F2/F3 と同方針）。
- **primitive 流用優先**: 各画面の既存スタイルを `.admin-detail-section*` で置換できるか先に照合し、賄えない差分（画面固有の余白・列構成）がある場合のみ既存 primitive の modifier class / data 属性で variant 化する。新規 BEM ブロックは増やさない。
- **token 経由のみ**: 色・余白・角丸はすべて `var(--ubm-*)` トークン経由とし、HEX 直書きを混入させない。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/features/admin/components/`（members / tags / audit / schema / requests / identity-conflicts 各ディレクトリ）
- 症状: 各 admin 詳細ドロワーは画面ごとに DOM 構造・`data-testid` 命名・既存 spec の query 方法が異なる。`admin-meetings` で確立した primitive をそのまま当てると、wrapper 挿入で DOM 階層が変わり既存 `getByRole` / `data-testid` ベースの assertion が破綻する画面が出る恐れがある。6 画面を 1 PR で一括適用すると CONST_007（1 サイクル完了スコープ）に抵触し、コンフリクト・回帰のリスクが跳ね上がる。**1 PR = 1 画面（または密接 2 画面）の段階適用が必須**で、最初の 1 画面で型を確立してから横展開する。

- 対象: `apps/web/src/styles/globals.css`（1716-1766 の `.admin-detail-section*` / `.admin-attendee-row*`）
- 症状: 各画面の既存セクションは余白・列構成が `admin-meetings` と微妙に異なるため、primitive をそのまま流用すると一部画面でレイアウトが崩れる可能性がある。新規 BEM ブロックを安易に増やすとプロトタイプ正本順位（新規 primitive を増やさない）に抵触する。差分は既存 primitive の modifier class / data 属性 variant に閉じ込める判断が先決で、「どこまで流用・どこから variant」の線引きが画面ごとに必要。

- 対象: `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-12/implementation-guide.md` §4.2
- 症状: primitive は `admin-meetings` の出席者ドメイン（`.admin-attendee-*`）に命名が寄っている。他画面（members の tag 行・schema の alias 行等）へ流用する際、命名が「出席者」に固定されていると意味的に不自然になる。汎用名（`.admin-detail-row` 等）への rename を伴うべきか、別 alias を足すかの判断が必要で、rename する場合は `admin-meetings` 側の既存テスト・className も同時更新が必要（破壊範囲が広がる）。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 6 画面一括適用で CONST_007 抵触・回帰多発 | 高 | 1 PR = 1 画面（密接 2 画面）の段階適用に限定。最初の 1 画面で型を確立し残りは同型 follow-up に分離 |
| wrapper 挿入で既存 `data-testid` / `getByRole` 契約が破綻 | 中 | 機械可読 id・role・aria を不変とし、wrapper 追加と className 付与のみに留める。適用前に各画面の spec query 方法を精査 |
| primitive 流用でレイアウト崩れ | 中 | 賄えない差分は既存 primitive の modifier / data 属性 variant に閉じ込め、新規 BEM ブロックを増やさない |
| `.admin-attendee-*` 命名が他ドメインで不自然 | 低 | 汎用 rename の要否を最初の適用画面で判断。rename する場合は `admin-meetings` 側の className / テストも同時更新し別 PR で先行 |
| HEX 直書き混入で `verify-design-tokens` 抵触 | 低 | 色・余白は `var(--ubm-*)` 経由のみ。実装後に HEX grep と `verify-design-tokens` をローカル実行 |

---

## 検証方法

### 単体検証

apps/web に `vitest.config.ts` が無いためリポジトリルートから実行する（適用画面の spec を指定）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/<適用画面>/__tests__/<対象>.spec.tsx
```

期待: 既存の `data-testid` / role / aria ベースの assertion が green を維持し、primitive className 付与の新規構造 assertion が PASS。

### 統合検証（VISUAL）

- staging での適用前後の見た目差分 screenshot 取得は user-gated。ユーザー承認後に適用画面の詳細ドロワー / 展開セクションを確認する。

### 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/features/admin/components/<適用画面> apps/web/src/styles/globals.css
git diff dev -- apps/api
```

期待: typecheck / lint が 0 error、HEX・`bg-[#xxx]`・`text-[#xxx]` の grep ヒットが 0 件、`verify:tokens` が PASS、`git diff dev -- apps/api` が空。

---

## スコープ

### 含む

- `.admin-detail-section*` / `.admin-attendee-row*` primitive の他 admin 詳細画面への段階適用（1 PR = 1 画面 / 密接 2 画面）。
- 流用時に必要な範囲での既存 primitive の modifier / data 属性 variant 化。
- 適用画面の spec への構造 assertion 追加（既存契約維持）。
- 必要に応じた primitive の汎用 rename（`admin-meetings` 側を同時更新する場合は先行 PR として分離）。

### 含まない

- API（`apps/api`）/ D1 schema / Google Form 仕様の変更。
- 新規 BEM ブロックの新設（既存 primitive の流用 / variant に閉じる）。
- 6 画面の一括適用（段階適用が必須）。
- 色設計の見直し（OOS-2・別件）/ ドロワー構造の右スライド化（OOS-3・別件）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/`
- canonical source（OOS-1）: `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-12/unassigned-task-detection.md`
- primitive 定義: `apps/web/src/styles/globals.css`（1716-1766）
- primitive 設計意図: `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-12/implementation-guide.md` §4.2
- トークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
