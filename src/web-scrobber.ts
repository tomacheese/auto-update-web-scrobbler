import { ApiTrack } from './fyb'
import { Level } from 'level'
import lodash from 'lodash'
import { tmpdir } from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { Logger } from '@book000/node-utils'

interface WebScrobberTrack {
  track: string
  artist: string | null
  album: string | null
  albumArtist: string | null
}

type WebScrobberTracks = Record<string, WebScrobberTrack>

export class WebScrobberExtension {
  private readonly readLevelDbPath: string
  private readonly writeLevelDbPath: string

  constructor(levelDatabasePath: string) {
    this.writeLevelDbPath = levelDatabasePath

    this.readLevelDbPath = fs.mkdtempSync(
      path.join(tmpdir(), 'auto-update-web-scrobber-')
    )
    try {
      this.copyReadLevelDatabase()
    } catch (error) {
      this.destroy()
      throw error
    }
  }

  /**
   * Reads the tracks stored under `LocalCache`.
   *
   * @returns The tracks, or an empty array if `LocalCache` does not exist yet
   * @throws If `LocalCache` is not an object, so the caller never overwrites a corrupted cache
   */
  public async getTracks(): Promise<ApiTrack[]> {
    const database = await this.getLevelDatabase(this.readLevelDbPath)

    let tracks: unknown
    try {
      tracks = await database.get('LocalCache')
    } catch (error) {
      await database.close().catch((closeError: unknown) => {
        Logger.configure('getTracks').warn(
          '⚠️ Failed to close database',
          closeError as Error
        )
      })
      throw error
    }
    await database.close()

    if (tracks === undefined) {
      return []
    }
    if (
      typeof tracks !== 'object' ||
      tracks === null ||
      Array.isArray(tracks)
    ) {
      throw new Error(
        `Invalid LocalCache value in ${this.writeLevelDbPath}: expected an object but got ${this.describeType(tracks)}`
      )
    }
    return this.convertToApiTracks(tracks as WebScrobberTracks)
  }

  public async setTracks(tracks: ApiTrack[]): Promise<void> {
    const database = await this.getLevelDatabase(this.writeLevelDbPath)

    try {
      const newTracks = tracks.reduce<WebScrobberTracks>(
        (accumulator, track) => {
          return {
            ...accumulator,
            [track.vid]: {
              track: track.track,
              artist: track.artist ?? null,
              album: track.album ?? null,
              albumArtist: track.albumArtist ?? null,
            },
          }
        },
        {}
      )

      await database.put('LocalCache', newTracks)
    } finally {
      await database.close()
    }

    this.copyReadLevelDatabase()
  }

  public async isWritable(): Promise<Promise<boolean>> {
    const logger = Logger.configure('isWritable')
    try {
      const database = await this.getLevelDatabase(this.writeLevelDbPath)
      await database.close()
      return true
    } catch (error) {
      logger.error('Failed to open database', error as Error)
      return false
    }
  }

  public destroy(): void {
    if (!fs.existsSync(this.readLevelDbPath)) {
      return
    }
    fs.rmSync(this.readLevelDbPath, { recursive: true })
  }

  private async getLevelDatabase(path: string) {
    const database = new Level<string, any>(path, {
      valueEncoding: 'json',
    })
    await database.open()
    return database
  }

  private describeType(value: unknown): string {
    if (value === null) {
      return 'null'
    }
    return Array.isArray(value) ? 'array' : typeof value
  }

  private convertToApiTracks(track: WebScrobberTracks): ApiTrack[] {
    return lodash.map(track, (value, key) => {
      return {
        vid: key,
        track: value.track,
        artist: value.artist,
        album: value.album,
        albumArtist: value.albumArtist,
      }
    })
  }

  private copyReadLevelDatabase(): void {
    fs.cpSync(this.writeLevelDbPath, this.readLevelDbPath, { recursive: true })

    fs.unlinkSync(`${this.readLevelDbPath}/LOCK`)
  }
}
