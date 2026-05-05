# Phase 12: ドキュメント更新

> 本 phase-12.md は 300 行を超える可能性があるが、`phase-template-phase12.md` §「phase-12.md の 300 行上限と設計タスクの例外条項」の「NON_VISUAL タスクで Phase 11 代替証跡と Phase 12 outputs を直列記述する必要がある」例外条項を適用する。Phase 11 NON_VISUAL 連動および 6 必須成果物 + Task 6 compliance の責務分離不可能性を理由とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動テスト検証 / NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| Source Issue | #297 |
| TaskType | implementation |
| VisualEvidence | NON_VISUAL |
| workflow_state | 実装完了時 `completed` / 未実装段階 `spec_created` |

---

## 目的

resolve API contract follow-up の実装結果を、正本仕様（12-search-tags.md）/ aiworkflow-requirements references / apps/web admin client architecture / implementation-guide / 完了タスク台帳に同 wave で同期させ、4 層 drift（spec ↔ guide ↔ apps/web ↔ apps/api）を 0 化する。
本 Phase は Phase 12 必須 5 タスク + Task 6 compliance check（合計 7 ファイル必須）を実施する。

---

## 事前チェック【必須】

`.claude/rules/06-known-pitfalls.md` の以下を読む:

- P1 / P25: LOGS.md 2 ファイル更新漏れ
- P2 / P27: topic-map.md 再生成忘れ
- P3: 未タスク管理 3 ステップ不完全
- P4: documentation-changelog 早期完了記載
- UBM-005: root / outputs `artifacts.json` 二重 ledger 同期漏れ
- UBM-018: `taskType=implementation × spec_created × docsOnly=true` 三併存ケース誤完了

加えて、`phase-12-pitfalls.md` の **三併存ケース集** を必ず参照し、本タスクが「実装混入あり / なし」のどちらで close-out するかを Step 1-B 手前で確定する。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| スキル | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 7成果物 / Task 1-6 の準拠基準 |
| スキル | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | implementation / NON_VISUAL / same-wave sync 境界 |
| 正本 | `docs/00-getting-started-manual/specs/12-search-tags.md` | resolve API 契約 SSOT |
| 正本 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | response body / error code |
| 正本 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | admin client 契約 |

---

## 実行手順

1. Phase 11 の NON_VISUAL evidence と validator 実測値を確認し、Phase 12 に進める状態か gate 判定する。
2. Task 12-1〜12-6 の成果物を `outputs/phase-12/` に作成し、7 ファイル実体を揃える。
3. `docs/00-getting-started-manual/specs/12-search-tags.md` と aiworkflow-requirements references を same-wave で更新する。
4. root / outputs `artifacts.json` parity、planned wording 0、indexes rebuild を確認する。
5. compliance check に実測値を転記し、PASS は実体・実測・同期証跡が揃った後だけ記録する。

---

## 実行タスク

| Task | 内容 | 主成果物 |
| --- | --- | --- |
| Task 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システムドキュメント更新サマリー（Step 1-A/B/C + Step 2 判定） | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出レポート（0 件でも必須 / UT-07A-03 を後続候補として再掲） | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバックレポート（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | phase12-task-spec-compliance-check（7 ファイル実体確認） | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

- Task 12-1: 実装ガイド作成
- Task 12-2: システムドキュメント更新サマリー
- Task 12-3: ドキュメント更新履歴
- Task 12-4: 未タスク検出レポート
- Task 12-5: スキルフィードバックレポート
- Task 12-6: 7 ファイル compliance check

---

## Phase 12 outputs/ 必須成果物（合計 7 ファイル）

| # | ファイル | 由来 Task | 欠落時 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4（0 件でも必須） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5（改善なしでも必須） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 | FAIL |

---

## Task 12-1: 実装ガイド作成（2 パート構成）

### Part 1（中学生レベル / 日常の例え）

#### 必須要件

- 「たとえば」を最低 1 回含む
- 「なぜ必要か」→「何をするか」の順序
- 専門用語に括弧書きで日常語を補う

#### 推奨アナロジー

