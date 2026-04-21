import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const KGGuide: ThemeNote = defineNoteConfig({
    dir: 'kg_guide',
    link: '/kg_guide/',
    sidebar: [
        {
            text: 'Basic Info',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'basicinfo',
            items: [
                'intro',
            ],
        },
        {
            text: 'Start with DataFlow-KG',
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
            text: 'KG Pipelines by Types',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_pipelines_by_types',
            items: [
                'KGExtractionPipeline_en',
                'kg_evaluation_visualization_pipeline',
                'graph_rag_pipeline',
                'graph_reasoning_pipeline',
                'multimodal_kg_pipeline',
            ],
        },
        {
            text: 'KG Pipelines by Domains',
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
        //     text: 'Chatbot Based on KG',
        //     collapsed: false,
        //     icon: 'carbon:idea',
        //     prefix: 'chatbot_kg',
        //     items: [
        //         'install_image_video_generation',
        //         'image_generation',
        //     ],
        // },
    ]
})
