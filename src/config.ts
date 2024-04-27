import { ConfigFramework } from '@book000/node-utils'

export interface IConfiguration {
  /**
   * トラック管理サーバ（tomacheese/fetch-youtube-bgm）設定
   *
   * サーバのトラック情報とブラウザのトラック情報を同期するための、エンドポイントを指定します。
   *
   * エンドポイント:
   * - GET `/api/tracks/`: すべてのトラック情報を取得
   * - PATCH `/api/tracks/{vid}`: 指定した動画のトラック情報を追加・更新
   *
   * @example http://example.com
   */
  server: string

  /**
   * ブラウザ設定
   */
  browser: {
    /**
     * 拡張機能「Web Scrobber」についての設定です。Web Scrobberが管理する LevelDB のパスを指定します。
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