> 「会員さんに札（ふだ）を貼る人（管理者）が、札を**選んで貼る**のか、それとも**貼るのを断る**のか、どちらか 1 つを必ず書類に書いてください。書類が空っぽや、選ぶと断るの両方が書いてあるものは受け付けません」

- 「選んで貼る」= action: confirmed + tagCodes（選ぶ札の名前リスト）
- 「貼るのを断る」= action: rejected + reason（なぜ断るかの理由）
- なぜ必要か: 札を貼る人が「とりあえず後で決める」ができないようにして、判断を必ず書類に残すため
- 何をするか: API に送る箱の中身を「選ぶ」か「断る」のどちらか 1 つだけ書く

### Part 2（技術者レベル）

#### 必須要件（C12P2-1〜C12P2-5）

| # | 要件 | 本タスクでの記述 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | `TagQueueResolveBody` discriminated union（`z.infer<typeof tagQueueResolveBodySchema>`） |
| C12P2-2 | API シグネチャ | `resolveTagQueue(queueId: string, body: TagQueueResolveBody): Promise<TagQueueResolveResponse>` |
| C12P2-3 | 使用例 | confirmed / rejected / idempotent 各 1 例（ts コードブロック） |
| C12P2-4 | エラー処理 | 400 validation_error / 409 conflict / 422 unknown_tag_code の判別と再 throw 戦略 |
| C12P2-5 | 設定可能パラメータ | `tag_definitions.code` の許容文字集合 / `reason` の最大長 |

#### 追従 6 ファイル一覧（Part 2 必須記述）

| 層 | ファイル | 変更内容 |
| --- | --- | --- |
| 1 | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | `tagQueueResolveBodySchema` discriminated union 新設 |
| 2 | `apps/api/src/routes/admin/tags/queue/resolve.ts` | shared schema を import して body parse |
| 3 | `apps/web/src/lib/api/admin.ts` | `resolveTagQueue(queueId, body)` 引数型を shared から import |
| 4 | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` | 6 case（confirmed / rejected / idempotent / 400 / 409 / 422） |
| 5 | `docs/00-getting-started-manual/specs/12-search-tags.md` | alias 表追加 + body shape 文字列同期 |
| 6 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` + `architecture-admin-api-client.md` | body shape を 12-search-tags.md 参照に統一 |

#### test ケース表

| TC | action | body | expect status | expect body shape |
| --- | --- | --- | --- | --- |
| TC-01 | confirmed | `{action:"confirmed", tagCodes:["JOB_DEV"]}` | 200 | `{ok:true, result:{idempotent:false, queueId, status:"resolved", tagCodes}}` |
| TC-02 | rejected | `{action:"rejected", reason:"out of scope"}` | 200 | `{ok:true, result:{idempotent:false, queueId, status:"rejected", reason}}` |
| TC-03 | confirmed (再投入) | TC-01 と完全同一 | 200 | `{idempotent:true, ...}` |
| TC-04 | validation | `{action:"confirmed", tagCodes:[]}` 等 | 400 | `{error:"validation_error"}` |
| TC-05 | conflict | 別 payload で逆走 | 409 | `{error:"conflict"}` |
| TC-06 | unknown tag | `tagCodes:["UNKNOWN"]` | 422 | `{error:"unknown_tag_code"}` |

---

## Task 12-2: システムドキュメント更新サマリー

### Step 1-A: タスク完了記録

- `docs/00-getting-started-manual/specs/12-search-tags.md` に「完了タスク」セクション + UT-07A-02 行追加
- `.claude/skills/aiworkflow-requirements/LOGS.md` に完了エントリ追加
- `.claude/skills/task-specification-creator/LOGS.md` に完了記録追加（**2 ファイル両方必須** -- P1, P25）
- 両 SKILL.md の変更履歴テーブルを更新（P29）
- topic-map / generated index 再生成: `mise exec -- pnpm indexes:rebuild`

