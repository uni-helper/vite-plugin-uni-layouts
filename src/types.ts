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
   * layout dir
   * @default "src/pages.json"
   */
  pagesJsonPath: string
  /**
   * @default process.cwd()
   */
  cwd: string
}

export interface UserOptions extends Partial<Options> {}

export interface ResolvedOptions extends Options {}

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
