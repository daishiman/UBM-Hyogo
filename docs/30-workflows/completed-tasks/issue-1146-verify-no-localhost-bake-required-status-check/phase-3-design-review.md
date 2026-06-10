# Phase 3: 設計レビュー

| 項目 | 内容 |
| --- | --- |
| 対象設計 | Phase 2: 設計（yml paths 除去 + dev/main 個別 branch protection PUT） |
| GitHub Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（CLOSED 維持・`Refs #1146` のみ） |
| 視覚証跡 | NON_VISUAL |

---

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| **価値性** | OK | gate を required 化して localhost 焼き込み回帰を merge 時点で機械的に阻止。solo 運用の「品質保証は CI gate で担保」モデルに gate を組み込み、「存在するが効かない gate」の governance gap を解消する。paths 除去により全 PR で gate が resolve し、永久 pending block を構造的に回避する |
| **実現性** | OK | gate 本体は親 workflow で landed 済・動作実績あり。yml 変更は `on.pull_request.paths` ブロック除去のみで局所的。branch protection PUT は UT-GOV-001 / 既存 required check 追加の前例があり、dev/main 個別 GET → 全件保持 PUT → after diff の様式が確立済み。実測 5 context も確認済み |
| **整合性** | OK | 既存 required check 全 workflow（`ci.yml` / `validate-build.yml` / `e2e-tests.yml` / `lighthouse.yml`）が no-paths 常時実行である規約に整合。context 名 = job name `verify-no-localhost-bake`（単一 job ゆえ二段形式にならない）も既存命名と整合。CLAUDE.md ブランチ戦略の正本順位（GitHub 実値が正本・CLAUDE.md は運用参照）に整合 |
| **運用性** | OK | dev / main 独立 endpoint を個別操作。before/after read-only evidence で diff が `verify-no-localhost-bake` 追加のみであることを検証可能。他フィールドは before 同値送出で drift 0。実 mutation はすべて user-gated で承認境界が明確 |

## 2. Phase 4 へ進めるかの判定

**判定: GO**

4 条件すべて OK。設計に未解決の論点・前提矛盾はない。proto-spec の stale 前提（登録済 context 集合 / docs-only 寄り）は Phase 1 で実測へ是正済みであり、Phase 2 設計は実コードと整合している。Phase 4（テスト作成）へ進む。

## 3. リスクと対策

| リスク | 影響 | 対策 | 評価 |
| --- | --- | --- | --- |
| PUT が `required_status_checks.contexts` を全体上書きし、既存 5 context（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）が消える | 既存 gate の強制が外れ governance 崩壊 | before JSON の 5 context を**全件保持**したうえで `verify-no-localhost-bake` を末尾追加した完全配列を PUT。after JSON で 6 件揃うことを確認（AC-4） | 対策済 |
| `required_pull_request_reviews` / `lock_branch` / `enforce_admins` / `required_linear_history` / `required_conversation_resolution` の意図せぬ変更で governance drift | solo 運用ポリシー逸脱 | PUT payload は contexts 以外を**before JSON と同値**で送る。after 再取得で drift 0 を確認（AC-5） | 対策済 |
| context 名が GitHub Checks の実表記とずれ、pending のまま merge ブロック（never run） | 無関係 PR まで merge 不能 | context 名 = `verify-no-localhost-bake.yml` の `jobs.verify-no-localhost-bake.name`。単一 job ゆえ二段形式にならないことを確認済み。実登録文字列は before JSON / 実 run の Checks 表記で確定 | 対策済 |
| 未承認のまま branch protection を mutate | governance 破壊・想定外 merge ブロック | yml paths 除去 edit は local 実装として完了。`gh api -X PUT`（dev/main）/ commit / push / PR は **user-gated**。承認前は read-only GET evidence + PUT payload 提示までに限定（AC-8） | 対策済 |
| paths 除去で全 PR が gate を常時実行し CI コストが増える | CI 実行時間・コスト増 | job は `install + vitest（1 spec）+ grep` のみで安価。かつ既存 required check 全 workflow が no-paths 常時実行であり、追加コストは既存規約と同水準。required 化の前提（常に走る）を満たす唯一の整合解 | 許容（既存規約整合） |

## 4. Gate-A 判定

**Gate-A: passed**

- 要件（Phase 1）・設計（Phase 2）・設計レビュー（Phase 3）が揃い、4 条件評価が全 OK。
- リスクはすべて対策済 / 許容判定で、未解決の blocking なし。
- proto-spec の stale 前提は実測へ是正済みで、設計は現コードと整合。
- user-gated 境界（PUT / commit / push / PR）が明確に切られている。yml edit は local 実装として完了する。

次フェーズ（Phase 4: テスト作成）へ進行する。
