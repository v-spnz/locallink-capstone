const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm)(?:$|[?#])/i

export function isVideoUrl(url = '') {
  return VIDEO_FILE_PATTERN.test(url)
}

export function getLeadMedia(imageUrls = []) {
  return imageUrls
    .filter((url) => typeof url === 'string' && url.trim())
    .slice(0, 20)
    .map((url) => ({ url, type: isVideoUrl(url) ? 'video' : 'image' }))
}
