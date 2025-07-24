import React, { useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useTheme } from '../../lib/theme-provider'
import { useProjectStore } from '../../store/projectStore'
import { UnifiedTitleBar } from './UnifiedTitleBar'
import { LeftSidebar } from './LeftSidebar'
import { MainEditor } from './MainEditor'
import { RightSidebar } from './RightSidebar'
import { StatusBar } from './StatusBar'
import { FrontmatterPanel } from '../frontmatter'
import { CommandPalette } from '../command-palette'
import { ComponentBuilderDialog } from '../component-builder'
import { Toaster } from '../ui/sonner'
import { PreferencesDialog } from '../preferences'
import { useLayoutEventListeners } from '../../hooks/useLayoutEventListeners'
import { LAYOUT_SIZES } from '../../lib/layout-constants'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable'

export const Layout: React.FC = () => {
  const { sidebarVisible, frontmatterPanelVisible } = useUIStore()
  const { setTheme } = useTheme()
  const { globalSettings } = useProjectStore()

  // Extract all event listeners to custom hook
  const { preferencesOpen, setPreferencesOpen } = useLayoutEventListeners()

  // Sync stored theme preference with theme provider on app load
  useEffect(() => {
    const storedTheme = globalSettings?.general?.theme
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [globalSettings?.general?.theme, setTheme])

  return (
    <div className="h-screen w-screen bg-[var(--editor-color-background)] flex flex-col rounded-xl overflow-hidden">
      {/* Unified titlebar */}
      <UnifiedTitleBar />

      {/* Main content area with three-panel layout */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar */}
          <ResizablePanel
            defaultSize={sidebarVisible ? LAYOUT_SIZES.leftSidebar.default : 0}
            minSize={sidebarVisible ? LAYOUT_SIZES.leftSidebar.min : 0}
            maxSize={sidebarVisible ? LAYOUT_SIZES.leftSidebar.max : 0}
            className={`min-w-[${LAYOUT_SIZES.leftSidebar.minWidth}] ${sidebarVisible ? '' : 'hidden'}`}
          >
            <LeftSidebar />
          </ResizablePanel>
          <ResizableHandle
            className={`!cursor-col-resize ${sidebarVisible ? '' : 'hidden'}`}
          />

          {/* Main Editor */}
          <ResizablePanel
            defaultSize={LAYOUT_SIZES.mainEditor.getDefault(
              sidebarVisible,
              frontmatterPanelVisible
            )}
            minSize={LAYOUT_SIZES.mainEditor.min}
          >
            <MainEditor />
          </ResizablePanel>

          {/* Right Sidebar */}
          <ResizableHandle
            className={`!cursor-col-resize ${frontmatterPanelVisible ? '' : 'hidden'}`}
          />
          <ResizablePanel
            defaultSize={
              frontmatterPanelVisible ? LAYOUT_SIZES.rightSidebar.default : 0
            }
            minSize={
              frontmatterPanelVisible ? LAYOUT_SIZES.rightSidebar.min : 0
            }
            maxSize={
              frontmatterPanelVisible ? LAYOUT_SIZES.rightSidebar.max : 0
            }
            className={frontmatterPanelVisible ? '' : 'hidden'}
          >
            <RightSidebar>
              <FrontmatterPanel />
            </RightSidebar>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar - fixed at bottom */}
      <StatusBar />

      {/* Floating components */}
      <CommandPalette />
      <ComponentBuilderDialog />
      <PreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
      <Toaster />
    </div>
  )
}
