# Lessons Learned — defensive fallback による silent failure（i01 ToastProvider root mount, 2026-05-16）

> task: `i01-toastprovider-root-mount`
> 関連 workflow: `docs/30-workflows/completed-tasks/i01-toastprovider-root-mount/`
> 関連 PR: parallel-08 shared foundation (#745) merge 後の integration-fixes wave
> 関連実装: `apps/web/app/layout.tsx` / `apps/web/src/lib/admin/useAdminMutation.ts` / `apps/web/src/components/ui/Toast.tsx`
> 関連 skill 反映: `.claude/skills/aiworkflow-requirements/changelog/20260516-i01-toastprovider-root-mount.md`

## 背景

parallel-08 wave で `useAdminMutation` 契約を shared foundation として導入した際、Provider 未配置時に runtime error で fail-fast せず `useOptionalToast()` + `warnMissingToastProvider()` で console.warn にだけ降格する **defensive fallback** を採用した。意図は「Provider mount 前の partial adoption 期間でも consumer が壊れない」という移行容易性だったが、結果として **`ToastProvider` が root layout に mount されていない事実が typecheck / lint / unit test のいずれでも検出されない silent failure** に化けた。本 lesson はその検出経路と再発防止策を skill 側に戻すための記録。

問題が露呈した経路は次の通り:

1. parallel-08 PR (#745) merge までは `useAdminMutation` consumer が存在しなかったため fallback 経路は invoke されず、warn も出なかった。
2. parallel-09 / parallel-10 で consumer が増えた後も、開発者 console を実際に開く機会が少なく、warn は埋もれた。
3. integration-fixes wave で `apps/web/app/layout.tsx` を実 Read し、Provider が root に存在しないことが手作業 walk-through で初めて発覚した。

これらは「DoD 達成 = production runtime で動く」という暗黙の期待が崩れていた典型例である。

## 教訓一覧

### L-I01-001: defensive fallback は CI 静的検査の検出網を通過する

- **背景**: `useOptionalToast()` は context を optional 取得し、未配置時に `warnMissingToastProvider()` を呼び出して no-op fallback を返す設計。consumer 側の型は同一なので **typecheck PASS / ESLint PASS / unit test PASS** のままで、root layout への Provider mount 漏れが残った。unit test では Provider を wrapper として常に mount するため、Provider 未配置の path がそもそも test 経路に存在しない。
- **教訓**: defensive fallback を採用したコード経路は、**設計時点で「fallback 発火 = bug」である事実を CI gate で検出可能な形に落とす**こと。具体的には (a) production build で `warn` を `throw` に切替える build flag、(b) `app/layout.tsx` に対する grep gate（`<ToastProvider` の出現を required token として検査）、(c) Provider 未配置を再現する unit test 1 本を必ず追加し warn を `expect(console.warn).toHaveBeenCalledWith(...)` で assert する、の 3 経路のいずれかを必ず採用する。fallback を「やさしさ」として残すなら post-merge 検証ステップを必須化する。
- **将来アクション**: parallel wave で共通 Provider 依存の primitive を導入する際、Phase 1 scope に「root mount 検証経路」を必ず planning し、`verify-provider-mount` 相当の grep gate を `.github/workflows/` 配下に追加するか、integration-fixes 親 workflow を予約する。primitive 提供 PR の DoD checklist に「fallback 検出 gate の存在」を必須項目化する。

### L-I01-002: 並列 PR の DoD と「production runtime で動く」は別ゲート

- **背景**: parallel-08 PR は DoD（contract / unit test / lint / typecheck）を全て満たして merge された。merge 後の integration-fixes ワークフローで、実 grep（`rg -n 'ToastProvider' apps/web/app/`）と file-read による external 接続点検証を行ったところ、root layout に Provider mount が無いことが初めて発覚した。DoD 達成と production runtime 稼働の間に「root への wiring」という独立工程が挟まる事実が、DoD checklist 設計時に軽視されていた。
- **教訓**: 並列構成では **「shared primitive を提供する wave」と「consumer / root に mount する wave」が必ず別 PR** になる。前者の PR merge は「primitive が単体で動く」までしか保証せず、root への wiring が完了するまでは production runtime では未稼働。parallel wave 群を計画する段階で **integration-fixes 相当の closing wave を必ず明示**する（parallel-09 で確立した「shared primitive 提供 wave と consumer adoption wave を分離する」原則の延長線）。closing wave 不在で全 parallel wave を完了扱いにすると、本件と同じ wiring 漏れが必ず発生する。
- **将来アクション**: parallel orchestrator の Phase 1 scope template に「closing integration wave」を必須項目化する。closing wave 不在で全 parallel wave を closed にしない。`task-workflow-active.md` の parallel wave 行に closing wave へのリンクを field として持たせる。

### L-I01-003: silent fallback の検出は「実 grep + file-read」evidence でしか起きない

- **背景**: 本件の検出経路は、typecheck / lint / unit test のいずれでもなく、integration-fixes wave で `app/layout.tsx` を実 Read し `rg` で Provider mount を確認したという **静的 evidence の手作業 walk-through** だった。CI で自動検出できる構造になっていなかった。
- **教訓**: silent fallback を含む primitive は「runtime smoke でしか発覚しない」と高確率で結論されるが、実態は **「root layout の特定 token の有無」という静的 grep gate で十分検出できる**ケースが多い。runtime smoke を待つ前に grep gate 化の可否を先に検討する。
- **将来アクション**: `verify-provider-mount` 仮称 CI workflow を `.github/workflows/` に追加候補として `system-spec-update-summary.md` に記録する。required token 候補: `<ToastProvider`, `<SessionProvider`, `<QueryClientProvider` 等、root 一意 mount 必須 Provider 群。

### L-I01-004: `useOptionalToast` / `warnMissingToastProvider` 命名が fallback 経路の存在を hide する

- **背景**: `useOptionalToast` という命名は「optional に使える便利 hook」と読めてしまい、consumer 側のコードレビューで「これを使う = Provider 未配置でも OK」と誤読されやすい。実際は `warnMissingToastProvider` という補助関数とセットで「Provider 未配置時 console.warn fallback」を構成する設計だが、命名だけでは fallback 経路の存在が見えない。
- **教訓**: defensive fallback を提供する hook は **命名で fallback 経路の存在を明示**する（例: `useToastOrWarn`, `useToastWithSilentFallback`）。`Optional` という単語は consumer 側に「使っても良い」というメッセージを与えてしまい、production runtime 上で fallback が「正常経路」として扱われる温床になる。
- **将来アクション**: parallel-08 follow-up として hook 名 / 補助関数名の rename 案を `unassigned-task-detection.md` に登録する。即時 rename は consumer 既存利用箇所が無いことを確認した上で検討。

### L-I01-005: post-merge integration-fixes wave は「merge した parallel PR 群」の cartesian で planning する

- **背景**: integration-fixes wave は parallel-08 個別ではなく「parallel-01〜10 全 wave merge 後の cross-cutting 接続点」を対象とする必要があり、対象範囲が事前に確定できないまま着手すると検証が散漫になる。
- **教訓**: integration-fixes は **「直前 wave で merge された全 parallel PR 群 × root / layout / global config」の cartesian で対象 surface を planning** する。本件では parallel-08 (ToastProvider) × root layout の 1 セルが hit したが、planning 段階でこの cartesian が網羅されていなかった。
- **将来アクション**: parallel orchestrator の closing wave template に「直前 wave merge 群 × cross-cutting surface（root layout / middleware / global error boundary / next.config / wrangler.toml）」の cartesian 観測表を追加する。

### L-I01-006: parallel wave の DoD checklist に「root wiring 確認」項目を含めるか分離するかの判断軸

- **背景**: parallel-08 の DoD checklist は「契約 / unit test / lint / typecheck」を含むが、「root wiring 確認」は含まなかった。これは「shared primitive 提供 wave は consumer 適用と分離する」という parallel-09 の原則（L-P09-005）と整合する設計だったが、root wiring 不在のまま production runtime に primitive が配備される穴を残した。
- **教訓**: 「shared primitive 提供 wave に root wiring を含めるか / 別 wave に切り出すか」は **primitive が global singleton 性質を持つかどうか** で判断する。Provider 系（ToastProvider / SessionProvider / QueryClientProvider）は global singleton なので root wiring まで同一 wave に含める方が安全。逆に純粋な hook / 関数 primitive は consumer 適用 wave に分離して良い。
- **将来アクション**: parallel orchestrator の Phase 1 template に「primitive 種別判定表」を追加する。global singleton primitive を導入する wave は scope に root wiring を必須含有とする。

## 検出した「気づきにくい」共通パターン

本件は「defensive fallback」の表面的な問題を超えて、shared primitive の wiring に共通する観察ポイントを示唆する:

- **silent fallback の type signature 透明性**: hook の戻り値型が「正常経路」と「fallback 経路」で同一の場合、consumer 側の typecheck は両者を区別しない。type-level discriminator（`{ status: 'mounted' } | { status: 'fallback' }` 等）で fallback を type に滲ませない限り、TypeScript の検出力は活用できない。
- **unit test の Provider mock 副作用**: unit test では `ToastProvider` を test wrapper でほぼ自動的に mount するため、Provider 未配置を再現するのは production runtime か e2e 環境に限られる。本件は unit test の信頼性が高すぎて runtime 不整合を覆い隠した側面がある。
- **App Router の root layout 暗黙責務**: root layout は middleware と並んで「app 全体に効くが、変更時の検証経路が薄い」 surface。Provider mount / metadata / font loader 等の root 一意 wiring は専用の CI gate を持つに値する。

## 再発防止チェックリスト（次回 shared primitive wave 着手時に転記）

- [ ] primitive が global singleton 性質を持つか判定（Provider / store / 巨大 cache 等）
- [ ] global singleton ならば root wiring を同一 wave のスコープに含める
- [ ] fallback を提供する場合は (a) build flag で throw に切替 / (b) grep gate / (c) 専用 unit test のいずれかを実装
- [ ] hook 命名に fallback の存在を反映（`Optional` という単語を安易に使わない）
- [ ] type signature を正常経路と fallback 経路で discriminator 化する余地を検討
- [ ] parallel wave 群の closing integration wave を Phase 1 で予約
- [ ] post-merge 観測点（`app/layout.tsx` / middleware / global config）への grep gate 追加可否を検討

## 参照

- 親 workflow: `docs/30-workflows/completed-tasks/i01-toastprovider-root-mount/`
- parallel-08 merge commit: `1cf3eee7 feat(parallel-08): shared foundation admin UI - ToastProvider + useAdminMutation contract (#745)`
- 関連 lesson: `lessons-learned-parallel-09-ux-cross-cutting-2026-05.md` L-P09-005（shared primitive 提供 wave と consumer adoption wave 分離）
- 関連 reference: `.claude/skills/aiworkflow-requirements/references/workflow-i01-toastprovider-root-mount-artifact-inventory.md`
