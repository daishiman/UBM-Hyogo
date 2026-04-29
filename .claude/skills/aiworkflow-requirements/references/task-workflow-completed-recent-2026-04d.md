# 完了タスク記録 — 2026-04-08

> 親ファイル: [task-workflow-completed.md](task-workflow-completed.md)

---

### タスク: UT-GOV-004 branch protection required_status_checks contexts 同期 spec_created（2026-04-29）

| 項目 | 値 |
| --- | --- |
| タスクID | UT-GOV-004 |
| ステータス | **spec_created（Phase 1〜12 完了 / Phase 13 ユーザー承認待ち）** |
| タイプ | governance / docs-only / NON_VISUAL |
| 優先度 | High（UT-GOV-001 の前提） |
| 完了日 | 2026-04-29 |
| 成果物 | `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/` |
| GitHub Issue | #147（CLOSED） |

#### 実施内容

- 草案 8 contexts のうち実在 + 過去 30 日 success 実績を持つ 3 contexts（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を Phase 1 投入対象に確定
- `outputs/phase-08/confirmed-contexts.yml` を UT-GOV-001 が消費する唯一の機械可読入力として正本化
- branch protection 運用ルール 4 項目（AC-3 / AC-5 / AC-8 / AC-9）を `system-spec-update-summary.md §4` で固定
- strict 採否を dev=false / main=true に決定（`outputs/phase-09/strict-decision.md`）
- lefthook ↔ CI 同一 pnpm script 規約の対応表を `outputs/phase-08/lefthook-ci-mapping.md` に整備
- 苦戦箇所 6 件を `references/lessons-learned-ut-gov-004-branch-protection-context-sync.md` に記録（L-GOV004-001〜006）
- artifact inventory を `references/workflow-ut-gov-004-artifact-inventory.md` に新規登録
- skill 反映: `indexes/resource-map.md` / `indexes/quick-reference.md` / `indexes/topic-map.md` / `LOGS/_legacy.md`

#### relay 先未タスク

- UT-GOV-001: `confirmed-contexts.yml` を入力に branch protection apply
- UT-GOV-005: Phase 2 候補 4 件（unit-test / integration-test / security-scan / docs-link-check）の workflow 新設
- UT-GOV-007: workflow `name:` drift 自動検出 + GitHub Actions ピン留めポリシー

---

### タスク: UT-13 Cloudflare KV セッションキャッシュ設定 spec_created（2026-04-27）

| 項目 | 値 |
| --- | --- |
| タスクID | UT-13 |
| ステータス | **spec_created（Phase 1〜12 完了 / Phase 13 pending）** |
| タイプ | docs-only / NON_VISUAL / Cloudflare KV policy and runbook |
| 優先度 | Low |
| 完了日 | 2026-04-27 |
| 成果物 | `docs/30-workflows/ut-13-cloudflare-kv-session-cache/` |
| source task | `docs/30-workflows/unassigned-task/UT-13-cloudflare-kv-session-cache.md`（spec_created へ更新済み） |

#### 実施内容

- `SESSION_KV` binding、production / staging Namespace 命名、TTL 方針、無料枠運用、一貫性制約を仕様化
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV セッションキャッシュ正本セクションを追加
- Phase 12 成果物 6 ファイルを作成し、implementation guide / system spec summary / unassigned detection / skill feedback / compliance check を同期

#### follow-up backlog

- UT-30: Cloudflare KV Namespace 実 ID 発行・1Password 登録
- UT-31: apps/api/wrangler.toml SESSION_KV バインディング適用
- UT-32: Worker SESSION_KV helper 実装
- UT-33: Cloudflare KV 使用量監視・アラート設定
- UT-34: KV Namespace ID 混入防止 pre-commit guard

---

### タスク: UT-SKILL-WIZARD-W2-seq-03a SkillCreateWizard オーケストレーション更新（2026-04-08）

