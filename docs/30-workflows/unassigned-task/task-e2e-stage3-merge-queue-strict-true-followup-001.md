# task-e2e-stage3-merge-queue-strict-true-followup-001: merge queue 導入 + `required_status_checks.strict=true` 切替 + ruleset 移行 (Stage 3 後続)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-e2e-stage3-merge-queue-strict-true-followup-001 |
| タスク名 | GitHub merge queue 導入を起点に `required_status_checks.strict=true` への切替および branch protection → ruleset 移行を計画・実施する Stage 3 後続タスク |
| 優先度 | LOW |
| 推奨Wave | Stage 3 完了後 / 複数 PR 並走が常態化したタイミング |
| 状態 | proposed (unassigned) — Stage 3 スコープ外として記録のみ |
| 親タスク | e2e-quality-uplift-stage-3 / 3c-branch-protection-contexts |
| 発見日 | 2026-05-10 |
| 検出元 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/index.md` 不変条件 #4「strict=false（merge queue 未導入）」/ `phase-13.md` §5 残課題引き継ぎ「merge queue 導入時の `strict=true` 切替」「ruleset 移行 — Stage 3 スコープ外」 |
| taskType | future-improvement |
| visualEvidence | NON_VISUAL |
| 関連 historical | task-e2e-stage3c-branch-protection-contexts-001（5 件 contexts append の先行タスク・本タスクは strict / ruleset 移行の後続） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Stage 3 / 3c では `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` 等を追加して merge gate を強化したが、`required_status_checks.strict` は **`false` のまま維持**することを明示的な不変条件として採用した（3c index.md 不変条件 #4「strict=false（merge queue 未導入）」）。

`strict=false` は「PR ブランチが base ブランチの最新 commit に対して up-to-date でなくても merge 可能」という挙動である。solo dev では PR の並走が少ないため drift リスクが顕在化しにくく、`strict=true` にすると毎回 base 取り込み → CI 再実行が必要となり、開発速度が大きく低下する。このため Stage 3 では意図的に `strict=false` を選択した。

一方で **複数 PR が同時に dev / main 上で並走するフロー**が常態化すると、`strict=false` 下では各 PR が古い base に対して green の status check を取得した状態で順次 merge され、merge 後の dev / main で実際に CI が落ちる「context drift（semantic merge conflict）」が発生し得る。Stage 3 では発生確率が低いと判断したが、scope の成長や solo→複数体制への移行に備えて将来対応を未タスクとして記録する必要がある。

加えて、GitHub の branch protection API（`/repos/.../branches/*/protection`）は legacy 扱いとなりつつあり、新仕様の **rulesets**（`/repos/.../rulesets`）への移行が GitHub から推奨されている。ruleset では policy snapshot 形式が異なり、3c で確立した evidence 取得スクリプト（before / after × dev / main の 4 snapshot 構造 + drift = 0 検証）はそのままでは動作しない。

### 1.2 問題点・課題

- **context drift の検知不能**: `strict=false` では PR 1 が old base で green、PR 2 が old base で green の状態で順次 merge され、merge 後の base で CI が落ちるケースを事前に gate できない。
- **merge queue 未導入**: GitHub の merge queue は `strict=true` 相当の up-to-date 制約を「順番に 1 件ずつ rebase + CI 再実行」で自動化する仕組み。導入しないと `strict=true` 切替時の開発体験が著しく劣化する。
- **ruleset 移行未着手**: branch protection は GitHub 側で deprecation roadmap に乗りうる。3c 系 evidence スクリプトは `gh api .../protection` 前提で組まれており、ruleset 化時には全面再設計が必要。
- **solo dev 適合性の判断**: solo dev で merge queue は基本的に過剰投資。複数体制移行 / OSS 化 / external contributor 受け入れ等のトリガーが発生しない限り適用しない方針も合理的。「いつ・どの条件で導入するか」の判定基準を未確定のまま残している。

### 1.3 放置した場合の影響

- 複数 PR 並走が増えた段階で context drift による dev / main の CI failure が頻発し、Stage 3 の merge gate が「事後的に red を検出するだけ」の状態に劣化する。
- GitHub が branch protection を deprecate / sunset した際、3c で組んだ evidence スクリプトと CLAUDE.md governance 表が一斉に陳腐化する（猶予期間内に移行できないと UT-GOV-001 系 drift check が破綻する）。
- solo→複数体制への移行時に「merge queue 検証 + strict=true 切替 + ruleset 移行」の 3 件を同時に着手することになり、リスクが集中する。

---

## 2. 何を達成するか（What）

### 2.1 目的

- 複数 PR 並走時の context drift を gate するための **merge queue 導入**を計画・実施する
- merge queue を前提に `required_status_checks.strict=true` へ安全に切替える
- branch protection から **ruleset への移行**を完了し、3c で確立した evidence パターン（before / after × dev / main の 4 snapshot 構造）を ruleset 形式に再設計する
- solo dev 運用ポリシー（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / force-push & 削除禁止）を一切 drift させない
- CLAUDE.md 「ブランチ戦略 / Governance」節を ruleset 移行後の正本表に更新する

### 2.2 最終ゴール（AC）

- **AC-01 導入トリガー判定**: 「いつ着手するか」の判定基準を仕様書に明文化し、適用条件 / 非適用条件をユーザーが意思決定できる状態にする。
- **AC-02 merge queue 動作確認**: dev / main で merge queue を有効化し、テスト用 PR 2 件以上を queue 経由で merge して CI 再実行 + linear history が成立することを確認する。
- **AC-03 strict=true 切替**: dev / main の `required_status_checks.strict` が `true` であり、5 件 contexts（3c で確立した構成）すべてが green でなければ merge 不能であることを実 PR で確認する。
- **AC-04 ruleset 移行**: branch protection 設定が ruleset へ移行され、`gh api repos/daishiman/UBM-Hyogo/rulesets` で同等以上の policy が再現されている。
- **AC-05 evidence パターン再設計**: ruleset 形式に対応した 4 snapshot（before / after × dev / main）+ drift = 0 検証スクリプトが再構築されている。
- **AC-06 solo policy drift = 0**: 移行前後で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / `allow_force_pushes=false` / `allow_deletions=false` 全項目に drift がない。
- **AC-07 CLAUDE.md 更新**: 「ブランチ戦略 / Governance / CODEOWNERS」節が ruleset 正本に基づく表に更新される。
- **AC-08 rollback path**: 移行失敗時に branch protection 形式へ戻す手順がスクリプト化されている。

### 2.3 スコープ

#### 含むもの

- merge queue 導入の実施可否判定基準の確定
- merge queue 有効化（GitHub repo settings の merge queue 設定 + 関連 workflow `merge_group` トリガー対応）
- `required_status_checks.strict=true` 切替（dev / main 両方）
- branch protection → ruleset 移行（policy 同等性の証明含む）
- 3c evidence スクリプトの ruleset 形式への再設計
- CLAUDE.md governance 節の更新
- rollback 手順のスクリプト化

#### 含まないもの

- `required_pull_request_reviews` の有効化（solo dev では引き続き `null`）
- 5 件 contexts の構成変更（Stage 3 で確立した contexts は維持）
- Lighthouse / E2E coverage 閾値の変更
- 組織レベル ruleset / enterprise ruleset への昇格
- CODEOWNERS の必須化（`require_code_owner_reviews=false` を維持）

### 2.4 成果物

| path | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/<task-dir>/index.md` | 仕様 | 着手判定基準 / merge queue 設計 / strict 切替計画 / ruleset 移行計画 |
| `docs/30-workflows/<task-dir>/outputs/phase-11/evidence/ruleset-dev-before.json` | evidence | 移行前 dev branch protection snapshot |
| `docs/30-workflows/<task-dir>/outputs/phase-11/evidence/ruleset-main-before.json` | evidence | 移行前 main branch protection snapshot |
| `docs/30-workflows/<task-dir>/outputs/phase-11/evidence/ruleset-dev-after.json` | evidence | 移行後 dev ruleset snapshot |
| `docs/30-workflows/<task-dir>/outputs/phase-11/evidence/ruleset-main-after.json` | evidence | 移行後 main ruleset snapshot |
| `docs/30-workflows/<task-dir>/outputs/phase-11/evidence/ruleset-policy-equivalence.log` | evidence | branch protection ↔ ruleset の policy 同等性検証結果 |
| `scripts/governance/ruleset-drift-check.sh` | script | ruleset 形式での drift = 0 検証 |
| `CLAUDE.md` | governance 正本 | ブランチ戦略 / Governance 節を ruleset 形式へ更新 |

---

## 3. どのように実行するか（How）

### 3.1 着手判定基準（必須事前ゲート）

以下のいずれかが満たされた時点で初めて本タスクを着手する。満たされない限り「Stage 3 スコープ外として記録のみ」を維持する。

| トリガー | 判定方法 |
| --- | --- |
| 複数 PR 並走による context drift が実観測 | dev / main 上で merge 直後の CI failure が直近 30 日で 2 件以上記録される |
| GitHub branch protection の deprecation 公式アナウンス | GitHub blog / changelog で sunset roadmap が提示される |
| solo→複数体制への移行 | external contributor 受け入れ / OSS 化 / co-maintainer 追加 |
| ruleset 限定の新機能依存 | bypass actor / push ruleset 等の branch protection 非対応機能を要件化 |

### 3.2 前提条件

| 条件 | 理由 |
| --- | --- |
| Stage 3 / 3c の 5 件 contexts gate が dev / main で実効化済み | 切替時の baseline が確定している必要がある |
| `lighthouse-ci` / `e2e-tests-coverage-gate` 等の workflow が `merge_group` event をハンドル可能 | merge queue は `merge_group` event で CI を再実行する。未対応だと queue 内で job が起動しない |
| ユーザー明示承認 | repository setting の実 PUT / ruleset 作成を伴うため UT-GOV-001 系 / 3c と同一の user-gated 扱い |

### 3.3 推奨アプローチ

1. **判定**: 3.1 のトリガー充足を確認。未充足なら本タスクは proposed のまま据え置く。
2. **設計フェーズ**: branch protection の現行 policy を `gh api .../protection` で取得し、ruleset 形式へ写経した equivalence map を作成。
3. **workflow 修正**: `lighthouse.yml` / `e2e-tests.yml` 等の trigger に `merge_group` を追加し、PR トリガーと同一 job が起動するよう確認。
4. **dev 先行 dry-run**: dev のみ ruleset を draft 状態で作成し、branch protection と並列稼働。実 PR で同等 gate が成立することを確認。
5. **dev cutover**: branch protection を解除し ruleset を enforce。after JSON snapshot を取得。drift = 0 を `ruleset-drift-check.sh` で検証。
6. **merge queue 有効化（dev）**: GitHub repo settings の merge queue を dev で有効化し、test PR 2 件以上で queue 経由 merge を実証。
7. **strict=true 切替（dev）**: ruleset の `required_status_checks.strict_required_status_checks_policy` を up-to-date 必須に切替。
8. **main 適用**: dev で 1 週間以上問題なしを確認後、main にも同手順を適用。
9. **CLAUDE.md 更新**: ruleset 正本に基づき governance 節を全面書き換え。
10. **rollback path 整備**: branch protection JSON への逆変換スクリプトを `scripts/governance/` に格納。

### 3.4 rollback 手順

1. ruleset を `gh api -X DELETE /repos/.../rulesets/{id}` で削除
2. before JSON を入力に `gh api -X PUT /repos/.../branches/{dev,main}/protection` で原状復帰
3. merge queue を repo settings で disable
4. CLAUDE.md を pre-migration 版へ revert
5. LOGS.md に rollback 実施時刻と原因を記録

---

## 4. 受入基準

| ID | 内容 | 検証方法 |
| --- | --- | --- |
| AC-01 | 着手判定基準が仕様書に明文化されている | 仕様書 §3.1 を peer review |
| AC-02 | merge queue 経由で test PR 2 件以上が成功 merge | `gh pr list --state merged` + `gh api .../merge-queue` 履歴 |
| AC-03 | dev / main の strict 設定が `true` | `gh api .../rulesets/{id}` で `strict_required_status_checks_policy=true` |
| AC-04 | branch protection → ruleset 移行完了 | `gh api .../branches/{dev,main}/protection` が 404 または non-required / `gh api .../rulesets` に同等 policy |
| AC-05 | 4 snapshot + drift check スクリプトが ruleset 形式で動作 | `bash scripts/governance/ruleset-drift-check.sh` 実行ログ |
| AC-06 | solo policy 6 項目すべて drift = 0 | drift check スクリプト出力 |
| AC-07 | CLAUDE.md governance 節が ruleset 形式で更新済み | git diff 確認 |
| AC-08 | rollback スクリプトが整備され dry-run で正常動作 | `scripts/governance/rollback-to-branch-protection.sh --dry-run` |

---

## 5. 苦戦箇所と将来の解決指針

**1. solo dev における過剰投資判定**: merge queue は基本的に複数 PR 並走を前提とした仕組みで、solo dev では「1 件ずつ手で順次 merge」と挙動が同一になりやすい。導入コスト（workflow `merge_group` 対応 / repo settings 変更 / drift check 再設計）に見合う実害が発生していない段階で着手するとオーバーエンジニアリングになる。**指針**: §3.1 の判定トリガー（実観測の context drift / GitHub deprecation / 複数体制移行）のいずれかが満たされるまで proposed 維持。

**2. context drift と運用負荷のトレードオフ**: `strict=false` 下で context drift が発生する確率と `strict=true` で毎回 base 取り込み + CI 再実行する運用負荷は、PR 並走数 / CI 実行時間 / dev / main の commit 頻度に依存する。solo dev 現状では `strict=false` が合理的だが、複数体制では `strict=true` + merge queue の組み合わせが最適解になる。**指針**: 30 日窓で `gh api .../check-runs` から merge 直後の CI failure 件数を集計するモニタリング workflow を別途設計し、閾値（例: 2 件 / 30 日）超過で本タスクを active 化する判定 automation を組む。

**3. ruleset 移行時の policy snapshot 形式変更**: branch protection の `/branches/*/protection` レスポンスと ruleset の `/rulesets/{id}` レスポンスはスキーマが大きく異なる（`required_status_checks.contexts` 配列 vs `rules[].parameters.required_status_checks` 内のオブジェクト構造）。3c で確立した evidence 取得スクリプト（4 snapshot 構造 + `jq` ベースの drift check）はそのままでは動作しない。**指針**: 移行前に branch protection JSON ↔ ruleset JSON の equivalence map を確立し、両形式で同じ「正規化済み policy snapshot」を生成する正規化レイヤーを `scripts/governance/normalize-policy.sh` として導入。drift check は正規化後の形式で比較する設計に再構築する。

**4. `merge_group` event 未対応 workflow の検知漏れ**: merge queue 有効化時に `merge_group` event を trigger に含めていない workflow は queue 内で起動せず、required status check が timeout / pending のまま停止して全 PR が永久に merge 不能になる事故が発生する。**指針**: 全 workflow yaml を `grep -L merge_group .github/workflows/*.yml` でリストアップし、required contexts に対応する workflow が漏れなく `merge_group` を持つことを CI gate 化（例: `verify-merge-group-coverage` job）。

**5. 段階適用での dev / main 同期破綻**: dev に先に ruleset / merge queue を適用した後、main では branch protection のままという中間状態が長期化すると、CLAUDE.md governance 表が dev / main で異なる正本を参照することになり drift 検証が複雑化する。**指針**: dev cutover から main cutover までの期間を最大 14 日に制限する SLA を仕様書に明記。期限超過時は dev rollback で同期を取る。

**6. enforce_admins=true 維持下の admin token スコープ事故**: ruleset 作成 API は branch protection と異なる scope を要求する場合がある。`gh auth status` で admin scope を事前確認しても、ruleset 関連 endpoint で 403 が返るケースが報告されている。**指針**: dev で dry-run（draft ruleset）を必ず先行し、main 適用前に scope 不足の有無を実 API レスポンスで確定させる。

**7. CLAUDE.md governance 表の正本切替タイミング**: ruleset 移行が dev / main で完了する前に CLAUDE.md を ruleset 形式に書き換えると、UT-GOV-001 系 drift check が `gh api .../protection` 経由で確認した実値と CLAUDE.md 表記の不整合を誤検知する。**指針**: CLAUDE.md 書き換えは main cutover 完了後の同一 PR で実施。dev 先行期間中は CLAUDE.md を branch protection 表記のまま維持し、移行進行中である旨の注記を一時追加する。

---

## 6. 参考リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/index.md` 不変条件 #4 | `strict=false（merge queue 未導入）` の明示 |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-13.md` §5 残課題 | `merge queue 導入時の strict=true 切替` / `ruleset 移行 — Stage 3 スコープ外` |
| 先行タスク | `docs/30-workflows/unassigned-task/task-e2e-stage3c-branch-protection-contexts-001.md` | 5 件 contexts append + 4 snapshot evidence パターン |
| governance 正本 | `CLAUDE.md` ブランチ戦略 / Governance / CODEOWNERS 節 | solo dev policy 不変条件 |
| GitHub docs | `https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets` | ruleset 公式仕様 |
| GitHub docs | `https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue` | merge queue 公式仕様 |
| 関連運用 | UT-GOV-001 / Issue #554 audit-correlation-verify | read-only before / explicit consent / after JSON / drift = 0 パターン |
| フォーマット | `docs/30-workflows/unassigned-task/task-e2e-stage3c-branch-protection-contexts-001.md` | unassigned-task テンプレ準拠元 |

---

## 7. 備考

- 本タスクは「Stage 3 を完成させた後、運用実態の変化を待ってから着手する」性質の future-improvement であり、proposed 状態のまま長期保管されることを前提とする。
- solo dev 期間中は §3.1 の判定トリガー監視のみを軽量 automation で維持し、トリガー発火時に initial estimate を実施する流れを推奨。
- ruleset 移行は GitHub 側の deprecation roadmap に追従するため、外部都合で優先度が LOW → HIGH に昇格する可能性がある。年 1 回程度 GitHub changelog をレビューして優先度を再評価する。
