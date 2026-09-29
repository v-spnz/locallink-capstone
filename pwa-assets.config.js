import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

const publicAssetName = (type, size) => {
  if (type === 'maskable') {
    return '../../../public/pwa-maskable-512x512.png'
  }
  if (type === 'apple') {
    return '../../../public/apple-touch-icon.png'
  }
  return `../../../public/pwa-${size.width}x${size.height}.png`
}

export default defineConfig({
  logLevel: 'silent',
  manifestIconsEntry: false,
  preset: {
    ...minimal2023Preset,
    transparent: {
      sizes: [192, 512],
    },
    maskable: {
      sizes: [512],
      resizeOptions: {
        fit: 'contain',
        background: '#f8f9fa',
      },
    },
    apple: {
      sizes: [180],
      resizeOptions: {
        fit: 'contain',
        background: '#f8f9fa',
      },
    },
    assetName: publicAssetName,
  },
  images: ['src/assets/brand/locallink-wordmark-blue.svg'],
})
