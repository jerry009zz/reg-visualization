/**
 * 子节点位置转换方法
 * @param items
 * @param dx
 * @param dy
 */
export const translateItems = (items: any[], dx: number, dy: number): void => {
  items.forEach(function (t) {
    if (t._translate) {
      t._translate(dx, dy)
    } else {
      t.x += dx; t.y += dy
    }
  })
}

/**
 * 判断是否是单一文本类型
 * @param node
 * @returns
 */
export function onlyCharClass(node: any): boolean {
  return !node?.chars && !node.ranges?.length && node.classes?.length === 1
}
