# Postmortem 生成ランブック

## スコープ

このランブックは、rollback または production incident の後に postmortem 雛形を生成し、follow-up issue を作成する手順だけを扱う。incident response の初動や rollback 手順は、既存の infrastructure runbook と 09c rollback runbook を正本とする。

## 前提条件

- repository root から実行する。
- Node 24 / pnpm 10 を `mise exec --` 経由で使う。
- 09c Phase 11 evidence を `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` に用意しておく。
- rollback evidence markdown に、実行コマンド、結果、実行時刻を記録しておく。

## 生成手順

```bash
mise exec -- pnpm postmortem:generate -- \
  --release vX.Y.Z \
  --commit <sha> \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence outputs/incident/<date>/rollback.md \
  --occurred-at <iso8601> \
  --detected-at <iso8601> \
  --resolved-at <iso8601> \
  --severity sev2 \
  --out outputs/incident/<date>/postmortem.md
```

evidence directory が存在しない場合、または directory 内に `main.md` が存在しない場合、このコマンドは markdown を生成せずに失敗する。
rollback evidence path が存在しない場合も失敗する。rollback evidence が 0 byte の場合は warning を出して生成を継続するため、担当者は生成後すぐに rollback evidence markdown を追記する。

## 生成後の記入

Timeline、Impact、Detection、Response、Root Cause、Prevention、Follow-up Issues を記入する。主語は出来事、コード、設定、データ、プロセスにする。個人名を主語にしない。

## Follow-up Issue 作成

Prevention に書いた具体的な再発防止策ごとに issue を 1 件作成する。

```bash
gh issue create \
  --title "[postmortem-followup] <概要>" \
  --label "type:operations,priority:medium" \
  --body "$(cat <<'EOF'
## 背景
postmortem: <postmortem.md への相対パス>

## 期待する結果
<再発防止策の概要>

## 受入条件
- [ ] <Prevention セクションに書いた具体的な対応>
EOF
)"
```

## 関連リンク

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