### Step 1-B: 実装状況テーブル更新

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` の admin tag queue resolve 行を `completed` に更新
- 三併存ケース判定: 本タスクは `apps/web` / `apps/api` / `packages/shared` への実装混入を含む実装タスク → workflow_state は `completed`（実装混入なしの場合のみ `spec_created` で据え置く）

### Step 1-C: 関連タスクテーブル更新

```bash
grep -rn "UT-07A-02" .claude/skills/aiworkflow-requirements/references/
grep -rn "UT-07A-02" docs/30-workflows/
```

- `task-workflow-active.md` の UT-07A-02 行ステータスを `completed` または `spec_created` に更新
- UT-07A-03 staging smoke 行を「上流: UT-07A-02 完了」に更新

### Step 2: システム仕様更新（条件付き）

| 対象 | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | resolve API 契約節を最新化 + alias 表（仕様語 ↔ DB enum ↔ API action）追加 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | resolve endpoint 行の body shape を 12-search-tags.md 参照に統一 |
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | `resolveTagQueue(queueId, body)` の client 型を最新化（discriminated union） |

> 本タスクは新規 zod schema 追加 + 既存 endpoint の body 契約変更を含むため、Step 2 は **N/A ではない**（実施必須）。

### Step 2A/2B（planned wording 残禁止）

- Step 2A: 更新予定ファイル列挙（本サマリー作成時）
- Step 2B: Phase 12 完了前に実更新を実施し、`仕様策定のみ` / `実行予定` / `保留として記録` 等の planned wording を 0 化する

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

---

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を含める:

- Block A: 変更ファイル一覧（apps/api / apps/web / packages/shared / docs / .claude/skills）
- Block B: validator 結果（typecheck / lint / contract test 件数 / `pnpm indexes:rebuild` exit 0）
- Block C: current canonical set / artifact inventory parity 確認結果
- Block D: workflow-local 同期 と global skill sync を**別ブロック**で記録（[Feedback BEFORE-QUIT-003]）

---

## Task 12-4: 未タスク検出レポート（0 件でも必須）

`outputs/phase-12/unassigned-task-detection.md` には以下を必ず含める:

| 項目 | 内容 |
| --- | --- |
| 検出件数 | 0 件（または N 件） |
| 後続候補（再掲） | UT-07A-03 staging smoke（resolve API を実 staging Cloudflare Workers / 実 D1 で実走確認） |
| SF-03 4 パターン照合 | 型定義→実装 / 契約→テスト / UI 仕様→コンポーネント / 仕様書間差異 を全件確認済み（0 件でも明記） |
| Phase 10 MINOR 追跡 | Phase 10 で MINOR 判定された項目があれば全て解決済 / 未タスク化のいずれかを明記 |

> UT-07A-03 は本タスクの後続として既知の `docs/30-workflows/unassigned-task/` 候補。新規 unassigned-task ファイルは作らず、既存候補として再掲のみ行う（UBM-021: `new unassigned task` 宣言は実ファイル化が必須のため、本タスクでは再掲のみで「既存候補参照」と明記する）。

---

## Task 12-5: スキルフィードバックレポート（改善点なしでも必須）

| セクション | 記載内容 |
| --- | --- |
| ワークフロー改善点 | discriminated union 契約の伝播タスクを横断テンプレ化できないか観察 |
| 技術的教訓 | shared zod schema を SSOT 化することで 4 層 drift 検出が typecheck で機械化される |
| スキル改善提案 | task-specification-creator: NON_VISUAL × API contract タスク向けの test ケース表テンプレ標準化 |
| 新規 Pitfall 候補 | 06c 由来の旧 docs（空 body 記述）を grep で検出する pre-commit gate 追加候補 |

> 改善点が真に 0 件の場合も「観察事項なし」と明記する（UBM-020: 英語技術語残存の確認も併せて実施）。

---

## Task 12-6: phase12-task-spec-compliance-check（7 ファイル実体確認）

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下表を含める。

| # | ファイル | 存在 | 必須セクション | 充足 |
| --- | --- | --- | --- | --- |
| 1 | `main.md` | ⬜ | Phase 12 概要 + 7 outputs 一覧 + same-wave sync 証跡 | ⬜ |
| 2 | `implementation-guide.md` | ⬜ | Part 1（たとえば 1 回以上）+ Part 2（C12P2-1〜5）+ 追従 6 ファイル + test ケース表 | ⬜ |
| 3 | `system-spec-update-summary.md` | ⬜ | Step 1-A/B/C + Step 2 実施記録（planned wording 0） | ⬜ |
| 4 | `documentation-changelog.md` | ⬜ | Block A/B/C/D + workflow-local / global sync 分離 | ⬜ |
| 5 | `unassigned-task-detection.md` | ⬜ | 検出件数 + UT-07A-03 再掲 + SF-03 4 パターン | ⬜ |
| 6 | `skill-feedback-report.md` | ⬜ | 4 セクション（改善点なしでも明記） | ⬜ |
| 7 | `phase12-task-spec-compliance-check.md` | ⬜ | 本表 + 同 wave sync 証跡 + artifacts parity 結果 | ⬜ |

### 確認手順

```bash
# 7 ファイル実体確認
ls outputs/phase-12/

