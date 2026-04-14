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
                'install',
                'quickstart'
            ],
        },
        {
            text: 'Start with DataFlow-KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_quickstart',
            items: [
                'install_image_understanding',
                'context_vqa',
                'image_gcot',
                'vision_mct_reasoning_pipeline',
                'image_region_caption_pipeline',
                'image_scale_caption_pipeline',
                'image_visual_only_mcq_pipeline',
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
            ],
        },
        {
            text: 'KG Pipelines by Domains',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_pipelines_by_domains',
            items: [
                'MedicalKGPipeline_en',
                'ScholarKGPipeline_en',
                'LegalKGPipeline_en',
                
            ],
        },
        {
            text: 'Chatbot Based on KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'chatbot_kg',
            items: [
                'install_image_video_generation',
                'image_generation',
            ],
        },
    ]
})
