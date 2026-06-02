# Workflow: task-c-reflection-timing-visibility-and-sla-doc

> **[実装区分: 実装仕様書 / implementation]** — コード変更（read-only 表示コンポーネント追加 + page 配線 + spec doc 追記）を伴う。
> **[implementation_mode: verify_existing]** — 本タスクの実装は親 workflow `member-publish-recovery-form-ops-and-admin-link` の close-out wave で **既に dev へ landed 済み**（PR #1064 / commit `745c95115`）。本仕様書は landed 実装を**正本として記述**し、Phase 4 = targeted test 設計、Phase 5 = diff 確認へ読み替える。
> コミット・PR・staging deploy・authenticated runtime screenshot 取得はユーザー明示指示まで行わない（CONST_002）。

親ワークフロー `member-publish-recovery-form-ops-and-admin-link` の **Task C** を、Phase 1-13 の単一タスク仕様書として独立化したもの。
責務（単一責務）: 「Google Form 登録から**何分で**反映されるか」「**どこに**反映されるか（公開一覧 / 本人プロフィール）」を、(1) 公開一覧 `/members` と本人マイページ `/profile` の UI 上に**反映タイミングとして可視化**し、(2) `docs/00-getting-started-manual/specs/03-data-fetching.md` に**反映 SLA セクションを追記**して恒久ドキュメント化する。

- 起票元: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/C-reflection-timing-visibility-and-sla-doc.md`
- ブランチ: `docs/task-c-reflection-timing-sla-spec`
- ベースブランチ: `dev`

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| implementation_mode | `verify_existing`（コードは PR #1064 / `745c95115` で landed） |
| workflow_state | `spec_created`（本タスクは Phase 1-13 spec 作成。コードは dev マージ済み・`git diff dev...HEAD` 空） |
| visualEvidence | VISUAL（UI 描画あり） / screenshot は `/profile` 認証必須のため user-gated |
| 正本データソース | 公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt`（API 拡張なし） |
| 不変条件 | #5（D1 直接アクセスは `apps/api` に閉じる）/ #8（`*.spec.{ts,tsx}` のみ）/ OKLch トークン正本（HEX 禁止）/ 親 SCOPE「既存 API のみ接続」 |

---

## 0. P50 事前確認（verify_existing 判定根拠）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| current branch / dev に実装が存在する | **Yes** | `apps/web/src/components/public/ReflectionTimingNote.tsx`（実体 52 行） |
| spec test が存在する | **Yes** | `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`（7 `it`） |
| `/members` 配線済み | **Yes** | `members/page.tsx:17`（import）/ `:102`（配置・MemberFilters 直後） |
| `/profile` 配線済み | **Yes** | `profile/page.tsx:21,30,71,120`（import / getStats / Promise.all / 配置） |
| SLA doc 追記済み | **Yes** | `docs/00-getting-started-manual/specs/03-data-fetching.md:234`「## 反映 SLA」 |
| upstream（dev）マージ済み | **Yes** | commit `745c95115` / PR #1064。`git diff dev...HEAD -- apps/ docs/` 空 |

> **結論**: 全成果物が landed 済み。本仕様書は `implementation_mode: verify_existing` として、landed 実装を current facts で記述する。Phase 4 は既実装をカバーする targeted test の確認、Phase 5 は `git diff` による diff 確認に読み替える。新規実装サイクルは発生しない（CONST_005 は「1 サイクル内完了」を要求するが、本タスクは既に 1 サイクルで完了済み）。

### ソース仕様 → landed 実装の drift（current facts で是正済み）

| 観点 | ソース task C 記述 | landed 実装（current facts） |
|------|------------------|----------------------------|
| root 要素 | `Banner`(tone=info) primitive を使う | 生 `<aside>` + token className（Banner 不使用） |
| 識別子 | `data-region="reflection-timing"` + `data-surface` | `data-testid="reflection-timing-{surface}"` + `aria-label="Google Form 反映タイミング"` |
| profile fetch | `/me` 解決後に getStats を別取得 | `meResult` 解決後、`Promise.all([/me/profile, getStats({revalidate:60})])` |
| getStats codePrefix | `PUBLIC_FETCH` | `PUBLIC_STATS` |
| members 配置 | header 直下 or filters 前後 | `MemberFilters` 直後 |

