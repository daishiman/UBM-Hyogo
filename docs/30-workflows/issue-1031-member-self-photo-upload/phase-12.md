# Phase 12: ドキュメント更新

> **[実装区分: 実装仕様書]**

> **本 Phase は実装サイクル（Phase 4-11）完了後に `outputs/phase-12/` を物理作成する。**
> 本ファイル（phase-12.md）は「実装実行時にこれらを作る」手順を記述した仕様書であり、
> 実装サイクル未完了の時点では `outputs/phase-12/` の成果物を「実装完了証跡」として扱わない。

> **2026-06-01 close-out 補正**: 本 workflow は `implemented_local_runtime_pending` の状態で strict 7 を物理配置済み。
> これらは local implementation close-out evidence として扱う。staging deploy / remote D1 apply / authenticated runtime screenshot はユーザー承認後の外部 gate。

---

## Phase 12 必須 6 成果物（strict 7）と作成方針

実装サイクル完了後に `outputs/phase-12/` 配下に以下 7 ファイルを作成する。

```
outputs/phase-12/
  main.md                                # 変更サマリ（必須）
  implementation-guide.md                # Part1（中学生向け）+ Part2（技術者向け）実装ガイド（必須）
  system-spec-update-summary.md          # Step 1-A〜1-C + Step 2 判定（必須）
  documentation-changelog.md            # ドキュメント変更履歴（必須）
  unassigned-task-detection.md           # 未タスク検出結果（必須・0 件でも出力）
  skill-feedback-report.md               # skill フィードバック（必須）
  phase12-task-spec-compliance-check.md  # Phase 12 コンプライアンスチェック（必須）
```

---

## 12.1 `main.md` — 変更サマリ骨子

以下の構成で記述すること。

```md
## 変更サマリ（issue-1031-member-self-photo-upload）

### storage / API layer（Task A）
- D1 migration `0023_member_photos_source.sql` を追加（additive。`source TEXT NOT NULL DEFAULT 'admin'`）
- `memberPhotos.ts` repository 拡張（`MemberPhotoRow.source` / `upsertMemberPhoto` に `source` 引数）
- `admin/members.ts` の upsert 呼び出しに `source: "admin"` を明示（既存挙動維持）
- `POST /me/photo`（sessionGuard + requireRulesConsent + rateLimitSelfRequest + multipart→R2 put + source:'self' + audit）
- `DELETE /me/photo`（sessionGuard + own photo only + R2 delete + audit）
- `GET /me/profile` 拡張（presigned `photoUrl?` を fail-soft で同梱）
- `MeProfileResponseZ.photoUrl?: z.string().url().optional()` 追加
- `MePhotoUploadAcceptedZ` 追加

### web / UI layer（Task B）
- `/api/me/photo/route.ts` proxy（multipart POST / DELETE を API Worker へ転送）
- `me-photo-client.ts`（uploadOwnPhoto / deleteOwnPhoto + PhotoRequestError）
- `PhotoUpload.client.tsx`（Avatar 表示 + file input + 状態機械 + a11y + delete confirm Modal）
- `profile/page.tsx` に PhotoUpload を mount。`me-types.ts` に `photoUrl?` 追加
```

---

## 12.2 `implementation-guide.md` — 実装ガイド詳細指示

### Part 1（中学生レベルの概念説明）の必須要素

以下の方向性・例え話・要素を含めること。

**なぜ必要か**:
> 自分のプロフィール写真を自分で貼り替えられるようにするため。
> 今まではスタッフ（admin）に「写真を更新してください」とお願いしなければならなかった。
> このタスクで、会員自身が自分の profile ページから写真を直接アップロード・削除できるようになる。

