---
title: Must-Read – Operator Development Based on lazy_loader  
createTime: 2025-07-12 17:35:02  
permalink: /en/dev_guide/lazy_loader/  
---

# Must-Read – Operator Development Based on lazy_loader

DataFlow contains a large number of operators built on different Python libraries with varying dependencies. If the interpreter were to import every operator and its dependencies up front, the overhead would be enormous. Moreover, as more libraries are added in the future, some of them may become mutually exclusive. Therefore, **lazy loading (`Lazyload`) is essential**: an operator’s dependencies are imported only when the operator itself is explicitly imported.

Thanks to [Zimo Meng](https://github.com/MOLYHECI) for implementing an AST-aware lazy loader that still allows VS Code’s IntelliSense to work correctly.

When developing a new operator, in addition to writing its core logic in a Python file, **you must add the necessary imports so that the DataFlow framework can locate and import the file properly**.

Take the minimal `PromptedGenerator` operator as a concrete reference:  
[Link](https://github.com/OpenDCAI/DataFlow/blob/main/dataflow/operators/generate/GeneralText/prompted_generator.py)

After the operator logic is implemented, open the `__init__.py` file one level above it (i.e., `dataflow/operators/generate/__init__.py`) and append the following import **in the exact location and format shown below**:

```python
if TYPE_CHECKING:
    # GeneralText
    from .GeneralText.pretrain_generator import PretrainGenerator
    from .GeneralText.condor_generator import CondorGenerator
    from .GeneralText.prompted_generator import PromptedGenerator  # Add yours here

    # Reasoning
    ...
```

**Do not add any other `from xxxx import *` statements elsewhere**, or you will break the lazy-loading mechanism.