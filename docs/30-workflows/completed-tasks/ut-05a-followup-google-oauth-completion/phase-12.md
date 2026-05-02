# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke test: staging + production) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | implementation（OAuth 設定 + Cloudflare Secrets 運用変更を伴う） |
| visualEvidence | VISUAL |
| workflow_state | spec_created（PR 段階のため `spec_created` を維持） |
| user_approval_required | false |

## 目的

UT-05A-FOLLOWUP-OAUTH の Phase 1〜11 成果物を、workflow-local 文書 / 正本仕様（`02-auth.md` / `13-mvp-auth.md`）/ skill references / aiworkflow indexes に反映する。task-specification-creator skill の `references/phase-12-spec.md` に従い **必須 5 タスク** をすべて実行し、Phase 13（PR 作成）の承認ゲート前提を整える。05a Phase 11 の placeholder（main.md / implementation-guide）は本タスク成果物リンクで上書きする。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて Phase 12 自身の compliance check を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する（必須 7 ファイル目）。

## workflow_state 取り扱い【重要】

- 本タスクは `taskType=implementation`（OAuth client / Cloudflare Secrets / Google Cloud Console 設定の運用変更）。ただし本 PR で commit するのは:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/` 配下の仕様書 + outputs
  - `.claude/skills/aiworkflow-requirements/indexes/` の同期更新
  - `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` の参照リンク追加（実値非掲載）
  - `.claude/skills/aiworkflow-requirements/references/environment-variables.md` の参照リンク追加
- Phase 11 の実機 smoke は **本 worktree のローカル運用作業**であり、screenshot / 設定変更は repo 内の outputs 配下に閉じる。Google Cloud Console の publishing 状態変更は repo 外のため diff には現れない。
- そのため:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持**（実 OAuth 設定が verified 確定した段階で別タスクが `implemented` に昇格）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新可。
  - `metadata.docsOnly` は **false**（実 outputs に screenshot 等の VISUAL evidence を含むため、純粋な docs-only ではない）。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + Step 2（実施判定）で構造化記述。
- Task 12-3: documentation-changelog を出力し、05a Phase 11 placeholder 上書き手順を別ブロックで記録。
- Task 12-4: unassigned-task-detection を 0 件でも出力（派生タスク候補を含める）。
- Task 12-5: skill-feedback-report を改善点なしでも出力。
- Task 12-6: phase12-task-spec-compliance-check を実施し全 PASS を期待。
- Task 12-7: same-wave sync（aiworkflow indexes + 原典 unassigned status）を完了。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/ | 4 設計成果物 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-05/implementation-runbook.md | 実装ランブック |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/ | Stage A/B/C 全 evidence |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | 認証設計正本 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証方針 / B-03 制約記述 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secrets 配置正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 操作正本 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | トピック索引 |
| 必須 | docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/ | 上書き対象の placeholder |
| 必須 | CLAUDE.md | scripts/cf.sh ルール / 不変条件 |

---

## Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

### Part 1（中学生レベル / 例え話必須・3 つ以上）

> Google でログインできるようにする仕組みを、安全に「お試し（staging）」してから「本番公開（production）」する作業の説明。

- **例え話 1（OAuth とは）**: 「Google さんに『この人は本当に本人ですよ』と保証してもらってサイトに入れる仕組み。学校の入り口で先生（Google）が生徒証を確認して、入ってよい人にだけ通行カード（session cookie）を渡してくれるイメージ」
- **例え話 2（staging と production の違い）**: 「staging は学園祭の前日リハーサル。本番と同じ衣装・舞台でテストする場所。production は本番当日、実際のお客さん（外部の Gmail ユーザー）が来るステージ。リハーサルで失敗を全部潰してから本番に進む」
- **例え話 3（verification 申請）**: 「Google さんに『うちのサイトは怪しくないですよ。プライバシーポリシーもちゃんとあります』と書類を提出して『公認シール』を貰う作業。シールが貰えるまで、登録した一部の人（testing user）しかログインできない（B-03 制約）」
- **例え話 4（B-03 解除）**: 「公認シール待ちの間でも『提出済み』という状態にすれば、外部の人もログインを試せるようになる（解除条件 b）。理想は『公認済み』（解除条件 a）まで進めること」
- **例え話 5（secrets と op://）**: 「OAuth の合言葉（client secret）は金庫（1Password）に入れて、サイトには『金庫の住所』だけ書く（`op://Vault/UBM-Auth/...`）。合言葉そのものはどこにも書かない」

### Part 2（技術者レベル）

