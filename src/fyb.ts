// axios から fetch へ移行

export interface ApiTrack {
  vid: string
  track: string
  artist?: string | null
  album?: string | null
  albumArtist?: string | null
}

type ApiGetTracksResponse = ApiTrack[]

export class FetchYoutubeBgmApi {
  private readonly serverUrl: string

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }

  public async getTracks(): Promise<ApiTrack[]> {
    const url = `${this.serverUrl}/api/tracks/`
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(
        `HTTP error: ${res.status} ${res.statusText} (GET ${url})`
      )
    const data = (await res.json()) as ApiGetTracksResponse
    return data
  }

  public async patchTrack(track: ApiTrack): Promise<void> {
    const url = `${this.serverUrl}/api/tracks/${track.vid}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    })
    if (!res.ok)
      throw new Error(
        `HTTP error: ${res.status} ${res.statusText} (PATCH ${url})`
      )
    if (res.status !== 204) {
      throw new Error('Failed to patch track')
    }
  }
}
