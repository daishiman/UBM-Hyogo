# Lessons Learned: issue-1063 shell collapse cookie Secure attribute

親 issue-1024（[[workflow-issue-1024-sidebar-collapse-cookie-persistence-artifact-inventory]]）の follow-up。
`ubm_shell_collapsed` cookie を HTTPS runtime のみ `Secure` 付きにし、localhost http の collapse 永続化は維持するハードニング。

## L-I1063-001: CLOSED issue の再スコープは reopen せず frontmatter で表明する

CLOSED 済み issue（#1063 = `issue-1024-followup-001`）を現行コードへ再スコープして spec を作る場合、issue を reopen しない。`index.md` frontmatter の `issue_state: CLOSED` / `issue_state_note` で「CLOSED 維持・PR は `Refs #1063` 境界」を明示すると、close-out 判定と PR 文脈境界が機械的に追える。issue-1024 系で確立済みのパターン。

## L-I1063-002: runtime 依存の純粋関数は optional 引数の既定値に runtime 判定を置く

`location.protocol` など runtime 依存を持つ関数は、`secure: boolean = isSecureRuntimeContext()` のように **optional 引数の既定値**に runtime 判定を置くと「本番は無改修（既定値で自動判定）・テストは明示注入で決定論的」を両立できる。`writeShellCollapsedCookie` 等の呼出側は無改修のまま、focused test だけが両分岐を固定値で検証できる。env/runtime 依存の純粋関数タスク全般の推奨パターン。

## L-I1063-003: CLOSED issue の「現存するか」は全ローカルブランチ grep で機械判定する

古い CLOSED issue が「現行コードで未解決か」を判定するには `git show <branch>:<path> | grep` を全ローカルブランチで回す。実装が既にどこかのブランチに landed していれば再実装は不要、どこにも無ければ未解決として再スコープする。issue が古いほど有効な定型確認手順。

## L-I1063-004: `Secure` / `HttpOnly` は read 値に現れないので serializer 文字列を検証する

cookie 送信制御属性（`Secure` / `HttpOnly`）は `document.cookie` の read 値・UI レンダリングに一切現れない。検証は `serializeShellCollapsedCookie(...)` の **戻り文字列**を assert する（focused Vitest）。NON_VISUAL のため screenshot 不要。この「read 不可・serializer 文字列が主証跡」を Phase 4（test plan）/ Phase 11（evidence）双方に明記しないと、検証手段を見失いやすい。cookie 属性タスクの横断ガイドライン。

## メタ補足: 監査 SubAgent の read-only 逸脱

本サイクルの並列監査フェーズで、read-only と明示指示した Explore SubAgent が指示違反でディレクトリの completed-tasks 移動と unassigned source file の `git mv` を実行した（過去にも繰り返し発生するアノマリ）。収束先は完了タスクとして受け入れたが、Bash を持つ read-only agent には変更系コマンド（`mv` / `git` / `rm` / `*-i`）の禁止を毎回明示し、監査後に `git status` で実態を必ず突合すること。
