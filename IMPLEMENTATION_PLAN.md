# IMPLEMENTATION_PLAN.md

# CookLikeHOC 网站重构实施计划

## 0. 使用说明

本文件是 Codex 的阶段执行路线。

执行任何阶段前：

1. 阅读 `AGENTS.md`
2. 阅读本文件
3. 检查当前仓库状态
4. 仅执行当前阶段
5. 不提前跨阶段实现大量功能
6. 完成后按 `AGENTS.md` 指定格式报告

如果发现前一阶段实际上已经完成：

- 先验证
- 再说明
- 不重复重写

---

# 1. 总目标

将现有 CookLikeHOC 从以 VitePress DefaultTheme 为主的文档型站点，升级为：

> Interactive Chinese Cooking Archive

保留：

- 原始 Markdown
- 菜谱内容
- 分类结构
- 图片资产
- 静态生成
- SEO
- GitHub 贡献友好性

重构：

- 内容解析层
- 自定义 Theme
- Navigation
- Home
- Category
- Recipe
- Search
- Cook Mode
- Motion
- 高价值 WebGL
- Mobile
- Accessibility
- Performance

---

# 2. 当前已知基础

开发前仍必须重新验证，不可仅依赖本文件。

目前项目方向大致为：

- VitePress
- Vue
- Markdown 菜谱
- `.vitepress/config.*`
- `.vitepress/navSidebar.*`
- `.vitepress/scripts/generate-indexes.mjs`
- `.vitepress/theme/`
- `images/`
- 多个中文菜谱分类目录

现有主题接近 DefaultTheme。

这意味着优先重构 Theme，而不是重写内容。

---

# 3. 阶段总览

| 阶段 | 名称 | 核心目标 |
|---|---|---|
| P0 | Repository Audit | 获取真实仓库状态 |
| P1 | Content Engine | Markdown -> 结构化数据 |
| P2 | Design Foundation | Tokens / Typography / Motion 基础 |
| P3 | Global Shell | Layout / Header / Menu / Search Shell |
| P4 | Home | 新首页 |
| P5 | Category / Explore | 分类探索页 |
| P6 | Recipe Detail | 菜谱详情 |
| P7 | Cook Mode | 烹饪模式 |
| P8 | Search & Relations | 搜索与相关菜谱 |
| P9 | Advanced Motion / WebGL | 高价值沉浸动效 |
| P10 | QA / Performance / SEO | 发布级收尾 |

每阶段完成后再进入下一阶段。

---

# P0 — Repository Audit

## 目标

只审计，不进行大规模功能开发。

## 必须检查

### 1. Git

- 当前分支
- `git status`
- 未提交修改
- 远端信息

### 2. 目录

重点输出：

```text
.vitepress/
docs/
images/
各菜谱分类目录
package.json
README.md
```

### 3. VitePress

检查：

- config
- theme
- layout
- styles
- nav
- sidebar
- search
- cleanUrls
- base
- build scripts

### 4. 内容

随机抽查多个分类，每个至少抽若干 Markdown：

- 标题结构
- 配料格式
- 步骤格式
- 营养表
- 内部链接
- 图片引用
- 格式异常

不要只抽一个菜谱后假设全库一致。

### 5. 图片

检查：

- 图片数量
- 格式
- 命名规律
- 菜名与图片名匹配率
- 大小
- 低分辨率图片风险

### 6. 现有脚本

检查：

- `generate-indexes`
- nav/sidebar 自动生成
- 构建前执行逻辑
- 是否会写入 README
- 是否存在覆盖人工内容风险

### 7. 依赖

检查：

- 现有依赖
- VitePress 版本
- Node 版本要求
- 可清理依赖

## P0 输出

生成一份审计报告，至少包含：

```text
当前架构
内容模型
图片模型
构建流程
现有功能
异常格式
技术债
风险
P1 推荐修改文件
```

## P0 禁止

- 不重做首页
- 不引入 Three.js
- 不批量重写 Markdown
- 不删除 DefaultTheme
- 不迁框架

