import transformer from "./transformer.js";
import { IAst, IContainer, IOptions, ISvgNode, NODE_TYPES, type Context, type INode } from "./types.js";
import { translateItems } from "./utils.js";

export default function renderPaper(ast: IAst, container: IContainer, options: IOptions): void {
  const { createContext, setPaperSize, translateNodes, createNode } = renderUtils()

  // 生成上下文
  const ctx = createContext(ast, container, options)

  // 根据 ast 生成 根节点
  const node = createNode(ctx)

  // 根据内容设置元素的宽高
  setPaperSize(ctx, node)

  // 将 根节点中的 items 转换后添加到容器中进行渲染
  const childNode = translateNodes(ctx, node)
  container.add(childNode)
}

function renderUtils () {
  // 创建上下文
  function createContext(ast: any, container: any, options: IOptions): Context {
    return {
      ast,
      container,
      options,
      charSize: getCharSize(container, options)
    }
  }

  // 根据设置的字体和字号，计算平均 字宽和字高
  function getCharSize(container: any, options: IOptions) {
    const { fontFamily, fontSize, fontColor } = options
    const text = container.text(-1000, -1000, 'XgfTlM|.q\nXgfTlM|.q').attr({
      'font-family': fontFamily,
      'font-size': fontSize,
      'font-color': fontColor
    })
    const box = text.getBBox()
    return {
      width: box.width / ((text.attr('text').length - 1) / 2),
      height: box.height / 2
    }
  }

  // 设置容器的宽高
  function setPaperSize(ctx: Context, node: INode): void {
    const { options: { contentMargin }, charSize: { height: charSizeHeight }, container } = ctx
    const { height: nodeHeight, width: nodeWidth } = node
    const height = nodeHeight + 3 * contentMargin + charSizeHeight
    const width = nodeWidth + 2 * contentMargin
    container.setSize(width, height)
  }

  function translateNodes(ctx: Context, node: INode): ISvgNode[] {
    const { options: { contentMargin }, charSize: { height: charSizeHeight } } = ctx
    const { y: retY, items: retItems } = node
    const dx = contentMargin
    const dy = contentMargin * 2 + charSizeHeight - retY
    translateItems(retItems, dx, dy)
    return retItems
  }

  function createNode(ctx: Context): INode {
    const tree = ctx.ast.tree
    tree.unshift({ type: NODE_TYPES.START_POINT })
    tree.push({ type: NODE_TYPES.END_POINT })
    return transformer(ctx, tree, 0, 0)
  }

  return {
    createContext,
    setPaperSize,
    translateNodes,
    createNode,
  }
}
