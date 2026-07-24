import { cp, mkdir, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const packageEntry = require.resolve('@mediapipe/tasks-vision')
const packageRoot = dirname(packageEntry)
const publicRoot = resolve('public', 'mediapipe')
const wasmTarget = join(publicRoot, 'wasm')
const modelTarget = join(publicRoot, 'models', 'pose_landmarker_lite.task')
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

await mkdir(wasmTarget, { recursive: true })
await mkdir(dirname(modelTarget), { recursive: true })
await cp(join(packageRoot, 'wasm'), wasmTarget, { recursive: true, force: true })

let needsModel = false
try {
  const model = await stat(modelTarget)
  needsModel = model.size < 1_000_000
} catch {
  needsModel = true
}

if (needsModel) {
  console.log('Downloading the offline MediaPipe pose model...')
  const response = await fetch(modelUrl)
  if (!response.ok) {
    throw new Error(`Could not download pose model: ${response.status} ${response.statusText}`)
  }
  await writeFile(modelTarget, Buffer.from(await response.arrayBuffer()))
}

console.log('MediaPipe offline assets are ready.')
