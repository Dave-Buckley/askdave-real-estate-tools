/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'ae.agentkit.app',
  productName: 'Agent Kit',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: ['out/**'],
  extraResources: [
    { from: 'build/icons/icon.ico', to: 'icons/icon.ico' },
    { from: 'build/icons/icon_16.png', to: 'icons/icon_16.png' },
    { from: 'build/icons/icon_32.png', to: 'icons/icon_32.png' },
  ],

  // Windows — NSIS per-user installer
  win: {
    target: ['nsis'],
    icon: 'build/icons/icon.ico',
    signAndEditExecutable: false, // Skip code signing (no certificate yet)
    // Code signing via environment variables (user must provide EV certificate)
    // certificateFile: process.env.WIN_CERT_FILE,
    // certificatePassword: process.env.WIN_CERT_PASSWORD,
  },
  nsis: {
    oneClick: false,          // Assisted install — shows options
    allowToChangeInstallationDirectory: false,
    perMachine: false,        // Per-user install — NO admin rights (APP-05)
    allowElevation: false,    // Do NOT prompt for admin
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    shortcutName: 'Agent Kit',
    runAfterFinish: true,     // Option to launch after install
    artifactName: 'AgentKit-Setup.${ext}', // Consistent filename across versions for stable download URLs
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

  // Auto-update: publish to GitHub Releases
  // TODO: Replace OWNER and REPO with your GitHub username and repository name
  // Set GH_TOKEN env var (GitHub Personal Access Token with repo scope) before running: npx electron-builder publish
  publish: {
    provider: 'github',
    owner: 'OWNER',        // placeholder — replace with your GitHub username
    repo: 'REPO',          // placeholder — replace with your repository name
    releaseType: 'draft',  // draft during development; change to 'release' for production
  },

  // Notarization hook (runs after signing)
  // afterSign: 'scripts/notarize.js',
}