---

## 1. タスク分解（単一責務）

本タスクは親 workflow Task C の単一責務をそのまま継承する。さらに分割する必要はない（read-only 表示 1 コンポーネント + 2 page 配線 + 1 doc 追記の最小スコープ・CONST_005 準拠）。

| サブ責務 | 成果物 | landed |
|---------|--------|--------|
| 反映タイミング表示コンポーネント | `ReflectionTimingNote.tsx`（surface 別文言 / fallback / JST 整形） | ✅ |
| 公開一覧への配線 | `members/page.tsx`（既存 `statsResult` 流用・新規 fetch 無し） | ✅ |
| 本人マイページへの配線 | `profile/page.tsx`（`getStats()` fail-soft 並列追加） | ✅ |
| 反映 SLA ドキュメント | `03-data-fetching.md`「## 反映 SLA」追記 | ✅ |
| コンポーネント spec | `ReflectionTimingNote.spec.tsx`（7 ケース） | ✅ |

---

## 2. スコープ

詳細は [phase-2.md](phase-2.md)。

- **含む**: read-only 反映タイミング表示の追加（`/members`・`/profile`）、反映 SLA doc 追記、コンポーネント spec。
- **含まない**: 新規 D1 migration、Google Form schema 変更、cron 間隔変更、`apps/api` への変更（§2 結論で API 拡張不要）、新 endpoint 追加。
- **不変条件**: #5（D1 直接アクセス禁止）、#8（`*.spec.{ts,tsx}` のみ）、OKLch トークン正本（HEX 直書き・`bg-[#xxx]`・inline style 禁止）。

## 3. フェーズ設計

Phase 1-3 = 設計書、Phase 4-13 = 既実装の検証〜close-out（verify_existing 読み替え）。

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1.md](phase-1.md) |
| 2 | 設計 | [phase-2.md](phase-2.md) |
| 3 | 設計レビュー | [phase-3.md](phase-3.md) |
| 4 | テスト作成（verify_existing） | [phase-4.md](phase-4.md) |
| 5 | 実装（diff 確認） | [phase-5.md](phase-5.md) |
| 6 | テスト拡充 | [phase-6.md](phase-6.md) |
| 7 | カバレッジ確認 | [phase-7.md](phase-7.md) |
| 8 | リファクタリング | [phase-8.md](phase-8.md) |
| 9 | 品質保証 | [phase-9.md](phase-9.md) |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) |
| 11 | 手動テスト（VISUAL / screenshot user-gated） | [phase-11.md](phase-11.md) |
| 12 | ドキュメント | [phase-12.md](phase-12.md) |
| 13 | PR 作成 | [phase-13.md](phase-13.md) |

---

## 受け入れ条件（AC）サマリー

| ID | 受け入れ条件 | landed |
|----|-------------|--------|
| AC-C1 | `/members` に「最終同期時刻（JST）」と「反映目安」を表示。`responseSyncFinishedAt` null / stats 取得失敗時はフォールバック文言・描画継続 | ✅ |
| AC-C2 | `/profile` に「最終反映時刻（JST）」と「公開状態に関係なく本人の最新データが反映される」旨を表示。stats 失敗時もフォールバック・本体描画継続 | ✅ |
| AC-C3 | `03-data-fetching.md` に「反映 SLA」セクション（時系列テーブル + `/members`・`/profile` の違い + 最悪ケース目安）を追記 | ✅ |
| AC-C4 | 「本人プロフィールは公開状態に関係なく反映 / 公開一覧は公開条件 3 件必須」の差異を **doc と UI の両方**で明示 | ✅ |

---

## 参照ドキュメント

| 参照 | パス | 内容 |
|------|------|------|
| 親 workflow | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` | Task A-D 統合・本タスクの起票元 |
| データ取得仕様 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | 反映 SLA 追記先（landed） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | consent / publish 項目 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計整合 |
