# Mccrree's Learning Notes

这是一个用于长期记录课程与书籍学习过程的个人知识网站，使用 Hexo、NexT Muse、Markdown、MathJax 和 GitHub Pages。

`content/` 中的 Markdown 是学习正文唯一的 Source of Truth。构建脚本只负责验证、添加站点 metadata 和渲染，不会修改或润色正文。课程、章节、周次与 Tutorial 的顺序由 `data/` 中的 manifest 控制。

## 项目结构

```text
data/
  courses.json       # Course / Collection 总表
  chapters.json      # Understanding Deep Learning 的 21 Chapters
  comp2022.json      # COMP2022 的 12 Weeks 及其 Tutorials
content/
  chapters/          # Deep Learning 正文与图片目录
  comp2022/          # COMP2022 正文与图片目录
site/                # 页面、模板和少量 NexT Muse 样式
tools/               # 内容准备、校验与构建输出检查
tests/               # 内容流水线测试
```

不要手写 Hexo front matter。标题、URL、日期、Course、Tags、MathJax、Previous / Next 和 Learning Progress 都由构建流程生成。

## Adding Deep Learning chapter

1. 在 `data/chapters.json` 找到对应 Chapter 的文件名规则，例如 Chapter 4 是 `04-deep-neural-networks.md`。
2. 在 `content/chapters/` 新建该 Markdown，并让第一个非空内容成为与 manifest title 完全一致的 H1：

   ```markdown
   # Deep Neural Networks

   ## Notes

   正文
   ```

3. 如需图片，建立同名资源目录 `content/chapters/04-deep-neural-networks/`，并在 Markdown 中使用相对于该目录的路径，例如 `![Diagram](network.svg)`。
4. 运行 `npm run check`，然后提交并推送。

原有 Deep Learning URL 继续使用 `/deep-learning/NN-slug/`。

## Adding a COMP2022 week

以后完成 Week 4 时，最短流程是：

1. 根据 `data/comp2022.json` 新建 `content/comp2022/04-automata-i.md`。
2. 写正文，并以 manifest 中对应的 title 作为唯一 H1：`# Automata`。
3. 运行 `npm run check`。
4. `git push`；GitHub Actions 会自动构建并部署。

若需图片，使用同名目录 `content/comp2022/04-automata-i/`。COMP2022 URL 为 `/comp2022/NN-slug/`，Week 顺序始终由 manifest 控制。尚未创建 Markdown 的 planned Week 会显示为未完成，不会被当作校验错误。

## Adding a COMP2022 tutorial

Tutorial 是对应 Week 的可选子文章。Week 4 的最短流程是：

1. 新建 `content/comp2022/04-automata-i-tutorial.md`。
2. 使用 `data/comp2022.json` 中的 Tutorial title 作为唯一 H1：`# Tutorial 04 — Automata`。
3. 写练习题与解题过程，然后运行 `npm run check`。
4. 提交并推送；GitHub Actions 会自动部署。

Tutorial 4 的 URL 是 `/comp2022/04-automata-i/tutorial/`。若需图片，使用资源目录 `content/comp2022/04-automata-i-tutorial/`。缺少 planned Tutorial Markdown 不算错误，也不会生成空白文章。

Week 与 Tutorial 分别统计进度。Week 的 Previous / Next 只在 Weeks 之间移动；Tutorial 的 Previous / Next 只在 Tutorials 之间移动。Tutorial 页面会链接回对应 Week，已有 Tutorial 的 Week 页面也会显示练习入口。

## 本地命令

需要 Node.js 24 和 Pandoc 3.9 或兼容版本。

```text
npm ci
npm run check
npm run server
npm run build
```

- `npm run check`：验证 Course manifest、编号、slug、文件名、H1、图片、内部链接和 URL collision。
- `npm run server`：准备临时内容并启动本地预览。
- `npm run build`：重新验证并生成 `public/`，随后检查最终页面、资源、链接和 MathJax。

`.generated/`、`public/` 和 `node_modules/` 都是自动产物，不应手动维护或提交。

## 自动部署

推送到 `main` 后，现有 GitHub Actions 会自动安装依赖、运行测试与校验、构建网站，并部署到：

<https://mccrree.github.io/>
