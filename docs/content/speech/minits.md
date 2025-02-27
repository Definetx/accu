# 演讲/minits: 以 LLVM 为后端的 TypeScript 静态编译器

- 时间: 2019-11-03
- 地点: 2019 中国开源年会(COSCon'19), 华东师范大学
- 主讲: 自己

Hello, 大家下午好! 欢迎参加有关 minits 编译器的主题演讲, 我叫叶万标, 也常用英文名 mohanson, 是一个虚拟机与编译器的爱好者. 先简单介绍下自己, 我对一些古董机器比较感兴趣, 曾写过上世纪 70 年代的雅达利街机模拟器, 任天堂的 Game Boy 模拟器, 英特尔的 4004 和 8080 CPU 模拟器等, 当然我也不一直做这些考古工作, 像目前比较火热的 WebAssembly 技术, 其虚拟器的 Python 实现 "pywasm", 我就是其主要作者. 我们接下来将谈论如何实现一个编译器或一门编程语言. 这个内容或许有点严肃, 事实上, 当我最初准备演讲内容的时候, 想法是介绍 minits 这个项目本身: 即它的设计, 思路, 代码实现或使用. minits 的设计目标是将 TypeScript 从浏览器或者 NodeJS 中解放出来. 但后来我发现 minits 它本身太普通了, 它与现代编译器们: 比如 Clang 或 Rust 没有太多的区别, 并且远不如这些成熟的编译器优秀和完善. 因此我决定在此时此地更多的讲讲编译器本身以及 minits 的工作流程. 希望可以让更多的小伙伴对编译器不再感到陌生.

## 解释器/编译器

通常来讲, 有两种主要的方法可以实现一门编程语言:

- 解释器
- 编译器

对于解释器来说, 它接收您编写的程序源代码和输入数据, 然后解释器开始运行并产生输出. 在这个工作流程下, 解释器是参与程序运行的, 因此可以称解释器是 online 的.

对于编译器来说情况有点不同. 编译器是一种将源语言翻译为另一种语义上等价语言的程序软件. 它接收用户的源码输入, 但并不执行用户的程序, 而是将用户的程序翻译为 Target output. Target output 可以是机器码, 虚拟机字节码甚至是另一门高级语言. 举两个例子来说明这几种情况, 第一个例子是 C 语言, 它的编译结果是生成一个可执行文件, 可以直接运行在操作系统中; 另一个例子是 Java, JDK 中提供了一个名叫 javac 的编译器, 该编译器的编译结果是生成 Java 字节码, 它必须被运行在 JVM 中. 之后用户的输入数据将与 Target output 一起协同作用产生 Output. 所以这种情况下, 编译器是离线的, 它不参与最后生成输出 Output 的过程.

一个典型的编译可能会包含如下 6 个阶段:

1. 词法分析
2. 语法分析
3. 语义分析
4. 生成中间代码(可选的)
5. 优化(可选的)
6. 代码生成

前 3 个阶段通常被称为编译器前端, 第 4 个阶段被称为前端的后端, 第 5 个阶段被称为中端, 第 6 个阶段被称为后端. minits 项目的主要工作就集中在第 4 阶段 "生成中间代码". 其中的优化阶段是为了让你的程序跑的更快或更节省资源, 但它和 "生成中间代码" 这一阶段一样, 对于编译器而言都是可选的. 第 6 阶段 "代码生成", 它的结果可以是多种多样的. 上面已经介绍过, 可以是机器码, 虚拟机字节码甚至是另一门高级语言. 我曾看过一门比较有趣的语言, 这门语言的名字叫做 Nim. 它有趣的地方在于, 它的编译器可以将 Nim 源代码编译为 C 语言代码, JS 代码, OC 代码等, 然后再使用对应的 gcc 编译器或 nodejs 解释器运行代码. 在见到这门语言之前, 我其实并不知道编译器真的可以这么做. 当然了, 到后面再见到 TypeScript 或 CoffeeScript 这些编译到 JS 的编译器也就习惯了.

## 词法分析

通常而言, 编译器的第一项工作叫做词法分析. 当你阅读英文句子时, 你会习惯性的将句子分为一个个单词, 并逐个理解每个单词的含义. 在编译器中, 我们使用 Token 来代表这些单词, 或者中文名叫 "词法记号". 举个例子, 以下面这段代码为例:

```ts
var a = "10" + 1;
```

如果将它分割为一个一个 Token, 那么它可以表示为如下的 Token 列表:

```ts
["var", "a", "=", "10", "+", "1"]
```

它很简单, 只需要按照空格分割这句表达式就可以了. 但是, 事实真的就这么简单吗? 来看下下面的几行代码:

```ts
var a="10"+1;
var b ="10"-1;
var c= "10" + 1;
```

可以看到, 操作符旁边的空格就像薛定谔的猫一样, 时有时无, 但你不能对写出这些代码的开发者说什么, 因为这些确实是符合 TypeScript 语法的代码. 这个时候就不能简单的按照空格分割代码了. 为了解决这一问题, 有很多种策略. 你如果翻阅过相关参考资料, 大致上会找到不少. 总的来说有两种方法, 一种是移除全部无用的空格, 一种是将原本缺少空格的代码 "展开". 两种方式都可以用来解决这个问题, 就 minits 这个项目而言, 你可以认为采用的方式是移除全部无用的空格.

虽然实际代码比上面所说的复杂, 但大体上就是如此.

## 语法分析

词法分析的下一个阶段是语法分析. 如果是词法分析是识别一个一个单词的话, 那语法分析就是识别一个一个句子. 我们在小时候学习语文或者英文的时候, 应该都学习过所谓的主谓宾定状补, 这些就是句子的语法结构. 在编译器中, 源代码通常被解析为一个树状结构, 在做语法分析时常用的技术手段是递归下降和增量分析.

递归下降算法基本思想是:

- 自顶向下
- 每个非终结符构造一个分析函数.
- 前向预测

递归下降的基本算法是为每一个非终结符构建一个 `parse` 函数, 伪代码可以表示为如下形式:

```text
parse_statement()
    parse_statement_variable_declare()
    parse_statement_if()
    parse_expression()
    ...

parse_statement_if()
    cond = parse_expression()
    thenBody = parse_statement()
    elseBody = parse_statement()
```

解析一个表达式时, 可以 "预先" 读取下一个 Token, 判断该表达式的具体类型, 然后调用具体的 parse 函数; 同时, 子 parse 函数也可以递归调用父 parse 函数.

程序的语法分析过程, 就是构造一棵抽象语法树(AST)的过程. 树的每个节点(子树)是一个语法单元, 这个单元的构成规则就叫 "语法". 每个节点还可以有下级节点. 接下来, 我们直观地看一下抽象语法树长什么样子. 下面的图片是 TypeScript 实现的斐波那契数列源码的抽象语法树.

[https://ts-ast-viewer.com/](https://ts-ast-viewer.com/)

## 语义分析

词法分析, 语法分析的下一步是进行语义分析. 语义分析就是识别一篇文章, 关联文章的上下文, 理解文章的意图, 同时如果文章中有哪些牛头不对马嘴的地方也要及时提醒作者.

举个简单的例子:

**类型**

```ts
let a = 10;
let b: number = 10;
```

我们为两个变量都进行了赋值, 但区别在于在对 a 进行赋值的时候并没有显示指明它的类型. 当我们在进行语法分析的时候, Token 是一个一个被读取的, 换句话说当解析到 "let a" 的时候, a 变量的类型是不确定的, a 变量的类型将根据等号后面的表达式决定. TypeScript 中负责对变量类型进行检查和推导的模块叫 TypeChecker, TypeChecker 除了维护类型之外, 同时还维护了函数和类的签名.

**符号表与作用域**. 运行下面代码将打印出 10 还是 20?

```ts
let a = 10;
for (;;) {
    let a = 20;
    console.log(a);
}
```

**变量, 函数, 类的重复定义检查**. 每一行代码单独看都是正确的, 但你不能把它们写在一个文件里.

```ts
function a() {}
function a() {}
```

语义分析工作的某些结果会作为属性标注在抽象语法树上, 比如上述提到的一个变量的类型.

## 生成中间代码

传统编译器最流行的设计是三阶段设计，其主要组件是前端, 优化器, 后端. 前端解析源代码, 检查它是否有错误, 并构建一个特定于语言的抽象语法树来表示输入代码. 优化器负责进行各种各样的转换以努力改进代码的运行时间, 例如消除冗余计算, 并且通常他们的算法和实现独立于编程语言或目标机器架构. 然后, 后端(也称为代码生成器)将代码映射到目标指令集. 编译器后端的公共部分包括指令选择, 寄存器分配和指令调度.

LLVM 是一个模块化的编译器套件, 它同样遵循上面的几个原则, 但它最伟大的贡献在于提出了通用中间语言表示, 也就是 LLVM IR. 但其实在 LLVM 之前, 绝大部分编译器都有自己的中间表示, 但缺点是它们要么非通用, 要么没人用. 大部分后端优化, 比如消除冗余代码, 它们的算法是相同的, 但在 LLVM 之前它们要在不同的语言上各自实现一遍. 有一些常见的中间语言表示, 比如 GCC, 它为了支持不同硬件平台, 它内部的许多编译阶段必须做到硬件无关性, 因此内部使用了一种硬件平台无关的语言 RTL. 另外, Java 字节码也可以认为是一种中间语言, 它运行在 JVM 上.

编译成中间语言有很多优势, 一是优化, 大部分编译器的优化阶段都是对中间语言进行优化, 再将其转换成机器指令, 因此你只需要编写一个针对中间语言的优化器, 而不是对每个硬件平台写对应的优化器; 其二是可以实现跨平台, 针对同一种中间语言, 不同平台的编译器可以将其转换成与该平台兼容的二进制指令. 从而使得一种源程序代码可以运行到不同的硬件平台上.

我会用下面这段代码来展示一下 LLVM IR 的样貌, 这段代码是用 TypeScript 写的斐波那契数列实现:

```ts
function fibo(n: number): number {
    if (n < 2) {
        return n;
    }
    return fibo(n - 1) + fibo(n - 2);
}
```

下面是将其使用 minits 编译到 LLVM IR 后的结果. 可以看到, LLVM IR 看起来像是一种介于高级语言和汇编代码之间的嵌合体.

```text
define i64 @fibo(i64 %n) {
body:
  %0 = icmp slt i64 %n, 2
  br i1 %0, label %if.then, label %if.else

if.then:                                          ; preds = %body
  ret i64 %n

if.else:                                          ; preds = %body
  br label %if.quit

if.quit:                                          ; preds = %if.else
  %1 = sub i64 %n, 1
  %2 = call i64 @fibo(i64 %1)
  %3 = sub i64 %n, 2
  %4 = call i64 @fibo(i64 %3)
  %5 = add i64 %2, %4
  ret i64 %5
}
```

对于 minits 项目来说, 这一阶段的工作是将上面几步得到的 AST 转换为 LLVM IR. minits 使用了 LLVM 的 TypeScript 绑定, 因此可以直接调用 LLVM 的 API 来生成 LLVM IR. 比如如下这段 TypeScript 代码演示了一个加法操作

```ts
let a = 1;
let b = 2;
let c = a + b;
```

可以通过调用 LLVM API 来将其转换为对应的 LLVM IR. 这一部分的原理并不难, 事实上整个 minits 项目大部分都在做这件工作: 将 TypeScript 的抽象语法树转换为 LLVM IR.

```ts
let lhs = llvm.ConstantInt.get(llvmContext, 1, 64);
let rhs = llvm.ConstantInt.get(llvmContext, 2, 64);
let r = llvmBuilder.createAdd(lhs, rhs);
```

## 优化/代码生成

通常情况下我认为简单的方案往往比复杂的方案更有效: 因此我们决定复用整个 Clang 编译器. 当 minits 编译得到 LLVM IR 后, 将 LLVM IR 投喂给 Clang 编译器, 可以实现完全复用 Clang 的 IR 优化和对应硬件平台的代码生成: 这使得 minits 可以运行在 x86, arm, 甚至是 riscv 架构上. 在稍后我将实际演示一遍.

## 演示

这是本场演讲的最后一个重要任务, 进行 minits 演示. 要演示的项目是使用 minits 编写的 brainfuck 解释器.

Brainfuck 是一种极小化的程序语言, 其本质是一个图灵纸带机. 这种语言由八种运算符构成:

| 字符 | 含义 |
| --- | --- |
| > | 指针加一 |
| < | 指针减一 |
| + | 指针指向的字节的值加一 |
| - | 指针指向的字节的值减一 |
| . | 输出指针指向的单元内容(ASCII码) |
| , | 输入内容到指针指向的单元(ASCII码) |
| [ | 如果指针指向的单元值为零, 向后跳转到对应的]指令的次一指令处 |
| ] | 如果指针指向的单元值不为零, 向前跳转到对应的[指令的次一指令处 |

比如如下这段源码在 Brainfuck 解释器中将打印出 "Hello World!"

```
++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.
```

来看一下使用 TypeScript 编写 Brainfuck 解释器的源码: 在源码中首先使用枚举类新定义了 8 种操作符, 然后在 main 函数中接收 Brainfuck 源代码, 并在循环中逐个字符进行解释执行:

```ts
const enum Opcode {
    SHR = '>',
    SHL = '<',
    ADD = '+',
    SUB = '-',
    PUTCHAR = '.',
    GETCHAR = ',',
    LB = '[',
    RB = ']',
}

function uint8(n: number): number {
    if (n > 0xff) {
        return uint8(n - 256);
    }
    if (n < 0x00) {
        return uint8(n + 256);
    }
    return n
}

function main(argc: number, argv: string[]): number {
    if (argc !== 2) {
        return 1;
    }
    let pc = 0;
    let ps = 0;

    // pre generated space: stack and src.
    let stack = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    let src = [
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ];
    let arg1 = argv[1];
    for (let i = 0; i < arg1.length; i++) {
        src[i] = arg1[i];
    }

    for (; pc < arg1.length;) {
        let op = src[pc];
        if (op === Opcode.SHR) {
            ps += 1;
            pc += 1;
            continue
        }
        if (op === Opcode.SHL) {
            ps -= 1;
            pc += 1;
            continue
        }
        if (op === Opcode.ADD) {
            stack[ps] = uint8(stack[ps] + 1);
            pc += 1;
            continue
        }
        if (op === Opcode.SUB) {
            stack[ps] = uint8(stack[ps] - 1);
            pc += 1;
            continue
        }
        if (op === Opcode.PUTCHAR) {
            console.log('%c', stack[ps]);
            pc += 1;
            continue
        }
        if (op === Opcode.GETCHAR) {
            console.log('GETCHAR is disabled');
            return 1;
        }


        if (op === Opcode.LB) {
            if (stack[ps] != 0x00) {
                pc += 1;
                continue
            }
            let n = 1;
            for (; n !== 0;) {
                pc += 1;
                if (src[pc] === Opcode.LB) {
                    n += 1;
                    continue
                }
                if (src[pc] === Opcode.RB) {
                    n -= 1;
                    continue
                }
            }
            pc += 1;
            continue
        }
        if (op === Opcode.RB) {
            if (stack[ps] === 0x00) {
                pc += 1;
                continue
            }
            let n = 1;
            for (; n !== 0;) {
                pc -= 1;
                if (src[pc] === Opcode.RB) {
                    n += 1;
                    continue
                }
                if (src[pc] === Opcode.LB) {
                    n -= 1;
                    continue
                }
            }
            pc += 1;
            continue
        }
    }
    return 0;
}
```

编译阶段分为两个部分, 分别是使用 minits 编译 TypeScript 源码得到 LLVM IR, 然后使用 Clang 编译 LLVM IR 得到可执行二进制文件. 最后实际测试一下我们编写的解释器, 测试代码是一段谢尔宾斯基三角形.

```sh
$ cd minits
$ ts-node src/index.ts build examples/brainfuck.ts -o brainfuck.ll
$ clang brainfuck.ll -o brainfuck

$ ./brainfuck ">++++[<++++++++>-]>++++++++[>++++<-]>>++>>>+>>>+<<<<<<<<<<[-[->+<]>[-<+>>>.<<]>>>[[->++++++++[>++++<-]>.<<[->+<]+>[->++++++++++<<+>]>.[-]>]]+<<<[-[->+<]+>[-<+>>>-[->+<]++>[-<->]<<<]<<<<]++++++++++.+++.[-]<]+++++"
```

```text
                                *
                               * *
                              *   *
                             * * * *
                            *       *
                           * *     * *
                          *   *   *   *
                         * * * * * * * *
                        *               *
                       * *             * *
                      *   *           *   *
                     * * * *         * * * *
                    *       *       *       *
                   * *     * *     * *     * *
                  *   *   *   *   *   *   *   *
                 * * * * * * * * * * * * * * * *
                *                               *
               * *                             * *
              *   *                           *   *
             * * * *                         * * * *
            *       *                       *       *
           * *     * *                     * *     * *
          *   *   *   *                   *   *   *   *
         * * * * * * * *                 * * * * * * * *
        *               *               *               *
       * *             * *             * *             * *
      *   *           *   *           *   *           *   *
     * * * *         * * * *         * * * *         * * * *
    *       *       *       *       *       *       *       *
   * *     * *     * *     * *     * *     * *     * *     * *
  *   *   *   *   *   *   *   *   *   *   *   *   *   *   *   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
```

它成功了!

至于为什么要以 Brainfuck 作为 minits 的 Hello World 项目, 其实很简单, 因为 Brainfuck 是一个最小的图灵机实现, 因此, minits 编译器目前是图灵完备的.

## 项目进度

- 已全部开源. 地址: [https://github.com/cryptape/minits](https://github.com/cryptape/minits)
- 已实现大部分 TypeScript 过程式编程语法
- 系统调用 syscall 初步完成
- 图灵完备