**何をするか（日常の例え）**:
> 学校の学生証の写真を「自分でスマホで撮って更新できる窓口」を新設するイメージ。
> 今まで写真の更新は「事務室に申し込んで事務員さんに撮り直してもらう」形（admin 代行）だったが、
> これからは「自分で撮った写真を提出ボックスに入れると即座に反映される」仕組みになる。
> ただし写真の「場所（R2 の棚）」は一人につき1枚分しか無く、新しい写真を入れると古い写真は上書きされる（last-write-wins）。
> 写真を見せるときは「30分だけ有効な特別通行証（presigned URL）」を発行し、期限が来ると自動的に見えなくなる安全設計になっている。
> スタッフ（admin）が更新しても、自分で更新しても、常に「最後に更新した人の写真」が表示される（どちらが偉いという優先順位はない）。
> どちらが最後に更新したかは `source` 列（'admin' または 'self'）に記録されるので、後から確認できる。

**今回作ったもの（中学生向けテーブル）**:

| 日本語 | 英語 | 役割 |
|--------|------|------|
| 写真の提出者記録列 | `member_photos.source` | 'admin' か 'self' かを記録（誰が更新したかを追跡） |
| 会員向け写真アップロード API | `POST /me/photo` | 自分の写真だけ登録・更新できる入口 |
| 会員向け写真削除 API | `DELETE /me/photo` | 自分の写真だけ削除できる入口 |
| profile ページ写真表示 | `GET /me/profile` の `photoUrl?` | 自分の写真の一時閲覧 URL をもらってくる仕組み |
| Web の写真 proxy | `/api/me/photo/route.ts` | ブラウザから API に写真を橋渡し |
| Web の写真操作 UI | `PhotoUpload.client.tsx` | 写真の表示・選択・アップロード・削除ボタン |

### Part 2（技術者向け詳細）の必須要素

**型定義**:

以下の型を含めること。

```ts
// apps/api/src/repository/memberPhotos.ts（拡張後）
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly source: "admin" | "self";   // ← 0023 additive 追加
  readonly uploadedAt: string;
}

// apps/api/src/routes/me/schemas.ts（拡張後）
export const MeProfileResponseZ = z.object({
  profile: MemberProfileZ,
  // 既存フィールド ...
  photoUrl: z.string().url().optional(),   // ← 追加（top-level、strict 維持）
}).strict();

export const MePhotoUploadAcceptedZ = z.object({ ok: z.literal(true) }).strict();
export type MePhotoUploadAccepted = z.infer<typeof MePhotoUploadAcceptedZ>;

// apps/web/src/lib/api/me-photo-client.ts
export type PhotoErrorCode =
  | "UNSUPPORTED_MEDIA_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE"
  | "RULES_CONSENT_REQUIRED" | "RATE_LIMITED" | "UNAUTHENTICATED"
  | "INVALID_REQUEST" | "NOT_FOUND" | "UNKNOWN";

export class PhotoRequestError extends Error { status: number; code: PhotoErrorCode; }

export async function uploadOwnPhoto(file: File): Promise<void>;
export async function deleteOwnPhoto(): Promise<void>;
```

**API シグネチャ（endpoint 3 系統）**:

```ts
// POST /me/photo
// middleware: sessionGuard → requireRulesConsent → rateLimitSelfRequest
// multipart/form-data file (image/jpeg|png|webp, ≤256KB)
// → 200 { ok: true } / 400 / 401 / 403 / 413 / 415 / 429 / 503
// 副作用: R2 put（members/{memberId}/avatar）+ upsertMemberPhoto(source:'self') + audit("member.photo_uploaded")

// DELETE /me/photo
// middleware: sessionGuard → rateLimitSelfRequest
// → 200 { ok: true } / 401 / 404
// 副作用: R2 delete + deleteMemberPhoto + audit("member.photo_deleted")

// GET /me/profile（既存拡張・fail-soft）
// → 200 MeProfileResponse（photoUrl? は photo row 有かつ presign 成功時のみ）
```

**エラーハンドリング（実装ガイドに記載すること）**:

