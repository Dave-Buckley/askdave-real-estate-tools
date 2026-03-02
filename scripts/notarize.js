// This script runs automatically after code signing on macOS
// Requires: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID env vars
// Uses @electron/notarize with notarytool backend (NOT altool — deprecated)
//
// To set up:
// 1. npm install -D @electron/notarize (already installed)
// 2. Set APPLE_ID to your Apple Developer email
// 3. Generate app-specific password at appleid.apple.com
// 4. Set APPLE_TEAM_ID to your 10-character team ID

const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  // Skip notarization if credentials not configured
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Skipping notarization — APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD not set')
    return
  }

  const appName = context.packager.appInfo.productFilename
  console.log(`Notarizing ${appName}...`)

  await notarize({
    appBundleId: 'ae.agentkit.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
    tool: 'notarytool', // NOT altool — deprecated
  })

  console.log('Notarization complete')
}