| 項目       | 値                                                                  |
| ---------- | ------------------------------------------------------------------- |
| タスクID   | UT-SKILL-WIZARD-W2-seq-03a                                          |
| ステータス | **完了（Phase 12 完了 / Phase 13 blocked）**                        |
| タイプ     | UI implementation / wizard redesign / orchestration                 |
| 優先度     | 高                                                                  |
| 完了日     | 2026-04-08                                                          |
| 対象       | `SkillCreateWizard.tsx` / `GenerateStep.tsx` / `CompleteStep.tsx`   |
| 成果物     | `docs/30-workflows/completed-tasks/W2-seq-03a-skill-create-wizard/` |
| PR         | 未作成（Phase 13 blocked）                                          |

#### 実施内容

**SkillCreateWizard.tsx（オーケストレーション更新）**

- テンプレート生成モード（`generationMode: 'template'`）を廃止し、LLM専用化
- `formData` / `answers` / `smartDefaults` / `skillPath` の state を追加
- `inferSmartDefaults()`: 大小文字不問の推論（purpose 文字列を toLowerCase() してから includes() 判定）
  - slack / github / notion → 外部連携ツール判定
  - scheduled → スケジュール判定
  - code → フォーマット判定
- `handleStep0Next()`: Step 0 フォーム送信 → SmartDefault 推論 → Step 1 遷移
- `handleGenerate(method)`: LLM 生成実行（generationLockRef + isGenerating で二重呼び出し防止）
- `handleRetry()`: `formData` 保持 + `answers` / `skillPath` / `generationError` リセット

**GenerateStep.tsx**

- `generationMode` prop 廃止
- 再入防止: `generationLockRef`（useRef）+ `isGenerating`（useState）の二重ガード
  - useRef: レンダリング非同期に安全（即時参照可能）
  - useState: UI表示制御（ボタン disabled など）

**CompleteStep.tsx**

- `skillPath` 表示を追加（生成されたスキルのファイルパスを完了画面に表示）
- `hasExternalIntegration` / `externalToolName` の条件付き表示
  - 外部連携（Slack / GitHub / Notion）がある場合のみ外部連携セクションを表示

**テスト整備**

- `SkillCreateWizard.W2-seq-03a.test.tsx`: W2-seq-03a 専用テスト追加
- `SkillCreateWizard.store-integration.test.tsx`: Store 統合テスト更新
- `GenerateStep.test.tsx` / `CompleteStep.test.tsx`: コンポーネント単体テスト更新

#### 検証証跡

- `pnpm --filter @repo/desktop typecheck`: PASS
- `pnpm --filter @repo/desktop exec eslint src/renderer/components/skill/SkillCreateWizard.tsx src/renderer/components/skill/wizard/GenerateStep.tsx src/renderer/components/skill/wizard/CompleteStep.tsx`: PASS
- `pnpm --filter @repo/desktop exec vitest run src/renderer/components/skill/__tests__/SkillCreateWizard.W2-seq-03a.test.tsx src/renderer/components/skill/__tests__/SkillCreateWizard.store-integration.test.tsx src/renderer/components/skill/wizard/__tests__/GenerateStep.test.tsx src/renderer/components/skill/wizard/__tests__/CompleteStep.test.tsx`: PASS
- Phase 12 成果物: `outputs/phase-12/` 6ファイル作成・同期済み

#### 苦戦箇所

| #   | 苦戦箇所                                  | 解決策                                                                |
| --- | ----------------------------------------- | --------------------------------------------------------------------- |
| 1   | `inferSmartDefaults()` の大小文字不問対応 | `toLowerCase()` してから `includes()` で判定                          |
| 2   | `handleGenerate` の二重呼び出し防止       | `generationLockRef`（useRef）+ `isGenerating`（useState）の二重ガード |
| 3   | `handleRetry` でどの state を保持すべきか | ユーザー入力（`formData`）を保持し生成結果のみリセット                |

#### Phase 12 未タスク（非ブロッカー）

- `resolveExternalIntegration()` のツール名対応表を定数に切り出す（改善候補）
- テスト名の「復帰」「やり直し」「リトライ」表現を統一（改善候補）
- Phase 11 証跡スクリーンショットの命名規則（TC-11-xx-...形式）の明文化（改善候補）

