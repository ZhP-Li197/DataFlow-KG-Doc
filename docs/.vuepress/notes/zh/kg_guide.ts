import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const KGGuide: ThemeNote = defineNoteConfig({
    dir: 'kg_guide',
    link: '/kg_guide/',
    sidebar: [
        {
            text: '基础信息',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'basicinfo',
            items: [
                'intro',
            ],
        },
        {
            text: '上手案例',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_quickstart',
            items: [
                'install',
                'quickstart'
            ],
        },
        {
            text: 'DataFlow-KG 类型图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_pipelines_by_types',
            items: [
                'KGExtractionPipeline',
                'kg_qa_pipeline',
                'tkg_qa_pipeline',
                'hyper_kg_qa_pipeline',
                'kg_evaluation_visualization_pipeline',
            ],
        },
        {
            text: 'DataFlow-KG 领域图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_pipelines_by_domains',
            items: [
                'MedicalKGPipeline',
                'ScholarKGPipeline',
                'LegalKGPipeline',
                
            ],
        },
        {
            text: '基于图谱的智能问答',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'image_video_generation',
            items: [
                'install_image_video_generation',
                'image_generation',
                'image_editing',
            ],
        },
    ]
})
