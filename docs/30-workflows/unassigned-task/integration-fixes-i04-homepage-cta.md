# integration-fixes i04 HomePage CallToActionCTA 実装 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i04-homepage-cta                                                              |
| タスク名     | HomePage に prototype "FOR MEMBERS" CallToActionCTA section を実装                              |
| 分類         | 改善 / integration gap fix                                                                      |
| 対象機能     | 公開トップページ (`/`) の CTA section (`CallToActionCTA` dark variant)                          |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | pending                                                                                         |
| 発見元       | improvements 接続検証 (integration-fixes index.md §2 i04) / parallel-06-public-pages DoD 未達   |
| 発見日       | 2026-05-16                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親タスク状態: `spec_ready_implementation_pending`
- 関連 spec (正本): `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md`
- 親 index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- 関連 PR / 検証元: parallel-06-public-pages 単独 merge 後の接続検証 (improvements 接続検証 evidence i04)
- 関連実装 (現状):
  - `apps/web/app/page.tsx` — HomePage entry。MemberGrid section までは prototype 移植済みだが CTA section が欠落
  - `apps/web/src/components/public/` — `CallToActionCTA.tsx` 未作成
  - `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx:136-149` — "FOR MEMBERS" ダーク variant section の正本

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UI prototype alignment / MVP recovery の parallel-06-public-pages にて、`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` を正本として HomePage (`/`) を移植する設計が組まれていた。spec section 2.1 (line 76-100) では hero / featured-members (MemberGrid) / **FOR MEMBERS CTA** の 3 section 構成が DoD として明示されている。

しかし parallel-06 実装時に hero section と MemberGrid section までは移植されたものの、prototype の **bottom 側 (line 136-149)** にある dark variant CTA section "FOR MEMBERS" の移植が漏れた。improvements/integration-fixes index.md §2 i04 にて接続検証で検出され、`apps/web/app/page.tsx` に該当 import / mount がなく、`apps/web/src/components/public/CallToActionCTA.tsx` が存在しないことが実コード evidence で確認されている。

### 1.2 問題点・課題

- prototype の DOM 構成と本番 HomePage の DOM 構成が乖離し、不変条件3「プロトタイプ正本順位」を満たさない
- Google Form 回答動線 (responderUrl) がトップページの bottom CTA から提供されないため、訪問者が掲載依頼の導線を見つけにくい (visible regression)
- parallel-06-public-pages DoD が満たされず、workflow が `completed` に進めない
- integration-fixes workflow §5 DoD i04 (「`/` 訪問時に CTA section が render されること」) が未達

### 1.3 放置した場合の影響

- HomePage のコンバージョン経路（フォーム回答動線）が欠落したまま MVP 公開へ進行するリスク
- parallel-06 と後続 visual regression (task-18 / task-22) の baseline 整合が崩れ、視覚差分検知が機能しない
- 「prototype 移植時にどの section が抜けたか」の検知が後手になる構造的問題が再発する（横展開対策必要）

---

## 2. 何を達成するか（What）

### 2.1 目的

`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx:136-149` の "FOR MEMBERS" dark variant section を component 化し、HomePage の MemberGrid section 後に mount することで parallel-06-public-pages spec section 2.1 DoD を達成する。

### 2.2 最終ゴール

- `apps/web/src/components/public/CallToActionCTA.tsx` が新規作成され、dark variant の CTA section を export する
- `apps/web/app/page.tsx` で `CallToActionCTA` を MemberGrid section 後に mount する
- `responderUrl` は CLAUDE.md 固定値 (`https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`) を constants 経由で供給する（HEX / URL の直書き禁止に準ずる原則）
- external link が `target="_blank"` + `rel="noopener noreferrer"` を持つ
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` で props / a11y 属性が PASS
- `pnpm typecheck` / `pnpm lint` / `verify-design-tokens` 相当の HEX 直書きチェックが PASS
- ローカル `pnpm -F "@ubm-hyogo/web" dev` で `/` 訪問時に dark variant CTA section が render されることを目視確認

### 2.3 スコープ

#### 含むもの

- `CallToActionCTA` component の新規作成（dark variant、external link、`data-component` selector）
- `apps/web/app/page.tsx` への mount（MemberGrid section 後）
- `responderUrl` 定数の置き場所確定（既存 `apps/web/src/lib/constants/` に Form 関連定数があれば再利用、なければ `apps/web/src/lib/constants/form.ts` を新規作成）
- `CallToActionCTA.component.spec.tsx` 追加（snapshot + a11y）
- 既存 HomePage spec があれば `data-component="call-to-action-cta"` が render 結果に含まれることを追加検証

#### 含まないもの

- prototype CSS の token 化変更（既存 OKLch token のみ使用、parallel-03 で定義済の dark variant utility を利用）
- 新 API endpoint の追加 (不変条件 1「既存 API surface のみ接続」に従う)
- `/register` 側 `RegisterCallout` の共通化（別 component として実装、共通化は別タスクで検討）
- D1 直接アクセス（不変条件 4 に従い禁止、本タスクで該当箇所なし）

### 2.4 成果物

- `apps/web/src/components/public/CallToActionCTA.tsx` (新規)
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` (新規)
- `apps/web/app/page.tsx` (modify: import + mount)
- `apps/web/src/lib/constants/form.ts`（既存に同等定数がなければ新規作成）
- parallel-06-public-pages spec section 2.1 DoD 達成記録、および integration-fixes index.md §5 i04 達成記録

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 prototype 移植時の section 単位見落とし

