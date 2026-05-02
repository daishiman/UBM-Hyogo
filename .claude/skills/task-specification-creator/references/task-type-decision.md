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
- ADR 起票 / deploy target decision / topology drift 解消のような docs-only タスクは、Phase 1 で `base case 別差分マトリクス`（cutover / 保留 / 段階移行など）を作り、以降の Phase はその表を参照する。base case 依存の記述を複数 Phase に散在させない
- ADR 起票タスクの Phase 4 は、実装テストではなく doc-only grep（deploy target 抽出 / リンク死活 / 不変条件抵触ガード / 関連タスク重複確認）を標準検証にする
- ADR 起票タスクの Phase 11 は NON_VISUAL とし、`manual-test-result.md` / `link-checklist.md` / `ui-sanity-visual-review.md` など、実測した文書・リンク・不変条件証跡で閉じる
- `scaffolding-only` / `VISUAL_DEFERRED` のタスクは skipped spec、placeholder screenshot list、placeholder axe report を実測 PASS と扱わない
- 実装/設計は完了しているが UI/ブラウザ証跡を後続の runtime smoke / production 実走で取得するタスクは `visualEvidence: VISUAL_ON_EXECUTION` を使う。`VISUAL_DEFERRED`（実装自体が後続）と併せて、validator (`scripts/validate-phase-output.js` の `classifyVisualEvidence`) は `non_visual` / `docs-only` / `spec_created` 群と同列で扱い、Phase 11 で実行前スクリーンショット不足を誤検出しない
- `scaffolding-only` を PR / push CI gate に入れる場合は manual-only に留め、full execution task で skipped spec 0 / real evidence 取得後に gate 化する
- `screenshots/` ディレクトリを作成しない（`.gitkeep` も不要）
- `artifacts.json` の `metadata.visualEvidence` に必ず明記する（省略すると screenshot 要求側に倒れる）
