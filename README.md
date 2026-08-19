# Understanding Deep Learning Notes

这是一个用于长期记录《Understanding Deep Learning》学习过程的个人知识网站。

网站使用 Hexo、NexT Muse、Markdown、MathJax 和 GitHub Pages。Chapter Markdown 是学习正文的唯一 Source of Truth；构建脚本只验证、解析和渲染内容，不会回写或润色正文。

## 添加一个 Chapter

1. 在 `content/chapters/` 中新增规定文件名的 Markdown，例如 `03-shallow-neural-networks.md`。
2. 第一个非空内容必须是与 Chapter Manifest 一致的 H1：

   ```markdown
   # Shallow Neural Networks

   ## 什么是浅层神经网络

   正文
   ```

3. 如需图片，创建同名目录：

   ```text
   content/chapters/03-shallow-neural-networks/
   ```

   然后在 Markdown 中使用简单相对路径：

   ```markdown
   ![示意图](network.svg)
   ```

不需要手写 Hexo Front Matter。标题、URL、日期、标签、数学开关、Previous / Next、Reference 和 Learning Progress 都由构建流程生成。

## 本地命令

需要 Node.js 24 和 Pandoc 3.9 或兼容版本。

```text
npm ci
npm run check
npm run server
npm run build
```

- `npm run check`：验证 Markdown、文件名、标题、图片和内部链接。
- `npm run server`：准备临时内容并启动本地预览。
- `npm run build`：完整验证并生成 `public/`。

`.generated/`、`public/` 和 `node_modules/` 都是自动产物，不应手动维护或提交。

## 自动部署

推送到 `main` 后，GitHub Actions 会自动安装依赖、验证内容、构建网站并部署到：

<https://mccrree.github.io/>
