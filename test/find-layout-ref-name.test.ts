import { expect, it } from 'vitest'
import { findLayoutRefName } from '../src/utils'

it.each([
  ['const layout = useUhUniLayoutRef()', 'layout'],
  ['import { useUhUniLayoutRef } from \'virtual:uni-layouts\'\nconst layout = useUhUniLayoutRef()', 'layout'],
  ['import { useUhUniLayoutRef as useLayout } from \'virtual:uni-layouts\'\nconst layout = useLayout()', 'layout'],
  ['import { useUhUniLayoutRef } from \'other-lib\'\nconst layout = useUhUniLayoutRef()', undefined],
  ['const uniLayout = ref()', 'uniLayout'],
  ['const uniLayout = shallowRef()', 'uniLayout'],
  // a page that still has the legacy declaration prefers the explicit marker
  ['const uniLayout = ref()\nconst layout = useUhUniLayoutRef()', 'layout'],
  ['const title = ref(\'hello\')', undefined],
  ['const layout = useTemplateRef(\'layout\')', undefined],
  ['const [layout] = useUhUniLayoutRef()', undefined],
  ['function init() {\n  const nested = useUhUniLayoutRef()\n}', undefined],
])('findLayoutRefName(%s)', (code, expected) => {
  expect(findLayoutRefName(code)).toBe(expected)
})
