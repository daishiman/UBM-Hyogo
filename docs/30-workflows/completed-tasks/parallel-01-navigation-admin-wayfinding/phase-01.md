# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは `apps/web` の admin layout (`AdminSidebar.tsx`) と admin members feature (`MemberDrawer.tsx`) に対し Next.js `<Link>` を新規追加する実コード変更を伴う。Vitest component test 新規 2 ファイル・Playwright smoke 更新も含む。仕様策定単体では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin ナビゲーション動線改善 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |
| visualEvidence | VISUAL |

## 目的

PARALLEL-01-NAV（admin sidebar logo→`/` 戻り動線追加 G1-1、members drawer→tags link 追加 G1-2）の
必要性・スコープ・受入条件を確定し、Phase 2 設計に渡す入力を Phase 1 で固定する。

特に以下 3 つの真の論点を本 Phase で明文化し、Phase 2 設計の前提として確定する。

1. logo の見せ方（テキスト / SVG icon / 既存ロゴアセット）
2. drawer→tags link の配置位置（content footer / 既存 section の下 / 専用 section）と onClose 制御の挙動
3. `encodeURIComponent` の徹底範囲とテスト戦略（特殊文字 `@` / `/` / スペース）

## 真の論点

### 論点 1: logo の見せ方（テキスト / SVG / アイコン）

`apps/web/src/components/layout/AdminSidebar.tsx` の sidebar 上部に「ホームに戻る」link を配置するにあたり、表示形式の選択肢:

- **(A) サイトロゴ文字列（`UBM兵庫`等）+ `aria-label="ホームに戻る"`**: 既存プロトタイプの logo block sizing に align しやすい。文字列のみで完結し追加アセット不要。**第一推奨**。
- **(B) 専用 SVG / 画像ロゴ**: 視覚的に最も明確だが、現時点で SVG アセットが `apps/web/public/` 配下に存在するか未確認。Phase 1 で既存アセット有無を確認、なければ (A) に倒す。
- **(C) アイコン（home icon 等）単独**: aria-label 必須。視認性が低く、admin 運用者にとって意図が伝わりにくい。**不採用**。

→ Phase 1 では既存ロゴアセットの有無を確認し、存在すれば (B)、なければ (A) を採用するハイブリッド方針とする。Phase 2 で確定。

### 論点 2: drawer→tags link の配置位置と onClose 制御

`MemberDrawer.tsx` の drawer content 内のどこに tag 管理 link を置くか:

- **(A) drawer 最下部に専用 section（`border-t` 区切り）**: 既存 section（基本情報・連絡先・audit log 等）を侵食せず、明確な「会員操作」エリアとして独立配置可能。**第一推奨**。
- **(B) 既存 audit log section 下部に inline 配置**: visual hierarchy が崩れやすい。
- **(C) drawer header / 右上 action button 化**: header 領域が既に close button 等で混雑している可能性。Phase 1 で既存 header 構造を確認後判定。

onClose 制御の挙動:

- Next.js `<Link>` クリック時に page transition が発火 → admin layout は維持されたまま `/admin/tags?memberId=...` へ navigate
- drawer component は `/admin/members` page の state に紐づくため、route 遷移で unmount される（onClose を明示呼び出ししなくても閉じる）
- ただし React 18+ の transition 挙動次第では drawer state が残留する可能性があるため、Phase 2 で明示的 `onClose()` 呼び出しの要否を最終決定する

→ Phase 1 では **(A) drawer 最下部に専用 section** を採用候補とし、onClose 明示呼び出しは Phase 2 で確定。

### 論点 3: encodeURIComponent の徹底とテスト戦略

`memberId` の URL embed:

- 正規形: `` `/admin/tags?memberId=${encodeURIComponent(memberId)}` ``
- `memberId` は backend で UUID or ULID 想定（特殊文字を含まない場合がほとんど）だが、将来的に Google Form responseId が混入する可能性を考慮し、**全 case で encodeURIComponent を通す**ことを不変条件化する。

テスト戦略:

- Vitest unit test で `memberId = "abc@example/test 01"` のような特殊文字を含む case を 1 件以上含める
- `href` 属性の expected value を `/admin/tags?memberId=abc%40example%2Ftest%2001` で assertion
- Playwright smoke test では実 UUID を使うため特殊文字 case は unit test 側で担保

→ Phase 1 では encode 徹底 + unit test での特殊文字 case 必須化を確定。

### 論点 (補足) 4: 既存ファイルパスの実在確認

spec.md は以下を前提とするが、Phase 1 実行時に Grep / Read で実在を必ず確認する。

