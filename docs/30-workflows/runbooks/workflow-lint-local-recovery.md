# Workflow lint local recovery runbook

## 目的

`.github/workflows/*.yml` を GitHub Actions と同じ actionlint gate でローカル検査し、CI failure を再現する。

## 前提

- macOS または Linux
- `bash`, `curl`, `pnpm`
- repository root で実行する

## actionlint インストール

```bash
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7
```

## 全 workflow 検査

```bash
./actionlint -color .github/workflows/*.yml
```

現行対象は 32 件。確認は次で行う。

```bash
ls .github/workflows/*.yml | wc -l
```

## CI と同等再現

```bash
pnpm observation:lint
```

この command は observation shell syntax / shell unit / shellcheck / actionlint all-workflows をまとめて実行する。

## 失敗時の切り分け

1. actionlint error の workflow path と line を確認する。
2. GitHub Actions 独自式、`permissions`, `needs`, `if`, `secrets.*` の typo を最小差分で修正する。
3. `./actionlint -color .github/workflows/*.yml` と `pnpm observation:lint` を再実行する。

## yamllint を使わない理由

GitHub Actions 固有の文脈検査が必要なため、primary gate は actionlint に固定する。一般 YAML lint の追加は `${{ }}` などの Actions 表現でノイズになりやすく、本タスクでは採用しない。採否記録は `docs/30-workflows/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` を正本とする。
