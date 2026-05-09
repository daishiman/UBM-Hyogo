# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |
| 区分 | 実装仕様書 |

## 目的

task-specification-creator skill の **6 必須タスク** を実行し、最低 7 ファイルを実体生成する。Phase 11 までで確定した実装契約・runtime evidence・残課題をシステム正本仕様 / aiworkflow-requirements / 未タスク検出に反映する。canonical path / placeholder token / dirty-code / §99 content gate を機械的に確認する。

## 実行タスク

- [ ] Task 12-1〜12-6 の 6 必須出力を canonical path に生成
- [ ] placeholder token grep 0 件 gate を pass
- [ ] dirty-code gate（TODO / FIXME / XXX の本 task 起因件数）を pass
- [ ] §99 content gate（章節抜け / 空セクション / 仮置き文言禁止）を pass
- [ ] canonical path 監査（`outputs/artifacts.json` と root `artifacts.json` の `cmp -s` 一致）
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/`（references / indexes）

## 成果物（最低 7 ファイル）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（Task 12-1）
- `outputs/phase-12/system-spec-update-summary.md`（Task 12-2）
- `outputs/phase-12/documentation-changelog.md`（Task 12-3）
- `outputs/phase-12/unassigned-task-detection.md`（Task 12-4）
- `outputs/phase-12/skill-feedback-report.md`（Task 12-5）
- `outputs/phase-12/phase12-task-spec-compliance-check.md`（Task 12-6）

## 統合テスト連携

- `apps/web/playwright/tests/public-detail-register-legal.spec.ts` は task-18（regression）の対象 spec として継続。本 Phase で `aiworkflow-requirements` に「公開 4 画面の DOM アンカー（`data-page` / `data-component` / `data-stable-key`）」を index 化する候補を Task 12-4 / 12-5 で扱う。
- staging-smoke-checklist.md（task-05 正本）の 4 routes（`/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）と本 task の Playwright spec が責務を重複していないかを Task 12-6 で確認する。

---

## Task 12-1: 実装ガイド作成（中学生 + 技術者）

