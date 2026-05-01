# Phase 12 Documentation Guide

## Task 12-1: 実装ガイド作成【必須・2パート構成】

| パート | 対象読者 | 内容 |
| ------ | -------- | ---- |
| **Part 1** | **初学者・中学生レベル** | **概念的説明（日常の例え話、専門用語なし）** |
| Part 2 | 開発者・技術者 | 技術的詳細（型、シグネチャ、使用例、エラー、エッジケース、設定） |

**Part 1 記述ルール**:
- 日常生活での例え話を**必ず**含め、`たとえば` を最低1回明示する
- 専門用語は使わない（使う場合は即座に説明）
- 「なぜ必要か」を先に説明してから「何をするか」を説明
- 作成後に `references/phase12-checklist-definition.md` と `validate-phase12-implementation-guide.js` で内容要件を確認する

**Part 2 追補ルール**:
- `spec_created` workflow では「実装済み」と書かず、`current contract` と `target delta` を分けて書く
- API シグネチャだけで閉じず、型定義、使用例、エラーハンドリング、エッジケース、設定可能パラメータ/定数一覧を省略しない
- 実装先行の task では Before/After が同じでもよい。その場合は `Before = current implementation`、`After = same / no-op` と明記し、差分を捏造しない
- `future sync target` の列挙だけで終わらせず、今回 wave で何を更新し、何を no-op 判定したかを対応する成果物へ残す
- screenshot fallback を完了根拠に使う場合は、placeholder-only の証跡を PASS 扱いにせず、coverage / metadata / fallback reason / source evidence まで current workflow に揃えた実測値で書く
- state-only の修正は `NON_VISUAL` を優先し、callback 系の回帰は `setupCallbackCapture()` 相当の deterministic テストで固定する

### docs-only / legacy umbrella の簡略化

docs-only / NON_VISUAL、または legacy umbrella close-out では、Part 1 は長いチュートリアルではなく「なぜ旧入口を閉じるか」を短い例えで説明する。Part 2 は current contract と target delta、責務移管表、direct 残責務 0 件、stale/current/historical 分類を中心にする。runtime / UI 変更がない場合、screenshot evidence は要求せず、検証は Phase 12 7 ファイル実体、`audit-unassigned-tasks --target-file`、index 再生成、mirror parity のコンパクトな表でよい。

**Part 2 必須見出し（IPC 変更がある場合）**:

5. **Consumer Contract & IPC Compatibility** (IPC 変更がある場合のみ必須):
   - IPC 戻り値スキーマの Before/After テーブル
   - Type guard / optional field による差分吸収ルール
   - Fire-and-forget パターン時の timeout 設定 (CHANNEL_TIMEOUTS)
   - 完全整合が残る場合の follow-up 未タスク ID

**Part 1 テンプレート**:
```markdown
### X.X [機能名]とは何か

#### 日常生活での例え

[日常の具体的なシーン]に似ています。

例えば、[身近な例]のようなものです。

#### この機能でできること

| 機能 | 説明 | 例 |
|------|------|-----|
| 機能A | 簡単な説明 | 具体例 |
```

詳細: `references/technical-documentation-guide.md`、`references/phase12-checklist-definition.md`

## Task 12-2: system spec update summary

- Step 1 の実施結果
- Step 2 の判定結果
- 更新した spec と理由
- canonical root / mirror policy
- canonical filename は `system-spec-update-summary.md`
- `artifacts.json` と `outputs/artifacts.json` の同期結果も書く
- `artifacts.json` / `outputs/artifacts.json` の title / type / status / phase artifact 名 parity を初手で確認し、ずれたまま `PASS` にしない
- root/output artifacts parity は full mirror と lightweight parity marker を区別する。全項目一致でない場合は、どの key を marker として同期したかを明示し、full mirror 済みと書かない
- Phase 11 が NON_VISUAL の場合でも `manual-test-checklist.md` など補助成果物の有無を記録する
- Phase 11 が docs-only / NON_VISUAL の infrastructure verification の場合、`implementation-guide.md` に Phase 11 evidence file 一覧と「実測完了ではなく evidence template 完了」の境界を明記する
- state-only の修正は NON_VISUAL と判定し、manual-test-checklist.md と自動テスト結果を残す
- Implementation spec-to-skill sync: Phase 12 が skill behavior を変える場合は owning skill reference / asset を同一 wave で更新し、implementation-guide の current facts だけに閉じ込めない

