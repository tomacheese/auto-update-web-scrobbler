import { Logger } from '@book000/node-utils'
import { Configuration } from './config'
import { ApiTrack, FetchYoutubeBgmApi } from './fyb'
import { WebScrobberExtension } from './web-scrobber'

/**
 * 設定を読み込む
 *
 * @returns 設定。設定が不正な場合は `null` を返す
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

/**
 * サーバからトラック情報を取得する
 *
 * @param server サーバのURL
 * @returns トラック情報
 */
async function getServerTracks(server: string): Promise<ApiTrack[]> {
  const logger = Logger.configure('getServerTracks')
  logger.info('🔍 Get tracks from server')
  const fyb = new FetchYoutubeBgmApi(server)
  const serverTracks = await fyb.getTracks()
  logger.info(`🔍 Got ${serverTracks.length} tracks from server`)
  return serverTracks
}

/**
 * ブラウザからトラック情報を取得する
 *
 * @param levelDatabasePaths ブラウザの LevelDB のパス
 * @returns トラック情報
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

  // 重複を削除
  const vidSet = new Set<string>()
  const uniqueBrowserTracks: ApiTrack[] = []
  for (const track of browserTracks) {
    if (!vidSet.has(track.vid)) {
      vidSet.add(track.vid)
      uniqueBrowserTracks.push(track)
    }
  }

  logger.info(`🔍 Got ${uniqueBrowserTracks.length} tracks from browser(s)`)
  return uniqueBrowserTracks
}

/**
 * トラック情報をマージする
 *
 * @param serverTracks サーバから取得したトラック情報
 * @param browserTracks ブラウザから取得したトラック情報
 * @returns マージされたトラック情報
 */
function mergeTracks(
  serverTracks: ApiTrack[],
  browserTracks: ApiTrack[]
): ApiTrack[] {
  const logger = Logger.configure('mergeTracks')
  logger.info('🔀 Merge tracks')
  const mergedTracks: ApiTrack[] = []

  // サーバのトラック情報を優先
  // サーバにないトラック情報はブラウザから取得したものを使用する
  const vidSet = new Set<string>()
  for (const track of serverTracks) {
    if (!vidSet.has(track.vid)) {
      vidSet.add(track.vid)
      mergedTracks.push(track)
    }
  }

  for (const track of browserTracks) {
    if (!vidSet.has(track.vid)) {
      vidSet.add(track.vid)
      mergedTracks.push(track)
    }
  }

  logger.info(`🔀 Merged ${mergedTracks.length} tracks`)
  return mergedTracks
}

/**
 * ブラウザのトラック情報を更新する。
 *
 * LevelDB はロックされていると書き込みができない。書き込みできない場合はスキップする。
 *
 * @param levelDatabasePaths ブラウザの LevelDB のパス
 * @param mergedTracks マージされたトラック情報
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
 * サーバのトラック情報を更新する
 *
 * @param fyb FetchYoutubeBgmApi
 * @param mergedTracks マージされたトラック情報
 * @param serverTracks サーバから取得したトラック情報
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
    // サーバにトラックが存在しない場合、または各フィールドが異なる場合は更新対象
    if (!serverTrack) {
      return true
    }
    return (
      serverTrack.track !== track.track ||
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

/**
 * メイン処理
 */
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

    // Get tracks from server & browser
    const serverTracks = await getServerTracks(server)
    const browserTracks = await getBrowserTracks(levelDatabasePaths)

    // Merge tracks
    const mergedTracks = mergeTracks(serverTracks, browserTracks)

    // Update browser
    await updateBrowser(levelDatabasePaths, mergedTracks)

    // Update server
    await updateServer(
      new FetchYoutubeBgmApi(server),
      mergedTracks,
      serverTracks
    )

    logger.info('✅ Done')
  } catch (err) {
    logger.error('❌ Failed to update', err as Error)
  }
}

;(async () => {
  await main()
})()
