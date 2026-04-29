# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| Wave | 0（governance） |
| 実行種別 | serial（UT-GOV-004 完了 or 同時完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / scope: github_governance |
| 親 Issue | #144 |

## 目的

`task-github-governance-branch-protection` Phase 13 で承認済みの branch protection JSON 草案（dev / main）を、GitHub REST API `PUT /repos/{owner}/{repo}/branches/{branch}/protection` schema へ正規化した payload に変換し、適用前 snapshot 取得・dry-run・apply・rollback リハーサル・再適用までを 1 本の workflow として仕様化する。本 Phase は **要件確定** に閉じ、実 PUT は Phase 13 でユーザー承認後に別オペレーションで実施する。MVP 実装手段は **`gh api` 直叩き + payload を Git 管理する方式**（親仕様 §7 備考）に固定する。

## 真の論点 (true issue)

- 「branch protection を適用するか否か」ではなく、**「(a) UT-GOV-004 完了前に apply すると merge 不能事故が起きる順序リスク、(b) GET 応答 / PUT payload の field 差異による 422 事故、(c) `enforce_admins=true` で admin 自身が block される rollback 詰みリスク、(d) dev / main 片側適用ミスを同時に塞ぐ仕様化」**が本タスクの本質。
- 副次的論点として、(1) snapshot（監査用）と rollback payload（PUT 用）を別ファイルで持つ用途分離、(2) `lock_branch=false` の明示と将来 freeze runbook への切り出し、(3) CLAUDE.md と GitHub 実値の二重正本 drift 防止。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | UT-GOV-004 | `required_status_checks.contexts` の実在 job 名同期結果（直近 N 日の Actions run から抽出された積集合） | Phase 1 / 2 / 3 で「UT-GOV-004 未完了 = NO-GO」を 3 重明記 |
| 上流（必須） | task-github-governance-branch-protection Phase 13 承認 | 草案 JSON の最終承認 | Phase 2 のファイル変更計画で payload 起点として写経 |
| 上流 | task-github-governance-branch-protection Phase 2 design.md §2 | branch protection 草案（`enforce_admins` / `required_pull_request_reviews=null` / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false`） | adapter 入力 |
| 並列 | UT-GOV-002（PR target safety gate dry-run） | 適用後の挙動検証 | 本タスク完了後に protected な dev / main を提供 |
| 関連 | UT-GOV-003 / UT-GOV-007 | ownership / Actions pin policy | 本タスクは前提化のみ |
| 下流 | UT-GOV-002 / 005 / 006 / 007 | protected な dev / main を前提 | apply 完了状態を引き渡す |

## 依存タスク順序（UT-GOV-004 完了必須）— 重複明記 1/3

> **UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed であることが本タスクの必須前提である。**
> 未同期の contexts を投入すると、その context は永遠に green にならず、緊急 hotfix を含む全 PR が merge 不能になる（親仕様 §8.2）。先行 or 同時完了が必須。同時完了の場合は `contexts` を空配列にして PUT し、UT-GOV-004 完了後に再 PUT する 2 段階適用に切り替える。

## 価値とコスト

- 価値: governance 草案が「設計だけ存在し強制されない」状態を解消し、direct push / force push / branch 削除 / 並行 PR / 必須 status check 未通過 merge を構造的に block する。Phase 13 承認の意義が確定する。
- コスト: adapter 実装（jq / shell / Node 数十行レベル）+ payload JSON × 4（dev / main × {payload, rollback}）+ runbook 1 通。実装コストは小だが、UT-GOV-004 順序制約と `enforce_admins=true` の rollback 経路設計を誤ると本番事故に直結するため、仕様の網羅度が価値を決める。
- 機会コスト: Terraform / Pulumi 化と比べると軽量で、既存 `gh` CLI 運用と整合的。IaC 化は将来の別タスクで再評価可能。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev / main の direct push / force push / 削除 / 必須 check 未通過 merge を構造 block。governance 草案の実体化 |
| 実現性 | PASS | `gh api` + jq + payload の Git 管理は既存技術範囲。UT-GOV-004 同時完了でも 2 段階適用に逃せる |
| 整合性 | PASS | 不変条件 #5 を侵害しない。CLAUDE.md ブランチ戦略 / solo 運用ポリシー（`required_pull_request_reviews=null`）と整合 |
| 運用性 | PASS | snapshot / rollback payload 事前生成 + `enforce_admins` 単独 false 化手順により詰まないロールバック経路を確保 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| payload ファイル | `outputs/phase-13/` | `branch-protection-{payload,snapshot,rollback,applied}-{dev,main}.json`（branch サフィックス必須・bulk 化禁止） |
| runbook ファイル | `outputs/phase-13/apply-runbook.md` / `outputs/phase-11/apply-runbook.md` | dry-run → apply → rollback リハーサル → 再適用の 4 ステップ |
| コミットメッセージ | 本タスクは Phase 13 まで commit しない | `chore(governance): apply branch protection (dev/main) [UT-GOV-001]`（実行者承認後） |
| API エンドポイント | GitHub REST | `PUT /repos/{owner}/{repo}/branches/{branch}/protection`（v3 / accept: `application/vnd.github+json`） |
| CLI 経路 | `gh` CLI | `gh api repos/{owner}/{repo}/branches/{branch}/protection -X PUT --input <payload>.json` |
| solo 運用ポリシー | CLAUDE.md | `required_pull_request_reviews=null`（必須レビュアー不要） |

## 実行タスク

1. 親タスク仕様（`docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`）の §1〜§8 を写経し、本ワークフロー Phase 1〜13 に分解する（完了条件: AC-1〜AC-14 が `index.md` と一致）。
2. タスク種別を `implementation` / `visualEvidence: NON_VISUAL` / `scope: github_governance` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. UT-GOV-004 完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に重複明記する設計を予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. 苦戦箇所 8.1〜8.6 をすべて Phase 1 苦戦サマリ または Phase 2 リスク表に紐付ける（完了条件: 6 件すべてに対応 Phase が指定）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープが「タスク仕様書整備に閉じ、実 PUT は Phase 13 ユーザー承認後の別オペレーションで実施」することを Phase 1 §スコープで固定する（完了条件: 本仕様書 §スコープにその旨が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 親タスク仕様（§1〜§8 写経元） |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md §2 | 草案 JSON |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md §1, §2 | 実装ガイド |
| 必須 | CLAUDE.md（ブランチ戦略） | solo 運用ポリシー |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | PUT schema |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase outputs 骨格（Phase 1〜13 の main.md と NON_VISUAL / Phase 12 必須補助成果物）の作成
- UT-GOV-004 完了必須前提の 3 重明記
- GET → PUT 正規化 adapter 仕様の確定
- snapshot / rollback / applied / payload の `{branch}` 別ファイル戦略
- dry-run → apply → rollback リハーサル → 再適用 の 4 ステップ手順仕様化
- `enforce_admins=true` 適用時の rollback 経路と担当者明記
- `lock_branch=false` の明示
- adapter で正規化する field の最低限リスト（親仕様 §8.1）

### 含まない

- 実 `gh api PUT` の実行（Phase 13 ユーザー承認後の別オペレーション）
- UT-GOV-004 の job 名同期作業（別タスク）
- Terraform / Octokit / Pulumi 移行（将来 IaC 化フェーズ）
- CODEOWNERS 内容定義（UT-GOV-003）
- Actions action pin policy（UT-GOV-007）
- 自動 commit / push / PR 発行

## 実行手順

### ステップ 1: 親タスク仕様の写経

- `UT-GOV-001-github-branch-protection-apply.md` §1〜§8 を本仕様書の構造に分解し、`index.md` の AC-1〜AC-14 を確定する。

### ステップ 2: 真の論点と依存順序の固定

- UT-GOV-004 完了必須を Phase 1 / 2 / 3 で重複明記する設計を確定。

### ステップ 3: 4 条件評価のロック

- 4 条件すべてを PASS で確定。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `NON_VISUAL` / `github_governance` を Phase 1 で固定し、`artifacts.json.metadata` と整合。

### ステップ 5: 苦戦箇所 8.1〜8.6 の対応 Phase 割り当て

- §8.1 GET/PUT 差異 → Phase 2 adapter 設計
- §8.2 contexts 未出現値 → Phase 1 / 2 / 3 で 3 重明記（UT-GOV-004 前提）
- §8.3 lock_branch 運用未定義 → Phase 2 で `lock_branch=false` 固定
- §8.4 enforce_admins admin block → Phase 2 rollback 経路設計
- §8.5 dev/main 差分管理ミス → Phase 2 別ファイル戦略
- §8.6 CLAUDE.md 二重正本 → Phase 2 / 11 で grep 確認手順

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 / adapter 仕様 / 別ファイル戦略 / rollback 経路を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-14 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-14 を使用 |
| Phase 11 | dry-run / apply / rollback リハーサルの実走基準として AC-1〜AC-7 を渡す |
| Phase 13 | 実 PUT を user_approval_required: true で実行する根拠として AC-4〜AC-9 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 を触らない。違反なし。
- branch 戦略（CLAUDE.md）: solo 運用ポリシー（`required_pull_request_reviews=null`）と整合するか。
- 順序事故回避: UT-GOV-004 未完了で apply しない設計が 3 箇所に明記されるか。
- adapter 設計: GET/PUT 差異が field レベルで列挙されているか（親仕様 §8.1 最低限リスト）。
- rollback: `enforce_admins=true` で詰まない経路が事前生成 payload + runbook で保証されるか。
- bulk 化禁止: dev / main を独立 PUT として扱う前提が固定されているか。
- 二重正本: CLAUDE.md と GitHub 実値の grep 確認手順が含まれるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親タスク仕様の写経と AC-1〜AC-14 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | UT-GOV-004 完了前提の 3 重明記設計 | 1 | completed | Phase 2 / 3 で再記述 |
| 5 | 苦戦箇所 8.1〜8.6 の対応 Phase 割り当て | 1 | completed | 6 件すべて受け皿あり |
| 6 | スコープ「Phase 13 ユーザー承認後 PUT」固定 | 1 | completed | 含む / 含まない明記 |

## 苦戦箇所サマリ（親仕様 §8 写経）

| # | 苦戦箇所 | 受け皿 |
| --- | --- | --- |
| 8.1 | GET/PUT field 名差異（`enabled` ネスト ↔ flatten / `restrictions.users[].login` 配列 / `required_pull_request_reviews=null` / `enforce_admins.enabled→bool`） | Phase 2 adapter 仕様 |
| 8.2 | `required_status_checks.contexts` 未出現値で merge 不能 | Phase 1 / 2 / 3 三重明記 + 2 段階適用フォールバック |
| 8.3 | `lock_branch=true` 運用条件未定義で incident 詰み | Phase 2 で `lock_branch=false` 固定、freeze runbook は別タスク |
| 8.4 | `enforce_admins=true` で admin 自身 block | Phase 2 rollback 経路（`enforce_admins` のみ一時 false 化）+ 事前生成 rollback payload |
| 8.5 | dev/main bulk PUT で片側適用ミス | Phase 2 で `{branch}` サフィックス別ファイル + 独立 PUT 義務化 |
| 8.6 | CLAUDE.md と GitHub 実値の二重正本 drift | Phase 2 / 11 で grep 確認手順を runbook に記述 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「(a)〜(d) 4 リスクを同時に塞ぐ仕様化」に再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: github_governance` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実 PUT は Phase 13 ユーザー承認後の別オペレーション」が明記されている
- [x] AC-1〜AC-14 が `index.md` と完全一致している
- [x] UT-GOV-004 完了前提が依存境界で明記されている（3 重明記の 1 箇所目）
- [x] 苦戦箇所 8.1〜8.6 が全件 受け皿 Phase に割り当てられている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 8.1〜8.6 が全件 AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 4 リスク同時封じ + UT-GOV-004 前提
  - adapter 正規化対象 field の最低限リスト（親仕様 §8.1）
  - 別ファイル戦略（`{branch}` サフィックス・bulk 化禁止）
  - 4 ステップ手順（dry-run → apply → rollback リハーサル → 再適用）
  - `enforce_admins=true` rollback 経路設計
  - 4 条件評価 全 PASS の根拠
- ブロック条件:
  - 親タスク仕様（completed-tasks）の存在が確認できない
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-14 が index.md と乖離
  - 苦戦箇所 8.1〜8.6 のいずれかに受け皿 Phase が無い
