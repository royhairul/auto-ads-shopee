import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  CardFooter,
  Spinner,
} from '@heroui/react'
import { IconInfoCircle } from '@tabler/icons-react'

export default function AboutTab() {
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const CURRENT_VERSION = chrome.runtime.getManifest().version

  async function checkUpdate() {
    setLoading(true)
    setStatus('Memeriksa versi...')
    setDownloadUrl('')

    try {
      // Update URL ini dengan repository GitHub Anda
      const res = await fetch(
        'https://raw.githubusercontent.com/royhairul/auto-ads-shopee/main/version.json'
      )

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (!data.version) {
        setStatus('Format version.json tidak valid')
        setLoading(false)
        return
      }

      if (data.version !== CURRENT_VERSION) {
        setStatus(`Versi baru tersedia: v${data.version}`)
        setDownloadUrl(data.download)
      } else {
        setStatus('Extension sudah versi terbaru')
      }
    } catch (err) {
      setStatus('Gagal memeriksa update')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center gap-2 mt-4">
        <IconInfoCircle />
        <span className="text-base font-semibold">About Extension</span>
      </CardHeader>

      <CardBody className="mt-1 flex flex-col gap-4">
        <p className="text-sm text-default-500 leading-relaxed">
          Extension ini otomatis memantau budget iklan Shopee dan melakukan
          update harian. Anda dapat mengatur batas minimal budget, frekuensi
          update, dan daily budget.
        </p>

        {/* Informasi versi extension */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-default-600">
            Current Version:
          </span>
          <span className="text-sm text-default-500">v{CURRENT_VERSION}</span>
        </div>
      </CardBody>

      <CardFooter className="flex flex-col gap-2 items-start mt-2">
        {/* Tombol Check Update */}
        <Button
          size="sm"
          variant="flat"
          onPress={checkUpdate}
          isDisabled={loading}
        >
          {loading ? 'Checking...' : 'Check for Update'}
        </Button>

        {/* Loader */}
        {loading && (
          <div className="flex items-center gap-2 mt-1">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Memeriksa versi...</span>
          </div>
        )}

        {/* Status Update */}
        {!loading && status && (
          <p className="text-sm text-default-600">{status}</p>
        )}

        {/* Link Download */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            className="text-sm text-primary underline"
          >
            Download Update
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
