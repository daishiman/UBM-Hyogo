# Lessons Learned: profile-reload-session-404-fix

## Context

`/profile`（Server Component）リロード時に `fetchAuthed<MeSessionResponse>("/me")` が 404 を受信し、`SafeResult.ok === false` 分岐で `SectionError` に生 message（`fetchAuthed failed: 404`）を表示してマイページが利用不能になっていた。`GET /me` の正常系には 404 分岐が存在せず（`sessionGuard` は 401/410 のみ）、404 は Hono の `app.route("/me", sub)` + `sub.get("/")` で `GET /me/`（末尾スラッシュ）が `notFoundHandler` に落ちることに由来。加えて web BFF proxy が空 path 時に upstream `/me/` を生成する派生欠陥を持っていた。

T01（apps/api trailing-slash 308 正規化 middleware + フルアプリ・マウント統合テスト）/ T02（apps/web proxy 空 path 修正）/ T03（`/profile` 防御的 UX + `SectionError` CTA 拡張）の 3 タスクで、根本（ルート解決層）と表示（防御的 UX）を同一サイクルで閉じた。`/me` 契約・D1 schema・Google Form 仕様・memberId URL 露出は不変。状態は `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`。

## L-PRFR-001: ハンドラに 404 分岐が無いのに 404 が返るならルート解決層を疑う

| Field | 内容 |
| --- | --- |
| symptom | `GET /me` ハンドラは 200/401/410 しか返さない設計なのに、実機リロードで 404 が返り `/profile` が生エラーバナーになる。 |
| cause | 404 はハンドラ内ではなく、`app.route("/me", sub)` + `sub.get("/")` 構成で `GET /me/`（末尾スラッシュ）が route match を外れ `notFoundHandler` に落ちることに由来。すなわちルート解決層の問題だった。 |
| recurrence condition | サブアプリを `app.route(prefix, sub)` でマウントし、エンドポイントが `sub.get("/")` で定義されている全 Hono ルート。末尾スラッシュ付き URL が誰かによって生成されると再発する。 |
| 5-minute resolution | 「ハンドラに該当ステータスの分岐が無いのにそのステータスが返る」を観測したら、ハンドラ内部ではなく mount / 末尾スラッシュ / middleware 順などルート解決層を最初に疑う。 |
| evidence path | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-12/implementation-guide.md`（背景節） |

## L-PRFR-002: contract テストがマウントをバイパスする盲点 → フルアプリ・マウント統合テスト

| Field | 内容 |
| --- | --- |
| symptom | 既存 contract テストは PASS なのに実機で 404。テストでは再現しなかった。 |
| cause | contract テストがサブアプリ（`sub`）を直叩きしており、`app.route()` のマウントと `app.use("*", ...)` の middleware stack（trailing-slash 正規化を含む）をバイパスしていた。テストの観測面が実機の観測面と乖離していた。 |
| recurrence condition | middleware や mount 前処理が route handler の外側にあり、サブアプリ単体テストでは経路を通らない構成。 |
| 5-minute resolution | ルート解決層の回帰は「フルアプリ・マウント統合テスト」を標準にする。本 WF では `apps/api/src/__tests__/me-route-mount.integration.spec.ts` で root app を起動し `GET /me`=401 / `GET /me/`=308 / root=200 を middleware stack 込みで検証した。 |
| evidence path | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-12/skill-feedback-report.md`（ワークフロー観点） |

## L-PRFR-003: BFF proxy の空 catch-all path で末尾スラッシュを生成しない

| Field | 内容 |
| --- | --- |
| symptom | web proxy `/api/me/[...path]` が空 path（`/api/me`, path=[]）のとき upstream に `${api}/me/` を生成し、L-PRFR-001 の 404 を踏んでいた（派生欠陥）。 |
| cause | `${apiBase()}/me/${path.join("/")}` という素の string interpolation は path 空時に末尾スラッシュを残す。空配列ケースの条件分岐漏れ。 |
| recurrence condition | Next.js catch-all route の BFF proxy で `path.join("/")` を区切りなしに連結する全箇所。 |
| 5-minute resolution | `const tail = path.join("/"); const target = \`${api}/me${tail ? \`/${tail}\` : ""}${url.search}\`;` で空 path を明示制御。`route.route.spec.ts` に empty path と tail path 双方のケースを置く。 |
| evidence path | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-12/implementation-guide.md`（T02） |

## L-PRFR-004: SC が API を直叩きする構成では 404 と 401 の UX を写像分離する

| Field | 内容 |
| --- | --- |
| symptom | `/me` 404 の生 message（`fetchAuthed failed: 404`）がそのまま `SectionError` に露出し、利用者に意味不明な文字列を見せていた。 |
| cause | session loss（401）と route/resource 不在（404）を区別せず、非 2xx を generic error handler でひとまとめにしていた。semantic distinction の欠落。 |
| recurrence condition | Server Component が `fetchAuthed` で API を直接叩き、`SafeResult.ok === false` で error を描画する全画面。 |
| 5-minute resolution | safe fetch の code（本 WF では `MEMBER_SESSION_404`）で分岐し、404→再ログイン CTA（`actionHref="/login?redirect=/profile"`）、5xx→「時間をおいて再読み込み」（`retryHref`）、401→従来どおり `redirect("/login")` と写像を分離。raw message は描画せず固定文言に倒す。 |
| evidence path | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-12/implementation-guide.md`（T03 / エラーハンドリング） |

## L-PRFR-005: 正規化は層選択でブラスト半径最小の middleware 308 を選ぶ

| Field | 内容 |
| --- | --- |
| symptom | `/me/` → `/me` の同一化を「route 個別追加」「内部 rewrite」「middleware 308 redirect」のどの層で行うか、副作用範囲が異なり判断が難しい。 |
| cause | route 個別追加はエンドポイント数だけ保守コストが増え、内部 rewrite は副作用が読みにくい。抽象度の選択問題。 |
| recurrence condition | 複数エンドポイントを持つ Worker で URL 正規化ルールを横断的に効かせたい場合。 |
| 5-minute resolution | `app.use("*", trailingSlashRedirect())` を securityHeaders / corsFromEnv の後・route mount の前に 1 つ置く。308 は method/body を保持し Worker 間 fetch が追従するため契約を壊さない。`OPTIONS`（CORS preflight）と `/`（root）は除外する。 |
| evidence path | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-3/phase-3.md`（代替案 B/C 比較） |

## 横展開（起票しない別観点）

| 候補 | 今回スコープ外理由 |
| --- | --- |
| Auth.js JWT cookie chunk 対応 / JWT サイズ削減 | 現状再現（`/me/` 404）に直結する証跡が無い別観点。本不具合はルート解決層の末尾スラッシュ問題であり JWT サイズと独立。必要時に別 WF で扱う（`unassigned-task-detection.md` に候補記録のみ・起票しない）。 |
| staging デプロイ齟齬（旧 bundle 残存）の運用是正 | デプロイ操作は user-gated。本 WF の統合テスト + 末尾スラッシュ許容で再発検知/緩和する。 |

## 関連

- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-profile-reload-session-404-fix-artifact-inventory.md`
- 親 index: `.claude/skills/aiworkflow-requirements/references/lessons-learned.md`
