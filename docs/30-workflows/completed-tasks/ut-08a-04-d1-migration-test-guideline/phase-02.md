# Phase 2: 設計

## アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│ docs/30-workflows/runbooks/d1-migration-test-guideline.md   │ (新規) governance 正本
└─────────────┬────────────────────────────────────────────────┘
              │ 参照
              ├──→ apps/api/migrations/README.md (新規 or 追記)
              │
              ├──→ .github/workflows/d1-migration-verify.yml (step 追加)
              │       └─ pull_request 時に runbook link をコメント
              │          (`always()` + `continue-on-error` で verify 結果から独立)
              │
              └──→ scripts/d1/__tests__/migration-guideline-presence.bats (新規)
                      └─ runbook 必須見出し 3 件の presence assertion
```

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| ---- | ---- | ---- |
| `docs/30-workflows/runbooks/d1-migration-test-guideline.md` | 新規 | runbook 本体 |
| `apps/api/migrations/README.md` | 新規 (存在しない場合) / 編集 | runbook への 1 行リンク |
| `.github/workflows/d1-migration-verify.yml` | 編集 | `actions/github-script` step 追加（`always()` / `continue-on-error` / marker update） |
| `scripts/d1/__tests__/migration-guideline-presence.bats` | 新規 | runbook 必須見出し 3 件 + 最低基準 3 語句の grep assertion |
| `docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/system-spec-update-summary.md` | 新規 | Phase 12 成果物 |
| `docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/documentation-changelog.md` | 新規 | Phase 12 成果物 |

## runbook 文書構造（`d1-migration-test-guideline.md`）

```markdown
# D1 Migration Test Guideline

## 適用範囲
新規 D1 migration（apps/api/migrations/*.sql）を追加する全 PR

## 最低基準（必須 3 項目）
1. forward apply green: ローカル / preview / staging dry-run で apply 成功
2. contract test pass: `apps/api` の既存 contract / route test suite 全 green
3. repository or use-case test 1 件以上追加: 新規 schema 変更点に対する unit / integration test

## 02b suite 責任範囲
- 02b の miniflare D1 integration test は **initial schema 専用**
- 後続 migration の test は **各 task が個別に追加**（02b suite を拡張しない）
- 理由: 02b suite を成長させると schema drift 時の責任主体が曖昧化するため

## 適用フロー（PR レビュー観点）
1. 新規 migration ファイル数の確認
2. forward apply 結果（d1-migration-verify CI）の確認
3. 新規 test の存在確認
4. rollback 手順の必要性判断

## 関連
- UT-04 / 02b initial schema test
- .github/workflows/d1-migration-verify.yml
```

## CI step 設計（`d1-migration-verify.yml` 末尾追加）

```yaml
      - name: Post migration guideline reminder comment
        if: always() && github.event_name == 'pull_request'
        continue-on-error: true
        uses: actions/github-script@v7
        with:
          script: |
            const marker = '<!-- d1-migration-guideline-bot -->';
            const body = `${marker}\n📌 **D1 migration guideline**: このPRは \`apps/api/migrations/**\` を変更しています。\n\n[D1 Migration Test Guideline](https://github.com/${{ github.repository }}/blob/${{ github.event.pull_request.head.sha }}/docs/30-workflows/runbooks/d1-migration-test-guideline.md) の最低基準 3 項目を確認してください。`;
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            const existing = comments.find(c => c.body && c.body.includes(marker));
            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }
```

permissions block の `pull-requests: write` 追加が必要。前段の verify / bats / dry-run が fail しても runbook link は post / update される。comment step 自体の失敗は CI 本体を red にしないが、Phase 11 / 13 で comment URL を user-gated runtime evidence として確認する。

## bats test 設計（`scripts/d1/__tests__/migration-guideline-presence.bats`）

```bash
#!/usr/bin/env bats

GUIDELINE_PATH="docs/30-workflows/runbooks/d1-migration-test-guideline.md"

@test "guideline file exists" {
  [ -f "$GUIDELINE_PATH" ]
}

@test "guideline contains 最低基準 section" {
  grep -F "## 最低基準" "$GUIDELINE_PATH"
}

@test "guideline contains 02b suite 責任範囲 section" {
  grep -F "## 02b suite 責任範囲" "$GUIDELINE_PATH"
}

@test "guideline contains 適用フロー section" {
  grep -F "## 適用フロー" "$GUIDELINE_PATH"
}

@test "guideline contains minimum standard keywords" {
  grep -F "forward apply green" "$GUIDELINE_PATH"
  grep -F "contract test pass" "$GUIDELINE_PATH"
  grep -F "repository or use-case test" "$GUIDELINE_PATH"
}
```

## 完了条件

- 全変更対象ファイルのシグネチャと内容方針が確定
- Phase 3 レビューゲートに渡せる粒度の設計が揃っている

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 2 |
| status | completed |

## 目的

runbook、README、CI comment、bats test の実装設計を確定する。

## 実行タスク

- 変更対象ファイルと責務を分解する。
- CI comment が verify 結果から独立する条件を YAML snippet に落とす。

## 参照資料

- `phase-01.md`
- `.github/workflows/d1-migration-verify.yml`

## 成果物/実行手順

Phase 5 で実装できる粒度のファイル別手順と snippet をこのファイルに保持する。

## 統合テスト連携

bats test と Phase 9 grep gate がこの設計を検証する。
