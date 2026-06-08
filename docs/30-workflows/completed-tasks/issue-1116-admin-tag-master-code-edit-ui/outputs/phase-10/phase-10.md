# Phase 10: 最終レビュー / Gate 判定（issue-1116 admin tag master code edit UI）

**[実装区分: 実装仕様書]**

> AC-1..AC-5（Phase 1 §1.6 / DESIGN-BRIEF §5）の達成可否を実装箇所・テストへ写像して確認し、MINOR 指摘を §10.5 で未タスク化候補として切り出す。
> implemented_local_evidence_captured 段階。Gate-B/C は local implementation evidence 取得により passed。

## 1. AC 達成チェックリスト（AC → 実装箇所 → テスト）

| AC | 内容 | 実装箇所 | 検証テスト | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | admin tag master 一覧から対象 tag を選び、`code`/`label`/`category` の編集 UI に到達できる | `app/(admin)/admin/tag-master/page.tsx`（sibling route）+ `TagMasterPanel`（一覧+行選択）+ `TagMasterEditForm`（編集フォーム）+ nav item `tag-master` | P-T1 / P-T2 / P-T4 / Reg-N1..N3 / 手動 smoke #1 | ✅ 写像済 |
| AC-2 | code rename 時は現在の code を `expectedCode` として送信し、stale conflict を検出できる | `TagMasterEditForm`（行ロード時 `tag.code` を expectedCode 保持・`buildTagUpdateInput` で code 変更時のみ同梱）+ `updateTag`（PATCH body） | focused Vitest / Playwright local fixture（stale conflict 表示） | ✅ 実測済 |
| AC-3 | 409 `tag_code_conflict` と 409 `tag_stale_conflict` を別メッセージで表示する | `tags.ts`（`parseTagUpdateErrorCode` で code 分離）+ `TagMasterEditForm`（`CONFLICT_COPY` 名前付き map・role=alert 表示） | E-T4（code_conflict 文言）/ E-T5（stale 別文言・code 文言と異なる assert）/ E-T11 / E-T12 / U-T2 / U-T3 | ✅ 写像済 |
| AC-4 | label/category の既存更新と code rename の両方が後方互換に動く | `updateTag`（変更フィールドのみ送信）+ `TagMasterEditForm`（`buildBody` で code 未変更時は expectedCode 非送信・差分ゼロは前検証ブロック） | E-T3 / E-T3b / E-T3c / U-T1c / U-T8（全フィールド同時）/ U-T5（no_update_fields） | ✅ 写像済 |
| AC-5 | focused component/API client tests と visual evidence を取得する | `tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / `page.spec.tsx` / `shell-config.spec.ts` + `admin-tag-master-code-edit-ui.spec.ts` | focused Vitest 4 files / 20 tests PASS + Phase 11 local fixture screenshots 4 PNG | ✅ 実測済（staging authenticated capture は user-gated） |

## 2. 409 分離（AC-3 核心）の写像確認

`updateTag` → `parseTagUpdateErrorCode` → `CONFLICT_COPY` の経路で 2 種の 409 が**別文言**になることをレビュー観点とする:

| API error code（`tags.ts:60`） | web parse 結果 | 表示文言（`CONFLICT_COPY`） | テスト |
| --- | --- | --- | --- |
| `tag_code_conflict`（UNIQUE 衝突） | `"tag_code_conflict"` | 「同じコードのタグが既にあります。…」 | focused Vitest / Playwright TC-03 |
| `tag_stale_conflict`（CAS mismatch） | `"tag_stale_conflict"` | 「保存前に別の変更が入りました。…」 | focused Vitest / Playwright TC-04 |
| `tag_not_found` | `"tag_not_found"` | 「対象のタグが見つかりません。…」 | parser coverage |
| `no_update_fields` / `invalid_body` | 各 code | 変更なし抑止 / 入力値確認 | parser coverage / UI validation |

> 2 文言が `expect(text).not.toContain(...)` で**互いに異なる**ことを E-T5 が固定（DESIGN-BRIEF §6 リスク「stale を code と同表示」への対策）。

## 3. sibling route 採用（nav 衝突回避）の写像確認

| 観点 | 確認 | テスト |
| --- | --- | --- |
| `/admin/tag-master` 表示時に tag-queue（`/admin/tags`）が active にならない | `isNavItemActive("/admin/tags","/admin/tag-master") === false`（完全一致でも startsWith でも false） | Reg-N2 |
| `/admin/tag-master` 自身は active | `isNavItemActive("/admin/tag-master","/admin/tag-master") === true` | Reg-N2 |
| 子ルート（`/admin/tags/...`）では tag-queue のみ active | `isNavItemActive("/admin/tags","/admin/tags/queue") === true` / tag-master は false | Reg-N2 |

> 子ルート `/admin/tags/master` を採らず sibling `/admin/tag-master` を採る判断（Phase 1 §1.3.2）が回帰で固定される。

## 4. blocker 判定（CONST_007 充足）

- 変更対象は `apps/web` の新規 4（route/panel/form/api）+ 編集 2（shell-config/icons）+ test。**外部依存・前提タスク待ちは無い**（issue-1069 PATCH code/expectedCode・409 分離 / issue-1070 reactivate/delete API は完了済・本タスクは UI から消費するのみ）。
- web proxy（catch-all）は既に `PATCH /api/admin/tags/:tagId` を転送するため新規 proxy 不要（DESIGN-BRIEF §3-2）。
- D1 schema 変更不要・Google Form 変更不要・`apps/api` 非変更（不変条件 #1/#5/#7）。
- → **本サイクル内で全 AC を完了済み。blocker なし（CONST_007 充足）**。

## 5. Gate 判定

| Gate | 判定 | 備考 |
| --- | --- | --- |
| Gate-A（設計レビュー） | **passed（spec 上）** | route 決定（sibling）/ component・API client signature / expectedCode CAS / 409 分離が確定（artifacts.json gates・Phase 3） |
| Gate-B（品質保証） | **PASS** | focused web vitest / typecheck / lint / verify:design-tokens / coverage-guard を実装後に実測（user-gated） |
| Gate-C（最終レビュー / close-out） | **PASS（local fixture）** | 実装 + local visual evidence + skill same-wave sync 後に passed。commit/push/PR/staging/authenticated visual/Issue 状態は user-gated |

## 6. 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 単一責務 | tag master の code/label/category 編集 UI 導線（一覧→選択→編集→409 分離）に限定。create（MemberTagInlineCreate）/ delete・reactivate（issue-1070 API）は非接触 |
| 1 サイクル完結 | apps/web 内 route / components / API client / shell / styles + test・D1/新 endpoint なし・前提タスク待ちなし（§4）→ 完結済み |
| 既存 contract 後方互換 | code/expectedCode を送らない PATCH は label/category 更新として既存挙動（U-T1c / E-T3 / AC-4）。既存 `members.ts`/`useAdminMutation`/`/admin/tags` queue は非破壊（Phase 6 §5） |
| user-gated 境界 | commit / push / PR / staging deploy / authenticated visual capture / Issue #1116 状態変更は未実行（Phase 13） |

## 10.5 未タスク候補（MINOR 指摘・別スコープの明示）

本タスクのスコープ外であり、別 follow-up として切り出す（本サイクルでは実装しない）。詳細は `outputs/phase-12/unassigned-task-detection.md` に登録する。

### スコープ外（既にスコープ済の別アイテム・新規 deferral ではない）

| # | 項目 | 種別 | スコープ外の根拠 |
| --- | --- | --- | --- |
| O-1 | tag master の **create UI**（新規 tag 追加フォーム） | UI / apps/web | create は既に `MemberTagInlineCreate`（member drawer 内）に存在。tag master 専用 create が必要なら別タスク。本タスクは list + edit + conflict 表示に限定（Phase 1 §1.5 含まない） |
| O-2 | tag **物理削除 / reactivate UI**（active 0↔1） | UI / apps/web | API は issue-1070 で存在するが UI は別スコープ。削除/再有効化は確認導線・監査表示など別設計判断を要する（Phase 1 §1.5・DESIGN-BRIEF 範囲外） |
| O-3 | member drawer **inline-create UI** の整理 | UI / apps/web | `task-issue-1035-followup-001` のスコープ。本タスクと独立 |

### MINOR 指摘（起票判断は実装着地後）

| # | MINOR 候補 | 判断方針 |
| --- | --- | --- |
| M-1 | 一覧の **検索 / pagination の充実**（現状 page=1&pageSize=50 固定・truncated 注記のみ） | 50 件超の tag master 運用が現実化した時点で別タスク化を検討。現状は truncated 注記（P-T5）で「全件でない」ことを明示し許容。**現時点では起票しない**（構造的境界・YAGNI） |
| M-2 | stale 回復の **差分プレビュー**（旧入力 vs 最新値を並べて提示） | 現状は手動更新案内まで。差分 UI は UX 向上の任意拡張。**現時点では起票しない**（AC-2 は stale 検出と上書き防止で充足） |
| M-3 | code rename 時の **影響範囲表示**（その code を参照する member 数等） | API（member_tags は tag_id 参照で rename 無影響）上は不要だが operator 安心感の任意拡張。**現時点では起票しない** |

> §10.5 の O-1..O-3 は「先送り」ではなく**別タスク/別 issue の既存スコープ**。M-1..M-3 は MINOR で、unassigned-task-guidelines（起票は実装着地後・構造的境界は起票しない）に従い**本サイクルでは新規 Issue / 未タスク spec を作らない**。最終判断は実装着地後の Phase 12 detection で行う。

## 7. runtime boundary

spec 上の設計レビューは完了。focused web vitest / web typecheck / lint / verify:design-tokens / coverage-guard の実測、staging deploy / authenticated visual capture / runtime smoke / commit / push / PR / Issue #1116 状態変更は user-gated。Issue #1116 は CLOSED（本ワークフローは状態変更せず・`Refs #1116` のみ）。
