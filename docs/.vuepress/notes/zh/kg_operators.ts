import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const KGOperators: ThemeNote = defineNoteConfig({
    dir: 'kg_operators',
    link: '/kg_operators/',
    sidebar: [
        {
            text: '基础信息',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'basicinfo',
            items: [
                'intro',
                // 'design'
            ],
        },
        {
            text: 'Dataflow图像理解',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'image_understanding',
            items: [
                {
                    text: '安装',
                    collapsed: false,
                    prefix: '',
                    items: ['install_image_understanding'],
                },
                {
                    text: "generate",
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'image_caption',
                        'image_qa',
                        'image_pers_qa',
                        'multimodal_math',
                        'prompt_templated_vqa_generator',
                        'fix_prompted_vqa_generator',
                        "prompted_vqa_generator",
                        "batch_vqa_generator",
                        "visual_reasoning_generator",
                        "vlm_bbox_generator",
                        "image_bbox_generator"
                        // 'vision_mct_reasoning',
                        // 'image_region_caption',
                        // 'image_scale_caption',
                        // 'image_gcot',
                        // 'image_caprl',
                        // 'multirole_videoqa',
                    ]
                },
                {
                    text: "eval",
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'image_clip_evaluator',
                        'image_longclip_evaluator',
                        'image_vqa_evaluator',
                    ]
                },
                {
                    text: "filter",
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'image_aesthetic_filter',
                        'image_cat_filter',
                        'image_clip_filter',
                        'image_complexity_filter',
                        'image_consistency_filter',
                        'image_deduplication_filter',
                        'image_diversity_filter',
                        'image_sensitive_filter',
                    ]
                },
                {
                    text: "refine",
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'visual_dependency_refiner',
                        'visual_grounding_refiner',
                        'wiki_qa_refiner',
                    ]
                }
            ],
        },
        {
            text: 'Dataflow视频理解',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'video_understanding',
            items: [
                {
                    text: '安装',
                    collapsed: false,
                    prefix: '',
                    items: ['install_video_understanding'],
                },
                {
                    text: "generate",
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'video_caption',
                        'video_merged_caption',
                        'video_qa',
                        'video_cotqa',
                        'video_clip'
                    ]
                },
                {
                    text: "eval",
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'general_text_answer_evaluator',
                        'emscore_evaluator',
                        'video_aesthetic_evaluator',
                        'video_luminance_evaluator',
                        'video_ocr_evaluator',
                    ]
                },
                {
                    text: "filter",
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'video_resolution_filter',
                        'video_motion_score_filter',
                        'video_clip_filter',
                        'video_info_filter',
                        'video_scene_filter',
                        'video_score_filter',
                        'video_frame_filter',
                    ]
                },
            ],
        },
        {
            text: 'Dataflow语音理解',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'audio_understanding',
            // items: [
            //     'install_audio_understanding',
            //     'audio_caption',
            //     'silero_vad',
            //     'merge_chunks',
            //     'ctc_forced_aligner_eval',
            // ],
            items: [
                {
                    text: '安装',
                    collapsed: false,
                    prefix: '',
                    items: ['install_audio_understanding'],
                },
                {
                    text: "generate",
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'audio_caption',
                        'silero_vad',
                    ]
                },
                {
                    text: "eval",
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'ctc_forced_aligner_eval',
                    ]
                },
                {
                    text: "filter",
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'ctc_forced_aligner_filter',
                    ]
                },
                {
                    text: "generaterow",
                    collapsed: false,
                    prefix: 'generaterow/',
                    items: [
                        'merge_chunks',
                    ]
                }
            ],
        },
        {
            text: 'Dataflow图像/视频生成',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'image_video_generation',
            items: [
                'install_image_video_generation',
                'image_generation',
            ],
        },
        {
            text: 'Dataflow-KG时序知识图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'temporal_kg',
            items: [
                {
                    text: "generate",
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'tkg_4tuple_extractor',
                        'tkg_4tuple_merge',
                        'tkg_rel_4tuple_subgraph_qa_generator',
                        'tkg_rel_4tuple_path_qa_generator',
                        'tkg_attri_4tuple_qa_generator',
                        'tkg_rel_4tuple_conversation_generator',
                    ]
                },
                {
                    text: "filter",
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'tkg_4tuple_time_sampling',
                    ]
                },
                {
                    text: "eval",
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'tkg_4tuple_time_summary',
                    ]
                },
                {
                    text: "refine",
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'tkg_4tuple_disambiguation',
                    ]
                },
            ],
        },
    ]
})