### 設計タスク（docs-only）での注意

設計タスクであっても Step 1-A〜Step 2 の**実ファイル更新は必須**である。
「設計タスク範囲外」として実更新を保留してはならない。

具体的に必須な更新:
- LOGS.md 2ファイル更新（aiworkflow-requirements + task-specification-creator）
- SKILL.md 2ファイルの変更履歴更新
- topic-map.md の再生成（`generate-index.js` 実行）
- 新規型定義がある場合は `interfaces-*.md` への型定義配置
- `task-workflow.md` の完了タスク記録
- docs-only 前提で作成した follow-up に後からコード変更が入った場合は、`phase-*.md` と `outputs/phase-12/*.md` の narrative も同じターンで current facts に戻す
- `spec_created` task に code wave が入った場合は、workflow 本文だけでなく system spec 側の current contract も同ターンで更新し、`no-op` を自己申告しない
- Phase 12 は `main.md` を含む 7 成果物を実体確認し、root / outputs `artifacts.json` の Phase status と outputs list を同値にする。成果物があるのに `pending` のまま残す状態は FAIL。
- 起票元 unassigned がある場合は、後継 workflow path、Issue 状態、AC close-out 状態、実装委譲先を起票元へ追記する。候補だけを workflow 内に残して起票元を未更新にしない。
- Phase 10 などの approval gate では `technical_go` と `user_approved` を分ける。docs-only NON_VISUAL の Phase 11/12 close-out は進行可でも、commit / push / PR は user approval なしに実行しない。
- chunk / cursor / offset など再開可能性を扱う設計タスクでは、cron tick 間隔と 1 invocation budget を分けて書き、行削除・挿入・並べ替え時の offset invalidation 条件を実装委譲に含める。
- `spec_created` implementation で code scaffold / local implementation が存在する場合は、scaffold completed / local tests PASS / runtime staging PASS を分離して書く。template や local PASS だけで production/staging runtime PASS と記録しない
- HTTP 202 / retryable / resumable workflow は、continuation target が API / queue / documented operation から再発見できることを system spec update summary と compliance check に記録する

サブエージェントに委譲する場合も、「設計タスクだから更新不要」という判断を許容しない。

### Phase 12 一括 SubAgent 実行プロファイル

大きい Phase 12 close-out は、監査だけを並列化し、編集は ownership を固定して直列に統合する。

| Lane | 責務 | 出力 |
| --- | --- | --- |
| A | Phase 12 成果物・artifacts parity・Phase 11 evidence 監査 | 不足ファイル / ledger drift / planned wording の差異 |
| B | system spec sync 監査 | resource-map / quick-reference / topic-map / lessons / task-workflow / LOGS / parent docs の不足 |
| C | unassigned 整理監査 | `open` / `done` / `baseline` / `duplicate` と formalize decision |
| D | skill feedback 監査 | どの苦戦箇所をどの skill へ反映するかの候補 |

統合順は `成果物実体確認 -> artifacts parity -> system spec sync -> unassigned audit -> skill feedback -> mirror parity -> compliance PASS` とする。Step 2 の N/A / 更新あり判定 owner は Lane B に固定し、他 lane は evidence を渡すだけにする。SubAgent の自己申告は完了根拠にせず、最後は validator 実測値、artifact existence、mirror diff、500 行制限の実測で閉じる。

### スキル反映・canonical tree 監査追加ルール

