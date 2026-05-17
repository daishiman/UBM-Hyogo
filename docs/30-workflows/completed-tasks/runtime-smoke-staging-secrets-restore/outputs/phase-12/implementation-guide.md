# Implementation Guide

## Part 1: 中学生レベル

学校の持ち物チェックに例えると、遠足の朝に「水筒、弁当、しおり、交通カード」がないことに気づくと出発が止まる。本タスクは、出発直前ではなく前日の点検表で足りない持ち物を見つける仕組みを足す。

ここでいう secret は「大事な鍵」、Environment は「鍵を置く決まった棚」、preflight は「出発前チェック」、runtime smoke は「本当に出発できるかの短い試運転」、allowlist は「必要な持ち物リスト」である。値そのものは見ず、棚に鍵の名前があるかだけを見る。

今回やることは、`staging-runtime-smoke` という棚に必須 4 件の名前があるかをチェック表へ追加すること。実際の鍵を置く作業と、試運転をもう一度走らせる作業は、人間が承認してから行う。

## Part 2: 技術者レベル

`scripts/ci/verify-env-secrets.allowlist` に `env=staging-runtime-smoke;required=...;reason=...` を追加し、`scripts/ci/verify-env-secrets.sh` が allowlist parse 時に env-required rows を収集する。各 row は GitHub Environment secrets API の name-only inventory と照合され、欠落時は既存 JSON schema と同じ unresolved entry として出力される。

`runtime-smoke-staging.yml` の inline check は置換しない。preflight は repository / environment secret の登録名を検査し、runtime check は job に展開された値の空文字を検査するため、責務が異なる。

検証は `scripts/ci/__tests__/verify-env-secrets.spec.sh` の gh stub で行う。欠落ケースでは `job=env-required` と欠落 secret 名が JSON に出ること、全件登録ケースでは `[]` で exit 0 になることを確認する。

## Phase 11 Evidence

NON_VISUAL タスクのためスクリーンショットは不要。Phase 11 の証跡は `outputs/phase-11/main.md` に集約し、次を確認済みとする。

| 証跡 | 状態 |
| --- | --- |
| `bash scripts/ci/__tests__/verify-env-secrets.spec.sh` | local deterministic evidence completed |
| root / outputs `artifacts.json` parity | completed |
| `outputs/phase-12/` strict 7 file inventory | completed |

GitHub Environment secret mutation、`runtime-smoke-staging.yml` rerun、commit、push、PR は user-gated であり、runtime evidence は pending のまま分離する。
