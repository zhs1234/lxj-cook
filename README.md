![CookLikeHOC](./banner.png)

<div align="center">

# lxj-cook

一个以真实 Markdown 菜谱为事实来源的非官方中文烹饪档案。

[仓库主页](https://github.com/zhs1234/lxj-cook) · [原始项目](https://github.com/Gar-b-age/CookLikeHOC)

</div>

## 仓库定位

当前仓库 [zhs1234/lxj-cook](https://github.com/zhs1234/lxj-cook) 是本项目的主仓库。后续的开发、问题反馈、提交和发布均以本仓库的 `main` 分支为准。

本项目基于仓库内的原始 Markdown 菜谱内容，重做了内容解析、生成数据和网站体验。Markdown 文件仍然是菜谱事实来源，页面只消费解析后的 generated data，不虚构时间、难度、评分、份量或热量。

这是一个非官方的个人重构与展示项目，与老乡鸡及其官方站点没有隶属或授权关系。

## 当前内容

当前生成索引包含：

- 336 道真实菜谱
- 15 个菜谱分类
- 659 个食材节点
- 192 条图片资源记录

数据会随着仓库内 Markdown 和图片内容变化而重新生成，不建议直接手动编辑 `.vitepress/generated/` 中的文件。

## 网站体验

- Editorial 风格首页与分类浏览
- 基于真实菜谱数据的菜谱详情页
- 配料、步骤、营养信息和内部菜谱链接解析
- 统一图片解析与中文/英文括号、空格、版本名称兼容
- 食材关系图谱与 Ingredient Universe
- 菜名、分类和食材搜索
- Cook Mode 分步阅读
- GSAP 动效与受能力检测的高级渲染
- `prefers-reduced-motion`、移动端和低性能设备回退
- 语义 HTML、键盘操作和响应式布局

## 本地运行

环境要求：Node.js 18 或更高版本。

```bash
git clone https://github.com/zhs1234/lxj-cook.git
cd lxj-cook
npm install
npm run start
```

启动后访问：`http://localhost:5173/`

开发服务器启动前会根据 Markdown 内容重新生成索引。也可以直接运行：

```bash
npm run docs:dev
```

## 构建、预览与测试

```bash
# 生成内容索引并构建静态网站
npm run build

# 预览最近一次构建
npm run docs:preview

# 运行全部内容、页面和交互测试
npm test
```

构建产物位于：

```text
.vitepress/dist/
```

主要测试也可以单独运行：

```bash
npm run test:content
npm run test:home
npm run test:category
npm run test:recipe
npm run test:cook-mode
npm run test:search
npm run test:advanced-motion
```

## 内容与生成流程

菜谱 Markdown 位于仓库根目录下的分类目录，例如 `炒菜/`、`汤/`、`主食/` 和 `配料/`。构建时会执行以下流程：

1. 读取原始 Markdown。
2. 解析标题、分类、配料、内部配料链接、步骤、营养信息和 `sourcePath`。
3. 使用统一 Image Resolver 匹配图片资源。
4. 生成菜谱、分类、食材、关系、搜索和图片索引。
5. 由自定义 VitePress Theme 渲染页面。

相关实现位于：

- `.vitepress/scripts/`：内容解析、索引生成和图片解析
- `.vitepress/generated/`：构建生成的数据文件
- `.vitepress/theme/`：网站布局、组件和样式
- `tests/`：内容引擎、页面和交互测试

新增或修改菜谱时，请优先修改原始 Markdown 和对应图片，再运行 `npm run build` 检查生成结果。

## 宝塔静态部署

本项目构建后是静态网站，不需要 Node.js 常驻运行。

1. 在本地执行 `npm install` 和 `npm run build`。
2. 在宝塔创建一个静态站点。
3. 将 `.vitepress/dist/` 目录内的全部文件上传到站点根目录。
4. 将域名解析到该站点并配置 HTTPS。

不要把整个源码仓库直接作为网站根目录；网站根目录应当是构建后的 `.vitepress/dist/` 内容。

如果服务器使用 Nginx，可在站点配置中保留静态回退：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

仓库也提供 Docker 构建文件：

```bash
docker build -t lxj-cook:latest -f docker_support/Dockerfile .
docker run -d --name lxj-cook -p 3001:80 lxj-cook:latest
```

然后访问 `http://localhost:3001/`。

## 参与贡献

欢迎在当前仓库提交 Issue、Pull Request 或真实菜谱数据改进。贡献内容应遵循以下原则：

- 原始 Markdown 是内容事实来源。
- 不虚构菜谱数据、营养数据或烹饪事实。
- 不在生成文件中维护手工数据。
- 功能性 UI 图标统一使用 Lucide。
- 界面不使用 Emoji。
- 提交前运行 `npm run build` 和 `npm test`。

## 致谢与来源说明

感谢原作者 [Gar-b-age/CookLikeHOC](https://github.com/Gar-b-age/CookLikeHOC) 及其贡献者，为本项目提供了原始菜谱内容资产和创作基础。

`zhs1234/lxj-cook` 是基于这些内容进行的独立网站重构与展示实现，不代表原作者的官方项目，也不改变原始仓库、原作者及相关内容的归属和声明。

菜谱文字、图片及其他内容的来源和使用边界，请以原始仓库及各资源自身的声明为准。

![CookLikeHOC logo](./logo.png)
