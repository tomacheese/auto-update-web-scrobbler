import { main } from './main'
import { Configuration } from './config'
import { FetchYoutubeBgmApi } from './fyb'
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
})

test('sets a nonzero exit code when reading the browser database fails', async () => {
  mockWebScrobberExtension.prototype.getTracks = jest
    .fn()
    .mockRejectedValue(new Error('database failed'))

  await main()

  expect(process.exitCode).toBe(1)
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
