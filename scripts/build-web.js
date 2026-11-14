// The web build of every deploy (vercel.json, via `npm run build:web`; docs/previews.md). Vercel
// refuses env var names containing PUBLIC, so the owner registers API_URL and CLERK_PUBLISHABLE_KEY
// there, and this maps them to the EXPO_PUBLIC_* names Expo inlines before `expo export`.
// `--check` only validates (the EAS Update workflow uses it), without building.
const { spawnSync } = require('node:child_process')

const REQUIRED_VARS = ['API_URL', 'CLERK_PUBLISHABLE_KEY']

/**
 * The env for `expo export`: `env` plus EXPO_PUBLIC_API_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
 * Throws when either is missing, the URL isn't http(s), or the key isn't a publishable one. The key
 * must come from the same Clerk instance as the events-api's CLERK_SECRET_KEY, or every sign-in
 * gets a 401. A Vercel preview deploy (a PR) missing either one
 * builds the Demo build instead, over the mock: the deploy that matters is production.
 */
function webBuildEnv(env) {
  const missing = REQUIRED_VARS.filter((name) => !env[name]?.trim())
  if (missing.length > 0 && env.VERCEL_ENV === 'preview') {
    return { ...env, EXPO_PUBLIC_DEMO_BUILD: 'true' }
  }
  if (missing.length > 0) {
    throw new Error(`${missing.join(', ')} not set: see docs/previews.md.`)
  }
  // Taken as is, not trimmed: the EAS workflow passes the raw values to `eas update`.
  const apiUrl = env.API_URL
  const key = env.CLERK_PUBLISHABLE_KEY
  if (!/^https?:\/\/\S+$/.test(apiUrl)) {
    throw new Error(`API_URL must be an http(s) URL, got "${apiUrl}".`)
  }
  if (!/^pk_(test|live)_\S+$/.test(key)) {
    throw new Error(
      'CLERK_PUBLISHABLE_KEY must be a Clerk publishable key (pk_test_ or pk_live_), never a secret one.',
    )
  }
  return { ...env, EXPO_PUBLIC_API_URL: apiUrl, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: key }
}

function main() {
  let env
  try {
    env = webBuildEnv(process.env)
  } catch (error) {
    console.error(`build-web: ${error.message}`)
    return 1
  }
  if (env.EXPO_PUBLIC_DEMO_BUILD === 'true') {
    console.log(
      'build-web: Vercel preview without API_URL/CLERK_PUBLISHABLE_KEY, building the Demo build.',
    )
  }
  if (process.argv.includes('--check')) {
    console.log('build-web: API_URL and CLERK_PUBLISHABLE_KEY are valid.')
    return 0
  }
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'web'], {
    stdio: 'inherit',
    env,
  })
  if (result.error) console.error(`build-web: could not run expo export: ${result.error.message}`)
  return result.status ?? 1
}

if (require.main === module) process.exit(main())

module.exports = { webBuildEnv }
