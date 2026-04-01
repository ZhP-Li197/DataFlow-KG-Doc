import type { ThemeNoteListOptions } from 'vuepress-theme-plume'
import { defineNotesConfig } from 'vuepress-theme-plume'
// import { plugins } from './plugins'
// import { themeConfig } from './theme-config'
import { APIGuide } from './api'
import { KGGuide } from './kg_guide'
import { KGOperators } from './kg_operators'
// import { tools } from './tools'

export const zhNotes: ThemeNoteListOptions = defineNotesConfig({
    dir: 'zh/notes',
    link: '/zh/',
    notes: [
        APIGuide,
        KGGuide,
        KGOperators,
        // themeConfig,
        // plugins,
        // tools,
    ],
})
