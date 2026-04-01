---
title: 新算子
createTime: 2025/06/12 12:00:00
permalink: /zh/dev_guide/new_algo/
---

## 新算子

DataFlow算子有统一基类`OperatorABC`，位于`dataflow/operators/generate`，`dataflow/operators/filter`或`dataflow/operators/refine`下，这些算子需要实现基类所需的固定方法`run()`

如果想要在DataFlow中添加新算子，在实现算子及其所包含的方法后需要进行如下操作：

1. 在算子所在文件夹下添加包含算子类的文件

2. 在该文件中导入Registry实例，并用``register()``方法修饰

3. 在算子所在文件夹下的__init__.py文件中，向``_import_structure``变量添加算子指向的相对路径。

如果有必要添加新的算子文件夹，需要在``dataflow/utils/registry.py``中进行相应修改。
