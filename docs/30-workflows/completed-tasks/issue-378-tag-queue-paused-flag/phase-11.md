# Phase 11: NON_VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

UI を持たない本タスクの動作証跡を、テスト出力 / grep 結果 / 実体ファイルで構成する。

## evidence 構成

`outputs/phase-11/non-visual-evidence.md` に以下を貼付:

### 1. unit test PASS log

```
mise exec -- pnpm --filter @ubm/api test tagCandidateEnqueue
```

の出力全文（PASS 件数 / 各ケース名 / 実行時間）。
最低限ケース 1〜3 + 補助 4〜8 が PASS していること。

### 2. pause guard 経路の grep evidence

```
grep -n "TAG_QUEUE_PAUSED" apps/api/src/env.ts
grep -n "parsePaused" apps/api/src/workflows/tagCandidateEnqueue.ts
grep -n "parsePaused" apps/api/src/jobs/sync-forms-responses.ts
grep -n "UBM-TAGQ-PAUSED" apps/api/src/workflows/tagCandidateEnqueue.ts
grep -n "TAG_QUEUE_PAUSED" apps/api/wrangler.toml
```

それぞれ 1 件以上 hit すること。

### 3. INSERT 0 件 evidence

unit test ケース 3 の fakeD1 spy assertion 出力を抜粋:

```
expect(fakeD1.prepare).not.toHaveBeenCalled()
✓ passed
```

### 4. structured log evidence

unit test ケース 3 の log spy assertion 出力を抜粋（`UBM-TAGQ-PAUSED` を含む log 行）。

### 5. runbook 実体

`docs/30-workflows/runbooks/tag-queue-pause.md` の概要セクション + 緊急停止手順セクションを引用（runbook が存在することの直接 evidence）。

## 実行タスク

- [x] Phase 11 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [x] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`
- Phase 5: `phase-05.md`
- Phase 6: `phase-06.md`
- Phase 7: `phase-07.md`
- Phase 8: `phase-08.md`
- Phase 9: `phase-09.md`
- Phase 10: `phase-10.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-11.md`
- Phase 11 に対応する `outputs/phase-11/` 成果物

## 統合テスト連携

- [x] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [x] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 11 の完了条件を満たす。

- evidence 5 セクションが全て埋まっている。
- unit test PASS log が貼られている。
- grep evidence が 5 件全 hit。
- runbook が引用されている。
