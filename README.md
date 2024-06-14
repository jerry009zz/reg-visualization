
# reg-visualization
**reg-visualization** 一个前端项目使用的正则可视化工具

## Install

Get the latest version from NPM:

```sh
npm install reg-visualization
```

Also available with yarn:

```sh
yarn add reg-visualization
```

## Usage

### Usage as library

```js
import renderDom from 'reg-visualization';

const container = document.getElementById('container')

const reg = '^a(b|c)+[a-z]{1,}$'

renderDom(container, reg)


```
这将会在你的页面上渲染出正则的图形化规则

--------------------------------------------------------------

支持自定义一些样式规则的传入:

```js
import renderDom from 'reg-visualization';

const container = document.getElementById('container')

const reg = '^a(b|c)+[a-z]{1,}$'

const options = {
  contentMargin: 16,
  fontColor: "#666",
}

renderDom(container, reg, options)

```

options:

| key | 类型 | 默认值 | 描述 |
| --  |  -- |  --   |  --  |
| contentMargin    | number | 10  | 内容到容器间距 |
| borderColor      | string | #333  | 边框颜色 |
| borderWidth      | number | 2 | 形状节点的变框宽度 |
| borderRadius     | number | 6 | 形状节点的圆角半径 |
| groupBorderColor | string | #999 | 组边框的颜色 |
| groupBorderWidth | number | 1 | 组边框的宽度 |
| fontFamily       | string | 'DejaVu Sans Mono,monospace' | 默认字体 |
| fontColor        | string | #444 | 字体颜色 |
| fontSize         | number | 14 | 字体大小 |
| pathLen          | number | 16 | svg 形状节点间距 |
| padding          | number | 12 | svg 形状节点的内边距 |
| labelMargin      | number | 6 | 文本节点的外边距 |
| pointR           | number | 6 | 绘制圆点的半径 |
