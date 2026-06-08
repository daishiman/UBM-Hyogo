# Phase 7: カバレッジ確認（issue-1116 admin tag master code edit UI）

**[実装区分: 実装仕様書]**

> 正本: `outputs/phase-1/phase-1.md`（§1.6 AC / §1.7 inventory）+ `outputs/phase-4/phase-4.md` / `outputs/phase-6/phase-6.md`（テスト ID）+ `DESIGN-BRIEF.md` §3-§6。
> 本タスクは `apps/web` の新規 6 / 編集 2 ファイル（VISUAL / implementation_mode=new）。coverage は **本サイクルで追加/変更した関数・component に限定** して読み取る。全体閾値の上げ下げは目的にしない。
> implemented_local_evidence_captured 段階のため本 Phase の実測値は本実行サイクルで local evidence で記録済み。

## 0. coverage 実行（focused / web workspace）

focused web test は repo ルートから web workspace filter で実行する（`apps/api` の D1 config は本タスクでは不要・apps/web 非接触の API 側は触らない）。

```bash
# 変更 component / API client に限定した focused coverage
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage \
  src/features/admin/api/__tests__/tags.update.spec.ts \
  src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx \
  apps/web/app/(admin)/admin/tag-master/page.spec.tsx \
  src/components/shell/__tests__/shell-config.spec.ts \
  src/components/shell/__tests__/SidebarNavItem.spec.tsx
```

> coverage は **変更ファイルの新規関数 / 新規 component** を読み取り対象とする。`vitest.config.ts`（web workspace）経由で jsdom 環境を使う（D1 config は不要）。

## 1. coverage 対象（変更ファイル・新規関数/コンポーネントに限定）

