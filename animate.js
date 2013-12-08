var fxNow,
        // 使用一个ID来执行动画setInterval 
        timerId,
        rfxtypes = /^(?:toggle|show|hide)$/,
        // eg: +=30.5px
        // 执行exec匹配["+=30.5px", "+", "30.5", "px"]
        rfxnum = new RegExp('^(?:([+-])=|)(' + core_pnum + ')([a-z%]*)$', 'i'),
        // 以“queueHooks”结尾
        rrun = /queueHooks$/,
        animationPrefilters = [defaultPrefilter],
        tweeners = {
            // 在动画前再次对动画参数做调整
            '*': [
                function(prop, value) {
                    var end, unit,
                        // this指向animation对象
                        // 返回一个Tween构造函数实例
                        tween = this.createTween(prop, value),
                        // eg:["+=30.5px", "+", "30.5", "px"]
                        parts = rfxnum.exec(value),
                        // 计算当前属性样式值
                        target = tween.cur(),
                        start = +target || 0,
                        scale = 1,
                        maxIterations = 20;

                    if (parts) {
                        // 数值
                        end = +parts[2];
                        // 单位
                        // jQuery.cssNumber里面的值是不需要单位的
                        unit = parts[3] || (jQuery.cssNumber[prop] ? '' : 'px');

                        // We need to compute starting value
                        // 我们需要计算开始值
                        if (unit !== 'px' && start) {
                            // Iteratively approximate from a nonzero starting point
                            // Prefer the current property, because this process will be trivial if it uses the same units
                            // Fallback to end or a simple constant
                            // 尝试从元素样式中获取开始值
                            start = jQuery.css(tween.elem, prop, true) || end || 1;

                            do {
                                // If previos iteration zeroed out, double until we get *something*
                                // Use a string for doubling factor so we don't accidentally see scale as unchanged below
                                scale = scale || '.5';

                                // Adjust and apply
                                start = start / scale;
                                jQuery.style(tween.elem, prop, start + unit);

                                // Update scale, tolerating zero or NaN from tween.cur()
                                // And breaking the loop if scale is unchanged or perfect. or if we've just had enough
                            } while (scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);
                        }

                        tween.unit = unit;
                        tween.start = start;
                        // If a +=/-= token was provided, we're doing a relative animation
                        tween.end = parts[1] ? start + (parts[1] + 1) * end : end;
                    }
                    return tween;
                }
            ]
        };

    // Animations created synchronous will run synchronously
    // TODO
    // 返回一个时间戳，然后用setTimeout延时将fxNow设置为undefined

    function createFxNow() {
        setTimeout(function() {
            fxNow = undefined;
        });
        return (fxNow = jQuery.now());
    }

    function createTweens(animation, props) {
        // 遍历props动画属性对象，并执行回调
        jQuery.each(props, function(prop, value) {
            // 如果tweeners[prop]数组存在，将它和tweeners['*']连接
            var collection = (tweeners[prop] || []).concat(tweeners['*']),
                index = 0,
                length = collection.length;

            // 遍历函数数组
            for (; index < length; index++) {
                // 如果该函数有返回值，且==true，退出函数
                if (collection[index].call(animation, prop, value)) {
                    // We're done with this property
                    return;
                }
            }
        });
    }

    function Animation(elem, properties, options) {
        var result, stopped, index = 0,
            length = animationPrefilters.length,
            // deferred无论成功还是失败都会删除elem元素
            deferred = jQuery.Deferred().always(function() {
                // don't match elem in the :animated selector
                // 在“:animated”选择器中不会匹配到它们
                delete tick.elem;
            }),
            tick = function() {
                if (stopped) {
                    return false;
                }
                var // 计算当前动画时间戳
                    currentTime = fxNow || createFxNow(),
                    // 结束时间减当前时间，计算出剩余时间
                    remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
                    // archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
                    // 剩余时间百分比
                    temp = remaining / animation.duration || 0,
                    // 已执行百分比
                    percent = 1 - temp,
                    index = 0,
                    // 动画属性对应的tweens
                    length = animation.tweens.length;

                // 遍历tweens，并执行对应的run方法，将已执行百分比通过传参传入
                // run方法通过缓动算法计算出样式值，然后应用到元素上
                for (; index < length; index++) {
                    animation.tweens[index].run(percent);
                }

                // 触发notify回调列表
                deferred.notifyWith(elem, [animation, percent, remaining]);

                // 如果执行进度为完成且tweens数组有元素
                // 返回剩余时间
                if (percent < 1 && length) {
                    return remaining;
                } else {
                    // 否则表示已完成，触发resolve回调列表，
                    // 并返回false值
                    deferred.resolveWith(elem, [animation]);
                    return false;
                }
            },
            animation = deferred.promise({
                // 动画元素
                elem: elem,
                // 需要动画的属性
                props: jQuery.extend({}, properties),
                // 给optall添加specialEasing属性对象
                opts: jQuery.extend(true, {
                    specialEasing: {}
                }, options),
                // 原始动画属性
                originalProperties: properties,
                // 原始的配置项optall
                originalOptions: options,
                // 动画开始时间，使用当前时间的毫秒数
                startTime: fxNow || createFxNow(),
                // 动画时长
                duration: options.duration,
                tweens: [],
                createTween: function(prop, end) {
                    var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                    animation.tweens.push(tween);
                    return tween;
                },
                stop: function(gotoEnd) {
                    var index = 0,
                        // if we are going to the end, we want to run all the tweens
                        // otherwise we skip this part
                        length = gotoEnd ? animation.tweens.length : 0;
                    if (stopped) {
                        return this;
                    }
                    stopped = true;
                    for (; index < length; index++) {
                        animation.tweens[index].run(1);
                    }

                    // resolve when we played the last frame
                    // otherwise, reject
                    if (gotoEnd) {
                        deferred.resolveWith(elem, [animation, gotoEnd]);
                    } else {
                        deferred.rejectWith(elem, [animation, gotoEnd]);
                    }
                    return this;
                }
            }),
            props = animation.props;

        /*
        将是动画属性转换成驼峰式，并设置其相应的缓动属性，
        如果存在cssHooks钩子对象，则需要另作一番处理
         */
        propFilter(props, animation.opts.specialEasing);

        // 遍历动画预过滤器，并执行回调
        // 其中defaultPrefilter为默认预过滤器，每次都会执行
        for (; index < length; index++) {
            result = animationPrefilters[index].call(animation, elem, props, animation.opts);
            // 如果有返回值，退出函数
            if (result) {
                return result;
            }
        }

        createTweens(animation, props);

        if (jQuery.isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
        }

        // 开始执行动画
        jQuery.fx.timer(
            jQuery.extend(tick, {
                elem: elem,
                anim: animation,
                queue: animation.opts.queue
            }));

        // attach callbacks from options
        return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    }

    /**
     * 动画属性调整与过滤
     * 
     * 将是动画属性转换成驼峰式，并设置其相应的缓动属性，
     * 如果存在cssHooks钩子对象，则需要另作一番处理
     * @param  {[type]} props         [需要动画的属性]
     * @param  {[type]} specialEasing [description]
     * @return {[type]}               [description]
     */
    function propFilter(props, specialEasing) {
        var value, name, index, easing, hooks;

        // camelCase, specialEasing and expand cssHook pass
        for (index in props) {
            // 驼峰化属性
            name = jQuery.camelCase(index);
            // TODO
            easing = specialEasing[name];
            // 属性值
            value = props[index];
            // 如果属性值是数组
            if (jQuery.isArray(value)) {
                easing = value[1];
                // 取数组第一个元素为属性值
                value = props[index] = value[0];
            }

            // 如果属性名精过驼峰化后，删除原有的属性名，减少占用内存
            if (index !== name) {
                props[name] = value;
                delete props[index];
            }

            // 处理兼容性的钩子对象
            hooks = jQuery.cssHooks[name];
            // 如果存在钩子对象且有expand属性
            if (hooks && "expand" in hooks) {
                // 返回expand处理后的value值
                // 该类型是一个对象，属性是
                // (margin|padding|borderWidth)(Top|Right|Bottom|Left)
                value = hooks.expand(value);

                // 我们已经不需要name属性了
                delete props[name];

                // not quite $.extend, this wont overwrite keys already present.
                // also - reusing 'index' from above because we have the correct "name"
                for (index in value) {
                    // 如果props没有(margin|padding|borderWidth)(Top|Right|Bottom|Left)属性
                    // 添加该属性和对应的值，并设置缓动属性
                    if (!(index in props)) {
                        props[index] = value[index];
                        specialEasing[index] = easing;
                    }
                }
            } else {
                // 没有钩子对象就直接设置其为缓动属性
                specialEasing[name] = easing;
            }
        }
    }

    jQuery.Animation = jQuery.extend(Animation, {

        tweener: function(props, callback) {
            if (jQuery.isFunction(props)) {
                callback = props;
                props = ["*"];
            } else {
                props = props.split(" ");
            }

            var prop, index = 0,
                length = props.length;

            for (; index < length; index++) {
                prop = props[index];
                tweeners[prop] = tweeners[prop] || [];
                tweeners[prop].unshift(callback);
            }
        },
        // 为animationPrefilters回调数组添加回调
        prefilter: function(callback, prepend) {
            if (prepend) {
                animationPrefilters.unshift(callback);
            } else {
                animationPrefilters.push(callback);
            }
        }
    });

    /**
     * 动画预处理
     * 添加fx队列缓存（没有的话），对动画属性“width/height，overflow”， 值有“toggle/show/hide”采取的一些措施
     * 
     * @param  {[type]} elem  [动画元素]
     * @param  {[type]} props [动画属性]
     * @param  {[type]} opts  [动画配置项]
     * @return {[type]}       [description]
     */
    function defaultPrefilter(elem, props, opts) { /*jshint validthis:true */
        var prop, index, length, value, dataShow, toggle, tween, hooks, oldfire,
            // animation对象（同时是个deferred对象）
            anim = this,
            style = elem.style,
            orig = {},
            handled = [],
            hidden = elem.nodeType && isHidden(elem);

        // handle queue: false promises
        if (!opts.queue) {
            // 获取或者设置动画队列钩子
            hooks = jQuery._queueHooks(elem, "fx");
            // 如果hooks.unqueued为null/undefined
            if (hooks.unqueued == null) {
                hooks.unqueued = 0;
                // 获取旧的empty回调对象
                // 用于清除动画队列缓存
                oldfire = hooks.empty.fire;
                // 装饰，添加新的职责
                hooks.empty.fire = function() {
                    // 当hooks.unqueued为0时执行清除动画队列缓存
                    if (!hooks.unqueued) {
                        oldfire();
                    }
                };
            }
            hooks.unqueued++;

            anim.always(function() {
                // doing this makes sure that the complete handler will be called
                // before this completes
                // 延迟处理，确保该回调完成才调用下面回调
                anim.always(function() {
                    hooks.unqueued--;
                    // 如果动画队列没有元素了，清空缓存
                    if (!jQuery.queue(elem, "fx").length) {
                        hooks.empty.fire();
                    }
                });
            });
        }

        // height/width overflow pass
        // 对width或height的DOM元素的动画前的处理
        if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
            // Make sure that nothing sneaks out
            // Record all 3 overflow attributes because IE does not
            // change the overflow attribute when overflowX and
            // overflowY are set to the same value
            // IE不会改变overflow属性当iverflowX和overflowY的值相同时。
            // 因此我们要记录三个overflow的属性
            opts.overflow = [style.overflow, style.overflowX, style.overflowY];

            // Set display property to inline-block for height/width
            // animations on inline elements that are having width/height animated
            // 将inline元素（非浮动的）设置为inline-block或者BFC(iE6/7)，使它们的width和height可改变
            if (jQuery.css(elem, "display") === "inline" && jQuery.css(elem, "float") === "none") {

                // inline-level elements accept inline-block;
                // block-level elements need to be inline with layout
                if (!jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay(elem.nodeName) === "inline") {
                    style.display = "inline-block";

                } else {
                    style.zoom = 1;
                }
            }
        }

        if (opts.overflow) {
            style.overflow = "hidden";
            // 如果不支持父元素随着子元素宽度改变而改变
            // 动画结束后将style设置为初始状态
            if (!jQuery.support.shrinkWrapBlocks) {
                anim.always(function() {
                    style.overflow = opts.overflow[0];
                    style.overflowX = opts.overflow[1];
                    style.overflowY = opts.overflow[2];
                });
            }
        }


        // show/hide pass
        // 遍历动画属性
        for (index in props) {
            // 获取目标值
            value = props[index];
            // 判断值是否有toggle|show|hide
            if (rfxtypes.exec(value)) {
                delete props[index];
                // 是否需要toggle
                toggle = toggle || value === "toggle";
                // 如果hide（或者show）状态的初始值和我们动画的值相同，就不需要做处理
                if (value === (hidden ? "hide" : "show")) {
                    continue;
                }
                // 将需要show/hide/toggle的属性保存到handled数组中
                handled.push(index);
            }
        }

        length = handled.length;
        // 如果handled数组有元素
        // 对需要toggle|show|hide的属性处理
        if (length) {
            // 获取或者设置元素的fxshow缓存（保存显示状态）
            dataShow = jQuery._data(elem, "fxshow") || jQuery._data(elem, "fxshow", {});
            // 如果元素已经有hidden属性，说明我们设置过了，
            // 取该值
            if ("hidden" in dataShow) {
                hidden = dataShow.hidden;
            }

            // store state if its toggle - enables .stop().toggle() to "reverse"
            // 如果需要toggle，将hidden状态取反
            if (toggle) {
                dataShow.hidden = !hidden;
            }
            // 如果元素隐藏了就显示出来，为了后期的动画
            if (hidden) {
                jQuery(elem).show();
            } else {
                // 否则动画结束后才隐藏
                anim.done(function() {
                    jQuery(elem).hide();
                });
            }
            // 动画结束后删除fxshow缓存，并恢复元素原始样式
            anim.done(function() {
                var prop;
                jQuery._removeData(elem, "fxshow");
                for (prop in orig) {
                    jQuery.style(elem, prop, orig[prop]);
                }
            });
            for (index = 0; index < length; index++) {
                prop = handled[index];
                // 创建Tween实例
                tween = anim.createTween(prop, hidden ? dataShow[prop] : 0);
                // 获取元素原始样式值
                orig[prop] = dataShow[prop] || jQuery.style(elem, prop);

                // 如果dataShow引用的缓存没有show|hide|toggle属性
                if (!(prop in dataShow)) {
                    // 添加该属性，并赋初值
                    dataShow[prop] = tween.start;
                    if (hidden) {
                        tween.end = tween.start;
                        tween.start = prop === "width" || prop === "height" ? 1 : 0;
                    }
                }
            }
        }
    }

    // 实例化init构造函数
    // 对单个动画属性，在初始化的时候计算开始值
    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    jQuery.Tween = Tween;

    Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || "swing";
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];

            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        // 通过缓动算法计算出样式值，然后应用到元素上
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];

            // 当前执行位置，
            // 如果有时长，就用缓动算法
            if (this.options.duration) {
                this.pos = eased = jQuery.easing[this.easing](
                    percent, this.options.duration * percent, 0, 1, this.options.duration);
            } else {
                this.pos = eased = percent;
            }
            // 当前时间戳
            this.now = (this.end - this.start) * eased + this.start;

            if (this.options.step) {
                this.options.step.call(this.elem, this.now, this);
            }

            // 有钩子对象就执行set方法，否则使用默认set方法
            if (hooks && hooks.set) {
                hooks.set(this);
            } else {
                Tween.propHooks._default.set(this);
            }
            return this;
        }
    };

    Tween.prototype.init.prototype = Tween.prototype;

    Tween.propHooks = {
        _default: {
            // 默认的获取样式初始值方法
            get: function(tween) {
                var result;

                if (tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)) {
                    return tween.elem[tween.prop];
                }

                // passing an empty string as a 3rd parameter to .css will automatically
                // attempt a parseFloat and fallback to a string if the parse fails
                // so, simple values such as "10px" are parsed to Float.
                // complex values such as "rotate(1rad)" are returned as is.
                result = jQuery.css(tween.elem, tween.prop, "");
                // Empty strings, null, undefined and "auto" are converted to 0.
                return !result || result === "auto" ? 0 : result;
            },
            // 设置元素样式
            set: function(tween) {
                // use step hook for back compat - use cssHook if its there - use .style if its
                // available and use plain properties where available
                if (jQuery.fx.step[tween.prop]) {
                    jQuery.fx.step[tween.prop](tween);
                } else if (tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
                    jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
                } else {
                    tween.elem[tween.prop] = tween.now;
                }
            }
        }
    };

    // Remove in 2.0 - this supports IE8's panic based approach
    // to setting things on disconnected nodes
    Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
                tween.elem[tween.prop] = tween.now;
            }
        }
    };

    jQuery.each(["toggle", "show", "hide"], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
        };
    });

    jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {

            // show any hidden elements after setting opacity to 0
            return this.filter(isHidden).css("opacity", 0).show()

            // animate to the value specified
            .end().animate({
                opacity: to
            }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
            var // prop对象是否为空
                empty = jQuery.isEmptyObject(prop),
                // 返回{complete, duration, easing, queue, old}
                optall = jQuery.speed(speed, easing, callback),
                // TODO
                doAnimation = function() {
                    // Operate on a copy of prop so per-property easing won't be lost
                    var anim = Animation(this, jQuery.extend({}, prop), optall);
                    doAnimation.finish = function() {
                        anim.stop(true);
                    };
                    // Empty animations, or finishing resolves immediately
                    if (empty || jQuery._data(this, "finish")) {
                        anim.stop(true);
                    }
                };
            doAnimation.finish = doAnimation;

                // 如果prop为空对象或者queue为false(即不进行动画队列)，
                // 遍历元素集并执行doAnimation回调
            return empty || optall.queue === false ? this.each(doAnimation) :
                // 否则prop不为空且需要队列执行，
                // 将doAnimation添加到该元素的队列中
                // jQuery.queue('fx', doAnimation)
                this.queue(optall.queue, doAnimation);
        },
        // 停止所有在指定元素上正在运行的动画。
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop;
                stop(gotoEnd);
            };

            if (typeof type !== "string") {
                gotoEnd = clearQueue;
                clearQueue = type;
                type = undefined;
            }
            if (clearQueue && type !== false) {
                this.queue(type || "fx", []);
            }

            return this.each(function() {
                var dequeue = true,
                    index = type != null && type + "queueHooks",
                    timers = jQuery.timers,
                    data = jQuery._data(this);

                if (index) {
                    if (data[index] && data[index].stop) {
                        stopQueue(data[index]);
                    }
                } else {
                    for (index in data) {
                        if (data[index] && data[index].stop && rrun.test(index)) {
                            stopQueue(data[index]);
                        }
                    }
                }

                for (index = timers.length; index--;) {
                    if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                        timers[index].anim.stop(gotoEnd);
                        dequeue = false;
                        timers.splice(index, 1);
                    }
                }

                // start the next in the queue if the last step wasn't forced
                // timers currently will call their complete callbacks, which will dequeue
                // but only if they were gotoEnd
                if (dequeue || !gotoEnd) {
                    jQuery.dequeue(this, type);
                }
            });
        },
        finish: function(type) {
            if (type !== false) {
                type = type || "fx";
            }
            return this.each(function() {
                var index, data = jQuery._data(this),
                    queue = data[type + "queue"],
                    hooks = data[type + "queueHooks"],
                    timers = jQuery.timers,
                    length = queue ? queue.length : 0;

                // enable finishing flag on private data
                data.finish = true;

                // empty the queue first
                jQuery.queue(this, type, []);

                if (hooks && hooks.cur && hooks.cur.finish) {
                    hooks.cur.finish.call(this);
                }

                // look for any active animations, and finish them
                for (index = timers.length; index--;) {
                    if (timers[index].elem === this && timers[index].queue === type) {
                        timers[index].anim.stop(true);
                        timers.splice(index, 1);
                    }
                }

                // look for any animations in the old queue and finish them
                for (index = 0; index < length; index++) {
                    if (queue[index] && queue[index].finish) {
                        queue[index].finish.call(this);
                    }
                }

                // turn off finishing flag
                delete data.finish;
            });
        }
    });

    // Generate parameters to create a standard animation
    /**
     * 用于填充slideDown/slideUp/slideToggle动画参数
     * @param  {[String]} type         [show/hide/toggle]
     * @param  {[type]} includeWidth [是否需要包含宽度]
     * @return {[type]}              [description]
     */
    function genFx(type, includeWidth) {
        var which,
            attrs = {
                height: type
            },
            i = 0;

        // if we include width, step value is 1 to do all cssExpand values,
        // if we don't include width, step value is 2 to skip over Left and Right
        includeWidth = includeWidth ? 1 : 0;
        // 不包含宽度，which就取“Top/Bottom”，
        // 否则“Left/Right”
        for (; i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
        }

        if (includeWidth) {
            attrs.opacity = attrs.width = type;
        }

        return attrs;
    }

    // Generate shortcuts for custom animations
    jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    });

    /**
     * 配置动画参数
     * 
     * 配置动画时长，动画结束回调（经装饰了），缓动算法，queue属性用来标识是动画队列
     * @param  {[Number|Objecct]}   speed  [动画时长]
     * @param  {[Function]}   easing [缓动算法]
     * @param  {Function} fn     [动画结束会掉]
     * @return {[Object]}          [description]
     */
    jQuery.speed = function(speed, easing, fn) {
        var opt =
            // speed是否为对象
            speed && typeof speed === "object" ?
            // 如果是，克隆speed对象
            jQuery.extend({}, speed) :
            // 否则返回一个新的对象
            {
                // complete是我们的animate的回调方法，
                // 即动画结束时的回调
                // (speed, easing, fn)
                // (speed || easing, fn)
                // (fn)
                complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
                // 动画时长
                duration: speed,
                // 缓动
                easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
            };

        opt.duration =
            // jQuery.fx.off是否为真，如果是则将opt.duration设置为0，
            // 这将会停止所有动画
            jQuery.fx.off ? 0 :
            // 否则判断duration属性值是否为数字类型，是则使用 
            typeof opt.duration === "number" ? opt.duration :
            // 否则判断duration属性值字符串是否在jQuery.fx.speeds(jQuery的预配置动画时长)属性key字段中，是则使用 
            opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] :
            // 否则就是用默认动画时长
            jQuery.fx.speeds._default;

        // normalize opt.queue - true/undefined/null -> "fx"
        // 如果opt.queue的值是true/undefined/null之一，
        // 将其值设置为"fx"字符串，标示动画队列
        if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
        }

        // Queueing
        // 将旧的回调（即我们添加的回调）存入opt.old
        opt.old = opt.complete;

        // 给opt.complete重新定义，
        // 在旧方法中通过装饰包装
        opt.complete = function() {
            if (jQuery.isFunction(opt.old)) {
                // 执行我们的回调
                opt.old.call(this);
            }

            // 如果有队列，执行我们下一个队列
            if (opt.queue) {
                jQuery.dequeue(this, opt.queue);
            }
        };

        // 返回opt
        /*
        {complete, duration, easing, queue, old}
         */
        return opt;
    };

    jQuery.easing = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
        }
    };

    // 全局timers数组，保存着所有动画tick
    jQuery.timers = [];
    jQuery.fx = Tween.prototype.init;
    // setInterval回调
    jQuery.fx.tick = function() {
        var timer, timers = jQuery.timers,
            i = 0;

        fxNow = jQuery.now();

        // 遍历所有tick
        for (; i < timers.length; i++) {
            timer = timers[i];
            // Checks the timer has not already been removed
            // 如果当前tick返回的为假（经弱转换）
            // 移除该tick
            // 然后继续遍历当前项，因为数组长度被改变了
            if (!timer() && timers[i] === timer) {
                timers.splice(i--, 1);
            }
        }

        // 如果没有tick回调了，停止定时器
        if (!timers.length) {
            jQuery.fx.stop();
        }
        fxNow = undefined;
    };

    /**
     * 
     * 
     * @param  {Object} timer tick回调
     */
    jQuery.fx.timer = function(timer) {
        if (timer() && jQuery.timers.push(timer)) {
            jQuery.fx.start();
        }
    };

    jQuery.fx.interval = 13;

    // 动画正式开始
    jQuery.fx.start = function() {
        if (!timerId) {
            // 间隔执行jQuery.fx.tick
            timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);
        }
    };

    jQuery.fx.stop = function() {
        clearInterval(timerId);
        timerId = null;
    };

    jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        // Default speed
        _default: 400
    };

    // Back Compat <1.8 extension point
    jQuery.fx.step = {};

    if (jQuery.expr && jQuery.expr.filters) {
        jQuery.expr.filters.animated = function(elem) {
            return jQuery.grep(jQuery.timers, function(fn) {
                return elem === fn.elem;
            }).length;
        };
    }