| Error | 処理 |
|-------|------|
| `rulesConsent` 未同意 | 403 `RULES_CONSENT_REQUIRED`（upload のみ。delete は不要） |
| rate limit 超過 | 429（60s / 5 回。既存 `rateLimitSelfRequest` を再利用） |
| MIME 不許可 | 415。UI は「jpg / png / webp のみ対応しています」を表示 |
| 256KB 超過 | 413。UI は「ファイルサイズが大きすぎます（上限 256KB）」を表示 |
| `MEMBER_PHOTOS` binding 未設定 | presign が null を返す → photoUrl を省略して 200 を維持（fail-soft） |
| `<img>` onError（TTL 切れ等） | hue placeholder へ恒久 fallback（Avatar の既存挙動を再利用） |
| upload 中の重複 POST | 上書き保存（`INSERT OR REPLACE`）で対応。object key は固定スロット |
| photo 行無しで DELETE | 404 を返す。R2 delete は試みない |

**定数一覧（既存再利用。新設しないことを明記）**:

| 定数名 | 値 | 定義場所（再利用元） |
|--------|-----|---------|
| `MEMBER_PHOTO_OBJECT_KEY` | `members/{memberId}/avatar` | `member-photo-presign.ts`（#983 で確立） |
| `MEMBER_PHOTO_MAX_BYTES` | `262144`（256KB） | 同上 |
| `MEMBER_PHOTO_ALLOWED_MIME` | `["image/jpeg","image/png","image/webp"]` | 同上 |
| presign TTL | `300`（秒）| `member-photo-presign.ts` の既存引数デフォルト |

**セキュリティ・運用上の禁止事項**:

- `apps/web` から R2/D1 に直接アクセスしない（invariant #5）
- `/me/photo` は path に `:memberId` を含めない（invariant #11）。対象は `session.user.memberId` のみ
- upload endpoint は `requireRulesConsent` + `sessionGuard` 必須
- presigned URL は response body にのみ含め、ログに出力しない
- `.dev.vars.example` に `R2_SECRET_ACCESS_KEY` の実値を書かない（`op://` 参照のみ）
- screenshot evidence に Cookie / Authorization ヘッダ / presigned URL の全文を含めない
- `PhotoUpload.client.tsx` で client-side 事前チェック（MIME/size）は UX のみ。最終判定は必ず server 側で実施

**テスト構成**:

| Layer | Command / File |
|-------|----------------|
| API route contract | `apps/api/src/routes/me/__tests__/photo.route.spec.ts` |
| repository source roundtrip | `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts` |
| PhotoUpload component | `apps/web/app/(member)/profile/_components/PhotoUpload.client.component.spec.tsx` |
| proxy route | `apps/web/app/api/me/photo/route.spec.ts` |
| Playwright visual | `apps/web/tests/e2e/member-profile-photo-upload.spec.ts` |

---

## 12.3 `system-spec-update-summary.md` — Step 判定方針

以下の構成で記述すること。

### Step 1-A: タスク完了記録
- workflow root、artifact inventory、quick-reference、resource-map、active workflow ledger、changelog/logs を同波で更新すること。

### Step 1-B: 実装ステータス
- `implemented_local_runtime_pending`（Phase 11 component screenshot 含む）が局所完了の目標。
- staging deploy / runtime ops は `staging_runtime_pending_user_approval` として分離。

### Step 1-C: 関連タスク差分確認欄（必須記入）

| 関連項目 | 最終確認日 | ステータス |
|---------|-----------|---------|
| 親 workflow `issue-983-member-photo-avatar-r2-storage` | 要確認 | completed-tasks に移動済み（または `docs/30-workflows/` 直下。実装時に確認） |
| Issue #1031 | 再確認済み | **CLOSED 実状態・mutation なし**（本 workflow では Issue state を変更しない） |
| Issue #983（admin photo 基盤） | 参照のみ | CLOSED。本 workflow の依存基盤として参照 |
| migration 0022（admin photo）| 確認済み | 0023 additive のため 0022 は non-breaking |

### Step 2: 新規インターフェース / API spec 更新（必須）

**判定: 要更新**

以下の更新が必須。実装サイクル完了後に「更新済み」に変更すること。

