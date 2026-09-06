import path from 'node:path'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'

const ICON_PATH = path.resolve('assets/icon')
const LINUX_ICON_PATH = `${ICON_PATH}.png`

const packagerIcon =
  process.platform === 'darwin'
    ? [`${ICON_PATH}.icns`, `${ICON_PATH}.icon`]
    : ICON_PATH

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: packagerIcon,
    // Migrations are read from disk at startup, so they can't live inside the asar.
    extraResource: ['drizzle', LINUX_ICON_PATH],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({ setupIcon: `${ICON_PATH}.ico` }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({ options: { icon: LINUX_ICON_PATH } }),
    new MakerDeb({ options: { icon: LINUX_ICON_PATH } }),
  ],
  plugins: [
    // better-sqlite3 ships .node binaries, which can't be loaded from inside the asar.
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
