import { ApiTrack } from './fyb'

export function isTrackMetadata(
  value: unknown
): value is Omit<ApiTrack, 'vid'> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.track === 'string' &&
    ['artist', 'album', 'albumArtist'].every(
      (field) =>
        record[field] === undefined ||
        record[field] === null ||
        typeof record[field] === 'string'
    )
  )
}

export function isApiTrack(value: unknown): value is ApiTrack {
  return isTrackMetadata(value) && typeof (value as ApiTrack).vid === 'string'
}
