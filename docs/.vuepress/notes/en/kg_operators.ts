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
            text: 'Hyper-Relational KG',
            collapsed: false,
            icon: 'carbon:idea',
            prefix: 'hyper_relation_kg',
            items: [
                {
                    text: 'generate',
                    collapsed: false,
                    prefix: 'generate/',
                    items: [
                        'hrkg_rel_triple_extractor_en',
                        'hrkg_rel_triple_path_qa_generator_en',
                        'hrkg_rel_triple_subgraph_qa_generator_en',
                    ]
                },
                {
                    text: 'filter',
                    collapsed: false,
                    prefix: 'filter/',
                    items: [
                        'hrkg_rel_triple_attribute_filtering_en',
                        'hrkg_rel_triple_completeness_filtering_en',
                        'hrkg_rel_triple_consistency_filtering_en',
                    ]
                },
                {
                    text: 'eval',
                    collapsed: false,
                    prefix: 'eval/',
                    items: [
                        'hrkg_rel_triple_consistency_eval_en',
                        'hrkg_rel_triple_completeness_eval_en',
                        'hrkg_rel_triple_attri_summary_en',
                    ]
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
            text: 'Domain-Specific KG',
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
                },
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
                                'medkg_triple_extractor_en',
                                'medkg_triple_drug_action_mechanism_discovery_en',
                                'medkg_triple_drug_repositioning_discovery_en',
                            ]
                        },
                        {
                            text: 'filter',
                            collapsed: false,
                            prefix: 'filter/',
                            items: [
                                'medkg_triple_metapath_sampling_en',
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
                                'schokg_triple_extractor_en',
                                'schokg_query_reasoning_en',
                                'schokg_recommend_en',
                            ]
                        }
                    ]
                }
            ],
        }
    ]
})