詳細は `outputs/phase-12/skill-feedback-report.md` を参照。

#### 依存関係

- 先行: W0-seq-01（SkillInfoFormData 型定義）/ W0-seq-02（inferSmartDefaults 実装）/ W1-par-02a（SkillInfoStep）/ W1-par-02d（LifecyclePanel ウィザード遷移）
- 後続: W3-seq-04（使用率計装）

#### lessons-learned

- `references/lessons-learned-skill-wizard-redesign.md` を参照
# 完了タスク記録 — 2026-04-08（impl-spec-to-skill-sync）

> 親ファイル: [task-workflow-completed.md](task-workflow-completed.md)

---

### タスク: UT-SKILL-WIZARD-W1-par-02c CompleteStep 完了画面再設計 impl-spec-to-skill-sync（2026-04-08）

| 項目       | 値                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------- |
| タスクID   | UT-SKILL-WIZARD-W1-COMPLETE-STEP-001                                                         |
| ステータス | **完了**                                                                                     |
| タイプ     | impl-spec-to-skill-sync / Phase 12 docs / system spec update                                 |
| 優先度     | 高                                                                                           |
| 完了日     | 2026-04-08                                                                                   |
| 対象       | `apps/desktop/src/renderer/components/skill/wizard/CompleteStep.tsx`                         |
| 成果物     | `docs/30-workflows/W1-par-02c-complete-step-2/`（Phase 1-12 仕様書・全成果物）               |

#### 実施内容

- `CompleteStep.tsx` を旧 `skillPath/onClose` シンプル完了画面から 7 Props 構成（`generatedSkill` / `hasExternalIntegration` / `externalToolName` / `onExecuteNow` / `onOpenInEditor` / `onCreateAnother` / `onQualityFeedback` / `onRetry`）へ全面再設計
- 完了ヘッダー（「✓ スキルの骨格を生成しました」）/ QualityFeedback（👍/👎）/ NextActionCards（3 カード）/ ExternalIntegrationChecklist（条件付き）を実装
- `feedbackSubmitted` state で二重送信防止。`onQualityFeedback(false)` 失敗時も `onRetry()` を finally ブロックで保証
- `GeneratedSkill` interface を追加（表示責務は W2-seq-03a に委譲）
- 36 tests PASS（基本 / エッジ / 統合 / a11y / snapshot 含む）
- Phase 11 スクリーンショット 9 枚（TC-01〜TC-09）
- Phase 12 全 6 成果物 PASS（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- `ui-ux-feature-components-skill-analysis.md` / `ui-ux-feature-components-reference.md` を current contract に同期（same-wave）
- `docs/30-workflows/skill-wizard-redesign-lane/index.md` の W1-par-02c slug を `W1-par-02c-complete-step-2` に更新
- lessons-learned 3 件追加（L-W1-02c2-001〜003: generatedSkill 保持・非表示 SRP / onQualityFeedback と onRetry 分離 / `-2` suffix 命名規則）
- `task-workflow-completed-recent-2026-04d.md` を新規作成（2026-04c が 538 行超過のため）
- `generate-index.js` 実行・mirror sync 完了

#### 検証証跡

- `pnpm --filter @repo/desktop vitest run -- CompleteStep`: 36 tests PASS
- `validate-structure.js`: PASS（警告4件は既存行超過、本タスク起因なし）
- `generate-index.js`: PASS（2827 キーワード）
- `diff -qr .agents/skills/aiworkflow-requirements .claude/skills/aiworkflow-requirements`: 差分なし（mirror 同期済み）
- `audit-unassigned-tasks.js --json --diff-from HEAD`: currentViolations = 0

---

### タスク: TASK-SC-13-VERIFY-CHANNEL-IMPLEMENTATION IPC verify チャンネル実装（2026-04-08）

