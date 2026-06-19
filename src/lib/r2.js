import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let _client = null

function client() {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return _client
}

const BUCKET     = import.meta.env.VITE_R2_BUCKET_NAME
const PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '')

export async function r2Upload(key, file) {
  const body = new Uint8Array(await file.arrayBuffer())
  await client().send(new PutObjectCommand({
    Bucket:             BUCKET,
    Key:                key,
    Body:               body,
    ContentType:        file.type || 'application/octet-stream',
    ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  }))
}

export async function r2Delete(key) {
  try {
    await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch {}
}

export async function r2ViewUrl(key) {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 })
}

export async function r2DownloadUrl(key, filename) {
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
  if (PUBLIC_URL) {
    // Bucket público: fetch + blob para forçar download
    return null
  }
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key, ResponseContentDisposition: disposition }),
    { expiresIn: 3600 },
  )
}
