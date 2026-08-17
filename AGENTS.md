# AGENTS.md

## 1. 作用范围

本文件适用于整个 `CookLikeHOC` 仓库。

任何 AI / Codex / 开发者在修改本仓库前，必须先阅读本文件，再阅读：

1. `IMPLEMENTATION_PLAN.md`
2. `README.md`
3. `docs/` 中与开发、部署、架构相关的文档
4. `.vitepress/` 中的现有配置、主题和构建脚本
5. 本次任务涉及的原始 Markdown、图片与生成脚本

除非任务明确要求，否则不得绕过本文件中的强制规则。

---

# 2. 项目定位

CookLikeHOC 是一个以现有菜谱 Markdown 为内容事实来源的静态菜谱项目。

当前目标不是把它改造成传统企业站、SaaS、后台系统或普通博客，而是：

> 在完整保留内容资产、静态生成能力、可索引语义 HTML 和仓库可维护性的前提下，将展示层升级为高完成度、沉浸式、实验性、具有数字艺术气质的交互式中式烹饪档案馆。

视觉品质目标：

- 以 Awwwards、FWA、CSS Design Awards Daily Site 同等级的设计完成度作为 Benchmark。
- 不承诺获奖，但页面必须以该等级的视觉、交互、排版、动效、响应式和细节标准开发。
- 浏览器应被视为交互式艺术画布，而不是传统文档页面容器。

核心视觉概念：

- 火
- 火候
- 锅气
- 热浪
- 蒸汽
- 油
- 时间
- 食材
- 动作
- 烹饪过程
- 档案
- 编辑设计
- 高冲击力中文排版

---

# 3. 最高优先级强制规则

以下规则不可违反。

## 3.1 图标

所有功能性 UI 图标必须统一使用 Lucide Icons / Lucide Vue。

允许示例：

- `Search`
- `Menu`
- `X`
- `ArrowRight`
- `ArrowUpRight`
- `ChevronDown`
- `Share2`
- `Bookmark`
- `Clock`
- `Flame`
- `ChefHat`
- `Utensils`
- `Scale`
- `Info`
- `Github`
- `Maximize2`
- `Minimize2`
- `Volume2`
- `VolumeX`
- `Dices`
- `SlidersHorizontal`

禁止：

- Font Awesome
- Heroicons
- Material Icons
- Bootstrap Icons
- Iconfont
- Unicode 字符模拟图标
- 自行复制不受控 SVG 作为功能图标
- 混用多个图标库

品牌 Logo、艺术插画、Shader 图形、装饰性图形不属于“功能性 UI 图标”。

## 3.2 Emoji

全站界面禁止使用 Emoji。

包括但不限于：

- 导航
- 按钮
- 标签
- 卡片
- 提示
- 空状态
- 搜索
- Toast
- 文案装饰
- README 中新增的产品 UI 示例

不要使用 Emoji 替代图标或强化视觉。

## 3.3 数据真实性

原始 Markdown 是菜谱内容的事实来源。

禁止凭空生成或补齐仓库不存在的业务数据，例如：

- 难度
- 评分
- 烹饪时长
- 份量
- 用户数量
- 点赞量
- 收藏量
- 推荐指数
- 营养信息
- 热量
- 食材重量

如果某个字段不存在：

- 可以不展示
- 可以标记为缺失
- 不得虚构

## 3.4 内容资产

除非任务明确要求，禁止大规模重写现有 Markdown。

正确方向：

`Markdown -> Parser -> Generated Data -> Custom Theme`

而不是：

`人工批量修改数百 Markdown -> 迎合前端`

现有内容应尽可能保持原样，新增逻辑放在：

- `.vitepress/scripts/`
- `.vitepress/generated/`
- `.vitepress/theme/`

## 3.5 默认主题

最终产品不得残留明显的 VitePress DefaultTheme 视觉。

禁止仅通过覆盖少量 CSS 来“换皮”。

目标是自定义主题体系。

可继续使用 VitePress：

- 构建能力
- Markdown 解析
- SSG
- 路由
- 插件能力

但展示层应自主实现。

---

# 4. 开发前强制流程

开始任何实现任务前，必须：

1. 阅读 `AGENTS.md`
2. 阅读 `IMPLEMENTATION_PLAN.md`
3. 检查当前 git 状态
4. 确认当前分支
5. 阅读本次任务涉及的文件
6. 检查是否已有可复用实现
7. 列出计划修改的文件
8. 说明为什么需要修改这些文件
9. 确认不会覆盖已经验证可用的功能
10. 再开始修改

