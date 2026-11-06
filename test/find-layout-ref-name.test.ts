import { expect, it } from 'vitest'
import { findLayoutRefName } from '../src/utils'

it.each([
  ['const layout = useLayoutRef()', 'layout'],
  ['import { useLayoutRef } from \'virtual:uni-layouts\'\nconst layout = useLayoutRef()', 'layout'],
  ['import { useLayoutRef as useLayout } from \'virtual:uni-layouts\'\nconst layout = useLayout()', 'layout'],
  ['import { useLayoutRef } from \'other-lib\'\nconst layout = useLayoutRef()', undefined],
  ['const uniLayout = ref()', 'uniLayout'],
  ['const uniLayout = shallowRef()', 'uniLayout'],
  // a page that still has the legacy declaration prefers the explicit marker
  ['const uniLayout = ref()\nconst layout = useLayoutRef()', 'layout'],
  ['const title = ref(\'hello\')', undefined],
  ['const layout = useTemplateRef(\'layout\')', undefined],
  ['const [layout] = useLayoutRef()', undefined],
  ['function init() {\n  const nested = useLayoutRef()\n}', undefined],
])('findLayoutRefName(%s)', (code, expected) => {
  expect(findLayoutRefName(code)).toBe(expected)
})
