# Lessons Learned — Issue #730 Phase 11 evidence existence validator（2026-05-17）

> task: `docs/30-workflows/issue-730-phase11-evidence-existence-validator/`
> 関連 spec: `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-{01..13}.md`、同 `outputs/phase-11/main.md`、`outputs/phase-12/phase12-task-spec-compliance-check.md`
> 関連 source: `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`、`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`、`scripts/lib/phase12-compliance/verify-compliance-file.ts`、`scripts/lib/phase12-compliance/types.ts`、`scripts/__tests__/verify-phase12-compliance.spec.ts`、`scripts/__tests__/fixtures/phase12-compliance/{pass,fail-missing-evidence}/`
> 関連 reference: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（L194-202 が evidence inventory heading SSOT）、`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`、`.claude/skills/aiworkflow-requirements/references/workflow-issue-730-phase11-evidence-existence-validator-artifact-inventory.md`
> 関連 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260517-issue730-phase11-evidence-existence-validator.md`
> 関連 CI: `.github/workflows/verify-phase12-compliance.yml`

## 教訓一覧

### L-IS730-001: Phase 11 evidence path 解決は 4 つの境界条件を独立 reject する

- **症状**: `outputs/phase-11/evidence file inventory` の `path` 欄に書かれた値を素朴に `path.resolve(workflowRoot, value)` するだけだと、(a) absolute path、(b) `./` prefix、(c) workflow root を含む冗長 path（例: `outputs/phase-11/...` を `<workflowRoot>/outputs/phase-11/<workflowRoot>/outputs/phase-11/...` に二重展開する書き換えミス）、(d) `../` で workflow root を escape する path、の 4 種が「validator 上は valid に見える / または silently wrong path を check しに行く」という状態が発生する。
- **原因**: evidence path の "信頼境界" を validator 側で明示していなかった。Phase 11 inventory は人間が書く markdown table なので、書式バリエーション（相対 / 絶対 / dotted / workflow root prefix 付き）が必然的に混入する。
- **解決**: `parse-phase11-evidence.ts` で 4 条件を **独立に reject** する。`path.isAbsolute` で (a) を reject、先頭 `./` を保持したまま flag、workflow root segment が path 先頭に含まれるかを check して (c) を reject、最終解決後の path が `workflowRoot` の prefix に収まっているか（`path.relative(workflowRoot, resolved).startsWith('..')` で (d) を reject）。`verify-phase11-evidence-existence.ts` 側では reject 済み entry を `missingEvidence` ではなく `invalidPath` として別 verdict に分離し、CI ログで原因が即時特定できるようにする。
- **再発防止策**: 同種の "ユーザー記述 path を validator で existence check する" surface（Phase 7 coverage 引用、Phase 12 implementation-guide 引用など）でも、**absolute / dot-prefix / root-duplicate / parent-escape の 4 reject** を最低 baseline として組み込む。`task-specification-creator` の Phase 11 inventory authoring guide にも reject 例を明示する。

### L-IS730-002: status の大文字小文字差は silent promotion せず literal match で reject する

- **症状**: evidence table の `status` 欄に `Present` / `present` / `PRESENT` の混在が現実に発生する。parser で `value.toLowerCase()` してしまうと「人間が `Present` と書いた = 動いている保証付き」と誤って受理してしまうケースがあり、後段の Phase 12 verdict が "PASS_BOUNDARY_SYNCED" に silent promote してしまう。
- **原因**: schema-driven (literal enum) match と semantic match を validator 内で混在させていた。`status` 欄は Phase 11 heading SSOT で literal `present` / `missing` / `partial` のいずれかと定義済みなのに、parser が tolerance を持っていた。
- **解決**: `parse-phase11-evidence.ts` の status 比較を **literal lowercase enum 完全一致** に固定し、大文字始まりや mixed case は `invalidStatus` verdict に reject する。`types.ts` の `EvidenceStatus` を `'present' | 'missing' | 'partial'` の string literal union とし、それ以外は parser 段で弾く。
- **再発防止策**: Phase 11 heading SSOT (`phase-11-non-visual-alternative-evidence.md` L194-202) の `status` enum を変えるときは parser の literal union と spec ファイル両側を同 PR で更新する（L-IS730-006 と連動）。`tolerance` を入れる時は test fixture で大文字小文字両方の case を network して挙動を明示化してから入れる。

### L-IS730-003: 空 evidence table と heading 不在は `<empty-or-missing-table>` 擬似 entry に集約する

- **症状**: (a) Phase 11 heading は存在するが表が空、(b) Phase 11 heading 自体が存在しない、の 2 ケースを別 verdict にすると CI 出力が散らかり、運用上「結局どっちも evidence 不足」という同じアクションに収束する。
- **原因**: parser が「heading 不在」を `null` で返し「empty table」を空配列で返していたため、呼び出し側 (`verify-phase11-evidence-existence.ts`) で 2 分岐ハンドリングが必要だった。
- **解決**: parser が両ケースで **`<empty-or-missing-table>` 擬似 entry を 1 件返す** よう統一。verifier 側はこの sentinel を「evidence inventory が事実上空」として 1 種類の verdict (`missingInventory`) で扱う。test fixture (`fail-missing-evidence/`) で両ケースが同じ verdict に落ちることを spec で固定する。
- **再発防止策**: 「不在 vs 空」を別 schema にしたくなったら、まず CI 利用者の action がそれぞれ違うかを check する。同じアクションに収束するなら sentinel entry 1 種で集約。同種パターン（Phase 7 coverage の空 table、Phase 12 boundary check の空 list）でも `<empty-or-missing-*>` sentinel を踏襲。

### L-IS730-004: CI 統合は MVP-PAUSE 中の段階導入（`workflow_dispatch` + `origin/dev` fallback）で着地させる

- **症状**: Phase 11 evidence validator を `verify-phase12-compliance.yml` の必須 gate にした瞬間、historical PR や進行中 task 群が全て fail する。MVP-PAUSE 中の他作業を巻き込んで全体 CI を red にすると solo dev の作業全体が止まる。
- **原因**: validator の strictness と既存 task の Phase 11 inventory 整備状況に gap があった。strict gate と coverage 整備を同一 PR で完了させようとすると scope が無限に膨らむ。
- **解決**: 段階導入。Step 1: `.github/workflows/verify-phase12-compliance.yml` を `workflow_dispatch` + 明示 trigger 限定で動かす。Step 2: ベースブランチ未指定 / 不在時は `origin/dev` を fallback として使い、PR 文脈外でも実行可能にする。Step 3: 既存 task の Phase 11 inventory が一定割合 green になるまで required check 化を保留。
- **再発防止策**: 新 validator を CI gate に組み込む時の default は「`workflow_dispatch` で opt-in → 一定 task 群が green → required check 化」の 3 段階。`task-specification-creator` の `phase12 compliance ci gate` workflow にもこの 3 段階 sequence を明記。

### L-IS730-005: numbered heading（`## 4. Phase 11 evidence file inventory`）も canonical heading として受理する

