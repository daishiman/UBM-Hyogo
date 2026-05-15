# lessons-learned: parallel-08 Shared Foundation / Admin UI Foundation 苦戦箇所（2026-05-15）

> 対象タスク: `docs/30-workflows/completed-tasks/parallel-08-shared-foundation-admin-ui-foundation/`
> 状態: `implemented_local_evidence_captured` / `implementation_complete_pending_pr` / `implementation` / `NON_VISUAL` / `standard` / Phase 1-12 completed / Phase 13 pending_user_approval
> 出典: `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` / `outputs/phase-11/{main.md,evidence/*.log}`
> 関連: serial-05/step-01 (real `useAdminMutation` 実装), invariants #11 / #13 (Admin API client contract), parallel-08 AC-7 (API error parser interop)

ToastProvider root scope を pin し、`useAdminMutation` を sentinel skeleton として先行投入したうえで、serial-05/step-01 への引き渡し境界を Phase 12 で確定させた wave。NON_VISUAL workflow を「screenshot 省略しつつ evidence は完収する」運用に整える苦労、shared foundation の `new` を `existing-hardening` に再分類する判断、API error 形状を「inventory」止まりに留めて global 統一は別 wave に逃がす scope 制御、をそれぞれ短時間で再現できるよう固定する。

## L-PARALLEL-08-001: Phase 12 strict 7 と Phase 11 evidence gate の境界が文章上で混在しがち

**苦戦箇所**: `phase-12.md` の本文で Phase 11 evidence の事前 check と Phase 12 strict 7 の存在 gate が同一段落に混じり、compliance check の実測で「どちらの drift か」を分離するまで原因が読めなかった。phase12-task-spec-compliance-check.md で「7 件 + 6 件」を別 table に分離して並べ直すと drift = 0 を一発で示せる構造に落ち着いた。

**5分解決カード**: Phase 12 compliance check は **2 table 構造** を最初から固定する: ①Phase 12 strict 7 path existence ②Phase 11 evidence path existence。各 table は `expected_path / found / size_bytes` の 3 列に揃え、phase-12.md 本文の説明は 2 table への前置きだけに留める。検出 script は `outputs/phase-{11,12}/` を別 glob で走らせ、強制的に table を分離する。

**promoted-to**: `task-specification-creator/references/phase12-compliance-check-template.md`, `task-specification-creator/references/phase-template-phase12-detail.md`

## L-PARALLEL-08-002: ソース spec の path 誤記は Phase 1 topology 実測でしか潰せない

**苦戦箇所**: 上流 spec (`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`) に `apps/web/app/(admin)/error.tsx` と記載されていたが、実体は `apps/web/app/(admin)/admin/error.tsx`。Phase 1 で repo topology を実測しなければ Phase 6 以降に stale path のまま実装が進行する事故が起きていた。Phase 12 documentation-changelog で記録し、Phase 1-11 の実装は正しい path を使い分けた。

**5分解決カード**: Phase 1 は **必ず `fd / rg` で実 path を列挙してから outputs/phase-01/main.md に書く**。上流 spec の path を直接コピーしない。差異が出たら documentation-changelog に「source spec drift」として記録し、上流 spec へは Phase 13 後の back-port task として `unassigned-task-detection.md` に積む（または 0 件理由として記す）。`apps/web/src/app` のような stale alias path を本文に持ち込まない。

**promoted-to**: `task-specification-creator/references/patterns-success-implementation.md`, `references/architecture-admin-api-client.md`

## L-PARALLEL-08-003: NON_VISUAL Phase 11 は「screenshot 省略」と「evidence 収集」を別の意思決定として書き分ける

**苦戦箇所**: NON_VISUAL classification だと Phase 11 全体を「省略可」と読み違える事故が起きる。実際は screenshot だけ省略で、`typecheck / lint / test / build / grep-gate` の 5 evidence は通常通り収集する。phase-11/main.md でこれを「screenshots omitted / evidence collected」と 2 行で明示分離して以降、Phase 12 strict 7 の `phase12-task-spec-compliance-check.md` も Phase 11 evidence 6 file を validate に巻き込めた。

