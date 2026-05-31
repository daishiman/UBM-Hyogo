# Phase 12: ドキュメント更新

> **[実装区分: 実装仕様書]**

> **本 Phase は実装サイクル（Phase 4-11）完了後に更新済み。**
> `outputs/phase-12/` は local implementation close-out と user-gated runtime boundary を記録する。

---

## Phase 12 必須 6 成果物（strict 7）と作成方針

実装サイクル完了後に `outputs/phase-12/` 配下に以下 7 ファイルを作成する。

```
outputs/phase-12/
  main.md                            # 変更サマリ（必須）
  implementation-guide.md            # Part1 + Part2 実装ガイド（必須）
  system-spec-update-summary.md      # Step 1-A〜1-C + Step 2 判定（必須）
  documentation-changelog.md         # ドキュメント変更履歴（必須）
  unassigned-task-detection.md       # 未タスク検出結果（必須・0 件でも出力）
  skill-feedback-report.md           # skill フィードバック（必須）
  phase12-task-spec-compliance-check.md  # Phase 12 コンプライアンスチェック（必須）
```

---

## 12.1 `main.md` — 変更サマリ骨子

```md
## 変更サマリ（issue-983-member-photo-avatar-r2-storage）

### storage / API layer（Task A）
- D1 migration `0022_member_photos.sql` を追加（admin-managed。Google Form 表不変）
- R2 bucket binding `MEMBER_PHOTOS`（staging/production wrangler.toml に追加）
- `apps/api/src/lib/r2/member-photo-presign.ts`（aws4fetch 依存、TTL 300s presigned GET URL）
- `POST/DELETE /admin/members/:memberId/photo` endpoint 追加（MIME/サイズ検証 + audit）
- `GET /admin/members/:memberId` を拡張（photoUrl? fail-soft 同梱）
- `AdminMemberDetailViewZ.photoUrl?: string` 追加（.strict() 維持）

### web / UI layer（Task B）
- `Avatar` primitive に `src?` + `<img>` + `onError` fallback 追加
- `MemberAvatar` に `photoUrl?` prop 追加（photo > hue 二段 render）
- `MemberDrawer` に upload / delete affordance 追加（useAdminMutation 経由）
```

---

## 12.2 `implementation-guide.md` — 実装ガイド詳細指示

### Part 1（中学生レベルの概念説明）の必須要素

以下の比喩・説明を含めること。

**なぜ必要か**:
> 会の管理画面でメンバー一覧や詳細を見るとき、顔写真があると「誰が誰か」すぐわかる。
> でも Google アンケートには写真を貼る欄がないため、別の仕組みが必要になった。

**何をするか（日常の例え）**:
> 学校のロッカーに顔写真シールを貼るイメージ。
> 「ロッカー番号（memberId）」に対して「顔写真（R2 に保存したファイル）」を紐付ける。
> 写真を見せるときは「30分だけ有効な特別通行証（presigned URL）」を発行し、
> それが期限切れになると自動的に見えなくなる。管理者しか写真をアップロードできない。

**今回作ったもの（中学生向けテーブル）**:

| 日本語 | 英語 | 役割 |
|--------|------|------|
| 写真メタデータ表 | `member_photos` (D1) | 写真の保管場所・サイズ・誰が登録したかを記録 |
| 写真バイナリ保管庫 | R2 `MEMBER_PHOTOS` | 実際のファイルを保管 |
| 期限付き閲覧URLを作る関数 | `presignMemberPhotoGetUrl` | 30 分だけ有効な URL を生成 |
| 写真アップロード/削除 API | `POST/DELETE /admin/members/:id/photo` | 管理者だけが呼べる登録・削除口 |
| 顔写真 → 失敗時は色アイコン | `Avatar` の `src` + `onError` | 写真があれば表示、ダメなら色アイコンに切り替え |
| ドロワー内 upload ボタン | MemberDrawer affordance | 管理画面の drawer から写真を変更・削除 |

### Part 2（技術者向け詳細）の必須要素

**型定義**:

```ts
// packages/shared/src/zod/viewmodel.ts
export const AdminMemberDetailViewZ = z.object({
  identityMemberId: z.string().min(1),
  // ... 既存フィールド ...
  photoUrl: z.string().url().optional(), // ← 追加。.strict() は維持
}).strict();

// packages/shared/src/types/viewmodel/index.ts
export interface AdminMemberDetailView {
  // ... 既存フィールド ...
  readonly photoUrl?: string; // ← 追加
}

// apps/api/src/lib/r2/member-photo-presign.ts
export interface PresignDeps {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}
export const MEMBER_PHOTO_OBJECT_KEY = (memberId: string) => `members/${memberId}/avatar`;
export const MEMBER_PHOTO_MAX_BYTES = 256 * 1024;          // 256KB
export const MEMBER_PHOTO_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

// apps/api/src/repository/memberPhotos.ts
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}
```

**APIシグネチャ（endpoint 3 系統）**:

