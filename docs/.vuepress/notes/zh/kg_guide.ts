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
            text: '从这里开始',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_quickstart',
            items: [
                'install',
                'quickstart',
                'first_pipeline',
                'data_pre'
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
                'graph_rag_pipeline',
                'graph_reasoning_pipeline',
                'multimodal_kg_pipeline',
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
                'geokg_spatiotemporal_event_pipeline',
                'finkg_risk_pipeline'
            ],
        },
        // {
        //     text: '基于图谱的智能问答',
        //     collapsed: false,
        //     icon: 'carbon:idea',
        //     prefix: 'image_video_generation',
        //     items: [
        //         'install_image_video_generation',
        //         'image_generation',
        //         'image_editing',
        //     ],
        // },
    ]
})