- **OAuth client 設計**: 単一 Google Cloud project / 単一 OAuth client / redirect URI を local / staging / production の 3 件を 1 client に登録（phase-02 §設計成果物 1）
- **consent screen**: External / scope=`openid`+`email`+`profile` 最小固定 / authorized domains は production root のみ（phase-02 §設計成果物 3）
- **Cloudflare Secrets**: `bash scripts/cf.sh secret put <KEY> --config apps/api/wrangler.toml --env <staging|production>` で stdin 投入。`wrangler` 直接呼び出し禁止（CLAUDE.md）。実値は `op read 'op://...'` で 1Password から動的注入
- **secrets-placement-matrix**: `AUTH_SECRET` のみ env で値分離 / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` は env 間で同値。admin 判定は D1 `admin_users.active`（phase-02 §設計成果物 2）
- **段階適用 A→B→C**:
  - A: staging smoke（M-01〜M-11 / F-09 / F-15 / F-16 / B-01 実行 + screenshot/session JSON 採取）
  - B: consent screen Production publishing + verification submit
  - C: 外部 Gmail account で `/login` → 着地ページ到達確認
- **B-03 解除条件**: a (verified) > b (submitted 暫定) > c (testing user 拡大: 退避路)。本タスクは a または b で完了扱い
- **secret hygiene**: screenshot / log / JSON でマスクすべき項目（cookie / token / mail / project ID / database_id）一覧を提示
- **wrangler login 禁止**: `~/Library/Preferences/.wrangler/config/default.toml` 不在チェックを Phase 11 Stage A 事前準備で実施

---

## Task 12-2: システム仕様更新（system-spec-update-summary.md）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

### Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | secrets 配置セクションに `outputs/phase-02/secrets-placement-matrix.md` 参照リンクを追加（実値は記載しない） |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `secrets-placement-matrix.md` への双方向リンクを追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | UT-05A-FOLLOWUP-OAUTH workflow 導線追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-05A-FOLLOWUP-OAUTH spec sync root 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 索引再生成 |
| 原典 unassigned-task | `docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-001-staging-oauth-smoke-evidence.md` および `-002-google-oauth-verification.md` の状態を `spec_created` に更新（または本タスクへの統合 link を追加） |

### Step 1-B: 実装状況テーブル更新

- `docs/00-getting-started-manual/specs/13-mvp-auth.md` の B-03 既知制約セクションを以下 3 状態のいずれかに更新:
  - **解除済**（解除条件 a）: verification verified を確認できた場合
  - **submitted で待機中**（解除条件 b）: Phase 11 Stage B が submitted で完了した場合（本タスクの主想定）
  - **testing user 拡大運用中**（解除条件 c）: 暫定退避路（推奨しない）
- 上記いずれの状態でも `outputs/phase-11/production/verification-submission.md` への参照リンクを追加。
- 05a Phase 11 placeholder（`docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md`）の OAuth evidence セクションを **本タスクの `outputs/phase-11/staging/` および `outputs/phase-11/production/` への参照リンクで上書き**する。05a Phase 12 implementation-guide にも同様の参照を追加。

### Step 1-C: 関連タスクテーブル更新

- 05a タスク（`docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/index.md`）の「followup」セクションに本タスクへの link を追加。
- Magic Link provider 統合タスク（unassigned-task として存在する場合）の上流条件に「secrets-placement-matrix の DRY 化」を追加。
- 本番リリース系タスクの「上流前提」に「B-03 解除条件 a または b 達成」を追加。

### Step 2（条件付き / 本タスクは実施）

- 本タスクは OAuth 設定 / Cloudflare Secrets 運用のみで、新規 TypeScript インターフェース / API endpoint / IPC 契約 / D1 schema の追加はない。
- ただし `secrets-placement-matrix.md` を正本として複数 doc から参照する構造を新設するため、Step 1-A 内で「正本同期」相当として扱う。
- TypeScript の型生成 / D1 migration は本タスクスコープ外。**Step 2 は実施** と明記する。

---

## Task 12-3: ドキュメント更新履歴（documentation-changelog.md）

`outputs/phase-12/documentation-changelog.md` を以下フォーマットで出力する。workflow-local 同期と global skill sync を別ブロックで記録（[Feedback BEFORE-QUIT-003] 対策）。

### workflow-local（本タスク内）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/ut-05a-followup-google-oauth-completion/ | 13 Phase + index + artifacts.json + outputs |
| 2026-04-30 | 新規 | outputs/phase-02/oauth-redirect-uri-matrix.md | redirect URI matrix |
| 2026-04-30 | 新規 | outputs/phase-02/secrets-placement-matrix.md | Secrets 配置正本 |
| 2026-04-30 | 新規 | outputs/phase-02/consent-screen-spec.md | consent screen 仕様 |
| 2026-04-30 | 新規 | outputs/phase-02/staging-vs-production-runbook.md | 段階適用 runbook |
| 2026-04-30 | 新規 | outputs/phase-11/staging/ | Stage A 全 evidence |
| 2026-04-30 | 新規 | outputs/phase-11/production/ | Stage B/C 全 evidence |

### global skill sync

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 更新 | docs/00-getting-started-manual/specs/02-auth.md | secrets 配置参照リンク追加 |
| 2026-04-30 | 更新 | docs/00-getting-started-manual/specs/13-mvp-auth.md | B-03 解除状態更新 + verification-submission.md 参照 |
| 2026-04-30 | 更新 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secrets-placement-matrix 双方向リンク |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | workflow 導線 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | spec sync root |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成 |

### 05a placeholder 上書き（明示）

| 上書き対象 | 上書き元 | 手段 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md` の OAuth evidence セクション | 本タスク `outputs/phase-11/staging/` および `outputs/phase-11/production/` | 参照リンク追加 + 「以後はこちらを正本とする」注記 |
| 05a Phase 12 implementation-guide.md の OAuth flow 証跡参照 | 本タスク `outputs/phase-12/implementation-guide.md` | 参照リンク追加 |
| 05a 原典 unassigned-task 2 件（followup-001 / -002） | 本タスクへの統合 link | 状態を `spec_created`（または `merged_into: ut-05a-followup-google-oauth-completion`）に更新 |

