---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 11
name: 手動テスト / スクリーンショット計画
status: implemented_local_runtime_pending
visual_category: VISUAL
updated: 2026-06-09
---

# Phase 11 — 手動テスト / スクリーンショット計画（member-data-source-precedence-and-profile-session-fix）

> **分類宣言**: 本ワークフローは `taskType=implementation` / `visualEvidence=VISUAL`（Lane D admin 編集 UI を含む）/
> `workflow_state=implemented_local_runtime_pending`（実装は user-gated・未実施）。
> したがって **実スクリーンショット（PNG）は本サイクルで 0 枚**。Phase 11 capture metadata は全 entry を
> `status: "pending_runtime_visual"` とし、実機操作・実撮影は **user gate 後に user-gated** で行う。
> screenshots/ ディレクトリには実 PNG は置かず、ディレクトリ保持用 `.gitkeep` のみを置く。本ファイルには **capture 計画のみ** を記述する
> （`status=pending` は phase12-compliance の Phase 11 evidence existence 検査の対象外）。

---

## 0. Phase 1 分類の再掲（[Feedback 3] 対応）

| Lane | 区分 | 主証跡 |
|------|------|--------|
| A: データモデル基盤 | NON_VISUAL | focused vitest（repository / migration 検証 SELECT） |
| B: 取込是正 | NON_VISUAL | focused vitest（mapper / sync contract） |
| C: 表示プレシデンス + admin override 書込 API | NON_VISUAL | focused vitest（純関数 branch 100% / route contract） |
| D: Web UI（admin field editor + 公開/会員表示確認） | **VISUAL** | focused vitest（component）+ Playwright screenshot（計画・pending） |
| E: /profile セッションエラー修正 | NON_VISUAL | focused vitest（session-guard 分類 / web 分岐） |

> 主証跡は **自動テスト（`*.spec.ts`）**。VISUAL の Lane D のみ、自動テストに加えて screenshot を補助証跡として計画する。

---

## 1. 自動テスト主証跡（NON_VISUAL backend 全 Lane + Lane D component）

Phase 1 §8 の targeted vitest リストを主証跡とする。**implemented_local_runtime_pending のため未実行**（user gate 後に RED→GREEN で実行・件数は計画値）。

### API（`cd apps/api`）

| # | spec ファイル（新規/編集） | 検証内容 | 計画ケース数 |
|---|---------------------------|----------|-------------|
| 1 | `src/repository/memberFieldOverrides.spec.ts`（新規） | upsert / list(by id, by ids) / delete・value_json=null クリア | 6 |
| 2 | `src/repository/identities.spec.ts`（編集） | `getSeedProvenance` / `markSeedImported`（seed_source IS NULL のみ書く＝import-once 根拠） | 4 |
| 3 | `src/jobs/mappers/sheets-to-members.spec.ts`（編集） | DB_FIELD_MAP 実ヘッダー一致（unmapped 0）/ CONSENT_MAP 実値 / zone・status 値正規化 / `MemberResponse` 互換 shape | 8 |
| 4 | `src/jobs/sync-sheets-to-d1.spec.ts`（編集） | 既存 identity → skip（import-once）/ 未登録 → identity+response+fields+consent+provenance を書く / 存在しない列 INSERT が無いこと | 6 |
| 5 | `src/jobs/sync-forms-responses.spec.ts`（編集） | 新規 identity 作成時のみ `markSeedImported("forms")` / 既存への再回答は従来通り snapshot 更新（import-once でブロックしない） | 5 |
| 6 | `src/use-cases/_shared/field-precedence.spec.ts`（新規） | `resolveFieldValue` / `mergeFieldProjection` / `toOverrideMap`（**branch 100%**: override 有/無 × response 有/無 × null クリア × override-only key） | 10 |
| 7 | `src/use-cases/public/list-public-members.spec.ts`（編集） | SUMMARY_KEYS projection に override マージ・外形 shape 不変 | 4 |
| 8 | `src/use-cases/public/get-public-member-profile.spec.ts`（編集） | detail fields に override マージ・公開フィルタ不変 | 4 |
| 9 | `src/repository/_shared/builder.spec.ts`（編集） | `buildMemberProfile` / `buildAdminMemberDetailView` の fields に override マージ | 4 |
| 10 | `src/routes/admin/member-fields.contract.spec.ts`（新規） | `GET`（effective/override/response 値返却）/ `PUT`（upsert 200 / identity 無 404 / value=null クリア / audit append） | 8 |
| 11 | `src/routes/me/index.contract.spec.ts`（編集） | `/me` が session 通過時 200・DB lookup 無し / 404 と「会員未登録」分離 | 4 |
| 12 | `src/middleware/session-guard.spec.ts`（編集） | member 不在=401（既存維持）/ DB 例外は 500 で漏らさず分類（握り潰さない） | 5 |

### packages（`cd packages/integrations/google`）

| # | spec ファイル | 検証内容 | 計画ケース数 |
|---|--------------|----------|-------------|
| 13 | `src/forms/mapper.spec.ts`（編集） | `X（Twitter）URL`→`urlX` / `その他のSNS・URL`→`urlOthers`（slug fallback 解消）・残り 29 ラベル不変 | 3 |

### web（`cd apps/web`、`--root ../..` 必須）

