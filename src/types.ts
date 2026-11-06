export interface Options {
  /**
   * default layout
   * @default "default"
   */
  layout: string
  /**
   * layout dir
   * @default "src/layouts"
   */
  layoutDir: string
  /**
   * @default process.cwd()
   */
  cwd: string
  /**
   * Write the declaration file for `useUhUniLayoutRef` of `virtual:uni-layouts`.
   * A string is a path relative to `cwd`, `false` turns it off.
   * @default true, `uni-layouts.d.ts` next to pages.json
   */
  dts: boolean | string
}

export interface UserOptions extends Partial<Options> {}

export interface ResolvedOptions extends Omit<Options, 'dts'> {
  /** Absolute path, or `false` when the declaration is turned off. */
  dts: string | false
}

export interface Layout {
  name: string
  path: string
  pascalName: string
  kebabName: string
}

export interface Page {
  path: string
  layout?: string | false
}
