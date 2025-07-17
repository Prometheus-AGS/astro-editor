import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { GeneralPane } from './panes/GeneralPane'

interface PreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PreferencePane = 'general'

const getNavigationItems = () => [
  {
    id: 'general' as const,
    name: 'General',
    icon: Settings,
    available: true,
  },
]

const getPaneTitle = (pane: PreferencePane): string => {
  switch (pane) {
    case 'general':
      return 'General'
    default:
      return 'General'
  }
}

export const PreferencesDialog: React.FC<PreferencesDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [activePane, setActivePane] = useState<PreferencePane>('general')
  const navigationItems = getNavigationItems()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px] font-sans">
        <DialogTitle className="sr-only">Preferences</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your application preferences here.
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map(item => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activePane === item.id}
                        >
                          <button
                            onClick={() => setActivePane(item.id)}
                            className="w-full"
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex h-[500px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Preferences</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {getPaneTitle(activePane)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {activePane === 'general' && <GeneralPane />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
