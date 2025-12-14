import { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Code,
  Spinner,
  Chip,
} from '@heroui/react'
import {
  IconBug,
  IconTrash,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'

interface ErrorLog {
  message: string
  stack: string
  when: string
  url?: string
  line?: number
  column?: number
  [key: string]: any
}

export default function ErrorLogsTab() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const result = await chrome.storage.local.get('errorLogs')
      setLogs(result.errorLogs || [])
    } catch (error) {
      console.error('Failed to load error logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleClearLogs = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua log error?')) {
      await chrome.storage.local.remove('errorLogs')
      setLogs([])
    }
  }

  const handleExportLogs = () => {
    const jsonString = JSON.stringify(logs, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card className="w-full p-2">
        <CardBody className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <IconBug />
          <span className="text-base font-semibold">Error Logs</span>
          <Chip size="sm" color="danger" variant="flat">
            {logs.length}
          </Chip>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            startContent={<IconRefresh size={16} />}
            onPress={loadLogs}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<IconDownload size={16} />}
            onPress={handleExportLogs}
            isDisabled={logs.length === 0}
          >
            Export
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<IconTrash size={16} />}
            onPress={handleClearLogs}
            isDisabled={logs.length === 0}
          >
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardBody className="flex flex-col gap-3 mt-2">
        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-default-500">
              Tidak ada error log. Extension berjalan dengan baik! 🎉
            </p>
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600">
                      {log.message}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      {formatDate(log.when)}
                    </p>
                  </div>
                  <Chip size="sm" variant="flat" color="danger">
                    #{logs.length - index}
                  </Chip>
                </CardHeader>

                <CardBody className="space-y-2 pt-0">
                  {/* Additional Info */}
                  {(log.url || log.line || log.column) && (
                    <div className="text-xs text-default-600">
                      {log.url && (
                        <p>
                          <strong>URL:</strong> {log.url}
                        </p>
                      )}
                      {log.line && (
                        <span>
                          <strong>Line:</strong> {log.line}
                        </span>
                      )}
                      {log.column && (
                        <span className="ml-3">
                          <strong>Column:</strong> {log.column}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Custom fields */}
                  {Object.keys(log).some(
                    (key) =>
                      ![
                        'message',
                        'stack',
                        'when',
                        'url',
                        'line',
                        'column',
                      ].includes(key)
                  ) && (
                    <div className="text-xs">
                      <strong>Additional Info:</strong>
                      <Code size="sm" className="mt-1 block">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(log).filter(
                              ([key]) =>
                                ![
                                  'message',
                                  'stack',
                                  'when',
                                  'url',
                                  'line',
                                  'column',
                                ].includes(key)
                            )
                          ),
                          null,
                          2
                        )}
                      </Code>
                    </div>
                  )}

                  {/* Stack Trace */}
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-default-700 hover:text-default-900">
                      Stack Trace
                    </summary>
                    <Code size="sm" className="mt-2 block whitespace-pre-wrap">
                      {log.stack}
                    </Code>
                  </details>
                </CardBody>
              </Card>
            ))}
          </>
        )}
      </CardBody>
    </Card>
  )
}
