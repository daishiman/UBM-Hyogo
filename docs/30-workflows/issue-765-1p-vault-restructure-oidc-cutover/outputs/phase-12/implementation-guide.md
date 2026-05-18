# Implementation Guide

## Part 1: 中学生レベル

クラウドを動かすための鍵の置き場所が、何か所にも分かれていると、誰かが古い鍵を使ってしまうかもしれません。学校の鍵を職員室の決まった棚に戻すように、使う場所を決めて、古い場所には「もう使わない」と印を付けます。

ただし、今はまだ新しい開け方が本当に使えるか確認中です。そのため、鍵を動かしたり古い鍵をしまい込んだりする作業は、先生役の人が許可してから行います。

| 言葉 | やさしい言い換え |
| --- | --- |
| 1Password | 鍵をしまう金庫 |
| token | クラウドを開ける鍵 |
| op:// path | 金庫の中の番地 |
| archive | すぐ戻せるようにしまうこと |
| OIDC | 鍵を直接持たずに本人確認する方法 |

## Part 2: 技術者向け

Deploy token canonical paths are:

```text
op://UBM-Hyogo/Cloudflare/api_token_staging
op://UBM-Hyogo/Cloudflare/api_token_production
```

The workflow is an implementation spec, but Phase 11 mutation is blocked until OIDC support and production cutover evidence are available. `apps/web/.dev.vars.example` and `scripts/cf.sh` are baseline verification targets only unless a deploy-token `op://` reference is discovered.

Expected guard:

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh
```

Errors: legacy deploy-token op references produce exit 1. Runtime failures in `bash scripts/cf.sh whoami` remain user-gated evidence and must be redacted.