## P0 验收

- 真实运行现有 build
- 有清晰问题清单
- 有 P1 文件影响范围

---

# P1 — Content Engine

## 目标

建立可靠的结构化内容生成层。

核心方向：

```text
Markdown
   ↓
Parser
   ↓
Generated Data
   ↓
Theme
```

## 建议新增

```text
.vitepress/scripts/
  generate-recipes.mjs
  resolve-images.mjs
  generate-relations.mjs

.vitepress/generated/
```

根据仓库实际情况可调整。

## Recipe 数据

建议最少支持：

```ts
interface Recipe {
  id: string
  slug: string
  title: string
  category: string
  image?: string
  ingredients: Ingredient[]
  steps: Step[]
  nutrition?: Nutrition
  sourcePath: string
}
```

## Parser 要求

解析：

### 标题

```md
# 菜名
```

### 配料

```md
## 配料
```

支持：

- 普通文本
- Markdown link
- 品牌/供应商括号信息
- 无重量情况

### 步骤

支持类似：

```md
- 1. ...
- 2. ...
```

也要容忍格式差异。

### 营养

优先解析 Markdown Table。

如果表不存在：

```ts
nutrition: undefined
```

## 图片 resolver

必须统一处理：

- 中文括号 / 英文括号
- 空格
- 版本
- png / jpg / jpeg / webp

允许：

```text
image-map.json
```

作为例外映射。

## Generated 输出

建议：

```text
recipes.generated.json
categories.generated.json
ingredients.generated.json
images.generated.json
relations.generated.json
```

不要提交异常巨大的冗余数据。

## P1 测试

至少验证：

- 多分类
- 有营养表
- 无营养表
- 有内部配料链接
- 无图片
- 图片名括号差异
- 同名/版本菜谱

## P1 验收

- Build PASS
- 原 Markdown 无大规模修改
- JSON 数据可供 Vue 消费
- 异常文件能诊断
- Image Resolver 不散落到 UI

---

# P2 — Design Foundation

## 目标

建立整个站点的设计语言，而不是先拼页面。

## 新建设计层

建议：

```text
.vitepress/theme/styles/
  reset.css
  tokens.css
  typography.css
  animation.css
  global.css
```

## Tokens

至少定义：

### Color

```css
--color-ink:
--color-paper:
--color-chili:
--color-ginger:
--color-vegetable:
```

### Spacing

不要随处出现无规律 magic number。

### Typography

定义：

- display
- heading
- body
- label
- data
- mono（如需要）

### Motion

定义：

```css
--motion-micro:
--motion-normal:
--motion-large:
--motion-scene:
```

以及统一 easing。

## Lucide

安装 / 配置 `lucide-vue-next`（如果仓库尚无）。

确认后全站统一使用。

## Reduced Motion

基础全局支持必须在 P2 建立，不拖到最后。

## P2 输出

制作一个内部 Design Test / Sandbox 页面或临时组件，用于验证：

- Typography
- Buttons
- Links
- Icons
- Focus
- Image treatment
- Motion
- Light / dark strategy（如有）

测试完成后可删除临时页面。

## P2 验收

- 没有 Emoji
- Lucide 可用
- Tokens 可复用
- Motion 有统一约束
- Focus 样式可见
- Build PASS

---

# P3 — Global Shell

## 目标

替换 VitePress 默认 UI 外壳。

## 实现

建议：

```text
Layout.vue
SiteHeader.vue
FullscreenMenu.vue
SearchOverlay.vue
PageTransition.vue
ScrollProgress.vue
CustomCursor.vue
```

仅按需要创建。

## Header

Desktop 保持克制。

建议主要入口：

```text
CookLikeHOC
Explore
Search
About
GitHub
Menu
```

避免把全部分类塞进 Header。

## Fullscreen Menu

展示所有分类。

Hover：

- 文字变化
- 右侧图片预览（有图片数据时）

Touch：

- 使用明确点击行为
- 不依赖 hover

## Custom Cursor

