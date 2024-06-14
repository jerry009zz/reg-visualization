// 节点类型
export enum NODE_TYPES {
  EXACT_NODE   = 'exact',
  CHARSET_NODE = 'charset',
  CHOICE_NODE  = 'choice',
  GROUP_NODE   = 'group',
  ASSERT_NODE  = 'assert',
  DOT_NODE     = 'dot',
  BACKREF_NODE = 'backref',
  EMPTY_NODE   = 'empty',
  START_POINT  = 'startPoint',
  END_POINT    = 'endPoint',
}

// 节点辅助类型
export enum ASSERTION_TYPES {
  LOOK_AHEAD          = 'AssertLookahead',
  NEGATIVE_LOOK_AHEAD = 'AssertNegativeLookahead',
  NON_WORD_BOUNDARY   = 'AssertNonWordBoundary',
  WORD_BOUNDARY       = 'AssertWordBoundary',
  END                 = 'AssertEnd',
  BEGIN               = 'AssertBegin',
}

// 特殊字符转义 label
export const CHARSET_TEXT = {
  d: 'Digit',
  D: 'NonDigit',
  w: 'Word',
  W: 'NonWord',
  s: 'WhiteSpace',
  S: 'NonWhiteSpace'
}

// 配置对象类型
export interface IOptions {
  contentMargin   : number
  borderColor     : string
  borderWidth     : number
  borderRadius    : number
  groupBorderColor: string
  groupBorderWidth: number
  fontFamily      : string
  fontColor       : string
  fontSize        : number
  pathLen         : number
  padding         : number
  labelMargin     : number
  pointR          : number
}

// 生成的容器类型
export interface IContainer {
  canvas: SVGElement
  height: number
  width: number
  add(content: ISvgNode[]): void
  setSize(width: number, height: number): void
}

// 抽象语法树类型
export interface IAst {
  tree: TreeNode[]
}

// 上下文
export interface Context {
  ast: IAst,
  container: IContainer,
  options: IOptions,
  charSize: { width: number, height: number }
}

// 抽象语法树节点
export interface TreeNode {
  type: NODE_TYPES
  repeat ?: { min?: number, max?: number }
  num ?: number
  branches?: TreeNode[][]
  sub?: TreeNode[]
  chars ?: string
  classes ?: string[]
  exclude ?: boolean
  ranges ?: string[]
  assertionType?: ASSERTION_TYPES
}

// svg 节点
export interface ISvgNode extends Record<string, any> {

}

// 转换后的节点
export interface INode {
  items    : ISvgNode[],
  width    : number,
  height   : number,
  x        : number,
  y        : number,
  lineInX  : number,
  lineOutX : number,
  text    ?: ISvgNode,
  rect    ?: ISvgNode,
  r       ?: number,
  label   ?: ISvgNode
}

// 默认配置对象
export const defaultOption = {
  contentMargin: 10,
  borderColor: '#333',
  borderWidth: 2,
  borderRadius: 6,
  groupBorderColor: '#999',
  groupBorderWidth: 1,
  fontFamily: 'DejaVu Sans Mono,monospace',
  fontColor: '#444',
  fontSize: 14,
  pathLen: 16,
  padding: 12,
  labelMargin: 6,
  pointR: 6
}
