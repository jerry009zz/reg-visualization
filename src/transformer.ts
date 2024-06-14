import { ASSERTION_TYPES, CHARSET_TEXT, ISvgNode, NODE_TYPES, type Context, type INode, type TreeNode } from './types.js';
import { onlyCharClass, translateItems } from './utils.js';


export default function transformer(ctx: Context, treeNodes: TreeNode[], x: number, y: number): INode {
  const { plotSvgNode, createNode } = createNodeUtils()
  const { options } = ctx
  const res: INode[] = []
  const items: ISvgNode[] = []
  let width = 0
  let height = 0
  let fromX = x
  let top = y
  let bottom = y
  const PATH_LEN = options.pathLen

  treeNodes.forEach((node: TreeNode) => {
    const element = createNode(ctx, node, fromX, y)
    res.push(element)
    fromX = fromX + element.width + PATH_LEN
    width += element.width
    top = Math.min(top, element.y)
    bottom = Math.max(bottom, element.y + element.height)
    items.push(...element.items)
  })

  height = bottom - top

  res.reduce((pre, curr) => {
    width += PATH_LEN
    const line = plotSvgNode.plotLine(ctx, { x: pre.lineOutX, y, destX: curr.lineInX })
    items.push(line)
    return curr
  })
  const lineInX = res[0].lineInX
  const lineOutX = res[res.length - 1].lineOutX

  return {
    items,
    width,
    height,
    x,
    y: top,
    lineInX,
    lineOutX
  }
}

