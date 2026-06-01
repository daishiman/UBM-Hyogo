# Validation And Audit Patterns

## 目的

line budget、mirror parity、workflow validator、scoped audit の失敗を短時間で切り分ける。

## パターン1: line budget は entrypoint から見る

| 観点 | ルール |
| --- | --- |
| `SKILL.md` | `<= 500` は hard requirement |
| family file | 500 行を超えそうなら追加分割 |
| rolling log | 200 行前後で archive へ退避 |

## パターン2: validator を 4 層に分ける

1. `quick_validate.js`: structure と reference link。
2. `validate_all.js`: broken link、禁止ファイル、frontmatter。
3. `validate-phase-output.js`: workflow 仕様の構造。modern `outputs/phase-N/phase-N.md` レイアウトを自動検出し、Phase title + section presence で検証する（旧 root 直下 `phase-N-*.md` も継続サポート）。`spec_created` + `phase11-capture-metadata.json#status=pending_implementation` のときは screenshot PNG 0 件を pending boundary として PASS と扱う。
4. `verify-all-specs.js`: phase 依存と warning の洗い出し。

## パターン3: `.claude` と `.agents` の差分確認

```bash
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
```

差分がある場合は `.claude` 側を正本にして mirror を再同期する。

## パターン4: root drift 監査

| 症状 | 対応 |
| --- | --- |
| workflow が `.agents/...` を正本参照している | canonical root を `.claude/...` に戻す |
| user が別 root を明示した | user 指定 root を canonical に採用し、他 root を mirror 扱いにする |

## パターン5: current / baseline 分離

| 指標 | 意味 |
| --- | --- |
| `currentViolations=0` | 今回差分の合格判定 |
| `baselineViolations>0` | 既存 backlog。別欄で報告する |

混ぜて報告しない。`documentation-changelog.md` と `quality-report.md` に両方を残す。

## パターン6: dependency integrity

確認対象:

- `SKILL.md` → family index
- family index → detail file
- `LOGS.md` → archive index
- `.claude` → `.agents`

孤立 file が出たら parent guide の導線を先に足す。

## パターン7: docs-only task の manual validation

UI screenshot が不要でも、以下は残す:

- navigation walkthrough
- archive discoverability
- mirror parity
- validator replay

## パターン8: auth leak grep gate

Authenticated visual / runtime smoke のように cookie や JWT を一時生成するタスクでは、実装ログ・Phase 11 evidence・tracked files に次が残らないことを dedicated grep gate で検証する。

| 検査 | 期待 |
| --- | --- |
| JWT prefix `eyJ` | tracked evidence 0 hit |
| `authjs.session-token=` の値 | 0 hit（cookie 名の言及のみ可） |
| `STAGING_AUTH_SECRET=` の値 | 0 hit（env 名の言及のみ可） |

storageState は `.gitignore` 済みの ephemeral path に限定し、HTML report や artifact upload の対象からも除外する。

## パターン9: 観測不能 AC の enforcement 面写像

Issue の AC が物理的・構造的に観測不能な場所を指定している場合は、AC の目的を保ったまま、観測可能な enforcement 面へ同一 wave で写像する。

| 観点 | ルール |
| --- | --- |
| 技術的観測不能の例 | `.git/hooks/*` のローカル手書き hook を CI checkout で検知する要求。`.git/` は repository 管理外のため CI には現れない |
| 目的の保持 | 「hook 正本逸脱を検知する」などの目的を AC 表で明示し、literal 手段だけを置き換える |
| local enforcement | local でしか観測できない対象は pre-commit / local script へ寄せる |
| CI enforcement | CI では repository 上で観測できる SSOT 整合（例: `lefthook.yml` が参照する `scripts/hooks/*.sh` の実在、tracked stray hook 不在）を gate 化する |
| 未タスク化禁止 | 代替 enforcement で AC 目的を満たせるなら follow-up 化せず、同一 cycle の実装/仕様に閉じる |
| 証跡 | Phase 1 に「元 AC / 観測不能理由 / 写像後の enforcement 面」表、Phase 10 に AC→R 1:1 trace、Phase 12 compliance に 4 条件 verdict を残す |

Issue #230 `lefthook-edit-guard` では、`.git/hooks/` 手書き追加の CI literal 検知を local pre-commit guard + CI hook-integrity gate に写像した。これは scope split ではなく、観測可能面への要件再配置である。

## 再利用チェックリスト

- [ ] `quick_validate.js` と `validate_all.js` の結果を分けて記録した
- [ ] `diff -qr` の差分を 0 にした
- [ ] root drift の `rg` 監査を実施した
- [ ] `current` / `baseline` を分けて記録した
- [ ] parent / child / archive / mirror の 4 edge を確認した
- [ ] 観測不能 AC がある場合、目的を保った enforcement 面写像と AC→R trace を記録した
