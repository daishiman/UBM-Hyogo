# タスクタイプ判定フロー（docs-only / NON_VISUAL）

タスク作成前に下記フローで **taskType** と **visualEvidence** を確定させる。Phase 1 記録 → artifacts.json 生成まで一貫して使う。

```
タスクにコード変更が含まれる?
├─ YES → 実行可能な機能/テストを完了させる?
│         ├─ YES → taskType: "implementation"
│         │         visualEvidence: UI変更を伴う? "VISUAL" : "NON_VISUAL"
│         └─ NO  → taskType: "scaffolding-only"
│                   visualEvidence: UI/ブラウザ証跡が後続実行なら "VISUAL_DEFERRED"
└─ NO  → タスクはドキュメント/設計のみ?
          ├─ YES → taskType: "docs-only"
          │         visualEvidence: "NON_VISUAL"
          │         Phase 11: screenshot 不要 / main.md + manual-smoke-log.md + link-checklist.md の3点のみ
          └─ NO  → 再確認（スコープが未確定）
```

**判定後のルール**:
- `docs-only` / `spec_created` のタスクは Phase 11 でスクリーンショットを作らない
- production migration apply runbook のように本番操作の手順だけを formalize し、実 production mutation を Phase 13 merge 後の承認付き別運用に残すタスクは `requirements / operations / runbook` + `NON_VISUAL` として扱う。Phase 11/12 は `DOC_PASS` で閉じ、root workflow state は `spec_created` のまま維持し、runtime PASS / production applied facts は別 task の fresh evidence でのみ記録する
- ADR 起票 / deploy target decision / topology drift 解消のような docs-only タスクは、Phase 1 で `base case 別差分マトリクス`（cutover / 保留 / 段階移行など）を作り、以降の Phase はその表を参照する。base case 依存の記述を複数 Phase に散在させない
- ADR 起票タスクの Phase 4 は、実装テストではなく doc-only grep（deploy target 抽出 / リンク死活 / 不変条件抵触ガード / 関連タスク重複確認）を標準検証にする
- ADR 起票タスクの Phase 11 は NON_VISUAL とし、`manual-test-result.md` / `link-checklist.md` / `ui-sanity-visual-review.md` など、実測した文書・リンク・不変条件証跡で閉じる
- `scaffolding-only` / `VISUAL_DEFERRED` のタスクは skipped spec、placeholder screenshot list、placeholder axe report を実測 PASS と扱わない
- 実装/設計は完了しているが UI/ブラウザ証跡を後続の runtime smoke / production 実走で取得するタスクは `visualEvidence: VISUAL_ON_EXECUTION` を使う。`VISUAL_DEFERRED`（実装自体が後続）と併せて、validator (`scripts/validate-phase-output.js` の `classifyVisualEvidence`) は `non_visual` / `docs-only` / `spec_created` 群と同列で扱い、Phase 11 で実行前スクリーンショット不足を誤検出しない
- `scaffolding-only` を PR / push CI gate に入れる場合は manual-only に留め、full execution task で skipped spec 0 / real evidence 取得後に gate 化する
- `screenshots/` ディレクトリを作成しない（`.gitkeep` も不要）
- `artifacts.json` の `metadata.visualEvidence` に必ず明記する（省略すると screenshot 要求側に倒れる）

## Closeout state 分類補足 (2026-05-03 追加)

### Phase 1 baseline で stale failure を検出した場合の implementation 再分類ルール (2026-05-05 追加)

判定フロー（行 5-17）で `taskType=implementation` と確定した後でも、Phase 1 の current baseline が既に GREEN なら closeout state を `verified_current_no_code_change` へ再分類する。`taskType` 自体は元 task の意図（code fix 要求）を保つため `implementation` のままにし、サブタイプを `metadata.implementation_mode` に固定する。

**判定条件（3 点とも YES のとき再分類）**:

1. 元 unassigned task / Issue が `apps/<package>` への code fix を要求している（implementation の意図がある）
2. Phase 1 の focused command を current worktree で実行し、報告 fail が再現せず GREEN（例: Vitest 7/7 PASS）
3. broader 全体 gate ではなく focused 範囲で再現しないことを test-log diff / coverage snapshot で確認できる

**再分類した場合の artifacts.json metadata（root / outputs 共通）**:

| key | 値 | 備考 |
| --- | --- | --- |
| `taskType` | `implementation` | 元 task の意図を保持 |
| `visualEvidence` | `NON_VISUAL` | code fix が抑止された runtime evidence のみ |
| `metadata.workflow_state` | `verified_current_no_code_change_pending_pr` | Phase 13 user gate を含む正規値 |
| `metadata.implementation_mode` | `stale-current-verification` | 実装サブタイプ taxonomy。aiworkflow-requirements 側 `task-workflow-active.md` / lessons-learned と同一文字列で結節させる |

詳細運用と必須 gate は [phase12-skill-feedback-promotion.md §「Stale-current no-code verification rule」](phase12-skill-feedback-promotion.md) を参照。実例は Issue #379 schemaDiffQueue fakeD1 compat verification（`docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/outputs/phase-12/main.md`）。

| state | task type | visualEvidence | metadata.implementation_mode | 用途 |
| --- | --- | --- | --- | --- |
| spec_created | implementation / process | 任意 | （未指定） | 仕様書作成完了・実装未着手 |
| enforced_dry_run | implementation | NON_VISUAL | （未指定） | warning モードで動的検証中、blocking gate へ昇格前 |
| PASS_WITH_BLOCKER | implementation | NON_VISUAL | （未指定） | 全 phase の design GO は完了、runtime GO は外部前提（legacy cleanup 等）blocked。Issue #394 (stableKey strict CI gate) 実例。current evidence と planned-after-cleanup evidence を物理分離する |
| verified_current_no_code_change | implementation | NON_VISUAL | `stale-current-verification` | 元タスクは code fix を要求していたが、Phase 1 の current baseline が既に GREEN で stale failure と判定された状態。コード変更せず、baseline / after / coverage / Phase 12 strict outputs と consumed unassigned trace を同 wave で揃える。`metadata.workflow_state` は `verified_current_no_code_change_pending_pr` を使用 |
| completed | implementation / process | 任意 | （未指定） | runtime GO 完了・completed-tasks/ へ移動 |
