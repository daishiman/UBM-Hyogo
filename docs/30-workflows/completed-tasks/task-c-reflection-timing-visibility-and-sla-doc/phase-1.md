# Phase 1: 要件定義

> 設計書フェーズ。`implementation_mode: verify_existing`（landed at PR #1064 / `745c95115`）。本 Phase は要件・inventory・タスク分類を固定し、landed 実装を current facts で記述する。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 1 |
| 名称 | 要件定義 |
| 種別 | 設計書 |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | なし（起点 Phase） |

## 目的

反映タイミング可視化 + 反映 SLA doc タスクの背景・問題・タスク分類・受け入れ基準（AC-C1〜C4）・inventory を固定し、landed 済み実装を current facts として正本記述する。

## 実行タスク

- 背景と問題（反映遅延の不可視によるサポート問い合わせ）を整理する（§1）。
- タスク分類（UI task / VISUAL / verify_existing）を記録する（§2）。
- 反映の時系列（cron `*/15` + ISR 30 秒）を確定事実として固定する（§3）。
- 受け入れ基準 AC-C1〜C4 を定義する（§4）。
- inventory（5 ファイル・canonical 命名）を固定し landed 状態を確認する（§5）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`

## 成果物

- 本 Phase 1 要件定義記述（背景 / タスク分類 / 反映時系列 / AC-C1〜C4 / inventory）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. 背景と問題

会員・来訪者・管理者が「Google Form 送信後どれくらいで一覧 / マイページに反映されるか」を毎回問い合わせずに自力で把握できない。反映には複数の遅延段（cron 同期待ち + ISR キャッシュ）が積み重なるため、サポート問い合わせと誤解（「壊れている / 反映されない」）が発生する。

これを (a) UI 上に最終同期時刻と反映目安を表示し、(b) 仕様書に SLA を明文化することで解消する。

## 2. タスク分類（[Feedback 1] 記録）

| 分類項目 | 値 |
|---------|-----|
| タスク種別 | **UI task**（read-only 表示コンポーネントを追加） + docs 追記 |
| VISUAL / NON_VISUAL | **VISUAL**（`/members`・`/profile` に視認可能な UI を描画） |
| screenshot | `/members` は公開で取得可だが、`/profile` は認証必須 → runtime screenshot は **user-gated**（Phase 11 で deferred 宣言） |
| implementation_mode | **verify_existing**（landed・`git diff dev...HEAD` 空） |
| 命名規則 | コンポーネント = PascalCase（`ReflectionTimingNote`）、ファイル = PascalCase.tsx、spec = `*.spec.tsx`（kebab/Pascal は既存 public component に一致） |

## 3. 反映の時系列（確定事実・本タスクの根拠）

```text
[1] フォーム送信
  -> [2] response sync cron `*/15 * * * *`（最大約15分待ち）
        apps/api/wrangler.toml crons, apps/api/src/index.ts（cron 分岐で runResponseSync()）
  -> [3] runResponseSync() が D1 へ upsert（member_responses / identity / consent snapshot）
  -> [4] auto-publish 判定（MEMBERS_AUTO_PUBLISH_ON_CONSENT が true のとき member_only→public 昇格）
  -> [5] Web ISR revalidate（/members は 30 秒、export const revalidate = 30）
  -> [6] 表示
```

- 一般的（`*/15` 同期）: 送信 → 最大約 **15 分 + 30 秒** で `/members` 反映。
- 最悪ケース（互換経路の毎時 scheduled sync `0 * * * *` 待ち運用時）: 約 **15〜45 分**。
- 本人マイページ `/profile` は ISR キャッシュ無し（`force-dynamic` / `revalidate=0`、`cache:"no-store"`）のため律速は **cron sync 完了のみ**（ステップ[5]を経由しない）。

## 4. 受け入れ基準（AC）

| ID | 受け入れ条件 |
|----|-------------|
| AC-C1 | `/members`（公開一覧）に「最終同期時刻（JST）」と「反映目安（送信後最大約 15 分 + キャッシュ最大 30 秒）」が表示される。最終同期時刻は既存 `GET /public/stats` の `lastSync.responseSyncFinishedAt`（API 拡張なし）。`null`（未同期）／取得失敗時はフォールバック文言を表示し、`/members` 全体は描画を止めない。 |
| AC-C2 | `/profile`（本人マイページ）に「最終反映時刻（JST）」と「**公開状態に関係なく本人の最新データが反映される**」旨が表示される。`GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用。取得失敗時はフォールバック文言・profile 本体描画継続。 |
| AC-C3 | `docs/00-getting-started-manual/specs/03-data-fetching.md` に「反映 SLA」セクションが追記され、(a) 反映の時系列テーブル、(b) `/members`（公開条件 3 件必須・ISR 30 秒）と `/profile`（公開状態に関係なく反映・キャッシュ無し）の違い、(c) 最悪ケースのレイテンシ目安が明文化される。 |
| AC-C4 | 「本人プロフィールは公開状態に関係なく反映 / 公開一覧は公開条件（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）を満たす場合のみ反映」という差異が、**doc（03-data-fetching.md）と UI（`/members` と `/profile` の表示文言）の両方**で明示される。 |

## 5. inventory（変更対象ファイル一覧・canonical 命名固定）

| ファイル | 変更種別 | landed | 内容 |
|---------|---------|--------|------|
| `apps/web/src/components/public/ReflectionTimingNote.tsx` | 新規 | ✅ | 反映タイミング表示の read-only Server Component。生 `<aside>` + token className で構成（新規 primitive を生やさない）。 |
| `apps/web/app/(public)/members/page.tsx` | 編集 | ✅ | 取得済み `statsResult.data.lastSync` を `ReflectionTimingNote`（surface=members）へ渡し `MemberFilters` 直後に配置。 |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | ✅ | `getStats({revalidate:60})` を `/me/profile` と `Promise.all` で並列 fetch（fail-soft）。`ReflectionTimingNote`（surface=profile）を `PublicConsentCallout` 後に配置。 |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | 編集 | ✅ | 「## 反映 SLA」セクション追記（末尾「## 事故を防ぐルール」の直前）。 |
| `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx` | 新規 | ✅ | コンポーネント分岐（surface 別文言 / null・取得失敗フォールバック / JST / maxDelayMinutes 上書き / data-testid）を検証（`*.spec.tsx` のみ・不変条件 #8）。 |

> 上記以外は変更しない。D1 schema / API endpoint / Google Form 仕様 / cron 間隔は不変。`apps/api` への変更は **発生しない**。

## 6. carry-over 確認

直近コミット（`git log --oneline -5`）の `745c95115 feat(member-publish-recovery): Google Form 反映運用 + Admin Link 導線を dev へ統合 (#1064)` が本タスクの実装本体を含む。本タスクで新規作業（再実装）は不要で、landed 実装の正本記述と回帰確認に集中する。

## 7. 参照（aiworkflow-requirements / specs）

| 参照資料 | パス | 内容 |
|---------|------|------|
| データ取得仕様 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | 反映 SLA 追記先（landed） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | consent / publish 項目 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計整合 |

## 完了条件

- [x] 背景・問題・タスク分類（UI task / VISUAL / verify_existing）を記録した。
- [x] AC-C1〜C4 を固定した。
- [x] inventory（5 ファイル・canonical 命名）を固定し、landed 状態を current facts で確認した。
- [x] ソース仕様 → landed 実装の drift を index.md に記録した。
