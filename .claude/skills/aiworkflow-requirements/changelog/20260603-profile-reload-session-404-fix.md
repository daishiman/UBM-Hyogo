# 2026-06-03 profile-reload-session-404-fix implementation sync

## Summary

`docs/30-workflows/profile-reload-session-404-fix/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として aiworkflow-requirements skill へ同期。`/profile` リロード時の `GET /me` 404 生エラーバナーを、API trailing-slash 308 正規化 middleware（T01）・web BFF proxy 空 path URL 修正（T02）・`/profile` の `MEMBER_SESSION_404` 再ログイン CTA + `SectionError` action props 拡張（T03）で解消した実装の正本記述。

## Changed

- 新規 `lessons-learned/lessons-learned-profile-reload-session-404-fix-2026-06.md`（L-PRFR-001〜005）: ハンドラに分岐が無いのに返る 404 はルート解決層を疑う / contract テストがマウント+middleware をバイパスする盲点 → フルアプリ・マウント統合テスト / BFF proxy 空 catch-all path の末尾スラッシュ非生成 / SC 直叩き構成の 404/401/5xx 写像分離と生 message 非露出 / 正規化は middleware 308（OPTIONS・root 除外）。
- `references/lessons-learned.md` hub に上記 lessons へのエントリ行を追加。
- `references/workflow-profile-reload-session-404-fix-artifact-inventory.md`（新規）に canonical / state / implemented targets / tests / verification boundary / notes を登録。
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` に profile-reload-session-404-fix エントリを追加。
- `indexes/topic-map.md` / `indexes/keywords.json` は `pnpm indexes:rebuild` で後段再生成。

## Invariants

`/me` レスポンス shape / path、D1 schema、Google Form 仕様、memberId URL 露出は不変。web は D1 直接アクセスせず API Worker proxy のみ。新規 endpoint / 新規 primitive / 新規公開型は無し（`SectionError` props の optional 追加のみで後方互換）。

## User-gated boundary

staging authenticated `/profile` session-404 banner runtime screenshot、commit、push、PR は user-gated。focused Vitest（API 9 / web 16 PASS）・static UI contract screenshot・`pnpm typecheck`・`pnpm lint` は本 wave で実行済み。
