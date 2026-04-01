---
title: Pull Request规范
createTime: 2025/06/13 10:42:46
permalink: /zh/dev_guide/pull_request/
---
# Pull Request 规范

开发者在准备开发前，请fork本仓库到自己的账号下，并git clone 到本地。

完成clone操作后，设置上游仓库为本仓库

```
git remote add upstream <DataFlow URL>
```

在提交修改前，请将仓库与上游仓库同步：

```
git pull upstream main
```
同步后进行提交：
```
git push origin main
```

在提交修改到自己账户的fork仓库后，发起pull request。

如果不熟悉git相关操作，请在进行操作时遵循如下注意事项:

1. ``git add`` : 对修改过的文件/文件夹逐个执行``git add``, 不要执行 ``git add .``。如果该命令运行时间过长，**极大概率是将大文件放入了暂存区**，请立即停止并进行检查。

2. ``git commit`` : 提交信息尽量清晰准确。

3. ``git push``:  执行该指令时，请指明push到的远程仓库及分支，如果不熟悉git相关操作，请在push之前执行``git remote -v`` 查看每个远程仓库的别名对应的URL以明确。

4. 发起PR: 发起PR前请点击``Files changed``仔细检查是否有不应该提交的文件修改。