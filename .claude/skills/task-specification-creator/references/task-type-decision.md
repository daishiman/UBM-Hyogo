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
- `scaffolding-only` / `VISUAL_DEFERRED` のタスクは skipped spec、placeholder screenshot list、placeholder axe report を実測 PASS と扱わない
- `scaffolding-only` を PR / push CI gate に入れる場合は manual-only に留め、full execution task で skipped spec 0 / real evidence 取得後に gate 化する
- `screenshots/` ディレクトリを作成しない（`.gitkeep` も不要）
- `artifacts.json` の `metadata.visualEvidence` に必ず明記する（省略すると screenshot 要求側に倒れる）
