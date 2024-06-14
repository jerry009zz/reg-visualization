import ts from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/index.mjs', format: 'es' },
    { file: 'dist/index.cjs', format: 'cjs' },
  ],
  plugins: [
    ts({
      tsconfig: 'tsconfig.json', // 指定 tsconfig.json 文件的路径
      useTsconfigDeclarationDir: true, // 使用 tsconfig.json 中的 declarationDir 选项
    }),
  ]
}
