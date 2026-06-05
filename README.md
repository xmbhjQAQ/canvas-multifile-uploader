# Canvas 多文件上传助手

[English README](./README_EN.md)

一个用于 Canvas LMS 作业提交页的油猴脚本。它会在 Canvas 作业页面右下角添加一个小面板，让你一次选择多个本地文件，然后按 Canvas 原本的 `Add Another File` 流程逐个填入上传行。

脚本不会自动提交作业。填入文件后，请你自己检查文件名，再点击 Canvas 的提交按钮。

## 功能

- 一次选择多个文件。
- 自动为每个文件创建 Canvas 上传行。
- 中英双语 UI，可在面板中切换。
- 默认跟随浏览器语言，切换后会记住选择。
- 适配大多数 Canvas LMS 经典作业提交页。

## 安装

1. 安装浏览器脚本管理器，例如 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey。
2. 新建用户脚本。
3. 将 [canvas-multi-file-upload.user.js](./canvas-multi-file-upload.user.js) 的内容粘贴进去。
4. 保存脚本。
5. 打开 Canvas 作业页面，例如 `/courses/.../assignments/...`。

## 使用

1. 打开 Canvas 作业页面。
2. 点击 `Submit Assignment`，并切换到 `File Upload` 标签。
3. 点击右下角的 `文件 / Files` 面板。
4. 点击 `选择文件 / Choose files`。
5. 一次选择多个文件。
6. 等待脚本逐个填入上传行。
7. 检查 Canvas 页面中显示的文件名。
8. 手动点击 Canvas 的提交按钮。

## 兼容性

脚本会匹配以下作业页路径：

```text
https://*/courses/*/assignments/*
http://*/courses/*/assignments/*
```

这意味着它不仅限于 `instructure.com` 域名，也能覆盖部分学校自托管或自定义域名的 Canvas 实例。

不过，Canvas 学校实例可能存在差异。以下情况可能不兼容：

- 学校使用新版或定制化作业提交界面。
- 学校禁用了经典 `Add Another File` 上传控件。
- 作业提交通过第三方 LTI 工具完成。
- 页面 DOM 被学校主题或插件大幅修改。

## 已知限制

- 脚本不能绕过浏览器安全限制，文件必须由用户主动通过文件选择器选择。
- 脚本不会也不应该自动提交作业。
- 如果 Canvas 页面只显示了一个文件名，请不要提交，说明当前页面结构没有被正确适配。

## 文件

- `canvas-multi-file-upload.user.js`：油猴用户脚本。

## 免责声明

请在提交前自行确认文件列表无误。这个脚本只是自动化 Canvas 页面上的文件选择流程，不保证适用于所有学校的 Canvas 实例，也不对错误提交、漏交或迟交负责。
