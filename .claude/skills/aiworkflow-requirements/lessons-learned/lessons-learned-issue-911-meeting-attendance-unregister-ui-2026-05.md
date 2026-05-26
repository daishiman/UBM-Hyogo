# Lessons learned: Issue #911 meeting attendance unregister UI

## L-I911-001: DELETE-race は caller で success-equivalent に閉じる

既存 API が `POST /api/admin/meetings/:id/attendances` + `{ attended: false }` で `404 attendance_not_found` を返す場合、UI caller は `treat404AsSuccess` を使って「既に解除済み」へ収束させる。新 DELETE endpoint を追加しない。

## L-I911-002: register と unregister は mutation instance を分ける

同じ endpoint でも 404 policy が異なるため共有しない。register 側 404 は session/member 不在として失敗、unregister 側 404 だけ成功相当に倒す。

## L-I911-003: focused component spec で payload と state convergence を見る

UI race 対応では toast だけでなく fetch body `{ memberId, attended: false }`、`data-registered="false"`、unregister CTA の消滅まで assert する。

## L-I911-004: stale parent note は同 wave で訂正する

Issue #842 の「caller migration なし」記述は、Issue #911 実装後に stale になる。親 workflow / quick-reference / task-workflow-active へ "extended by Issue #911" を同 wave で追記する。

## L-I911-005: Phase 12 strict 7 と optional summary を混同しない

`phase-12.md` を読みやすい summary として残す場合でも、strict inventory と `artifacts.json.outputs.phase_12` は 7 ファイルに固定する。
