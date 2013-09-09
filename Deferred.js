jQuery.extend({
        Deferred: function(func) {
            // 数据集中管理
            var tuples = [
                ['resolve', 'done', jQuery.Callbacks('once memory'), 'resolved'],
                ['reject', 'fail', jQuery.Callbacks('once memory'), 'rejected'],
                ['notify', 'progress', jQuery.Callbacks('memory')]
            ],
                state = 'pending',
                promise = {
                    /**
                     * 返回一个字符串，代表Deferred（延迟）对象的当前状态
                     *
                     * @returns {string} "pending"( Deferred对象是尚未完成状态) || "rejected"(Deferred对象是在被拒绝的状态) || "resolved"(Deferred对象是在解决状态)
                     */
                    state: function() {
                        return state;
                    },
                    /**
                     * 当Deferred（延迟）对象解决或拒绝时，调用添加处理程序
                     * 即如果调用后不管成功还是失败，都会执行该回调
                     */
                    always: function() {
                        deferred.done(arguments).fail(arguments);
                        return this;
                    },
                    /**
                     * 
                     * then方法会返回一个新的Deferred对象
                     * 如果then方法的参数是deferred对象，
                     * 上一链的旧deferred会调用[ done | fail | progress ]方法注册回调，该回调内容是：执行when方法对应的参数回调（fnDone, fnFail, fnProgress）。
                     * 1）如果参数回调执行后返回的结果是一个deferred对象，我们就给该deferred对象相应的回调列表添加回调，该回调是触发when方法返回的新deferred对象的成功，失败，处理中（done，fail，progress）的回调列表中的所有回调。
                     * 当我们再给then方法进行链式地添加回调操作（done,fail,progress,always,then）时，就是给新deferred对象注册回调到相应的回调列表。
                     * 如果我们then参数fnDoneDefer, fnFailDefer, fnProgressDefer得到了解决，就会执行后面链式添加回调操作中的参数函数。
                     * 
                     * 2）如果参数回调执行后返回的结果不是deferred对象，就立刻触发新deferred对象相应回调列表的所有回调。
                     * 当我们再给then方法进行链式地添加回调操作（done,fail,progress,always,then）时，就会立刻触发我们添加的相应的回调。
                     * 
                     * 可以多个then连续使用，此功能相当于顺序调用异步回调。
                     *
                     * @example
                     * $.ajax({
                           url: 't2.html',
                           dataType: 'html',
                           data: {
                              d: 4
                           }
                        }).then(function(){
                            console.log('success');
                        },function(){
                            console.log('failed');
                        }).then(function(){
                            console.log('second');
                            return $.ajax({
                                url: 'jquery-1.9.1.js',
                                dataType: 'script'
                            });
                        }, function(){
                            console.log('second f');
                            return $.ajax({
                                url: 'jquery-1.9.1.js',
                                dataType: 'script'
                            });
                        }).then(function(){
                            console.log('success2');
                        },function(){
                            console.log('failed2');
                        });
                        @notification 当前面的deferred没有被解决即失败，后面的就会执行失败回调，如果then方法中传了两个可返回deferred对象的回调，上一个deferred失败就会触发第二个返回的deferred，如果只传了一个返回deferred的回调，则后面都会报错。后面的失败却不会影响前面的。
                     * @returns {*}
                     */
                    then: function( /* fnDone, fnFail, fnProgress */ ) {
                        var fns = arguments;
                        // 返回一个新的Deferred对象的promise对象
                        return jQuery.Deferred(function(newDefer) {
                            // newDefer其实就是一个新的deferred对象
                            jQuery.each(tuples, function(i, tuple) {
                                var
                                // "resolve" | "reject" | "notify"
                                action = tuple[0],
                                    fn = jQuery.isFunction(fns[i]) && fns[i];

                                // 运行deferred[ done | fail | progress ]方法，
                                // 将回调函数添加到相应回调列表
                                deferred[tuple[1]](function() {
                                    // 执行当前参数回调并获取其返回值
                                    var returned = fn && fn.apply(this, arguments);
                                    // 如果returned有返回值且有promise方法，
                                    // 说明是一个deferred对象，
                                    // 则将newDefer对象的三个回调列表的触发器添加到returned对象的相应列表中
                                    if (returned && jQuery.isFunction(returned.promise)) {
                                        returned.promise().
                                        done(newDefer.resolve).
                                        fail(newDefer.reject).
                                        progress(newDefer.notify);
                                    } else {
                                        // 否则就触发newDefer对象的相应回调列表触发器
                                        // 同时确保this指向newDefer的promise对象
                                        // 要是这个newDefer有内容触发需要再在后面将回调添加到响应列表中，
                                        // 所以这个是执行下一个deferred的操作
                                        newDefer[action + 'With'](this === promise ? newDefer.promise() : this, fn ? [returned] : arguments);
                                    }
                                });
                            });
                            // 销毁对象
                            fns = null;
                        }).promise();
                    },
                    /*
                     如果有参数返回参数对象继承了promise对象属性的对象，
                     否则返回该Deferred对象中的promise对象
                     */
                    promise: function(obj) {
                        return obj != null ? jQuery.extend(obj, promise) : promise;
                    }
                },
                deferred = {};

            // 备份原始对象
            promise.pipe = promise.then;

            // 给deferred对象添加方法
            jQuery.each(tuples, function(i, tuple) {
                var
                // jQuery.Callbacks()
                list = tuple[2],
                    // "resolved" or "rejected"
                    stateString = tuple[3];

                // 给promise对象添加"done", "fail", "progress"方法
                // 当使用这些方法实际上就是给所在回调列表添加回调
                // 注意：list.add方法里面的this已经指向了promise
                // 因此可以deferred.done(arguments).fail(arguments)的链式操作
                promise[tuple[1]] = list.add;

                // 如果是"resolved"或者"rejected"
                if (stateString) {
                    // 给相应的回调列表添加以下三个回调函数，回调列表状态机
                    // 第一个是将异步队列状态传给state变量
                    // 第二个方法是将其他状态的列表禁用
                    // 第三个是锁定“progress”的回调列表
                    // 例如是“resolved”则禁用“rejected”的回调列表，
                    // 锁定“progress”的回调列表
                    list.add(function() {
                        state = stateString;
                    }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
                }

                // 添加deferred[ resolve | reject | notify ]方法
                deferred[tuple[0]] = function() {
                    // 实际上是运行deferred[ resolveWith | rejectWith | notifyWith ]方法
                    // 同时确保上下文是deferred对象
                    deferred[tuple[0] + 'With'](this === deferred ? promise : this, arguments);
                    // 链式操作
                    return this;
                };
                // 添加deferred[ resolveWith | rejectWith | notifyWith ]方法
                // 这些方法就是所在回调列表的fireWith方法
                // 通过给定上下文触发列表所有回调函数
                deferred[tuple[0] + 'With'] = list.fireWith;
            });

            // 给deferred对象添加promise对象的所有属性
            promise.promise(deferred);

            if (func) {
                // 运行该函数，this和arguments都是deferred对象
                func.call(deferred, deferred);
            }

            // 返回deferred对象
            // 该对象现有 [ resolve | reject | notify | resolveWith | rejectWith | notifyWith ]
            // 以及从promise继承的 [ done | fail | then | promise | pipe | always | progress | state ]
            // 这些方法
            return deferred;
        },
        /**
         * 对多个deferred对象进行并行化操作，当所有deferred对象都得到解决就执行后面添加的相应回调。
         */
        when: function(subordinate /* , ..., subordinateN */ ) {
            var i = 0,
                // 把arguments转换成数组
                resolveValues = core_slice.call(arguments),
                // 参数的长度
                length = resolveValues.length,
                // 如果长度不等于1或者第一个参数是deferred对象，
                // 返回true，最后返回正常长度
                // 否则返回0
                // 说明参数必须是deferred对象，而remaining是记录执行剩余的长度
                remaining = length !== 1 || (subordinate && jQuery.isFunction(subordinate.promise)) ? length : 0,
                // 主要的Deferred对象。如果resolveValues只有一个Deferred对象
                // 使用该对象，否则新建一个Deferred对象
                deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
                // 当为resolve或者progress的情况时的处理函数
                updateFunc = function(i, contexts, values) {
                    return function(value) {
                        contexts[i] = this;
                        // values是when参数数组或者progressValues
                        // 如果参数大于一，values[i]为参数数组
                        // 以$.ajax为例，$.ajax的解决回调的参数values[i] = [response, 'success', jqXHR]
                        // 所以在下次我们给列表添加回调时，回调的参数类似于这样[firsetAjaxCallbackArgs, secondAjaxCallbackArgs]
                        // firsetAjaxCallbackArgs为第一个ajax的[resposne, 'success', jqXHR]
                        // 以此类推
                        /**
                         * $.when(
                               $.ajax({
                                url: 't2.html'
                            }),
                             $.ajax({
                                url: 'jquery-1.9.1-study.js'
                            })
                            ).then(function(                    FirstAjaxSuccessCallbackArgs, SecondAjaxSuccessCallbackArgs){
                                 console.log('success');
                            }, function(){
                                console.log('failed');
                            });
                         */
                        values[i] = arguments.length > 1 ? core_slice.call(arguments) : value;
                        // progress
                        if (values === progressValues) {
                            deferred.notifyWith(contexts, values);

                            // 将remaining减一，说明该when参数的deferred已经回调注册完毕
                            // 如果这时remaining小于等于0，
                            // 说明我们正在解决最后一个参数deferred，
                            // 就立刻触发deferred的回调，注意这里的deferred不是参数的deferred
                            // 这里就达到了并行的效果了
                        } else if (!(--remaining)) {
                            // deferred需要在外部给回调列表注册回调
                            // resolve
                            deferred.resolveWith(contexts, values);
                        }
                    };
                },
                progressValues, progressContexts, resolveContexts;

            // 当至少有两个Deferred对象时
            if (length > 1) {
                progressValues = new Array(length);
                progressContexts = new Array(length);
                resolveContexts = new Array(length);
                for (; i < length; i++) {
                    // 遍历，如果是deferred对象，给when参数中当前的deferred的回调列表添加回调
                    if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
                        resolveValues[i].promise()
                            .done(updateFunc(i, resolveContexts, resolveValues))
                            .fail(deferred.reject)
                            .progress(updateFunc(i, progressContexts, progressValues));
                    } else {
                        // 否则不是deferred对象直接将remaining的长度-1
                        --remaining;
                    }
                }
            }

            // 当remaining为0的时候，也就是length===1或者when参数没有deferred对象时，立刻触发
            if (!remaining) {
                deferred.resolveWith(resolveContexts, resolveValues);
            }

            // 返回promise对象
            return deferred.promise();
        }
    });
