# 在线抽签转盘

一个功能丰富的在线随机选择工具，支持转盘、抽签筒、骰子三种模式。

## 功能特性

- **三种模式**：转盘模式、抽签筒模式、骰子模式
- **自定义选项**：支持 2~12 个选项，可自定义文字和颜色
- **转盘动画**：流畅的旋转动画，带减速效果
- **历史记录**：保存每次抽签结果，支持查看统计
- **方案管理**：保存多个转盘方案，快速切换
- **数据持久化**：所有数据保存在 localStorage

## 技术栈

- Vite + React 18 + TypeScript
- Canvas 绘制转盘
- localStorage 数据持久化
- 纯 CSS（内联于 index.html）

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```