| 項目       | 値                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| タスクID   | TASK-SC-13-VERIFY-CHANNEL-IMPLEMENTATION                                                                                  |
| ステータス | **完了（Phase 12 完了 / Phase 13 blocked）**                                                                              |
| タイプ     | IPC channel implementation / shared types / preload whitelist                                                             |
| 優先度     | 高                                                                                                                        |
| 完了日     | 2026-04-08                                                                                                                |
| 対象       | `packages/shared/src/ipc/channels.ts` / `packages/shared/src/types/skillCreator.ts` / `apps/desktop/src/main/ipc/creatorHandlers.ts` / `apps/desktop/src/preload/channels.ts` / `apps/desktop/src/preload/skill-creator-api.ts` / `apps/desktop/src/main/services/runtime/RuntimeSkillCreatorFacade.ts` |
| 成果物     | `docs/30-workflows/task-sc-13-verify-channel-implementation/`                                                             |
| PR         | 未作成（Phase 13 blocked）                                                                                                |

#### 実施内容

**型定義（`packages/shared/src/types/skillCreator.ts`）**

- `VerifyCheckResult` 型（`checkId` / `label` / `passed` / `message?`）を追加
- `VerifyResult` 型（`success` / `checks` / `error?`）を追加

**IPC 定数（`packages/shared/src/ipc/channels.ts`）**

- `SKILL_CREATOR_VERIFY = "skill-creator:verify"` を追加し `IPC_CHANNELS` に統合

**Preload whitelist（`apps/desktop/src/preload/channels.ts`）**

- `SKILL_CREATOR_VERIFY` を `ALLOWED_INVOKE_CHANNELS` に追加

**Main Handler（`apps/desktop/src/main/ipc/creatorHandlers.ts`）**

- `ipcMain.handle(IPC_CHANNELS.SKILL_CREATOR_VERIFY, ...)` を登録（`validateSender + isBlank + sanitizeErrorMessage` パターン）
- `unregisterRuntimeSkillCreatorHandlers` に `removeHandler(IPC_CHANNELS.SKILL_CREATOR_VERIFY)` を追加

**Facade（`apps/desktop/src/main/services/runtime/RuntimeSkillCreatorFacade.ts`）**

- `async verify(skillName, authMode, apiKey): Promise<VerifyResult>` を追加
- `resolveVerifySkillDir(skillName) → verifySkill(skillDir) → DTO 変換` の流れ
- DTO 変換: `id→checkId` / `summary→label` / `severity==="info"→passed=true` / `evidenceSummary→message`

**Preload API（`apps/desktop/src/preload/skill-creator-api.ts`）**

- `verifySkill(skillName, authMode?, apiKey?)` メソッドを追加・インターフェースに型定義追記

**新規テスト**

- `apps/desktop/src/main/ipc/__tests__/creatorHandlers.verify.test.ts`（verify ハンドラ専用 UT）

#### 苦戦箇所

- `RuntimeSkillCreatorFacade.verifySkill(skillDir)` と公開 IPC `verify(skillName, ...)` の名前が酷似しており、Phase 2 設計で責務分離を明示しなかったためレビュー時に混乱した
- `preload/channels.ts` の `ALLOWED_INVOKE_CHANNELS` 追記が漏れやすい（テンプレートに必須チェック項目として追加が必要）
- worktree 環境では esbuild バージョン不一致が発生するため、必ず `pnpm install` を実行してから vitest を動かすこと

---

---

### タスク: UT-SKILL-WIZARD-W3-seq-04 使用率計装（2026-04-08）

| 項目       | 値                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| タスクID   | UT-SKILL-WIZARD-W3-seq-04                                                                                                 |
| ステータス | **完了**                                                                                                                  |
| タイプ     | UI instrumentation / usage tracking / wizard analytics                                                                    |
| 優先度     | 中                                                                                                                        |
| 完了日     | 2026-04-08                                                                                                                |
| 対象       | `apps/desktop/src/renderer/utils/trackEvent.ts` / `SkillCreateWizard.tsx` / `wizard/ConversationRoundStep.tsx`            |
| 成果物     | `trackEvent.ts`（renderer-local 抽象）/ ウィザード5計装ポイント                                                           |
| PR         | 未作成                                                                                                                    |

#### 実施内容

**trackEvent.ts（renderer-local 抽象）**

