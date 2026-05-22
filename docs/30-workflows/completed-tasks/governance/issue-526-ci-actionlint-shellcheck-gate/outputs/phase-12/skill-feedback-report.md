# Skill Feedback Report

## テンプレ改善

| Finding | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- |
| Phase 12 strict outputs は「存在」だけでなく Part 1/2 の必須項目まで検査する必要がある | `task-specification-creator/references/phase-12-documentation-guide.md` | 今回は既存 guide の運用適用で解消。テンプレ本文変更は同種再発が 2 回以上出た場合に昇格 | `outputs/phase-12/implementation-guide.md` |
| artifacts mirror は lightweight marker ではなく full mirror か、明示的に partial と書く必要がある | `task-specification-creator/references/phase-12-spec.md` | 今回は full mirror に補正したため no-op | `outputs/artifacts.json` |

## ワークフロー改善

| Finding | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- |
| 新規 dedicated CI job は branch protection required context に入らない限り merge gate として弱い | `aiworkflow-requirements/references/deployment-gha.md` | 今回は既存 required `ci` job 内にも `pnpm observation:lint` を追加して解消。branch protection PUT は user-gated 外部操作 | `.github/workflows/ci.yml` |
| Phase 11 evidence を作る際は `tee` を使う command でも `set -o pipefail` を有効化する | `task-specification-creator/references/phase-11-guide.md` | 今回の package script は `set -e` と direct command で再検証。テンプレ変更は別 wave で重複確認後 | `package.json` |

## ドキュメント改善

| Finding | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- |
| `secrets.GITHUB_TOKEN` を使う workflow に対して単純な `! grep 'secrets.*'` を使うと false failure になる | `aiworkflow-requirements/references/deployment-gha.md` | Current facts で allowlist grep として境界を明記済み | `.github/workflows/ci.yml` |
| `deployment-cloudflare.md` / parent lessons を同期対象に列挙する場合、no-diff 判定を別表にする必要がある | `task-specification-creator/references/phase-12-documentation-guide.md` | 今回は `system-spec-update-summary.md` の Step 1-C に no-diff 理由を明記 | `outputs/phase-12/system-spec-update-summary.md` |

## 結論

今回サイクルで skill 本体に即時反映すべき差分は `aiworkflow-requirements/SKILL.md` の変更履歴行として反映済み。大きなテンプレ構造変更は不要。