---

## Task 12-4: 未割当タスク検出レポート（unassigned-task-detection.md / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。本タスクで派生する候補:

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| Magic Link provider 統合時の secrets-placement-matrix DRY 化 | 設計 | provider 共通の配置表を `secrets-placement-matrix.md` に汎用化 | UT-05B-magiclink-provider-integration（新規 unassigned 候補） |
| verification verified 確定後の B-03 状態クリーンアップ | 運用 | `13-mvp-auth.md` の `submitted` 記述を `verified` に更新 | UT-05A-FOLLOWUP-OAUTH-CLEANUP（新規 unassigned 候補 / 審査完了通知後） |
| sensitive scope（calendar / drive 等）追加時の verification 再申請手順 | 運用 | 別 runbook として整備 | 別タスク（要件発生時） |
| staging host が production と異なる root domain の場合の authorized domains 拡張 | 設計 | staging 専用 domain を consent screen に追加する手順 | 本タスクの `staging-vs-production-runbook.md` で吸収済み（再発時のみ別タスク化） |
| `wrangler login` 不在を CI / pre-commit hook で恒久検証 | 運用 | hook で `~/Library/Preferences/.wrangler/config/default.toml` 不在を確認 | UT-GOV / lefthook タスク候補 |
| OAuth callback の error response（`access_denied` / `invalid_request` 等）に対するユーザー向け UI | UI | エラーページ整備 | apps/web UI タスク（既存 unassigned があれば link） |

> 0 件の場合も「該当なし」セクションを必ず作成する（phase-12-pitfalls.md 漏れパターン対策）。本タスクは上記 6 件を派生候補として記録。

---

## Task 12-5: スキルフィードバックレポート（skill-feedback-report.md / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | VISUAL タスクで段階適用（A/B/C）が必要なケースの phase-11 構造ガイドが薄い | phase-11-visual-staged-application.md 等の reference を追加し、Stage 別合否判定テンプレを提供 |
| aiworkflow-requirements | `environment-variables.md` に secrets 配置 matrix のテンプレ章が無い | `secrets-placement-matrix-template.md` reference 追加で複数 provider 統合時の DRY を促進 |
| github-issue-manager | closed 状態の issue を統合タスクで参照する場合のリンクキーワード（`Closes` vs `Refs` vs `Followup of`）の使い分けガイドが薄い | references に「closed issue 統合タスク」ケースを追加 |

---

