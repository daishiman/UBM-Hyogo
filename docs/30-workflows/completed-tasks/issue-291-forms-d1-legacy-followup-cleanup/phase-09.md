# Phase 9: 品質保証

[実装区分: ドキュメントのみ]

**判定根拠**: 既存 CI gate / scan command の実行による品質確認のみ。runtime code 変更なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 5 ランブック適用後の references / backlog / 逆リンク / indexes 一式を機械検証し、Phase 10 最終レビューに進める品質状態であることを確認する。

---

## 2. スコープ

### 対象

- Phase 4 で確定した 6 種 scan 全件 PASS の最終確認
- `pnpm indexes:rebuild` で drift 0 confirmation
- Phase 12 前に実行可能な scan の exit 0 confirmation
- `artifacts.json` と `outputs/artifacts.json` の parity 確認
- Phase 12 strict 7 outputs の存在予定確認（Phase 12 実行前事前チェック）

### 対象外

- 新規 lint / typecheck（本タスクは TS/JS 変更なし）
- vitest / playwright 実行

---

## 3. 前提条件

- Phase 5 ランブック実装完了
- Phase 6 異常系全件 PASS
- Phase 7 AC マトリクス確定

---

## 実行タスク

### 4.1 scan 全件 PASS の最終確認

Phase 4 / Phase 5.5 で定義した 6 種 scan を順次実行し、全 PASS を `outputs/phase-09/main.md` に記録。

| scan | 期待 | 失敗時 |
|------|------|--------|
| stale current scan | 0 hit（除外フィルタ後） | Phase 6 異常系 2 へ |
| conflict marker scan | 0 hit | 該当 file の merge resolve |
| backlink scan | 3 physical file hit + 2 ledger fallback rows | Phase 6 異常系 3 へ |
| index drift scan | `git diff` 0 line | Phase 6 異常系 4 へ |
| phase12 readiness | strict 7 outputs が artifacts.json に列挙済み | Phase 12 成果物定義へ |
| backlog status scan | `status: superseded` 周辺 5 行内に存在 | Phase 6 異常系 5 へ |

### 4.2 indexes 再生成 drift 0

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
```

**期待**: `nothing to commit`（rebuild 後 drift 0）

### 4.3 Phase 12 readiness 確認

```bash
jq '.phases[] | select(.phase == 12) | .outputs' docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json
```

**期待**: strict 7 outputs（main.md + 6 成果物）が列挙済み。`verify-pr-ready.sh` は Phase 12 成果物生成後の Phase 13 pre-flight で実行する。

### 4.4 artifacts.json parity

```bash
diff -q docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json \
        docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/artifacts.json
```

**期待**: 差分なし。`outputs/artifacts.json` は Phase 1 の初期化時点で root `artifacts.json` の mirror として生成する。

### 4.5 Phase 12 strict 7 outputs の事前存在チェック

Phase 12 で生成予定の strict 7 outputs が artifacts.json の phase 12 outputs に列挙されていることを確認。

```bash
jq '.phases[11].outputs' docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json
```

**期待**: 7 entries（main.md + 6 成果物）

### 4.6 historical 編集禁止の最終確認

```bash
git diff --stat .claude/skills/aiworkflow-requirements/references/lessons-learned-*.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-completed.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  .claude/skills/aiworkflow-requirements/references/workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md
```

**期待**: 0 file changed

### 4.7 不変条件再確認

- 不変条件 #1: schema 過剰固定化なし（references 編集で「正本」を強めすぎていない）
- 不変条件 #5: `apps/web` → D1 直接アクセス禁止違反なし（references 編集で違反記述追加なし）
- 不変条件 #7: Forms API current 経路維持

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-09/main.md` | scan 全件結果サマリ + drift 確認 + 不変条件チェック結果 |

---

## 完了条件

- [ ] 6 種 scan 全件 PASS
- [ ] indexes rebuild 後 drift 0
- [ ] Phase 12 readiness check PASS（strict 7 outputs が artifacts.json に列挙済み）
- [ ] artifacts.json parity OK
- [ ] Phase 12 成果物 7 entries が artifacts.json に列挙済み
- [ ] historical 編集差分 0
- [ ] 不変条件 #1 / #5 / #7 違反なし
- [ ] `artifacts.json` phase 9 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| `verify-pr-ready.sh` が `gate-metadata:validate` で失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1 を確認し artifacts.json の zod schema 違反を修正 |
| indexes rebuild が他 skill の差分を生む | 本タスク由来以外の差分は別 commit に分離。本 phase では差分 0 を要求 |
| historical ファイル差分が出る | 差分内容を確認し、必要なら同一 wave の意図的更新として記録する。誤編集の場合はユーザー承認後に個別復旧 |

---

## 参照資料

- Phase 4 `outputs/phase-04/regression-scan-commands.md`
- Phase 6 `outputs/phase-06/main.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `scripts/verify-pr-ready.sh`

---

## 9. 次フェーズへの引き継ぎ

Phase 10 最終レビューで本 phase の scan 結果と AC マトリクスを照合し、go/no-go を決定する。
