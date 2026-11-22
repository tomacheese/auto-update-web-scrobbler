import { main } from './main'
import { Configuration } from './config'
import { ApiTrack, FetchYoutubeBgmApi } from './fyb'
import { WebScrobberExtension } from './web-scrobber'

jest.mock('./config', () => ({ Configuration: jest.fn() }))
jest.mock('./fyb')
jest.mock('./web-scrobber')
jest.mock('@book000/node-utils', () => ({
  Logger: {
    configure: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}))

const mockConfiguration = jest.mocked(Configuration)
const mockApi = jest.mocked(FetchYoutubeBgmApi)
const mockWebScrobberExtension = jest.mocked(WebScrobberExtension)

function configureMocks(): void {
  mockConfiguration.prototype.load = jest.fn()
  mockConfiguration.prototype.validate = jest.fn().mockReturnValue(true)
  mockConfiguration.prototype.get = jest.fn((key: string) => {
    return key === 'server'
      ? 'https://example.com'
      : { levelDbPath: ['/browser/db'] }
  }) as never
  mockConfiguration.prototype.getValidateFailures = jest
    .fn()
    .mockReturnValue([])
  mockApi.prototype.getTracks = jest.fn().mockResolvedValue([])
  mockApi.prototype.patchTrack = jest.fn().mockResolvedValue(undefined)
  mockWebScrobberExtension.prototype.getTracks = jest.fn().mockResolvedValue([])
  mockWebScrobberExtension.prototype.isWritable = jest
    .fn()
    .mockResolvedValue(true)
  mockWebScrobberExtension.prototype.setTracks = jest
    .fn()
    .mockResolvedValue(undefined)
  mockWebScrobberExtension.prototype.destroy = jest.fn()
}

const baseTrack: ApiTrack = {
  vid: 'shared',
  track: 'Title',
  artist: 'Artist',
  album: null,
  albumArtist: null,
}

function expectNothingWritten(): void {
  expect(mockWebScrobberExtension.prototype.setTracks.mock.calls).toHaveLength(
    0
  )
  expect(mockApi.prototype.patchTrack.mock.calls).toHaveLength(0)
}

beforeEach(() => {
  jest.clearAllMocks()
  process.exitCode = 0
  configureMocks()
})

afterAll(() => {
  process.exitCode = 0
})

test('sets a nonzero exit code when the server request fails', async () => {
  mockApi.prototype.getTracks = jest
    .fn()
    .mockRejectedValue(new Error('request failed'))

  await main()

  expect(process.exitCode).toBe(1)
  expectNothingWritten()
})

test('sets a nonzero exit code when reading the browser database fails', async () => {
  mockWebScrobberExtension.prototype.getTracks = jest
    .fn()
    .mockRejectedValue(new Error('database failed'))

  await main()

  expect(process.exitCode).toBe(1)
  expectNothingWritten()
})

test('writes the server track when both sides have the same vid', async () => {
  const serverTrack: ApiTrack = { ...baseTrack, track: 'Server Title' }
  const browserTrack: ApiTrack = { ...baseTrack, track: 'Browser Title' }
  mockApi.prototype.getTracks = jest.fn().mockResolvedValue([serverTrack])
  mockWebScrobberExtension.prototype.getTracks = jest
    .fn()
    .mockResolvedValue([browserTrack])

  await main()

  expect(mockWebScrobberExtension.prototype.setTracks.mock.calls).toEqual([
    [[serverTrack]],
  ])
  expect(mockApi.prototype.patchTrack.mock.calls).toHaveLength(0)
})

test('writes browser-only tracks after the server tracks and pushes them to the server', async () => {
  const serverTrack: ApiTrack = { ...baseTrack, vid: 'server-only' }
  const browserOnlyTrack: ApiTrack = { ...baseTrack, vid: 'browser-only' }
  mockApi.prototype.getTracks = jest.fn().mockResolvedValue([serverTrack])
  mockWebScrobberExtension.prototype.getTracks = jest
    .fn()
    .mockResolvedValue([browserOnlyTrack])

  await main()

  expect(mockWebScrobberExtension.prototype.setTracks.mock.calls).toEqual([
    [[serverTrack, browserOnlyTrack]],
  ])
  expect(mockApi.prototype.patchTrack.mock.calls).toEqual([[browserOnlyTrack]])
})

test('sets a nonzero exit code when the browser database cannot be opened for a non-lock reason', async () => {
  mockWebScrobberExtension.prototype.isWritable = jest
    .fn()
    .mockRejectedValue(new Error('open failed'))

  await main()

  expect(process.exitCode).toBe(1)
  expectNothingWritten()
})

test('keeps a locked browser database as a successful skipped update', async () => {
  mockWebScrobberExtension.prototype.isWritable = jest
    .fn()
    .mockResolvedValue(false)

  await main()

  expect(process.exitCode).toBe(0)
  expect(mockWebScrobberExtension.prototype.setTracks.mock.calls).toHaveLength(
    0
  )
})
