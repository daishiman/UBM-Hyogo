# serial-05 step-03 schema alias bulk resolve - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | serial-05-step-03-followup-002-schema-alias-bulk-resolve                                        |
| タスク名     | SchemaDiffPanel における alias 一括 resolve UI 拡張                                              |
| 分類         | 機能拡張 / admin operational efficiency                                                          |
| 対象機能     | `/admin/schema` の diff resolve 運用フロー（複数 diff の bulk alias resolve）                    |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 中規模                                                                                          |
| ステータス   | consumed                                                                                         |
| 発見元       | serial-05 step-03 Phase 12 後続候補                                                              |
| 発見日       | 2026-05-17                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/`
- 親タスク状態: `completed`（single-resolve 経路は稼働中）
- Phase 12 evidence 状態: `completed`（後続候補として §3 に明示記録済み）
- 関連 outputs:
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`（§3 後続候補 — alias bulk resolve）
- 関連実装:
  - `apps/web/src/components/admin/SchemaDiffPanel.tsx`（現行 single-resolve UI）
  - `apps/web/src/lib/admin/api.ts` の `postSchemaAlias`
  - `apps/api/src/routes/admin/schema.ts` の `POST /admin/schema/aliases` endpoint
- 関連仕様:
  - `docs/00-getting-started-manual/specs/11-admin-management.md`
  - `docs/00-getting-started-manual/specs/01-api-schema.md`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-05 step-03 では `SchemaDiffPanel` 上で Google Form schema diff（added / changed / removed / unresolved）を表示し、`unresolved` / `changed` 行から 1 件ずつ stableKey alias を割当てる single-resolve UI を実装した。`apps/web/src/lib/admin/api.ts#postSchemaAlias` は単一 `(diffId, stableKey)` ペアを `POST /admin/schema/aliases` に送る contract で、API 側（`apps/api/src/routes/admin/schema.ts`）も 1 リクエスト 1 alias 適用で確定している。

この設計は MVP 時点で十分だが、Google Form 改訂時に section ごとに **複数 question が一斉に rename されるケース**が想定される。実運用では「6 セクション × 平均 5 question 改訂 = 約 30 件の alias 割当」が一度に発生し得る。

### 1.2 問題点・課題

- 1 件ずつ confirm modal → POST → refetch の往復で運用負荷が高い（30 件で約 10 分以上のリードタイム想定）
- ネットワーク往復・refetch コストが diff 件数に線形比例し、UI が長時間ブロックされる
- admin 担当者が手作業で stableKey を入力する過程でタイプミスが混入しやすい（regex 検証は通っても意味的に誤った key が紛れる）
- Phase 12 unassigned-task-detection §3 で「alias bulk resolve」が後続候補として明示的に記録されているが、独立タスク化されていない
- Google Form 改訂イベントの実頻度が上がった際、bulk resolve 不在が schema diff 滞留の bottleneck になる

### 1.3 放置した場合の影響

- 大規模 schema 改訂時に admin 運用が手作業の物量で詰まり、`unresolved` diff が長期間滞留する
- 滞留中は `/admin/schema` がエラー状態を表示し続け、後続の members / requests 管理画面の信頼性指標が低下する
- 単発 endpoint 連打による D1 binding への負荷が増え、Workers の CPU time 制約に抵触するリスクが残る

---

## 2. 何を達成するか（What）

### 2.1 目的

`SchemaDiffPanel` に bulk resolve mode を追加し、複数 diff 行を checkbox で選択 → batch confirm modal で一括 alias 割当を可能にする。既存 single-resolve 経路は破壊せず共存させる。

### 2.2 最終ゴール

- `/admin/schema` 画面で複数 `unresolved` / `changed` diff を一括選択し、確認 modal で stableKey を一括入力 → 1 度の操作で全件 resolve できる
- batch 内で部分失敗（一部 409 alias_conflict / 422 invalid）が起きても、成功分は確定し失敗分は理由付きで再操作可能な状態が UI に表示される
- single resolve 経路と bulk resolve 経路がコード上で重複なく共存（state machine の単一責務化）
- Phase 12 unassigned-task-detection §3 の「alias bulk resolve」が consumed に更新

### 2.3 スコープ

#### 含むもの