実装仕様をスキルへ反映する Phase 12 close-out では、次を同じ compliance check に入れる。ADR 起票、deploy target decision、Pages / Workers topology drift のような docs-only タスクでは、Phase 12 Step 2 を `stale contract withdrawal / 正本同期` として扱い、新規 API / 型がないことだけを理由に Step 2 を N/A にしない。

| 確認対象 | PASS 条件 | 不合格時の扱い |
| --- | --- | --- |
| `.claude/skills/<skill>` と `.agents/skills/<skill>` | mirror `diff -qr` が差分なし、または差分理由を記録済み | skill sync 未完了 |
| skill feedback | 苦戦箇所が主担当 skill / 補助 skill / 正本仕様導線のどれに入るか分類済み | Task 12-5 未完了 |
| current canonical workflow tree | resource-map / task-workflow が指す root に `index.md` と `artifacts.json` が存在する、または stale / archived / follow-up と明示済み | 未タスク化だけでは PASS 不可 |
| legacy path / filename | 旧 citation が残る場合は `legacy-ordinal-family-register.md` に旧→新 path を登録済み | system spec sync 未完了 |
| ADR / decision record | ADR または decision record の配置先、deploy / architecture / GHA parent docs、resource-map / quick-reference / topic-map、task-workflow / artifact inventory / LOGS、skill-feedback-report.md の反映先が同期済み | docs-only close-out 未完了 |

canonical workflow tree の削除を検出した場合、`docs/30-workflows/unassigned-task/*.md` に起票するだけでは不十分である。current canonical set を復元するか、resource-map / task-workflow / legacy register 側で stale-current や archived に再分類してから PASS とする。

`skill-feedback-report.md` に「大幅変更なので今回反映しない」と書いた後でユーザーが明示的に skill 反映を依頼した場合は、既存 reference への最小追記を優先する。新規 skill や大きいテンプレート再編が必要な場合だけ追加承認を取る。
## Task 12-3: documentation changelog

- 変更した file 一覧
- validator 実行結果
- current / baseline の区別
- artifacts 同期結果
- build artifact の文字列監査は `rg -F` を優先し、0件判定は `rg -q` の exit code と文書上の `match 0件` を対で残す
- human-authored な Phase 12 成果物は task root 直下ではなく `outputs/phase-12/` に置く
- `index.md` / `phase-*.md` / `artifacts.json` / `outputs/artifacts.json` の4点同期結果
- Step 1-A で更新した `aiworkflow-requirements` / `task-specification-creator` の `SKILL.md` / `LOGS.md` を canonical path で列挙する
- `skill-creator` を改善した場合は、`skill-creator/SKILL.md` / `LOGS.md` / 変更した template or reference も同じ changelog に列挙する
- `更新予定` / `計画済み` / `PR マージ後に実施` のような future wording を残さない

## Task 12-4: unassigned detection

- 0件でも summary を残す
- 1件以上なら formalize path を記録する
- raw メモで終わらせず、`audit-unassigned-tasks.js --target-file` が通る full template まで昇格させる
- cleanup / restore / fix 系の例外タスクでも、`スコープ`、`苦戦箇所【記入必須】`、`リスクと対策`、`検証方法`、`完了条件` を省略しない
- `new unassigned task` と書いた候補は同一 wave で `docs/30-workflows/unassigned-task/*.md` に formalize するか、候補表から削除して理由を記録する
- repo 全体の baseline 違反が多い場合は `current` と `baseline` を分離して記録する
- duplicate source / ID collision のような source document 側の既知ドリフトは、今回差分起因でない限り `baseline / wider governance` として扱い、重複した新規未タスクを増やさない
- `scope-definition.md` など既存成果物へ implementation anchor を追記した時は、target source path の実在確認と `system-spec-update-summary.md` / `documentation-changelog.md` への同値記録をセットで行う
- Phase 12 再監査で follow-up 自体を同一 wave 内に解消した場合は、open set から除外し、`docs/30-workflows/completed-tasks/unassigned-task/` へ完了移管した path を current fact として残す
- `open` と `done` を同じ表に並べる場合は、`status` 列か等価な記法で未完了と完了移管を明示し、`documentation-changelog.md` / `system-spec-update-summary.md` / `task-workflow-backlog.md` の記述粒度をそろえる

