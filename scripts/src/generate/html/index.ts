import { resolve } from 'resolve.exports'
import { getApps, rootDit } from '../../utils'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import { minify } from 'html-minifier-terser'
import fs from 'fs-extra'

export function createRouteMap(importName: string, dir: string) {
  return {
    routes: [
      {
        path: `/${dir}/entry`,
        element: 'web-widget',
        attributes: {
          import: importName,
        },
      },
    ],
  }
}

export function createImportMap(packageJson, dir: string) {
  const entry = resolve(packageJson, '.') as string
  return {
    imports: {
      [packageJson.name]: join('/', dir, entry.replace(/^\./, '')),
      '@growing-web/bootstrap': join(
        '/',
        dir,
        'node_modules/@growing-web/bootstrap/dist/index.js',
      ),
    },
  }
}

export const transformFragment = (string, data) =>
  string.replace(
    /<fragment\s+name="([^"]+)"[^>]?>([\w\W]*?)<\/fragment>/g,
    (_, name, content) => {
      const value = data[name]
      const type = typeof value
      if (type === 'string') {
        return value
      } else if (type === 'function') {
        return value(content)
      }
      return ''
    },
  )

function generate() {
  const apps = getApps()

  Promise.all(
    apps.map(async (app) => {
      const __dirname = dirname(fileURLToPath(import.meta.url))
      const template = fs.readFileSync(`${__dirname}/template.html`, 'utf8')
      const dir = relative(`${rootDit}/apps`, app.dir)
      const html = transformFragment(template, {
        get importmap() {
          const importmap = createImportMap(app.packageJson, dir)
          return `
            <script type="importmap">${JSON.stringify(
              importmap,
              null,
              2,
            )}</script>
          `
        },
        get routemap() {
          const routemap = createRouteMap(app.packageJson.name, dir)
          return `
            <script type="routemap">${JSON.stringify(
              routemap,
              null,
              2,
            )}</script>
          `
        },
        get outlet() {
          return `
            <web-router></web-router>
          `
        },
        get entry() {
          const entry = '@growing-web/bootstrap'
          return `<script type="module">import ${JSON.stringify(
            entry,
          )}</script>`
        },
      })

      const minHtml = await minify(html, { collapseWhitespace: true })

      fs.writeFileSync(join(app.dir, './entry.html'), minHtml, 'utf8')
      console.log(`${app.packageJson.name}: dist/index.html is created!`)
    }),
  )
}
generate()