这一阶段仅做基础机制。

Touch 自动关闭。

## SearchOverlay

P3 只建立 Shell 和可访问性。

实际搜索数据逻辑可 P8 完成。

## P3 验收

- 默认 Header / Sidebar / Search 外观被替换
- Keyboard 可导航
- Escape 行为正确
- 移动菜单可用
- 没有 Focus Trap 错误
- Build PASS

---

# P4 — Home

## 目标

用首页确定全站高级视觉方向。

## Hero

视觉关键词：

- 超大中文
- 热浪
- 锅气
- 非对称构图
- Layer
- 深度
- Editorial Typography

主标题方向：

```text
像
老乡鸡
那样
做饭
```

可以实验性排版，不要求保持一行。

## Hero 技术

第一版先实现：

- CSS
- GSAP
- 图片
- Mask
- Transform

不要一开始就写 Shader。

WebGL 放 P9。

## 第二部分

构建：

> 今天想吃点什么？

可使用：

- Infinite Recipe Rail
- Category Rail
- Drag / Inertia
- Horizontal scroll

但必须保留触摸端自然滚动。

## 分类入口

分类应成为探索体验，而不是传统按钮矩阵。

## 首页内容

可以包含：

- 分类探索
- 推荐菜谱
- 项目介绍
- 最新更新
- GitHub / 来源说明

不要做成首页信息大拼盘。

## P4 验收

Desktop：

- 1440
- 1920

Mobile：

- 390
- 768

必须视觉完整。

同时：

- Reduced Motion 可用
- 文本可选择
- 语义 heading 正确
- Hero 不严重影响首屏性能

---

# P5 — Category / Explore

## 目标

将自动生成的分类列表升级为视觉探索页面。

## Category Hero

例如：

```text
01
炒
  菜

XX RECIPES
```

数量来自真实 generated data。

## 列表

推荐：

- Editorial Masonry
- Asymmetric Grid
- Controlled Chaos

但布局必须可维护。

## Recipe Card

基础信息：

- image
- title
- category / index

Hover：

- 轻微 scale
- text reveal
- cursor feedback

不要过度复杂。

## 分类筛选

如当前数据支持，可加入：

- 分类
- 食材
- 搜索

不要先虚构标签体系。

## SEO

分类页面仍输出：

- H1
- 可爬取 recipe links

## P5 验收

- 大量菜谱下仍流畅
- 无明显 Layout Shift
- 图片缺失有优雅 fallback
- Mobile 有独立布局
- Keyboard 能进入菜谱
- Build PASS

---

# P6 — Recipe Detail

## 目标

将 Markdown 阅读页变成真正的沉浸式做菜体验。

## 结构

```text
Recipe Hero
Ingredients
Cooking Timeline
Nutrition
Related Recipes
Cook Mode Entry
```

## Hero

包括真实：

- 菜名
- 分类
- 图片
- 版本名称（若标题包含）

避免生成假数据。

## Ingredients

Desktop：

- 可左右分屏
- 列表有层级
- 内部配料链接仍可点击

Mobile：

- 线性清晰
- 不做拥挤双栏

## Cooking Timeline

将步骤结构化呈现。

允许：

- sticky
- scroll progress
- step transition
- 大字号 action

但所有步骤必须完整存在于 DOM。

## Nutrition

有数据才显示。

将表格视觉化为：

```text
191 KCAL
11.5 PROTEIN
14.5 FAT
...
```

数值必须来自原 Markdown。

## P6 验收

至少抽查：

- 有图片菜谱
- 无图片菜谱
- 有营养菜谱
- 无营养菜谱
- 有配料内部链接菜谱
- 多步骤菜谱
- 极短菜谱

Build PASS。

---

# P7 — Cook Mode

## 目标

提供真正适合厨房环境的步骤模式。

## Entry

Recipe 页提供明确入口。

图标使用 Lucide：

- `Maximize2`
- 或其他语义合适的 Lucide 图标

## 页面

重点：

