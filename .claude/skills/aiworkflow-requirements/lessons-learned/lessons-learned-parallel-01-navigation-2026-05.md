# Lessons Learned — PARALLEL-01-NAV admin navigation wayfinding（2026-05-15）

> task: `parallel-01-navigation`
> 関連 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md`、`docs/30-workflows/parallel-01-navigation-admin-wayfinding/`
> 関連 source: `apps/web/src/components/layout/AdminSidebar.tsx`、`apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`、`apps/web/src/features/admin/components/_members/MemberDrawer.tsx`、`apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`
> 関連 reference: `references/ui-ux-admin-dashboard.md` §2 / §4.3、`changelog/20260515-parallel-01-navigation-admin-wayfinding.md`、`LOGS/_legacy.md`

## 教訓一覧

### L-PNAV-001: Playwright local mock API 不整合時は authenticated screenshot を諦め、mock fallback PNG + DOM snapshot に切り替える

- **背景**: `/admin/tags?memberId=...` の wayfinding link 実装後、Playwright で real session を握って screenshot を取りに行ったが、local mock API `/admin/tags/queue` が 404 を返し SSR が membrane 状態のままで render しなかった。real authenticated screenshot は取得不可と判断し、mock fallback PNG + DOM snapshot に評価対象を絞った。
- **教訓**: VISUAL_ON_EXECUTION 系タスクでも、依存する admin API endpoint が mock 整備されていない場合は real screenshot を強行せず、`evidence/` 配下の取得方針（real / mock fallback / DOM snapshot）を Phase 1 で 3 値分岐として明示すべき。spec / PR summary / canonical-paths / unassigned-task-detection の 4 ファイルで evidence vocabulary を一致させる。
- **将来アクション**: 後続 admin wayfinding 系タスクは Phase 1 で `mock API readiness` 表（endpoint / mock 有無 / fallback evidence 種別）を作る。

### L-PNAV-002: 未定義 OKLch token を前提にしない — `tokens.css` の現状定義を Phase 3 で必ず diff 確認する

- **背景**: 初稿で `--ubm-color-link` / `--ubm-color-focus` を sidebar logo link と drawer link の hover/focus state に使う設計だったが、`apps/web/src/styles/tokens.css` には両 token が未定義だった。実装段階で `verify-design-tokens` gate に弾かれて気づき、`--ubm-color-accent` / `--ubm-color-border-default` に置き換えて撤回した。
- **教訓**: design token は「正本 spec に書かれているか」と「`tokens.css` に実在するか」が独立した 2 軸。spec の token 名を写経して新規 primitive に適用する前に、Phase 3 で `tokens.css` を grep して existence verify を入れる。
- **将来アクション**: spec template に「使用 token の `tokens.css` 行番号付き引用」セクションを必須化する。`verify-design-tokens` CI gate が fail する前に Phase 3 で潰す。

### L-PNAV-003: design token spec 正本 path は `09b-design-tokens.md` が正で、`08-...` を参照しない

- **背景**: spec 初稿で design token の参照先を旧 path `08-...` 系で書いていたが、現行の正本は `docs/00-getting-started-manual/specs/09b-design-tokens.md`。`task-08` 時代の慣性命名が混入していた。
- **教訓**: design tokens / typography / spacing 等の正本 spec は番号 rename を経るため、`docs/00-getting-started-manual/specs/` を `ls` してから引用する。`CLAUDE.md` の不変条件 #2 に「OKLch トークン正本」が明記されているが、ファイル番号は別途確認する。
- **将来アクション**: skill `references/ui-ux-admin-dashboard.md` の冒頭 frontmatter に design token spec の現行 path を bookmark として固定する。

### L-PNAV-004: Phase 12 validator は Part 見出しの存在のみで PASS するため、子節の内容 drift を検出しない

- **背景**: PARALLEL-01-NAV では Phase 12 strict 7 outputs を生成し validator も PASS したが、AdminSidebar `#### Navigation` ブロックを `ui-ux-admin-dashboard.md` の wrong 位置（state テーブル内）に挿入してテーブルを orphan させたまま PASS していた。validator は Part / 見出し階層の存在チェックだけで、テーブル連続性や section semantics を見ない。
- **教訓**: Phase 12 validator は「形式 PASS = 内容 PASS」を保証しない。reference 更新は手動 review で構造 diff を確認する。特に「テーブル直後に新規ブロックを挟むと残行が orphan する」典型 anti-pattern を patrol する。
- **将来アクション**: `task-specification-creator` Phase 12 への追加 audit として、references 編集 diff を「テーブル行が `|` で始まる連続行を跨いだ挿入を含むか」で grep する hook を検討。

### L-PNAV-005: VISUAL fallback 採用時は語彙を spec / PR / canonical-paths / unassigned-task-detection の 4 箇所で同期する

- **背景**: mock fallback PNG + DOM snapshot 方針を採用した際、PR summary では "mock screenshot"、canonical-paths では "fallback evidence"、unassigned-task-detection では "DOM snapshot only" と書き分けてしまい、後続の monitor が同じ実体を異なる evidence と認識した。
- **教訓**: VISUAL evidence の語彙は 1 つに正規化し、`evidence_kind: real | mock_fallback | dom_snapshot` のように enum 化する。PR summary / canonical-paths / unassigned-task-detection / spec の 4 ファイルで同じ enum 値を使う。
- **将来アクション**: skill template に `evidence_kind` enum を追加し、Phase 11 / Phase 12 の 4 ファイル横断で grep 整合 check を入れる。
