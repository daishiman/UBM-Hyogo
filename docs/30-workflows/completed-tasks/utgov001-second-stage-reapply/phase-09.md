# Phase 9: 品質保証（drift 検証 / 期待 contexts 一致確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証（drift 検証 / 期待 contexts 一致確認） |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL（QA / drift sync） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #202 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |

## 目的

Phase 8 で DRY 化された正本（Phase 5 = runbook 正本 / Phase 9 = 検証ロジック正本）を前提に、本タスクの品質保証を以下の 3 軸で行う。

1. **drift 検証**（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の 6 不変条件値との drift 検出）
2. **期待 contexts と適用後 GET contexts の集合一致検証**（順序不問・dev / main それぞれ）
3. **適用前後 GET の差分検証**（contexts 以外の値が完全一致していることの構造的確認）

これらを通じて AC-6（期待 contexts 完全一致）/ AC-7（drift 0）を Phase 13 実 PUT 後の検証手段として固定する。本 Phase は **検証ロジックの正本固定と、5 点同期チェックの差分マッピング** までを担い、CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新は **本タスクのスコープ外**（drift 検出時は別タスク起票）であることを明記する。

## 本 Phase でトレースする AC

- AC-6（適用後 GET の `required_status_checks.contexts` が期待 contexts と完全一致 / 順序不問・集合一致）
- AC-7（CLAUDE.md / deployment-branch-strategy.md drift 0 の確認 / 6 不変条件値）

## 実行タスク

1. drift 検証対象 6 値の検査ロジックを定義する（完了条件: 6 値すべてに `jq` 検査式と CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd の期待値マッピング）。
2. 期待 contexts と適用後 GET contexts の集合一致検証ロジックを定義する（完了条件: 順序不問・重複なし・dev / main 別個実行）。
3. 適用前後 GET の差分検証ロジックを定義する（完了条件: `jq 'del(.required_status_checks.contexts)'` で contexts を除いた値の `diff` が空であることの確認手順）。
4. dev / main の別個検証手順を明文化する（完了条件: dev → main の順序で別個実行・1 PUT 失敗時の検証スコープ局所化）。
5. 5 点同期チェック（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd / UT-GOV-001 applied JSON / UT-GOV-004 contexts source）の差分マッピングを定義する（完了条件: 5 点すべてに「drift あり」「drift なし」「N/A」のいずれかを付与）。
6. drift 検出時の起票方針を明文化する（完了条件: 本タスクで drift を直さず別タスクで起票する原則）。
7. 成果物 2 ファイル（`outputs/phase-09/main.md` / `outputs/phase-09/drift-check.md`）に分離して記述する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-02.md | drift 検査対象 6 値の起点 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-08.md | DRY 化済み検証ロジック正本位置付け |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-07.md | AC マトリクス（AC-6 / AC-7 トレース対象） |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | AC-1〜AC-14 / Secrets 一覧 / 不変条件 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 applied JSON / rollback payload |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json` 等） | 期待 contexts の正本（contexts source） |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance 節） | drift 検証基準（6 不変条件値の正本） |
| 必須 | docs/00-getting-started-manual/deployment-branch-strategy.md | deployment branch strategy 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/ci-cd.md | required_status_checks 関連の正本 |
| 参考 | .github/workflows/verify-indexes.yml | indexes drift gate（本タスクでは対象外だが参照） |

## drift 検証 6 値の検査ロジック

> 検査対象は、CLAUDE.md「ブランチ戦略 / Governance」節および deployment-branch-strategy.md / aiworkflow-requirements ci-cd で記述されている 6 不変条件値。本タスクではこれらの値を **書換しない**ため、適用後 GET の値と各正本の期待値が一致していることを確認する。

| # | 検査対象 | `jq` 検査式 | CLAUDE.md 期待値 | deployment-branch-strategy.md 期待値 | aiworkflow-requirements ci-cd 期待値 | drift 検出時の処置 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `required_pull_request_reviews` | `jq '.required_pull_request_reviews'` | `null`（solo 運用ポリシー） | feature → dev → main 昇格と整合（必須レビュアー数 0） | `null` 維持 | `outputs/phase-09/drift-check.md` に記録、CLAUDE.md / deployment-branch-strategy.md 側追従を別タスク起票 |
| 2 | `enforce_admins.enabled` | `jq '.enforce_admins.enabled'` | `true` | — | `true` | 同上 |
| 3 | `required_linear_history.enabled` | `jq '.required_linear_history.enabled'` | `true` | — | `true` | 同上 |
| 4 | `required_conversation_resolution.enabled` | `jq '.required_conversation_resolution.enabled'` | `true` | — | `true` | 同上 |
| 5 | `allow_force_pushes.enabled` | `jq '.allow_force_pushes.enabled'` | `false` | — | `false` | 同上 |
| 6 | `allow_deletions.enabled` | `jq '.allow_deletions.enabled'` | `false` | — | `false` | 同上 |

> dev / main それぞれの applied JSON に対して 6 値すべてを検査する。dev / main で値が異なる正当な理由はなく、ある場合は drift として `drift-check.md` に記録する。

## 期待 contexts と適用後 GET contexts の集合一致検証

### 検証ロジック（Phase 9 正本）

```bash
# dev
jq '. | sort' outputs/phase-02/expected-contexts-dev.json > /tmp/expected-dev.sorted.json
jq '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-dev.json > /tmp/applied-dev.sorted.json
diff /tmp/expected-dev.sorted.json /tmp/applied-dev.sorted.json
# 期待: 差分ゼロ

