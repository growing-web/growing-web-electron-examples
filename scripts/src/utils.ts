import { getPackagesSync, Package } from '@manypkg/get-packages'
import path from 'node:path'

const { root, packages } = getPackagesSync('.')

export const rootDit = root.dir

export function resolveRoot(pathname: string) {
  return path.resolve(rootDit, pathname)
}

export function getApps() {
  let appPkgs: Package[] = []
  packages.forEach((item) => {
    if (item.packageJson.name.startsWith('@growing-web-examples/app-')) {
      appPkgs.push(item)
    }
  })
  return appPkgs
}
