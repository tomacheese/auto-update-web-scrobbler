import { ConfigFramework } from '@book000/node-utils'

export interface IConfiguration {
  /**
   * Base URL of the track server (tomacheese/fetch-youtube-bgm).
   *
   * Used to sync the server's tracks with the browser's tracks.
   *
   * See `src/fyb.ts` for the endpoints used.
   *
   * @example https://example.com
   */
  server: string

  /**
   * Browser settings.
   */
  browser: {
    /**
     * Paths of the LevelDB directories managed by the Web Scrobbler extension.
     */
    levelDbPath: string[]
  }
}

export class Configuration extends ConfigFramework<IConfiguration> {
  protected validates(): Record<string, (config: IConfiguration) => boolean> {
    return {
      'server is required': (config) => !!config.server,
      'server is string': (config) => typeof config.server === 'string',
      'browser is required': (config) => !!config.browser,
      'browser is object': (config) => typeof config.browser === 'object',
      'browser.levelDbPath is array': (config) =>
        Array.isArray(config.browser.levelDbPath),
      'browser.levelDbPath is not empty': (config) =>
        config.browser.levelDbPath.length > 0,
    }
  }
}