- `apps/desktop/src/renderer/utils/trackEvent.ts` に薄い抽象を実装
- 既存の `SkillAnalytics` / `AnalyticsStore` とは独立した renderer-local util
- 現フェーズでは console.debug ロギングのみ（将来的な IPC 接続を想定した interface 設計）

**SkillCreateWizard.tsx（3計装ポイント）**

- `skill_wizard_started`: ウィザード表示時（`useEffect` mount）
- `skill_wizard_step1_completed`: Step 0 → Step 1 遷移時（`handleStep0Next` 内）
- `skill_wizard_next_action`: 完了後のアクション選択時（`handleNextAction` 内）

**ConversationRoundStep.tsx（2計装ポイント）**

- `skill_wizard_generation_completed`: 生成完了コールバック受信時
- `skill_skeleton_quality_feedback`: スケルトン品質フィードバック送信時

#### 検証証跡

- `pnpm --filter @repo/desktop typecheck`: PASS
- `pnpm --filter @repo/desktop exec eslint src/renderer/utils/trackEvent.ts src/renderer/components/skill/SkillCreateWizard.tsx src/renderer/components/skill/wizard/ConversationRoundStep.tsx`: PASS
- `pnpm --filter @repo/desktop exec vitest run src/renderer/components/skill/__tests__/ src/renderer/components/skill/wizard/__tests__/ConversationRoundStep.test.tsx`: PASS

#### 苦戦箇所

| # | 苦戦箇所 | 解決策 |
| --- | --- | --- |
| 1 | trackEvent を既存 SkillAnalytics/AnalyticsStore に接続しようとすると責務が混在 | renderer-local の薄い抽象として独立実装（L-W3-TRACK-001） |
| 2 | 5計装ポイントの配置コンポーネントが不明確（SkillCreateWizard vs CompleteStep） | 「誰がその状態を知っているか」で配置決定（L-W3-TRACK-002） |
| 3 | skill-wizard-redesign-lane 削除後の quick-reference 参照パスが旧パスのまま残存 | docs/30-workflows/ 直下への canonical 移行と同波更新（L-WIZARD-LANE-CLEANUP-001） |

#### 依存関係

- 先行: W2-seq-03a（SkillCreateWizard オーケストレーション更新）/ W1-par-02b（ConversationRoundStep 実装）
- 後続: なし（レーン完了）

#### lessons-learned

- `references/lessons-learned-current-2026-04.md` の L-W3-TRACK-001 / L-W3-TRACK-002 / L-WIZARD-LANE-CLEANUP-001 を参照

---

### タスク: UT-11 管理者向け Google OAuth ログインフロー実装 — task-spec-creation（2026-04-27）

| 項目       | 値                                                                                      |
| ---------- | --------------------------------------------------------------------------------------- |
| タスクID   | UT-11                                                                                   |
| ステータス | **完了（task-spec-creation / docs_only）**                                              |
| タイプ     | spec_created / docs_only                                                                |
| 優先度     | 高                                                                                      |
| 完了日     | 2026-04-27                                                                              |
| 対象       | `docs/30-workflows/ut-11-google-oauth-admin-login-flow/`                                |
| 成果物     | Phase 1-13 仕様書 + Phase 11 VISUAL 補助成果物 + `lessons-learned-current-2026-04b.md` |
| PR         | feat/ut-11-task-spec                                                                    |

#### 実施内容

**Phase 1-13 仕様書（`docs/30-workflows/ut-11-google-oauth-admin-login-flow/`）**

