import { ApiTrack } from './fyb'
import { isApiTrack, isTrackMetadata } from './track-validation'
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

function isLockedError(error: unknown): boolean {
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause
  return cause?.code === 'LEVEL_LOCKED'
}

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
   * @throws If `LocalCache` or a track has an invalid shape
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
    if (!Object.values(tracks).every(isTrackMetadata)) {
      throw new Error(`Invalid track in LocalCache at ${this.writeLevelDbPath}`)
    }
    return this.convertToApiTracks(tracks as WebScrobberTracks)
  }

  public async setTracks(tracks: ApiTrack[]): Promise<void> {
    if (!tracks.every(isApiTrack)) {
      throw new Error('Invalid tracks supplied for LocalCache')
    }
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

  /**
   * Checks whether the write database can be opened.
   *
   * @returns `true` if it opens and closes, `false` only if it is locked by another handle (e.g. the browser is running)
   * @throws For every other open or close failure, so the caller does not mistake it for a lock
   */
  public async isWritable(): Promise<boolean> {
    let database: Level<string, any>
    try {
      database = await this.getLevelDatabase(this.writeLevelDbPath)
    } catch (error) {
      if (isLockedError(error)) {
        Logger.configure('isWritable').warn(
          '⚠️ Database is locked',
          error as Error
        )
        return false
      }
      throw error
    }
    await database.close()
    return true
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
