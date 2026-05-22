# Phase 2: 設計（Stage 0）

date (absolute): 2026-05-08

---

## 1. design topology（ファイル構造変化）

```
apps/web/
├── playwright/
│   ├── README.md                         ← Stage 0b 新規作成
│   ├── tests/
│   │   ├── profile-readonly.spec.ts      ← Stage 0c (i): 旧 evidence-only spec を削除
│   │   ├── profile-readonly-logged-in.spec.ts ← Stage 0c (i): logged-in evidence spec として新規配置
│   │   ├── profile-visibility-request.spec.ts ← Stage 0c (ii): :2 stale comment 削除
│   │   └── profile-delete-request.spec.ts     ← Stage 0c (ii): :2 stale comment 削除
│   ├── fixtures/auth.ts                  ← 変更なし（README で参照のみ）
│   └── page-objects/*                    ← 変更なし
└── playwright.config.ts                   ← Stage 0c (iii): projects[] に evidence-capture 追加

.claude/skills/task-specification-creator/references/
└── quality-gates.md §7.1                 ← Stage 0c (iv): (4) に例外条項追記
```

> 本サイクルで実 edit を完了済み。

---

## 2. 責務境界

| layer | 責務 | 触る成果物 |
| --- | --- | --- |
| skill spec (`task-specification-creator/references/quality-gates.md`) | un-skip 不変条件の正本。例外条件をここに 1 箇所だけ持つ | §7.1 (4) 末尾に exception list |
| apps/web/playwright/README.md | 開発者向け運用手順。skill spec の要旨を contextual に再掲し、`pnpm e2e` の実コマンド・project filter・fixture 解説を提供 | README 章構成 |
| Playwright project config (`apps/web/playwright.config.ts`) | runtime の `--project` filter で何を「標準」「opt-in」に分けるかを決定 | `projects[]` 配列 |
| spec 個別ファイル | `test.describe` の name と `test.skip(...)` 条件が、project filter とラベリングで合意通りに動くこと | `profile-readonly-logged-in.spec.ts`、stale comment 行 |

「正本は skill spec / 実態は config / 開発者導線は README」の 3 層分担。重複文言は最小化し、README は spec を「短く・実例付きで」紹介するに留める。

---

## 3. README 章構成（Stage 0b 設計確定版）

```
# Playwright E2E for apps/web

## 1. quick start
   - mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install chromium firefox webkit
   - mise exec -- pnpm --filter @ubm-hyogo/web e2e
## 2. coverage policy (standard tier)
   - coverageTier: standard / lines >= 70%
   - critical route smoke は 100%（後述）
   - artifact: coverage/e2e/coverage-summary.json
## 3. critical route smoke list
   - 認証導線: login → session → /profile 到達
   - public visitor: /members で email/連絡先非表示
   - admin destructive: member delete / status change / identity merge
   - 申請承認: visibility-request / delete-request の pending → approve
## 4. un-skip 不変条件（§7.1 (4) 抜粋）
   - test.describe.skip / test.skip(true) を spec に置かない
   - 一時 skip は test.fixme + Issue 番号
   - 例外: evidence-capture project（§7.1 exception list 参照）
## 5. auth fixture
   - memberPage / adminPage の挙動
   - storageState 経路（PROFILE_EVIDENCE_STORAGE_STATE）
## 6. project filter 一覧
   - desktop-chromium / desktop-firefox / mobile-webkit / staging（標準）
   - evidence-capture（opt-in、PROFILE_EVIDENCE_STORAGE_STATE 必要）
## 7. trouble-shooting
   - browser binary 未 install / dev server 未起動
```

各章は 5-15 行程度。README 全体で 200 行以内。

---

## 4. evidence-capture project 設計（Stage 0c）

### project 定義（本サイクルで `apps/web/playwright.config.ts:projects[]` に追加する形）

| field | value |
| --- | --- |
| `name` | `evidence-capture` |
| `testMatch` | `**/profile-readonly-logged-in.spec.ts` |
| `use` | `{ ...devices['Desktop Chrome'], storageState: process.env.PROFILE_EVIDENCE_STORAGE_STATE, viewport: { width: 1280, height: 800 } }` |
| 起動条件 | `process.env.PROFILE_EVIDENCE_STORAGE_STATE` が set かつ `--project=evidence-capture` を明示指定した時のみ |
| 標準 `pnpm e2e` への含有 | **含めない**（`pnpm e2e` script 側で `--project=desktop-chromium,desktop-firefox,mobile-webkit` を明示） |

