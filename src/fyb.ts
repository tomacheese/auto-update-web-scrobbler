import axios from 'axios'

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
    const response = await axios.get<ApiGetTracksResponse>(
      `${this.serverUrl}/api/tracks/`
    )
    return response.data
  }

  public async patchTrack(track: ApiTrack): Promise<void> {
    const response = await axios.patch(
      `${this.serverUrl}/api/tracks/${track.vid}`,
      track
    )

    if (response.status !== 204) {
      throw new Error('Failed to patch track')
    }
  }
}
