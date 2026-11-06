export const virtualModuleId = 'virtual:uni-layouts'

/**
 * The page-side helper exported by the virtual module. Its types live in the
 * generated declaration file, so the two must change together.
 */
export const runtimeModuleCode = `export function useUhUniLayoutRef() {
  return shallowRef(null)
}
`