### profile-readonly spec split の処遇

R1 は Phase 4 で **案 A: evidence-only spec rename/extract** に確定した。旧 `profile-readonly.spec.ts` は実態として logged-in evidence 専用だったため削除し、同内容を `profile-readonly-logged-in.spec.ts` へ移す。`test.skip(!storageState, ...)` は新 spec 内だけに残し、`evidence-capture` project 経由でのみ意味を持つ。

### quality-gates.md §7.1 (4) 追記文面（仕様書として確定）

```
4. **un-skip 不変条件**: ... ランタイムで skip されてはならない。
   - 例外: `apps/web/playwright.config.ts` の `evidence-capture` project は、
     `PROFILE_EVIDENCE_STORAGE_STATE` が set された時のみ意味のある evidence
     キャプチャ専用 project であり、`apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`
     に限って `test.skip(!storageState, ...)` を保持してよい。
     ただし以下を満たすこと:
     a. 標準 `pnpm e2e` の project filter から除外されている
     b. `apps/web/playwright/README.md` で例外として明記されている
     c. tier 判定では coverage 計測対象外（experimental 扱い）
```

### stale comment 削除

| path:line | before | after |
| --- | --- | --- |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` | `// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。` | (削除) |
| `apps/web/playwright/tests/profile-delete-request.spec.ts:2` | `// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。` | (削除) |

`describe.skip` は既に除去済みのため、コメントだけが残っている stale 状態。削除のみで活性化は伴わない。

---

## 5. 既存 Playwright config の reuse 分析（FB-SDK-07-1）

| 既存パターン | 場所 | 流用方針 |
| --- | --- | --- |
| `projects[]` に device + viewport を持つ entry を並べる | `apps/web/playwright.config.ts:26-47` | そのまま 5 番目に `evidence-capture` を追加 |
| `staging` project が env で baseURL を切り替える | `:39-46` | env 駆動の opt-in パターンを踏襲 |
| `webServer` 1 件で `pnpm --filter @ubm-hyogo/web dev` を起動 | `:48-55` | 変更なし（evidence-capture も同一 dev server を使う） |
| EVIDENCE_DIR 定数で artifact 集約 | `:3-4` | README は別 artifact path（`coverage/e2e/`）を案内するに留める |

新規パターンの導入なし。既存 entry の structural copy で済む。

---

## 6. validation paths

| 種別 | コマンド | 期待値 |
| --- | --- | --- |
| spec docs grep | `grep -n "un-skip\|coverageTier\|critical route\|memberPage\|adminPage" apps/web/playwright/README.md` | 5 種すべて hit |
| stale comment 残存確認 | `grep -rn "Phase 11 manual smoke で test.describe.skip" apps/web/playwright/tests/` | 0 件 |
| skill spec 例外追記確認 | `grep -n "evidence-capture" .claude/skills/task-specification-creator/references/quality-gates.md` | 1 件以上 |
| project filter 動作確認 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=evidence-capture` | spec が listed される |

---

## 7. リスク

| # | リスク | 緩和策 |
| --- | --- | --- |
| R1 | 旧 `profile-readonly.spec.ts` の名前では evidence 専用であることが分からず、標準 suite と混同される | Phase 4 で案 A（evidence-only spec rename/extract）に確定し、`profile-readonly-logged-in.spec.ts` を evidence 専用にした |
| R2 | README の §7.5 抜粋が skill spec とドリフトする | README は本文を再掲せず「§7.5 を参照」link のみとし、tier table 1 行だけ明記 |
| R3 | quality-gates.md の例外条項が拡大解釈され他 spec にも適用される | 例外文面に「`profile-readonly-logged-in.spec.ts` のみ対象」を明記、他 spec が追加される時は新サイクルで個別審査 |
| R4 | implementation 分類のため Phase 11 evidence が薄くなる | L1 docs-grep + L2 lint-boundary（`grep -rn "test.describe.skip" apps/web/playwright/tests/` = 0）で AC を補強 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