如果当前仓库与 `IMPLEMENTATION_PLAN.md` 描述不一致：

- 以仓库真实状态为准
- 不可盲目假设
- 在执行报告中说明差异

---

# 5. 修改原则

## 5.1 小步提交思想

每个阶段应保持职责明确。

不要一次同时：

- 改架构
- 改主题
- 重写搜索
- 加 WebGL
- 重做全部页面
- 重写全部 Markdown

应按实施计划逐阶段推进。

## 5.2 不破坏已验证功能

在替换功能之前，应确认：

- 新实现已完成
- 新实现已有基本测试
- 新实现可构建
- 新实现可回退

避免先删除旧功能，再开始写新功能。

## 5.3 复用而非复制

出现重复逻辑时，应抽象：

- composables
- helpers
- components
- generated data
- shared types

禁止为了“尽快完成”在多个组件复制同一套解析、动画或路径处理代码。

---

# 6. 技术方向

建议技术栈：

- VitePress
- Vue 3
- TypeScript
- Lucide Vue
- GSAP
- Lenis
- Three.js / WebGL（限高价值场景）
- CSS Custom Properties
- CSS Layers
- IntersectionObserver
- Progressive Enhancement

不得为了追求“现代”而无理由迁移到 Next.js / Nuxt。

只有在以下情况经过独立评估后才能提出迁移：

- VitePress 明确无法满足核心功能
- 迁移收益远高于内容迁移成本
- 已提供兼容现有 Markdown 的迁移方案
- 已分析 SEO、路由、构建和贡献流程影响

默认路线仍然是：

> 保留 VitePress，重做主题和内容生成层。

---

# 7. 推荐目录约束

目标目录方向：

```text
.vitepress/
├── config.ts
├── theme/
│   ├── index.ts
│   ├── Layout.vue
│   ├── components/
│   │   ├── navigation/
│   │   ├── search/
│   │   ├── recipe/
│   │   ├── category/
│   │   ├── motion/
│   │   └── webgl/
│   ├── layouts/
│   │   ├── HomeLayout.vue
│   │   ├── CategoryLayout.vue
│   │   ├── RecipeLayout.vue
│   │   ├── IngredientLayout.vue
│   │   └── CookLayout.vue
│   ├── composables/
│   ├── styles/
│   ├── shaders/
│   └── types/
├── scripts/
│   ├── generate-indexes.mjs
│   ├── generate-recipes.mjs
│   ├── generate-relations.mjs
│   ├── generate-search.mjs
│   └── resolve-images.mjs
└── generated/
```

不要求一次性创建全部文件。

仅在当前阶段需要时创建。

---

# 8. 内容生成架构

目标数据流：

```text
原始 Markdown
      ↓
Content Parser
      ↓
recipes.generated.json
ingredients.generated.json
categories.generated.json
relations.generated.json
images.generated.json
search.generated.json
      ↓
自定义 Vue / VitePress Theme
```

推荐 Recipe 类型：

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

字段必须来自真实内容解析。

解析失败时，应：

- 返回可诊断错误
- 标记缺失
- 保证单个异常文件不会无提示破坏整个生成过程

---

# 9. Image Resolver 规范

仓库图片命名可能存在：

- 中文括号
- 英文括号
- 空格差异
- “版本”字样差异
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

图片解析不得散落在组件中。

必须建立统一 resolver。

推荐：

```text
Recipe title
   ↓
normalize
   ↓
candidate matching
   ↓
exact match / normalized match
   ↓
image map override
```

如需人工映射，集中放在：

`image-map.json`

禁止在 UI 组件里写大量：

```js
if (title === 'xxx') ...
```

---

# 10. 设计系统

## 10.1 色彩方向

建议基础色：

```text
Ink Black   #0E0E0C
Rice Paper  #F0ECE2
Chili Red   #E8482E
Ginger      #D8A13B
Vegetable   #53664A
```

具体色值可在设计阶段微调，但整体方向应：

- 暖
- 克制
- 有食物质感
- 避免 SaaS 蓝紫渐变风

## 10.2 排版

首页和分类页允许使用超大中文排版：

```css
font-size: clamp(5rem, 14vw, 16rem);
```

应尝试：

- 字体溢出画布
- 文字与图片遮挡
- 非对称 Grid
- Kinetic Typography
- Mask Reveal
- Layered Composition

但不能影响基础阅读与可访问性。

## 10.3 字体授权

禁止随意引入授权不明字体。

使用任何第三方字体前确认：

- 授权
- Web 使用许可
- 中文字符覆盖
- 性能成本

---

# 11. 设计红线

禁止出现：

