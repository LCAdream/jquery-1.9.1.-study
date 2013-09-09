 // 匹配结尾是否有“{...}”或"[...]"
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
        // 匹配大写字母
        rmultiDash = /([A-Z])/g;

    /**
     * 内部用来设置/获取元素或对象的缓存方法
     *
     * @param elem DOM元素或者JS对象
     * @param name 缓存的标识符key
     * @param data 缓存数据
     * @param {Boolean} pvt 当为true时表示是私有性的，jq内部使用的
     */

    function internalData(elem, name, data, pvt /* Internal Use Only */ ) {
        // 判断该对象能不能绑定数据
        if (!jQuery.acceptData(elem)) {
            return;
        }

        var thisCache, ret,
            // expando是jQuery生成的随机ID
            internalKey = jQuery.expando,
            getByName = typeof name === 'string',
            // 我们不得不分别处理DOM元素和js对象，
            // 因为ie6/7的垃圾回收不能正确处理对DOM元素的对象引用
            isNode = elem.nodeType,
            // 只有DOM元素才需要全局jQuery.cache对象。
            // js对象数据直接指向该对象，垃圾回收可以自动处理
            cache = isNode ? jQuery.cache : elem,
            // 1. 如果是dom元素，返回dom元素通过expando对应的id（值可能为undefined）
            // 2. 如果是普通js对象，分两种情况：
            //    2.1 如果js对象存在通过expando对应的值，即代表有缓存数据，则立即返回expando作为id
            //    2.2 如果没有对应值，则代表没有缓存数据，此时返回undefined
            // 也就是说如果id不为空，那么肯定是有存储数据过的
            id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;

        // 当一个对象没有data的时候返回，避免多余工作
        if ((!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined) {
            return;
        }

        // 如果没有ID
        if (!id) {
            // 如果是DOM元素，给该节点绑定一个属性ID
            if (isNode) {
                elem[internalKey] = id = core_deletedIds.pop() || jQuery.guid++;
            } else {
                // 否则是对象则通过expando创建一个唯一ID
                id = internalKey;
            }
        }

        // 如果cache对象没有指定id属性
        if (!cache[id]) {
            cache[id] = {};

            // 当为JS对象时，为了避免被JSON.stringify序列化
            // 这里将toJSON方法设为空方法，这样就会返回空值
            if (!isNode) {
                cache[id].toJSON = jQuery.noop;
            }
        }


        // 如果name是对象或函数，当存在pvt将name浅复制给cache[id]，
        // 否则浅复制给cache[id].data
        if (typeof name === 'object' || typeof name === 'function') {
            if (pvt) {
                cache[id] = jQuery.extend(cache[id], name);
            } else {
                cache[id].data = jQuery.extend(cache[id].data, name);
            }
        }

        thisCache = cache[id];

        // 为了防止系统内部数据和用户自定义数据的key发生冲突，才将用户数据包在thisCache.data中，
        // pvt的意思是保持私有性，非私有性时对外提供data属性对象
        // 系统内部数据就是thisCache中
        if (!pvt) {
            if (!thisCache.data) {
                thisCache.data = {};
            }

            // 只对外开放thisCache.data属性值
            thisCache = thisCache.data;
        }

        // 如果data不为undefined，将data赋值给thisCache的通过驼峰式的name属性
        if (data !== undefined) {
            thisCache[jQuery.camelCase(name)] = data;
        }

        // 如果name是字符串
        if (getByName) {
            // 尝试获取thisCache的属性data
            ret = thisCache[name];

            // 如果ret为null或undefined，则尝试获取驼峰式的name属性data值
            if (ret == null) {
                ret = thisCache[jQuery.camelCase(name)];
            }
        } else {
            // 否则name为非字符串时，ret指向thisCache
            ret = thisCache;
        }

        return ret;
    }

    /**
     * 删除对应的缓存数据
     *
     * @param elem
     * @param name
     * @param pvt
     */

    function internalRemoveData(elem, name, pvt) {
        if (!jQuery.acceptData(elem)) {
            return;
        }

        var i, l, thisCache,
            isNode = elem.nodeType,
            cache = isNode ? jQuery.cache : elem,
            id = isNode ? elem[jQuery.expando] : jQuery.expando;

        // 如果没有缓存对象，返回
        if (!cache[id]) {
            return;
        }

        if (name) {
            thisCache = pvt ? cache[id] : cache[id].data;

            if (thisCache) {
                // 支持单个的key
                // 数组，多个key，如：[key1, key2, key3, ...]
                // 字符串，多个key，用空格隔开，如：'key1 key2 key3 ...'

                // 如果name不是数组类型，将name转换为数组类型
                if (!jQuery.isArray(name)) {
                    // 如果name是thisCache的一个属性key
                    if (name in thisCache) {
                        // 用数组保存
                        name = [name];
                    } else {
                        // 将name驼峰化
                        name = jQuery.camelCase(name);
                        // 此时若name是thisCache的一个属性key
                        if (name in thisCache) {
                            // 同样转换成数组
                            name = [name];
                        } else {
                            // 否则name是个多个空白分隔的字符串
                            name = name.split(' ');
                        }
                    }
                    // 如果是数组，将name数组各项驼峰化后追加到name数组里
                } else {
                    name = name.concat(jQuery.map(name, jQuery.camelCase));
                }

                // 遍历删除name数组里的各项key属性
                for (i = 0, l = name.length; i < l; i++) {
                    delete thisCache[name[i]];
                }

                // 如果pvt为true，检查thisCache是否为空的数据对象，如果不是直接退出函数
                // 如果pvt为false，判断thisCache是否为空对象，如果不是也是退出
                // 这里考虑到用户自定义或者其他私有受保护的属性
                if (!(pvt ? isEmptyDataObject : jQuery.isEmptyObject)(thisCache)) {
                    return;
                }
            }
        }

        // 如果pvt为false，即非私有性
        // 删除data属性值
        if (!pvt) {
            delete cache[id].data;

            // 同理，这时cache[id]还存在其他属性，退出
            if (!isEmptyDataObject(cache[id])) {
                return;
            }
        }

        // 如果是DOM元素，清除绑定在elem上的所有数据
        if (isNode) {
            jQuery.cleanData([elem], true);
        } else if (jQuery.support.deleteExpando || cache != cache.window) {
            // 如果支持删除绑定在对象上的expando属性或者cache非window对象
            // 只用delete就可以删除了
            delete cache[id];
        } else {
            // 其他情况就将属性设为null来清空缓存
            cache[id] = null;
        }
    }

    jQuery.extend({
        // 当是DOM元素的时候，使用$.cache来缓存数据
        cache: {},
        // 生成expando字符串
        expando: 'jQuery' + (core_version + Math.random()).replace(/\D/g, ''),
        // 以下情况不需要缓存
        noData: {
            'embed': true,
            'object': 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
            'applet': true
        },
        // 判断是否已有缓存数据
        hasData: function(elem) {
            elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando];
            return !!elem && !isEmptyDataObject(elem);
        },
        // 适配器模式
        data: function(elem, name, data) {
            return internalData(elem, name, data);
        },
        removeData: function(elem, name) {
            return internalRemoveData(elem, name);
        },
        // 私有方法
        _data: function(elem, name, data) {
            return internalData(elem, name, data, true);
        },
        _removeData: function(elem, name) {
            return internalRemoveData(elem, name, true);
        },
        // 判断元素或对象是否可以缓存
        acceptData: function(elem) {
            if (elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9) {
                return false;
            }

            var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()];

            return !noData || noData !== true && elem.getAttribute('classid') === noData;
        }
    });

    jQuery.fn.extend({
        data: function(key, value) {
            var attrs, name,
                elem = this[0],
                i = 0,
                data = null;

            // 如果key为undefined，说明key和value都为空，获取缓存data
            if (key === undefined) {
                // 如果有DOM元素
                if (this.length) {
                    // 获取以前保存在elem的data
                    data = jQuery.data(elem);

                    // 对于元素节点而言，数据可以来自两个地方：
                    // 1. jQuery.cache缓存中，之前手动存进去的，如：$dom.data('data1', value1);
                    // 2. 来自html标签的以data-开头的属性，之后该属性的数据也会被存储到jQuery.cache缓存中

                    // 如果元素节点的jQuery.cache['parsedAttrs']的值为null | false | undefined
                    // 说明elem的属性节点没有被解析过，下面就进行解析
                    if (elem.nodeType === 1 && !jQuery._data(elem, 'parsedAttrs')) {
                        // 获得elem的属性列表
                        attrs = elem.attributes;
                        for (; i < attrs.length; i++) {
                            // 该属性名称
                            name = attrs[i].name;

                            // 如果name有"data-"字符
                            if (!name.indexOf('data-')) {
                                // 将name驼峰化："dataCustom"
                                name = jQuery.camelCase(name.slice(5));

                                // 如果没有对应的缓存，就将html5的“data-”值（转换后）设置为相应的缓存值
                                dataAttr(elem, name, data[name]);
                            }
                        }
                        // 给缓存对象添加私有缓存，并把缓存值设置为true
                        // 用来标记已经解析过属性
                        jQuery._data(elem, 'parseAttrs', true);
                    }
                }

                return data;
            }

            // 如果key是对象，直接将其拷贝到jQuery.cache.data缓存对象里
            // 用来设置多个值的情况
            if (typeof key === 'object') {
                return this.each(function() {
                    jQuery.data(this, key);
                });
            }

            // 为每个元素执行函数后返回原始的元素集(this)
            return jQuery.access(this, function(value) {
                if (value === undefined) {
                    // 如果value未定义并且在jQuery.cache缓存中没有找到相应key的缓存，
                    // 然后再试图查看HTML5标签的“data-”属性是否被解析过了
                    return elem ? dataAttr(elem, key, jQuery.data(elem, key)) : null;
                }
            }, null, value, arguments.length > 1, null, true);
        },
        removeData: function(key) {
            return this.each(function() {
                jQuery.removeData(this, key);
            });
        }
    });

    // 处理元素节点中使用HTML5的“data-test”属性，并将其转换到相应的类型存储到jQuery.cache对象中

    function dataAttr(elem, key, data) {
        // 如果data为空且elem是元素节点，那么将HTML5的data-属性值转换为相应的类型
        if (data === undefined && elem.nodeType === 1) {
            // 反驼峰化
            var name = 'data-' + key.replace(rmultiDash, '-$1').toLowerCase();

            // 获取data字符串属性值
            data = elem.getAttribute(name);

            if (typeof data === 'string') {
                try {
                    // 布尔型
                    data = data === 'true' ? true :
                        data === 'false' ? false :
                    // null
                    data === 'null' ? null :
                    // +data只会将数字字符转换成数字,再加上""则会转换回字符串
                    // 这里是测试是否为数字
                    +data + '' === data ? +data :
                    // 数组或对象，并转换
                    rbrace.test(data) ? jQuery.parseJSON(data) :
                    // 其他类型
                    data;
                } catch (e) {}

                // 将格式化的数据存在jQuery.cache缓存。
                jQuery.data(elem, key, data);
            } else {
                // 如果该属性不存在，此时data为null，将其转换为undefined
                data = undefined;
            }
        }

        // 返回data-属性值(转换后)的类型
        return data;
    }

    // 检查缓存对象的数据是否为空

    function isEmptyDataObject(obj) {
        var name;
        for (name in obj) {
            // 如果公共data为空，那么私有对象也为空
            if (name === 'data' && jQuery.isEmptyObject(obj[name])) {
                continue;
            }
            if (name !== 'toJSON') {
                return false;
            }
        }

        return true;
    }
