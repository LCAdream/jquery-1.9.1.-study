 /*
     不是用严格模式因为有的应用和Firefox追踪arguments.caller.callee时会出错
     */
    // 'use strict';
    var
    // 用在DOM加载完成时
    readyList,
        // document的jQuery对象的引用
        rootjQuery,
        // 用'typeof node.method'更胜于'node.emthod !== undefined'
        core_strundefined = typeof undefined,
        // 将全局对象保存到沙箱的局部变量中
        document = window.document,
        location = window.location,
        // 防止jQuery被重写
        _jQuery = window.jQuery,
        // 防止$被重写
        _$ = window.$,

        class2type = {},
        // 被删除的数据的缓存id
        core_deletedIds = [],
        core_version = '1.9.1',
        // 用变量保存核心方法
        core_concat = core_deletedIds.concat,
        core_push = core_deletedIds.push,
        core_slice = core_deletedIds.slice,
        core_indexOf = core_deletedIds.indexOf,
        core_toString = class2type.toString,
        core_hasOwn = class2type.hasOwnProperty,
        core_trim = core_version.trim,

        // 定义一个jQuery的局部拷贝
        // 同时也是一个构造函数
        jQuery = function(selector, context) {
            // 实例化init构造函数
            return new jQuery.fn.init(selector, context, rootjQuery);
        },

        // 匹配数字
        core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

        // 用来分割空白符
        core_rnotwhite = /\S+/g,

        // 去除两端空白符
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

        // 一个检查HTML字符串的简单方式
        // 一种情况是以“<”开头，
        // 另一种则是#id类型的
        rquickExpr = /^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,
        // 匹配单个标签
        rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

        // JSON正则
        rvalidchars = /^[\],:{}\s]*$/,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

        rmsPrefix = /^-ms-/,
        rdashAlpha = /-([\da-z])/gi,

        fcamelCase = function(all, letter) {
            return letter.toUpperCase();
        },
        // 载入完成的事件处理程序
        completed = function(event) {
            // 旧版本IE支持readState === 'complete'
            if (document.addEventListener || event.type === 'load' || document.readyState === 'complete') {
                detach();
                jQuery.ready();
            }
        },
        // 清除domready事件处理程序
        detach = function() {
            if (document.addEventListener) {
                document.removeEventListener('DOMContentLoaded', completed, false);
                window.removeEventListener('load', completed, false);
            } else {
                document.detachEvent('onreadystatechange', completed);
                window.detachEvent('onload', completed);
            }
        };

    /*
     将jQuery的prototype对象的引用指向jQuery.fn，
     当两者其中一个发生改变，另一个也会随之改变。
     jQuery.fn相当于是jQuery.prototype的简写
     */
    jQuery.fn = jQuery.prototype = {
        jQuery: core_version,
        constructor: jQuery,
        // 构造函数
        init: function(selector, context, rootjQuery) {
            var match, elem;
            // 处理 $(""), $(null), $(undefined), $(false)
            // 返回的是jQuery()方法实例
            if (!selector) {
                return this;
            }

            // 处理HTML字符串
            if (typeof selector === 'string') {
                if (selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' && selector.length >= 3) {
                    // 假设字符串以“<”开始且“>”结束
                    // 说明是HTML，略过正则检查
                    match = [null, selector, null];
                } else {
                    match = rquickExpr.exec(selector);
                }

                // 匹配HTML或者确保#id的上下文没被指定
                if (match && (match[1] || !context)) {
                    // 处理 $(html) -> $(array)
                    if (match[1]) {
                        context = context instanceof jQuery ? context[0] : context;

                        // 生成临时DOM片段并合并到this实例化对象中
                        jQuery.merge(this, jQuery.parseHTML(
                            match[1],
                            context && context.nodeType ? context.ownerDocument || context : document,
                            true
                        ));

                        // 处理 $(html, props)
                        if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                            for (match in context) {
                                //
                                if (jQuery.isFunction(this[match])) {
                                    this[match](context[match]);
                                } else {
                                    this.attr(match, context[match]);
                                }
                            }
                        }

                        return this;

                        // 处理 $(#id)
                    } else {
                        elem = document.getElementById(match[2]);

                        // 检查parentNode，因为Blackberry 4.6
                        // 返回的节点不在document中
                        if (elem && elem.parentNode) {
                            // 处理Opera返回的是name而不是id
                            if (elem.id !== match[2]) {
                                return rootjQuery.find(selector);
                            }

                            // 给this实例对象添加类似数组的属性
                            this.length = 1;
                            this[0] = elem;
                        }

                        // 再添加上下文，选择器属性，最后返回this，结束函数
                        this.context = document;
                        this.selector = selector;
                        return this;
                    }

                    // 处理 $(expr, [$(...)])
                } else if (!context || context.jQuery) {
                    // 返回jQuery.fn.find()获取的匹配元素，
                    // 该方法会使用jQuery.find方法(即Sizzle)，
                    // 然后通过jQuery.fn.pushStack和merge方法附加元素集及合并
                    return (context || rootjQuery).find(selector);

                    // 处理 $(expr, context)
                    // 即 $(context).find(expr)
                } else {
                    return this.constructor(context).find(selector);
                }

                // 处理$(DOMElement)
            } else if (selector.nodeType) {
                this.context = this[0] = selector;
                this.length = 1;
                return this;

                // 处理$(function)
                // jQuery(document) ready的简写
            } else if (jQuery.isFunction(selector)) {
                // 调用jQuery.fn.ready方法
                return rootjQuery.ready(selector);
            }

            // 处理$($(...))
            if (selector.selector !== undefined) {
                this.selector = selector.selector;
                this.context = selector.context;
            }

            // 返回伪数组对象
            return jQuery.makeArray(selector, this);
        },
        // 初始为空选择器
        selector: '',
        // jQuery 对象默认长度
        length: 0,
        // 匹配元素集的元素数量，与length相同
        size: function() {
            return this.length;
        },
        toArray: function() {
            return core_slice.call(this);
        },
        // 获取匹配元素集的滴n个元素或者
        // 获取全部匹配元素集的纯数组
        get: function(num) {
            return num == null ?
                this.toArray() :
                (num < 0 ? this[this.length + num] : this[num]);
        },
        // 使用传入的元素生成一个新的jQuery元素,（
        // 将元素数组合并到this对象中）
        // 并将这个对象的prevObject设置成当
        // 前这个实例对象(this).最后将这个新生成的jQuery对象返回
        // 把当前的jQuery对象缓存起来,
        // 以便以后使用end方法恢复这个jQuery对象
        pushStack: function(elems) {
            // 新建一个新的jQuery匹配元素集
            // this.constructor === jQuery
            // jQuery()返回的是this
            // 通过将elems数组merge到this中，使this也具有类似数组的特性，
            // 这就是使用选择器匹配到的元素被合并到this中的原因
            var ret = jQuery.merge(this.constructor(), elems);

            // 把旧对象保存在prevObject属性上
            ret.prevObject = this;
            ret.context = this.context;

            // 返回新的元素集
            return ret;
        },
        // 为每个元素集执行回调函数
        each: function(callback, args) {
            return jQuery.each(this, callback, args);
        },
        ready: function(fn) {
            jQuery.ready.promise().done(fn);

            return this;
        },
        /**
         * 将匹配的元素集合缩减为若干个元素。
         * 最后用这个集合重新构建一个jQuery对象,并将其返回.
         * 由于修改了匹配元素集合,所有使用pushStack
         * 来保留一个'恢复点',
         * 以便能使用jQuery.fn.end方法恢复到以前的状态.
         */
        slice: function() {
            return this.pushStack(core_slice.apply(this, arguments));
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        eq: function(i) {
            var len = this.length,
                j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },

        push: core_push,
        sort: [].sort,
        splice: [].splice
    };

    // 延迟实例化
    /*
     这里将init的构造函数原型指向jQuery.fn（即jQuery原型），
     当我们给jQuery.fn扩展方法或属性的时候，实际上就是给init.prototype,
     而jQuery()方法返回的是init构造函数的实例化对象，所以jQuery()就是其实例对象，
     具有了其方法和属性。
     */
    jQuery.fn.init.prototype = jQuery.fn;

    /*
     用一个或多个其他对象来扩展一个对象，返回被扩展的对象
     */
    // jQuery.extend(target, [object1], [objectN])
    // jQuery.extend([deep], target, object1, [objectN])
    // jQuery.fn.extend就是jQuery.fn.init.prototype.extend,
    // 所以this就是init的实例化对象，即jQuery(..)
    jQuery.extend = jQuery.fn.extend = function() {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // 处理 深拷贝的情况
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // 略过布尔值
            i = 2;
        }

        // target非对象或函数则强制转换为空对象
        if (typeof target !== 'object' && !jQuery.isFunction(target)) {
            target = {};
        }

        // 当只有一个参数或者深度拷贝的两个参数时说明是扩展jQuery或者jQuery.fn
        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // 避免循环递归, 不把自己的引用作为自己的一个成员
                    if (target === copy) {
                        continue;
                    }

                    // 递归深度拷贝的对象或数组
                    if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && jQuery.isArray(src) ? src : [];
                        } else {
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }

                        // 递归调用
                        target[name] = jQuery.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // 返回被修改的对象
        return target;
    };

    jQuery.extend({
        // 防止版本冲突，需要放在最前面
        noConflict: function(deep) {
            if (window.$ === jQuery) {
                window.$ = _$;
            }

            if (deep && window.jQuery === jQuery) {
                window.jQuery = _jQuery;
            }

            return jQuery;
        },
        // 用作DOM加载完毕
        isReady: false,
        // 一个计数器，用于跟踪在ready事件出发前的等待次数
        readyWait: 1,
        // 继续等待或触发
        holdReady: function(hold) {
            if (hold) {
                jQuery.readyWait++;
            } else {
                jQuery.ready(true);
            }
        },
        // 文档加载完毕句柄
        ready: function(wait) {
            // 当挂起或者已经ready时，退出
            if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
                return;
            }

            // 确保document.body存在
            if (!document.body) {
                return setTimeout(jQuery.ready);
            }

            // DOM已经ready
            jQuery.isReady = true;

            // If a normal DOM Ready event fired,
            // decrement, and wait if need be
            if (wait !== true && --jQuery.readyWait > 0) {
                return;
            }

            // If there are functions bound, to execute
            // 触发成功回调列表（readyList是一个deferred对象）
            readyList.resolveWith(document, [jQuery]);

            // Trigger any bound ready events
            if (jQuery.fn.trigger) {
                jQuery(document).trigger("ready").off("ready");
            }
        },
        isFunction: function(obj) {
            return jQuery.type(obj) === 'function';
        },
        isArray: Array.isArray || function(obj) {
            return jQuery.type(obj) === 'array';
        },
        isWindow: function(obj) {
            return obj != null && obj == obj.window;
        },
        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },
        /**
         * 检测obj的数据类型
         */
        type: function(obj) {
            if (obj == null) {
                return String(obj);
            }
            return typeof obj === 'object' || typeof obj === 'function' ?
                class2type[core_toString.call(obj)] || 'object' :
                typeof obj;
        },
        isPlainObject: function(obj) {
            // 必须是对象
            // 因为IE，我们不得不检查当前对象的constructor属性
            // 确保DOM节点与window对象不能通过
            if (!obj || jQuery.type(obj) !== 'object' || obj.nodeType || jQuery.isWindow(obj)) {
                return false;
            }

            try {
                if (obj.constructor && !core_hasOwn.call(obj, 'constructor') && !core_hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                    return false;
                }
            } catch (e) {
                // IE8,9会抛出错误（宿主对象）
                return false;
            }

            // 自身属性是可被枚举的
            // 如果最后一个属性是自身的，说明全部属性都是
            var key;
            for (key in obj) {}

            return key === undefined || core_hasOwn.call(obj, key);
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        error: function(msg) {
            throw new Error(msg);
        },
        /**
         *
         * @param data string of html
         * @param context (optional) If specified, the fragment will be created in this context, defaults to document
         * @param keepScripts (optional): If true, will include scripts passed in the html string
         */
        parseHTML: function(data, context, keepScripts) {
            if (!data || typeof data !== 'string') {
                return null;
            }
            if (typeof context === 'boolean') {
                keepScripts = context;
                context = false;
            }
            context = context || document;

            var parsed = rsingleTag.exec(data),
                scripts = !keepScripts && [];

            // Single tag
            if (parsed) {
                return [context.createElement(parsed[1])];
            }

            parsed = jQuery.buildFragment([data], context, scripts);
            if (scripts) {
                jQuery(scripts).remove();
            }
            return jQuery.merge([], parsed.childNodes);
        },
        /**
         * 接受一个JSON字符串，返回解析后的对象
         * @param data
         * @returns {*}
         */
        parseJSON: function(data) {
            // 优先使用原生JSON解析器
            if (window.JSON && window.JSON.parse) {
                return window.JSON.parse(data);
            }

            if (data === null) {
                return data;
            }

            if (typeof data === 'string') {
                // 确保没有首尾空白
                data = jQuery.trim(data);

                if (data) {
                    if (rvalidchars.test(data
                        .replace(rvalidescape, '@')
                        .replace(rvalidtokens, '}')
                        .replace(rvalidbraces, ''))) {
                        return (new Function('return ' + data))();
                    }
                }
            }

            jQuery.error('Invalid JSON: ' + data);
        },
        // 跨浏览器XML解析
        parseXML: function(data) {
            var xml, tmp;
            if (!data || typeof data !== 'string') {
                return null;
            }
            try {
                if (window.DOMParser) {
                    // standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, 'text/xml');
                } else {
                    // ie
                    xml = new ActiveXObject('Microsoft.XMLDOM');
                    xml.async = 'false';
                    xml.loadXML(data);
                }
            } catch (e) {
                xml = undefined;
            }
            if (!xml || !xml.documentElement || xml.getElementsByTagName('parsererror').length) {
                jQuery.error('Invalid XML: ' + data);
            }
            return xml;
        },
        noop: function() {},
        // 在全局环境中运行字符串脚本
        globalEval: function(data) {
            // IE用execScript
            // 使用自执行匿名函数使eval的上下文指向window而不是jQuery（Firefox中）
            if (data && jQuery.trim(data)) {
                (window.execScript || function(data) {
                    window['eval'].call(window, data);
                })(data);
            }
        },
        // Convert dashed to camelCase; used by the css and data modules
        // Microsoft forgot to hump their vendor prefix (#9572)
        camelCase: function(string) {
            return string.replace(rmsPrefix, 'ms-').replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        /**
         * 通用遍历方法，可用于遍历对象和数组
         */
        each: function(obj, callback, args) {
            var value,
                i = 0,
                length = obj.length,
                isArray = isArraylike(obj);

            if (args) {
                if (isArray) {
                    for (; i < length; i++) {
                        value = callback.apply(obj[i], args);

                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.apply(obj[i], args);

                        if (value === false) {
                            break;
                        }
                    }
                }
            } else {
                if (isArray) {
                    for (; i < length; i++) {
                        value = callback.call(obj[i], i, obj[i]);

                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.call(obj[i], i, obj[i]);

                        if (value === false) {
                            break;
                        }
                    }
                }
            }

            return obj;
        },
        /**
         * 去掉字符串起始和结尾的空格
         */
        trim: core_trim && !core_trim.call('\uFEFF\xA0') ? function(text) {
            return text == null ?
                '' :
                core_trim.call(text);
        } : function(text) {
            return text == null ?
                '' :
                (text + '').replace(rtrim, '');
        },
        // 将类数组对象转换为数组对象。
        makeArray: function(arr, results) {
            var ret = results || [];

            if (arr != null) {
                if (isArraylike(Object(arr))) {
                    jQuery.merge(ret,
                        typeof arr === 'string' ?
                        [arr] : arr
                    );
                } else {
                    core_push.call(ret, arr);
                }
            }

            return ret;
        },
        /**
         * 确定第一个参数在数组中的位置，从0开始计数(如果没有找到则返回 -1 )。
         * @param elem 用于在数组中查找是否存在
         * @param arr 待处理数组
         * @param i 用来搜索数组队列，默认值为0
         * @returns {*}
         */
        inArray: function(elem, arr, i) {
            var len;
            if (arr) {
                if (core_indexOf) {
                    return core_indexOf.call(arr, elem, i);
                }

                len = arr.length;
                i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

                for (; i < len; i++) {
                    if (i in arr && arr[i] === elem) {
                        return i;
                    }
                }
            }

            return -1;
        },
        /**
         * 合并两个数组(或类数组)
         * 返回合并后的第一个内容
         */
        merge: function(first, second) {
            var l = second.length,
                i = first.length,
                j = 0;

            if (typeof l === 'number') {
                for (; j < l; j++) {
                    first[i++] = second[j];
                }
            } else {
                while (second[j] !== undefined) {
                    first[i++] = second[j++];
                }
            }

            first.length = i;

            return first;
        },
        /**
         * 使用过滤函数过滤数组元素
         * @param elems 待过滤数组
         * @param callback 此函数将处理数组每个元素。第一个参数为当前元素，第二个参数而元素索引值。此函数应返回一个布尔值
         * @param inv 如果 "invert" 为 false 或为设置，则函数返回数组中由过滤函数返回 true 的元素，当"invert" 为 true，则返回过滤函数中返回 false 的元素集
         */
        grep: function(elems, callback, inv) {
            var retVal,
                ret = [],
                i = 0,
                length = elems.length;
            inv = !! inv;

            for (; i < length; i++) {
                retVal = !! callback(elems[i], i);
                if (inv !== retVal) {
                    ret.push(elems[i]);
                }
            }

            return ret;
        },
        /**
         * 将一个数组中的元素转换到另一个数组中
         * 作为参数的转换函数会为每个数组元素调用，而且会给这个转换函数传递一个表示被转换的元素作为参数。转换函数可以返回转换后的值、null（删除数组中的项目）或一个包含值的数组，并扩展至原始数组中
         */
        map: function(elems, callback, arg) {
            var value,
                i = 0,
                length = elems.length,
                isArray = isArraylike(elems),
                ret = [];

            // 遍历数组
            if (isArray) {
                for (; i < length; i++) {
                    value = callback(elems[i], i, arg);

                    if (value != null) {
                        ret[ret.length] = value;
                    }
                }
                // 遍历对象
            } else {
                for (i in elems) {
                    value = callback(elems[i], i, arg);

                    if (value != null) {
                        ret[ret.length] = value;
                    }
                }
            }

            // 拼合任何嵌套数组
            return core_concat.apply([], ret);
        },
        guid: 1,
        /**
         * 函数绑定
         * @example 两者效果一样：
         *   $("#test").click( jQuery.proxy( obj, "test" ) );
         *   $("#test").click( jQuery.proxy( obj.test, obj ) );
         */
        proxy: function(fn, context) {
            var args, proxy, tmp;

            if (typeof context === 'string') {
                tmp = fn[context];
                context = fn;
                fn = tmp;
            }

            if (!jQuery.isFunction(fn)) {
                return undefined;
            }

            // 模拟bind
            // 将第二个参数后面的所有参数转换成数组
            args = core_slice.call(arguments, 2);
            proxy = function() {
                return fn.apply(context || this, args.concat(core_slice.call(arguments)));
            };

            // 设置一个唯一的guid属性，以便我们可以删除绑定
            proxy.guid = fn.guid = fn.guid || jQuery.guid++;

            return proxy;
        },
        /**
         * 多功能函数，读取或设置集合的属性值；值为函数时会被执行
         * elems 元素集 chainable 是否链式操作
         */
        access: function(elems, fn, key, value, chainable, emptyGet, raw) {
            var i = 0,
                length = elems.length,
                bulk = key == null;

            // 如果key是对象，迭代设置多个值
            if (jQuery.type(key) === 'object') {
                chainable = true;
                for (i in key) {
                    jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);
                }
                // 否则， 设置一个值
            } else if (value !== undefined) {
                // 当value非空时，设置为链式操作
                chainable = true;

                // 当value不是函数时，将raw设为true，
                // 用来标识value的值
                if (!jQuery.isFunction(value)) {
                    raw = true;
                }

                // 当key==null为true时
                if (bulk) {
                    // 如果value不是函数，则立刻执行fn方法,并将fn设置为空，用来阻止下面条件的触发
                    if (raw) {
                        fn.call(elems, value);
                        fn = null;
                        // 如果value是函数，则修改fn的参数
                    } else {
                        bulk = fn;
                        fn = function(elem, key, value) {
                            return bulk.call(jQuery(elem), value);
                        };
                    }
                }

                // 此时如果fn仍为非空
                if (fn) {
                    // 遍历元素集，每次都运行fn方法
                    for (; i < length; i++) {
                        fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
                    }
                }
            }

            // 如果是链式操作就返回元素集，
            // 否则， 当bulk为true时，即
            // key==null或者key==null且value的类型是函数时，
            // 返回fn运行后的值，
            // bulk其他值的情况：
            // 如果存在elems元素集，返回fn运行后的值，
            // 否则就返回emptyGet
            return chainable ? elems :
                bulk ?
                fn.call(elems) :
                length ? fn(elems[0], key) : emptyGet;
        },
        now: function() {
            return (new Date()).getTime();
        }
    });

    jQuery.ready.promise = function(obj) {
        if (!readyList) {
            readyList = jQuery.Deferred();

            if (document.readyState === 'complete') {
                setTimeout(jQuery.ready);
            } else if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', completed, false);
                window.addEventListener('load', completed, false);
            } else {
                document.attachEvent('onreadystatechange', completed);

                window.attachEvent('onload', completed);

                var top = false;
                try {
                    top = window.frameElement == null && document.documentElement;
                } catch (e) {}

                if (top && top.doScroll) {
                    (function doScrollCheck() {
                        if (!jQuery.isReady) {
                            try {
                                top.doScroll('left');
                            } catch (e) {
                                return setTimeout(doScrollCheck, 50);
                            }

                            detach();

                            jQuery.ready();
                        }
                    })();
                }
            }
        }

        return readyList.promise(obj);
    };

    jQuery.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function(i, name) {
        class2type['[object ' + name + ']'] = name.toLowerCase();
    });

    // 判断是否具有数组特性
    // 包括纯数组，伪数组以及对象模拟的数组

    function isArraylike(obj) {
        var length = obj.length,
            type = jQuery.type(obj);

        // 如果是window对象返回false
        if (jQuery.isWindow(obj)) {
            return false;
        }

        // 如果是nodeList伪数组，返回true
        if (obj.nodeType === 1 && length) {
            return true;
        }

        // 当是数组返回true，
        // 不能包括函数类型且如果是用对象模拟的数组类型也可以通过
        // 其中必须有length属性和第length-1个属性也是自身属性
        // 类似鸭式辩型
        return type === 'array' || type !== 'function' &&
            (length === 0 || typeof length === 'number' && length > 0 && (length - 1) in obj);
    }

    // jQuery 根对象
    rootjQuery = jQuery(document);
