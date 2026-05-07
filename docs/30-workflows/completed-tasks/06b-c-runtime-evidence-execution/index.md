# 06b-c-runtime-evidence-execution

## 実装区分

| 項目 | 値 |
| --- | --- |
| taskType | **implementation**（execution + 軽微な docs sync） |
| 判定根拠 | 先行タスク `06b-C-profile-logged-in-visual-evidence` で追加済みの `apps/web/playwright/tests/profile-readonly.spec.ts` と `scripts/capture-profile-evidence.sh` を **実環境で実行**し、生成 evidence ファイル（screenshot / DOM dump / `manual-smoke-evidence.md` 更新）と Phase 12 `implementation-guide.md` / `unassigned-task-detection.md` を runtime 実測状態に同期する。アプリ本体（`apps/web/app/**` / `apps/api/**`）への新規コード追加は無いが、生成物として evidence ファイル・docs 更新が伴うため CONST_004 では `docs-only` ではなく `implementation` 区分で扱う。 |

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 6b-fu-runtime |
| mode | serial（先行 06b-A → 06b-B → 06b-C 仕様確定 → 本タスク runtime execution） |
| owner | - |
| 状態 | spec_created |
| visualEvidence | VISUAL_ON_EXECUTION |
| priority | High |

## purpose

`06b-C-profile-logged-in-visual-evidence` で準備済みの Playwright spec と capture wrapper を、ユーザー承認済みの logged-in `storageState` と staging / local target に対して実行し、M-08 / M-09 / M-10 / M-16 の runtime evidence を Phase 11 に保存する。M-14 / M-15（Magic Link / Google OAuth flow）も同 wave で取得を試み、取得不能な場合は `status=blocked` + 理由記録に留める。

## why this is execution-only follow-up

このタスクは新規仕様策定や新機能の実装ではなく、先行タスクで「contract / spec / wrapper」まで整備済みの `PENDING_RUNTIME_EVIDENCE` を、ユーザー承認 gate を通したうえで **実測値で塗り替えるだけ** の execution-type タスクである。

- 先行タスク `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/` 側で:
  - Playwright spec は `apps/web/playwright/tests/profile-readonly.spec.ts` として存在
  - capture wrapper は `scripts/capture-profile-evidence.sh` として存在し production guard 実装済
  - Phase 12 strict 7 files も `outputs/phase-12/` に骨格作成済
  - `outputs/phase-11/manual-smoke-evidence.md` は M-08〜M-16 が `pending_runtime_evidence` / `pending_manual_runtime_evidence` で固定
- 本タスクで完結させる差分:
  - 実 storageState を取得しブラウザ自動操作 / 手動 OAuth で evidence を捕捉する
  - `outputs/phase-11/screenshots/` および `outputs/phase-11/dom/` に実ファイルを配置する
  - `manual-smoke-evidence.md` の status 列を `captured` / `blocked` / `fail` に書き換える
  - Phase 12 `implementation-guide.md` と `unassigned-task-detection.md` を実測 command / output path / redaction 結果へ同期する

「コード変更が無い」という意味では near-zero touch だが、生成 evidence ファイルが PR 差分の主役になるため、`docs-only` には縮約せず `implementation / VISUAL_ON_EXECUTION` 扱いとする。

## scope in / out

### Scope In

- logged-in `storageState` をローカル `apps/web/playwright/.auth/state.json` に用意し、secret / session 値を commit 対象に含めないことを確認する
- `bash scripts/capture-profile-evidence.sh --base-url <approved-target> --storage-state <state>` を実行する
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/` に M-08 / M-10 / M-16 screenshot を保存する
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/` に M-09 / M-10 DOM evidence を保存する
- `outputs/phase-11/manual-smoke-evidence.md` と Phase 12 `implementation-guide.md` を runtime 実測結果へ同期する
- M-14 / M-15 は同 wave で取得を試み、不能な場合は `status=blocked` + 理由を記録する

### Scope Out

- `/profile` 本文編集 UI の追加
- Auth.js / Magic Link / Google OAuth の新規実装
- Playwright spec / capture wrapper のロジック改修
- production deploy / production URL に対する evidence 取得
- commit / push / PR 作成（Phase 13 で承認 gate のみ記録）

## evidence path drift（path drift 解消ポリシー）

Issue 本文に複数 path（`02-application-implementation/...` / `06b-C-profile-logged-in-visual-evidence` / `completed-tasks/06b-C-...`）が登場するが、**正本は実体が存在する canonical path のみ**。

| path | 扱い |
| --- | --- |
| `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` | **正本（実体あり）**。本タスクの evidence 出力先 |
| `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` | legacy stub（実体なし）。参照禁止 |
| `docs/30-workflows/02-application-implementation/...` | legacy stub（実体なし）。参照禁止 |
| `docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-*/` | 本タスクの仕様書側成果物（runbook / 判定 log のみ。evidence の正本ではない） |

Phase 2 / 11 / 12 は必ず `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` を evidence 正本として書く。

## dependencies

