import { useTranslation } from '@/contexts/LocaleContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Sidebar } from '@/ui/Sidebar'

export function AppSidebar() {
  const { t } = useTranslation()
  const { isSidebarOpen } = useSidebar()

  return (
    <Sidebar isSidebarOpen={isSidebarOpen}>
      <div className="flex h-full flex-col pt-12">
        <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {t('sidebar.chats')}
        </div>
      </div>
    </Sidebar>
  )
}