```text
02 / 05

下入 60g 蒜子炒香
再加入 800g 瘦肉片
```

## 操作

- Previous
- Next
- Exit
- step indicator

Mobile 支持：

- Swipe（实现可靠时）
- 大 Touch Target

## 可选 Wake Lock

如果实现：

- Feature detect
- 错误处理
- Page visibility 恢复
- 不阻塞基础功能

## P7 验收

- 手机 390px 可实际使用
- 不依赖 hover
- 键盘也可操作
- 无不可退出状态
- Reduced Motion 可用
- Build PASS

---

# P8 — Search & Relations

## 目标

建立真正适合菜谱库的检索与推荐。

## Search

支持：

1. 菜名
2. 分类
3. 食材（解析质量足够时）

## UI

全屏 Search Overlay。

键盘：

- `/` 可选做快捷键
- Escape close
- Arrow navigation（实现稳定时）
- Enter open

## Relations

生成相关菜谱逻辑。

建议优先级：

```text
共同食材
  ↓
相同分类
  ↓
标题关键词
```

需要定义可解释评分。

例如：

```text
+3 same primary ingredient
+2 other shared ingredient
+1 same category
```

具体评分按真实数据调整。

## 禁止

- 随机结果冒充“相关推荐”
- 用不存在的用户行为
- 用虚构热度

## Random Recipe

可作为额外功能。

使用 Lucide `Dices`。

## P8 验收

- 搜索结果准确
- 中文关键词可搜索
- 空结果可用
- relations 可解释
- Build PASS

---

# P9 — Advanced Motion / WebGL

## 目标

在核心体验稳定后加入作品级高级渲染。

只做高价值场景。

## 9.1 Hero Heat Distortion

可实现：

- heat haze
- subtle displacement
- steam particles
- texture distortion

必须克制。

## 9.2 Ingredient Universe

在内容关系质量足够时再做。

数据来自真实 ingredients / relations。

功能：

- ingredient nodes
- recipe relationships
- interaction
- drilldown

如果数据模型不足，本阶段允许延期。

## 9.3 Page Transition

从 Recipe Card 到 Recipe Detail：

目标视觉：

```text
card image
   ↓
expand
   ↓
transition
   ↓
recipe hero
```

不强求浏览器原生 View Transition API。

优先稳定和兼容。

## 性能

必须：

- lazy import
- requestAnimationFrame cleanup
- dispose geometry/material/texture
- mobile quality level
- reduced motion fallback

## P9 验收

- 没有明显 GPU 泄漏
- 连续切换页面不越来越卡
- Mobile 有降级
- 低性能仍可使用
- 没有影响搜索/导航可用性
- Build PASS

---

# P10 — QA / Performance / SEO / Release

## 目标

从“完成开发”提升到“发布品质”。

## 10.1 Code Audit

检查：

- 冗余 CSS
- 冗余 JS
- 未使用组件
- 未使用依赖
- 重复 animation
- 重复 event listener
- memory leak
- console error
- console warning

## 10.2 页面测试

至少：

### Home
- Desktop
- Tablet
- Mobile

### Category
- 大分类
- 小分类

### Recipe
- 图片 / 无图
- 营养 / 无营养
- 内部 link

### Search
- 有结果
- 无结果

### Cook Mode
- 多步骤
- 手机

## 10.3 Browsers

重点：

- Chrome
- Edge
- Safari
- Firefox

如果无法完整实测，说明环境限制。

## 10.4 Responsive

至少：

```text
360
390
768
1024
1440
1920
```

## 10.5 Accessibility

检查：

- Keyboard
- focus
- aria
- heading
- alt
- contrast
- reduced motion

## 10.6 Performance

重点：

- LCP
- CLS
- JS weight
- image size
- WebGL startup
- scroll smoothness

不要为追求 Lighthouse 数字破坏体验，但明显性能问题必须修复。

## 10.7 SEO

确认：

- static HTML
- title
- description
- H1
- H2
- links
- cleanUrls
- internal links
- 404
- canonical / base path

## P10 最终验收

