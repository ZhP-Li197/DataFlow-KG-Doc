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
            text: 'DataFlow-KG 通用图谱',
            collapsed: false,
            icon: 'carbon:idea', 
            prefix: 'general_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'kg_attri_triple_qa_generator',
                        'kg_entity_extractor',
                        'kg_rel_triple_conversation_generator',
                        'kg_rel_triple_inference',
                        'kg_rel_triple_path_qa_generator',
                        'kg_rel_triple_subgraph_qa_generator',
                        'kg_triple_extractor',
                        'kg_triple_merge',
                        'kg_tuple2text'
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'kg_qa_concise_eval',
                        'kg_qa_correlation_eval',
                        'kg_qa_natural_eval',
                        'kg_rel_triple_consistency_eval',
                        'kg_rel_triple_nx_visual',
                        'kg_rel_triple_strength_eval',
                        'kg_rel_triple_topology_eval',
                        'kg_subgraph_connectivity_eval',
                        'kg_subgraph_consistence_eval',
                        'kg_subgraph_scale_eval'
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'kg_attri_tuple_sampling',
                        'kg_entity_validation',
                        'kg_qa_concise_filtering',
                        'kg_qa_correlation_filtering',
                        'kg_qa_natural_filtering',
                        'kg_rel_triple_strength_filtering',
                        'kg_rel_tuple_path_sampling',
                        'kg_rel_tuple_subgraph_sampling',
                        'kg_subgraph_connectivity_filtering',
                        'kg_subgraph_consistence_filtering',
                        'kg_subgraph_scale_filtering',
                        'kg_tuple_remove_repeated',
                        'kg_tuple_validation'
                    ]
                },
                {
                    text: 'refine',
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'kg_entity_alignment',
                        'kg_entity_classification',
                        'kg_entity_disambiguation',
                        'kg_entity_link2database',
                        'kg_entity_normalization',
                        'kg_triple_disambiguation',
                        'kg_tuple_normalization'
                    ]
                }
            ],
        },
        {
        text: 'DataFlow-KG 多模态图谱',
        collapsed: false,
        icon: 'carbon:idea',
        prefix: 'mmkg',
        items: [
            // {
            // text: '安装',
            // collapsed: false,
            // prefix: '',
            // items: ['install_mmkg'],
            // },
            {
            text: 'generate',
            collapsed: false,
            prefix: 'generate/',
            items: [
                'mmkg_visual_triple_extractor',
                'mmkg_visual_triple_path_qa_generator',
                'mmkg_visual_triple_subgraph_qa_generator',
            ],
            },
            {
            text: 'filter',
            collapsed: false,
            prefix: 'filter/',
            items: [
                'mmkg_visual_triple_path_sampling',
                'mmkg_visual_triple_subgraph_sampling',
            ],
            },
            {
            text: 'refine',
            collapsed: false,
            prefix: 'refine/',
            items: [
                'mmkg_entity_link2database',
                'mmkg_entity_link2img',
            ],
            },
        ],
        },
        {
            text: 'DataFlow-KG 常识图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'commonsense_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'cskg_triple_extractor',
                        'cskg_rel_triple_qa_generator',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'cskg_triple_adapbility_eval',
                        'cskg_triple_rationale_eval',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'cskg_rel_triple_set_sampling',
                        'cskg_triple_adapbility_filtering',
                        'cskg_triple_rationale_filtering',
                    ]
                },
                {
                    text: 'refine',
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'cskg_triple_concept_generalization',
                    ]
                }
            ],
        },
        {
            text: 'DataFlow-KG 图谱RAG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'graph_rag',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'graphrag_query_extractor',
                        'graphrag_prompt_generator',
                        'graphrag_get_answer',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'graphrag_answer_plausibility_eval',
                        'graphrag_answer_token_eval',
                        'graphrag_question_difficulty_eval',
                        'graphrag_truth_eval',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'graphrag_answer_plausibility_filtering',
                        'graphrag_answer_token_filtering',
                    ]
                }
            ],
        },
        {
            text: 'DataFlow-KG 图谱推理',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'graph_reasoning',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'reasoning_path_search',
                        'reasoning_constrained_path_search',
                        'reasoning_rel_generator',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'reasoning_path_length_eval',
                        'reasoning_path_redundancy_eval',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'reasoning_path_length_filtering',
                        'reasoning_path_redundancy_filtering',
                    ]
                }
            ],
        },
        {
            text: 'DataFlow-KG 时序图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'temporal_kg',
            items: [
                {
                    text: 'generate',
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
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'tkg_4tuple_time_sampling',
                    ]
                },
                {
                    text: 'refine',
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'tkg_4tuple_disambiguation',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'tkg_4tuple_time_summary',
                    ]
                },
            ],
        },
        {
            text: 'DataFlow-KG 超关系图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'hyper_relation_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'hrkg_rel_triple_extractor',
                        'hrkg_rel_triple_path_qa_generator',
                        'hrkg_rel_triple_subgraph_qa_generator',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'hrkg_rel_triple_attribute_filtering',
                        'hrkg_rel_triple_completeness_filtering',
                        'hrkg_rel_triple_consistency_filtering',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'hrkg_rel_triple_consistency_eval',
                        'hrkg_rel_triple_completeness_eval',
                        'hrkg_rel_triple_attri_summary',
                    ]
                },
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
    ]
})