1. 传统 SaaS Dashboard 风格
2. 模板式 Hero + 三卡片 + CTA
3. 全页面 Card 套 Card
4. 所有模块统一 12px / 16px 圆角矩形
5. 大面积玻璃拟态作为主视觉
6. 默认 VitePress 文档风格残留
7. 无意义渐变
8. 只为了“高级感”堆 blur
9. 全部内容居中对齐
10. 同质化 Bento Grid
11. 为了炫技破坏阅读
12. 低清图片强制铺满大屏
13. 没有统一系统的随机动画
14. 桌面端简单缩小得到移动端
15. Canvas-only SEO 页面

---

# 12. Motion Design

必须建立统一 Motion Tokens。

建议：

```text
micro   240ms
normal  480ms
large   800ms
scene   1200ms+
```

允许：

- Split Text
- Mask Reveal
- Image Reveal
- Scroll Scrub
- Parallax
- Magnetic Interaction
- Inertia
- Spring
- Shared Element-like Transition
- Horizontal Rail
- Cursor Interaction

每个动画必须至少服务一项：

- 空间关系
- 导航反馈
- 信息层级
- 叙事
- 品牌氛围
- 操作反馈

不要为了“有动画”而做动画。

---

# 13. WebGL 使用规则

Three.js / WebGL 只用于高价值场景。

优先场景：

1. 首页 Hero 热浪 / 蒸汽 / 图片折射
2. Ingredients Universe
3. 高价值页面转场

其余优先使用：

- CSS
- GSAP
- SVG
- Canvas 2D

禁止：

- 每个卡片一个 WebGL Scene
- 每屏独立 Three.js
- 无降级方案的重 Shader

必须：

- 懒加载
- 性能检测
- 低性能降级
- 移动端降级
- `prefers-reduced-motion` 降级

---

# 14. 核心页面

第一阶段核心页面只有：

1. Home
2. Explore / Category
3. Recipe Detail
4. Search
5. Cook Mode

先把这 5 类页面做到发布品质，再扩展：

- Ingredients Universe
- Random Recipe
- Nutrition Explore
- Collections
- About

---

# 15. 首页原则

首页不是传统 VitePress Home。

目标：

- 强叙事开场
- 大字号中文
- 图片与 Typography 形成层级
- 火候 / 热浪作为视觉母题
- 具有可探索的分类入口
- 有明确功能入口，但避免按钮堆叠

推荐叙事：

```text
Explore
   ↓
Choose
   ↓
Ingredients
   ↓
Heat
   ↓
Cook
   ↓
Finish
```

---

# 16. 分类页原则

分类页不能继续使用“Sidebar + 超长 Markdown 列表”作为主要体验。

目标：

- Editorial Layout
- 图片驱动
- Controlled Chaos
- 非对称构图
- 高质量 Hover
- 可快速浏览大量菜谱
- 仍然保留语义 HTML

禁止把所有菜谱做成完全一致的卡片 Grid。

---

# 17. Recipe Detail 原则

菜谱页应围绕：

1. Recipe Hero
2. Ingredients
3. Cooking Timeline
4. Nutrition
5. Related Recipes
6. Cook Mode

现有 Markdown 的：

- 标题
- 配料
- 步骤
- 营养成分

必须继续作为真实内容来源。

## 17.1 Cooking Timeline

步骤不能只是普通列表换颜色。

应该通过滚动 / 分段构图强化烹饪过程。

## 17.2 Nutrition

如果存在营养信息，可转为视觉化数据。

如果不存在，不展示。

## 17.3 Related Recipes

应优先通过：

- 相同分类
- 共同食材
- 标题关键词

建立真实关系。

禁止随机伪装成“智能推荐”。

---

# 18. Cook Mode

Cook Mode 是产品功能，不是纯视觉页面。

要求：

- 高对比
- 大字体
- 一次突出一个步骤
- 前后步骤清晰
- 移动端优先
- 尽量减少误触
- 不显示无关导航
- 保留退出方式
- 图标使用 Lucide

可选增强：

- Wake Lock API（必须有兼容性和权限降级）
- 步骤进度
- 横向滑动

---

# 19. 搜索

搜索至少支持：

- 菜名
- 分类
- 食材（数据可解析时）

UI 应自定义，不依赖 DefaultTheme 搜索外观。

必须：

- 键盘可用
- Escape 可关闭
- Focus 管理正确
- 移动端可用
- 搜索结果有空状态
- 空状态禁止 Emoji

---

# 20. Cursor

自定义 Cursor 仅用于 Desktop 且必须是 Progressive Enhancement。

触摸设备关闭。

必须尊重：

