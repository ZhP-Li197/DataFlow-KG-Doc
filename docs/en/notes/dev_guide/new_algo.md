---
title: New Operator
createTime: 2025/06/12 12:00:00
permalink: /en/dev_guide/new_algo/
---

## New Operator

DataFlow operators share a unified base class `OperatorABC`, located under `dataflow/operators/generate`, `dataflow/operators/filter` or `dataflow/operators/refine`. These operators must implement the fixed method `run()` required by the base class.

If you want to add a new operator to DataFlow, after implementing the operator and its constituent methods, you must perform the following steps:

1. In the operator’s directory, add a file that contains the operator class.  
2. In that file, import the `Registry` instance and decorate the class with the `register()` decorator.  
3. In the `__init__.py` file of the operator’s directory, add the operator’s relative path to the `_import_structure` variable.

If it is necessary to add a new operator directory, you must also make the corresponding modifications in `dataflow/utils/registry.py`.
