# Lessons Learned — mypage-prototype-alignment（2026-05）

`docs/30-workflows/mypage-prototype-alignment/` ワークフローで、prototype `MyProfilePage` JSX を既存 `/profile` route（`apps/web/app/profile/`）へ整合させた `implemented_local_evidence_captured / implementation / VISUAL / existing-ui-alignment` 実装の苦戦箇所を集約する。新規 API / D1 schema / Google Form schema / shared package 契約変更を一切伴わず、`apps/web` page-internal adapter（`_lib/`）と既存 endpoint 消費だけで prototype 視覚契約を満たす、という制約下で発生した型整合・MVP 不変条件遵守・visual evidence 取得経路の各論点が中心。

## L-MYPAGE-001: prototype `MyProfilePage` JSX と既存 `/me/profile` DTO の整合は shared package を変更せず page-internal `_lib/` で完結させる

- Symptom: prototype `MyProfilePage` は `displayName` / `subtitle` / `chips[]` / visibility 件数の 3 分類 (`public` / `member` / `admin`) を直接 prop として要求する一方、既存 `/me/profile` endpoint が返す `MemberProfileResponse.sections[]` は `stableKey` / `visibility` / `value` ベースの flat な field 列で、shape が一致しない。素直に合わせると `MemberProfileSection` 型 / `@ubm-hyogo/shared` zod schema / API contract のいずれかに新規 field を生やすことになり、不変条件「実フォーム schema をコードに固定しすぎない」「shared 契約を UI 都合で拡張しない」と衝突する。
- Root cause: prototype JSX は「すでに pickup 済みの view-model」を表現する層であり、Google Form schema をそのまま展開した DTO 層とは責務が違うのに、両者を 1 fetch shape で受け渡そうとした。
- Resolution: `apps/web/app/profile/_lib/visibility-counts.ts`（`deriveVisibilityCounts(sections)`）と `apps/web/app/profile/_lib/profile-summary.ts`（`pickProfileSummary(sections)`）を page-internal adapter として新設し、`MemberProfileResponse.sections[]` から view-model を派生させる。shared package には何も export しない（pure page-private adapter）。
- Why it matters: shared 契約を変更しない実装パスを 1 度確立すれば、他の page でも同 prototype-JSX 整合の局面で再利用できる。逆に shared に view-model 型を載せると Google Form 仕様変更時に shared と page 双方の追従が必要になり、MVP の「Google Form を正本とし schema fixity を最小化する」原則を壊す。
- How to apply in future: 「prototype JSX の prop shape ≠ 既存 endpoint DTO shape」のとき、まず `apps/web/<route>/_lib/` 配下の pure function で view-model を派生する経路を検討する。shared package 変更は最後の手段とし、shared を変える場合は API contract / zod / consumer 全件波及を artifact-inventory に必ず記録する。
- Related files: `apps/web/app/profile/_lib/visibility-counts.ts` / `apps/web/app/profile/_lib/profile-summary.ts` / `apps/web/app/profile/page.tsx` / `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/implementation-guide.md` / `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/system-spec-update-summary.md`

## L-MYPAGE-002: profile 編集 model は Google Form 再回答に統一し `PATCH /me/profile` を新設しない、fallback は `editResponseUrl ?? fallbackResponderUrl` の 1 行に閉じる

- Symptom: prototype には profile 値を編集する CTA があり、最短実装としては `PATCH /me/profile` のような mutation endpoint を新設するか、page 内で inline form を組んで partial update を送る案が浮かぶ。だが CLAUDE.md §重要な不変条件 7（「MVP では Google Form 再回答を本人更新の正式な経路とする」）に明確に反する。さらに `/me/profile` response の `editResponseUrl` は user-specific 再回答 URL で、未取得・期限切れ時に null になり得る。
- Root cause: prototype 視覚契約と MVP backend 契約の責務境界が、UI 設計時には明示されていなかった。CTA の link target を「内部 mutation か外部 Google Form か」で迷うと、UI 側が暗黙の API contract 拡張要求になる。
- Resolution: profile 編集 CTA は `<EditCta editResponseUrl={profileResponse.editResponseUrl} fallbackResponderUrl={profileResponse.fallbackResponderUrl} variant="inline" />` の 1 component に集約。link target は `editResponseUrl ?? fallbackResponderUrl` の nullish-coalescing で fallback。inline edit / partial update / 新規 mutation endpoint いずれも一切採用しない。
- Why it matters: 「prototype に inline edit があるか否か」ではなく「MVP 不変条件として Google Form 再回答が本人更新の唯一の正式経路か否か」で判断する原則を、CTA component の 1 props 構成で物理的に固定できる。fallback を 1 行（nullish-coalescing）で済ませることで、未取得時の white screen も回避できる。
- How to apply in future: 自己更新 / 自己編集の UI を prototype と整合させる前に、まず `docs/00-getting-started-manual/specs/` と CLAUDE.md §重要な不変条件のうち編集経路系条文を grep して mutation 採否を確定させる。`editResponseUrl` 系の per-response URL は常に `?? fallbackResponderUrl` 構成で書き、null branch を増やさない。
- Related files: `apps/web/app/profile/page.tsx`（EditCta 配置）/ `apps/web/app/profile/_components/EditCta.tsx`（想定）/ CLAUDE.md §重要な不変条件 7 / `docs/00-getting-started-manual/specs/01-api-schema.md`

