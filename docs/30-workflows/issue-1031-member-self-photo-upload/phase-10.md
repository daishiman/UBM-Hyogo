# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書]**。Phase 9 の全品質 gate PASS を前提として、受入条件（AC-1〜AC-9）の充足を最終判定する。MINOR 指摘（Phase 3 MINOR-1〜4）は Phase 12 未タスク化ルールに従って処理する。blocker が 0 件であることを確認して Phase 11 へ進行可とする。

## AC 充足判定表（issue #1031 受入条件と Phase 1 定義の照合）

| AC ID | 受入条件（Phase 1 定義） | 充足確認方法 | 判定 | 備考 |
|-------|------------------------|-------------|------|------|
| AC-1 | `/(member)/profile` から本人写真の upload/delete ができる | `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx` が存在し、page.tsx に mount されていることを `grep -rn "PhotoUpload" apps/web/app/\(member\)/profile/` で確認。`PhotoUpload.client.component.spec.tsx` の「file 選択→upload 成功」「delete ボタン→削除」テストケースが PASS | — | Phase 4/5 で RED→GREEN 確認済みを記録 |
| AC-2 | API は認証済み member の own profile だけ mutation でき、他 memberId への書き込みを拒否する | `apps/api/src/routes/me/index.ts` に `/me/photo` endpoint が `sessionGuard` 経由で実装されており、path に `:memberId` が含まれないことを確認。`photo.route.spec.ts` の「未認証は 401」「body/query に任意 memberId を混入させても自分の row しか触らない」ケースが PASS | — | Phase 9 QA で確認済みであれば転記 |
| AC-3 | `member_photos` に監査情報（`uploaded_by` + `source`）が残る | `apps/api/src/repository/memberPhotos.ts` の `MemberPhotoRow` に `source: "admin" \| "self"` が追加されていることを確認。audit `member.photo_uploaded` / `member.photo_deleted` の contract test が PASS | — | Phase 4/5 で確認済みを記録 |
| AC-4 | admin-managed photo と member self-upload の優先順位が仕様化されている | `member_photos` の object key が `members/{memberId}/avatar`（単一スロット）であることを確認。`upsertMemberPhoto` が `INSERT OR REPLACE` で last-write-wins 動作し、`source` が最終書き込み主体を記録することを `memberPhotos.source.spec.ts` で検証 | — | Phase 2 §2.4 の設計判断が実装に反映されているかを確認 |
| AC-5 | R2 object key / presign TTL が #983 の `members/{memberId}/avatar` / 300s と互換 | `grep -n "MEMBER_PHOTO_OBJECT_KEY\|MEMBER_PHOTO_PRESIGN_TTL" apps/api/src/routes/me/index.ts` で既存定数の再利用を確認。新規定数を定義していないこと | — | Phase 5 実装で既存定数を import していることを確認 |
| AC-6 | MIME（jpeg/png/webp）・256KB・server 検証 | `photo.route.spec.ts` の「256KB 超で 413」「不正 MIME で 415」テストが PASS。`MEMBER_PHOTO_ALLOWED_MIME` / `MEMBER_PHOTO_MAX_BYTES` を再利用しており新設していないことを `grep` で確認 | — | Phase 4/5/6 で確認済みを記録 |
| AC-7 | upload は `requireRulesConsent` 必須。未同意は 403 | `POST /me/photo` handler に `requireRulesConsent` が適用されていることを確認。`photo.route.spec.ts` の「同意未了で 403 RULES_CONSENT_REQUIRED」ケースが PASS。DELETE には `requireRulesConsent` が不要なことも確認 | — | Phase 4/5 で確認済みを記録 |
| AC-8 | self mutation は `rateLimitSelfRequest`（60s / 5 回）を適用 | POST /DELETE /me/photo handler に `rateLimitSelfRequest` が適用されていることを確認。既存 self-service（visibility-request 等）と同一の middleware chain であることを `grep -n "rateLimitSelfRequest" apps/api/src/routes/me/index.ts` で確認 | — | Phase 5 実装で適用済みを記録 |
| AC-9 | 写真未登録 member の profile 描画は現行と pixel diff ゼロ | Phase 11 の Playwright visual で photoUrl 無し状態のスクリーンショットを取得し、既存 hue placeholder baseline と比較。diff がゼロまたは許容範囲内（Playwright threshold ≤0.05） | — | Phase 11 VISUAL_ON_EXECUTION 依存。runtime 実行まで `pending` |