出力: `outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベル（概念説明）

> ホームページには「メンバー紹介ページ」「入会のお知らせページ」「プライバシーポリシーのページ」「利用規約のページ」がある。
> このタスクでは、その 4 つのページを、デザインの色やボタンが揃ったルール（OKLch トークン）にぴったり合わせて作り直す。
>
> メンバー紹介は、サーバーから「あの人の自己紹介データ」をもらってきて、項目ごとに表に並べる。
> 入会のお知らせページは、Google フォーム（みんなが入会するときに書くアンケート）のリンクボタンを大きく置く。中身を直接書き換えるんじゃなくて「このボタンを押すと Google フォームに飛ぶよ」という案内のページ。
> プライバシーポリシーと利用規約は、ただの読み物ページなので、文字の見出しや段落をきれいに並べるレイアウトだけ整える。
>
> 大事なのは「色は HEX（#1a2b3c みたいな書き方）で書かない」「メンバー詳細の項目は『安定キー』というラベルを必ず付ける」「個人情報のデータベース（D1）には web 側から直接さわらない、必ず API 経由」というルールを守ること。

### Part 2: 技術者レベル（実装ポイント）

- **App Router Server Component**: 4 画面とも Server Component。`/members/[id]` と `/register` のみ API fetch を行い、`fetchPublicOrNotFound` / `fetchPublic`（`apps/web/src/lib/fetch/public.ts`）経由で zod strict parse する。
- **revalidate 設計**: `/members/[id]` は 60s、`/register` は 600s。法務 2 画面は完全静的（フルプリレンダー）。
- **404 経路**: `fetchPublicOrNotFound` が `FetchPublicNotFoundError` を throw した場合のみ `notFound()`。それ以外は再 throw して `error.tsx`（task-05）で boundary させる。
- **不変条件 #1（stableKey）**: `MemberDetailSections` の全 KV row に `data-stable-key={field.stableKey}` を付与。直接プロパティ参照禁止。
- **不変条件 #2（consent キー）**: `RegisterCallout` の文言は `publicConsent` / `rulesConsent` のみ。Google Form 内で同意取得する設計のため、本画面に編集 UI を置かない。
- **不変条件 #5 / #7（Google Form 経路）**: register CTA は `<a target="_blank" rel="noopener noreferrer">` の外部 link 遷移。iframe 埋め込み・サーバ redirect は採用しない。
- **fallback CTA**: `responderUrl` が null または preview 取得失敗時は `FALLBACK_RESPONDER_URL` を CTA に焼く。fallback パスは unit test で固定する。
- **OKLch tokens**: 色は `apps/web/src/styles/tokens.css`（task-09）と `docs/00-getting-started-manual/specs/design-tokens.md`（task-08）が正本。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止。task-18 の regression gate と整合。
- **下流アンカー**: `data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role` を DOM に焼き、task-18 / task-11 / 後続 a11y 監査で参照可能にする。
- **a11y**: 詳細ページは `<h1>` 1 個 / 法務 2 画面の見出し階層は単調増加（h1→h2 で skip しない）/ Avatar は decorative + 隣接 visible 名 / `<a target="_blank">` には `rel="noopener noreferrer"` 必須。

---

## Task 12-2: システム仕様書更新

出力: `outputs/phase-12/system-spec-update-summary.md`

### 更新対象

- `docs/00-getting-started-manual/specs/09-ui-ux.md`
  - 「公開層 4 画面（member detail / register / privacy / terms）」節を追加し、ProfileHero / MemberDetailSections / RegisterCallout / LegalProse の primitive 構成と DOM アンカー（`data-page` / `data-component` / `data-stable-key`）を記載
  - 法務 2 画面の typography（`prose` token）を統一する旨を明記
  - 既存節への追記で吸収できる場合は新節を作らない（Step 1-A）
- `docs/00-getting-started-manual/specs/01-api-schema.md`
  - `GET /public/members/:memberId` / `GET /public/form-preview` の consumer 側挙動（404→`notFound()` / fallback responderUrl）を「Consumer 契約」節として補記（既存 endpoint surface には触れない、Step 1-B）
- `.claude/skills/aiworkflow-requirements/references/`
  - 公開 4 画面の DOM アンカーを `references/ui-anchors.md`（既存があれば追記、無ければ Task 12-4 へ繋ぐ候補として記録）
- `docs/00-getting-started-manual/specs/00-overview.md`
  - 05-screens-public 進捗（task-11 / task-12）を Step 1-C で更新候補として記録

### Step 1-A/B/C ルール

- 1-A: 本 task で確定した契約のみ反映
- 1-B: 既存 endpoint surface の変更は行わない（consumer 契約の補記のみ）
- 1-C: 未確定事項 / aiworkflow-requirements 側 index の新規作成判断は Task 12-4 へ繋ぐ

---

## Task 12-3: ドキュメント更新履歴

出力: `outputs/phase-12/documentation-changelog.md`

更新行（canonical absolute path 列挙）:

- `apps/web/app/(public)/members/[id]/page.tsx`（mod）
- `apps/web/app/(public)/register/page.tsx`（mod）
- `apps/web/app/privacy/page.tsx`（mod）
- `apps/web/app/terms/page.tsx`（mod）
- `apps/web/src/components/public/ProfileHero.tsx`（new / mod）
- `apps/web/src/components/public/MemberDetailSections.tsx`（new）
- `apps/web/src/components/public/MemberTags.tsx`（new）
- `apps/web/src/components/public/MemberLinks.tsx`（new）
- `apps/web/src/components/public/MemberActivity.tsx`（new）
- `apps/web/src/components/public/RegisterCallout.tsx`（new）
- `apps/web/src/components/public/FormPreviewSections.tsx`（mod）
- `apps/web/src/components/legal/LegalProse.tsx`（new）
- `apps/web/src/components/public/MemberDetailSections.test.tsx`（new）
- `apps/web/src/components/public/MemberLinks.test.tsx`（new）
- `apps/web/src/components/public/MemberTags.test.tsx`（new）
- `apps/web/src/components/public/RegisterCallout.test.tsx`（new）
- `apps/web/src/components/public/FormPreviewSections.test.tsx`（mod / new）
- `apps/web/src/components/legal/LegalProse.test.tsx`（new）
- `apps/web/playwright/tests/public-detail-register-legal.spec.ts`（new）
- `docs/30-workflows/task-12-member-detail-register-legal/**`（new spec set）
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（mod / 公開 4 画面の primitive 構成節）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（mod / consumer 契約節）
- `.claude/skills/task-specification-creator/SKILL.md` / `LOGS.md`（必要時）
- `.claude/skills/aiworkflow-requirements/LOGS.md`（必要時）

---

## Task 12-4: 未タスク検出レポート

出力: `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）

### 検出対象（4 セクション必須: 苦戦箇所 / リスクと対策 / 検証方法 / スコープ）

1. **法務文面の最終法務確認**
   - 苦戦箇所: 本 task はレイアウトのみで暫定文面。最終文面は法務担当の確認が必要
   - リスクと対策: 法的リスクあり。次サイクルで法務確認 task を起票
   - 検証方法: 法務担当承認 + 公開差し替え PR
   - スコープ: 別 task（task-legal-review-final として追加候補）

2. **`/(public)/members/[id]` の Activity timeline schema 確定**
   - 苦戦箇所: 一次原典 §3.1.4 で `section.key === "activity"` を timeline 描画とするが、API の `activity` section schema が未確定で、本 task では存在時のみ描画する no-op 実装
   - リスクと対策: schema 確定後に再実装が必要。`apps/api` 側で activity section を追加する task と本 task の差分が衝突する可能性
   - 検証方法: API schema 確定後に Playwright spec で timeline 描画を追加検証
   - スコープ: 別 task（task-activity-section-schema として追加候補、apps/api 側）

3. **公開 4 画面の DOM アンカー index 化（aiworkflow-requirements）**
   - 苦戦箇所: `data-page` / `data-component` / `data-stable-key` が複数 task で焼かれるが正本 index が未整備
   - リスクと対策: 後続 task（task-13..17）でアンカー命名衝突の可能性
   - 検証方法: `aiworkflow-requirements/references/ui-anchors.md` を新規作成し、task-11 / task-12 のアンカーを集約
   - スコープ: 本 task 内 Task 12-2 で着手判断 / 別 task（task-skill-ui-anchors-index）として起票候補

4. **register CTA の click 計測**
   - 苦戦箇所: 外部 link 遷移のため click 後の挙動はクライアント計測のみ可能。task-04 logger 経由での計測が必要
   - リスクと対策: 計測欠落で入会導線の効果測定が不可能
   - 検証方法: `@/lib/logger` 経由の `register.cta.click` event 起動 + Sentry / dashboard で受信確認
   - スコープ: 別 task（task-register-cta-telemetry）として起票候補

5. **検出 0 件の場合**
   - 上記いずれにも該当せず空欄になる場合も、本ファイルは「検出 0 件」と明記して出力する（出力必須）

---

## Task 12-5: スキルフィードバック

出力: `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）

### 3 観点固定

1. **テンプレ改善（task-specification-creator）**
   - 観点: 公開層 UI task（4 画面同時進行）でも phase-1〜13 テンプレが破綻していないか
   - 既存テンプレで自己完結コンテキスト（§0.1〜§0.9）が十分機能したか / 不足があれば項目追加提案

2. **ワークフロー改善（ui-prototype-alignment-mvp-recovery）**
   - 観点: task-08 / task-09 / task-10 → task-12 → task-18 の DAG 接続点で stale data がないか
   - task-11（公開トップ・一覧）と task-12（公開詳細・register・法務）の責務分離が画面単位で機能しているか
   - staging-smoke-checklist.md（task-05 正本）と本 task の Playwright spec の責務重複の有無

3. **ドキュメント改善（aiworkflow-requirements）**
   - 観点: 公開 4 画面の DOM アンカー（`data-page` / `data-component` / `data-stable-key`）を `aiworkflow-requirements/references/` に index 化すべきか
   - `09-ui-ux.md` の primitive 構成節を `aiworkflow-requirements` 側からも参照できるように `topic-map` / `keywords.json` 更新提案

---

## Task 12-6: タスク仕様書コンプライアンスチェック

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`

### 機械的確認項目

- Phase 1〜11 の outputs / artifacts.json / index.md / 13 phase ファイルの実体存在
- evidence canonical path の規約整合（Phase 11 §evidence canonical path 表との 1:1 一致）
- `outputs/artifacts.json` と root `artifacts.json` の `cmp -s` 一致
- placeholder token grep 0 件（`TODO_FILL_ME` / `<!-- placeholder -->` / `XXX_TBD` 等）
- dirty-code gate（本 task 起因の `TODO` / `FIXME` / `XXX` 件数。0 が望ましく、残す場合は Task 12-4 で起票）
- §99 content gate: 章節抜け / 空セクション / 「仮置き」「TBD」の文言禁止
- AC 13 項目（index.md 正本）と Phase 11 evidence の対応関係が canonical path で確認可能
- runtime evidence が user-gated に揃っているか / 未取得時は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` で false-green を作っていないか

### FAIL 時の挙動

FAIL 項目があれば本 task の Phase 11 まで戻し、`outputs/phase-12/main.md` の status を `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 維持で close-out する（合算 PASS 表記禁止）。

---

## state 据え置き規律

- `artifacts.json.metadata.workflow_state` を Phase 12 close-out で書き換えない
- runtime 未取得なら `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を維持
- 完了は Phase 11 の 4 画面 + 404 page smoke 実測 + axe critical=0 + grep gate 0 件 + stable-key audit PASS 揃い時のみ

## 完了条件

- [ ] 6 必須出力ファイル（最低 7 ファイル含む）すべて canonical path に生成
- [ ] `outputs/artifacts.json` が存在し、root `artifacts.json` と `cmp -s` で一致
- [ ] 各 evidence path が canonical 規約と整合
- [ ] placeholder token grep 0 件 / dirty-code gate / §99 content gate すべて pass
- [ ] `phase12-task-spec-compliance-check.md` が AC 13 項目と Phase 11 evidence の 1:1 対応を機械的に検証
- [ ] runtime evidence が user-gated 規律で false-green を作っていない
