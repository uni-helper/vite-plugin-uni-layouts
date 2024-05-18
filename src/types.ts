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
}

export interface UserOptions extends Partial<Options> {}

export interface ResolvedOptions extends Options {
  teleportRootEl: string // teleport到layout外，根节点下的元素
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
