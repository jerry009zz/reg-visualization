export declare enum NODE_TYPES {
    EXACT_NODE = "exact",
    CHARSET_NODE = "charset",
    CHOICE_NODE = "choice",
    GROUP_NODE = "group",
    ASSERT_NODE = "assert",
    DOT_NODE = "dot",
    BACKREF_NODE = "backref",
    EMPTY_NODE = "empty",
    START_POINT = "startPoint",
    END_POINT = "endPoint"
}
export declare enum ASSERTION_TYPES {
    LOOK_AHEAD = "AssertLookahead",
    NEGATIVE_LOOK_AHEAD = "AssertNegativeLookahead",
    NON_WORD_BOUNDARY = "AssertNonWordBoundary",
    WORD_BOUNDARY = "AssertWordBoundary",
    END = "AssertEnd",
    BEGIN = "AssertBegin"
}
export declare const CHARSET_TEXT: {
    d: string;
    D: string;
    w: string;
    W: string;
    s: string;
    S: string;
};
export interface IOptions {
    contentMargin: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    groupBorderColor: string;
    groupBorderWidth: number;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    pathLen: number;
    padding: number;
    labelMargin: number;
    pointR: number;
}
export interface IContainer {
    canvas: SVGElement;
    height: number;
    width: number;
    add(content: ISvgNode[]): void;
    setSize(width: number, height: number): void;
}
export interface IAst {
    tree: TreeNode[];
}
export interface Context {
    ast: IAst;
    container: IContainer;
    options: IOptions;
    charSize: {
        width: number;
        height: number;
    };
}
export interface TreeNode {
    type: NODE_TYPES;
    repeat?: {
        min?: number;
        max?: number;
    };
    num?: number;
    branches?: TreeNode[][];
    sub?: TreeNode[];
    chars?: string;
    classes?: string[];
    exclude?: boolean;
    ranges?: string[];
    assertionType?: ASSERTION_TYPES;
}
export interface ISvgNode extends Record<string, any> {
}
export interface INode {
    items: ISvgNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    lineInX: number;
    lineOutX: number;
    text?: ISvgNode;
    rect?: ISvgNode;
    r?: number;
    label?: ISvgNode;
}
export declare const defaultOption: {
    contentMargin: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    groupBorderColor: string;
    groupBorderWidth: number;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    pathLen: number;
    padding: number;
    labelMargin: number;
    pointR: number;
};
