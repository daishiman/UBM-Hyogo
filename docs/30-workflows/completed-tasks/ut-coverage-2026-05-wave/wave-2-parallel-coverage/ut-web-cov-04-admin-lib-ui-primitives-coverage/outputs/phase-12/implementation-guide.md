# Phase 12 Implementation Guide: ut-web-cov-04-admin-lib-ui-primitives-coverage

## Part 1: 中学生レベル

このタスクは、道具箱の中の基本道具がどれも使えるか確かめる作業に似ている。管理画面の通信道具と、ボタンの土台になる小さな画面部品を確認する。開く、閉じる、設定を変える、押した時に反応する、という基本の動きをテストで見る。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| admin lib | 管理画面が使う裏方道具 |
| UI primitive | 画面の小さな基本部品 |
| contract test | 約束どおり動くかの確認 |
| barrel file | まとめて取り出す入口 |
| callback | 押した後に呼ばれる約束 |

## Part 2: 技術者レベル

対象は `lib/admin/{server-fetch,api,types}` と `components/ui/{Toast,Modal,Drawer,Field,Segmented,Switch,Search,icons,index}`、`lib/url/login-state.ts`。admin lib は authed fetch / error mapping / type guard、UI primitives は open/close、prop variant、callback invocation を最低限確認する。

admin component 本体、public component、auth/fetch lib の責務は他 workflow へ委譲し、本タスクは admin lib と primitive boundary に限定する。
