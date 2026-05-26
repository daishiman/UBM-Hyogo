# Skill Feedback Report — task-specification-creator

## 苦戦箇所 lessons

### L-PUBHDR-001: async Server Component の RTL render 不可

**現象**: `PublicHeader` を直接 async 化したら `(public)/layout.spec.tsx` で `<PublicLayout />` の中に
入る `<PublicHeader />` が thenable を return し、`container.querySelector('[data-testid="public-shell"]')`
が `null` を返した。

**対処**: presentational component は sync を保ち、session 取得は `SessionAwarePublicHeader`（async wrapper）
に閉じ込め、layout.spec では `vi.mock` でその wrapper を sync に差し替える。

**汎化**: 既存 sync の presentational spec を壊さずに session/async 依存を加えるパターンとして、
**「sync presentational + async wrapper + vi.mock at boundary」** を標準パターンに昇格すべき。

### L-PUBHDR-002: HomePage が `(public)` route group 外

**現象**: `(public)/layout.tsx` のヘッダを差し替えても `app/page.tsx` には反映されない（HomePage は
`(public)` group 外の root segment）。

**対処**: `app/page.tsx` を個別に編集して `<SessionAwarePublicHeader />` を直呼びする。

**汎化**: Next.js App Router の route group `()` は URL に現れず layout 継承境界も変えないが、
**「root segment は group の layout に含まれない」** ことを task-specification-creator の
checklist（topology 設計時）に明記しておくと、wiring 漏れが減る。

### L-PUBHDR-003: `exactOptionalPropertyTypes` での name omit

**現象**: `currentUser = { memberId, name: session.name }` だと `session.name` が undefined のとき
`name?: string` に `undefined` を代入できないエラー。

**対処**: `{ memberId: session.memberId, ...(session.name ? { name: session.name } : {}) }` で
spread omit する。

**汎化**: optional prop に undefined を入れたくない場合の標準形として spec の examples に追記すべき。

## 改善点なし項目

- Phase 1-13 構造 / artifacts.json schema / gate-metadata 検証は機能した
- `implementation_mode: "verify_existing"` の Phase 5 「diff check モード」は本タスクで有効活用できた

## skill 反映結果

`task-specification-creator/references/patterns-lessons-and-pitfalls.md` へ L-PUBHDR-001..003 を same-wave 反映済み。