| 想定パス | 用途 | 確認方法 |
| --- | --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | G1-1 編集対象 | `find apps/web/src -name "AdminSidebar*"` |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | G1-2 編集対象 | `find apps/web/src -name "MemberDrawer*"` |
| `apps/web/app/(admin)/admin/tags/page.tsx` | `focusMemberId` 受け側（既実装） | `grep -r "focusMemberId" apps/web/app` |

実在しない場合は近接パスを探索し、`outputs/phase-01/requirements.md` に確定パスを記録する。Phase 2 以降は確定パスのみを参照する。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | 親 workflow `ui-prototype-alignment-mvp-recovery` の Phase 1〜3 成果物 | 19 routes scope / 4 不変条件 / 正本順位を継承 |
| 上流 | `docs/00-getting-started-manual/claude-design-prototype/` | デザイン言語正本（logo block sizing / spacing） |
| 上流 | `apps/web/src/styles/tokens.css` / `design-tokens.md` | OKLch token 正本（HEX 直書き禁止） |
| 連携 | 既存 `apps/web/app/(admin)/admin/tags/page.tsx` の `focusMemberId` searchParam | UI 側からの link 追加のみ。page 側改修なし |
| 連携 | 既存 Playwright admin smoke test | link 追加に伴う assertion 更新が必要かを Phase 7 で判定 |
| 対象外 | `apps/api` 配下 | 改変なし |
| 対象外 | D1 schema | 改変なし |
| 対象外 | Google Form schema | 改変なし |
| 対象外 | 公開 / 会員画面の動線 | 本タスク範囲外 |

## 価値とコスト評価

- **初回提供価値**: admin 運用者が公開ホームへ即座に戻れる / 会員詳細から該当会員の tag 管理画面へ 1 クリックで遷移できる。両改善とも spec.md 確認済みのユーザペイン。
- **初回に払わないコスト**: 新規 primitive 追加、新規 API endpoint、D1 schema 変更、design token 追加、Playwright base URL 変更。
- **設計コスト**: Phase 02 成果物 3 件 + Phase 03 レビュー 1 件 = 4 ドキュメント。
- **実装コスト見積（Phase 4 以降）**:
  - `AdminSidebar.tsx` 編集 約 10〜20 行
  - `MemberDrawer.tsx` 編集 約 10〜20 行
  - `AdminSidebar.component.spec.tsx` 更新 約 60 行
  - `MemberDrawer.spec.tsx` 新規 約 80 行
  - Playwright smoke 更新 約 10 行
- **運用コスト**: なし（追加 secret / cron / D1 一切なし）。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | admin 運用者の動線欠落（ホーム戻り / tag 管理遷移）を解消できるか | PASS | — |
| 実現性 | 既存 API / D1 / token 不変のまま UI 側のみで実装可能か | PASS | `/admin/tags` page の `focusMemberId` 既実装が前提（Phase 1 で実在確認） |
| 整合性 | OKLch token / プロトタイプ正本 / test suffix ルール / encodeURIComponent 不変条件と整合するか | CONDITIONAL | Phase 2 設計で OKLch CSS var のみ使用・`*.spec.tsx` のみ使用・encode 徹底を関数レベルで明文化することで解消 |
| 運用性 | a11y (`aria-label`, `focus-visible`, keyboard) を担保しつつ既存 admin smoke を破壊しないか | CONDITIONAL | Phase 2 で a11y 要件を JSX レベルで固定 / Phase 7 で smoke assertion 更新方針を明文化することで解消 |

## 既存資産インベントリ

| 資産 | 確認結果（Phase 1 実行時に Grep で再確認） | 参照 |
| --- | --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 想定パス。Phase 1 で `find` 実在確認必須 | spec.md 4.1 章 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 想定パス。Phase 1 で `find` 実在確認必須 | spec.md 4.2 章 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | `focusMemberId = sp["memberId"]` 既実装（spec.md 4.2 章 line 36 引用） | spec.md 4.2 章 |
| `apps/web/src/styles/tokens.css` | OKLch token 正本。`--ubm-color-accent` / `--ubm-color-border-default` 使用可 | CLAUDE.md / task-09 |
| `docs/00-getting-started-manual/claude-design-prototype/` | プロトタイプ正本。logo block の sizing / spacing 参照 | CLAUDE.md UI alignment 章 |
| 既存 Playwright admin smoke | `apps/web/playwright/tests/admin-pages.spec.ts`（spec.md で言及・実在は Phase 1 で確認） | spec.md 7.2 章 |
| lefthook `block-test-suffix` / GH Actions `verify-test-suffix` | `*.test.{ts,tsx}` を reject。新規 test は `*.spec.{ts,tsx}` のみ | CLAUDE.md 不変条件 8 |

