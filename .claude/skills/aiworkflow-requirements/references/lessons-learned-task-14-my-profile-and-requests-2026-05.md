# Lessons Learned: task-14 my-profile-and-requests (2026-05)

> Workflow: `docs/30-workflows/task-14-my-profile-and-requests/`
> Date: 2026-05-09
> State: `IMPLEMENTED_LOCAL_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / runtime_pending`

## L-TASK14-001: phase-9 仕様書 JSX 例の型と実 API 型の乖離

phase-9.md の例示 JSX は `PublishState = "public" | "member_only" | "hidden"` と `PendingRequest[]` 配列型を使っていたが、実 API (`/api/me/[...path]`) は `pendingRequests` を `{ visibility?: ..., delete?: ... }` のオブジェクト型で返す。仕様書の JSX 例をそのまま写経すると compile error になる。

- **Why:** 仕様書 JSX は中学生向け教育用 / アーキテクチャ説明として書かれており、実 API DTO の正本ではない。実 API の DTO 型は `apps/web/src/lib/api/me-types.ts` 側に存在する。
- **How to apply:** Phase 6/9 の例示コードは「概念整理用」と位置付け、Phase 4（データ設計）と実 `me-types.ts` を実装の正本とする。implementation-guide.md の Contract セクションに DTO 型を明示する。

## L-TASK14-002: 楽観的 UI からの撤退（server pending only）

`RequestActionPanel.tsx` は当初 `useState` で optimistic pending を保持し `router.refresh()` 完了まで自前 banner を出していたが、Server Component + revalidatePath 経路で server `pendingRequests` が来た瞬間に optimistic と server state が二重描画される race / stale が起きる。task-14 では optimistic pending を削除して `pendingRequests.visibility` / `pendingRequests.delete` のみを正本にした。

- **Why:** 申請は管理者承認まで意味を持たないため、UI が先回りして「申請済み」を表示すると会員に誤解を与える。server pending を単一情報源にすることで race を構造的に消せる。
- **How to apply:** 申請系（管理 queue 経由）の UI には optimistic pending を持たせない。送信後は `router.refresh()` で server から再取得し、表示は `pendingRequests` object 一本で判定する。RSC + 申請パターンの invariant として横展開する。

## L-TASK14-003: data-region selector は disabled / enabled 双方の section に必要

`RequestActionPanel.tsx` は `rulesConsent !== "consented"` のとき disabled 用 section を、それ以外のとき active 用 section を出し分ける。最初は active 側だけに `data-region="request-action-panel"` を付けていたが、disabled 分岐で selector が消えると task-18 regression smoke / e2e 側で「`data-region` 5 種ずらり」の存在 assertion が落ちる。

- **Why:** task-18 は OKLch tokens 適用と prototype 準拠の証跡として 5 selector の存在を `data-region` でアサートする。条件分岐で section が swap されても selector identity は維持しなければならない。
- **How to apply:** 同一意味の section を `if/else` で別 JSX に分けるとき、両方の section 要素に同じ `data-region` を付与する。disabled 状態を一級の UI state として扱い、selector を共有させる。

## L-TASK14-004: Dialog 純 UI 分離は今 wave で未達 — limitation 化を明記

phase-9 の設計目標として `VisibilityRequestDialog` / `DeleteRequestDialog` は「純 UI（描画と入力検証のみ）」とし、`fetchAuthed` / `router.refresh()` は parent client island（`VisibilityRequest.client.tsx` / `DeleteRequest.client.tsx`）が担当する分離が想定されていた。今 wave の実装は dialog 内に submit logic を残しており、純 UI 化は未達。Phase 12 の `implementation-guide.md` / `phase12-task-spec-compliance-check.md` に「current local dialogs still own submit side effects; pure UI split is not claimed as completed」と明示記録した。

- **Why:** 仕様目標と実装が乖離しているのに「完了」と claim すると後段の task-18 / task-19 primitive 抽出 wave で再爆発する。limitation を明示しておけば後続 wave で復旧契機を取り戻せる。
- **How to apply:** 純 UI 化未達は **followup unassigned-task として起票せず、Phase 12 limitation として埋め込む**。次回 dialog primitive 切り出し wave（task-19 系）で同時に解消する判断を docs に固定する。

## L-TASK14-005: `deriveBannerView` の優先順位（authGateState > publishState）

`PublicVisibilityBanner` は 4 状態（active+public / active+member_only / active+hidden / authGate exception）を表示するが、`authGateState` が `deleted` / `rules_declined` のときは `publishState` の値に関わらず exception banner を最優先で出す必要がある。逆順にすると「退会申請済みなのに『公開中』が併記される」など虚偽表示になる。

- **Why:** publishState は「会員一覧での見え方」、authGateState は「アカウント自体の状態」を表す異なる軸。アカウント停止系状態は会員一覧露出より優先されなければ会員に誤解を与える。
- **How to apply:** `deriveBannerView()` 内で `authGateState !== "active"` を先に分岐し、`active` のときだけ `publishState` 3 分岐に進む。CONST_006 として phase-2 / phase-9 / Phase 12 implementation-guide に明示する。