必须同时达到：

- `npm run build` PASS
- 无明显运行时报错
- Desktop 完整
- Mobile 完整
- 无 Emoji
- UI 图标 100% Lucide
- 无明显 DefaultTheme 残留
- 原 Markdown 未被无意义大改
- SEO 未因 Canvas / WebGL 破坏
- Reduced Motion 可使用
- 关键页面不是模板化 SaaS 风格
- 交互和视觉语言统一

---

# 4. Codex 首次执行提示词

下面这段用于第一次把任务交给 Codex。

```text
你现在负责重构 CookLikeHOC。

开始任务前必须：

1. 完整阅读仓库根目录 AGENTS.md。
2. 完整阅读 IMPLEMENTATION_PLAN.md。
3. 阅读 README.md。
4. 阅读 docs/ 中与开发有关的文档。
5. 检查 git status、当前分支和现有未提交修改。
6. 检查 package.json、VitePress 配置、.vitepress/theme、.vitepress/scripts。
7. 抽查多个菜谱分类和多个 Markdown，确认真实内容格式。
8. 检查 images/ 的命名、格式、分辨率及其与菜谱标题的对应关系。
9. 不得假设文档描述与当前仓库完全一致，必须以真实仓库状态为准。
10. 不得覆盖已经验证可用的功能。

本次只执行 IMPLEMENTATION_PLAN.md 中的 P0 — Repository Audit。

本阶段禁止：
- 重做首页
- 批量修改菜谱
- 引入 Three.js/WebGL
- 迁移框架
- 大规模重写 Theme
- 删除现有功能

请先列出你将检查的文件和目录，再开始审计。

完成后输出：

1. 当前架构
2. 内容模型
3. 图片模型
4. VitePress 构建流程
5. 当前页面/主题状态
6. 发现的格式不一致
7. 技术债
8. 风险
9. P1 建议修改文件
10. P1 实施建议
11. 实际运行过的检查命令和真实结果

所有结论必须来自实际仓库检查，不要凭空推测。
```

---

# 5. 通用阶段执行提示词

P0 完成后，每个阶段可使用：

```text
继续 CookLikeHOC 重构。

开始前必须重新阅读：
- AGENTS.md
- IMPLEMENTATION_PLAN.md

同时检查：
- git status
- 当前分支
- 上一阶段已经修改的代码
- 当前 build 状态

本次只执行 IMPLEMENTATION_PLAN.md 中的「P{阶段编号} — {阶段名称}」。

要求：

1. 先复核上一阶段是否满足验收标准。
2. 修改前列出计划影响的文件。
3. 不跨阶段大规模实现后续功能。
4. 不覆盖已经验证可用的功能。
5. 原始 Markdown 继续作为内容事实来源。
6. 禁止虚构菜谱数据。
7. 全站禁止 Emoji。
8. 功能性 UI 图标统一使用 Lucide。
9. 不得引入第二套图标库。
10. 遵守 AGENTS.md 中设计、性能、SEO、无障碍和响应式要求。
11. 完成后运行能够运行的 build / typecheck / lint / test。
12. 报告真实结果，不得用“应该没问题”替代实际验证。

最后按 AGENTS.md 的任务报告格式输出：
- 已完成
- 修改文件
- 技术说明
- 验证结果
- 风险 / 待办
```

---

# 6. P1 专用提示词

```text
执行 P1 — Content Engine。

重点：
- 不重构页面
- 不改视觉
- 不加高级动画
- 只建立可靠的内容解析和 generated data

先抽查多种 Markdown 格式，再设计 Parser。

必须覆盖：
- title
- category
- ingredients
- internal ingredient links
- steps
- nutrition
- sourcePath
- image resolution

必须建立统一 Image Resolver。

图片匹配要处理：
- 中文/英文括号
- 空格差异
- 版本名称
- jpg/jpeg/png/webp

特殊映射集中管理，不允许散落 if(title===...)。

完成后用真实菜谱测试，并运行 build。
```

---

# 7. P4 首页专用提示词

