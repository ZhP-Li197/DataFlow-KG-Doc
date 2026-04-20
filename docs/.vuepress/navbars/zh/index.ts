/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export const zhNavbar = defineNavbarConfig([
    // { text: '首页', link: '/zh/' },
    // { text: '博客', link: '/zh/blog/' },
    // { text: '标签', link: '/zh/blog/tags/' },
    // { text: '归档', link: '/zh/blog/archives/' },
    {
        text: '指南',
        // link: '/zh/guide/',
        icon: 'icon-park-outline:guide-board',
        items: [
            {
                text: '基础信息',
                items: [
                            {
                                text: '简介',
                                link: '/zh/notes/kg_guide/basicinfo/intro.md',
                                icon: 'mdi:tooltip-text-outline',
                                activeMatch: '^/guide/'
                            },
                            // {
                            //     text: '安装',
                            //     link: '/zh/notes/kg_guide/kg_quickstart/install.md',
                            //     icon: 'material-symbols:auto-transmission-sharp',
                            //     activeMatch: '^/guide/'
                            // },
                            // {
                            //     text: '快速开始',
                            //     link: '/zh/notes/kg_guide/kg_quickstart/quickstart.md',
                            //     icon: 'mdi:bullseye-arrow',
                            //     activeMatch: '^/guide/'
                            // }
                ]
            },
        ]
    },
    {
        text: '算子文档',
        icon: "material-symbols:build-outline-sharp",
        // items: [
        //     { text: "PR规范", link: '/zh/notes/dev_guide/pull_request.md' },
        //     { text: "日志", link: '/zh/notes/dev_guide/logging.md' },
        //     { text: "测试用例", link: '/zh/notes/dev_guide/testcase.md' },
        // ]
        items: [
            {
                text: '基础信息',
                items: [
                            {
                                text: '简介',
                                link: '/zh/notes/kg_operators/basicinfo/intro.md',
                                icon: 'mdi:tooltip-text-outline',
                                activeMatch: '^/guide/'
                            },
                            // {
                            //     text: '框架设计',
                            //     link: '/zh/notes/kg_operators/basicinfo/framework.md',
                            //     icon: 'material-symbols:auto-transmission-sharp',
                            //     activeMatch: '^/guide/'
                            // },
                            // {
                            //     text: '安装',
                            //     link: '/en/notes/kg_operators/basicinfo/install.md',
                            //     icon: 'mdi:bullseye-arrow',
                            //     activeMatch: '^/guide/'
                            // },
                            // {
                            //     text: '快速开始',
                            //     link: '/en/notes/kg_operators/basicinfo/quickstart.md',
                            //     icon: 'mdi:robot-excited-outline',
                            //     activeMatch: '^/guide/'
                            // }
                ]
            },
        ]
    },
    // {
    //     text: '笔记',
    //     items: [{ text: '示例', link: '/zh/notes/demo/README.md' }]
    // },
])

