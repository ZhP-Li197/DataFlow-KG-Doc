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
            text: 'Dataflow Temporal KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'temporal_kg',
            items: [
                {
                    text: "generate",
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        {
                            text: 'TKGTupleExtraction',
                            link: '/en/kg_operators/temporal_kg/generate/tkgtupleextraction/',
                            icon: 'material-symbols:bolt',
                        },
                        {
                            text: 'TKGTupleMerger',
                            link: '/en/kg_operators/temporal_kg/generate/tkgtuplemerger/',
                            icon: 'material-symbols:bolt',
                        },
                        {
                            text: 'TKGTupleSubgraphQAGeneration',
                            link: '/en/kg_operators/temporal_kg/generate/tkgtuplesubgraphqageneration/',
                            icon: 'material-symbols:bolt',
                        },
                        {
                            text: 'TKGTuplePathQAGeneration',
                            link: '/en/kg_operators/temporal_kg/generate/tkgtuplepathqageneration/',
                            icon: 'material-symbols:bolt',
                        },
                        {
                            text: 'TKGAttriuteQAGeneration',
                            link: '/en/kg_operators/temporal_kg/generate/tkgattriuteqageneration/',
                            icon: 'material-symbols:bolt',
                        },
                        {
                            text: 'TKGRelationTripletDialogueQAGeneration',
                            link: '/en/kg_operators/temporal_kg/generate/tkgrelationtripletdialogueqageneration/',
                            icon: 'material-symbols:bolt',
                        },
                    ]
                },
                {
                    text: "filter",
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'TKGTupleTimeFilter',
                    ]
                },
                {
                    text: "eval",
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'TKGTemporalStatistics',
                    ]
                },
                {
                    text: "refine",
                    collapsed: false,
                    prefix: 'refine/',
                    items: [
                        'TKGTupleDisambiguation',
                    ]
                },
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
