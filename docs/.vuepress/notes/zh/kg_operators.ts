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
            text: 'DataFlow-KG 领域图谱',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'domain_kg',
            items: [
                {
                    text: 'medical_kg',
                    collapsed: false,
                    prefix: 'medical_kg/',
                    items: [
                        {
                            text: 'generate',
                            collapsed: false,
                            prefix: 'generate/',
                            items: [
                                'medkg_triple_extractor',
                                'medkg_triple_drug_action_mechanism_discovery',
                                'medkg_triple_drug_repositioning_discovery',
                            ]
                        },
                        {
                            text: 'filter',
                            collapsed: false,
                            prefix: 'filter/',
                            items: [
                                'medkg_triple_metapath_sampling',
                            ]
                        }
                    ]
                },
                {
                    text: 'scholar_kg',
                    collapsed: false,
                    prefix: 'scholar_kg/',
                    items: [
                        {
                            text: 'generate',
                            collapsed: false,
                            prefix: 'generate/',
                            items: [
                                'schokg_triple_extractor',
                                'schokg_query_reasoning',
                                'schokg_recommend',
                            ]
                        }
                    ]
                },
                {
                    text: '金融图谱',
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
                    text: '地理图谱',
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
        },        {
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
        }
    ]
})
