/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'ae.agentkit.app',
  productName: 'Agent Kit',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: ['out/**'],

  // Windows — NSIS per-user installer
  win: {
    target: ['nsis'],
    icon: 'build/icons/icon.png',
    // Code signing via environment variables (user must provide EV certificate)
    // certificateFile: process.env.WIN_CERT_FILE,
    // certificatePassword: process.env.WIN_CERT_PASSWORD,
  },
  nsis: {
    oneClick: true,           // Silent install — no wizard
    perMachine: false,        // Per-user install — NO admin rights (APP-05)
    allowElevation: false,    // Do NOT prompt for admin
    createDesktopShortcut: false,
    createStartMenuShortcut: true,
    shortcutName: 'Agent Kit',
  },

  // macOS — DMG with hardened runtime
  mac: {
    target: ['dmg'],
    icon: 'build/icons/icon.png',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    category: 'public.app-category.productivity',
  },

  // Auto-update
  publish: {
    provider: 'github',
    // owner and repo auto-detected from package.json repository field
    // For private repos: set GH_TOKEN environment variable
  },

  // Notarization hook (runs after signing)
  afterSign: 'scripts/notarize.js',
}