## L-MYPAGE-003: `publishState="hidden"` 時は個別 `/members/{memberId}` link を無効化し accessible reason を提示、global `/members` link は `MemberHeader` で常時提示する

- Symptom: 自分の profile が `publishState="hidden"` のとき、個別 public profile page（`/members/{memberId}`）は他者からは見えず、本人が「自分の page を確認」する link としても無効。だが prototype の MemberHeader には「会員ディレクトリ」相当の global `/members` link が常時表示されている。両者を同じ条件で disable してしまうと、本人が公開ディレクトリ自体に到達できなくなる。逆に individual link を有効のままにすると 404 / `hidden` empty page にハマる。
- Root cause: 「個別 profile link」と「global ディレクトリ link」の責務を 1 hide フラグでまとめて扱おうとした。
- Resolution: individual `/members/{memberId}` link は `publishState === "hidden"` のとき disabled 状態にして、disabled の理由（公開状態が hidden のため自分の公開 page は表示できない旨）を accessible text（visually-hidden 含む）で同 region に置く。一方 `MemberHeader` の global `/members` link は publishState に依存せず常時 enabled とする。
- Why it matters: hidden 状態の本人体験は「自分の公開 page が見えない」だけで、「公開ディレクトリ全体に到達できない」ではない。a11y 観点でも disabled link は必ず disabled 理由を screen reader へ届ける必要がある。1 hide フラグで両方落とすパターンを取ると本人 UX も a11y も同時に劣化する。
- How to apply in future: 公開状態に紐づく link 群を一括 disable したくなったら、まず「個別 resource link」と「list / directory link」を分けて enable 条件を独立に定義する。disabled link には常に accessible reason を併記し、`aria-disabled` + visually-hidden text を component 契約に含める。
- Related files: `apps/web/app/profile/page.tsx`（individual link disable 判定）/ `apps/web/src/components/member/MemberHeader.tsx`（global directory link 常時提示）/ `apps/web/app/profile/_lib/visibility-counts.ts`

## L-MYPAGE-004: `ProfileFields` は `sections` のみ受け取り、inline edit CTA は `page.tsx` 側で sibling 配置して props drift を防ぐ

- Symptom: prototype JSX では profile fields のすぐ脇に inline edit CTA があり、最短経路では `ProfileFields` component に `editResponseUrl` / `fallbackResponderUrl` / variant など edit 系 props を生やす実装が浮かぶ。だが `ProfileFields` の責務は「sections を整列表示する」だけで、edit 系 props を抱えると同 component の他 callsite（admin preview など想定される再利用先）でも edit-aware になり、責務漏れが起きる。
- Root cause: 「同じ視覚位置にある UI」と「同じ component の責務」を取り違えた。
- Resolution: `ProfileFieldsProps` は `sections` only を堅持し、inline edit CTA は `page.tsx` 側で `ProfileFields` と sibling として配置する。CTA は L-MYPAGE-002 と同様 `EditCta` 1 component に閉じる。
- Why it matters: component props は責務単位で削るほど callsite が増えても props drift / breaking change が発生しにくい。視覚的に「セクション内側」に見える UI ほど、責務的には「page composition 層」に置くべきという経験則は再利用性が高い。
- How to apply in future: 「同じ box に見える」を理由に新規 props を生やしそうになったら、まず page composition 側で sibling 配置できるかを検討する。component の props 追加は責務拡大として artifact-inventory に明示記録する。
- Related files: `apps/web/app/profile/page.tsx`（CTA sibling 配置）/ `apps/web/app/profile/_components/ProfileFields.tsx`（`sections` only props）/ `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/implementation-guide.md` §エッジケース