# planned wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "OK"

# root / outputs artifacts.json parity
diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json) && echo "parity OK"

# index 再生成 + drift 確認
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/
```

`PASS` は「7 ファイル実体 + validator 実測値 + same-wave sync 証跡」が揃った後にのみ許可する。

---

## 並列 SubAgent 実行プロファイル

| レーン | 目的 | 編集可否 | 完了条件 |
| --- | --- | --- | --- |
| A | Phase 12 成果物 / artifacts parity 監査 | 禁止 | 7 outputs 実在 / parity 0 drift / status 表記差異報告 |
| B | system spec / index / LOGS / lessons 監査 | 禁止 | 12-search-tags.md / api-endpoints.md / architecture-admin-api-client.md 整合報告 |
| C | skill feedback / skill update 監査 | 禁止 | aiworkflow-requirements / task-specification-creator 更新候補報告 |
| owner | 編集適用 | 可（**Step 2 owner 固定**） | SubAgent 結果統合 → 同一ファイル編集を直列化 |
| validator | 最終検証 | 禁止 | `pnpm indexes:rebuild` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を実測記録 |

> 監査は並列、編集は直列。Step 2（system spec 更新）は owner 固定で衝突を防ぐ。

---

## root / outputs artifacts.json parity 確認手順

```bash
# 1. root と outputs を取得して整列差分を取る
jq -S . artifacts.json > /tmp/root.json
jq -S . outputs/artifacts.json > /tmp/outputs.json
diff /tmp/root.json /tmp/outputs.json && echo "parity OK"

# 2. metadata.workflow_state / docsOnly を確認
jq '.metadata' artifacts.json
jq '.metadata' outputs/artifacts.json

# 3. completed 成果物の参照切れを 0 件にする
node .claude/skills/task-specification-creator/scripts/verify-artifacts-parity.js \
  --workflow docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup
```

> 三併存ケース（UBM-018）を回避するため、本タスクが `apps/` / `packages/` への実装混入を伴うかを `git diff --stat` で確認し、混入あり = `workflow_state: completed` / 混入なし = `workflow_state: spec_created` を root と outputs の両方に記録する。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | TC-01〜TC-06 応答 / audit_logs サンプルを implementation-guide.md Part 2 に転記 |
| Phase 13 | implementation-guide.md 全文を PR コメントとして投稿（`/ai:diff-to-pr` Phase 3.6） |
| UT-07A-03 | unassigned-task-detection.md で staging smoke を後続候補として再掲 |

---

## 多角的チェック観点

- 不変条件 #11（主）: implementation-guide Part 2「やってはいけないこと」に「resolve API は member 本文編集経路を新設しない」を明記
- 不変条件 #5（副）: implementation-guide Part 2 の追従 6 ファイル表で apps/web から D1 binding に touch しないことを明記
- DRY: 12-search-tags.md を SSOT とし、api-endpoints.md / architecture-admin-api-client.md は参照リンクのみ
- planned wording 0 化（P57）: Step 2B 完了確認コマンドを必ず実行
- artifacts parity 0 drift（UBM-005）: root と outputs の `artifacts.json` を完全一致させる

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | implementation-guide Part 1 / Part 2 作成 | pending | C12P2-1〜5 全充足 |
| 2 | system-spec-update-summary（Step 1-A/B/C + Step 2） | pending | planned wording 0 必須 |
| 3 | documentation-changelog（Block A/B/C/D） | pending | workflow-local / global 分離 |
| 4 | unassigned-task-detection（0 件でも必須）| pending | UT-07A-03 再掲 |
| 5 | skill-feedback-report（改善なしでも必須）| pending | 4 セクション |
| 6 | phase12-task-spec-compliance-check | pending | 7 ファイル実体 + parity |
| 7 | LOGS.md × 2 / SKILL.md × 2 更新 | pending | P1 / P25 / P29 |
| 8 | indexes 再生成 + drift 確認 | pending | `pnpm indexes:rebuild` |
| 9 | artifacts.json parity 確認 | pending | root ↔ outputs 同期 |

---

## 成果物

| 種別 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| ドキュメント | `outputs/phase-12/main.md` | ✅ | Phase 12 本体 + 7 outputs 一覧 |
| ドキュメント | `outputs/phase-12/implementation-guide.md` | ✅ | Part 1 + Part 2 + 追従 6 ファイル + test ケース表 |
| ドキュメント | `outputs/phase-12/system-spec-update-summary.md` | ✅ | Step 1-A/B/C + Step 2 実施 |
| ドキュメント | `outputs/phase-12/documentation-changelog.md` | ✅ | Block A/B/C/D |
| ドキュメント | `outputs/phase-12/unassigned-task-detection.md` | ✅ | 0 件でも必須 |
| ドキュメント | `outputs/phase-12/skill-feedback-report.md` | ✅ | 改善点なしでも必須 |
| ドキュメント | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ | 7 ファイル実体確認 |

---

## 完了条件

- [ ] 実行タスクを「表」と「`- Task 12-X:` 箇条書き」の両方で記載
- [ ] `outputs/phase-12/` に 7 ファイルすべてが実在
- [ ] implementation-guide Part 1 に「たとえば」が 1 回以上
- [ ] implementation-guide Part 2 に C12P2-1〜5 全項目記述
- [ ] 追従 6 ファイル一覧と test ケース表が記述
- [ ] system-spec Step 1-A: LOGS.md × 2 / SKILL.md × 2 / topic-map 更新済み
- [ ] system-spec Step 1-B: workflow_state を `completed` または `spec_created` で確定（三併存ケース判定済み）
- [ ] system-spec Step 1-C: 関連タスクテーブル / UT-07A-03 行更新済み
- [ ] system-spec Step 2: 12-search-tags.md / api-endpoints.md / architecture-admin-api-client.md 実更新済み
- [ ] planned wording 0 件確認済み
- [ ] documentation-changelog Block A/B/C/D が揃う
- [ ] unassigned-task-detection に UT-07A-03 を後続候補として再掲
- [ ] skill-feedback-report が 4 セクション揃う
- [ ] phase12-task-spec-compliance-check に 7 ファイル × 必須セクション充足表
- [ ] root / outputs artifacts.json parity が 0 drift
- [ ] `mise exec -- pnpm indexes:rebuild` が exit 0
- [ ] artifacts.json の phase 12 を completed に更新
- [ ] 本 Phase 内の全タスクを 100% 実行完了

---

## タスク100%実行確認【必須】

- 全実行タスク（Task 12-1〜12-6）completed
- 7 outputs 実在 + same-wave sync 証跡完備
- planned wording 0 / artifacts parity 0 drift / indexes rebuild green
- artifacts.json の phase 12 を completed に更新

---

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: implementation-guide.md（PR コメント投稿用）/ documentation-changelog.md / 7 outputs full set / artifacts parity 結果
- ブロック条件: 7 ファイル欠落 / artifacts parity drift / planned wording 残存 / Step 2 未実施のいずれかがある場合は Phase 13 に進まない
