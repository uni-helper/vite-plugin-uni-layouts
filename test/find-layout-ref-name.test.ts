import { expect, it } from 'vitest'
import { findLayoutRefName } from '../src/utils'

it.each([
  ['const layout = useUniLayoutRef()', 'layout'],
  ['import { useUniLayoutRef } from \'virtual:uni-layouts\'\nconst layout = useUniLayoutRef()', 'layout'],
  ['import { useUniLayoutRef as useLayout } from \'virtual:uni-layouts\'\nconst layout = useLayout()', 'layout'],
  ['import { useUniLayoutRef } from \'other-lib\'\nconst layout = useUniLayoutRef()', undefined],
  ['const uniLayout = ref()', 'uniLayout'],
  ['const uniLayout = shallowRef()', 'uniLayout'],
  // a page that still has the legacy declaration prefers the explicit marker
  ['const uniLayout = ref()\nconst layout = useUniLayoutRef()', 'layout'],
  ['const title = ref(\'hello\')', undefined],
  ['const layout = useTemplateRef(\'layout\')', undefined],
  ['const [layout] = useUniLayoutRef()', undefined],
  ['function init() {\n  const nested = useUniLayoutRef()\n}', undefined],
])('findLayoutRefName(%s)', (code, expected) => {
  expect(findLayoutRefName(code)).toBe(expected)
})
