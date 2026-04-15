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
                'install_video_understanding',
                'kg_evaluation_visualization_pipeline',
                'graph_rag_pipeline',
                'graph_reasoning_pipeline',
                'multimodal_kg_pipeline',
                'video_caption',
                'video_clip_and_filter',
                'video_qa',
                'video_cotqa',
                'video_longvideo_cotqa_api',
                'multirole_videoqa_pipeline'
            ],
        },
        {
            text: 'KG Pipelines by Domains',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'kg_pipelines_by_domains',
            items: [
                'finkg_risk_pipeline',
                'geokg_spatiotemporal_event_pipeline',
                'install_audio_understanding',
                'audio_caption',
                'whisper_asr',
                'audio_asr_pipeline'
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
