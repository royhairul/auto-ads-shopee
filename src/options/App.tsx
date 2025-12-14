import { useState } from 'react'
import { Tabs, Tab, Button } from '@heroui/react'
import {
  IconSettings2,
  IconX,
  IconInfoCircle,
  IconLayoutBottombarCollapseFilled,
  IconLayoutSidebarRightCollapseFilled,
  IconBell,
  IconBug,
} from '@tabler/icons-react'
import SettingsTab from './tabs/SettingsTab'
import AboutTab from './tabs/AboutTab'
import NotificationTab from './tabs/NotificationTab'
import ErrorLogsTab from './tabs/ErrorLogsTab'

export default function App() {
  const [isVertical, setIsVertical] = useState(true)
  const toggleLayout = () => setIsVertical((prev) => !prev)

  return (
    <div className="mt-6 w-full mx-auto p-4">
      {/* Toggle layout & header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          isIconOnly
          variant="light"
          onPress={toggleLayout}
          aria-label={isVertical ? 'Vertical Layout' : 'Horizontal Layout'}
        >
          {isVertical ? (
            <IconLayoutSidebarRightCollapseFilled size={20} />
          ) : (
            <IconLayoutBottombarCollapseFilled size={20} />
          )}
        </Button>

        <h1 className="text-xl font-semibold">Options</h1>

        <Button
          isIconOnly
          variant="light"
          onPress={() => window.close()}
          aria-label="Tutup"
        >
          <IconX size={20} />
        </Button>
      </div>

      <Tabs
        aria-label="Options"
        isVertical={isVertical}
        defaultSelectedKey="settings"
        classNames={{ tabContent: 'm-2 p-2' }}
      >
        {/* Tab: Settings */}
        <Tab
          key="settings"
          title={
            <div className="flex items-center space-x-2">
              <IconSettings2 size={18} />
              <span>Auto Ads</span>
            </div>
          }
          className="w-full"
        >
          <SettingsTab />
        </Tab>

        {/* Tab: Settings */}
        <Tab
          key="notification"
          title={
            <div className="flex items-center space-x-2">
              <IconBell size={18} />
              <span>Notifikasi</span>
            </div>
          }
          className="w-full"
        >
          <NotificationTab />
        </Tab>

        {/* Tab: Error Logs */}
        <Tab
          key="errorLogs"
          title={
            <div className="flex items-center space-x-2">
              <IconBug size={18} />
              <span>Error Logs</span>
            </div>
          }
          className="w-full"
        >
          <ErrorLogsTab />
        </Tab>

        {/* Tab: About */}
        <Tab
          key="about"
          title={
            <div className="flex items-center space-x-2">
              <IconInfoCircle size={18} />
              <span>About</span>
            </div>
          }
          className="w-full"
        >
          <AboutTab />
        </Tab>
      </Tabs>
    </div>
  )
}