- Phase 1: 要件定義（AC-1〜AC-13、真の Issue、依存境界、4条件評価）
- Phase 2: 設計（PKCE flow、state Cookie、JWT session、admin gate、allowlist）
- Phase 3: 設計レビュー（6代替案比較 A〜F、リスク R1-R8）
- Phase 4: テスト戦略（7レイヤー × テスト ID 体系、@cloudflare/vitest-pool-workers）
- Phase 5: 実装ランブック（GCloud Console → wrangler secret put → .dev.vars → wrangler pages dev）
- Phase 6: 異常系検証（F-01〜F-35: state mismatch、redirect_uri_mismatch 等）
- Phase 7: AC マトリクス（AC-1〜AC-13 × テスト ID × runbook ステップ）
- Phase 8: DRY 化（apps/web/src/lib/{oauth,auth}/ への認証ユーティリティ集約）
- Phase 9: 品質保証（typecheck/lint/build gate、gitleaks H-01〜H-08、invariant #5 確認 I5-01〜I5-05）
- Phase 10: 最終レビュー（受入条件、ブロッカー B-01〜B-04）
- Phase 11: 手動 smoke VISUAL（V-01〜V-08 スクリーンショットマトリクス）
- Phase 12: ドキュメント更新（spec_created close-out、5 必須成果物）
- Phase 13: PR 作成（ユーザー明示承認必須）

**技術スタック**

- Google OAuth 2.0 Authorization Code Flow + PKCE（S256、Web Crypto API 使用 / Edge Runtime 制約）
- state parameter: HttpOnly Cookie 保存（`oauth_state` Cookie、SameSite=Lax）
- JWT Cookie session（`auth_session` Cookie、HttpOnly; Secure; SameSite=Lax）
- ADMIN_EMAIL_ALLOWLIST: Cloudflare Secret（カンマ区切り）
- admin gate: `apps/web/middleware.ts`（`/admin/*` パス全保護）

**lessons-learned（`references/lessons-learned-current-2026-04b.md`）**

- L-UT11-001: Edge Runtime PKCE 制約（`crypto.createHash()` 不可 / Web Crypto API 必須）
- L-UT11-002: state parameter 保存戦略（HttpOnly Cookie + SameSite=Lax）
- L-UT11-003: ADMIN_EMAIL_ALLOWLIST 管理（Cloudflare Secret / `.dev.vars` ローカル定義）
- L-UT11-004: spec_created タスクの Phase 11 VISUAL 分類判断
- L-UT11-005: validate-phase-output.js VISUAL 補助成果物要件

#### 検証証跡

- `scripts/validate-phase-output.js docs/30-workflows/ut-11-google-oauth-admin-login-flow`: 32 PASS / 0 ERROR
- `scripts/validate-structure.js`: PASS
- Phase 12 必須成果物 7 ファイル（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）作成済み

#### 依存関係

| 依存先 | タスク ID / 成果物                                              |
| ------ | --------------------------------------------------------------- |
| 先行   | specs/02-auth.md（認証設計）/ specs/13-mvp-auth.md（MVP 認証方針）|
| 後続   | UT-11 実装タスク（将来作成予定）                                |

---

### タスク: task-verify-indexes-up-to-date-ci CI gate 新設（2026-04-28）