```ts
// POST /admin/members/:memberId/photo
// multipart/form-data file (image/*, ≤256KB)
// → 200 { ok: true } / 413 / 415 / 404
// 副作用: R2 put + upsertMemberPhoto + audit("admin.member.photo_uploaded")

// DELETE /admin/members/:memberId/photo
// → 200 { ok: true } / 404
// 副作用: R2 delete + deleteMemberPhoto + audit("admin.member.photo_deleted")

// GET /admin/members/:memberId  (既存拡張・fail-soft)
// → 200 AdminMemberDetailView (photoUrl? は photo row 有かつ presign 成功時のみ)
```

**エラーハンドリング**:

| Error | 処理 |
|-------|------|
| `MEMBER_PHOTOS` binding 未設定 | presign が null を返す → photoUrl を省略して 200 を維持（fail-soft）|
| `R2_*` secret 未設定 | `presignMemberPhotoGetUrl` が null を返す → fail-soft |
| `<img>` onError（TTL 切れ等） | `setFailed(true)` → hue placeholder へ恒久 fallback |
| upload 中の重複 POST | 上書き保存（PUT）で対応。旧 R2 object は削除不要（key 固定）|
| 256KB 超過 | HTTP 413 を返す。UI は「ファイルサイズが大きすぎます（上限 256KB）」を表示 |
| 不正 MIME | HTTP 415 を返す。UI は「jpg / png / webp のみ対応しています」を表示 |

**定数一覧**:

| 定数名 | 値 | 定義場所 |
|--------|-----|---------|
| `MEMBER_PHOTO_OBJECT_KEY` | `members/{memberId}/avatar` | `member-photo-presign.ts` |
| `MEMBER_PHOTO_MAX_BYTES` | `262144`（256KB） | `member-photo-presign.ts` |
| `MEMBER_PHOTO_ALLOWED_MIME` | `["image/jpeg","image/png","image/webp"]` | `member-photo-presign.ts` |
| presign TTL | `300`（秒） | route handler 呼び出し時の引数 |
| R2 bucket（staging）| `ubm-hyogo-member-photos-staging` | wrangler.toml / Phase 13 runbook |
| R2 bucket（production）| `ubm-hyogo-member-photos-prod` | wrangler.toml / Phase 13 runbook |

**セキュリティ・運用上の禁止事項**:

- `apps/web` から R2/D1 に直接アクセスしない（invariant #5）
- upload endpoint は `requireAdmin` ミドルウェア必須
- presigned URL は response body にのみ含め、ログに出力しない
- `.dev.vars.example` に `R2_SECRET_ACCESS_KEY` の実値を書かない（`op://` 参照のみ）
- screenshot evidence に Cookie / Authorization ヘッダ / presigned URL の全文を含めない

**テスト構成**:

| Layer | Command / File |
|-------|----------------|
| presign unit | `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` |
| route contract | `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` |
| avatar render | `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` |
| Playwright visual | `apps/web/tests/e2e/admin-member-photo-avatar.spec.ts` |

---

## 12.3 `system-spec-update-summary.md` — Step 判定方針

### Step 1-A: タスク完了記録
- workflow root、artifact inventory、quick-reference、resource-map、active workflow ledger、changelog/logs を同波で更新すること。

### Step 1-B: 実装ステータス
- `implemented_local_evidence_captured`（Phase 11 screenshots 含む）が局所完了の目標。
- staging deploy / runtime ops は `staging_runtime_pending_user_approval` として分離。

### Step 1-C: 関連タスク差分確認欄（必須記入）

| 関連項目 | 最終確認日 | ステータス |
|---------|-----------|---------|
| 親 workflow `admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign` | 要確認 | completed-tasks に移動済み |
| Issue #983 | 再確認済み | CLOSED（2026-05-29T09:03:39Z）。Issue mutation はユーザー指示後のみ |
| hue avatar 既存コード（`MemberAvatar.tsx`, `Avatar.tsx`）| 要確認 | fallback として温存・非破壊 |

### Step 2: 新規インターフェース / API spec 更新（必須）

**判定: 要更新**

以下 2 点の更新が必須。

1. **`AdminMemberDetailView` interface** に `photoUrl?` 追加（新規 field）
   - `packages/shared/src/zod/viewmodel.ts` の `AdminMemberDetailViewZ`
   - `packages/shared/src/types/viewmodel/index.ts` の interface
2. **storage contract を spec 文書に明文化**
   - `docs/00-getting-started-manual/specs/08-free-database.md` へ R2 `MEMBER_PHOTOS` bucket の用途・制約を追記
   - **または** 新規 `docs/00-getting-started-manual/specs/15-member-photo-storage.md` を作成
   - 記載必須項目: R2 bucket 名（staging/prod）/ object key パターン / presign TTL / 上限 256KB / 許可 MIME / public list 禁止の根拠

> `08-free-database.md` への追記か新規 `15-member-photo-storage.md` かは、既存ファイルの分量を見て実装時に決定する。
> いずれの場合も AC-1 充足のため Phase 12 完了前に doc を commit に含めること。

---

## 12.4 `unassigned-task-detection.md` — 未タスク検出（3 件候補）