**判定凡例**: PASS / FAIL / pending（runtime 依存で Phase 11 以降に持ち越し）

---

## MINOR 指摘の処理ルール（unassigned-task-guidelines）

最終レビュー中に発見した指摘事項は以下の基準で処理する。

| 種別 | 基準 | 処理 |
|------|------|------|
| **blocker** | AC 未充足・不変条件違反（D1/R2 への apps/web 直接アクセス・path に memberId 出現・Form 本文編集等）・型安全性の欠損・セキュリティ上の懸念（他 member の photo を書ける等） | 即時修正（Phase 10 内で修正して再判定）。Phase 11 には進めない |
| **MINOR** | 機能に影響しない改善（コメント精度・変数名・error message の表記）・将来の拡張余地 | Phase 12 `unassigned-task-detection` セクションで未タスク化。blocker として扱わない |
| **runtime 依存** | R2 binding 未設定・Cloudflare secret 未投入・staging での presign 実挙動未確認・migration 0023 の remote D1 適用未実施 | **user-gated 残課題**として本 Phase の「runtime 依存残課題」セクションに記録。AC-9（Phase 11 visual）は Phase 11 で評価 |

### Phase 3 MINOR の最終判定（実装後確認）

| MINOR ID | Phase 3 内容 | 実装後状態 | 判定 |
|---------|------------|-----------|------|
| MINOR-1 | `MeRouteEnv` の presign secret キー名が admin route と未確定 | Phase 5 着手時に admin の `resolvePhotoUrl` と同名に揃えたことを確認 | Phase 5 で解消済み（実装時に記録） |
| MINOR-2 | web proxy の multipart 透過方式（formData 再構築 vs stream） | Phase 4 で proxy route の multipart 透過 test を先に書き確定 | Phase 4 で解消済み（実装時に記録） |
| MINOR-3 | パッケージ filter 名 | 2026-06-01 実測で `@ubm-hyogo/api` / `@ubm-hyogo/web` / `@ubm-hyogo/shared` に確定 | 解消済み。`@repo/*` は stale command として使用禁止 |
| MINOR-4 | upload 成功後の UI 反映（router.refresh の二重 fetch） | Phase 11 で体感確認。問題があれば Phase 12 未タスク化 | Phase 11 pending（runtime 依存）|

---

## partial_fix 確認

| 確認項目 | 確認方法 | 結果 |
|---------|---------|------|
| Phase 5 実装で「後回し」とした箇所（FIXME/TODO コメント）が残っていないか | `grep -rn "TODO\|FIXME\|HACK" apps/api/src/routes/me/index.ts apps/api/src/repository/memberPhotos.ts apps/api/migrations/0023_member_photos_source.sql apps/web/app/api/me/photo/route.ts apps/web/src/lib/api/me-photo-client.ts apps/web/app/\(member\)/profile/_components/PhotoUpload.client.tsx` | ヒット 0 件を期待。ヒットがあれば blocker か MINOR かを判断する |
| Phase 6 テスト拡充で「skip」されたテストが残っていないか | `grep -rn "\.skip\|it\.skip\|describe\.skip\|test\.skip" apps/api/src/routes/me/__tests__/photo.route.spec.ts apps/api/src/repository/__tests__/memberPhotos.source.spec.ts apps/web/app/\(member\)/profile/_components/PhotoUpload.client.component.spec.tsx apps/web/app/api/me/photo/route.spec.ts` | ヒット 0 件を期待。ヒットがあればその理由を確認し blocker か MINOR かを判断する |
| migration 0023 が `apps/api/migrations/` に存在するか | `ls apps/api/migrations/ \| grep "0023"` | `0023_member_photos_source.sql` が存在することを確認 |
| `apps/web` からの R2/D1 直接アクセスが無いか（不変条件 #5） | `grep -rn "MEMBER_PHOTOS\|\.put\|\.get\|\.delete\|db\.\|D1\b" apps/web/src/ apps/web/app/` | wrangler binding / D1 直アクセスが apps/web 内にゼロであることを確認 |
| path に `:memberId` が露出していないか（不変条件 #11） | `grep -n "memberId\|:id" apps/api/src/routes/me/index.ts \| grep "me/photo"` | `/me/photo` の path に `:memberId` が含まれないことを確認 |

