# Lessons Learned: issue-902 members staging visual baseline (UT-DSF-07-FU-02)

`staging-visual` Playwright project の cover 範囲を 4 → 6 screens（`/members` 一覧 + `/members/[id]` 詳細）へ拡張した。public 動的ルートを baseline 対象に組み込むときに踏んだ落とし穴を、次回の同類タスク（例: admin 系 dynamic route の staging visual 追加、`/meetings/[id]` の visual 拡張）で最短化するための知見集。

## L-I902-001: 動的ルート（`[id]`）の staging visual は env-gated 代表 ID + `test.skip` の安全 fallback で組む

`/members/[id]` は `dynamic = "force-dynamic"` + `fetchPublicOrNotFound` の SSR fetch で、staging seed に代表 ID が確立されていない時期は 404 / NotFound 画面に化けて baseline 自体がガード画面に置換される flake 経路がある。`PLAYWRIGHT_MEMBER_DETAIL_ID` を env で渡し、未指定時は `test.skip(true, "...")` で安全停止するパターンを採用した。さらに `workflow_dispatch.inputs.staging_visual_member_detail_id` を `playwright-smoke.yml` に追加し、ops が dispatch 時に注入する経路に揃えた。

**Why:** 動的ルートを「いつでも green」にしようとして seed mutation を試みると、staging データに対する破壊変更を生み、他の visual project や smoke を巻き込んで連鎖 flake する。env-gated skip は「実行できる環境では実行、できない環境では未取得を明示」の境界を 1 行で確立できる。

**How to apply:** 動的ルートの staging visual を追加する場合は次の 3 点をセットで設計する。(1) spec 側で `process.env.X` を読み、未指定時は `test.skip(true, ...)`。(2) `playwright-smoke.yml` の `workflow_dispatch.inputs` に `X` を `required: false` で追加し、`env:` に渡す。(3) 仕様書 Phase 5 / Phase 11 evidence で「未取得 = `test.skip` の理由メッセージ」を成果物として認める。seed への代表データ投入や CI secret 注入は同タスクに混ぜず follow-up に切る。

## L-I902-002: staging baseline PNG の正本は CI ubuntu-latest 生成・macOS local 生成はコミット禁止

`-staging-visual-chromium-linux.png` が正本で、macOS で `--update-snapshots` を走らせて生成される `-darwin.png` をコミットすると、CI（ubuntu-latest）で fontconfig / sub-pixel rendering 差で pixel diff が出続けて baseline が永久に green にならない。`playwright-smoke.yml` で `workflow_dispatch` → `staging-visual` job が `update_snapshots` 入力で baseline PNG を生成 → `actions/upload-artifact` → download → commit の 2 段階フローを維持する。

**Why:** Playwright の snapshot 名は OS suffix を自動で付ける（`-darwin.png` / `-linux.png`）。local で生成したファイルは local snapshot として正常動作するため気付きにくいが、CI matcher は `-linux.png` を探すので、local 物が混じっても CI は無視する一方で git に残骸が積まれる。`.gitignore` で `*-darwin.png` を弾くか、Phase 13 commit gate で local OS suffix の混入を grep で fail させる方が確実。

**How to apply:** staging visual spec を追加するタスクの Phase 11 evidence は「playwright-list 出力（test 数の証跡）+ baseline は CI ubuntu-latest 生成待ち」を明示する。local PNG は evidence 配下にもコミットしない。コミット時の gate で `git diff --cached --name-only | grep -- '-darwin\.png$'` を fail 化するのが理想。本タスク内では evidence dir に `members-list/member-detail-staging-visual-chromium-linux.png` 2 枚を pending として inventory に記録するに留めた。

## L-I902-003: SSR fetch は `page.route()` で stub できない — staging baseline は client-side 動的 fetch のみ安定化対象

`/members` / `/members/[id]` は Cloudflare Workers 側で SSR fetch される（`apps/api` への internal fetch 含む）。Playwright `page.route('**/api/**', route => route.continue())` は browser-issued request のみインターセプトするので、Worker 内 fetch には届かない。stub したつもりで baseline を取ると、SSR 結果に基づくレンダリングが入った PNG が記録され、API 内容変動でいつでも diff が出る baseline になる。

**Why:** 「Playwright で API mock すれば baseline 安定化できる」は CSR / クライアント fetch 前提のメンタルモデル。SSR / Edge / Workers 環境では API は build-time / request-time に決まり、browser から見えるのは描画済み HTML のみで mock 介入点がない。staging visual は「OpenNext bundle の design system 描画（OKLch / `@layer` / rhythm / primitives）が local と等価か」を見るのが目的であり、API 内容の絶対値ではない。

**How to apply:** staging visual の Phase 2 design では (1) どの fetch が SSR で、どれが client-side か、(2) baseline 対象は描画パイプラインの何か、(3) flake 源は何か、を整理する。`page.route()` は client-side fetch（lazy-loaded panel、infinite scroll 等）の安定化に限定。SSR データ依存の flake は env-gated `test.skip`（L-I902-001）か、初期表示固定（filter 無し・1 ページ目・既定 density）で抑える。

## L-I902-004: workflow root rename と同 wave で `playwright-smoke.yml` の evidence path / job name と `artifacts.json.gates[].evidence_path` を直さないと gate-metadata が ERROR で落ちる

issue-902 は当初 `docs/30-workflows/issue-902-.../` で起こし、Phase 12 完了後 `docs/30-workflows/completed-tasks/issue-902-.../` へ `git mv` した。しかし (1) `playwright-smoke.yml` の `PLAYWRIGHT_EVIDENCE_DIR` と upload-artifact `path:`、(2) workflow 内ファイルの自己参照、(3) `artifacts.json` の `metadata.gates[].evidence_path`、(4) consumed unassigned task の `canonical_workflow:` が古いパスのまま残り、`gate-metadata:validate` が `evidence_path not found` で 4 件 ERROR を出した。

**Why:** workflow root rename は 「dir 移動 + skill ledger 更新（resource-map / task-workflow-active / inventory）」 までは reflex 化しているが、外側の YAML（CI workflow）と内側の自己参照（artifacts.json / 各 Phase doc 内 path 引用）は手作業 grep が必要で抜けやすい。`gate-metadata:validate` は `evidence_path` の物理存在を見るので、古いパスが残っていれば必ず落ちる。これは fail-fast として機能している。

**How to apply:** workflow root を completed-tasks へ移すときは、移動直後に次の 3 grep を必ず回す。(1) `grep -rln "<old-path>" docs/ .claude/ .github/`、(2) 結果に対し `sed -i '' 's|<old-path>|<new-path>|g'` を一括適用、(3) `mise exec -- pnpm gate-metadata:validate` を回して ERROR が 0 件であることを確認。`.github/workflows/*.yml` と consumed unassigned task の `canonical_workflow:` も対象に含めること（grep 範囲を `docs/` に絞ると見落とす）。