## スコープ確定

### 含む

- `AdminSidebar.tsx` への logo Link 追加（`href="/"`, `aria-label="ホームに戻る"`, OKLch token styling）
- `MemberDrawer.tsx` への tag link 追加（`/admin/tags?memberId=${encodeURIComponent(memberId)}`）
- `AdminSidebar.component.spec.tsx` 更新 / `MemberDrawer.spec.tsx` 新規（Vitest + RTL）
- Playwright admin smoke test の link 動線 assertion 追加（必要に応じて）
- a11y（`aria-label`, `focus-visible`, keyboard Tab→Enter）対応
- Phase 11 VISUAL evidence スクリーンショット 2 枚

### 含まない

- 新規 API endpoint
- `apps/api` 配下の改変
- D1 schema 変更
- design token 新規追加
- 新規 primitive 生成
- 公開 / 会員画面の動線変更
- `/admin/tags` page 側 `focusMemberId` 改修

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-7 を Phase 1 で正式承認する。

- AC-1〜AC-5 → Phase 2 各成果物に対応
- AC-6 → Phase 3 design-review に対応
- AC-7 → Phase 4 task-breakdown / critical-path に対応

## 用語集

| 用語 | 意味 |
| --- | --- |
| G1-1 | admin sidebar logo→`/` 戻り動線追加（spec.md 4.1 章） |
| G1-2 | members drawer→`/admin/tags?memberId=` link 追加（spec.md 4.2 章） |
| logo block | sidebar 上部の「ホームに戻る」link 要素。文字列 or SVG。`aria-label="ホームに戻る"` 必須 |
| focusMemberId | `/admin/tags` page の searchParam で、tag 管理画面開時に focus 対象 member を指定する key（既実装） |
| OKLch token | `apps/web/src/styles/tokens.css` で定義された CSS 変数。`--ubm-color-accent` 等。HEX 直書き禁止 |
| primitives | プロトタイプの再利用コンポーネント群（`docs/00-getting-started-manual/claude-design-prototype/`） |
| spec suffix | 新規 test ファイルは `*.spec.{ts,tsx}` のみ使用。`*.test.*` は CI で reject |

## 実行タスク

- [ ] 原典 spec `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` を読み込み、G1-1 / G1-2 仕様を本 Phase に反映する
- [ ] `find apps/web/src -name "AdminSidebar*"` で `AdminSidebar.tsx` の実在確認・確定パスを記録する
- [ ] `find apps/web/src -name "MemberDrawer*"` で `MemberDrawer.tsx` の実在確認・確定パスを記録する
- [ ] `grep -r "focusMemberId" apps/web/app` で `/admin/tags` page 側の searchParam handling 実装を確認する
- [ ] `apps/web/public/` 配下の既存ロゴアセットの有無を確認（論点 1 (A)/(B) 判定材料）
- [ ] 真の論点 3 点（+ 既存ファイルパス確認）を Phase 1 で明文化する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を Phase 2 へ申し送る
- [ ] 既存資産インベントリを実 grep 結果で更新する
- [ ] artifacts.json metadata の `visualEvidence` を `VISUAL` に固定する（Phase 11 スクリーンショット必須化）
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 原典 spec |
| 必須 | docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md | 親 workflow scope |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | G1-1 編集対象（実在確認必須） |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | G1-2 編集対象（実在確認必須） |
| 必須 | apps/web/app/(admin)/admin/tags/page.tsx | `focusMemberId` 既実装 |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | design token 正本 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/ | プロトタイプ正本 |
| 必須 | CLAUDE.md | 不変条件 / test suffix / branch 戦略 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（真の論点 3+1・既存資産・4条件評価・スコープ・AC・用語集） |

## 完了条件

- [ ] 3 つの真の論点（+ 既存ファイルパス確認）が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-7 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが実 grep / find 結果で更新されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] **artifacts.json metadata の `visualEvidence` が `VISUAL` に固定されている**
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（既存ファイル不在 / ロゴアセット不在 / `focusMemberId` 既実装と仕様差分発見）を Phase 2 申し送り事項に含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜3 の Phase 1 候補案を Phase 2 設計の前提として固定
  - 既存ファイル確定パス（Phase 1 実 find 結果）を Phase 2 のコード参照に転記
  - CONDITIONAL 解消条件 2 件（token / a11y）を Phase 2 で具体化
  - `visualEvidence=VISUAL` をすべての Phase 成果物に通底させる
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / 既存ファイル実在未確認 / `visualEvidence=VISUAL` 未固定 の場合は Phase 2 に進まない

---

**作成日**: 2026-05-15