### 未タスク配置マトリクス

| Source | Placement |
| --- | --- |
| active / future implementation | `docs/30-workflows/unassigned-task/` |
| completed workflow に閉じた follow-up | `docs/30-workflows/completed-tasks/<workflow>/unassigned-task/` |
| standalone completed spec | `docs/30-workflows/completed-tasks/<task>/` |
| legacy standalone completed backlog | `docs/30-workflows/completed-tasks/unassigned-task/`（既存互換のみ） |

新規作成は semantic filename を使い、旧 filename / path を残す場合は legacy register へ記録する。

標準表は `検出項目 / status(open|done|baseline|duplicate) / formalize decision / path / 根拠` を基本形にする。current wave で解消した項目は `done`、既存未解消だが今回差分起因でないものは `baseline`、既存タスクと同義なら `duplicate` と明記する。


## Task 12-5: skill feedback

- 改善点があれば next action を書く
- 改善点なしでも「なし」と理由を書く
- `skill-feedback-report.md` は単なる成果物ではなく routing decision として扱う
- 各苦戦箇所に `promotion target / no-op reason / evidence path` を付ける
- 「改善点なし」は、確認した scope（task-specification-creator / aiworkflow-requirements / skill-creator / validation scripts）と no-op 理由を明記した場合だけ許可する
- `spec_created` task に code / path realignment / validation script change が入った場合は、古い Step 2 `N/A` や skill feedback `N/A` を維持せず再分類する
- 詳細な routing matrix は `references/phase12-skill-feedback-promotion.md` を参照する

## Task 12-6: phase12-task-spec-compliance-check（P4対策・最終確認）

- Task 1〜5 の全完了を確認してから作成する（早期完了記載禁止）
- 全タスクが「完了」と記録されてから Phase 12 を閉じる
- `documentation-changelog.md` だけでなく `outputs/phase-12/*.md` 全体に planned wording（「計画」「予定」「TODO」）が残っていないことを確認する
- **[W1-02b-3] ドキュメント内の識別子（関数名・props 名）が現行コードのものか確認する**
  - `implementation-guide.md` に記載した callback 名・props 名・型名を現行実装ファイルで `grep` 確認する
  - 代表コードスニペットは「型定義・props interface」から引用する方針にする（手書き snippets は drift の温床）
  - 不一致が見つかった場合は `implementation-guide.md` を current facts へ更新してから compliance-check を PASS にする
- `spec_created` workflow は root path と status の整合も確認し、`completed-tasks/` 配下にあることを理由に `completed` へ上げない
- `計画済み` / `更新予定` / `作成待` / `完了または計画済み` は未完了扱いとし、compliance-check を PASS にしない
- `outputs/phase-11/manual-test-result.md` が `not_run` のままなら Phase 11 / 12 を completed にしない
- internal adapter の実装だけで public IPC / preload contract 更新済みとは記録しない
- Phase 13 は user approval 未取得なら `blocked` を維持し、completed へ進めない
- skill を更新した場合は canonical `.claude/skills/...` と mirror `.agents/skills/...` の parity も記録する
- mirror parity は `.agents/skills/<skill>` が存在する場合のみ必須。存在する場合は `diff -qr`、存在しない場合は明示的な N/A 理由を記録し、missing mirror を PASS evidence として扱わない
- skill feedback の各 item が `promoted-to` または no-op reason まで閉じていることを確認する
- compliance-check は自己申告 PASS で閉じず、validator 実測値、artifact existence、mirror parity、Phase 11 evidence の実ファイル根拠を結び付けて記録する
- `docs-only / VISUAL / runtime evidence pending` の task は `Spec template completeness = PASS` と `Production/runtime compliance = PENDING_RUNTIME_EVIDENCE` を分離し、実 production PASS を主張しない

