/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export const enNavbar = defineNavbarConfig([
    // { text: 'Home', link: '/' },
    // { text: 'Blog', link: '/blog/' },
    // { text: 'Tags', link: '/blog/tags/' },
    // { text: 'Archives', link: '/blog/archives/' },
    {
        text: 'Use Cases',
        // link: '/en/guide/',
        icon: 'icon-park-outline:guide-board',
        items: [

            {
                text: 'Basic Info',
                items: [
                    {
                        text: 'Introduction',
                        link: '/en/notes/kg_guide/basicinfo/intro.md',
                        icon: 'mdi:tooltip-text-outline',
                        activeMatch: '^/guide/'
                    },
                    // {
                    //     text: 'Installation',
                    //     link: '/en/notes/kg_guide/kg_quickstart/install.md',
                    //     icon: 'material-symbols:auto-transmission-sharp',
                    //     activeMatch: '^/guide/'
                    // },
                    // {
                    //     text: 'Quickstart',
                    //     link: '/en/notes/kg_guide/kg_quickstart/quickstart.md',
                    //     icon: 'mdi:bullseye-arrow',
                    //     activeMatch: '^/guide/'
                    // }
                ]
            },
        ]
    },
    // {
    //     text: 'API Reference',
    //     link: '/en/notes/api/1.home.md',
    //     icon: 'material-symbols:article-outline'
    // },
    {
        text: 'Operators',
        icon: "material-symbols:build-outline-sharp",
        items: [
            {
                text: 'Basic Info',
                items: [
                    {
                        text: 'Introduction',
                        link: '/en/notes/kg_operators/basicinfo/intro.md',
                        icon: 'mdi:tooltip-text-outline',
                        activeMatch: '^/guide/'
                    },
                    // {
                    //     text: 'Framework Design',
                    //     link: '/en/notes/kg_operators/basicinfo/framework.md',
                    //     icon: 'material-symbols:auto-transmission-sharp',
                    //     activeMatch: '^/guide/'
                    // },
                    // {
                    //     text: 'Install',
                    //     link: '/en/notes/kg_operators/basicinfo/install.md',
                    //     icon: 'mdi:bullseye-arrow',
                    //     activeMatch: '^/guide/'
                    // },
                    // {
                    //     text: 'Quick Start',
                    //     link: '/en/notes/kg_operators/basicinfo/quickstart.md',
                    //     icon: 'mdi:robot-excited-outline',
                    //     activeMatch: '^/guide/'
                    // }
                ]
            },
        ]
    },
])