## Task 12-6: Phase 12 compliance check（必須 7 ファイル目）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | Part 1 に例え話 3 つ以上 | PASS（5 つ） |
| Step 1-A / 1-B / 1-C が記述 | spec-update-summary に明示 | PASS |
| Step 2 の必要性判定が記録 | 更新対象と実施結果を明記 | PASS |
| 05a placeholder 上書き手順が changelog に記載 | 上書き対象 / 手段が明示 | PASS |
| same-wave sync が完了 | aiworkflow indexes + 原典 unassigned status 2 件 | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| workflow_state 維持 | `spec_created` のまま | PASS |
| docsOnly 値整合 | `false`（VISUAL evidence あり） | PASS |
| 機密情報非混入 | 実 client_id / client_secret / project ID / mail / cookie が outputs に無い | PASS |
| `wrangler login` 不在チェック手順が runbook / Phase 11 に記載 | CLAUDE.md 準拠 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES |
| 原典 unassigned (followup-001) | docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-001-staging-oauth-smoke-evidence.md | YES（spec_created or merged_into） |
| 原典 unassigned (followup-002) | docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-002-google-oauth-verification.md | YES（spec_created or merged_into） |
| 05a Phase 11 placeholder | docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md | YES（参照リンク追加） |
| skill 本体 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | YES（参照リンク追加） |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly`。
- 本タスクの drift 防止チェック: `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = false`（VISUAL evidence あり）/ `metadata.visualEvidence = "VISUAL"` が両 ledger と PR 境界で一致。

## implementation / spec_created 取り扱いルール【必須】

- 本タスクは `taskType=implementation` だが、Google Cloud Console / Cloudflare Secrets 等の **repo 外運用変更**は diff に現れない。
- 本 PR で commit するのは仕様書 + outputs evidence + skill / spec 同期のみ。
- そのため `phases[*].status` は `completed` に進めてよいが、`metadata.workflow_state` は **`spec_created` を維持**（verified 確定後に別タスクで `implemented` 昇格）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | Stage A/B/C 合否を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | 05a / Magic Link / 本番リリース系の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアにも OAuth verification の意味と staging→production 順序が伝わるレベルか。
- 実現性: Step 1-A の `02-auth.md` / `13-mvp-auth.md` 反映が現行ファイル構造と整合（架空セクション名を作っていないか）。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status / 05a placeholder 上書きが最新コミットで一致。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID または明確な新規 ID。
- 認可境界: 実装ガイドのコマンド例が `scripts/cf.sh` 経由で書かれており `wrangler` 直呼びになっていない。
- Secret hygiene: ガイド / changelog / unassigned-detection に実 client_id / client_secret / project ID / mail / cookie が含まれていない。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 5 つ |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | OAuth client / Secrets / 段階適用 / B-03 解除 |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 実施 |
| 4 | documentation-changelog | 12 | spec_created | workflow-local / global / 05a 上書きを別ブロック |
| 5 | unassigned-task-detection | 12 | spec_created | 6 件派生候補 |
| 6 | skill-feedback-report | 12 | spec_created | 3 スキルへの提案 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync | 12 | spec_created | indexes + 原典 unassigned 2 件 + 05a placeholder + environment-variables |
| 9 | 二重 ledger 同期 | 12 | spec_created | workflow_state=spec_created 維持 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| Index | outputs/phase-12/main.md | Phase 12 成果物 index / 5 タスク + compliance check summary |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生 / 例え話 5 つ）+ Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 実施 判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | workflow-local / global / 05a 上書きを別ブロック |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 6 件派生候補（0 件でも必須） |
| FB | outputs/phase-12/skill-feedback-report.md | 3 スキルへの提案（改善点なしでも必須） |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS 期待 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / workflow_state=spec_created 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（実施）が明記
- [ ] documentation-changelog で workflow-local / global / 05a placeholder 上書きが別ブロック
- [ ] unassigned-task-detection が 0 件でも出力（本タスクは 6 件記載）
- [ ] skill-feedback-report が改善点なしでも出力（本タスクは 3 件記載）
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync が完了（indexes + 原典 unassigned 2 件 + 05a placeholder + environment-variables）
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `metadata.workflow_state = "spec_created"` 維持
- [ ] `02-auth.md` / `13-mvp-auth.md` への参照リンク追加が実値非掲載で完了
- [ ] 05a Phase 11 placeholder の上書き手順が changelog に明記

## タスク100%実行確認【必須】

- 全実行タスク（9 件）の状態が `spec_created`、Phase 完了時に `completed` へ更新可能な設計
- 必須 7 成果物が `outputs/phase-12/` に配置される設計
- spec_created タスクの workflow_state 据え置きルール（phase-12-pitfalls.md）が手順に含まれている
- artifacts.json の `phases[11].status` が完了時 `completed`、`metadata.workflow_state` が `spec_created` 維持

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection 6 件 → 関連タスクへの双方向リンク反映済み（または新規 unassigned として formalize）
  - workflow_state=spec_created / docsOnly=false / VISUAL evidence あり / 両 issue closed の事実 を Phase 13 PR body に明記
  - 両 issue (#251 / #252) は **closed 状態** で `Refs` / `Followup of` 形式で参照（`Closes` は使わない）
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了（aiworkflow indexes + 原典 unassigned 2 件 + 05a placeholder + environment-variables）
  - 二重 ledger に drift
  - workflow_state を誤って `completed` / `implemented` に書き換えた
  - `02-auth.md` / `13-mvp-auth.md` に実値（client_id / client_secret 等）が混入
