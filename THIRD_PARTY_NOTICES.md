# 第三方说明

## 数据服务

本应用通过以下 ESPN 公开站点接口获取 NBA 赛程、比分、文字事件、球员统计及
高光缩略图：

- `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary`

这些接口并非 NBA 或 ESPN 提供的官方开发者服务，不保证持续可用、完整性或
准确性。比赛数据、球队标识、球员头像、图片及相关商标的权利归各自权利人所有。
本应用与 NBA、ESPN 均无隶属、合作或官方授权关系。如需商业使用，请自行取得
相应授权。

## 中文球员译名

本地中文球员译名参考虎扑 NBA 球队与球员公开页面整理，仅用于中文界面显示。
译名映射可能随球员交易、签约和页面调整而变化，不代表虎扑对本项目的认可或
背书。

## GitHub 调研项目

开发前参考了以下公开项目的接口形态与产品思路，未复制其源代码：

- [swar/nba_api](https://github.com/swar/nba_api)
- [homerchen19/nba-go](https://github.com/homerchen19/nba-go)
- [songron/hupu-nba](https://github.com/songron/hupu-nba)

## 主要依赖

- Electron，MIT License
- electron-builder，MIT License

实际随安装包分发的依赖及其许可证，以其各自发布内容为准。