- `pointer: coarse`
- `prefers-reduced-motion`

自定义 Cursor 不能破坏原生点击反馈和可访问性。

---

# 21. SEO

实验视觉不得破坏 SEO。

每道 Recipe 页面仍应有语义结构，例如：

```html
<h1>农家小炒肉</h1>
<h2>配料</h2>
<h2>步骤</h2>
<h2>营养成分</h2>
```

必须关注：

- title
- description
- canonical（如需要）
- heading hierarchy
- internal links
- static HTML
- clean URLs
- image alt
- structured data（仅在数据真实、字段足够时使用）

原则：

> HTML 是内容，CSS / SVG / Canvas / WebGL 是体验。

---

# 22. 可访问性

必须具备：

- Keyboard Navigation
- Focus Visible
- Semantic HTML
- aria-label
- 正确 button / a 使用
- Touch Target
- 合理对比度
- 图片 alt
- Screen Reader 基础支持

必须实现：

```css
@media (prefers-reduced-motion: reduce) {
  /* disable or simplify non-essential motion */
}
```

不要因为 Awwwards 风格牺牲基本可访问性。

---

# 23. 响应式

移动端不是 Desktop 的缩小版。

至少检查：

- 360px
- 390px
- 768px
- 1024px
- 1440px
- 1920px

需要单独考虑：

- 导航
- 超大字体换行
- 图片裁切
- Cook Mode
- Search
- Hover 替代
- 自定义 Cursor 禁用
- WebGL 降级
- 横向滚动行为

---

# 24. 性能

必须注意：

- WebGL 延迟加载
- 动画库按需
- 图片 lazy loading
- 避免布局抖动
- 预留图片尺寸
- 清理事件监听器
- 清理 GSAP context
- 组件卸载清理动画
- 避免重复 RAF
- 避免多个 Scroll Controller 冲突

如引入 Lenis：

- 统一管理 Smooth Scroll
- 不允许组件各自创建实例

---

# 25. CSS / JS 质量

禁止新增无用 CSS / JS。

修改后应检查：

- 未使用 selector
- 重复 CSS
- 冲突变量
- 重复媒体查询
- 重复动画
- 未使用组件
- 未使用依赖
- 重复工具函数
- 无意义全局样式

不要在最后阶段用大量 `!important` 修补架构问题。

---

# 26. 依赖管理

新增依赖前必须说明：

1. 解决什么问题
2. 为什么原生实现不足
3. 体积和运行时成本
4. 是否存在更轻替代

禁止同时引入多个解决同一问题的库。

例如：

- 已使用 GSAP，就不要再引入另一个大型 Motion 库做同类任务
- 已使用 Lucide，就不要引入第二图标库

---

# 27. 开发完成后的强制检查

每次任务完成后，必须运行当前仓库能够运行的检查。

优先：

```bash
npm install
npm run build
```

如仓库有：

```bash
npm run lint
npm run typecheck
npm test
```

则一并运行。

必须报告真实结果。

不得写：

> 应该可以通过。

必须写：

> `npm run build`：PASS

或：

> `npm run build`：FAIL  
> 原因：...

如果因环境限制无法运行，也要明确说明。

---

# 28. 每次任务最终报告格式

完成修改后必须报告：

## 已完成

- 做了什么

## 修改文件

- `path/to/file`
- `path/to/file`

## 技术说明

- 为什么这样实现
- 是否新增依赖
- 是否改变内容生成逻辑

## 验证结果

- build
- typecheck
- lint
- test
- 手工检查

## 风险 / 待办

- 已知限制
- 下一阶段建议

不要隐藏失败项。

---

# 29. 非官方项目声明

项目 README 已说明本项目不是老乡鸡官方仓库。

任何新网站页面不得通过设计或文案制造“官方官网”误认。

About / Footer 应保留：

- 非官方项目声明
- 内容来源说明
- GitHub 仓库链接
- 必要版权 / 内容说明

不要擅自删除原项目的重要免责声明。

---

# 30. 最终质量标准

页面“能运行”不等于完成。

交付必须同时通过：

- 内容正确
- Build 正确
- 视觉完成
- 动效完成
- 移动端完成
- Keyboard 可用
- Reduced Motion 可用
- 图片质量合理
- SEO 未被破坏
- 无明显 DefaultTheme 残留
- 无 Emoji
- UI 图标全部来自 Lucide
- 无明显模板感
- 无无意义组件堆叠
- 无严重性能问题

最终目标：

> 一个具备真实菜谱价值，同时具有明确视觉概念、完整交互语言和作品级完成度的 CookLikeHOC。