| 項目 | 値 |
| --- | --- |
| タスクID | task-verify-indexes-up-to-date-ci |
| ステータス | **implementation_completed_pr_pending（Phase 1〜12 完了 / Phase 13 pending_user_approval）** |
| タイプ | implementation / NON_VISUAL / CI gate |
| 優先度 | 中 |
| 完了日 | 2026-04-28 |
| 対象 | `.github/workflows/verify-indexes.yml` / `CLAUDE.md` / `doc/00-getting-started-manual/lefthook-operations.md` / `references/technology-devops-core.md` |
| 成果物 | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/` |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (C-1) |
| PR | 未作成（Phase 13 pending_user_approval） |

#### 実施内容

- `.github/workflows/verify-indexes.yml` を新規作成し、`actions/checkout@v4` → `pnpm/action-setup@v4` → `actions/setup-node@v4`（Node 24）→ `pnpm install` → `pnpm indexes:rebuild` → `git add -N .claude/skills/aiworkflow-requirements/indexes` → `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` の authoritative drift gate を構成
- post-merge hook 廃止後の「開発者が再生成を忘れた場合の drift が main に流入するリスク」を CI 側で構造的に塞ぐ
- drift 検出は `.claude/skills/aiworkflow-requirements/indexes` に限定し、他 skill / 他 path への横展開判定は ADR で別途決める方針
- `CLAUDE.md`「よく使うコマンド」/ `lefthook-operations.md` / `technology-devops-core.md` CI job 表に CI gate 名を最小追記し正本同期完了
- Phase 11 NON_VISUAL 代替証跡を main / manual-smoke-log / link-checklist の 3 点で配置し、PR 後の GitHub Actions 実機確認へ接続

#### 検証証跡

- `bash -n scripts/reinstall-lefthook-all-worktrees.sh`: PASS
- `pnpm indexes:rebuild` 後の `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes`: drift なし
- Phase 12 必須成果物 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）作成済み

#### follow-up backlog

- 他 skill（task-specification-creator 等）への indexes drift 検証横展開は ADR で別途判断
- workflow が PR 後に GitHub Actions 実機で PASS することの確認は Phase 13 後

#### 依存関係

| 依存先 | タスク ID / 成果物 |
| --- | --- |
| 先行 | task-git-hooks-lefthook-and-post-merge（post-merge から indexes 再生成を撤去） |
| 後続 | なし（独立 gate） |

#### lessons-learned

- `references/lessons-learned-verify-indexes-ci-2026-04.md`（L-VIDX-001〜003）
- `references/lessons-learned-lefthook-unification-2026-04.md`（L-LH-006: 責務分離の追記）

---

### タスク: task-lefthook-multi-worktree-reinstall-runbook 既存 30+ worktree への lefthook 一括 reinstall 運用化（2026-04-28）

| 項目 | 値 |
| --- | --- |
| タスクID | task-lefthook-multi-worktree-reinstall-runbook |
| ステータス | **完了（runbook 完了 / Phase 形式不要 / 実装済み）** |
| タイプ | DevEx / Operations / runbook |
| 優先度 | 中 |
| 完了日 | 2026-04-28 |
| 対象 | `scripts/reinstall-lefthook-all-worktrees.sh` / `doc/00-getting-started-manual/lefthook-operations.md` |
| 成果物 | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md`（拡充） |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (B-1 follow-up) |

#### 実施内容

- `scripts/reinstall-lefthook-all-worktrees.sh` を新規作成し、`git worktree list --porcelain` から path を抽出して各 worktree で `mise exec -- pnpm exec lefthook install` を逐次実行
- `--dry-run` モードで対象 path と PASS / SKIP 予定を非破壊で列挙可能
- 完了条件: FAIL = 0 件、`node_modules` 未生成 worktree は理由付き SKIP として summary に記録
- 並列実行は禁止（pnpm store 同時書き込み破壊回避のため逐次必須）
- `doc/00-getting-started-manual/lefthook-operations.md` に「既存 worktree への一括 install」運用化セクションを追加し、実行責任者・実行タイミング（lefthook.yml 改定時 / 新 hook 追加時）・ログ保存方針を明文化
- post-merge hook を復活させていないことを `lefthook.yml` で再確認

#### 検証証跡

- `bash -n scripts/reinstall-lefthook-all-worktrees.sh`: syntax PASS
- `bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run`: 対象 path 列挙 PASS
- 本実行: FAIL 0 件、PASS / 理由付き SKIP のみで完了

#### 苦戦箇所

| # | 苦戦箇所 | 解決策 |
| --- | --- | --- |
| 1 | 30+ worktree 並列での pnpm store 同時書き込み破壊リスク | 並列実行を禁止し、逐次 install + 各 worktree 単位の summary 記録に固定 |
| 2 | `node_modules` 未生成 worktree を FAIL と扱うと完了条件が成り立たない | SKIP 分類（PASS / SKIP / FAIL の 3 値）を導入し、SKIP は未達ではないと runbook で明示 |
| 3 | 「いつ誰が再 install するか」が人手忘却リスクに残る | runbook に実行責任者と実行タイミング（lefthook.yml 改定時等）を明文化 |

#### 依存関係

| 依存先 | タスク ID / 成果物 |
| --- | --- |
| 先行 | task-git-hooks-lefthook-and-post-merge / task-worktree-environment-isolation |
| 後続 | なし |

#### lessons-learned

- `references/lessons-learned-lefthook-unification-2026-04.md`（L-LH-MW-001 / L-LH-MW-002 を追記）

