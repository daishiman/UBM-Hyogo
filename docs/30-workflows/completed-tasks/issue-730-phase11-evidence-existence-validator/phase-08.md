# Phase 8 — 統合

## 1. 既存 CI gate との統合

`.github/workflows/verify-phase12-compliance.yml` の `verify-phase12-compliance` step は既存の `pnpm test:phase12-compliance` / `pnpm verify:phase12-compliance` 経路を維持しつつ、`workflow_dispatch` でも base ref が空にならないよう `origin/dev` fallback を追加する:

```yaml
- name: Verify phase-12 compliance
  env:
          COMPLIANCE_BASE_REF: ${{ github.event_name == 'pull_request' && format('origin/{0}', github.base_ref) || 'origin/dev' }}
    COMPLIANCE_HEAD_REF: HEAD
  run: |
          git fetch origin dev ${{ github.base_ref }}
    pnpm test:phase12-compliance
    pnpm verify:phase12-compliance
```

`verify-compliance-file.ts` の拡張に伴い、新ロジックは自動的に呼び出される。workflow yaml の編集は base ref fallback のみに限定し、`pull_request` トリガー復活や required check mutation は行わない。

## 2. `pull_request` トリガー状態

MVP-PAUSE のため `pull_request` トリガーはコメントアウト維持。本タスクでは復活させない。`workflow_dispatch` 経路で `verify-phase12-compliance` が依然 green であることが結合観点での合格条件。

## 3. dev / main required status check

候補化のみ。実 `gh api -X PUT` は実施しない（ユーザー承認後の別タスク）。本タスク outputs/phase-12 `implementation-guide.md` に `候補追加: verify-phase12-compliance` を記録。

## 4. skill / reference 同期

`.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` 末尾に以下のセクションを追加:

```markdown
## Phase 12 compliance check における validator 仕様（Refs #730）

`outputs/phase-12/phase12-task-spec-compliance-check.md` の `## 4. Phase 11 evidence file inventory` 表は以下のルールで `scripts/lib/phase12-compliance/verify-compliance-file.ts` から自動検証される:

- `status` 列の正規表記は `present` / `pending` / `n/a` の 3 値（小文字一致）。表記揺れは `unknown` として fail 扱い。
- `status === "present"` の行は workflow root 配下に実体ファイルが存在しなければ fail (`reason: "missing-evidence"`)。
- evidence 表が空または heading 不在は fail。

docs-only / NON_VISUAL タスクで頻出する以下 3 パターンは validator の代表的な検査対象:

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
```

## 5. 既存 validator との分離整理

`.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js` は JSON manifest 専用、本タスク validator は markdown 専用。SKILL.md / 関連 reference に重複説明を追加しない（責務分離はコード位置で表現する）。

## 6. 統合動作確認

```bash
mise exec -- pnpm test:phase12-compliance
mise exec -- pnpm verify:phase12-compliance
mise exec -- node scripts/verify-phase12-compliance.ts  # 直接実行も確認
```