| # | spec ファイル | 検証内容 | 計画ケース数 |
|---|--------------|----------|-------------|
| 14 | `src/components/admin/MemberFieldEditor.spec.tsx`（新規） | `FormField` 経由レンダ / dirty 判定 / `useAdminMutation` PUT / `value=null`（同期値に戻す）/ `effectiveValue` prop 変更で internal state 再同期 | 6 |
| 15 | `app/(member)/profile/page.tsx` 関連 spec（編集） | エラー分岐: `MEMBER_SESSION_404`→会員案内 / `MEMBER_SESSION_FAILED`→接続案内 / default(500)→汎用 | 4 |

> 合計計画ケース数 ≈ 81（user gate 後に確定）。test suffix は `*.spec.ts(x)` のみ（不変条件 #6）。

### 計画検証コマンド（user gate 後・implemented_local_runtime_pending では未実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
cd apps/api && mise exec -- pnpm vitest run \
  src/repository/memberFieldOverrides.spec.ts src/repository/identities.spec.ts \
  src/jobs/mappers/sheets-to-members.spec.ts src/jobs/sync-sheets-to-d1.spec.ts \
  src/jobs/sync-forms-responses.spec.ts src/use-cases/_shared/field-precedence.spec.ts \
  src/use-cases/public/list-public-members.spec.ts src/use-cases/public/get-public-member-profile.spec.ts \
  src/repository/_shared/builder.spec.ts src/routes/admin/member-fields.contract.spec.ts \
  src/routes/me/index.contract.spec.ts src/middleware/session-guard.spec.ts
cd packages/integrations/google && mise exec -- pnpm vitest run src/forms/mapper.spec.ts
cd apps/web && mise exec -- pnpm vitest run app/\(member\)/profile src/components/admin/MemberFieldEditor.spec.tsx --root ../..
# Lane D design tokens: HEX 直書き 0 を grep gate で確認
```

---

## 2. VISUAL screenshot 計画（Lane D・user-gated）

> 実 PNG は **本サイクルで生成しない**（implemented_local_runtime_pending）。実装完了後、staging deploy + admin/会員ログイン（bearer mint）を
> 前提に **user-gated** で Playwright もしくは手動撮影する。canonical 命名は `<component>-<state>.png`。

### 3 層評価計画（Semantic / Visual / AI-UX）

| 層 | 観点 | 計画する確認内容 |
|----|------|-----------------|
| **Semantic（意味・構造）** | override の意味 | admin field editor で編集した値が「確定編集（L1）」として保存され、`source=override` で表示されること。`role` / `label`（`FormField`）が正しいこと |
| | merged projection の構造 | 公開一覧/詳細/profile が override>response の merged 値を表示し、レスポンス外形 shape は不変であること |
| **Visual（視覚）** | OKLch トークン整合 | admin editor / 公開表示が `var(--ubm-color-*)` のみを使い HEX 直書き 0（`verify-design-tokens` gate 準拠） |
| | レイアウト崩れなし | field editor の `FormField` 群が既存 admin 詳細レイアウトに収まり崩れないこと |
| **AI-UX（操作体感）** | 編集→確定の体感 | admin が値を上書き→保存→「同期で消えない」体感。「同期値に戻す」（value=null）で元に戻せること |
| | /profile エラー体感 | 会員未登録ユーザー（管理者等）が /profile で「会員専用案内」へ倒れ、汎用「時間をおいて」で詰まらないこと |

### capture 対象画面と canonical 名（計画・status=pending_runtime_visual）

| # | route | 対象 component | canonical screenshot 名（計画） | state |
|---|-------|----------------|---------------------------------|-------|
| 1 | `/(admin)/admin/members/[id]` | `MemberFieldEditor.tsx` | `member-field-editor-edit.png` | admin がプロフィールフィールド（例: fullName / ubmZone）を編集中、dirty 状態 |
| 2 | `/(admin)/admin/members/[id]` | `MemberFieldEditor.tsx` | `member-field-editor-saved.png` | override 保存後、`source=override` で effective 値が反映された状態 |
| 3 | `/(public)/members` | 公開一覧カード | `public-members-list-merged.png` | override 済み会員が一覧に override 値で表示され、外形レイアウト不変 |
| 4 | `/(public)/members/[id]` | 公開詳細 | `public-member-detail-merged.png` | 詳細が override>response の merged 値を表示 |
| 5 | `/profile` | profile page | `profile-merged-self-view.png` | 本人ログインで自分の merged プロフィールが表示 |
| 6 | `/profile` | profile page（エラー分岐） | `profile-unregistered-guidance.png` | 会員未登録ユーザーに「会員専用ページ」案内＋公開導線（汎用エラーで詰まらない） |

> 上記 6 PNG は **計画値**。実体はuser-gated 撮影。`status=pending_runtime_visual` のため
> phase12-compliance の Phase 11 evidence existence 検査では `Status=pending` 扱いとし存在検査対象外。

---

## 3. 実機操作の前提（user-gated・本サイクル未実施）

- staging deploy（`apps/api` / `apps/web`）— user-gated（Phase 13）。
- D1 migration `0027_member_field_overrides.sql` の apply — user-gated（`bash scripts/cf.sh d1 migrations apply`）。
- admin / 会員ログイン（bearer mint）— user-gated。
- staging `/me` のログイン状態 status 実測（RC-3 真因 H-2 transport / H-3 DB 例外の切り分け）— Lane E 実機ログとして Gate-B 時に user-gated。

> いずれも本ワークフロー（implemented_local_runtime_pending）では実施しない。Phase 13 の user 承認後に行う。
