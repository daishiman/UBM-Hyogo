# UT-06B `/profile` logged-in visual evidence 実装教訓（2026-04）

## 対象

- workflow: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/`
- legacy stub: `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md`
- canonical sync: `apps/web/src/__tests__/static-invariants.test.ts`（S-04 不変条件強化）, `references/task-workflow-active.md`, `indexes/resource-map.md`, `indexes/quick-reference.md`
- 親タスク: 06b-parallel-member-login-and-profile-pages（completed / Phase 11 partial captured）

## Lessons

### L-06B-001: `/profile` read-only invariant に submit button 検出が必要

- **状況**: S-04 不変条件は当初 `<input>` / `<form>` の不在のみを検査していたが、`<button type="submit">` を含む read-only 違反パターンを検出できなかった。プロフィール画面が外部 Google Form への遷移 CTA のみであることを構造で保証する目的に対し、ガードに穴があった。
- **学び**: read-only invariant は「フォーム submit 経路全体」を網羅する必要がある。HTML 上の form-like 要素は `<input>` / `<textarea>` / `<select>` だけでなく `<button type="submit">` / `<button form="...">` も submit 経路となり得る。
- **再発防止**: `apps/web/src/__tests__/static-invariants.test.ts` の S-04 で `<button[^>]*type=["']submit["']` を追加検出。今後 read-only 系不変条件を追加する場合は submit button 検出を最初から含める。
- **関連 refs**: `apps/web/src/__tests__/static-invariants.test.ts`, `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/phase-09.md`

### L-06B-002: spec_created 状態で Phase 12 outputs を作成する論理矛盾の解消

- **状況**: Phase 11 visual evidence は staging 09a deploy smoke に external_gate されており、root status は `spec_created` のままで Phase 11 evidence が未 captured。にもかかわらず Phase 12 outputs（implementation-guide / compliance-check）を先行作成すると、compliance-check の "evidence captured" 判定が false positive になりかねない。
- **学び**: compliance-check で captured 判定条件を分離し、Phase 11 が未実行の段階では `PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` 表記を採用することで、Phase 12 ドラフトと実 evidence captured 状態を区別できる。
- **再発防止**: external_gated な VISUAL タスクで Phase 12 を先行ドラフトする場合、compliance-check には `evidence_status: PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` を明示する。Phase 11 実行後に `captured` へ昇格する導線を runbook に残す。
- **関連 refs**: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md`

### L-06B-003: legacy stub を canonical workflow に昇格する際の双方向リンク手順

- **状況**: `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` は親タスク 06b の Phase 12 で生成された簡易 stub だったが、独立 Phase 1-13 仕様書として canonicalize する必要が生じた。旧 stub をそのまま放置すると citation が割れ、新仕様への誘導が壊れる。
- **学び**: legacy stub に「Canonical Status」見出しを追加し、新 canonical（`docs/30-workflows/06b-C-profile-logged-in-visual-evidence/`）への片方向リンクを記録する。register（`legacy-ordinal-family-register.md`）にも双方向 mapping を登録する。
- **再発防止**: stub → canonical 昇格時のチェックリスト: ①stub 末尾に Canonical Status 節を追加 / ②canonical の index.md に legacy stub への back link / ③`legacy-ordinal-family-register.md` の Current Alias Overrides に登録 / ④resource-map・quick-reference・task-workflow-active を同 wave 同期。
- **関連 refs**: `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md`, `references/legacy-ordinal-family-register.md`

### L-06B-004: Phase 11 が external_gate される運用パターン

- **状況**: `/profile` logged-in 画面の visual evidence 取得には Auth.js Magic Link / Google OAuth の通せる staging 環境が必要で、09a staging deploy smoke 完了後でないと Phase 11 が成立しない。root completed 化が 09a に gated される。
- **学び**: VISUAL タスクが他 wave の deploy smoke に依存する場合、`metadata.externalGate` を artifact に明示し、root status を `spec_created` のまま維持する。Phase 13 user approval は Phase 11 captured 後に解放する逐次運用とする。
- **再発防止**: VISUAL evidence external_gate を持つタスクは ①artifacts.json `externalGate=<gating workflow id>` を必須 / ②runbook に解放トリガを記録 / ③task-workflow-active には `external-gated by 09a staging` と表記する。
- **関連 refs**: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/`, `docs/30-workflows/09a-staging-deploy-smoke/`（gating workflow）

### L-06B-005: Phase 12 implementation-guide Part 1 中学生レベル要件の運用ドリフト防止

- **状況**: task-specification-creator skill は Phase 12 implementation-guide Part 1 に「中学生レベルの概念説明」を要求しているが、Phase 11 evidence 主体の visual タスクではドラフト時に専門用語（`AuthGateState`, `redirect`, `safe redirect`）が混入しやすい。
- **学び**: phase-12.md ドラフト段階で中学生レベル説明を確定し、それをそのまま implementation-guide.md Part 1 に採用すれば、後段ドリフトを抑制できる。
- **再発防止**: VISUAL evidence タスクの phase-12.md は Part 1 概念説明を「ログインしてプロフィール画面が見える」「ログアウトすると login 画面に戻る」などの平易表現で先に書き切り、implementation-guide.md は phase-12.md の概念説明節をそのまま転記する運用にする。
- **関連 refs**: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/phase-12.md`, `.claude/skills/task-specification-creator/references/spec-update-workflow.md`

### L-06B-006: implementation-spec ラベルの spec が repo layout から drift する

- **状況**: 旧仕様書 phase-01〜13 が `apps/web/tests/e2e/...` を前提に書かれていたが、実際の repo layout は `apps/web/playwright/tests/...` だった。Phase 11 / 12 を実行しようとすると path 不在で阻まれ、implementation-spec ラベル自体の整合性が崩れる。
- **学び**: implementation-spec タスクは Phase 5 ランブック確定前に「宣言した code path が repo に存在するか」を grep で検査する gate を必ず通すべき。ファイル名・ディレクトリ名は正本仕様より repo の現行 layout を優先する。
- **再発防止**: ①Phase 5 runbook で `find apps/web/playwright -type d` 等の **path inventory check** を最初の step に固定 / ②phase-01 入口 gate に「declared paths exist」boolean を含める / ③drift 発見時は documentation-changelog に path correction を表として残す。
- **関連 refs**: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/documentation-changelog.md`, `apps/web/playwright/tests/profile-readonly.spec.ts`, `.claude/skills/task-specification-creator/`（Phase 5 runbook 補強候補）

### L-06B-007: capture wrapper は production URL 拒否と storageState 不在 exit を構造で持つ

- **状況**: `/profile` logged-in screenshot を取るには本物の `storageState` JSON が必要だが、これを誤ってリポジトリに commit する事故と、production URL に対して未認証 smoke を撃つ事故の両方が発生し得る。実行系を script に閉じない限り、人間オペレーションのドリフトで再発する。
- **学び**: capture wrapper script の責務に「production URL guard」と「storageState 不在時の早期 exit」を組み込み、人間が flag を渡し忘れても安全側に倒れる構造にする。
- **再発防止**: ①`scripts/capture-profile-evidence.sh` で `--base-url` が production origin 一致なら exit / ②`--storage-state` の指定 path が存在しなければ exit 4（not_executed と区別可能な non-zero） / ③`.gitignore` に `apps/web/playwright/.auth/*.json` を加え、`.gitkeep` のみコミット可能にする。
- **関連 refs**: `scripts/capture-profile-evidence.sh`, `.gitignore`, `apps/web/playwright/.auth/.gitkeep`

### L-06B-008: VISUAL_ON_EXECUTION の Phase 11 は status 三段階で表現する

- **状況**: Phase 11 visual evidence は capture wrapper・spec・config まで揃って実行可能でも、本物の logged-in storageState が user 操作経由でしか手に入らないため、自動 close-out で `captured` に昇格させると false positive になる。一方で「未着手」と書くと wrapper まで揃った進捗が消える。
- **学び**: `not_implemented` / `PENDING_RUNTIME_EVIDENCE`（実装済み・実行のみ未済）/ `captured` の三段階を `evidence_status` フィールドで表現する。Phase 11 main.md と compliance-check と root index.md status を三者一致させる。
- **再発防止**: VISUAL_ON_EXECUTION タスクの artifact `evidence_status` enum を上記三値に固定。compliance-check の `Phase 11 screenshot evidence` 行は `PENDING_RUNTIME_EVIDENCE` を許容語彙に追加。runtime 実行は別 unassigned-task（例: `task-06b-c-profile-logged-in-runtime-evidence-execution-001.md`）として分離し、Phase 13 user approval は runtime 実行 task 側で取得する。
- **関連 refs**: `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md`, `docs/30-workflows/unassigned-task/task-06b-c-profile-logged-in-runtime-evidence-execution-001.md`

## Follow-up Boundaries

- 09a staging deploy smoke が成立した時点で Phase 11 を captured 化し、本タスクの root を `completed` に昇格する。
- 親タスク 06b の Phase 11 partial captured 状態は、本タスク完了後に `references/task-workflow-active.md` 上の 06b 行で `VISUAL captured` へ更新する（06b 行自体は本 wave では変更しない）。
- Magic Link 429 Retry-After UI 復元は `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` に分離。
- Logged-in storageState 取得 + 実 screenshot capture は `docs/30-workflows/unassigned-task/task-06b-c-profile-logged-in-runtime-evidence-execution-001.md` に分離。Phase 13 user approval は runtime 実行 task 側で取得する。
