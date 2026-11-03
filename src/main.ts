import { Logger } from '@book000/node-utils'
import { Configuration } from './config'
import { ApiTrack, FetchYoutubeBgmApi } from './fyb'
import { WebScrobberExtension } from './web-scrobber'

/**
 * Loads and validates `data/config.json`.
 *
 * @returns The configuration, or `null` if it is invalid (sets `process.exitCode` to 1)
 */
function loadConfiguration(): Configuration | null {
  const logger = Logger.configure('loadConfiguration')
  logger.info('🔄 Loading configuration')
  const config = new Configuration('data/config.json')
  config.load()
  if (!config.validate()) {
    logger.error('❌ Configuration is invalid')
    logger.error(
      `💡 Missing check(s): ${config.getValidateFailures().join(', ')}`
    )
    process.exitCode = 1
    return null
  }
  return config
}

async function getServerTracks(server: string): Promise<ApiTrack[]> {
  const logger = Logger.configure('getServerTracks')
  logger.info('🔍 Get tracks from server')
  const fyb = new FetchYoutubeBgmApi(server)
  const serverTracks = await fyb.getTracks()
  logger.info(`🔍 Got ${serverTracks.length} tracks from server`)
  return serverTracks
}

/**
 * Reads the tracks from the browser LevelDB directories.
 *
 * @returns Tracks de-duplicated by `vid` (the first occurrence wins)
 */
async function getBrowserTracks(
  levelDatabasePaths: string[]
): Promise<ApiTrack[]> {
  const logger = Logger.configure('getBrowserTracks')
  logger.info('🔍 Get tracks from browser(s)')
  const browserTracks: ApiTrack[] = []
  for (const levelDatabasePath of levelDatabasePaths) {
    const extension = new WebScrobberExtension(levelDatabasePath)
    const tracks = await extension.getTracks()
    logger.info(
      `👀 Got ${tracks.length} tracks from browser: ${levelDatabasePath}`
    )
    browserTracks.push(...tracks)
  }

  const vidSet = new Set<string>()
  const uniqueBrowserTracks: ApiTrack[] = []
  for (const track of browserTracks) {
    if (vidSet.has(track.vid)) {
      continue
    }

    vidSet.add(track.vid)
    uniqueBrowserTracks.push(track)
  }

  logger.info(`🔍 Got ${uniqueBrowserTracks.length} tracks from browser(s)`)
  return uniqueBrowserTracks
}

/**
 * Merges server and browser tracks by `vid`.
 *
 * @param serverTracks Tracks from the server (take precedence)
 * @param browserTracks Tracks from the browser (used only for `vid`s missing on the server)
 */
function mergeTracks(
  serverTracks: ApiTrack[],
  browserTracks: ApiTrack[]
): ApiTrack[] {
  const logger = Logger.configure('mergeTracks')
  logger.info('🔀 Merge tracks')
  const mergedTracks: ApiTrack[] = []

  const vidSet = new Set<string>()
  for (const track of serverTracks) {
    if (vidSet.has(track.vid)) {
      continue
    }

    vidSet.add(track.vid)
    mergedTracks.push(track)
  }

  for (const track of browserTracks) {
    if (vidSet.has(track.vid)) {
      continue
    }

    vidSet.add(track.vid)
    mergedTracks.push(track)
  }

  logger.info(`🔀 Merged ${mergedTracks.length} tracks`)
  return mergedTracks
}

/**
 * Writes the merged tracks to each browser LevelDB.
 *
 * A LevelDB that is locked (e.g. the browser is running) cannot be written, so it is skipped.
 *
 */
async function updateBrowser(
  levelDatabasePaths: string[],
  mergedTracks: ApiTrack[]
): Promise<void> {
  const logger = Logger.configure('updateBrowser')
  for (const levelDatabasePath of levelDatabasePaths) {
    logger.info(`🔄 Updating browser: ${levelDatabasePath}`)
    const extension = new WebScrobberExtension(levelDatabasePath)
    if (!(await extension.isWritable())) {
      logger.warn(`🔄 LevelDB is not writable. Skip: ${levelDatabasePath}`)
      continue
    }

    await extension.setTracks(mergedTracks)

    extension.destroy()
  }
}

/**
 * Pushes new or changed tracks to the server.
 */
async function updateServer(
  fyb: FetchYoutubeBgmApi,
  mergedTracks: ApiTrack[],
  serverTracks: ApiTrack[]
): Promise<void> {
  const logger = Logger.configure('updateServer')
  logger.info('🆙 Updating server')
  const diffTracks = mergedTracks.filter((track) => {
    const serverTrack = serverTracks.find((t) => t.vid === track.vid)
    return (
      serverTrack?.track !== track.track ||
      serverTrack.artist !== track.artist ||
      serverTrack.album !== track.album ||
      serverTrack.albumArtist !== track.albumArtist
    )
  })
  logger.info(`🆙 Update ${diffTracks.length} tracks`)
  for (const track of diffTracks) {
    logger.info(`🆙 Update track: ${track.vid}`)
    await fyb.patchTrack(track)
  }
}

async function main() {
  const logger = Logger.configure('main')

  logger.info('🔄 Start')
  try {
    const config = loadConfiguration()
    if (!config) {
      return
    }

    const server = config.get('server')
    const levelDatabasePaths = config.get('browser').levelDbPath

    const serverTracks = await getServerTracks(server)
    const browserTracks = await getBrowserTracks(levelDatabasePaths)

    const mergedTracks = mergeTracks(serverTracks, browserTracks)

    await updateBrowser(levelDatabasePaths, mergedTracks)

    await updateServer(
      new FetchYoutubeBgmApi(server),
      mergedTracks,
      serverTracks
    )

    logger.info('✅ Done')
  } catch (error) {
    logger.error('❌ Failed to update', error as Error)
  }
}

;(async () => {
  await main()
})()