### Depends On
- `06b-A-me-api-authjs-session-resolver`（先行: `/me` が production session で 200 を返すこと）
- `06b-B-profile-self-service-request-ui`（先行: 申請 UI が `/profile` に反映済みであること）
- `09a-staging-smoke-runtime`（先行: staging endpoint の到達性が smoke 済であること）
- `06b-C-profile-logged-in-visual-evidence`（先行: spec / wrapper / Phase 12 骨格が確定済であること）

### Blocks
- 09a 配下の visual smoke で profile readonly の継続観測

## refs

- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/index.md`
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/artifacts.json`
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/phase-11.md`
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/manual-smoke-evidence.md`
- `apps/web/playwright/tests/profile-readonly.spec.ts`
- `apps/web/playwright.config.ts`
- `scripts/capture-profile-evidence.sh`
- `.gitignore`（`apps/web/playwright/.auth/*.json` 除外）
- `docs/00-getting-started-manual/specs/06-member-auth.md`
- GitHub Issue #449

## 受け入れ条件 (AC)

- M-08 logged-in `/profile` screenshot が desktop / mobile で保存されている
- M-09 no-form DOM evidence で本文編集 `form` / `textarea` / submit button が 0 件である（DOM dump JSON `counts` がすべて 0）
- M-10 `/profile?edit=true` ignored evidence が desktop / mobile で保存されている
- M-16 logout redirect または未ログイン境界の evidence が保存されている
- `manual-smoke-evidence.md` が `pending` から `captured` / `blocked` / `fail` のいずれかの実測状態へ更新されている
- session / token / cookie / email 値が `git diff` / docs / Issue body / PR description に露出していない

## 苦戦箇所（Issue #449 より転記）

| ID | 内容 | 次回の簡潔解決 |
| --- | --- | --- |
| L-06BC-RUNTIME-001 | Playwright spec 作成と runtime evidence 取得を同じ完了状態に混ぜると、Phase 11 を誤って PASS 扱いしやすい。 | `implementation-prepared` と `runtime evidence captured` を別ステータスに分離し、Phase 11 は実ファイル数で判定する。 |
| L-06BC-RUNTIME-002 | logged-in `storageState` は必須だが secret 相当であり、capture 手順に含めると漏洩リスクがある。 | `.gitignore` と wrapper の existence check を先に確認し、Issue / docs には state path だけを書き値を記録しない。 |
| L-06BC-RUNTIME-003 | 旧 `02-application-implementation/...` と current `06b-C...` の path drift により、証跡の保存先を間違えやすい。 | current canonical root を `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/` に固定し、legacy stub は参照リンク専用にする。 |

## 13 phases

- [phase-01.md](phase-01.md) — 実行対象 URL / storageState / 承認境界の確認
- [phase-02.md](phase-02.md) — evidence 保存先と redaction 方針確認
- [phase-03.md](phase-03.md) — command dry-run と production guard 確認
- [phase-04.md](phase-04.md) — Playwright 実行条件の確定
- [phase-05.md](phase-05.md) — capture wrapper 実行
- [phase-06.md](phase-06.md) — screenshot / DOM evidence 検査
- [phase-07.md](phase-07.md) — AC M-08 / M-09 / M-10 / M-16 判定
- [phase-08.md](phase-08.md) — manual-smoke-evidence の同期
- [phase-09.md](phase-09.md) — secret 露出チェック
- [phase-10.md](phase-10.md) — 失敗時の再実行条件整理
- [phase-11.md](phase-11.md) — 実測結果を Phase 11 outputs に保存
- [phase-12.md](phase-12.md) — implementation-guide / unassigned-task-detection 同期
- [phase-13.md](phase-13.md) — ユーザー承認待ち commit / PR 境界の記録

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md（command-log.md を含む）
- outputs/phase-06/main.md
- outputs/phase-07/main.md（ac-matrix.md を含む）
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md（runtime summary; **evidence 実体は先行タスク outputs/phase-11/ 配下**）
- outputs/phase-12/main.md（implementation-guide.md / unassigned-task-detection.md / phase12-task-spec-compliance-check.md / skill-feedback-report.md / system-spec-update-summary.md / documentation-changelog.md を更新する手順）
- outputs/phase-13/main.md（commit / PR 承認待ち blocked placeholder）

## invariants touched

- #4 本文更新は Google Form 再回答のみ（M-09 で form 0 件を実測）
- #5 public/member/admin boundary（M-10 / M-16 で境界確認）
- #8 localStorage / GAS prototype を正本にしない
- #11 管理者も他人本文を直接編集しない（self-profile read-only を確認）

## completion definition

- Phase 11 の runtime evidence が実ファイルとして先行タスク `outputs/phase-11/` 配下に存在する
- Phase 12 の `implementation-guide.md` が実測 command / output path / redaction 結果を含む
- `manual-smoke-evidence.md` が全 marker `captured` / `blocked` / `fail` のいずれかで埋まっている
- session / token / cookie / email 値が docs / git diff に露出していない
- commit / push / PR は user 明示承認まで blocked placeholder のままである
