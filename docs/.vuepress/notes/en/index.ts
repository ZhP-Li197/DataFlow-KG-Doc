import type { ThemeNoteListOptions } from 'vuepress-theme-plume'
import { defineNotesConfig } from 'vuepress-theme-plume'
import { APIGuide } from './api'
import { KGGuide } from './kg_guide'
import { KGOperators } from './kg_operators'

export const enNotes: ThemeNoteListOptions = defineNotesConfig({
    dir: 'en/notes',
    link: '/en/',
    notes: [
        APIGuide,
        KGGuide,
        KGOperators,
    ],
})