> **0 件でも出力必須。** 本 workflow では以下 3 件を候補として明記する。

### 候補 1: member 自己 photo upload（self-upload）

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 1 スコープ外定義（「含まない」セクション） |
| 概要 | 一般 member が自分の写真を upload できるようにする UX |
| 除外理由 | 認証境界・本人確認 UX が別スコープ。MVP は admin 代行で価値充足 |
| タスク化判定 | **未タスク候補（将来 followup）** — 実装サイクル後に Issue 起票を検討 |
| 依存 | 本 workflow の Task A（upload endpoint）が前提 |

### 候補 2: public member directory での photo 表示

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 1 スコープ外定義 |
| 概要 | `/(public)/members/[id]` で photo を表示する |
| 除外理由 | publishState / 公開合意ポリシー / presigned URL の public 配布設計が別関心 |
| タスク化判定 | **未タスク候補（将来 followup）** |
| 依存 | publish_state と photo 公開合意の仕様が確定してから |

### 候補 3: 画像 transcode / resize

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 1 スコープ外定義 |
| 概要 | 大きな画像を R2 保存前にリサイズ / WebP 変換する |
| 除外理由 | R2 静的保存で MVP 充足。Cloudflare Images 移行は別判断 |
| タスク化判定 | **未タスク候補（将来 followup）** |
| 依存 | photo 機能の利用動向を見てから判断 |

### 検証手順（実装サイクル後 2 回実施）

```bash
# 1回目: TODO/FIXME/skip 検索
grep -rn "TODO\|FIXME\|skip\|xit\|xtest\|xdescribe" \
  apps/api/src/lib/r2/ \
  apps/api/src/routes/admin/members.ts \
  apps/web/src/components/ui/Avatar.tsx \
  apps/web/src/features/admin/components/_members/ \
  --include="*.ts" --include="*.tsx"

# 2回目: 関連 OPEN Issue 確認
gh issue list --label "area:admin-ui,area:web" --state open --json number,title
```

---

## 12.5 `skill-feedback-report.md` — フィードバック指示

実装サイクル完了後に以下を記録する。

- presign TTL contract（aws4fetch の `signQuery: true` 実挙動）で発見した知見を `lessons-learned-issue-983-...md` に L-I983-001〜として追記。
- `Avatar` の `onError` fallback と pixel diff ゼロ要件（AC-4）の達成方法を lessons に含める。
- fail-soft（presign null 時の photoUrl 省略 vs 500 回避）パターンを汎化 lesson として記録。
- `task-specification-creator/references/patterns-lessons.md` 末尾に「R2 presign + fail-soft + admin upload パターン」節として汎化する。

---

## 12.6 `phase12-task-spec-compliance-check.md` — コンプライアンスチェック指示

実装サイクル完了後に以下の canonical 9 heading 逐語で記述する（他の heading に変形しない）。

```
1. Summary verdict
2. Changed-files classification
3. workflow_state and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict
```

**事前判定（spec 段階の期待値）**:

| 観点 | 期待 |
|------|------|
| workflow_state | `implemented_local_evidence_captured`（Phase 11 screenshots 含む。staging runtime は `pending_user_approval`） |
| Phase 11 evidence | 6 screenshots + main.md + manual-test-result.md 等が `present` |
| Phase 12 strict 7 | 7 ファイル全 `present` |
| aiworkflow same-wave sync | resource-map / quick-reference / task-workflow-active / inventory / changelog / logs / lessons 同波更新済み |
| system spec update | `docs/.../specs/08-free-database.md` または `specs/15-member-photo-storage.md` に storage contract 追記済み |
| shared interface | `AdminMemberDetailViewZ.photoUrl?` / `AdminMemberDetailView.photoUrl?` 追加済み |
| runtime user-gated | staging deploy / bucket 作成 / secret 投入 は `pending_user_approval` として分離 |

---

## 完了条件（Phase 12）

- [ ] `outputs/phase-12/` に strict 7 ファイルが全件存在する
- [ ] `implementation-guide.md` に Part 1（中学生例え話）と Part 2（型/API/エラー/定数）が含まれる
- [ ] `system-spec-update-summary.md` の Step 2 で `AdminMemberDetailView.photoUrl?` と storage contract spec が「更新済み」と記録されている
- [ ] `unassigned-task-detection.md` に 3 件の未タスク候補と 2 回検証結果が記録されている
- [ ] `storage contract` が `specs/08-free-database.md` または `specs/15-member-photo-storage.md` に追記されている（AC-1 充足）
- [ ] aiworkflow-requirements の同波 sync（resource-map / quick-reference / task-workflow-active / inventory / changelog / logs）が完了している
- [ ] Phase 12 コンプライアンスチェックが canonical 9 heading で記述されている

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装仕様書としての strict 7、system spec sync、skill feedback、compliance を物理成果物にする。

## 実行タスク
- `outputs/phase-12/` の strict 7 を作成する。
- aiworkflow-requirements との同期状態を記録する。

## 参照資料
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物
- Phase 12 strict 7 files