function createNodeUtils() {

  function toPrint(str: string): string {
    const printEscapeMap = {
      "\n": "\\n",
      "\t": "\\t",
      "\f": "\\f",
      "\r": "\\r",
      " ": " ",
      "\\": "\\\\",
      "\0": "\\0"
    }
    const ctrl = /[\x00-\x1F\x7F-\x9F]/
    const unicode = /[\u009F-\uFFFF]/

    return str.split('').map((c: string) => {
      if (printEscapeMap.hasOwnProperty(c)) return printEscapeMap[c as keyof typeof printEscapeMap]
      if (unicode.test(c)) {
        return '\\u' + ('00' + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4)
      }
      if (ctrl.test(c)) {
        return '\\x' + ("0" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-2)
      }
      return c
    }).join('')
  }

  function elideOK(node: TreeNode | any[]): boolean {
    if (!node) return false
    if (Array.isArray(node)) {
      return node.every(item => elideOK(item))
    }
    if (node.type === NODE_TYPES.EMPTY_NODE) return true

    if (node.type === NODE_TYPES.GROUP_NODE && node.num === undefined) {
      return elideOK(node.sub!)
    }
    if (node.type === NODE_TYPES.CHOICE_NODE) {
      return elideOK(node.branches!)
    }
    return false
  }


  function createTextRect(ctx: Context, str: string, x: number, y: number): INode {
    const content = toPrint(str)
    const { charSize: { width, height }, options: { padding } } = ctx

    const h = height + padding + 4
    const w = content.length * width + padding * 3 + 4

    const rect = plotSvgNode.plotRect(ctx, { x, y: y - (h / 2), width: w, height: h })
    const text = plotSvgNode.plotText(ctx, { x: x + w / 2, y, text: content })

    return {
      text,
      rect,
      items: [rect, text],
      width: w,
      height: h,
      x: x,
      y: rect.y,
      r: 6,
      lineInX: x,
      lineOutX: x + w
    }
  }

  function createTextLabel(ctx: Context, str: string, x: number, y: number):INode {
    const charSize = ctx.charSize
    const lines = str.split('\n')
    const textHeight = lines.length * charSize.height
    const textWidth = Math.max(...lines.map(item => item.length)) * charSize.width
    var margin = 4
    var txt = {
      type: 'text',
      x: x, y: y - textHeight / 2 - margin,
      text: str,
      'font-size': ctx.options.fontSize,
      'font-family': ctx.options.fontFamily,
      fill: ctx.options.fontColor
    } as ISvgNode

    return {
      label: txt,
      x: x - textWidth / 2, y: y - textHeight - margin,
      width: textWidth, height: textHeight + margin,
      items: [],
      lineInX: x - textWidth / 2,
      lineOutX: x + textWidth / 2
    }
  }

  const plotSvgNode = {
    plotPoint(ctx: Context, { x, y }: { x: number, y: number }): ISvgNode {
      const { pointR: r, borderColor, borderWidth } = ctx.options
      return {
        type: 'circle',
        cx: x + r,
        cy: y,
        r: r,
        stroke: borderColor,
        'stroke-width': borderWidth,
        _translate: function (x: number, y: number): void {
          this.cx += x
          this.cy += y
        }
      }
    },

    // 绘制 line 节点
    plotLine(ctx: Context, { x, y, destX }: { x: number, y: number, destX: number }): ISvgNode {
      const { borderColor, borderWidth } = ctx.options
      return {
        type: 'path',
        x: x,
        y: y,
        path: ['M', x, y, 'H', destX],
        'stroke-linecap': 'butt',
        'stroke-linejoin': 'round',
        'stroke': borderColor,
        'stroke-width': borderWidth,
        _translate: function (x: number, y: number): void {
          var p = this.path
          p[1] += x; p[2] += y; p[4] += x
        }
      }
    },

    // 绘制文字节点
    plotText(ctx: Context, { x, y, text }: { x: number, y: number, text: string }): ISvgNode {
      const { fontSize, fontFamily, fontColor } = ctx.options
      return {
        type: 'text',
        x,
        y,
        text,
        'font-size': fontSize,
        'font-family': fontFamily,
        fill: fontColor
      }
    },

    // 绘制矩形节点
    plotRect(ctx: Context, { x, y, width, height }: { x: number, y: number, width: number, height: number }): ISvgNode {
      const { borderRadius, borderColor, borderWidth } = ctx.options
      return {
        type: 'rect',
        x,
        y,
        width,
        height,
        r: borderRadius,
        stroke: borderColor,
        'stroke-width': borderWidth
      }
    },

    // 绘制组
    plotGroup(ctx: Context, { x, y, width, height }: { x: number, y: number, width: number, height: number }): ISvgNode {
      const { borderRadius, groupBorderColor, groupBorderWidth } = ctx.options
      return {
        type: 'rect',
        x,
        y,
        r: borderRadius,
        width,
        height,
        'stroke-dasharray': '-',
        stroke: groupBorderColor,
        'stroke-width': groupBorderWidth
      }
    },

    // 绘制平滑曲线
    plotSmoothLine(ctx: Context, { fromX, fromY, toX, toY }: { fromX: number, fromY: number, toX: number, toY: number }): ISvgNode {
      const { borderColor, borderWidth } = ctx.options
      const radius = 10
      const signX = fromX > toX ? -1 : 1
      const signY = fromY > toY ? -1 : 1

      const isOut = Math.abs(fromY - toY) < radius * 1.5

      const path = isOut ? [
        'M', fromX, fromY,
        'C', fromX + Math.min(Math.abs(toX - fromX) / 2, radius) * signX, fromY, toX - (toX - fromX) / 2, toY, toX, toY
      ] : [
        'M', fromX, fromY,
        'Q', fromX + radius * signX, fromY, fromX + radius * signX, fromY + radius * signY,
        'V', Math.abs(fromY - toY) < radius * 2 ? fromY + radius * signY : (toY - radius * signY),
        'Q', fromX + radius * signX, toY, fromX + radius * signX * 2, toY,
        'H', toX
      ]

      return {
        type: 'path',
        path,
        'stroke-linecap': 'butt',
        'stroke-linejoin': 'round',
        'stroke': borderColor,
        'stroke-width': borderWidth,
        _translate: function (x: number, y: number): void {
          const p = this.path as unknown as number[]
          p[1] += x; p[2] += y; p[4] += x; p[5] += y; p[6] += x; p[7] += y; p[9] += y

          if (isOut) {
            p[8] += x
          } else {
            p[11] += x; p[12] += y; p[13] += x; p[14] += y; p[16] += x
          }
        }
      }
    }
  }

  const plotNode = {
    // 创建原点类型
    createPoint(ctx: Context, x: number, y: number): INode {
      const r = ctx.options.pointR
      return {
        items: [plotSvgNode.plotPoint(ctx, { x, y })],
        width: r * 2,
        height: r * 2,
        x: x,
        y: y,
        lineInX: x,
        lineOutX: x + r * 2
      }
    },
    // 创建空节点
    createEmpty(ctx: Context, x: number, y: number): INode {
      const len = 10
      return {
        items: [plotSvgNode.plotLine(ctx, { x, y, destX: x + len })],
        width: len,
        height: 2,
        x: x,
        y: y,
        lineInX: x,
        lineOutX: x + len
      }
    },
    createExact(ctx: Context, node: TreeNode, x: number, y: number): INode {
      return createTextRect(ctx, node.chars!, x, y)
    },

    createBackref(ctx: Context, node: TreeNode, x: number, y: number): INode {
      return createTextRect(ctx, `Backref #${node.num}`, x, y)
    },

    createDot(ctx: Context, x: number, y: number) {
      return createTextRect(ctx, `Any Character`, x, y)
    },

    createChoice(ctx: Context, node: TreeNode, x: number, y: number): INode {
      if (elideOK(node)) {
        return plotNode.createEmpty(ctx, x, y)
      }
      const marginX = 20
      const spacing = 6
      const paddingY = 4
      let height = 0
      let width = 0
      const branches: INode[] = node.branches!.map((branch: TreeNode[]) => {
        const ret = transformer(ctx, branch, x, y)
        height += ret.height
        width = Math.max(width, ret.width)
        return ret
      })

      height += (branches.length - 1) * spacing + paddingY * 2
      width += marginX * 2

      const centerX = x + width / 2
      let dy = y - height / 2 + paddingY
      const lineOutX = x + width
      const items: ISvgNode[] = []

      branches.forEach(branchNode => {
        const dx = centerX - branchNode.width / 2
        translateItems(branchNode.items, dx - branchNode.x, dy - branchNode.y)
        items.push(...branchNode.items)

        const lineY = y + dy - branchNode.y
        const p1 = plotSvgNode.plotSmoothLine(ctx, { fromX: x, fromY: y, toX: x + marginX, toY: lineY })
        const p2 = plotSvgNode.plotSmoothLine(ctx, { fromX: lineOutX, fromY: y, toX: x + width - marginX, toY: lineY })
        items.push(p1, p2)
        if (x + marginX !== dx - branchNode.x + branchNode.lineInX) {
          const line = plotSvgNode.plotLine(ctx, { x: x + marginX, y: lineY, destX: dx - branchNode.x + branchNode.lineInX })
          items.push(line)
        }
        if (branchNode.lineOutX + dx - branchNode.x !== x + width - marginX) {
          const line = plotSvgNode.plotLine(ctx, { x: branchNode.lineOutX + dx - branchNode.x, y: lineY, destX: x + width - marginX })
          items.push(line)
        }
        branchNode.x = dx
        branchNode.y = dy
        dy += branchNode.height + spacing
      })

      return {
        items,
        width,
        height,
        x,
        y: y - height / 2,
        lineInX: x,
        lineOutX
      }
    },

    createCharset(ctx: Context, node: TreeNode, x: number, y: number): INode {
      const { padding, labelMargin } = ctx.options
      const simple = onlyCharClass(node)

      if (simple) {
        const char = node.classes![0] as keyof typeof CHARSET_TEXT
        const word: string = CHARSET_TEXT[char]
        const res = createTextRect(ctx, word, x, y)
        if (!node.exclude) {
          return res
        }
        const tl = createTextLabel(ctx, 'None of:', res.x + res.width / 2, res.y)
        const items = res.items
        items.push(tl.label!)
        const oldWidth = res.width
        const width = Math.max(tl.width, oldWidth)
        const offsetX = (width - oldWidth) / 2
        translateItems(items, offsetX, 0)
        return {
          items,
          width,
          height: res.height - tl.height,
          x: Math.min(tl.x, res.x),
          y: tl.y,
          lineInX: offsetX + res.x,
          lineOutX: offsetX + res.x + res.width
        }
      }

      if (!node.chars && !node.ranges?.length && !node.classes?.length) {
        return createTextRect(ctx, 'AnyChar', x, y)
      }

      const packs = []
      let width = 0
      let height = 0

      if (node.chars) {
        const ret = createTextRect(ctx, node.chars, x, y)
        packs.push(ret)
        width = Math.max(ret.width, width)
      }

      node.ranges?.forEach((rg: string) => {
        rg = rg.split('').join('-')
        const ret = createTextRect(ctx, rg, x, y)
        packs.push(ret)
        width = Math.max(ret.width, width)
      })

      node.classes?.forEach((cls: string) => {
        const ret = createTextRect(ctx, CHARSET_TEXT[cls as keyof typeof CHARSET_TEXT], x, y)
        packs.push(ret)
        width = Math.max(ret.width, width)
      })

      const singleBoxHeight = packs[0].height

      const pack1: INode[] = []
      const pack2: INode[] = []
      packs.sort((a, b) => b.width - a.width)
      packs.forEach(item => {
        if (item.width * 2 + labelMargin > width) {
          pack1.push(item)
        } else {
          pack2.push(item)
        }
      })

      const resPack = pack1

      let a1
      let a2
      while (pack2.length) {
        a1 = pack2.pop()!
        a2 = pack2.pop()
        if (!a2) {
          resPack.push(a1)
          break
        }
        if (a1.width - a2.width > 2) {
          resPack.push(a1)
          pack2.push(a2)
          continue
        }
        translateItems(a2.items, a1.width + labelMargin, 0)
        resPack.push({
          items: a1.items.concat(a2.items),
          width: a1.width + a2.width + labelMargin,
          height: a1.height,
          x: a1.x,
          y: a1.y,
          lineInX: a1.x,
          lineOutX: a1.x
        })
        height -= a1.height
      }

      width += padding * 2
      height = (resPack.length - 1) * labelMargin + resPack.length * singleBoxHeight + padding * 2

      const rect = plotSvgNode.plotRect(ctx, { x, y: y - height / 2, width, height })
      let startY = rect.y + padding
      const items = [rect]

      resPack.forEach(item => {
        translateItems(item.items, x - item.x + (width - item.width) / 2, startY - item.y)
        items.push(...item.items)
        startY += item.height + labelMargin
      })
      const tl = createTextLabel(ctx, `${node.exclude ? 'None' : 'One'} of:`, rect.x + rect.width / 2, rect.y)
      items.push(tl.label!)
      const oldWidth = width
      width = Math.max(tl.width, width)
      const offsetX = (width - oldWidth) / 2 // ajust label text
      translateItems(items, offsetX, 0)

      return {
        items,
        width,
        height: height + tl.height,
        x: Math.min(tl.x, x),
        y: tl.y,
        lineInX: offsetX + x,
        lineOutX: offsetX + x + rect.width
      }
    },

    createGroup(ctx: Context, node: TreeNode, x: number, y: number): INode {
      if (elideOK(node)) {
        return plotNode.createEmpty(ctx, x, y)
      }
      const padding = 18
      const sub = transformer(ctx, node.sub!, x, y)
      if (node.num) {
        translateItems(sub.items, padding, 0)
        const rectW = sub.width + padding * 2
        const rectH = sub.height + padding * 2
        const rect = plotSvgNode.plotGroup(ctx, { x, y: sub.y - padding, width: rectW, height: rectH })
        const tl = createTextLabel(ctx, `Group #${node.num}`, rect.x + rect.width / 2, rect.y - ctx.options.borderWidth)
        const items = sub.items.concat([rect, tl.label])
        const width = Math.max(tl.width, rectW)
        const offsetX = (width - rectW) / 2
        if (offsetX) {
          translateItems(items, offsetX, 0)
        }
        return {
          items,
          width,
          height: rectH + tl.height + 4,
          x: x,
          y: tl.y,
          lineInX: offsetX + sub.lineInX + padding,
          lineOutX: offsetX + sub.lineOutX + padding
        }
      }
      return sub
    },

    createAssert(ctx: Context, node: TreeNode, x: number, y: number): INode {
      const padding = ctx.options.padding
      const nat = node.assertionType!
      let txt = nat.replace('Assert', '')

      if ([ASSERTION_TYPES.BEGIN, ASSERTION_TYPES.END].includes(nat)) {
        txt = `${txt} With`
      }
      if (nat === ASSERTION_TYPES.LOOK_AHEAD) {
        txt = 'Followed by:'
      }
      if (nat === ASSERTION_TYPES.NEGATIVE_LOOK_AHEAD) {
        txt = 'Not followed by:'
      }

      if ([ASSERTION_TYPES.NON_WORD_BOUNDARY, ASSERTION_TYPES.WORD_BOUNDARY, ASSERTION_TYPES.END, ASSERTION_TYPES.BEGIN].includes(nat)) {
        return createTextRect(ctx, txt, x, y)
      }

      const sub = plotNode.createGroup(ctx, node, x, y)
      const rectH = sub.height + padding * 2
      const rectW = sub.width + padding * 2
      const rect = plotSvgNode.plotRect(ctx, { x, y: sub.y - padding, width: rectW, height: rectH })
      const tl = createTextLabel(ctx, txt, rect.x + rectW / 2, rect.y)
      const width = Math.max(rectW, tl.width)
      const offsetX = (width - rectW) / 2
      const items = sub.items.concat([rect, tl.label])
      translateItems(items, offsetX, 0)
      return {
        items,
        width,
        height: rect.height + tl.height,
        x,
        y: tl.y,
        lineInX: offsetX + sub.lineInX + padding,
        lineOutX: offsetX + sub.lineOutX + padding
      }
    }
  }

  function createRepeatNode(ctx: Context, node: TreeNode, x: number, y: number): INode {
    if (elideOK(node)) {
      return plotNode.createEmpty(ctx, x, y)
    }
    // const LABEL_MARGIN = ctx.options.labelMargin
    const { options: { padding, labelMargin, groupBorderColor, borderWidth, borderColor } } = ctx
    const repeat = node.repeat!

    let txt = ''
    const items: ISvgNode[] = []
    if (repeat.min === repeat.max && repeat.min === 0) {
      return plotNode.createEmpty(ctx, x, y)
    }

    const ret = createSingleNode(ctx, node, x, y)
    let width = ret.width
    let height = ret.height

    // 处理提示文字信息
    if (repeat.min === repeat.max && repeat.min === 1) {
      return ret
    } else if (repeat.min === repeat.max) {
      txt += _plural(repeat.min!)
    } else {
      txt += repeat.min
      if (isFinite(repeat.max!)) {
        txt += (repeat.max! - repeat.min! > 1 ? ' to ' : ' or ') + _plural(repeat.max!)
      } else {
        txt += ' or more times'
      }
    }

    let offsetX = padding
    let offsetY = 0
    const r = padding

    let rectH = ret.y + ret.height - y
    const rectW = padding * 2 + ret.width
    width = rectW

    let p // repeat rect box path
    if (repeat.max !== 1) { // draw repeat rect box
      rectH += padding
      height += padding
      const path = [
        'M', ret.x + padding, y,
        'Q', x, y, x, y + r,
        'V', y + rectH - r,
        'Q', x, y + rectH, x + r, y + rectH,
        'H', x + rectW - r,
        'Q', x + rectW, y + rectH, x + rectW, y + rectH - r,
        'V', y + r,
        'Q', x + rectW, y, ret.x + ret.width + padding, y
      ]
      p = _createPath(path, groupBorderColor)
      items.push(p)
    } else { // so completely remove label when /a?/ but not /a??/
      txt = ''
    }

    let skipPath
    if (repeat.min === 0) {
      // draw a skip path
      const skipRectH = y - ret.y + padding
      const skipRectW = rectW + padding * 2
      offsetX += padding
      offsetY = -padding - 2
      width = skipRectW
      height += padding
      const path = [
        'M', x, y,
        'Q', x + r, y, x + r, y - r,
        'V', y - skipRectH + r,
        'Q', x + r, y - skipRectH, x + r * 2, y - skipRectH,
        'H', x + skipRectW - r * 2,
        'Q', x + skipRectW - r, y - skipRectH, x + skipRectW - r, y - skipRectH + r,
        'V', y - r,
        'Q', x + skipRectW - r, y, x + skipRectW, y
      ]
      skipPath = _createPath(path, borderColor)

      if (p) {
        translateItems([p], padding, 0)
      }
      items.push(skipPath)
    }

    // 创建 label
    if (txt) {
      var tl = createTextLabel(ctx, txt, x + width / 2, y)
      translateItems([tl.label], 0, rectH + tl.height + labelMargin)
      items.push(tl.label!)
      height += labelMargin + tl.height
      const labelOffsetX = (Math.max(tl.width, width) - width) / 2
      if (labelOffsetX) {
        translateItems(items, labelOffsetX, 0)
      }
      width = Math.max(tl.width, width)
      offsetX += labelOffsetX
    }

    translateItems(ret.items, offsetX, 0)
    items.push(...ret.items)

    return {
      items: items,
      width: width,
      height: height,
      x: x,
      y: ret.y + offsetY,
      lineInX: ret.lineInX + offsetX,
      lineOutX: ret.lineOutX + offsetX
    }

    function _createPath(path: any[], strokeColor: string): ISvgNode {
      return {
        type: 'path',
        path,
        stroke: strokeColor,
        'stroke-width': borderWidth,
        _translate: function (x: number, y: number) {
          const p = this.path
          p[1] += x; p[2] += y
          p[4] += x; p[5] += y; p[6] += x; p[7] += y
          p[9] += y
          p[11] += x; p[12] += y; p[13] += x; p[14] += y
          p[16] += x
          p[18] += x; p[19] += y; p[20] += x; p[21] += y
          p[23] += y
          p[25] += x; p[26] += y; p[27] += x; p[28] += y
        },
      }
    }

    function _plural(n: number) {
      return n + ((n < 2) ? ' time' : ' times')
    }

  }

  function createSingleNode(ctx: Context, node: TreeNode, x: number, y: number): INode {
    switch (node.type) {
      case 'startPoint':
      case 'endPoint':
        return plotNode.createPoint(ctx, x, y)
      case 'empty':
        return plotNode.createEmpty(ctx, x, y)
      case 'exact':
        return plotNode.createExact(ctx, node, x, y)
      case 'backref':
        return plotNode.createBackref(ctx, node, x, y)
      case 'dot':
        return plotNode.createDot(ctx, x, y)
      case 'choice':
        return plotNode.createChoice(ctx, node, x, y)
      case 'charset':
        return plotNode.createCharset(ctx, node, x, y)
      case 'group':
        return plotNode.createGroup(ctx, node, x, y)
      case 'assert':
        return plotNode.createAssert(ctx, node, x, y)
      default:
        throw Error('不支持的节点类型')
    }
  }

  function createNode(ctx: Context, node: TreeNode, x: number, y: number): INode {
    if (node.repeat) {
      return createRepeatNode(ctx, node, x, y)
    }
    return createSingleNode(ctx, node, x, y)
  }

  return {
    createNode,
    plotSvgNode
  }
}