```text
执行 P4 — Home。

目标不是普通“漂亮首页”，而是一个作品级 Interactive Cooking Archive 首页。

视觉要求：
- 高冲击力中文排版
- Editorial
- 非对称构图
- 火候 / 热浪 / 锅气视觉语言
- 强层级
- 高质量图片处理
- 避免传统 Hero + Cards + CTA 模板

本阶段：
- 优先 CSS + GSAP
- 不要提前加入复杂 Shader
- 不要用大量玻璃拟态
- 不要用 Bento Dashboard 风格
- 不要让每个模块都是圆角 Card

首页必须同时完成 Desktop 与 Mobile。
必须支持 prefers-reduced-motion。
必须保留语义 HTML。
```

---

# 8. P6 菜谱页专用提示词

```text
执行 P6 — Recipe Detail。

不要把 Markdown 只是换个 CSS。

围绕真实烹饪过程重新组织体验：

Recipe Hero
→ Ingredients
→ Cooking Timeline
→ Nutrition
→ Related
→ Cook Mode Entry

所有内容必须来自真实 generated recipe data。

不得虚构：
- 时间
- 难度
- 评分
- 份量
- 热量

如果 nutrition 不存在，则模块不显示。

步骤必须完整保留在 DOM，不能只有 Canvas 中能看到。

内部配料链接必须继续可点击。

至少测试多种真实菜谱。
```

---

# 9. P9 高级动效专用提示词

```text
执行 P9 — Advanced Motion / WebGL。

前提：
- P0-P8 已通过验收
- 核心页面稳定
- Mobile 已可用

WebGL 只允许用于真正提升体验的场景：

1. Home Hero heat distortion
2. Ingredient Universe
3. Page transition

不要全站 WebGL 化。

所有高级渲染必须：
- lazy load
- cleanup
- dispose resources
- prefers-reduced-motion fallback
- mobile fallback
- low performance fallback

不要为了展示 Three.js 技术破坏内容阅读、SEO 或滚动性能。

每个高级效果完成后单独测试内存、页面切换和移动端性能。
```

---

# 10. 最终验收提示词

```text
执行 P10 — QA / Performance / SEO / Release。

本阶段原则：
不要再增加新的大功能。
目标是把现有实现打磨到发布品质。

进行全量检查：

1. npm build / typecheck / lint / test
2. 全站 Emoji 搜索，必须为 0 个 UI Emoji
3. 全站图标来源检查，功能性 UI 只能 Lucide
4. DefaultTheme 残留检查
5. 冗余 CSS / JS
6. 未使用依赖
7. console error/warning
8. responsive
9. keyboard navigation
10. focus
11. prefers-reduced-motion
12. image quality
13. LCP/CLS
14. SEO heading
15. internal links
16. search
17. Cook Mode
18. category
19. recipe variants
20. page transition / WebGL cleanup

不要只报告发现的问题：
安全且明确的问题直接修复。

最终输出：
- 已修复问题
- 剩余问题
- 所有测试结果
- 发布风险
- 是否达到 AGENTS.md 最终质量标准
```

---

# 11. 完成定义

本项目只有在以下条件同时满足时才算重构完成：

- 内容资产仍可持续通过 Markdown 维护
- 构建稳定
- 页面拥有统一设计语言
- 首页具备明确作品级视觉记忆点
- 分类探索比原 Sidebar/List 更高效
- Recipe Detail 真正围绕做菜体验设计
- Cook Mode 可实际使用
- Search 可用
- Mobile 不是 Desktop 缩小版
- 动效有统一 Motion System
- WebGL 可降级
- SEO 保留
- Accessibility 基本达标
- 无 Emoji
- 功能性 UI 全部 Lucide
- 无明显模板化 SaaS 风格
- 无明显 VitePress DefaultTheme 残留
- 没有为了视觉虚构菜谱数据

完成后的 CookLikeHOC 应同时具备：

> 内容可信度、实用性、视觉辨识度、交互完整性和工程可维护性。
