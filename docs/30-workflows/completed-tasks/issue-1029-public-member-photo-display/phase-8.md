# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]**。本 Phase は本実装サイクルで GREEN になった後に行う重複削除・ナビゲーションドリフト除去を記録する。実コードは実装済みで、削減すべき候補を `対象/Before/After/理由` 形式で確定する（[Feedback RT-03]）。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- 前提: Phase 5（実装）・Phase 6（テスト拡充）・Phase 7（カバレッジ確認）が GREEN
- 削除の有無: **本 task は削除なし**（既存ファイルの stub 化・delete は発生しない。理由は §3 に記載）

## 目的

public member photo display の実装サイクル完了後に発生し得る重複（admin `resolvePhotoUrl` と public resolver の bucket 名解決ロジック）とナビゲーションドリフト候補を抽出し、過剰共通化を避けつつ削減判断基準を固定する。本 task は新規追加が主体で削除を伴わないため、Phase 8 は「共通化するか否かの判断テーブル」を成果物とする。

## リファクタリング計画（対象 / Before / After / 理由）

### RT-1: bucket 名解決ロジックの共通化判断

| 項目 | 内容 |
|------|------|
| 対象 | `apps/api/src/routes/admin/members.ts:289-318` の `resolvePhotoUrl`（admin）と Phase 5 で追加する public route 2 箇所（`routes/public/members.ts` / `routes/public/member-profile.ts`）の bucket 名解決 |
| Before | bucket 名 `ubm-hyogo-member-photos-{prod,staging}` の env→bucket 名マッピングが admin route と public route 2 箇所の計 3 箇所に重複する |
| After（採用基準を満たす場合のみ） | `apps/api/src/lib/r2/member-photo-bucket.ts` に `resolveMemberPhotoBucketName(environment: string \| undefined): string` を切り出し、admin・public 双方が import する |
| 理由 | bucket 名規約は単一の真実とすべき値（DRY）。env 名の typo が片方だけ修正される drift を防ぐ |

#### RT-1 採用基準（過剰共通化を避ける判断）

以下を**すべて満たす場合のみ** RT-1 を実施する。1 つでも満たさない場合は共通化しない（重複 3 箇所を許容する）。

- [ ] bucket 名解決のロジックが admin・public 2 route の計 3 箇所で**文字列レベルで同一**である
- [ ] 共通 helper の引数が `environment` 1 個のみで、presign deps（access key 等）を巻き込まない（presign 自体は `presignMemberPhotoGetUrl` が既に共通化済みのため二重共通化しない）
- [ ] 切り出し後、admin route の既存テストが import path 変更のみで GREEN を維持する

> **過剰共通化を避ける指針**: presign 本体（`presignMemberPhotoGetUrl`）は #983 で既に共通化済みのため、Phase 8 で再共通化しない。共通化するのは bucket 名文字列の解決のみに限定する。resolver の組み立て（list は batch・profile は単体）は list/profile で形が異なるため共通化しない。

### RT-2: list resolver と profile resolver の重複判断

| 項目 | 内容 |
|------|------|
| 対象 | `routes/public/members.ts` の `resolvePhotoUrls`（batch・`Map` 返却）と `routes/public/member-profile.ts` の `resolvePhotoUrl`（単体・`string \| undefined` 返却） |
| Before | secret 未設定チェック・presign 呼び出しの fail-soft 分岐が 2 resolver に存在する |
| After | **共通化しない**（重複を許容する） |
| 理由 | batch（N 件・`listMemberPhotosByIds`）と単体（`getMemberPhoto`）で取得 API・返却型・presign 回数が異なる。無理に共通化すると generics と分岐が増え可読性が下がる。fail-soft 分岐の重複は 3 行程度で許容範囲（YAGNI / 過剰共通化回避） |

### RT-3: ナビゲーションドリフト候補

| 項目 | 内容 |
|------|------|
| 対象 | `MemberCard` / `ProfileHero` / `MemberDetail` / `member-detail` adapter の photoUrl 配線 |
| Before | photoUrl が adapter→MemberDetail→ProfileHero の prop pass-through で多段に流れる |
| After | **配線をそのまま維持する**（pass-through の中間 prop を残す） |
| 理由 | 既存の `MemberDetailProps`→`ProfileHeroProps` の prop 受け渡し構造に photoUrl を 1 フィールド足すだけ。Context 化や store 化は over-engineering。既存ナビゲーション構造（route group・page→component）に変更を加えない |

## 実行タスク

- 本実装サイクルで GREEN 確定後、RT-1 採用基準 3 項目を評価し、満たす場合のみ bucket 名 helper を切り出す。
- RT-2 / RT-3 は共通化しない判断を確定し、重複許容の根拠を記録する。
- リファクタリング後に Phase 6 / Phase 7 のテストが全件 GREEN を維持することを確認する。

## 参照資料

- `index.md`（§1 スコープ / §2 AC-6/AC-7）
- `phase-2.md`（§2.3 batch helper / §2.5 route env / §3 責務境界）
- `phase-5.md`（実装本体）/ `phase-7.md`（カバレッジ）
- `apps/api/src/routes/admin/members.ts:289-318`（`resolvePhotoUrl` 先例）
- `apps/api/src/lib/r2/member-photo-presign.ts`（共通化済み presign）
- `apps/web/src/components/public/MemberCard.tsx` / `apps/web/src/components/public/ProfileHero.tsx`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles.md`（過剰共通化回避の指針）

## 成果物

- Phase 8 リファクタリング計画（本ファイル・`対象/Before/After/理由` テーブル 3 件）

## 完了条件

- [ ] RT-1（bucket 名共通化）の採用基準 3 項目が固定され、実施判断が基準で機械的に下せる
- [ ] RT-2（list/profile resolver）を共通化しない判断と根拠が記録されている
- [ ] RT-3（ナビゲーションドリフト）の pass-through 維持判断が記録されている
- [ ] 本 task が削除を伴わないこと（stub 化・delete なし）が明記されている
- [ ] リファクタリング後も Phase 6/7 テストが GREEN を維持する条件が記録されている

## 統合テスト連携

RT-1 を実施した場合、admin route 既存テスト（import path 変更）と Phase 4/6 の public resolver テストが GREEN を維持することで安全性を担保する。Phase 9 の invariant #5 grep gate が共通化後も `apps/web/src` への R2 漏れゼロを再検証する。
