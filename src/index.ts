import { IAst, IContainer, IOptions, defaultOption } from './types.js'
import renderPaper from './renderPaper.js'
import { parse, Raphael } from 'regulex_common'

export default function render(container: HTMLElement, regText: string, options?: Partial<IOptions>): void {
  // 清空容器内内容
  container.innerHTML = ''

  if (!regText) return

  // 异常直接抛出，不进行 catch
  // 获取正则表达式解析出的 ast
  const ast: IAst = parse(new RegExp(regText).source)
  // 创建画布
  const paper: IContainer = Raphael(container, 0, 0)
  // 组合设置参数
  const currOption = { ...defaultOption, ...options }
  // 渲染画布
  renderPaper(ast, paper, currOption)
}
