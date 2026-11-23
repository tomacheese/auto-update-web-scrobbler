import { FetchYoutubeBgmApi } from './fyb'

afterEach(() => jest.restoreAllMocks())

test.each([
  null,
  {},
  [null],
  [{ vid: 'id' }],
  [{ track: 'Title' }],
  [{ vid: 1, track: 'Title' }],
  ...['artist', 'album', 'albumArtist'].map((field) => [
    { vid: 'id', track: 'Title', [field]: 1 },
  ]),
])('rejects invalid server response %#', async (data) => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(data))

  await expect(
    new FetchYoutubeBgmApi('https://example.com').getTracks()
  ).rejects.toThrow('Invalid server tracks response')
})

test('accepts valid tracks with optional metadata', async () => {
  const tracks = [{ vid: 'id', track: 'Title', artist: null, album: 'Album' }]
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(tracks))

  await expect(
    new FetchYoutubeBgmApi('https://example.com').getTracks()
  ).resolves.toEqual(tracks)
})