# main
jq '. | sort' outputs/phase-02/expected-contexts-main.json > /tmp/expected-main.sorted.json
jq '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-main.json > /tmp/applied-main.sorted.json
diff /tmp/expected-main.sorted.json /tmp/applied-main.sorted.json
# 期待: 差分ゼロ
```

### 集合一致原則

- **順序不問**: GitHub REST API は contexts 配列の順序を保証しない。`jq 'sort'` で正規化後に `diff` する。
- **重複なし**: `jq 'unique'` で正規化（事前に `expected-contexts-{dev,main}.json` 作成時に重複除去済）。
- **dev / main 別個**: dev の検証は dev の applied JSON のみで、main の applied JSON を参照しない。
- **空配列 = 失敗**: 適用後 GET の `required_status_checks.contexts` が `[]` であれば AC-4 / AC-6 違反。即時 rollback（Phase 5 § rollback 経路 §参照）。

## 適用前後 GET の差分検証（contexts 以外完全一致）

### 検証ロジック

```bash
# dev: contexts 以外の値が一致することを確認
jq 'del(.required_status_checks.contexts)' outputs/phase-13/branch-protection-current-dev.json > /tmp/current-dev.no-contexts.json
jq 'del(.required_status_checks.contexts)' outputs/phase-13/branch-protection-applied-dev.json > /tmp/applied-dev.no-contexts.json
diff /tmp/current-dev.no-contexts.json /tmp/applied-dev.no-contexts.json
# 期待: 差分ゼロ（contexts 以外は不変）

