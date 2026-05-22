# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

Phase 2 の設計を不変条件・上流契約・戦略軸・問題解決軸でレビューし、blocking 級の指摘がないことと、残課題が既存 task（task-15 / task-18）に正しく振り分けられていることを確認する。CONST_007（先送り禁止）に従い、本 task で完結すべき項目を「Phase 5 で対応」「別 PR で対応」と書き残さない。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md` §0.5 / §5 / §8
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- CLAUDE.md「重要な不変条件」/「UI prototype alignment / MVP recovery」
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` は本 Phase でレビューした不変条件チェックを runtime で再確認する正本（`data-stable-key` 属性 / `target="_blank" rel="noopener noreferrer"` / 4 画面 200 / 404 page）。

## レビュー観点

### システム系（不変条件 / 既存契約遵守）

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| 既存 API endpoint surface を侵さないか | OK | `/public/members/:memberId` / `/public/form-preview` のみ消費、追加なし |
| D1 直接アクセス禁止（不変条件 #5） | OK | `apps/web` 配下に `D1Database` import を入れない、`fetchPublic` 系経由のみ |
| stableKey 経由でのみ field 参照（不変条件 #1） | OK | `MemberDetailSections` の `data-stable-key` 焼き込みで属性監査可能、KVList で `field.label` / `field.value` のみ参照、stableKey 以外で field を id 化しない |
| consent キーは `publicConsent` / `rulesConsent` のみ（不変条件 #2） | OK | `RegisterCallout` の説明文で 2 キーのみ使用、編集 UI を置かないことで他キー名混入を防ぐ |
| Google Form 再回答が本人更新の正規経路（不変条件 #7） | OK | iframe / サーバ redirect 不採用、外部 `<a target="_blank">` で `responderUrl` に遷移 |
| Workers ランタイム制約 | OK | Server Component の `fetchPublicOrNotFound` は `env.API_SERVICE.fetch` 経由（既存実装）。新規バインディング追加なし |
| 上流 task 契約のみで成立するか | OK | task-08 token / task-09 prose / task-10 ui-primitives + 既存 `fetchPublic` / `PublicMemberProfileZ` / `FormPreviewViewZ` のみ消費 |
| ui-primitives 表面拡張なし（task-10 不変） | OK | `LegalProse` は `apps/web/src/components/legal/` 配下に配置、`@/components/ui` には登録しない |
| Cloudflare 無料枠 revalidate（不変条件 #10） | OK | member-profile=60s / form-preview=600s |
| OKLch token 正本化 | OK | 全色 / radius / spacing / typography は `var(--ubm-*)` 経由、HEX / `bg-[#xxx]` / `text-[#xxx]` 不使用（task-18 走査整合） |

### 戦略・価値系

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| MVP recovery の最小スコープか | OK | 4 画面 + 7 component + 1 primitive + 6 vitest + 1 e2e に閉じる |
| プロトタイプ正本順位（§0.9） | OK | members/[id] は `pages-public.jsx` 由来、register / privacy / terms は派生として §0.9.2 / §0.9.3 で定義 |
| 並列タスクとの衝突リスク | 低 | task-11 は `/` / `/(public)/members`、task-13..17 は別ディレクトリ。`apps/web/src/components/public/` 配下の新規 component 同士のみだが本 task は member-detail / register 専用名で衝突しない |
| task-18 への引き継ぎ明確性 | OK | `data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role` を Phase 2 で列挙、19 routes 走査の selector 正本になる |

### 問題解決系（リスクと緩和策）

| リスク | 緩和策 |
| --- | --- |
| `/public/form-preview` が staging で常時 throw する | `RegisterCallout` を上に据えて `FALLBACK_RESPONDER_URL` で常に CTA 動作させる。`role="alert"` 文言で利用者に通知 |
| seed メンバー id が e2e fixture で不安定 | 既存 `apps/api/migrations` seed の固定 id を Playwright `process.env.SEED_MEMBER_ID` に渡す。新規 seed 命令の追加は本 task 非ゴール |
| primitives 未完成（task-10 並列）で型差異 | task-10 と並列だが本 task は task-10 完了後に着手（DAG 制約）。`Button` / `Badge` 等の VariantProps が変わった場合は Phase 5 着手前に同期確認 |
| Playwright flaky | smoke は HTTP 200/404 + role/text 主体、heavy interaction を避ける。axe scan のみ critical impact filter |
| `data-stable-key` 焼き込み漏れ | `MemberDetailSections.test.tsx` TC-U-02 で全 field の `data-stable-key` 存在を assert（不変条件 #1 ガード） |
| 法務文面の最終法務確認なし | 暫定 OK と Phase 1 で明示。文言の最終確認は本 task 非ゴール、別 task で扱う |
| 外部 link で `noopener` 抜け | RegisterCallout / MemberLinks で `rel="noopener noreferrer"` を必須付与、`MemberLinks.test.tsx` / `RegisterCallout.test.tsx` で属性 assert |
| HEX 直書き混入 | task-18 の grep gate で fail。本 task の vitest / e2e では token 経由のみが描画されることを CSS class 検査で間接確認 |
| `loading.tsx` / `error.tsx` 未配置で空白挙動 | task-05 が先行して `apps/web/app/{loading,error}.tsx` を提供済み。本 task はそれを前提に loading / error UI を独自に持たない |

## 設計判断の追認

- ProfileHero の Avatar は `aria-hidden` + 隣接 visible 名（`<h1>` の fullName）戦略で a11y を満たす（重複読み上げ回避）
- 詳細ページの戻る link は `<a href="/members" data-role="back">` で task-11（一覧）と DOM アンカー互換
- `MemberLinks` / `MemberTags` / `MemberActivity` は 0 件で `null` を返し、empty section / EmptyState を作らない（縦積みノイズ削減）
- `LegalProse` は `<article>` を意味タグとして採用（Outline algorithm 上 main-h1 + 内部 article で問題なし）
- form-preview 失敗時の文言は「フォーム情報を取得できませんでした。登録は下のリンクから進めてください。」を `role="alert"` で出し、CTA は変わらず使える状態を保つ

## 残課題（本 task では未着手・他 task に渡す）

| 項目 | 引き受け先 |
| --- | --- |
| HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 走査 gate（CI） | task-18 W6-SER regression-smoke（`verify-design-tokens.ts`） |
| 19 routes 包括 a11y axe 自動検証 | task-18 W6-SER regression-smoke |
| 法務文面の最終法務確認 | 本ワークフロー外（別 task / 法務レビュー） |
| ProfileHero / RegisterCallout の最終ビジュアル微調整 | task-15 周辺（primitives 適用後の visual polish） |
| seed メンバー id の Playwright fixture 化 | task-18 で集約 |

CONST_007 遵守: 上記はいずれも **既存タスクが引き受け済み**または **本ワークフロー非ゴール**として SCOPE.md / 一次原典で明示されている。本 task 内に「Phase 5 で対応」「別 PR で対応」と先送りする項目は存在しない。

## 完了条件

- [ ] システム / 戦略 / 問題解決の 3 系統で blocking 級の指摘がない
- [ ] リスク表が一次原典 §5 / §8 と整合
- [ ] 残課題は本 task ではなく既存タスク（task-15 / task-18）または非ゴールとして明示済み（CONST_007 例外なし、先送り発生なし）
- [ ] 不変条件 #1 / #2 / #5 / #7 / #10 + OKLch tokens の遵守方法が「システム系」表で全件 OK 評価
