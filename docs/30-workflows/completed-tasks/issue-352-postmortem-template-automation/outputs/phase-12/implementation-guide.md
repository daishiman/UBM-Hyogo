# Implementation Guide

## Part 1: 中学生レベル

### 事後検証とは

たとえば、テストで間違えた問題をあとで見直し、「どこで間違えたか」「次はどうするか」をノートに書くのと同じです。rollback のあとに何が起きたかを同じ形で残すと、次に同じ問題が起きにくくなります。

### 個人名を主語にしない理由

たとえば、掃除当番の表に「誰を責めるか」という欄がなければ、そこには書けません。このテンプレートも、出来事、影響、見つけ方、対応、原因、次の対策だけを書く形にして、個人名を主語にしないようにします。

### evidence link を必須にする理由

たとえば、読書感想文で本の名前が空欄だと、先生は何を読んだのか確認できません。postmortem も、09c Phase 11 evidence への link がなければ事実確認できないため、CLI は evidence directory と `main.md` がない場合に失敗します。

## Part 2: 技術者向け

| 項目 | 内容 |
| --- | --- |
| CLI | `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <dir> --rollback-evidence <md> --occurred-at <iso8601>` |
| runner | `node --experimental-strip-types scripts/postmortem/generate-postmortem.ts` |
| pure API | `generatePostmortem(input, template): string` |
| loader | `loadTemplate(): string` が `docs/30-workflows/runbooks/postmortem/template.md` を読む |
| validation | release は `^v\\d+\\.\\d+\\.\\d+$`、commit は `^[0-9a-f]{7,40}$`、occurred/detected/resolved は UTC ISO8601 |
| evidence | `--evidence` は directory かつ `main.md` 必須 |
| output | `--out` ありなら file write、なしなら stdout |
| errors | validation/evidence error は exit 1、write error は exit 2 |
| tests | `scripts/postmortem/__tests__/generate-postmortem.test.ts` |
| scope | `apps/api` / `apps/web` は変更しない |