## L-MYPAGE-005: Playwright 認証付き screenshot は member fixture で取得し Phase 11 直下 canonical 配置、commit/push/PR は user-gated に分離する

- Symptom: `/profile` は authenticated route のため、未認証の Playwright run では login redirect で空白の screenshot を撮ってしまう。さらに VISUAL workflow の Phase 11 evidence path は `outputs/phase-11/screenshots/<canonical-name>.png` の canonical 配置（implementation-guide.md §視覚証跡 表と一致）が要求される。一方 commit / push / PR は CLAUDE.md PR 作成フロー上 user-gated。
- Root cause: 認証経路（fixture）/ ファイル配置（canonical path）/ Git mutation（user gate）の 3 軸を分けて設計する習慣を最初に決めないと、screenshot 取得 run で fixture 経路を作りつつ commit まで一気にやってしまい、PR 文脈と evidence path の不整合が起きる。
- Resolution: Playwright member fixture（storageState 持ち）を再利用し、`profile-page-default.png` / `status-banner-public.png` / `visibility-summary.png` / `revalidate-modal-open.png` / `member-header-nav.png` の 5 枚を `docs/30-workflows/mypage-prototype-alignment/outputs/phase-11/screenshots/` 直下に canonical name で配置。implementation-guide.md §視覚証跡 表の path / status と完全一致させる。commit / push / PR は実行しない（user approval 後）。
- Why it matters: VISUAL workflow の evidence は「canonical filename」「canonical path」「present/pending status」の 3 点で artifact-inventory parity を取る必要がある。fixture 経路と evidence path を分けて設計することで、再 capture 時に他成果物を巻き込まずに済む。Git mutation の user gate を守ることで、PR を切るタイミングを user に委ねられる。
- How to apply in future: authenticated route の VISUAL evidence を取るときは、(1) Playwright fixture を先に整える、(2) capture 出力先を `outputs/phase-11/screenshots/<canonical-name>.png` に固定、(3) implementation-guide.md §視覚証跡 表と path を 1 対 1 で一致させる、(4) commit/push/PR は明示承認まで保留、の 4 ステップで分離する。
- Related files: `apps/web/playwright/` member fixture / `docs/30-workflows/mypage-prototype-alignment/outputs/phase-11/screenshots/profile-page-default.png` ほか 4 枚 / `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/implementation-guide.md` §視覚証跡

## L-MYPAGE-006: `deriveVisibilityCounts` は unknown `visibility` を ignore（破壊回避策）し、Missing summary stable key は empty string + empty chips で fail-open する

- Symptom: `MemberProfileSection.visibility` は現在 `public` / `member` / `admin` の 3 値だが、Google Form schema は将来拡張があり得る（CLAUDE.md §重要な不変条件 1「実フォームの schema をコードに固定しすぎない」）。unknown 値が出現したとき `deriveVisibilityCounts` で throw すると profile page 全体が error boundary に落ち、本人が自分の情報にアクセスできなくなる。同様に `pickProfileSummary` で `STABLE_KEY.fullName` / `STABLE_KEY.occupation` 系 stable key が欠落したとき throw すると同じ症状になる。
- Root cause: view-model 派生関数の error policy を「throw して上位で握る」と「ignore / empty で fail-open する」のどちらにするか、初期段階で決めずに書くと、不変条件 1 と衝突したまま実装が進む。
- Resolution: `deriveVisibilityCounts` は unknown `visibility` 値を switch default で **ignore**（count に加算しない / throw しない）。`pickProfileSummary` は missing stable key に対し empty string と empty `chips` 配列を返す。`editResponseUrl` missing は L-MYPAGE-002 通り `?? fallbackResponderUrl` で吸収。
- Why it matters: profile page は本人が自分の情報を確認する最後の window であり、Google Form schema 拡張で page 全体が落ちると MVP 体験が崩れる。「正しくない値は無視する」が破壊回避策（fail-open）として最も MVP 不変条件と整合する。逆に admin 系画面では同じ unknown 値を「検知して通知する」設計にする（責務が違う）。
- How to apply in future: schema fixity が低い source（Google Form / 外部 API）から派生する view-model 関数は、default branch を必ず明示し、`ignore` / `empty fallback` / `throw + boundary` のいずれかを JSDoc / コメントで宣言する。`MemberProfileSection.visibility` のような enum-like field は switch default で必ず ignore / unknown branch を持つ。
- Related files: `apps/web/app/profile/_lib/visibility-counts.ts` / `apps/web/app/profile/_lib/profile-summary.ts` / `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/implementation-guide.md` §エラーハンドリング / CLAUDE.md §重要な不変条件 1
