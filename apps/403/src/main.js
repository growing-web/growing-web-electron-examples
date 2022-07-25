import { createLayout } from '@growing-web-examples/basic-layout'

const layout = createLayout()

layout.setSlot('main', () => {
  return {
    mount({ container }) {
      container.innerHTML = '403'
    },
    unmount({ container }) {
      container.innerHTML = ''
    },
  }
})

export default layout.getLifeCycle()
