import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const KGOperators: ThemeNote = defineNoteConfig({
    dir: 'kg_operators',
    link: '/kg_operators/',
    sidebar: [
        {
            text: 'Basic Info',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'basicinfo',
            items: [
                'intro',
                // 'design'
            ],
        },
    {
    text: 'General KG',
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
                'kg_tuple2text',
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
                'kg_tuple_normalization',
            ]
        }
    ],
},
    {
      text: 'Multimodal KG',
      collapsed: false,
      icon: 'carbon:idea',
      prefix: 'mmkg',
      items: [
        // {
        //   text: 'Install',
        //   collapsed: false,
        //   prefix: '',
        //   items: ['install_mmkg'],
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
            text: 'Commonsense KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'commonsense_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'cskg_triple_extractor_en',
                        'cskg_rel_triple_qa_generator_en',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'cskg_triple_adapbility_eval_en',
                        'cskg_triple_rationale_eval_en',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'cskg_rel_triple_set_sampling_en',
                        'cskg_triple_adapbility_filtering_en',
                        'cskg_triple_rationale_filtering_en',
                    ]
                },
                {
                    text: 'refine',
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'cskg_triple_concept_generalization_en',
                    ]
                }
            ],
        },
        {
            text: 'KG Retrieval',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'graph_rag',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'graphrag_query_extractor_en',
                        'graphrag_prompt_generator_en',
                        'graphrag_get_answer_en',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'graphrag_answer_plausibility_eval_en',
                        'graphrag_answer_token_eval_en',
                        'graphrag_question_difficulty_eval_en',
                        'graphrag_truth_eval_en',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'graphrag_answer_plausibility_filtering_en',
                        'graphrag_answer_token_filtering_en',
                    ]
                }
            ],
        },
        {
            text: 'KG Reasoning',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'graph_reasoning',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'reasoning_path_search_en',
                        'reasoning_constrained_path_search_en',
                        'reasoning_rel_generator_en',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'reasoning_path_length_eval_en',
                        'reasoning_path_redundancy_eval_en',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'reasoning_path_length_filtering_en',
                        'reasoning_path_redundancy_filtering_en',
                    ]
                }
            ],
        },
        {
            text: 'Temporal KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'temporal_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'tkg_4tuple_extractor_en',
                        'tkg_4tuple_merge_en',
                        'tkg_rel_4tuple_subgraph_qa_generator_en',
                        'tkg_rel_4tuple_path_qa_generator_en',
                        'tkg_attri_4tuple_qa_generator_en',
                        'tkg_rel_4tuple_conversation_generator_en',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'tkg_4tuple_time_sampling_en',
                    ]
                },
                {
                    text: 'refine',
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'tkg_4tuple_disambiguation_en',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'tkg_4tuple_time_summary_en',
                    ]
                },
            ],
        },
        {
            text: 'Dataflow Domain KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'domain_kg',
            items: [
                {
                    text: 'Financial KG',
                    collapsed: false,
                    prefix: 'financial_kg/',
                    items: [
                        {
                            text: 'generate',
                            collapsed: false,
                            prefix: 'generate/',
                            items: [
                                'finkg_4tuple_extractor',
                            ]
                        },
                        {
                            text: 'refine',
                            collapsed: false,
                            prefix: 'refine/',
                            items: [
                                'finkg_marketaux_news_retriever',
                                'finkg_event_impact_tracing',
                                'finkg_investment_analysis',
                                'finkg_entity_risk_assessment',
                            ]
                        }
                    ],
                },
                {
                    text: 'Geospatial KG',
                    collapsed: false,
                    prefix: 'geospatial_kg/',
                    items: [
                        {
                            text: 'generate',
                            collapsed: false,
                            prefix: 'generate/',
                            items: [
                                'geokg_4tuple_extractor',
                                'geokg_event_extractor',
                            ]
                        },
                        {
                            text: 'refine',
                            collapsed: false,
                            prefix: 'refine/',
                            items: [
                                'geokg_entity_link2database',
                                'geokg_rel_4tuple_inference',
                            ]
                        },
                        {
                            text: 'eval',
                            collapsed: false,
                            prefix: 'eval/',
                            items: [
                                'geokg_event_consistence_eval',
                                'geokg_event_rationale_eval',
                                'geokg_event_summary',
                            ]
                        },
                        {
                            text: 'filter',
                            collapsed: false,
                            prefix: 'filter/',
                            items: [
                                'geokg_event_consistence_filtering',
                                'geokg_event_rationale_filtering',
                                'geokg_event_location_filtering',
                                'geokg_event_time_filtering',
                            ]
                        }
                    ],
                }
            ],
        },
        {
            text: 'Dataflow Image',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'image_understanding',
            items: [
                {
                    text: 'install',
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
                        "prompt_templated_vqa_generator",
                        "fix_prompted_vqa_generator",
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
            text: 'Dataflow Video',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'video_understanding',
            items: [
                {
                    text: 'Install',
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
            text: 'Dataflow Audio',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'audio_understanding',
            // items: [
            //     'install_audio_understanding',
            //     'audio_caption',
            //     'whisper_asr',
            // ],
            items: [
                {
                    text: 'Install',
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
            text: 'Dataflow Generation',
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