| ファイル | 対象 | 目標 statements | 目標 branches | 根拠テスト |
| --- | --- | --- | --- | --- |
| `apps/web/src/features/admin/api/tags.ts` | `updateTag` / `parseTagUpdateErrorCode` / `TagUpdateError` | 100% | 100% | U-T1..U-T9 / U-P1 |
| `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | submit / `buildBody` 差分構築 / 409 分離表示 / client 前検証 | ≥ 80%（目標 100% 近傍） | ≥ 80% | E-T1..E-T12 |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | 一覧描画 / 行選択 / onSuccess row 反映 / stale 回復導線 | ≥ 80%（目標 100% 近傍） | ≥ 80% | P-T1..P-T7 |
| `apps/web/src/components/shell/shell-config.ts` | `ShellNavItemId` 拡張 / admin group items（tag-master 追加） | 既存 100% 維持 | 既存維持 | Reg-N1 / Reg-N2 |
| `apps/web/src/components/shell/icons.tsx` | `PATHS["tag-master"]` 追加 | 既存維持 | 既存維持 | Reg-N3 |

### 1.1 `updateTag` / `parseTagUpdateErrorCode` の分岐網羅（100% branch）

| 分岐 | 入力 | 期待 | テスト |
| --- | --- | --- | --- |
| 200 成功 → AdminTagRef（active 除外 4 項目） | `mockFetch(200, {...,active:1})` | 戻り値 4 項目 / PATCH / body 一致 | U-T1 / U-T8 |
| tagId encodeURIComponent | `updateTag("a/b", ...)` | `url === "/api/admin/tags/a%2Fb"` | U-T1b |
| label 単独 → expectedCode 非送信 | `updateTag(t, {label})` | body に `code`/`expectedCode` キー不在 | U-T1c |
| 409 tag_code_conflict | `mockFetch(409, {error:"tag_code_conflict"})` | throw `{code:"tag_code_conflict",status:409}` | U-T2 |
| 409 tag_stale_conflict | `mockFetch(409, {error:"tag_stale_conflict"})` | throw `{code:"tag_stale_conflict",status:409}` | U-T3 |
| 404 tag_not_found | `mockFetch(404, ...)` | throw `{code:"tag_not_found",status:404}` | U-T4 |
| 400 no_update_fields | `mockFetch(400, ...)` | throw `{code:"no_update_fields",status:400}` | U-T5 |
| 400 invalid_body | `mockFetch(400, ...)` | throw `{code:"invalid_body",status:400}` | U-T5b / U-T7 |
| 不明 code / 空 body の !ok（code=null） | `mockFetch(500,...)` / `mockFetch(503,"",false)` | throw `{code:null}` | U-T6 / U-T9 |
| `parseTagUpdateErrorCode` 既知/未知/不正 JSON/非オブジェクト/空文字 | §4 ケース表 | 既知=code / それ以外=null | U-P1（10 入力） |

> 200 / 4 種 4xx / 不明 code / null body / parse 全分岐が踏まれ、`tags.ts` の line/branch 100% を満たす。

### 1.2 EditForm / Panel の分岐網羅（80% 以上・目標 100% 近傍）

| 分岐 | 期待 | テスト |
| --- | --- | --- |
| 初期 code を expectedCode として保持（code 変更時のみ同梱） | E-T1 / E-T2 | covered |
| label / category 単独更新で expectedCode 非送信（AC-4 後方互換） | E-T3 / E-T3b | covered |
| 差分ゼロ submit → mutation 未発火・「変更がありません」 | E-T3c | covered |
| 409 tag_code_conflict の専用文言 | E-T4 | covered |
| 409 tag_stale_conflict の**別文言**（code_conflict と異なる） | E-T5 / E-T11 | covered（AC-3 核心） |
| cancel → onCancel / a11y（label 紐付き・role=alert） | E-T6 / E-T7 | covered |
| CODE_RE 違反 / label120・category64 の client 前検証 | E-T8 / E-T9 | covered |
| 多重送信ブロック（二重 submit で 1 回のみ） | E-T10 | covered |
| conflict 表示後 再 submit で conflict クリア | E-T12 | covered |
| 一覧描画 / 空一覧「該当するタグはありません」 | P-T1 / P-T1b | covered |
| 行選択 → 編集フォーム到達 / 別行選択で切替（前値残らない） | P-T2 / P-T4 | covered |
| onSuccess row 反映（旧 code → 新 code 置換） | P-T3 | covered |
| pagination truncated 注記（total > available） | P-T5 | covered |
| CAS 連鎖（2 回目 expectedCode = 1 回目成功後の新 code） | P-T6 | covered |
| stale conflict 分離表示（手動更新案内） | P-T7 | covered |

### 1.3 nav 回帰（既存 coverage 維持）

| 対象 | 期待 | テスト |
| --- | --- | --- |
| admin group items 10 → 11（tag-master 追加・tag-queue 直後） | Reg-N1 | covered |
| `isNavItemActive` の tag-master / tag-queue active 衝突なし（sibling route） | Reg-N2 | covered |
| `SidebarNavItem` の tag-master 描画 + `PATHS["tag-master"]` path 解決 | Reg-N3 | covered |

## 2. カバレッジ基準（既存 coverage-guard 方針）

| 項目 | 基準 | 根拠 |
| --- | --- | --- |
| 一律閾値 | `scripts/coverage-guard.sh` は全 package の statements/branches/functions/lines を **80% 一律**強制（`THRESHOLD=80`） | `scripts/coverage-guard.sh:1-2` |
| 本タスクの判定 group | `--group web`（web workspace の coverage-summary.json で判定） | sync-merge を含まない通常 push 経路 |
| 変更ファイルの狙い | `tags.ts` は純関数中心で **statements/branches 100%** を狙う。component（EditForm/Panel）は jsdom render で **80% 以上**を満たし、到達困難な防御分岐のみ §3 で許容理由を明示 |
| pre-push 挙動 | feature コミット/push では coverage-guard が有効（merge commit を含まない `--changed` 範囲のため skip 条件に該当しない・CLAUDE.md「sync-merge hook 挙動」表） | CLAUDE.md |

> 本タスクは新規ファイル追加を含むため、web package 全体の 80% 閾値を**下げない**ことが最低ライン。新規 component の未カバー行が package 全体平均を 80% 未満に引き下げないよう、§1.2 の主要分岐を確実にカバーする。

## 3. 未カバー許容理由（明示）

| 未カバー候補 | 許容理由 |
| --- | --- |
| `updateTag` の `res.text().catch(() => "")` の catch 側 | fetch body 読み取りが reject するのは実機 stream error のみで focused mock では到達困難。`bodyText=""` 経路は U-T9 の空 body で代表され、`parseTagUpdateErrorCode("")===null` を踏むため実害なし |
| EditForm の `onSuccess?` / `onCancel?` が undefined のとき（optional chaining の false 側） | props 省略は Panel 経由では常に渡されるため実運用で発生しないが、optional 設計上の防御。component 単体テスト（E-T6 で onCancel 提供）で true 側を踏む。false 側は throw しない no-op で害なし |
| `useAdminMutation` の `isLoading` / `abort` / `reset` 由来分岐の一部 | hook 自体は既存実装（本タスク非変更）でテスト済み。mock 化しているため本タスク coverage 対象外（変更関数限定方針） |
| Panel の `useRouter().refresh()` の実 server round-trip | focused test は `router.refresh` 呼び出しと props 差し替えまで（P-T7 注記）。実 D1 反映は Phase 11 authenticated visual / staging で user-gated に担保 |
| icons.tsx の他 nav id の既存 path 分岐 | 本タスクは `tag-master` キー追加のみ。既存キーは非変更で既存テストの担保範囲を維持 |

## 4. coverage 対象外（非変更ファイル・明示）

| ファイル/関数 | 理由 |
| --- | --- |
| `apps/web/app/api/admin/[...path]/route.ts`（catch-all proxy） | 非変更。`PATCH /api/admin/tags/:tagId` は既存転送（新規 proxy 不要・Phase 5 §0） |
| `apps/web/src/features/admin/api/members.ts`（`fetchTagMaster` / `AdminTagRef` / `parseTagErrorCode` / `TagCreateError`） | 非変更（read 再利用・型 re-export のみ）。既存テスト `members.tagCreate.spec.ts` の担保範囲を維持 |
| `apps/web/src/features/admin/hooks/useAdminMutation` | 非変更（mutation 経路は既存・不変条件 #10）。本タスクは mock 化して呼び出すのみ |
| `apps/api/**` | スコープ外（不変条件 #1/#7・apps/api 非接触） |
| `apps/web` の他 admin 画面（members / meetings / schema 等） | 非接触 |

## 5. DoD への寄与

- 変更 API client（`tags.ts`）の line/branch カバレッジ 100% を focused coverage で確認。
- 新規 component（EditForm / Panel）が web package の 80% 一律閾値を割らないことを `coverage-guard.sh --group web` で確認。
- 非変更ファイルは対象外として明示し、全体閾値の上げ下げを目的にしない。
- focused web test 全 PASS（U / E / P / Reg）を Phase 9 DoD #3/#4 と連動して確認。
- focused vitest / typecheck / lint / verify:tokens / verify:no-inline-style は local evidence 取得済み。coverage full regression / staging runtime / commit / push / PR / Issue 状態変更は user-gated。
