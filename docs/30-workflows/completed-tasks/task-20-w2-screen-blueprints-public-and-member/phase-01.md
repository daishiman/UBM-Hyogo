# Phase 01 — 要件定義

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 位置づけ

本タスク `task-20-w2-screen-blueprints-public-and-member` は、ui-prototype-alignment-mvp-recovery ワークフローの 03-spec-source wave に属する docs-only タスクである。task-01 scope-gate-all-screens の gate 通過後、即着手可能。並列に task-06 / task-07 / task-08 / task-19 / task-21 / task-22 が走る。

下流（task-11 public top + member list / task-12 detail + register / task-13 login / task-14 my profile + requests）は本タスクが提供する 09e / 09f §X を「読んで 1 ファイル書ける」状態に依存する。

## 1. 真の論点（Q1〜Q6）

### Q1: JSX inline 一字一句転記の許容範囲はどこまでか

**結論**: prototype 内の JSX `return (...)` ブロック全体を **空白・改行・属性順を含めて一字一句転記** する。class 名（Tailwind 並びを含む）/ コピー文 / aria-* / data-* / handler 名すべて変更しない。

- 転記範囲は §X.1 prototype 由来見出し直下の単一 `jsx` コードブロック
- import 行 / hook 宣言 / 関数 boilerplate は含めない（純粋に return JSX のみ）
- 後続実装が `pages-*.jsx` の差分を取った際に hash-equal が成立する形で揃える

### Q2: 視覚値（HEX / oklch / px / bg-arbitrary-class）の除外境界はどこか

**結論**: 09e / 09f に **視覚値 0 件**を grep gate で機械検証する。class 名内の token 名（`bg-ubm-*` / `text-ubm-*` 等）は許容するが、HEX リテラル / oklch 関数表記 / 数値+ピクセル単位 / `bg-` の任意値クラス は禁止。

- 元タスク §0.5 不変条件 3 を本仕様書群（index.md / artifacts.json / phase-01〜13.md）にも適用する
- 検出パターン: `#[0-9a-fA-F]{3,8}\b` / `oklch\(` / `\b[0-9]+px\b` / `\bbg-\[`
- prototype JSX 内に視覚値が含まれる行があった場合は **transcription source の事実として転記する**（その場合は token 化未済として task-08 / task-19 への送り返し対象になるが、本タスクで token 化はしない）

### Q3: 状態遷移 mermaid の粒度はどこに置くか

**結論**: ページ標準 5 値（idle / loading / success / empty / error）+ 画面固有状態を mermaid stateDiagram-v2 で記述。login のみ 5+1 状態（input / sent / unregistered / deleted / rules_declined / error）の画面固有版を採用。`success → [*]` で終端する。

- 1 画面 1 mermaid block（合計 8 block + login 派生）
- transition trigger に endpoint name を含める（`POST /api/auth/magic-link 200` 等）
- `loading --> empty: 200 + result=[]` のように HTTP status と空配列条件を明示

### Q4: 未掲載画面（register / privacy / terms）の派生ルールをどう正本化するか

**結論**: phase-3 §3「未掲載画面派生ルール」と §5.2「register 派生ルール」を **正本転記**する。register は `GET /public/form-preview` で取得した質問列 + `responderUrl` への外部 link で構成、privacy / terms は LegalProse primitive 派生として 09c §（法務 prose）の組合せに限定する。

- register: form 本体は Google Form 側、本サイトは preview + responder link（CLAUDE.md 不変条件 7）
- privacy / terms: heading + paragraph + list の prose primitive 組合せのみ（独自 primitive 生成禁止）
- 09c の primitive を再利用する制約を §冒頭で明記する

### Q5: 不採用要素（EDITMODE 専用 / dark mode / GAS 由来）の扱いをどうするか

**結論**: §99「不採用要素」表で 1 行 1 要素として **採用しない理由つきで明示** する。コードを引かないだけでなく「なぜ引かないか」を後続タスクが参照できる形で残す。

| 要素 | 理由 |
|------|------|
| TweaksPanel（`app.jsx` L213-L251） | EDITMODE 専用 |
| theme switcher（`styles.css` L42-L70） | dark mode MVP 非対応 |
| AvatarStoreProvider#localStorage 部分 | API 経由（task-14） |
| `gas-prototype/` 由来の振る舞い | 仕様昇格禁止（CLAUDE.md 不変条件 6） |

### Q6: 9 series 内 link 戦略をどう統一するか

**結論**: 各画面 §X.7 で **3 種固定 link**（token / primitive / icon）+ 1 種 optional link（prototype-map）を持つ。link format は `- token: 09b §<番号>` / `- primitive: 09c §<番号>` / `- icon: 09d §<番号>` / `- prototype-map: 09a §<番号>（optional）` に固定。phase-08 DRY 化で統一する。

## 2. Schema / 共有コード Ownership 宣言（再掲）

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | **本タスク** | 新規（公開 6 画面 + §99、行数は evidence 記録のみ） |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | **本タスク** | 新規（会員 2 画面 + §99、行数は evidence 記録のみ） |
| `09-ui-ux.md` / `09a` / `09b` / `09c` / `09d` / `09g` / `09h` | 各並列タスク | 本タスクは link 先として参照のみ |
| `pages-public.jsx` / `pages-member.jsx` | （凍結） | 本タスクで改変しない |

