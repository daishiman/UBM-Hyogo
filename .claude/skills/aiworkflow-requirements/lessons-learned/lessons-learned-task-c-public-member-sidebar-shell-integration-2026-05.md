# Lessons Learned: Task C Public / Member Sidebar Shell Integration

## L-TASKC-001: route group 集約は実態調査後に user decision を固定する

- Symptom: 親 workflow skeleton は公開 6 route がすべて `(public)` 配下にある前提だったが、現行 codebase では `/`, `/privacy`, `/terms`, `/login` が root 直下だった。
- Resolution: Phase 1 で `元 skeleton の前提 / 実コードベースの実態 / 是正方針` を表にし、URL 不変 `git mv` による `(public)` 集約を選択済み方針として固定した。
- Guard: Phase 5 に移動対象、相対 import 深度補正、colocated spec 追従、URL 不変 smoke を明記する。

## L-TASKC-002: VISUAL task は source evidence と runtime pixel evidence を分離する

- Symptom: Task C は `SidebarShellServer` / `SidebarMobileTrigger` / `SidebarUserMenu` を mount する配線タスクで、Task A/B/E の shell primitive と layout 統合は同一サイクルで実装できる。一方、認証済みセッション・API Worker・D1 を含む production-equivalent screenshot は local source-level test だけでは代替できない。
- Resolution: workflow state は `implemented_local_evidence_captured / runtime_visual_pending` とし、focused vitest / typecheck / lint を local source evidence として固定する。Phase 11 には canonical screenshot names を残し、pixel capture と staging visual baseline は Gate-C user-gated runtime/release wave へ分離する。
- Guard: 「実装 pending」と「pixel screenshot pending」を混同しない。aiworkflow active ledger / quick-reference / artifact inventory は implemented-local と runtime-visual-pending を両方明記する。

## L-TASKC-003: route group `git mv` は移動セグメント数ぶんだけ相対 import 深度を補正する

- Symptom: `app/page.tsx` → `app/(public)/page.tsx`、`app/login/page.tsx` → `app/(public)/login/page.tsx` のように route group 1 段ぶん深くなると、`../src` 系の相対 import がすべて 1 段ずれる。深度を補正しないと typecheck は通っても解決先が別ファイルになり silent breakage を招く。
- Resolution: 移動後の各ファイルで「セグメント深度の増分 = 補正すべき `../` の数」を機械的に算出した。root 直下 `../src` → `(public)/page.tsx` で `../../src`、`(public)/privacy/page.tsx` のような 2 段深セグメントは `../../../src` と段階的に補正。colocated `_components/*` も同じ規則で `../../../` → `../../../../`。
- Guard: Phase 5 チェックリストに「移動ファイルごとの旧深度 → 新深度の差分表」を入れ、`tsc` だけでなく `static-invariants.runtime.spec.ts` の route path assertion (`app/login` → `app/(public)/login`) を同 wave で更新する。

## L-TASKC-004: 旧コンポーネント削除は dangling 参照 0 を grep gate で確定する

- Symptom: `PublicHeader` / `MemberHeader` を削除する際、layout だけでなく `profile/page.tsx` の複数 mount 箇所や colocated spec に参照が散在する。1 箇所でも残すと build 時に未解決 import で fail する。
- Resolution: 削除前に `grep -rn "PublicHeader\|MemberHeader" apps/web/src apps/web/app` で全参照を洗い出し、layout の `SidebarShellServer` 置換・`profile/page.tsx` の 2 mount 除去・component + spec 計 4 ファイル削除を 1 wave で実施し、最後に同 grep が 0 件であることを確認した。
- Guard: 「削除」タスクは削除実行 → 同 grep 再実行で 0 件確認まで 1 ステップとして扱う。spec 側 (`__tests__/*Header.spec.tsx`) の同時削除も忘れない。

## L-TASKC-005: shell primitive が依存する utility 変更は同一 in-scope として artifacts に列挙する

- Symptom: shell 配線本体（layout / route move / header 削除）に注目すると、`apps/web/src/lib/is-browser.ts` の `browserWindow` 追加や `tokens.css` の shell トークン、route path を検証する `static-invariants.runtime.spec.ts` の補正が「付随変更」として artifacts.json の `implementation_files` から漏れやすい。
- Resolution: `useSidebarState.ts` / `SidebarDrawer.tsx` が consume する `is-browser.ts`、shell が参照する `tokens.css`、移動を検証する runtime spec を in-scope と判定し、root / outputs 両 `artifacts.json` の `implementation_files` に parity を保って列挙した。
- Guard: 「mount するだけの配線タスク」でも、消費される utility / token / 不変条件 spec の変更は in-scope。artifacts の `implementation_files` は実 `git diff --name-only` と突き合わせて漏れを潰す。