**確認コマンド（docs-only / UI task 共通で必須）**:

```bash
rg -n "計画|予定|TODO|will be|を予定|仕様策定のみ|保留として記録" \
  outputs/phase-12/*.md
# 出力が 0 件であること
```

## 完了前チェック

- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

上記 6 ファイルが揃ってから Phase 12 を閉じる。
配置先はすべて `outputs/phase-12/` とし、task root 直下の `phase-12-documentation.md` は集約サマリーだけを持つ。

## Phase 12 canonical filename 固定表（strict / 別名なし）

Phase 12 成果物は以下 7 ファイル名で**完全固定**する。`system-spec-update.md`（`-summary` 抜き）/ `feedback.md` / `compliance-check.md` のような短縮形・別名・suffix 違いは一切許容しない。`outputs/phase-12/` 直下に置き、task root 直下や別 dir には作らない（task root の `phase-12-documentation.md` だけは集約サマリーとして併存可）。

| canonical path | 役割 | 許容される別名 | 反例（NG） |
| --- | --- | --- | --- |
| `outputs/phase-12/main.md` | task root `phase-12-documentation.md` から参照される Phase 12 集約サマリー本体（任意。Lane 統合 narrative を載せる場合のみ） | なし | `phase12-main.md` / `phase-12-main.md` / `summary.md` |
| `outputs/phase-12/implementation-guide.md` | Task 12-1 の中学生レベル + 開発者レベル 2 パート構成実装ガイド | なし | `impl-guide.md` / `implementation.md` / `dev-guide.md` |
| `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 の system spec 更新サマリー（Step 1 / Step 2 / canonical-mirror parity / artifacts 同期） | なし | `system-spec-update.md`（`-summary` 抜き）/ `spec-update.md` / `spec-sync.md` |
| `outputs/phase-12/documentation-changelog.md` | Task 12-3 の変更ファイル一覧 / validator 結果 / artifacts parity / 4 点同期記録 | なし | `changelog.md` / `doc-changelog.md` / `docs-changelog.md` |
| `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 の未タスク検出表（0 件でも summary 必須）と formalize decision | なし | `unassigned-tasks.md` / `unassigned-detection.md` / `new-tasks.md` |
| `outputs/phase-12/skill-feedback-report.md` | Task 12-5 の skill 改善 feedback（改善なしでも「なし」と理由を記載） | なし | `skill-feedback.md` / `feedback-report.md` / `feedback.md` |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 の最終 compliance check（Task 1〜5 完了確認 / planned wording 0 件 / validator 実測） | なし | `compliance-check.md` / `phase12-compliance.md` / `task-spec-compliance.md` |

**運用ルール**:

- 上 7 ファイルの canonical filename は `documentation-changelog.md` / `phase12-task-spec-compliance-check.md` / `artifacts.json` / `outputs/artifacts.json` の 4 箇所すべてに**同一文字列**で記録する。`system-spec-update.md` と `system-spec-update-summary.md` のように 1 箇所でも drift があれば compliance-check を PASS にしない。
- リネーム / リファクタリング時は本表を先に更新し、git history を残した上で全 4 箇所に sed 相当の一括置換を当て、`rg -F "<旧名>" docs/30-workflows/<task>/` の出力が 0 件になったことを `documentation-changelog.md` に記録する。
- task root 直下に `phase-12-documentation.md` 以外の Phase 12 成果物（例: `phase-12-implementation-guide.md` / `phase-12-changelog.md`）を作るのは禁止。すべて `outputs/phase-12/` 配下に置く。
- 反例として `system-spec-update.md`（summary 抜き）/ `skill-feedback.md`（report 抜き）/ `compliance-check.md`（接頭辞抜き）が頻出するため、Phase 12 着手時に本表の canonical name を `outputs/phase-12/.gitkeep` 相当の placeholder として先に作っておくと drift しにくい。
