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
    const res = await fetch(`${this.serverUrl}/api/tracks/`)
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
    const data = (await res.json()) as ApiGetTracksResponse
    return data
  }

  public async patchTrack(track: ApiTrack): Promise<void> {
    const res = await fetch(`${this.serverUrl}/api/tracks/${track.vid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    })
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
    if (res.status !== 204) {
      throw new Error('Failed to patch track')
    }
  }
}
