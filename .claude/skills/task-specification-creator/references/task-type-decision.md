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
- 外部 SaaS の plan / account / dashboard 認証に依存する docs-only decision task は `docs-only / NON_VISUAL` のまま扱える。ただし representative schema sample と runtime production sample を分け、公式 constraints file（URL / checked date / runtime boundary）を置く。Cloudflare dashboard session や API token が無い状態で runtime sample 取得済みと記録しない
- `scaffolding-only` / `VISUAL_DEFERRED` のタスクは skipped spec、placeholder screenshot list、placeholder axe report を実測 PASS と扱わない
- 実装/設計は完了しているが UI/ブラウザ証跡を後続の runtime smoke / production 実走で取得するタスクは `visualEvidence: VISUAL_ON_EXECUTION` を使う。`VISUAL_DEFERRED`（実装自体が後続）と併せて、validator (`scripts/validate-phase-output.js` の `classifyVisualEvidence`) は `non_visual` / `docs-only` / `spec_created` 群と同列で扱い、Phase 11 で実行前スクリーンショット不足を誤検出しない
- `scaffolding-only` を PR / push CI gate に入れる場合は manual-only に留め、full execution task で skipped spec 0 / real evidence 取得後に gate 化する
- `screenshots/` ディレクトリを作成しない（`.gitkeep` も不要）
- `artifacts.json` の `metadata.visualEvidence` に必ず明記する（省略すると screenshot 要求側に倒れる）

## Closeout state 分類補足 (2026-05-03 追加)

| state | task type | visualEvidence | 用途 |
| --- | --- | --- | --- |
| spec_created | implementation / process | 任意 | 仕様書作成完了・実装未着手 |
| enforced_dry_run | implementation | NON_VISUAL | warning モードで動的検証中、blocking gate へ昇格前 |
| PASS_WITH_BLOCKER | implementation | NON_VISUAL | 全 phase の design GO は完了、runtime GO は外部前提（legacy cleanup 等）blocked。Issue #394 (stableKey strict CI gate) 実例。current evidence と planned-after-cleanup evidence を物理分離する |
| completed | implementation / process | 任意 | runtime GO 完了・completed-tasks/ へ移動 |
