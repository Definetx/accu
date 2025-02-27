# 杂项/生命游戏

康威生命游戏(Conway's Game of Life), 又称康威生命棋, 是英国数学家约翰·何顿·康威在1970年发明的细胞自动机. 点击下方立即游玩游戏:

<iframe src="/content/misc/game_of_life/game_of_life.html" style="width:400px;height:500px" frameborder="no"></iframe>

1. 可以随时创建或销毁一个细胞, 只需要轻点棋盘对应的网格.
2. 点击**随机**按钮, 将以**汤**模式开始游戏. 该模式下细胞将以约定的概率随机初始化在棋盘上.

## 规则

生命游戏中, 对于任意细胞, 规则如下:
每个细胞有两种状态: 存活或死亡, 每个细胞与以自身为中心的周围八格细胞产生互动.

1. 当前细胞为存活状态时, 当周围低于2个(不包含2个)存活细胞时, 该细胞变成死亡状态.(模拟生命数量稀少)
2. 当前细胞为存活状态时, 当周围有2个或3个存活细胞时, 该细胞保持原样.
3. 当前细胞为存活状态时, 当周围有3个以上的存活细胞时, 该细胞变成死亡状态.(模拟生命数量过多)
4. 当前细胞为死亡状态时, 当周围有3个存活细胞时, 该细胞变成存活状态.(模拟繁殖)

可以把最初的细胞结构定义为种子, 当所有在种子中的细胞同时被以上规则处理后, 可以得到第一代细胞图. 按规则继续处理当前的细胞图, 可以得到下一代的细胞图, 周而复始.

## 概述

生命游戏是一个零玩家游戏. 它包括一个二维矩形世界, 这个世界中的每个方格居住着一个活着的或死了的细胞. 一个细胞在下一个时刻生死取决于相邻八个方格中活着的或死了的细胞的数量. 如果相邻方格活着的细胞数量过多, 这个细胞会因为资源匮乏而在下一个时刻死去; 相反, 如果周围活细胞过少, 这个细胞会因太孤单而死去. 实际中, 玩家可以设定周围活细胞的数目怎样时才适宜该细胞的生存. 如果这个数目设定过高, 世界中的大部分细胞会因为找不到太多的活的邻居而死去, 直到整个世界都没有生命; 如果这个数目设定过低, 世界中又会被生命充满而没有什么变化.

实际中, 这个数目一般选取2或者3; 这样整个生命世界才不至于太过荒凉或拥挤, 而是一种动态的平衡. 这样的话, 游戏的规则就是: 当一个方格周围有2或3个活细胞时, 方格中的活细胞在下一个时刻继续存活; 即使这个时刻方格中没有活细胞, 在下一个时刻也会"诞生"活细胞.

在这个游戏中, 还可以设定一些更加复杂的规则, 例如当前方格的状况不仅由父一代决定, 而且还考虑祖父一代的情况. 玩家还可以作为这个世界的"上帝", 随意设定某个方格细胞的死活, 以观察对世界的影响.

在游戏的进行中, 杂乱无序的细胞会逐渐演化出各种精致、有形的结构; 这些结构往往有很好的对称性, 而且每一代都在变化形状. 一些形状已经锁定, 不会逐代变化. 有时, 一些已经成形的结构会因为一些无序细胞的"入侵"而被破坏. 但是形状和秩序经常能从杂乱中产生出来.

## 参考

- [1] [维基百科. 康威生命游戏.](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
- [2] [维基百科. 细胞自动机.](https://zh.wikipedia.org/wiki/%E7%B4%B0%E8%83%9E%E8%87%AA%E5%8B%95%E6%A9%9F)
