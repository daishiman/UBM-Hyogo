# Phase 13: PR 作成（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` 〜 `phase-12.md` / 全 evidence |
| 出力 | **3c 単独 PR は作成しない**。親 Phase 13 統合 PR に 3c evidence + 仕様を含める指示書 |

---

## 1. 3c の PR 方針

| 項目 | 値 |
|------|----|
| 3c 単独 PR | **なし** |
| 統合先 | 親 workflow `e2e-quality-uplift-stage-3` の Phase 13 統合 PR |
| 含める成果物 | 3c 仕様書（13 phase + index + artifacts.json）+ evidence 5 ファイル |
| base branch | `dev` |
| feature branch | `feat/e2e-quality-uplift`（親 workflow と共有） |

理由:

1. 3c はリポジトリ内のソース変更を伴わず、`gh api -X PUT` という手動 API 操作で完結する
2. evidence は親 workflow の Phase 13 統合 PR で 3a / 3b と一緒にレビューするほうが、Stage 3 全体の整合性を保ちやすい
3. solo dev 運用ポリシー上、PR 単位を細かく分けるメリットが小さい

## 2. 親 Phase 13 統合 PR に含めるべき 3c 関連事項

### 2.1 ファイル

| 区分 | パス |
|------|------|
| 仕様 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/index.md` |
| 仕様 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/artifacts.json` |
| 仕様 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-{1..13}.md` |
| evidence | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/branch-protection-dev-pre.json` |
| evidence | 同 `branch-protection-dev-post.json` |
| evidence | 同 `branch-protection-main-pre.json` |
| evidence | 同 `branch-protection-main-post.json` |
| evidence | 同 `branch-protection-evidence.md` |

### 2.2 PR 本文に追記すべき 3c セクション（テンプレ）

```markdown
### 3c — Branch Protection contexts 更新

#### 適用結果

- dev / main の `required_status_checks.contexts` を 5 件に拡張:
  `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]`
- solo dev policy 不変条件 drift なし（reviews=null / lock=false / strict=false / conv=true）
- enforce_admins: pre と post で同値（drift なし）

#### Evidence

- `docs/.../3c-branch-protection-contexts/outputs/phase-11/branch-protection-dev-pre.json`
- `docs/.../3c-branch-protection-contexts/outputs/phase-11/branch-protection-dev-post.json`
- `docs/.../3c-branch-protection-contexts/outputs/phase-11/branch-protection-main-pre.json`
- `docs/.../3c-branch-protection-contexts/outputs/phase-11/branch-protection-main-post.json`
- `docs/.../3c-branch-protection-contexts/outputs/phase-11/branch-protection-evidence.md`

#### AC

- AC-05: ✅（dev / main contexts 5 件完全一致）
- AC-06: ✅（reviews=null / lock=false / enforce_admins drift なし）
```

## 3. 順序（再掲）

```
1. 3a PR-A → dev merge → workflow 1 run 成功
2. 3b PR-B → dev merge → workflow 1 run 成功
3. 3c gh api PUT（dev → main）+ evidence 生成・commit
4. 親 Phase 13 統合 PR を `feat/e2e-quality-uplift` → `dev` で作成
5. 統合 PR に 3a / 3b / 3c 全 evidence を含めてレビュー
```

## 4. 3c コミットの粒度（親統合 PR 内）

| commit | 内容 |
|--------|------|
| C-3c-1 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/` 仕様書 13 phase + index + artifacts.json |
| C-3c-2 | `outputs/phase-11/` evidence 5 ファイル |

> commit message 例: `docs(stage-3-impl): add 3c branch-protection-contexts spec` / `docs(stage-3-impl): add 3c branch protection evidence (dev/main contexts=5)`

## 5. 残課題引き継ぎ

| 残課題 | 取扱い |
|--------|--------|
| `enforce_admins` 乖離（CLAUDE.md 期待 `true` vs 実値） | Phase 12 §2 O-2 採用時は別 issue 起票（タイトル例: `governance: align dev/main enforce_admins=true with CLAUDE.md`） |
| merge queue 導入時の `strict=true` 切替 | Stage 3 スコープ外。将来別 workflow で計画 |
| ruleset 移行 | Stage 3 スコープ外 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c は単独 PR を作成せず、親 Phase 13 統合 PR に仕様 + evidence を含める方針を確定し、必要な PR 本文セクションと commit 粒度を提供する。

## 実行タスク

- 単独 PR を作らない方針を明示する。
- 統合 PR 本文に追加すべきセクションをテンプレ化する。
- コミット粒度を 2 件に整理する。
- 残課題を引き継ぐ。

## 参照資料

- 本サブタスク phase-11.md / phase-12.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-13.md
- CLAUDE.md `## PR作成の完全自律フロー`

## 実行手順

1. 順序 gate を確認する。
2. evidence をコミットする。
3. 親 Phase 13 統合 PR に 3c セクションを追加する。
4. 残課題を別 issue 化する（必要時）。

## 統合テスト連携

- 統合 PR 作成は親 workflow Phase 13 の責務。本 phase は記載すべき内容の指示書を提供する。

## 成果物

- 本 phase markdown
- 統合 PR 本文 3c セクションテンプレ

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
