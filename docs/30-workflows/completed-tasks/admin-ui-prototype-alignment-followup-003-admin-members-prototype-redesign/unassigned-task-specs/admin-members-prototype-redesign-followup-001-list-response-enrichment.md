# admin-members-prototype-redesign-followup-001 — list response zone/tags/occupation enrichment

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-members-prototype-redesign-followup-001 |
| 分類 | implementation / API contract / shared schema |
| 優先度 | 中 (priority:medium) |
| 規模 | 中 (scale:medium) |
| ステータス | unassigned |
| 発見元 | admin-ui-prototype-alignment-followup-003 Phase 12 unassigned-task-detection (候補 1 + 4) |
| 発見日 | 2026-05-27 |
| 親ワークフロー | admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign |
| visualEvidence | VISUAL_ON_EXECUTION |

## 背景

親ワークフローのプロトタイプ準拠再構成で `MembersTable` の各行に zone chip / occupation 表示 / list-level tag pill を整備したが、現行 `AdminMemberListView` (shared schema) は zone・tags・occupation を返さない。UI 側は placeholder 描画 + drawer の detail 取得に degrade している。

プロトタイプ正本 (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366) は list 行に zone chip + tag pill + occupation snippet を同時表示する想定で、detail fetch を都度走らせない設計になっている。drawer は detail-only に保ちつつ、list 行で「ざっと見」できる UX を取り戻す必要がある。

## 概要

`GET /admin/members?filter=&q=` の list response に zone / tags / occupation を含める形で API contract と shared schema を拡張し、UI placeholder を実データへ昇格する。

## 苦戦箇所【記入必須】

- 親ワークフローは「既存 API surface のみ利用 / 新 endpoint・schema 変更禁止」を不変条件にしていたため、UI 側で hue 派生 + placeholder で握り潰した。結果として list が「データが薄い」見え方になり、prototype と乖離する。
- shared schema (`AdminMemberListView`) を変更すると D1 column の expose 範囲 + admin filter のクエリ shape (zone facet 等) も同時に再検討が必要で、`apps/api/src/routes/admin/members.ts` の SELECT + zod schema + apps/web 側 viewmodel が連動して変わる。1 commit で着地させると blast radius が大きい。
- tags は別テーブル (`tag_assignments`) で多対多。list で N+1 を避けるため `GROUP_CONCAT` + parse か、`JOIN + array_agg` 相当の D1 representation を選ぶ必要があり、現行の admin repository には共通化されたパターンが無い (将来 followup-002 が tag write endpoint で同じ I/O を踏むので、設計を共通化したい)。
- 将来 photo URL を伴う avatar 表示 (followup-003) も同じ list 経路に乗せるので、enrichment は「単発の zone 追加」ではなく「list view 拡張パターン」として整備する方が安全。

## 目的

- list 行で zone chip / tag pill / occupation snippet を実データから描画できるようにする
- detail fetch (drawer 開閉) と list 描画を疎結合に保つ
- UI placeholder と「実データ未整備」状態の差分を視覚的に切り分け可能にする

## スコープ

含む:

- `apps/api/src/routes/admin/members.ts` list endpoint の SELECT 拡張 (zone / tags / occupation)
- `@ubm-hyogo/shared` の `AdminMemberListView` zod schema 拡張 + 後方互換 (optional)
- `apps/web/src/features/admin/components/_members/MembersTable.tsx` placeholder → 実データ参照への切替
- apps/api list test (route + repository) でフィールド存在を assert
- apps/web list spec で zone chip / tag pill / occupation の表示パターンを assert
- shared schema 変更に伴う `apps/web` viewmodel adapter の整備

含まない:

- tag 編集 / persistence (followup-002 で扱う)
- photo URL を伴う avatar 実データ (followup-003 で扱う)
- 公開フィルタ・絞り込みの UI 追加 (本 followup の対象外)
- D1 schema migration が必要な field 新設 (現行 column 由来のみで完結させる)

## 受入条件 (Acceptance Criteria)

- AC-1: `GET /admin/members` list response に `zone` / `tags[]` / `occupation` が含まれ、zod schema が parse error を起こさない
- AC-2: `MembersTable` の zone chip / tag pill / occupation 列が placeholder ではなく実データで描画される (apps/web list spec で assert)
- AC-3: list endpoint の P95 latency が現行比で +50ms 以内に収まる (D1 EXPLAIN で確認 / N+1 を許容しない)
- AC-4: list 行 tag pill は disabled 表示を維持し、編集 affordance を出さない (followup-002 までの境界を明示)
- AC-5: shared schema 変更が `apps/api` typecheck + `apps/web` typecheck の両方で green
- AC-6: 既存 admin filter (`?filter=published|hidden|deleted&q=`) の挙動 regression が無いことを apps/api route test で assert

## リスクと対策

| リスク | 対策 |
| --- | --- |
| list SELECT 拡張で N+1 発生 | tag は `GROUP_CONCAT` + parse、または single JOIN で取得し EXPLAIN で確認 |
| shared schema 変更で apps/web 既存 view が break | optional field 追加 → adapter 層で fallback → 全消費点を typecheck で網羅確認 |
| placeholder 撤去で empty state UX 劣化 | zone/tags 未登録時の UI を明示的に decisioning し、disabled chip で render |

## 検証方法

- apps/api: route test で response shape を assert、repository test で SELECT 結果を assert
- apps/web: vitest で MembersTable の zone chip / tag pill / occupation 描画 spec を追加
- Playwright visual: 既存 admin-members visual baseline を再生成し、placeholder→実データの diff を確認
- D1 EXPLAIN: list クエリの index 利用を確認

## 上流前提

- 親 workflow `admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign` Phase 13 まで完了 (UI 側は placeholder で先行 merge 済み)
- followup-002 (tag write endpoint) の前提タスクではないが、I/O 設計を共通化する目的で先行する

## 関連参照

- `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/unassigned-task-detection.md` (候補 1 + 4 の出典)
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366 (list 行のプロトタイプ正本)
- `apps/api/src/routes/admin/members.ts` (list endpoint)
- `@ubm-hyogo/shared` の `AdminMemberListView`

## GitHub Issue

- #981 — https://github.com/daishiman/UBM-Hyogo/issues/981
- labels: `priority:medium`, `scale:medium`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`, `unassigned`
