import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Level } from 'level'
import { ApiTrack } from './fyb'
import { WebScrobberExtension } from './web-scrobber'

const browserOnlyTrack: ApiTrack = {
  vid: 'browser-only',
  track: 'Browser Track',
  artist: 'Browser Artist',
  album: null,
  albumArtist: null,
}

const serverTrack: ApiTrack = {
  vid: 'server-only',
  track: 'Server Track',
  artist: 'Server Artist',
  album: 'Server Album',
  albumArtist: 'Server Album Artist',
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

describe('WebScrobberExtension', () => {
  let databasePath: string
  const extensions: WebScrobberExtension[] = []

  const createExtension = () => {
    const extension = new WebScrobberExtension(databasePath)
    extensions.push(extension)
    return extension
  }

  const seedDatabase = async (entries: Record<string, unknown>) => {
    const database = new Level<string, unknown>(databasePath, {
      valueEncoding: 'json',
    })
    await database.open()
    for (const [key, value] of Object.entries(entries)) {
      await database.put(key, value)
    }
    await database.close()
  }

  beforeEach(() => {
    databasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'web-scrobber-test-'))
  })

  afterEach(() => {
    for (const extension of extensions.splice(0)) {
      extension.destroy()
    }
    fs.rmSync(databasePath, { recursive: true, force: true })
  })

  it('returns the tracks stored in LocalCache', async () => {
    await seedDatabase({
      LocalCache: {
        [browserOnlyTrack.vid]: {
          track: browserOnlyTrack.track,
          artist: browserOnlyTrack.artist,
          album: browserOnlyTrack.album,
          albumArtist: browserOnlyTrack.albumArtist,
        },
      },
    })

    const tracks = await createExtension().getTracks()

    expect(tracks).toEqual([browserOnlyTrack])
  })

  it('returns an empty array when LocalCache does not exist', async () => {
    await seedDatabase({ Unrelated: { value: 1 } })

    const tracks = await createExtension().getTracks()

    expect(tracks).toEqual([])
  })

  it('throws instead of returning an empty array when LocalCache is not an object', async () => {
    await seedDatabase({ LocalCache: [] })

    const promise = createExtension().getTracks()

    await expect(promise).rejects.toThrow(
      `Invalid LocalCache value in ${databasePath}: expected an object but got array`
    )
  })

  it('keeps browser-only tracks when server tracks are written', async () => {
    await seedDatabase({
      LocalCache: {
        [browserOnlyTrack.vid]: {
          track: browserOnlyTrack.track,
          artist: browserOnlyTrack.artist,
          album: browserOnlyTrack.album,
          albumArtist: browserOnlyTrack.albumArtist,
        },
      },
    })
    const extension = createExtension()

    const browserTracks = await extension.getTracks()
    const mergedTracks = [
      serverTrack,
      ...browserTracks.filter((track) => track.vid !== serverTrack.vid),
    ]
    await extension.setTracks(mergedTracks)

    await sleep(2)
    const tracks = await createExtension().getTracks()
    expect(tracks).toEqual([serverTrack, browserOnlyTrack])
  })
})
