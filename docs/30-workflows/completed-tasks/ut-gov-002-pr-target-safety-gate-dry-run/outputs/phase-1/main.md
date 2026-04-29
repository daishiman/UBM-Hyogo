# Phase 1 — 要件定義（main）

## Status

spec_created

## 0. 上位原則（Guiding Principle）

> **trusted context（base リポの secrets / write 権限を持つ実行コンテキスト）では untrusted PR code を checkout / install / build / eval しない。**

本 Phase は、この原則を `pull_request_target` safety gate の dry-run / security review 仕様に落とし込むための真の論点・スコープ境界・前提条件を固定する。Phase 2 以降の設計・レビューは、本 main.md を入力として着手する。

## 1. 入力（前提依存）

本 Phase は以下の Phase 間・タスク間入力に依存する。`verification-report.md` の consistency warning を解消するため、参照を明示する。

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md` | safety gate 草案の正本仕様 |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md` §6 | `pr-target-safety-gate.workflow.yml.draft` の継承元 |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md` | security 観点 (S-1〜S-5) の継承元 |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md` | 本タスク発見根拠（U-2） |
| 上流タスク | UT-GOV-001（branch protection apply） | required status checks 名同期の前提 |
| 上流タスク | UT-GOV-007（action pin policy） | 外部 action の SHA pin 前提 |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` | AC-1〜AC-9 / 非スコープ |

> AC-6: 親タスク Phase 2 §6 草案を input として継承する旨を本節で明示。Phase 2（依存）/ Phase 3（NO-GO）でも重複明記する。

## 2. 真の論点（4 件）

| ID | 論点 | 内容 |
| --- | --- | --- |
| (a) | `pull_request_target` の **triage 専用化** | base リポの write 権限と secrets を持つ `pull_request_target` を、label 操作 / auto-merge 判定 / コメント投稿などの **PR メタデータ操作** のみに限定する。PR head の checkout / install / build / script eval は禁止。 |
| (b) | `pull_request` workflow への **build/test 分離** | untrusted PR code の checkout / install / lint / test / build は `pull_request` トリガに移し、`permissions: { contents: read }` のみで動作させる。secrets を一切参照しない。 |
| (c) | fork PR シナリオでの **token / secret 露出ゼロ** | same-repo PR / fork PR / labeled trigger / scheduled trigger / re-run の各シナリオで、GITHUB_TOKEN や repo secrets が untrusted code から到達不可能であることを設計レベルで保証する。 |
| (d) | "pwn request" パターン **非該当** のレビュー観点 | GitHub Security Lab の "pwn request" 解説に列挙された各パターン（PR head checkout under pull_request_target / `workflow_run` を介した secrets 橋渡し / `head.*` 文字列の script eval など）に該当しないことをレビュー記録として残す。 |

## 3. 命名 canonical（全 Phase 統一）

| canonical | 意味 |
| --- | --- |
| `pull_request_target safety gate` | `pull_request_target` を triage 専用化し、untrusted code 実行と分離する一連の workflow 設計 |
| `triage workflow` | `pr-target-safety-gate.workflow.yml`（trigger=`pull_request_target`、用途=label/auto-merge/コメント） |
| `untrusted build workflow` | `pr-untrusted-build.workflow.yml` 系（trigger=`pull_request`、用途=untrusted PR code の checkout / install / build / test） |
| `pwn request pattern` | GitHub Security Lab が定義する、`pull_request_target` 配下で untrusted PR コードを実行して secrets を奪取する攻撃パターン |

> 表記揺れ（"PR target" / "safety-gate" / "triage-only workflow" など）は使用しない。Phase 3 用語整合チェックで再確認する。

## 4. 横断依存タスク（3 件）

| 関係 | タスク | 依存内容 |
| --- | --- | --- |
| 上流（必須） | task-github-governance-branch-protection（親） | Phase 2 §6 の `pr-target-safety-gate.workflow.yml.draft` を input として継承（AC-6） |
| 上流 | UT-GOV-001（github-branch-protection-apply） | dev / main が protected で、required status checks 名が job 名と同期されていることが dry-run 前提 |
| 上流 | UT-GOV-007（github-actions-action-pin-policy） | `uses:` が SHA pin されていることを前提に security review 観点を構築 |

## 5. スコープ境界

### 含む（in scope）
- dry-run / security review の **specification / runbook** 策定（docs-only）
- triage workflow と untrusted build workflow の責務分離設計の固定
- fork PR テストマトリクスの仕様化（実走は本タスク非対象）
- `permissions: {}` デフォルト＋ job 単位昇格、`persist-credentials: false` 全 checkout 固定の方針記述
- "pwn request" パターン非該当のレビュー観点列挙

### 非スコープ宣言（out of scope）

> AC-8: 以下は本タスクで扱わず、Phase 5 実装ランブック以降の **別 PR** で行う。Phase 13 でも重複明記する。

- 実 `.github/workflows/pr-target-safety-gate.yml` / `pr-untrusted-build.yml` の編集
- dry-run の **実走**（fork PR / 実 PR を用いた smoke test）
- secrets / token の rotate
- branch protection JSON の本適用（UT-GOV-001 に分離）
- action pin policy の本適用（UT-GOV-007 に分離）
- CODEOWNERS 整備
- 外部 CI（CircleCI / Jenkins 等）統合

## 6. リスク

| ID | リスク | 影響 | 緩和（後続 Phase での扱い） |
| --- | --- | --- | --- |
| R-1 | "pwn request" による secrets 漏えい | base リポの secrets / write token が fork PR の悪意あるコードに掌握される | (a) triage 専用化、(b) PR head checkout 禁止、Phase 2 §"pwn request 非該当 5 箇条"／Phase 3 review で確認 |
| R-2 | `pull_request_target` から PR head を checkout し untrusted code が GITHUB_TOKEN 高権限下で実行される | trusted context 内で任意コード実行 → repo write / package publish 等に到達 | triage workflow では `ref: github.event.repository.default_branch`（または `base.sha`）に固定。Phase 2 design.md / Phase 4 test-matrix.md で AC-1 を担保 |
| R-3 | `persist-credentials` 未指定で残存トークンが副作用を生む | job 終了後に `.git/config` に GITHUB_TOKEN が残り、後続 step / 拡張 action が再利用 | 全 `actions/checkout` に `persist-credentials: false` を強制（Phase 2 / Phase 5 / Phase 9 の 3 箇所で重複明記、AC-5） |

## 7. 用語集（初版）

| 用語 | 定義 |
| --- | --- |
| `pull_request_target` | base リポジトリ側で workflow を実行するトリガ。base の secrets / write GITHUB_TOKEN を持つため、fork PR からも特権実行できる。triage 用に限定使用する。 |
| `pull_request` | head ref（PR ブランチ）の workflow を実行するトリガ。fork PR では secrets が抽出され、GITHUB_TOKEN は read-only。untrusted build/test に使う。 |
| pwn request | GitHub Security Lab 定義。`pull_request_target` 配下で untrusted PR コードを checkout / 実行して secrets を奪取する攻撃パターン。 |
| triage | label 適用 / auto-merge 判定 / コメント投稿 等の **PR メタデータ操作**。PR コードの実行を伴わない。 |
| `persist-credentials` | `actions/checkout` のオプション。`false` で job 終了後に `.git/config` から GITHUB_TOKEN を消去する。 |
| GITHUB_TOKEN | workflow 実行ごとに発行される短命トークン。`pull_request_target` では write 権限可、`pull_request` （fork）では read-only。 |
| fork PR | 別アカウント / 別組織の fork ブランチから base リポへの PR。secrets は注入されないが、`pull_request_target` 経由では base 側で特権実行可能になる。 |

## 8. 完了条件チェック（Phase 1）

- [x] 真の論点 4 つ（(a)〜(d)）が §2 に明記されている。
- [x] 横断依存 3 タスク（親 / UT-GOV-001 / UT-GOV-007）が §4 に列挙されている。
- [x] 命名 canonical が §3 に確定している。
- [x] 非スコープ宣言（実 workflow 編集 / dry-run 実走 / secrets rotate / CODEOWNERS / 外部 CI）が §5 に明記されている。
- [x] リスク R-1〜R-3 が §6 に列挙されている。
- [x] 用語集（pull_request_target / pull_request / pwn request / triage / persist-credentials / GITHUB_TOKEN / fork PR）が §7 に列挙されている。
- [x] 親タスク Phase 2 §6 草案を input として継承する旨が §1 に明記されている（AC-6）。
- [x] `docs-only` / `NON_VISUAL` / `infrastructure_governance + security` が固定されている（AC-7）。

## 9. 次 Phase への引き継ぎ

Phase 2 は本 main.md §2（真の論点）と §3（命名）と §6（リスク）を入力として、`outputs/phase-2/design.md` に責務分離設計と AC-1〜AC-9 マッピングを記述する。
