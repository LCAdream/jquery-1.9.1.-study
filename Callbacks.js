var optionsCache = {};

    /*
     根据字符串格式的参数创建对象的键值对象，
     并且返回一个object变量存储已经存在的key参数，且value值为true,
     与optionsCache引用同一个对象
     */
    function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(core_rnotwhite) || [], function (_, flag) {
            object[flag] = true;
        });
        return object;
    }

    /*
     * Create a callback list using the following parameters:
     *
     *  options: an optional list of space-separated options that will change how
     *			the callback list behaves or a more traditional option object
     *
     * By default a callback list will act like an event callback list and can be
     * "fired" multiple times.
     *
     * Possible options:
     *
     *	once:			will ensure the callback list can only be fired once (like a Deferred)
     *	确保这个回调列表只执行一次(像一个递延 Deferred).
     *
     *	memory:			will keep track of previous values and will call any callback added after the list has been fired right away with the latest "memorized" values (like a Deferred)
     * 保持以前的值和将添加到这个列表的后面的最新的值立即执行调用任何回调 (像一个递延 Deferred).
     *
     *	unique:			will ensure a callback can only be added once (no duplicate in the list)
     * 确保一次只能添加一个回调(所以有没有在列表中的重复).
     *
     *	stopOnFalse:	interrupt callings when a callback returns false
     * 当一个回调返回false 时中断调用
     */
    jQuery.Callbacks = function (options) {
        // 将options字符串格式转换为对象格式
        // 先检查是否已有缓存
        options = typeof options === 'string' ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);

        var
        // 用来标识列表是否正在触发
            firing,
        // 上一次触发的值 （备忘列表）
            memory,
        // 列表已被触发的标识
            fired,
        // 回调列表的长度
            firingLength,
        // 当前触发的回调索引值
            firingIndex,
        // 第一个要触发的回调函数
        // (used internally by add and fireWith)
            firingStart,
        // 回调列表
            list = [],
        // 可重复的回调函数堆栈，用于控制触发回调时的参数列表
            stack = !options.once && [],
        // 触发回调方法，结束了当前队列，
        // 如果还有其他等待队列，则也触发
            fire = function (data) {
                // 如果参数memory为true，则记录data
                memory = options.memory && data;
                // 标记已触发
                fired = true;
                firingIndex = firingStart || 0;
                firingStart = 0;
                firingLength = list.length;
                // 标记正在触发回调
                firing = true;
                for (; list && firingIndex < firingLength; firingIndex++) {
                    if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                        // 阻止未来可能由于add所产生的回调
                        memory = false;
                        //由于参数stopOnFalse为true，所以当有回调函数返回值为false时退出循环
                        break;
                    }
                }
                // 标记回调结束
                firing = false;
                // 如果列表存在
                if (list) {
                    // 如果堆栈存在(非once的情况)
                    if (stack) {
                        // 如果堆栈不为空
                        if (stack.length) {
                            // 从堆栈头部取出，递归fire
                            fire(stack.shift());
                        }

                        // 否则，如果有记忆(memory && ((once && unique) || once))
                    } else if (memory) {
                        // 列表清空
                        list = [];

                        // 再否则阻止回调列表中的回调 (once || (once && unique))
                    } else {
                        self.disable();
                    }
                }
            },
        // 暴露在外的Callbacks对象
            self = {
                /**
                 * 回调列表中添加一个回调或回调的集合。
                 * {arguments} 一个函数，或者一个函数数组用来添加到回调列表
                 * @returns {*}
                 */
                add: function () {
                    if (list) {
                        // 首先存储当前列表长度
                        var start = list.length;
                        (function add(args) {
                            jQuery.each(args, function (_, arg) {
                                var type = jQuery.type(arg);
                                // 如果是函数
                                if (type === 'function') {
                                    // 确保是否可以重复或者没有该回调
                                    if (!options.unique || !self.has(arg)) {
                                        list.push(arg);
                                    }

                                    // 如果是类数组或对象
                                } else if (arg && arg.length && type !== 'string') {
                                    // 递归
                                    add(arg);
                                }
                            });
                        })(arguments);

                        // 如果正在回调就将回调时的循环结尾变成现有长度
                        if (firing) {
                            firingLength = list.length;

                            // 否则如果有memory，我们立刻调用
                            // 前面至少有一次fire，这样memory才会有值
                        } else if (memory) {
                            firingStart = start;
                            fire(memory);
                        }
                    }

                    return this;
                },
                /*
                 删除回调或回调回调列表的集合
                 */
                remove: function () {
                    if (list) {
                        jQuery.each(arguments, function (_, arg) {
                            var index;
                            // 找到arg在列表中的位置
                            while ((index = jQuery.inArray(arg, list, index)) > -1) {
                                // 根据得到的位置删除列表中的回调函数
                                list.splice(index, 1);

                                // 如果正在回调过程中，则调整循环的索引和长度
                                // 继续下次循环
                                if (firing) {
                                    if (index <= firingLength) {
                                        firingLength--;
                                    }
                                    if (index <= firingIndex) {
                                        firingIndex--;
                                    }
                                }
                            }
                        });
                    }

                    return this;
                },
                // 回调函数是否在列表中
                has: function (fn) {
                    return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
                },
                // 从列表中删除所有回调函数
                empty: function () {
                    list = [];
                    return this;
                },
                /*
                 禁用回调列表中的回调
                 */
                disable: function () {
                    list = stack = memory = undefined;
                    return this;
                },
                // 判断是否被禁用了
                disabled: function () {
                    return !list;
                },
                // 锁定列表
                lock: function () {
                    stack = undefined;
                    if (!memory) {
                        self.disable();
                    }
                    return this;
                },
                locked: function () {
                    return !stack;
                },
                /**
                 * 以给定的上下文和参数调用所有回调函数
                 * @param context 上下文
                 * @param args
                 * @returns {*}
                 */
                fireWith: function (context, args) {
                    args = args || [];
                    args = [context, args.slice ? args.slice() : args];

                    if (list && (!fired || stack)) {
                        // 如果正在回调
                        if (firing) {
                            // 将参数推入堆栈，等待当前回调结束再调用
                            stack.push(args);

                            // 否则直接调用
                        } else {
                            fire(args);
                        }
                    }

                    return this;
                },
                // 以给定的参数调用所有回调函数
                fire: function () {
                    self.fireWith(this, arguments);
                    return this;
                },
                // 回调列表是否被触发过
                fired: function () {
                    return !!fired;
                }
            };

        return self;
    };