---

## runtime 依存残課題（user-gated）

以下は **コードの正しさとは独立した runtime ops** であり、実装完了後にユーザーが明示的に承認・実行するまで保留とする。Phase 12 の未タスク化対象には含めず、本セクションに記録する。

| 残課題 ID | 内容 | 実行コマンド / 手順 | ゲート |
|----------|------|-------------------|--------|
| RT-OPS-001 | D1 migration 0023 の staging 環境への適用 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | staging deploy 前に必須 |
| RT-OPS-002 | D1 migration 0023 の production 環境への適用（適用前に backup 必須） | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-before-0023-$(date +%Y%m%d).sql && bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` | production deploy 前に必須 |
| RT-OPS-003 | R2 bucket が #983 staging 分から継続利用可能か確認。未作成の場合は作成 | Cloudflare Dashboard で `ubm-hyogo-member-photos-staging` の存在確認。無ければ `bash scripts/cf.sh` 経由で作成 | staging deploy 前に必須 |
| RT-OPS-004 | R2 presign 用 secret 3 件（`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）が `/me` 向け env にも有効か確認（staging） | `bash scripts/cf.sh whoami` で認証確認後、staging deploy して `/me/profile` レスポンスに `photoUrl` が現れるかチェック | staging deploy 後の動作確認 |
| RT-OPS-005 | staging deploy（api） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | Phase 11 手動テスト前に必須 |
| RT-OPS-006 | staging deploy（web） | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | Phase 11 手動テスト前に必須 |
| RT-OPS-007 | staging での `POST /me/photo` 実挙動確認（authenticated member session で upload→avatar 反映） | Phase 11 チェックリスト Task B を実施 | Phase 11 user-gated |

> `bash scripts/cf.sh` ラッパー経由でのみ実行すること（CLAUDE.md 「Cloudflare 系 CLI 実行ルール」）。`wrangler` 直接呼び出し禁止。

---

## ブロッカー判定サマリ

| 区分 | 件数 | 備考 |
|------|------|------|
| blocker（AC 未充足・不変条件違反） | — | Phase 10 実施時に記入 |
| MINOR（Phase 12 未タスク化） | — | Phase 10 実施時に記入（MINOR-4 含む） |
| runtime 依存残課題（user-gated） | 7 件 | RT-OPS-001..007（上表） |

**Phase 11 進行条件**: blocker 件数が **0** であること。runtime 依存残課題は Phase 11 user-gated のため進行を妨げない。

---

## 完了条件（Phase 10）

- [ ] AC-1〜AC-9 の全判定が記録されており、FAIL が 0 件（または `pending` は全て Phase 11 runtime 依存として記録済み）
- [ ] `TODO`/`FIXME`/`.skip` の grep gate が実行済みで blocker 件数が 0
- [ ] migration `0023_member_photos_source.sql` の存在確認済み
- [ ] apps/web からの R2/D1 直アクセス grep gate PASS
- [ ] path に `:memberId` 露出なし grep gate PASS
- [ ] Phase 3 MINOR-1〜3 が Phase 4/5 で解消済み（実装時に記録）・MINOR-4 が Phase 12 未タスク化候補として記録されている
- [ ] runtime 依存残課題（RT-OPS-001..007）が本 Phase に記録されており user-gated として明示されている
- [ ] blocker 0 件が確認されており Phase 11 進行可の判定が明記されている

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
AC-1〜AC-9 と blocker/MINOR/runtime gate の状態を最終判定する。

## 実行タスク
- AC 充足表を埋める。
- blocker 0 件を確認する。
- Phase 3 MINOR の実装後解消状態を記録する。

## 参照資料
- `phase-9.md`
- `phase-3.md`（MINOR-1〜4）

## 成果物
- Phase 10 最終レビュー

## 統合テスト連携
Phase 11 は本 Phase の blocker 0 件判定を前提に実行する。
