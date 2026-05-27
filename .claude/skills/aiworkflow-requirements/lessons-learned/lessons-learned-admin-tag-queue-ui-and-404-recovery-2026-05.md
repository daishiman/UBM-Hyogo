# Lessons Learned: admin-tag-queue-ui-and-404-recovery (2026-05-27)

`/admin/tags` のプロトタイプ整合 (page-head / Breadcrumb / count chips / TagQueuePanel grid+sticky)、`AdminSectionError` への 401/403/404/5xx recovery hint 追加、`fetchAdmin()` non-production 404 診断ログを同 wave で実装した際の苦戦箇所と再現用パターン集。次回の同類タスク（admin 系 page-head 適合 + section error 改良 + server fetch 観測強化）で最短化する。

## L-ATAGUI-001: ADMIN_FETCH_404 の原因切り分けは「route / base-url / deploy」の 3 軸で operator-facing hint を出す

実装前は `ADMIN_FETCH_404` は code 表示のみで、operator は「実装バグ」「API 未デプロイ」「INTERNAL_API_BASE_URL の向き先ズレ」のどれを疑えばよいか判断できなかった。`HINT_BY_CODE` に「API に到達できません / INTERNAL_API_BASE_URL の向き先、または内部 API Worker の最新デプロイを確認してください」を入れ、operator が最初に確認すべき 2 点を hint 本文で固定した。

**Why:** Cloudflare Workers 構成では 404 は app code バグではなく、(1) Next.js の route mismatch、(2) `INTERNAL_API_BASE_URL` の向き先誤り、(3) `apps/api` の deploy 遅延 のいずれかが原因のことが多い。code 表示だけでは operator は code grep に走ってしまい、env / deploy の確認に到達するまでに時間がかかる。

**How to apply:** admin 系 section error code を追加するときは、必ず「operator がその場で確認できる recovery action」を hint 本文に入れる。code 名（例: `ADMIN_FETCH_404`）と code-search への動線だけにしない。`ADMIN_FETCH_5\d\d` の正規表現で 500/502/503 をまとめて env-secret 確認に倒すパターンも併用する。

## L-ATAGUI-002: non-production 404 のデバッグログは `{host, path, status}` の 3 フィールドに限定する

`fetchAdmin()` の 404 診断ログで `Cookie` / `Authorization` / request body / `INTERNAL_API_BASE_URL` 全文 を出すと、staging tail やローカルログから secret が漏れる。`new URL(resolveApiBase()).host` で host だけ取り出し、`path` と `status` だけを `console.warn` に渡す形にし、`process.env.NODE_ENV !== 'production'` で本番を完全に抑止した。

**Why:** 404 で最も知りたいのは「どこに対して」「どのパスで」「何が返ったか」の 3 点であり、認証ヘッダや body は再現には不要。逆にこれらを出すと incident response 時にログ全削除が必要になり、観測性が逆に下がる。production 抑止は wrangler tail の信号量を保つためにも必須。

**How to apply:** server-fetch 系の診断ログを足すときは (1) `NODE_ENV !== 'production'` で gate、(2) `URL.host` だけ取り出し full URL を出さない、(3) request header / body を含めない、(4) `try/catch` で host parse 失敗を `<invalid>` に倒し fetch 例外を増やさない、の 4 点をテンプレ化する。`apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` の env spec を雛形に置く。

## L-ATAGUI-003: admin page-head + Breadcrumb + count chips + Panel は 4 ブロックで揃え、Panel は既存 primitive のみで再構成する

`/admin/tags` をプロトタイプに合わせるとき、新規 primitive（StatusChipRow / QueueGrid 等）を作りたくなったが、`Avatar / Button / Card / Chip / EmptyState / Icon` の既存 primitive 6 種だけで grid 2 カラム + sticky review panel が組めた。`TagQueuePanel` の props 契約（`initial / filter / focusMemberId`）と data-testid（`admin-tag-queue-list` / `admin-tag-review-panel`）は維持し、再 mount 不要にした。

**Why:** admin-ui-prototype-alignment 系の Task C/D で確立した「page-head / palette literal の token 化 / primitive 二重 h1 抑止」の規律と整合する。新 primitive を生やすと token / visual baseline / structure gate の 3 系統で追従コストが線形に増える。

**How to apply:** admin 系 page を prototype に合わせるときは、まず page-head + Breadcrumb + 状態 chip 行 + メイン Panel の 4 ブロック分解を試す。Panel 内の繰り返し UI は既存 primitive の合成で表現できないか必ず先に確認。props 契約と data-testid を維持すれば、focused component spec の再書き直しを避けられる。

## L-ATAGUI-004: workflow_state が `implemented_local_runtime_pending` のときは「未タスク = 0」と「staging visual = Phase 11 の user-gated boundary」を明示的に切り分ける

unassigned-task-detection.md で「No new unassigned task」と書くとき、staging visual screenshots の pending を「未タスク」に分類してしまうと、Phase 11 evidence の user-gated boundary との二重管理になり、後で「screenshot が follow-up task になっているのか workflow 内 boundary なのか」が判別できなくなる。本タスクでは「staging visual は本 workflow の Phase 11 user-gated boundary、別 backlog ではない」と detection 本文に明記した。

**Why:** Phase 12 の unassigned-task は「本 cycle で扱わず別 workflow に切り出す残課題」の表現であり、本 workflow 内で完結する user-gated step（commit / push / PR / staging deploy / staging visual capture）は対象外。両者を混ぜると completed-tasks 移動時に followup issue 数が水増しされる。

**How to apply:** unassigned-task-detection.md の Rationale には (a) 本 cycle で実装した項目を箇条書き、(b) staging/runtime user-gated は本 workflow Phase 11 boundary であり別 backlog ではない、の 2 段で書く。`workflow_state: implemented_local_runtime_pending` を取るときは必ずこの切り分けを入れる。

## L-ATAGUI-005: `outputs/artifacts.json` と root `artifacts.json` の parity は `cmp -s` で機械検証可能な形にする

artifacts.json は root と `outputs/` 配下の 2 箇所にミラーされる。差分があると `gate-metadata:validate` が両方 ERROR で落ちる。手で diff を見るより `cmp -s <root> <outputs>` を Phase 12 system-spec-update-summary.md の Validation command として固定する方が再現性が高い。

**Why:** 同じファイルを 2 箇所に置く設計は drift 必発で、人間レビューに任せると Phase 13 直前に発覚する。`cmp -s` は終了コードだけ返す silent diff で、CI / pre-commit に組み込みやすい。

**How to apply:** workflow を作成するとき、system-spec-update-summary.md の最後に `cmp -s` コマンドを必ず書く。CI 側で `gate-metadata:validate` が両方の `evidence_path` 物理存在 + status 整合を見るので、`cmp` parity と組み合わせれば 2 箇所 mirror の drift は実質ゼロにできる。
