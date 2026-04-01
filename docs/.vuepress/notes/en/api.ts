import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const APIGuide: ThemeNote = defineNoteConfig({
    dir: 'api',
    link: '/api/',
    sidebar: 'auto'
})