**5分解決カード**: NON_VISUAL workflow の Phase 11 outputs/main.md は **冒頭 1 行目に `Screenshots: omitted (NON_VISUAL)`、2 行目に `Evidence: collected — typecheck / lint / test / build / grep-gate`** を固定して書く。evidence ディレクトリは `outputs/phase-11/evidence/` に統一し、各 `.log` の先頭 5 行を main.md に link する。compliance check の Phase 11 evidence table は 6 件（main.md + 5 log）固定で expected_path を埋める。

**promoted-to**: `task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`, `task-specification-creator/references/non-visual-irreversible-task-rules.md`

## L-PARALLEL-08-004: API error 形状の global 統一は誘惑だが、まず inventory に留めて serial-05/step-01 互換性に scope を絞る

**苦戦箇所**: AC-7 を「API error shape 統一」と読むと、apps/api 側 endpoint 群の error envelope の global 統一まで膨らみそうになった。Phase 12 で scope を「現行 endpoint の error inventory + serial-05/step-01 の parser 互換性 (`AdminMutationError` 想定)」に絞り、global 統一は serial-05 の本実装 wave へ後送りした。AC-7 の wording を「inventory + parser interop」に狭義化したことで、parallel-08 内の差分は `useAdminMutation` の sentinel skeleton と type 契約に閉じた。

**5分解決カード**: shared foundation 系の「error 形状」「response envelope」「telemetry tag」を扱う AC は、初手で **inventory に留めるか、統一まで進めるか** を Phase 2 のスコープ確定で必ず決める。global 統一を選ぶ場合は AC の expected change を「契約 N 件すべての envelope 書き換え」と書き直し、Phase 11 evidence で N 件 grep を要求する。inventory に留める場合は AC を「現行 N 件の列挙 + interop 型のみ」に書き換え、本実装は次 wave 仕様にする (`unassigned-task-detection.md` への ticket 化)。

**promoted-to**: `task-specification-creator/references/spec-template-quality-gates.md`（存在しない場合は次回 promote）, `references/architecture-admin-api-client.md`

## L-PARALLEL-08-005: ToastProvider root scope と useAdminMutation contract は static invariant + primitives spec の二段で pin する

**苦戦箇所**: ToastProvider を `apps/web/app/layout.tsx` の root に置く判断と、`useAdminMutation` を `AdminMutationKind` のみ受け付ける sentinel として実装する判断は、コード上では 1 行差で容易に regression する。Phase 09 quality-report 段階では既存 smoke のみで担保していたが、Phase 11 review cycle で「root layout に ToastProvider が消えても気付かない」「endpoint string が受け付けられる回帰」が両方検出された。`static-invariants.runtime.spec.ts` で root layout の ToastProvider 存在を runtime invariant として固定し、`primitives.component.spec.tsx` に toast trigger / auto-dismiss / boundary を追加して二段で pin した。

**5分解決カード**: shared foundation の root-scope provider（ToastProvider / ThemeProvider 等）と sentinel hook（`AdminMutationKind` のような closed enum を引数に取る hook）は、**①static invariant 1 件 + ②primitives/component spec 1 件** の二段で必ず pin する。①は「import 文 + JSX 構造の AST 検査」または「runtime mount 後の DOM 検査」、②は「behavior (trigger / dismiss / context value memoization)」の責務分担。新規 provider を root に置くたびに static invariant を 1 行追加し、新規 sentinel hook を導入するたびに「endpoint string を渡すと TypeScript error になる」test を 1 件追加する。

**promoted-to**: `task-specification-creator/references/patterns-testing-and-implementation.md`, `references/architecture-admin-api-client.md`

---

## 関連 promotion targets（serial-05/step-01 引き継ぎ時の確認用）

- `references/architecture-admin-api-client.md` §3.4 (`useAdminMutation` sentinel contract)
- `references/workflow-parallel-08-shared-foundation-admin-ui-foundation-artifact-inventory.md`
- `references/task-workflow-active.md` parallel-08 行
- `changelog/20260515-parallel-08-shared-foundation-admin-ui-foundation.md`