## 3. AC 確定（index.md の AC-1〜13 を再掲し本 phase で lock）

AC-1〜13 は `index.md` で定義済み。本 phase で以下を確定する:

- AC-1 / AC-2: 実体作成 + 行数 inventory
- AC-3 / AC-4: §1〜§N + §99 の章立て数（grep `^## [0-9]+\. ` の hit 数）
- AC-5: 全 8 画面で X.1〜X.7 の 7 節揃い
- AC-6: login 5+1 状態 mermaid 列挙
- AC-7: profile 4 領域 banner / summary / request / delete
- AC-8: register / privacy / terms phase-3 §3 §5.2 派生ルール正本転記
- AC-9: 視覚値 grep 0 件
- AC-10: 現行 API 正本と §X.4 一致
- AC-11: 不変条件（consent / responseEmail / D1 直接アクセス禁止）反映
- AC-12: markdown validation（lint script 未定義時は代替証跡）
- AC-13: 09c / 09b / 09d / 09a link 全画面記述

## 4. 不変条件と本タスクの関係

| 不変条件 | 本タスクとの関係 |
| --- | --- |
| #1 実フォーム schema をコードに固定しすぎない | 09e §4 register で responderUrl link を扱う際に form schema を spec に焼き付けない（phase-3 §3 §5.2 派生ルール正本転記） |
| #2 consent キー `publicConsent` / `rulesConsent` 統一 | 09e §4 register / 09f §2 profile で参照時に正本キー名のみ |
| #3 `responseEmail` は system field | 09e §4 / 09f §2 で system field と明記 |
| #4 admin-managed data 分離 | 09e/09f は public+member layer のみ、admin schema に触れない |
| #5 D1 直接アクセスは `apps/api` に閉じる | 09e/09f §X.4 API 表は `/public/*` `/me/*` `/auth/*` のみ参照、D1 binding に触れない |
| #6 GAS prototype を本番仕様に昇格させない | §99 不採用要素表で明示 |
| #7 MVP では Google Form 再回答が本人更新の正式経路 | 09e §4 register で responderUrl link を扱う |

## 5. automation-30 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | 元タスク §0.7 章立て / §4 §6 §8 DoD と本仕様書 13 phase 構成は整合 |
| 漏れなし | OK | 公開 6 + 会員 2 = 8 画面 + §99 不採用 = 9 セクション × X.1〜X.7 = 63 ノードを Phase 7 AC マトリクスで全数トレース |
| 整合性あり | OK | §X.4 API 表が現行 API 正本と一致する制約を trace check で機械検証 |
| 依存関係整合 | OK | task-01 上流 gate / task-06/07/08/19/21/22 並列調整 / task-11..14 下流の §X 参照が明示済み |

## 6. 並列タスク（task-06 / 07 / 08 / 19 / 21 / 22）との競合回避ルール

`docs/00-getting-started-manual/specs/09*.md` ファイル群を本タスクと並列タスクが共有編集する可能性がある。以下のルールで競合を回避する:

| 編集権 | owner | ファイル |
| --- | --- | --- |
| 09e / 09f | **本タスク** | screen blueprints public / member |
| 09 (UI/UX 契約) | task-06 | 09-ui-ux.md |
| 09a (prototype-map) | task-07 | 09a-prototype-map.md |
| 09b (design-tokens) | task-08 | 09b-design-tokens.md |
| 09c (primitives) | task-19 | 09c-primitives.md |
| 09d (icons) | task-22 | 09d-icons.md |
| 09g (admin blueprints) | task-21 | 09g-screen-blueprints-admin.md |
| 09h (shell + fixtures) | task-22 | 09h-shell-and-fixtures.md |

運用: 09e / 09f の §X.7 参照節は 09b / 09c / 09d / 09a の **§番号のみ**を引き、内容コピーはしない。並列タスク側の §番号変更があった場合は、本タスク完了後に link check で検出 → 軽微更新で追従する。

## 7. エスカレーション条件

以下のいずれかを満たす場合、user に判断を仰ぐ:

- pages-public.jsx / pages-member.jsx の凍結が解除され構造が変化（本タスクの再走必要）
- 現行 API 正本（apps/api / apps/web BFF / aiworkflow-requirements）が更新された（API trace check の base がずれる）
- 9 series の §番号体系が並列タスクで未確定のまま collision（X.7 link 先が不定）
- register が外部 Google Form ではなく内製 form に方針変更（CLAUDE.md 不変条件 7 と衝突）

## 8. 次フェーズへの引き渡し

phase-02（設計）に渡す confirmed inputs:

- 真の論点 Q1〜Q6 結論
- 9 series link 戦略（§X.7 fixed format）
- 視覚値 0 件 grep gate ルール
- 不採用要素 4 行表
- 8 画面の prototype 行範囲（pages-public.jsx LandingPage L4-L154 / MemberListPage L208-L338 / MemberDetailPage L339-L472、pages-member.jsx LoginPage L4-L67 / MyProfilePage L220-L373）
- AC-1〜13 lock 済み
