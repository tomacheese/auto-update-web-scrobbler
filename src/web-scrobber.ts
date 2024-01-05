import { ApiTrack } from './fyb'
import { Level } from 'level'
import lodash from 'lodash'
import { tmpdir } from 'node:os'
import fs from 'node:fs'
import { Logger } from '@book000/node-utils'

interface WebScrobberTrack {
  track: string
  artist: string | null
  album: string | null
  albumArtist: string | null
}

type WebScrobberTracks = {
  [vid: string]: WebScrobberTrack
}

export class WebScrobberExtension {
  private readonly readLevelDbPath: string
  private readonly writeLevelDbPath: string

  constructor(levelDatabasePath: string) {
    this.writeLevelDbPath = levelDatabasePath

    // ロックされているファイルを読み込むとエラーになるため、一時的にコピーして読み込む
    const temporaryDirectory = tmpdir()
    const temporaryLevelDatabase = `${temporaryDirectory}/auto-update-web-scrobber/level-db-${Date.now()}`
    this.readLevelDbPath = temporaryLevelDatabase

    this.copyReadLevelDatabase()
  }

  public async getTracks(): Promise<ApiTrack[]> {
    const database = await this.getLevelDatabase(this.readLevelDbPath)

    const tracks: WebScrobberTracks = await database.get('LocalCache')
    if (!tracks) {
      return []
    }

    return this.convertToApiTracks(tracks)
  }

  public async setTracks(tracks: ApiTrack[]): Promise<void> {
    const database = await this.getLevelDatabase(this.writeLevelDbPath)

    // eslint-disable-next-line unicorn/no-array-reduce
    const newTracks = tracks.reduce((accumulator, track) => {
      return {
        ...accumulator,
        [track.vid]: {
          track: track.track,
          artist: track.artist ?? null,
          album: track.album ?? null,
          albumArtist: track.albumArtist ?? null,
        },
      }
    }, {} as WebScrobberTracks)

    await database.put('LocalCache', newTracks)
    await database.close()

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