parallel-06-public-pages の HomePage 移植では、`claude-design-prototype/pages-public.jsx` の **上から順に** hero section、featured-members (MemberGrid) section を移植したが、prototype の **bottom 側 (line 136-149)** にある "FOR MEMBERS" dark variant CTA section が見落とされた。原因は以下:

- prototype JSX が単一ファイルで長く (~150 行)、上から読み下す移植順序のため bottom 側の section に到達する前に「移植完了」と判断した
- "FOR MEMBERS" section は hero / featured-members とは異なる variant (dark) を持ち、視覚的に独立した「別ページ要素」に見えやすい
- parallel-06 spec section 2.1 に列挙された 3 section の構成チェックリスト化が不十分で、移植後の DOM diff 検証が section 単位で行われなかった

### 3.2 解決策（実施手順）

1. `claude-design-prototype/pages-public.jsx` 全体を `Read` で読み、prototype の DOM 階層を section 単位でリストアップする
   - hero / featured-members / FOR MEMBERS CTA の 3 section が prototype 側に存在することを確認
2. 本番 HomePage (`apps/web/app/page.tsx`) の現状 JSX を `Read` し、各 section の対応関係を表化（移植済 / 未移植）
3. 未移植 section "FOR MEMBERS" を `apps/web/src/components/public/CallToActionCTA.tsx` として component 化
4. `apps/web/src/lib/constants/` を確認し、`responderUrl` 定数の置き場所を確定（重複定義防止のため事前 grep）
5. `apps/web/app/page.tsx` で MemberGrid section 後に mount
6. component spec で `target="_blank"` / `rel="noopener noreferrer"` / `href` binding / `data-component` selector を検証
7. `pnpm typecheck` / `pnpm lint` 実行
8. `pnpm -F "@ubm-hyogo/web" dev` で目視確認

### 3.3 学んだこと / 横展開メモ

**横展開対策（必須）**: prototype 移植時には以下を運用ルール化する。

- **prototype の DOM 階層を section 単位でチェックリスト化する**
  - `claude-design-prototype/` 配下の各 page prototype を移植する際、対応する parallel spec の section 2.1 等に **prototype の section 一覧（line 番号付き）と本番側の対応 component / mount 位置** を表形式で明記する
  - 移植 PR の DoD checklist で section ごとに「移植済 / 未移植」を明示し、未移植が残った状態で merge できないようにする
- **prototype JSX の bottom 側 section が見落とされやすい**ことを improvements/index.md および parallel spec template に注記し、移植時には必ず prototype JSX を末尾まで読み切るよう運用する
- dark variant など視覚的に独立した section は「別ページ要素」と誤認しやすいため、variant 横断で section 列挙する習慣を付ける
- 本タスク完了後、parallel-06-public-pages の Phase 12 unassigned-task-detection.md に「prototype DOM 階層 section チェックリスト未整備」を改善 finding として登録し、後続 parallel タスク (task-10, task-11 等) の spec template にチェックリスト欄を追加する

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/src/components/public/CallToActionCTA.tsx` が新規作成され、`CallToActionCTAProps`（`responderUrl: string`, optional `heading` / `body` / `ctaLabel`）を受け取る関数 component として export されている
- **AC-2**: `apps/web/app/page.tsx` で `CallToActionCTA` が import され、MemberGrid section 後に mount されている（prototype `pages-public.jsx:136-149` の section 順序と一致）
- **AC-3**: external link (`<a>`) が `target="_blank"` および `rel="noopener noreferrer"` を持ち、`href` に `responderUrl` が binding されている
- **AC-4**: `responderUrl` は CLAUDE.md 固定値 `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` と完全一致し、constants 経由で供給される（HomePage / component に URL 直書きなし）
- **AC-5**: `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` で以下が PASS
  - デフォルト props で heading / body / cta が DOM 上に存在
  - `responderUrl` が anchor の `href` に bound されている
  - anchor の `target="_blank"` / `rel="noopener noreferrer"` が正しく設定されている
  - `data-component="call-to-action-cta"` selector が root 要素に存在
- **AC-6**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカル PASS
- **AC-7**: `verify-design-tokens` 相当チェック（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止）に違反しない
- **AC-8**: `mise exec -- pnpm -F "@ubm-hyogo/web" dev` 起動後、`http://localhost:3000` の `/` で dark variant CTA section が render されることを目視確認
- **AC-9**: parallel-06-public-pages spec section 2.1 DoD および integration-fixes index.md §5 i04 (「`/` 訪問時に CTA section が render されること」) が達成
- **AC-10**: §3.3 の横展開メモ（prototype 移植時の section 単位チェックリスト化）が本ドキュメントに確定状態で記録され、後続 parallel タスクの spec template 改善 finding として参照可能

---

## 5. 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md` — 本タスク正本 spec
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` — integration-fixes workflow index (§2 i04, §5 DoD)
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` — workflow scope（19 routes）
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` — prototype 正本（line 136-149 が "FOR MEMBERS" CTA section）
- `apps/web/app/page.tsx` — HomePage entry（mount 対象）
- `apps/web/src/components/public/` — 公開ページ component 配置先
- `apps/web/src/lib/constants/` — `responderUrl` 定数置き場所候補（事前 grep 必須）
- CLAUDE.md「フォーム固定値」セクション — `responderUrl` 固定値正本
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション — 不変条件 1〜4
- parallel-03（OKLch tokens / dark variant utility）— `globals.css @layer components` の dark variant class 提供元