# main も同様
```

> 上記 diff で差分が出る場合、本タスクの責務境界（contexts 値のみ書換）を逸脱した変更が混入している。Phase 13 ユーザー承認後の実 PUT で他値が誤って書き換わっていないことを構造的に検証する手段。

## dev / main の別個検証

| 観点 | 設計 |
| --- | --- |
| 検証順序 | dev → main の順固定（Phase 8 共通化パターンと整合） |
| 検証スコープ | dev / main それぞれ独立。dev の検証で fail した場合 main の検証を進めない |
| 1 PUT 失敗時 | 失敗 branch のみ rollback 後再検証。成功 branch は維持 |
| 集合一致の片側不一致 | 失敗 branch の `expected-contexts-{branch}.json` を再生成する別タスク起票（AC-9 typo context 検出） |

## 5 点同期チェック

| # | 同期対象 | チェック方法 | 期待結果（案 A 採用 / second-stage 適用後） | 本タスクでの扱い |
| --- | --- | --- | --- | --- |
| 1 | CLAUDE.md（ブランチ戦略 / Governance 節） | `rg 'required_pull_request_reviews\|enforce_admins\|required_linear_history\|required_conversation_resolution\|allow_force_pushes\|allow_deletions' CLAUDE.md` で 6 値の現行記述抽出 | 6 値が `null` / `true` / `true` / `true` / `false` / `false` で記述 | drift 検出のみ。CLAUDE.md 側更新 PR は別タスク |
| 2 | deployment-branch-strategy.md | `rg` で feature → dev → main 昇格ルートと protected branch 設定の整合確認 | 昇格ルート + 6 値整合 | drift 検出のみ |
| 3 | aiworkflow-requirements references / ci-cd.md | `rg 'required_status_checks' .claude/skills/aiworkflow-requirements/references/` で正本記述抽出 | 6 値 + contexts 強制が機能している記述 | drift 検出のみ。実反映は別タスク（Phase 12 unassigned-task-detection） |
| 4 | UT-GOV-001 applied JSON | 1 段階目の applied JSON の 6 値と本タスク 2 段階目 applied JSON の 6 値の `diff` | 6 値完全一致（contexts のみが差分） | 一致しない場合は本タスクが contexts 以外を誤って書き換えた事故。即時 rollback |
| 5 | UT-GOV-004 contexts source | UT-GOV-004 成果物の dev / main 配列と本タスクの `expected-contexts-{dev,main}.json` の集合一致 | 集合一致（順序不問） | 一致しない場合は Phase 2 抽出ルールの不整合。Phase 2 へ差し戻し |

> **更新 PR は別タスク**: CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新は本タスクで行わず、drift 検出時に別タスクとして起票する。GitHub 側 protection を正本とする原則（CLAUDE.md「Governance」節）と整合。

## drift 検出時の起票方針

| drift 検出箇所 | 起票方針 | 起票先 |
| --- | --- | --- |
| CLAUDE.md と applied JSON の 6 値不一致 | CLAUDE.md 側を applied JSON（GitHub 側正本）に追従更新する別タスクを起票 | docs/30-workflows/unassigned-task/ |
| deployment-branch-strategy.md と applied JSON の不一致 | 同上（deployment-branch-strategy.md 側追従更新） | 同上 |
| aiworkflow-requirements references と applied JSON の不一致 | references 側追従更新 + `pnpm indexes:rebuild` 実行を別タスクで | 同上 |
| UT-GOV-001 applied JSON と本タスク applied JSON の差分（contexts 以外） | **本タスク内で即時 rollback**（drift 別タスクではなく事故対応） | Phase 5 ランブック §参照 |
| UT-GOV-004 contexts source と expected-contexts の不整合 | Phase 2 抽出ルールへ差し戻し | Phase 2 |

> **本タスクでは drift を直さない**。原則として GitHub 側 protection（applied JSON）を正本とし、CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新は別タスクで管理する。

## 対象外宣言

| 観点 | 対象外理由 |
| --- | --- |
| a11y（WCAG） | 本タスクは GitHub branch protection の REST API 操作。UI を持たないため WCAG 観点は対象外（NON_VISUAL） |
| 無料枠見積もり | GitHub REST API（authenticated rate limit 5000 req/h）に対し本タスクで 6 req（GET×2 / PUT×2 / 適用後 GET×2）程度のため見積もり不要 |
| coverage 閾値 | 本タスクはコード変更を伴わないため Vitest / coverage 閾値は対象外 |
| indexes drift（`verify-indexes-up-to-date`） | 本タスクで `.claude/skills/aiworkflow-requirements/indexes/` を更新しないため、既存 green を維持。drift 解消は別タスク |

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | ≤ 250 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-300 行 | 100-300 行 | 個別チェック |
| outputs/phase-09/main.md | 200-400 行 | 個別 | 個別チェック |
| outputs/phase-09/drift-check.md | 100-300 行 | 個別 | 個別チェック |

## CI ゲート（本タスク該当分）

| Gate | 確認方法 | パス条件 |
| --- | --- | --- |
| typecheck / lint / vitest / build | 本タスクはコード変更なし | 既存 CI green を維持 |
| verify-indexes | `.github/workflows/verify-indexes.yml` で `.claude/skills/aiworkflow-requirements/indexes` drift 検出 | 本タスクで indexes 直接更新がない場合は green を維持 |
| GitHub branch protection 自体（PUT 後の状態） | 適用後 GET と期待 contexts の集合一致 | 本 Phase の検証ロジックで構造化 |

## 実行手順

### ステップ 1: drift 検証 6 値の検査式固定

- `outputs/phase-09/drift-check.md` に 6 値 × 3 正本（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd）のマッピング表を固定。
- `jq` 検査式を 1 箇所に集約し、Phase 5 / 11 / 13 から `参考: phase-09 §drift 検証` で参照可能にする。

### ステップ 2: 期待 contexts 集合一致検証式固定

- `outputs/phase-09/main.md` に dev / main の `jq '. | sort' | diff` 形式を固定。
- 順序不問・重複なし・空配列禁止の 3 原則を併記。

### ステップ 3: 適用前後 GET 差分検証式固定

- `jq 'del(.required_status_checks.contexts)' | diff` の形式を main.md に固定。
- 差分が出た場合は事故対応（即時 rollback）の経路を Phase 5 §参照で示す。

### ステップ 4: 5 点同期チェック差分マッピング

- `outputs/phase-09/drift-check.md` に 5 同期点 × 「drift あり / なし / N/A」のマトリクスを記述。
- drift 検出時の起票方針を併記。

### ステップ 5: 成果物 2 ファイル分離

- `outputs/phase-09/main.md`: QA サマリー（6 値検査 / 集合一致検証 / 適用前後差分検証 / 対象外 / line budget / link / CI ゲート）
- `outputs/phase-09/drift-check.md`: 6 値 drift 検査詳細 + 5 点同期マッピング詳細

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 6 値 drift 結果 / 集合一致検証 / 5 点同期結果を GO/NO-GO の根拠 |
| Phase 11 | 整合性検査ログ（`jq` 検証 / drift 検査）として代替 evidence に再利用 |
| Phase 12 | drift 検出結果を unassigned-task-detection / documentation-changelog に register |
| Phase 13 | 適用後 GET から本 Phase の検証ロジックを実行し、AC-6 / AC-7 のトレース完了 |
| 別タスク | CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references 追従更新 PR の入力 |

## 多角的チェック観点

- 価値性: 6 値 drift 検査 + 集合一致検証で reconciliation 結論の正本伝播が保証されるか。
- 実現性: implementation / NON_VISUAL 範囲で `jq` + `diff` のみで完結するか。
- 整合性: 不変条件 6 値が Phase 1 / 2 / 8 / 9 で同一文言になっているか。
- 運用性: drift 検出時の別タスク起票方針が明示されているか。
- dev / main 独立性: 検証スコープが片側に閉じているか。
- 集合一致原則: 順序不問・重複なし・空配列禁止の 3 原則が記述されているか。
- 適用前後差分: contexts 以外の値が完全一致することの構造的検証が含まれているか。
- Secret hygiene: token 値を検証ログに残さない原則が記述されているか。
- docs-only 境界: CLAUDE.md / references の追従更新が本タスク外であることが明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | drift 検証 6 値の検査式固定 | 9 | spec_created | drift-check.md |
| 2 | 期待 contexts 集合一致検証式固定 | 9 | spec_created | main.md |
| 3 | 適用前後 GET 差分検証式固定 | 9 | spec_created | main.md |
| 4 | dev / main 別個検証手順 | 9 | spec_created | 順序固定 |
| 5 | 5 点同期チェック差分マッピング | 9 | spec_created | 5 対象 |
| 6 | drift 検出時起票方針 | 9 | spec_created | 別タスク化 |
| 7 | 成果物 2 ファイル分離 | 9 | spec_created | main / drift-check |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA サマリー（6 値 drift / 集合一致 / 適用前後差分 / 対象外 / line / CI） |
| ドキュメント | outputs/phase-09/drift-check.md | 6 値 drift 検査詳細 + 5 点同期マッピング詳細 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] drift 検証対象 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false`）すべてに `jq` 検査式と CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd 期待値が固定されている（AC-7）
- [ ] 期待 contexts と適用後 GET の集合一致検証ロジックが順序不問・重複なし・空配列禁止の 3 原則とともに固定されている（AC-6）
- [ ] 適用前後 GET の差分検証（contexts 以外完全一致）の検証式が記述されている
- [ ] dev / main 別個検証手順（dev → main 順 / 失敗時スコープ局所化）が記述されている
- [ ] 5 点同期チェック（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd / UT-GOV-001 applied JSON / UT-GOV-004 contexts source）の差分マッピングが完成
- [ ] drift 検出時の別タスク起票方針が明文化されている
- [ ] 対象外宣言（a11y / 無料枠 / coverage / indexes）が 4 件記述
- [ ] 成果物 2 ファイル（main.md / drift-check.md）が分離されている

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 6 値 drift / 集合一致 / 適用前後差分 / dev/main 別個 / 5 点同期 / 起票方針の 6 観点すべて記述
- 本 Phase でトレースする AC（AC-6 / AC-7）が完了条件に含まれる
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 6 値 drift 検査結果（更新 PR は別タスク化方針）
  - 期待 contexts 集合一致検証ロジック（Phase 13 で実適用）
  - 適用前後 GET 差分検証ロジック（Phase 13 で事故検出）
  - 5 点同期マッピング結果
  - drift 検出時の別タスク起票方針
  - 対象外宣言（a11y / 無料枠 / coverage / indexes）の根拠
- ブロック条件:
  - 6 値検査式の不足
  - 集合一致検証ロジックが順序込み完全一致になっている（AC-6 違反）
  - 適用前後差分検証の不足
  - 5 点同期マッピングに空セル
  - drift 検出時の起票方針未明記
  - drift を本タスク内で直そうとする方針が混入