1. **`MeProfileResponseZ` / `MeProfileResponse`** に `photoUrl?` 追加
   - `apps/api/src/routes/me/schemas.ts` の `MeProfileResponseZ`
   - `apps/web/src/lib/api/me-types.ts` の `MeProfileResponse` interface
2. **新規 endpoint を spec 文書に明文化**
   - `docs/00-getting-started-manual/specs/01-api-schema.md` または `02-auth.md` に `/me/photo` endpoint（POST/DELETE）を追記
   - 記載必須項目: 認証方式（sessionGuard + rulesConsent + rateLimit）/ R2 object key / source 値域 / audit action 名
3. **`member_photos.source` 列を DB spec に反映**
   - `docs/00-getting-started-manual/specs/08-free-database.md` の `member_photos` テーブル定義に `source TEXT NOT NULL DEFAULT 'admin'` を追記
4. **aiworkflow-requirements の仕様への反映項目（同波 sync 必須）**
   - api spec（`/me/photo` endpoint contract・`MeProfileResponseZ.photoUrl?`）
   - database spec（`member_photos.source` 列・migration 0023）
   - security spec（`requireRulesConsent` + `rateLimitSelfRequest` の self-mutation への適用・direct self-write の invariant #4 整合）

---

## 12.4 `unassigned-task-detection.md` — 未タスク検出

> **0 件でも出力必須。** 本 workflow では以下の候補を明記すること。

### 候補 1: public member directory での photo 表示（followup-002）

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 1 / index.md スコープ外定義（親 #983 followup-002 と共通） |
| 概要 | `/(public)/members/[id]` で member の写真を表示する |
| 除外理由 | publishState / 公開合意ポリシー / presigned URL の public 配布設計が別関心 |
| タスク化判定 | **未タスク候補（将来 followup-002）** — public 表示ポリシーが確定後に Issue 起票を検討 |
| 依存 | 本 workflow（self-upload）と親 #983（admin upload）が両方完了した後 |

### 候補 2: 画像 transcode / resize / variant pipeline（issue-1030 連携）

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 1 / index.md スコープ外定義 |
| 概要 | 大きな画像を R2 保存前にリサイズ / WebP 変換する（issue-1030 variant pipeline と連携） |
| 除外理由 | issue-1030 が別 spec として存在。R2 静的保存で MVP 充足 |
| タスク化判定 | **未タスク候補（issue-1030 / followup-003）** |
| 依存 | issue-1030 の実装状況と photo 機能の利用動向を見て判断 |

### 候補 3: MINOR-4（upload 成功後の router.refresh 二重 fetch）

| 項目 | 内容 |
|------|------|
| 発見元 | Phase 3 MINOR-4 |
| 概要 | upload 成功後の `router.refresh()` が二重 fetch を引き起こす可能性 |
| 除外理由 | 機能には影響しない。Phase 11 で体感確認する MINOR |
| タスク化判定 | Phase 11 で問題が確認された場合のみ未タスク化する（問題なければ MINOR-0 として記録） |
| 依存 | Phase 11 の体感確認結果 |

### 検証手順（実装サイクル後 2 回実施）

```bash
# 1回目: TODO/FIXME/skip 検索
grep -rn "TODO\|FIXME\|skip\|xit\|xtest\|xdescribe" \
  apps/api/src/routes/me/index.ts \
  apps/api/src/repository/memberPhotos.ts \
  apps/web/app/api/me/photo/route.ts \
  apps/web/src/lib/api/me-photo-client.ts \
  apps/web/app/\(member\)/profile/_components/PhotoUpload.client.tsx \
  --include="*.ts" --include="*.tsx"

# 2回目: 関連 OPEN Issue 確認
gh issue list --label "area:member-ui,area:web,area:api" --state open --json number,title
```

---

## 12.5 `skill-feedback-report.md` — フィードバック指示

実装サイクル完了後に以下を記録すること。

