# Implementation Guide

## Part 1: 中学生レベルの説明

学校の掲示板に「古い教室はこちら」と書いた紙が残っていると、新しく来た人はそこへ行けばよいのか迷います。今の教室は別の場所に変わっているので、古い紙は残しておくほど混乱を生みます。

今回の `CLOUDFLARE_PAGES_PROJECT` も同じです。昔の置き場所の名前を書いたメモですが、今の自動公開ではもう読まれていません。だから、消す前に「本当に誰も使っていない」ことを確認し、消した後にも「この 1 枚だけが消えた」と分かる記録を残します。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| GitHub Actions Variable | 自動作業が読むメモ |
| repository scope | 学校全体で見える掲示板 |
| Cloudflare Pages | 古い公開先 |
| Cloudflare Workers | 今の公開先 |
| evidence | 作業前後の写真 |
| user approval marker | 先生の「消してよい」サイン |

## Part 2: 技術者向け詳細

### Interface

```ts
type VariableDeletionPlan = {
  owner: "daishiman";
  repo: "UBM-Hyogo";
  variableName: "CLOUDFLARE_PAGES_PROJECT";
  scope: "repository";
  requiredApprovalMarker: "outputs/phase-11/evidence/user-approval-marker.md";
};
```

### API Signatures

```bash
GET    /repos/{owner}/{repo}/actions/variables
GET    /repos/{owner}/{repo}/actions/variables/{name}
DELETE /repos/{owner}/{repo}/actions/variables/{name}
POST   /repos/{owner}/{repo}/actions/variables
```

### Runtime Path x Evidence

| Path | Command | Evidence |
| --- | --- | --- |
| read-only preflight | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | `outputs/phase-11/evidence/current-repo-variables.json` |
| source grep | `rg CLOUDFLARE_PAGES_PROJECT .github apps packages scripts` | `outputs/phase-11/evidence/source-grep-preflight.txt` |
| mutation | `gh api -X DELETE .../CLOUDFLARE_PAGES_PROJECT` | pending until user approval |
| rollback | `gh api -X POST ... -f name=... -f value=ubm-hyogo-web` | pending until user approval |

### Error Handling

- `DELETE` before marker: fail closed.
- `GET` before deletion returns 404: record `already_deleted` and stop without mutation.
- `DELETE` returns 404 after marker: idempotent success if list endpoint also excludes the variable.
- `401/403`: stop and refresh/replace GitHub credential outside this workflow.
- `5xx`: stop, keep evidence, retry only after operator decision.

### Constants

| Name | Value |
| --- | --- |
| owner | `daishiman` |
| repo | `UBM-Hyogo` |
| variable | `CLOUDFLARE_PAGES_PROJECT` |
| rollback value | `ubm-hyogo-web` |
| approval marker | `outputs/phase-11/evidence/user-approval-marker.md` |
