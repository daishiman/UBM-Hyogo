[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新 — issue-385-web-build-global-error-prerender-fix

実装区分: **実装仕様書**（実コード変更・deploy・commit・push・PR 作成は本 Phase で実施しない）

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 12 / 13 |
| wave | issue-385 |
| mode | sequential |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_revised |
| 関連 Issue | #385 (CLOSED 状態のまま仕様書化) |

## 目的

Next.js 16.2.4 + React 19.2.5 + next-auth 5.x 環境で `apps/web` の `pnpm build` / `pnpm build:cloudflare` が `/_global-error` / `/_not-found` の prerender 段階で `useContext` null により失敗していた pre-existing バグを、

- **採用方針**: Plan A — `apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / `apps/web/src/lib/auth/oauth-client.ts` の動的 import 書き換え + `apps/web/package.json` の build script `NODE_ENV=production` 明示（next / react / next-auth の version は据置、middleware / next.config は変更なし）

の単一方針で恒久解消する。本 Phase は Phase 5 で確定した Plan A 実装結果と Phase 11 の実測 evidence を踏まえ、ドキュメント更新（spec docs / aiworkflow references / `apps/web/CLAUDE.md`）と Phase 12 必須生成物 6 種を整備する。**本 Phase ではコード変更・commit・push・PR は実施しない**（PR は Phase 13 で user 承認後に別ターンで実行）。

## Phase 12 outputs/ 必須成果物（6 ファイル strict）

`outputs/phase-12/` 配下に以下 6 ファイルを揃える。1 つでも欠落した場合は `phase12-task-spec-compliance-check.md` の判定を `FAIL` とする。

| # | ファイル | 由来 Task | 欠落時の扱い |
| - | -------- | --------- | ----------- |
| 1 | `implementation-guide.md` | Task 1（Part 1 中学生 + Part 2 技術者・PR 本文ベース） | FAIL |
| 2 | `system-spec-update-summary.md` | Task 2（Step 1-A / 1-B / 1-C / Step 2） | FAIL |
| 3 | `documentation-changelog.md` | Task 3 | FAIL |
| 4 | `unassigned-task-detection.md` | Task 4（0 件でも必須） | FAIL |
| 5 | `skill-feedback-report.md` | Task 5（改善なしでも必須） | FAIL |
| 6 | `phase12-task-spec-compliance-check.md` | Task 6（最終確認 root evidence） | FAIL |

> canonical filename strict: 別名（例: `documentation-update-history.md` / `compliance.md`）を使用しない。

## ドキュメント更新対象（実コード変更ではない）

| 対象ファイル | 更新内容 | 必須 / 任意 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | `getAuth()` lazy factory 経路への移行を 1 段落追記し、route handler 実装ガイドラインに `const { auth } = await getAuth()` / `const { handlers } = await getAuth()` / `const { signIn } = await getAuth()` パターンを明示する | 必須 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | シナリオ仕様（Magic Link / OAuth フロー）への影響なしを 1 行確認注記。本文の追記は行わない | 必須（影響なし確認の注記のみ） |
| `apps/web/CLAUDE.md` | 存在する場合に「`apps/web/src/lib/auth.ts` の next-auth value import は禁止。route handler / client 経由で使う場合は `getAuth()` lazy factory または `await import('next-auth/react')` 経由に統一」規約を 1 節追記 | 存在時必須 / 不在時はスキップ |

> 上記 docs 更新は本 Phase の `implementation-guide.md` / `documentation-changelog.md` で「変更点と diff の意図」を仕様レベルで記録する。**実 docs ファイルへの編集 commit は本 Phase で実行しない**（Phase 13 PR にまとめて含める）。

## skill index rebuild 義務

本タスク仕様の追加（issue-385 ワークフロー一式）に伴い、`.claude/skills/aiworkflow-requirements/indexes` に drift が発生する可能性が高い。Phase 12 完了時の必須コマンドとして以下を実行する:

```bash
mise exec -- pnpm indexes:rebuild
```

実行結果（stdout 末尾と diff 件数）を `outputs/phase-12/documentation-changelog.md` 末尾の「skill index rebuild 実行記録」節に記載する。CI の `verify-indexes-up-to-date` gate が PASS することが本 Phase の DoD の 1 項。

## Task 1: implementation-guide.md（PR 本文ベース・2 パート構成）

### Part 1: 中学生レベル（日常の例え話・専門用語なし）

**テーマ**: 「お店の倉庫から、開店準備のときに使えない道具を全部出しておく話」

**例え話の骨格**:
- Web サイトを build する = お店を開ける前にまとめて看板や案内を**先に印刷しておく**作業。
- 今までは「カギ屋さん（ログイン部品 = next-auth）」が、開店準備の場所にいきなり来てしまっていて、印刷工場が「カギ屋さんの道具がここでは動かない」と毎回叫んで止まっていた。
- 修正は、カギ屋さんを**「お客さんが来た瞬間にだけ呼び出す」**ようにする（`getAuth()` lazy factory）。開店準備の場所にはカギ屋さんが居ない状態にしてあげる。
- カギ屋さん本人 (next-auth のバージョン) は変えない。呼び方を変えるだけ。

**「なぜ」を先に書く章立て**:
1. なぜ deploy が止まっていたか → ビルドが途中でエラーで止まり、お店に出す商品 (`worker.js`) が作れなかったから
2. なぜビルドが止まったか → ログイン部品が「開店準備のところ」にまで顔を出してしまい、印刷工場で動こうとして null で転んでいたから
3. どうやって直すか → ログイン部品を「お客さんが来てから呼ぶ」ようにし、開店準備にはいない状態にする
4. 直すと何ができるようになるか → ビルドが緑になり、staging / production への deploy が再開できる

**専門用語セルフチェック表（5 用語以上必須）**:

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| ビルド (build) | お店を開ける前にあらかじめ商品をまとめて作っておく作業 |
| プリレンダー (prerender) | お客さんが来る前に画面の絵をあらかじめ描いておくこと |
| next-auth | お客さんがちゃんとした人かどうかを見分けるカギ屋さん |
| `getAuth()` | カギ屋さんを「呼ばれたときだけ呼び出す」予約電話 |
| top-level import | 開店準備の場所に部品を置きっぱなしにする置き方 |
| dynamic import | 必要になった瞬間に取りに行く取り出し方 |
| `useContext` | 部品同士で同じ情報を共有するための仕組み（今回それが null だった） |
| Cloudflare Workers | サイトを動かす場所（インターネットの上の小さな箱） |

**Part 1 必須要素チェックリスト**（書き終えたら全項目を確認）:

| # | チェック項目 |
| --- | --- |
| 1 | カギ屋さん / 印刷工場 / 開店準備 などの日常の例え話が 1 つ以上ある |
| 2 | 専門用語セルフチェック表に 5 用語以上、各用語に日常語の言い換え併記 |
| 3 | 中学 2 年生が読んで止まらない語彙（「コンテキスト」「依存性」「ライフサイクル」が裸で出てこない） |
| 4 | 「なぜ deploy がブロックされていたか」が「何をするか」より先に書かれている |
| 5 | 修正後に何が動くようになるか（build 緑化 → deploy 再開）が書かれている |

### Part 2: 技術者レベル（PR 本文ベース）

**章立て**:

1. **真因（Phase 1 確定）**
   - Next.js 16.2.4 build 時の prerender worker において、`apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"` 等が `@auth/core` / `next-auth/react` を module-init 時にロードし `React.createContext(undefined)` を実行する
   - その結果 React 19.2.5 Dispatcher の解決順が破壊され、Next 16 内蔵 `_global-error` / `_not-found` の prerender 中に `useContext` が null を返す
   - vercel/next.js #86178 / #84994 / #85668 / #87719、nextauthjs/next-auth #13302 の同症状報告と一致
2. **採用方針: Plan A（lazy factory）**
   - `apps/web/src/lib/auth.ts` を `export async function getAuth()` lazy factory 化し、内部で `await import("next-auth")` 等を行う
   - 4 route handler / `oauth-client.ts` を `getAuth()` 経由 or `await import("next-auth/react")` 経由に書き換え
   - next / react / react-dom / next-auth の version、middleware、next.config は **変更なし**。`apps/web/package.json` は build script の環境明示のみ変更
3. **不採用案（理由付き）**

   | 案 | 不採用理由 |
   | --- | --- |
   | next patch upgrade | 16.2.5 不存在、canary でも未修正 |
   | react downgrade | 19.2.4 でも再現、major bump は依存破壊 |
   | `serverExternalPackages: ["next-auth", "@auth/core"]` | useContext は解消するが next-auth/lib の `next/server` ESM 拡張子問題を新たに招く |
   | `pnpm patch next-auth` | 上と組み合わせれば動くが next-auth bump 毎に patch 再生成が必要・保守性低 |
   | `app/global-error.tsx` の `"use client"` 撤廃 | Next 16 の必須 convention 違反、内蔵 default でも再現 |
   | Next.js 上流修正待ち | 修正版リリース時期未定、deploy ブロック継続不可 |

4. **変更対象ファイルと diff 概要**

   | 対象 | Plan A 適用 |
   | --- | --- |
   | `apps/web/src/lib/auth.ts` | top-level next-auth value import 撤廃、`getAuth()` lazy factory export、`buildAuthConfig` / `fetchSessionResolve` 等純粋関数は据置 |
   | `apps/web/src/lib/auth/oauth-client.ts` | top-level `import { signIn } from "next-auth/react"` を関数内 `await import("next-auth/react")` に置換 |
   | `apps/web/app/api/auth/[...nextauth]/route.ts` | `export { GET, POST }` 直接再 export を `async function GET/POST(req) { const { handlers } = await getAuth(); return handlers.GET/POST(req); }` に置換 |
   | `apps/web/app/api/auth/callback/email/route.ts` | `signIn` 呼び出し直前に `const { signIn } = await getAuth();` |
   | `apps/web/app/api/admin/[...path]/route.ts` | `auth()` 呼び出し直前に `const { auth } = await getAuth();` |
   | `apps/web/app/api/me/[...path]/route.ts` | 同上 |
   | `apps/web/middleware.ts` | 変更なし |
   | `apps/web/next.config.ts` | 変更なし |
   | `apps/web/package.json` | `build` / `build:cloudflare` に `NODE_ENV=production` を明示 |

5. **検証コマンド（Phase 11 9 段）**
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
   - `mise exec -- pnpm --filter @ubm-hyogo/web lint`
   - `mise exec -- pnpm --filter @ubm-hyogo/web test`
   - `mise exec -- pnpm --filter @ubm-hyogo/web build`
   - `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`
   - `ls -la apps/web/.open-next/worker.js`
   - `grep -c "Cannot read properties of null" <build logs>` (expect 0)
   - `rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` (expect 0 hit value import)
6. **DoD (Definition of Done)**
   - AC-1〜AC-9 すべて PASS（Phase 11 evidence で担保）
7. **後続 follow-up**
   - P11-PRD-003 fetchPublic: build 緑化により deploy 経路再開
   - P11-PRD-004 `/privacy` `/terms`: 同上
   - `apps/web/wrangler.toml` `*_API_BASE_URL` service-binding: 既追加済、build 緑化で deploy 反映可
   - 09a-A staging deploy smoke / 09c-A production deploy: build 成果物生成で deploy 実行可

## Task 2: system-spec-update-summary.md

### Step 1-A: spec docs 直接更新

**判定: UPDATE_REQUIRED（限定範囲）**

| 対象 spec | 更新範囲 | 判定根拠 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | `getAuth()` lazy factory 経路への移行を 1 段落追記し、route handler 実装ガイドラインに `await getAuth()` パターンを明示 | next-auth の利用形態が「top-level import」から「lazy factory 経由」に変わるため、認証 spec として明文化必須 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 影響なし確認のみ。シナリオ仕様（Magic Link / OAuth フロー）に変更なし | 利用者シナリオ・mvp 認証方針の意味論に変更なし |

### Step 1-B: aiworkflow references / 関連 spec docs cross-reference

| ファイル | 必要性 | 結論 |
| --- | --- | --- |
| `apps/web/CLAUDE.md`（存在する場合） | 「auth.ts の top-level next-auth value import 禁止 / lazy factory 規約」を 1 節追記 | **追記候補**（存在時必須）。実存在は Phase 12 実走時に `ls apps/web/CLAUDE.md` で確認 |
| `.claude/skills/aiworkflow-requirements/references/` の Web build / Next.js 関連 reference | Plan A の lazy factory パターンが将来 next-auth/react の Provider context 衝突に対する再発防止策として有効、を lessons-learned 候補として記録 | **追記候補**（提案記録のみ。実適用は後続 implementation prompt の lessons 記録時に判定） |
| `docs/00-getting-started-manual/specs/00-overview.md` のデプロイ章 | 本タスクは build 緑化のみで deploy フロー自体に変更なし | cross-reference 不要 |
| `docs/00-getting-started-manual/claude-code-config.md` | 設定ファイル / 権限への影響なし | 不要 |

### Step 1-C: 既存 system spec との conflict

**結論: conflict なし**

- `apps/web` (`@opennextjs/cloudflare` + Next.js App Router) の構成・スタック・パッケージ管理 (pnpm workspace) は CLAUDE.md / specs と完全整合
- `getAuth()` lazy factory 化は `02-auth.md` の現行設計（Auth.js + Google OAuth + Magic Link）の意味論を変えない（呼び出しタイミングのみ変更）
- middleware / `decodeAuthSessionJwt` 経路は据置で `13-mvp-auth.md` のシナリオ仕様に影響なし

### Step 2: 新規インターフェース追加判定

**判定: 限定追加あり（公開 API シグネチャ 1 件）**

- 新規追加: `apps/web/src/lib/auth.ts` の `export async function getAuth(): Promise<{ handlers; auth; signIn; signOut }>` 1 件
- 既存 export `handlers` / `auth` / `signIn` / `signOut` は仕様レベルでは互換維持（Phase 5 設計に従い、既存呼び出し元は 4 route handler + oauth-client + middleware に限定的、いずれも本タスクで lazy factory 経由へ書き換える）
- D1 schema / API endpoint / IPC 契約 / shared package 型 / Auth.js callback signature は **変更ゼロ**
- stale contract withdrawal: 既存 top-level import 慣行を `02-auth.md` および `apps/web/CLAUDE.md` で明示的に「禁止」化

### root / outputs artifacts.json parity

root `artifacts.json` と `outputs/artifacts.json` は同じ status / metadata / phases / blocks を持つ。parity check は root と outputs の双方で実施する。

## Task 3: documentation-changelog.md

`scripts/generate-documentation-changelog.js` 相当のフォーマットで以下を記録:

- 本ワークフロー作成 (2026-05-02) の entry
- Plan A 採択への仕様改訂 (2026-05-03) の entry
- `docs/00-getting-started-manual/specs/02-auth.md` の lazy factory 段落追記 entry（Phase 13 PR で適用）
- `apps/web/CLAUDE.md` の lazy factory 規約追記 entry（存在時のみ・Phase 13 PR で適用）
- 同期 wave: issue-385
- 末尾に「skill index rebuild 実行記録」節を設け、`mise exec -- pnpm indexes:rebuild` の stdout 末尾と diff 件数を記録
- 実 commit / push / PR は Phase 13 user 承認後

## Task 4: unassigned-task-detection.md（必須）

### 検出件数: 3 件 + lessons-learned 候補 1 件

Issue #385 本文に明記された follow-up を後続 unassigned-task として記録する。

| # | タスク候補 | 種別 | 推奨 issue title | scope | blocker 解消後の発火条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | P11-PRD-003 fetchPublic 経路の再開 | implementation | `feat(web): re-enable P11-PRD-003 fetchPublic after build fix` | apps/web fetchPublic 実装 / E2E smoke | Issue #385 本仕様書の AC-1〜AC-9 が緑になり deploy 経路が回復した時点 |
| 2 | P11-PRD-004 `/privacy` `/terms` ページ実装 | implementation | `feat(web): implement /privacy /terms pages after build fix` | apps/web 静的ページ追加 / SSG 確認 | 同上 |
| 3 | `apps/web/wrangler.toml` service-binding (API_BASE_URL) の deploy 反映 | infrastructure | `chore(web): apply service-binding for *_API_BASE_URL after build fix` | wrangler.toml service-binding 適用 / staging smoke | 同上（既追加済 binding が build 緑化により deploy 反映可能になる） |

### lessons-learned 候補（提案記録のみ・本 Phase では追加しない）

| 候補 ID | 内容 | 想定追加先 |
| --- | --- | --- |
| LL-1 | 「Next.js App Router + React 19 + next-auth 5.x 環境では、auth 系モジュールを top-level import すると prerender worker で `useContext` null を引く可能性があり、`getAuth()` lazy factory パターンが再発防止策として有効」 | `.claude/skills/aiworkflow-requirements/references/` 配下に新規 reference として追加検討（本 Phase では `outputs/phase-12/skill-feedback-report.md` に提案記録のみ） |

### 必須セクション（4 種）

各候補タスク登録時には以下 4 種を必ず含める:

1. **苦戦箇所【記入必須】**: 例: build 緑化前に上記 follow-up に着手すると同じ `useContext` null で deploy 不可
2. **リスクと対策**: 例: lazy factory 適用後も特定 route で漏れがあれば再発 → Phase 11 段 9 lazy-import-check で構造検査
3. **検証方法**: 例: `pnpm --filter @ubm-hyogo/web build` exit 0 と `.open-next/worker.js` 生成確認
4. **スコープ（含む / 含まない）**: 例: 含む = 該当機能実装と smoke、含まない = auth.ts の挙動変更・deploy 実行・PR 作成

### 判定

3 件すべて Issue #385 本文で参照済の **下流 follow-up** であり、本ワークフローでは scope 外として記録のみ行う。実 issue 化は build 緑化 (本仕様書の implementation 完了) 後に user 承認を経て実施。LL-1 は skill-feedback-report.md にも提案として転記。

## Task 5: skill-feedback-report.md（必須）

### 改善候補

| 観点 | 記録内容 | promotion / defer / reject |
| --- | --- | --- |
| lessons-learned promotion | LL-1「next-auth top-level import を避け `getAuth()` lazy factory 化することで Next.js 16 + React 19 prerender 環境での `useContext` null 連鎖を回避できる」を `.claude/skills/aiworkflow-requirements/references/` 配下の Web build lessons reference に追加検討 | **defer**（Plan A 実装結果と Phase 11 実測 evidence を Phase 13 PR で確定後、別タスクとして lessons 化を user 承認） |
| テンプレート確認 | NON_VISUAL implementation-spec / Phase 12 strict 6 files / lazy factory 系真因の構造的記録が、task-specification-creator skill の現行テンプレで漏れなく吸収できることを確認 | **defer**（既存テンプレで十分。promotion は不要） |
| ワークフロー観察 | Issue が CLOSED 状態のまま仕様書化するケース（過去 issue の lessons-learned 化）が、Phase 1-13 完全 13 段で成立することを確認 | **defer**（必要時に skill 側で「CLOSED issue 仕様書化」節として追記検討） |

### 判定

**FEEDBACK_PROPOSED_DEFERRED**

理由:

- LL-1 は明確な promotion target（aiworkflow-requirements references の Web build lessons）を持つが、実適用は Phase 13 PR merge 後の lessons 化タスクで user 承認を経るのが適切（本 Phase では提案記録のみ）
- defer 観察 2 件は将来 skill 改訂時の参考メモとして本 report に残すのみ

### routing 必須フィールド

各 feedback エントリには (a) promotion target / no-op reason / (b) evidence path / (c) 採否判定 (Promote / Defer / Reject) を明記する。本 report では LL-1 のみ promotion target あり Defer、他 2 件は no-op reason 付き Defer。

## Task 6: phase12-task-spec-compliance-check.md（root evidence）

### 監査軸

| 軸 | 確認内容 | PASS 条件 |
| --- | --- | --- |
| strict 6 + main 実体 | outputs/phase-12/ に Task 1-6 由来 6 ファイル + `main.md` の計 7 ファイル存在 | `find outputs/phase-12 -maxdepth 1 -type f -name '*.md' \| wc -l` == 7 |
| canonical filename | 別名 (例: documentation-update-history.md) 不在 | grep で別名検出 0 |
| Phase status | workflow root は `implemented-local`。Phase 1-12 は completed、Phase 13 は `blocked_pending_user_approval` | local implementation / evidence と deploy / PR gate を分離 |
| boundary | local code / docs / evidence は実施、deploy・commit・push・PR 未実行 | implementation-guide.md / 本ファイルで明文化 |
| Step 2 限定追加宣言 | system-spec-update-summary.md で `getAuth()` 1 件追加と既存 export 互換維持を明記 | 「公開 API シグネチャ 1 件追加 / D1・API・IPC・shared 変更ゼロ」記載 |
| skill index rebuild | `mise exec -- pnpm indexes:rebuild` 実行と CI `verify-indexes-up-to-date` PASS | documentation-changelog.md 末尾の「skill index rebuild 実行記録」節に stdout 末尾と diff 件数 |
| skill feedback judging gate | 全 feedback に promotion / defer / reject の判定 | skill-feedback-report.md でルーティング済 |
| unassigned-task 3 件 + LL-1 記録 | Issue #385 本文の formal follow-up 3 件と LL-1 候補 1 件を記録 | unassigned-task-detection.md で 3 件 + 4 必須セクション準拠 + LL-1 提案 |

### 必須逐語文言

> 本タスクは spec_revised の implementation-spec であり、コード変更・deploy・commit・push・PR は本 Phase で実施しない。

> Issue #385 は CLOSED 状態のまま本仕様書化を行う。実 implementation 着手時に user 承認のうえ再 open 判断を行う。

> 採用方針は Plan A（`getAuth()` lazy factory + build script `NODE_ENV=production` 明示）であり、next / react / react-dom / next-auth の version、middleware、next.config は変更しない。`apps/web/package.json` は build script の環境明示のみ変更する。

### PASS 判定の前提

`PASS` は (a) 6 outputs の実体 + (b) validator 実測値 (`find` / `rg` の終了コードと結果) + (c) boundary / Step 2 限定追加文言の存在 + (d) skill index rebuild 実行記録 が揃った後にのみ許可する。

## 実行タスク

1. 6 ファイル strict の構成を確定する。完了条件: ファイル名と由来 Task が 1:1 に対応する。
2. Task 1 (implementation-guide.md) の Part 1 / Part 2 構成を定義する。完了条件: Part 1 必須要素 5 項目 + 専門用語表 5 用語以上 + Part 2 真因 / 採用方針 / 不採用案 / 変更対象 / 検証コマンド / DoD / follow-up が記載される。
3. Task 2 (system-spec-update-summary.md) の Step 1-A〜1-C / Step 2 を定義する。完了条件: Step 1-A UPDATE_REQUIRED 根拠 + Step 2 限定追加 1 件明記。
4. Task 3 (documentation-changelog.md) のフォーマットと skill index rebuild 記録を定義する。完了条件: 本ワークフロー作成・Plan A 改訂・spec docs 追記の entry + index rebuild 節が記載される。
5. Task 4 (unassigned-task-detection.md) で後続タスク 3 件 + LL-1 候補を列挙する。完了条件: P11-PRD-003 / P11-PRD-004 / wrangler.toml service-binding が 4 必須セクション準拠で記録され、LL-1 提案も併記される。
6. Task 5 (skill-feedback-report.md) で改善候補と routing を定義する。完了条件: FEEDBACK_PROPOSED_DEFERRED 判定 + LL-1 promotion target 明記。
7. Task 6 (phase12-task-spec-compliance-check.md) で監査軸と必須逐語文言を定義する。完了条件: 8 軸すべてに PASS 条件が記載される。
8. skill index rebuild を Phase 12 完了時に実行する手順を明記する。完了条件: コマンドと記録先が示される。
9. 「本 Phase ではコード変更・commit/push/PR は実施しない」を明記する。完了条件: 冒頭・Task 6 必須逐語文言・本セクションの 3 箇所で繰り返し言明される。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md
- Phase 1-3 outputs（真因 / Plan A 採用 / 4 条件 PASS）
- Phase 5 (Plan A 実装ランブック / `getAuth()` シグネチャ)
- Phase 11 (9 段実測 evidence 構成)
- Issue #385 本文（P11-PRD-003 / P11-PRD-004 / wrangler.toml service-binding follow-up）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-12.md（フォーマット参考）
- vercel/next.js #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth #13302

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit、push、PR 作成を行わない
- 実コード修正（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / oauth-client.ts 書き換え）は user 承認後・Phase 5 ランブックに従い実施
- spec docs / `apps/web/CLAUDE.md` の追記も Phase 13 PR にまとめて含める（本 Phase では仕様レベルで「何を書くか」の整理のみ）
- skill index rebuild (`mise exec -- pnpm indexes:rebuild`) は本 Phase 完了時に必ず実行し、結果を `documentation-changelog.md` に記録
- secret 値・provider response body・op read 出力を outputs に転記しない

## 統合テスト連携

- 上流: Issue #385, Phase 1-3 確定済真因 / Plan A 採用方針, Phase 5 実装ランブック, Phase 11 9 段 evidence 構成, Next.js 16 App Router 公式 docs
- 下流: Phase 13（PR 作成）, P11-PRD-003 fetchPublic, P11-PRD-004 `/privacy` `/terms`, wrangler.toml service-binding 適用, 09a-A staging deploy smoke, 09c-A production deploy

## 多角的チェック観点

- 不変条件 #5: `apps/web` のみ変更 / `apps/api` 独立を Phase 12 outputs で再確認
- 不変条件 #14: 新規 binding / KV / D1 / cron 追加なしを compliance-check で確認
- 不変条件 #16: build ログ secret 文字列を evidence に転記しない
- 未実装 / 未実測を PASS と扱わない: spec_revised close-out の境界を明文化
- CLOSED issue 仕様書化のため Issue 再 open は user 判断とし自動化しない
- skill index drift を `pnpm indexes:rebuild` 強制実行で防ぐ

## サブタスク管理

- [ ] 6 ファイル strict 構成を定義した
- [ ] implementation-guide.md Part 1 / Part 2 構成を定義した
- [ ] system-spec-update-summary.md Step 1-A〜1-C / Step 2 を定義した
- [ ] documentation-changelog.md フォーマット + skill index rebuild 節を定義した
- [ ] unassigned-task-detection.md 3 件 + LL-1 を列挙した
- [ ] skill-feedback-report.md 判定と routing を定義した
- [ ] phase12-task-spec-compliance-check.md 監査軸 8 軸と必須逐語文言を定義した
- [ ] 「本 Phase ではコード変更・commit/push/PR を実施しない」を 3 箇所で言明した
- [ ] skill index rebuild 実行手順を明記した

## 成果物

- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- 6 ファイル strict（canonical filename）の構成が outputs/phase-12/ に揃う
- implementation-guide.md Part 1 が中学生レベル必須要素 5 項目 + 専門用語表 5 用語以上を満たす
- implementation-guide.md Part 2 が真因 / 採用方針 / 不採用案 / 変更対象ファイル / 検証コマンド / DoD / follow-up を含む
- system-spec-update-summary.md が Step 1-A UPDATE_REQUIRED + Step 1-B / 1-C 結論 + Step 2 限定追加 1 件を含む
- documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md が必須出力ルールに従う
- phase12-task-spec-compliance-check.md が 8 軸 PASS 条件と必須逐語文言を含む
- canonical filename strict（別名禁止）が明記されている
- skill index rebuild が Phase 12 完了時に実行される手順が明記されている
- 本 Phase ではコード変更・commit/push/PR を実施しないことが冒頭・Task 6・実行手順で言明されている

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない

## 次 Phase への引き渡し

Phase 13（PR 作成）へ次を渡す:

- 6 ファイル strict の outputs 構成
- Plan A（`getAuth()` lazy factory + 4 handler + oauth-client）単一方針
- AC-1〜AC-9 と Phase 11 9 段検証コマンド
- spec docs 追記内容（02-auth.md / `apps/web/CLAUDE.md`）= PR diff に含める対象
- LL-1 lessons-learned 提案（Phase 13 PR merge 後の別タスクで user 承認）
- Issue #385 は CLOSED 状態のまま、必要時のみ再 open を user 判断
- 後続 follow-up 3 件（P11-PRD-003 / P11-PRD-004 / wrangler.toml service-binding）は build 緑化後に発火