- `SchemaDiffPanel` への bulk selection UI（行 checkbox / select-all / 選択件数バッジ）
- batch confirm modal（選択 diff 一覧 + stableKey 個別入力 or 共通 prefix 入力）
- bulk submit 中の progress / partial failure 表示
- 既存 `postSchemaAlias` を loop で呼ぶ実装か、bulk endpoint を新設するかの判断点を Phase 1（設計）で明示
- bulk endpoint 新設が必要と判定された場合、`POST /admin/schema/aliases:batch` を `apps/api/src/routes/admin/schema.ts` に追加（D1 transaction 境界・失敗時 rollback policy を含む）
- `apps/web/src/lib/admin/__tests__/api.spec.ts` および `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` への bulk path テスト追加
- `docs/00-getting-started-manual/specs/11-admin-management.md` の bulk resolve 仕様追記

#### 含まないもの

- alias rollback / undo（別 followup）
- diff history view（別 followup）
- admin notification（別 followup）
- Google Form schema 変更検知の自動化（既存 polling 仕様を踏襲）
- design token 拡張（既存 OKLch トークンのみ使用、不変条件3「プロトタイプ正本順位」を維持）

### 2.4 成果物

- `apps/web/src/components/admin/SchemaDiffPanel.tsx` の bulk mode 拡張差分
- `apps/web/src/lib/admin/api.ts` の bulk helper（必要なら `postSchemaAliasBulk`）
- `apps/api/src/routes/admin/schema.ts` の batch endpoint（採用時のみ）
- 対応する spec ファイル更新（`*.spec.tsx` / `*.spec.ts`、不変条件8: `*.test.*` 禁止）
- `docs/00-getting-started-manual/specs/11-admin-management.md` の §schema diff resolve 章拡張
- Phase 11 evidence: bulk select + batch modal の screenshot（desktop 1280 / mobile 375）

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 既存 single-resolve UI との state 管理共存

現行 `SchemaDiffPanel` は「行ごとに inline edit → confirm modal」の単純 state machine。bulk mode を導入すると以下の state が交錯する:

- 単一行 inline edit state（既存）
- bulk selection state（行 id Set）
- bulk confirm modal state（選択 snapshot + 個別 stableKey 入力 map）
- bulk submit progress state（per-row 成功 / 失敗 / pending）

これらを単一の reducer に統合するか、bulk 専用 sub-component に分離するかで設計判断が割れる。Phase 1 で state 構造図を確定させてから実装に入る必要がある。

### 3.2 batch 中の部分失敗ハンドリング

bulk endpoint 採用時は D1 transaction 境界が論点:

- **全件 transaction**: 1 件でも 409 / 422 で全件 rollback。simple だが admin から見ると「29 件成功するはずが 1 件のせいで全て巻き戻る」体験。
- **per-row commit**: 各 alias を独立 commit。部分成功を許容、失敗分のみ再操作可能。実装複雑度が上がり、API response shape も `{ results: [{ diffId, status, error? }] }` に変更。
- **既存 endpoint loop**: client 側で bounded fan-out し、行ごとの進捗と最終結果集計を UI で表示。API 変更なしだが N 件 HTTP 往復のコストが残る。

推奨は per-row commit + 結果集計レスポンス。Phase 1 でトレードオフ表を作成し、`docs/00-getting-started-manual/specs/01-api-schema.md` の API contract に明文化する。

### 3.3 unresolved / changed / added 混在 pane での選択 UX

`SchemaDiffPanel` は diff カテゴリ別に行を表示するが、alias resolve 対象は `unresolved` と `changed` のみ。`added` / `removed` 行に checkbox を見せると誤操作を招く。一方で「カテゴリごとに UI を分岐」させると bulk select-all の意味が曖昧化する（「全選択」が何を対象とするのか）。

解決方針候補:

- checkbox は resolve 可能カテゴリ行のみに描画
- select-all はカテゴリ単位に分離（`unresolved 全選択` / `changed 全選択`）
- 選択件数バッジに breakdown 表示（例: `12 件選択中（unresolved 8 / changed 4）`）

### 3.4 stableKey 一括入力 UX

30 件の stableKey を 1 つずつ入力させると bulk の意義が薄れる。一方で共通 prefix 一括入力では意味的整合が取れない。候補:

- 既存 `aliasRecommendation` service の推奨値を pre-fill し、admin は確認のみ
- CSV インポート式 textarea（`diffId,stableKey` 形式）
- modal 内で行ごとの個別入力 + recommendation auto-fill ボタン

`apps/api/src/services/aliasRecommendation.ts` の既存ロジックを bulk path でも活用することが前提。

### 3.5 学んだこと / 横展開メモ候補

- bulk 操作 UI は admin 系の他画面（members 一括 deactivate / tags 一括付与 / requests 一括承認）でも需要が出る可能性が高く、本 followup で確立した state パターンを `apps/web/src/components/admin/_shared/` に再利用可能 hook として抽出することを検討
- D1 transaction 境界の判断基準を `docs/00-getting-started-manual/specs/08-free-database.md` に追記する候補

---

## 4. 受入条件 (AC)

- **AC-1**: `/admin/schema` 画面で複数 `unresolved` / `changed` diff 行を checkbox で選択し、batch confirm modal を介して一括 resolve できる
- **AC-2**: bulk submit 中に部分失敗（409 alias_conflict / 422 invalid stableKey）が発生した場合、成功分は確定し失敗分は理由付きで UI に表示され、admin が失敗分のみ再操作可能
- **AC-3**: 既存 single-resolve 経路（既存 spec のシナリオ全件）が回帰なく稼働する
- **AC-4**: stableKey validation regex は既存 single 経路と同一を共有（`apps/web/src/lib/admin/api.ts` の既存定義を再利用、duplicate 禁止）
- **AC-5**: bulk path の単体テストが `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` と `apps/web/src/lib/admin/__tests__/api.spec.ts` に追加され、partial failure シナリオを含む（ファイル名は `*.spec.tsx` / `*.spec.ts` のみ、不変条件8 遵守）
- **AC-6**: design token 違反なし（OKLch のみ使用、HEX 直書き / `bg-[#xxx]` 禁止、`verify-design-tokens` gate green）
- **AC-7**: API 側で bulk endpoint を新設した場合、`apps/api/src/routes/admin/schema.ts` の integration test が partial failure / 全件成功 / 全件失敗 の 3 ケースで green
- **AC-8**: `docs/00-getting-started-manual/specs/11-admin-management.md` および `docs/00-getting-started-manual/specs/01-api-schema.md` に bulk resolve 仕様が追記され、step-03 single-resolve 仕様との整合が取れている
- **AC-9**: Phase 11 evidence として bulk select + batch confirm modal + partial failure 表示の screenshot が desktop 1280 / mobile 375 で取得済み
- **AC-10**: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 の「alias bulk resolve」項目が consumed に更新

---

## 5. 依存関係

- **前提**: serial-05 step-03 single-resolve 経路の hardening 完了（親 PR merge 済み）
- **前提**: parallel-09 UX cross-cutting primitives（Modal / Checkbox / FormField）が `apps/web/src/components/ui/` で利用可能
- **後続**: alias rollback / undo followup、diff history view followup（本タスク完了後に独立判断）

---

## 6. 参照資料

- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`（§3 後続候補）
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`（`postSchemaAlias`）
- `apps/api/src/routes/admin/schema.ts`（`POST /admin/schema/aliases` / `GET /admin/schema/aliases/:diffId/backfill`）
- `apps/api/src/services/aliasRecommendation.ts`
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 transaction 境界判断材料）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件1（既存 API のみ接続）/ 不変条件3（プロトタイプ正本順位）/ 不変条件8（`*.spec.*` のみ許可）

---

## 7. 状態語彙

- `pending`: タスク未着手（本ドキュメント作成時の初期状態）
- `in_progress`: Phase 1 設計判断（bulk endpoint 新設 vs client loop）に着手
- `api_contract_decided`: bulk endpoint 採否・transaction 境界・response shape が確定し API spec 更新済み
- `implemented_local_runtime_pending`: UI / API 実装完了、Phase 11 evidence 未取得
- `completed`: AC-1〜AC-10 全件充足、親 workflow Phase 12 detection が consumed 更新済み

## Consumed Trace

本タスクは `docs/30-workflows/issue-776-schema-alias-bulk-resolve/` に昇格済み。Issue #776 は CLOSED のまま扱い、PR 文脈では `Refs #776` を使う。実装・runtime evidence・commit・push・PR は昇格先 workflow の Phase 4-13 で扱う。