- **症状**: spec 著者が Phase 11 main.md で `## 4. Phase 11 evidence file inventory` のように番号付き heading を書くと、`## Phase 11 evidence file inventory` 完全一致を求める parser が heading 不在と判定し L-IS730-003 sentinel に落ちる。
- **原因**: markdown heading の normalization が parser に不在で、heading SSOT の文字列を literal substring match していた。
- **解決**: `parse-phase11-evidence.ts` 内に `normalizeHeading()` helper を実装し、(a) 先頭 `#` 群を除去、(b) 先頭の `<number>.` / `<number>) ` などの numbering prefix を除去、(c) trim、を経て canonical heading 文字列と比較する。fixture（pass / fail）に numbered 版・素の版両方を含めて regression を固定。
- **再発防止策**: 同種の "spec 文書の特定 heading を機械的に探す" validator は `normalizeHeading` を共通 util として lib に切り出すか同等の helper を導入する。heading SSOT の表記揺れ tolerance ルールを `phase-11-non-visual-alternative-evidence.md` 冒頭に明記。

### L-IS730-006: heading SSOT と parser は同一 PR で同期する（drift を構造的に許さない）

- **症状**: `phase-11-non-visual-alternative-evidence.md` L194-202 の canonical heading 一覧を後追いで書き換えると、parser の literal match と SSOT が drift し、validator が "spec 通りに書いた" task を reject する事故が起きる。
- **原因**: SSOT 側を編集する作業（task-specification-creator skill 配下）と parser 側を編集する作業（scripts 配下）が別 skill / 別 PR で動きやすく、片側だけ merge されることが構造的に起きる。
- **解決**: heading SSOT を変更する PR には **parser 側 (`parse-phase11-evidence.ts`) と test fixture の同期 commit を必須化**。changelog (`20260517-issue730-phase11-evidence-existence-validator.md`) に "Synced surfaces" として SSOT / parser / fixture / CI workflow の 4 surface を明記し、片側 merge を防ぐチェック項目化。`task-specification-creator` skill 側でも `Phase 12 canonical heading SSOT` trigger を keyword に追加して同 wave update を強制。
- **再発防止策**: SSOT ⇄ parser のような "片側 drift が silent fail を生む" pair は、changelog の Synced surfaces 節を強制し、PR description に両側更新 checklist を入れる。aiworkflow-requirements 側 reference を変える時は task-specification-creator 側の対応 reference / schema / parser を同 wave で update する規約を `task-workflow-active.md` の Phase 12 evidence sync 節に常置する。

## 適用範囲

- 本 lessons は **Phase 11 evidence inventory を機械的に validation する全 surface** に適用する。
- L-IS730-001 は markdown table 内のユーザー記述 path を existence check する全 validator（Phase 7 coverage、Phase 12 implementation-guide 引用など）に適用。
- L-IS730-002 は literal enum schema を持つ validator surface（status / verdict / mode 系列）に適用。
- L-IS730-003 は "不在 vs 空" を同じ action に集約する全 inventory validator に適用。
- L-IS730-004 は新 CI gate の段階導入全般に適用（MVP-PAUSE 期間中は特に厳守）。
- L-IS730-005 は spec 文書の heading を機械的に探す全 validator に適用。
- L-IS730-006 は SSOT（spec / schema / parser）が複数 skill / 複数 dir に分散する全 pair に適用。

## 追跡 / 未解放事項

| 項目 | 接続先 | 状態 |
| --- | --- | --- |
| `verify-phase12-compliance.yml` の required check 化 | dev / main branch protection | MVP-PAUSE 期間中は保留 |
| 既存 task 群の Phase 11 inventory backfill | follow-up unassigned task 化判断 | 未起票 |
| `normalizeHeading` の共通 util 化 | `scripts/lib/phase12-compliance/` 内 helper | 単 file 内 helper として留置 |
| Issue #730 OPEN/CLOSE 判断 | PR merge 時 | user-gated |

## 参考リンク

- `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-11/main.md`
- `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`
- `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`
- `scripts/__tests__/verify-phase12-compliance.spec.ts`
- `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/`
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（L194-202 heading SSOT）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-730-phase11-evidence-existence-validator-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260517-issue730-phase11-evidence-existence-validator.md`
- `.github/workflows/verify-phase12-compliance.yml`