- self-upload / direct self-write パターン（invariant #4 との整合証明・own-only mutation の実装）で発見した知見を `lessons-learned-issue-1031-...md` に L-I1031-001〜として追記。
- `requireRulesConsent` + `rateLimitSelfRequest` の self-mutation への適用パターンを汎化 lesson として記録。
- multipart proxy（formData 転送方式の選択）で発見した知見を lessons に含める。
- last-write-wins / single avatar slot の設計選択とその根拠（orphan 回避・MVP 充足）を lessons に含める。
- `task-specification-creator/references/patterns-lessons.md` 末尾に「member self-service direct write（photo upload）」節として汎化する（invariant #4 写像・source 列パターン・own-only mutation guard を含む）。
- aiworkflow-requirements の resource-map / quick-reference / task-workflow-active / inventory / changelog / logs / lessons-learned を同波で更新すること。

---

## 12.6 `phase12-task-spec-compliance-check.md` — コンプライアンスチェック指示

実装サイクル完了後に以下の **canonical 9 heading 逐語**で記述すること（他の heading に変形しない・番号付きでも text は逐語一致必須）。

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
| workflow_state | `implemented_local_runtime_pending`（Phase 11 component screenshot 含む。staging runtime は `staging_runtime_pending_user_approval`） |
| Phase 11 evidence | component-isolation screenshot + harness + visual-verification が `present`（`| Classification | Path | Status |` テーブルで列挙。status = `present` / `pending` / `n/a`） |
| Phase 12 strict 7 | 7 ファイル全 `present` |
| aiworkflow same-wave sync | resource-map / quick-reference / task-workflow-active / inventory / changelog / logs / lessons 同波更新済み |
| system spec update | `specs/01-api-schema.md` または `02-auth.md` に `/me/photo` endpoint 追記・`specs/08-free-database.md` に `member_photos.source` 追記が「更新済み」 |
| schema update | `MeProfileResponseZ.photoUrl?` / `MeProfileResponse.photoUrl?` 追加済み |
| runtime user-gated | staging deploy / D1 migration 0023 apply / R2 bucket 確認 / secret 確認 は `staging_runtime_pending_user_approval` として分離 |
| Issue #1031 | **CLOSED 実状態・mutation なし**（Phase 12 完了後も close しない。user-gated） |

> **重要**: Phase 11 evidence inventory の `| Classification | Path | Status |` テーブルは列名を英語固定とし、status は `present` / `pending` / `n/a` の正規値のみ使用すること（`present_component_harness` 等のカスタム値は FAIL）。`present` 行は物理ファイルの存在確認が必須。

---

## 完了条件（Phase 12）

- [ ] `outputs/phase-12/` に strict 7 ファイルが全件存在する
- [ ] `implementation-guide.md` に Part 1（中学生例え話）と Part 2（型/API/エラー/定数/テスト構成）が含まれる
- [ ] `system-spec-update-summary.md` の Step 2 で `MeProfileResponseZ.photoUrl?` / `member_photos.source` / `/me/photo` endpoint が「更新済み」と記録されている
- [ ] `unassigned-task-detection.md` に 3 件の候補（followup-002 / issue-1030 / MINOR-4）と 2 回検証結果が記録されている
- [ ] `specs/08-free-database.md` の `member_photos` テーブル定義に `source` 列が追記されている
- [ ] `specs/01-api-schema.md` または `specs/02-auth.md` に `/me/photo` endpoint が追記されている
- [ ] aiworkflow-requirements の同波 sync（resource-map / quick-reference / task-workflow-active / inventory / changelog / logs）が完了している
- [ ] Phase 12 コンプライアンスチェックが canonical 9 heading 逐語で記述されている
- [ ] Issue #1031 が **CLOSED 実状態**であることが `system-spec-update-summary.md` Step 1-C に記録されている

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装仕様書としての strict 7、system spec sync、skill feedback、compliance を物理成果物にする。

## 実行タスク
- `outputs/phase-12/` の strict 7 を作成する。
- aiworkflow-requirements との同期状態を記録する。
- `/me/photo` endpoint と `member_photos.source` を system spec に反映する。

## 参照資料
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `phase-11.md`（evidence 確認）

## 成果物
- Phase 12 strict 7 files
