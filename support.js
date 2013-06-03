jQuery.support = (function () {
        var support, all, a,
            input, select, fragment,
            opt, eventName, isSupported, i,
            div = document.createElement('div');

        // Setup
        div.setAttribute('className', 't');
        div.innerHTML = '<link/><table></table><a href="/a">a</a><input type="checkbox"/>';

        // 在受限制或者非浏览器的环境中退出
        all = div.getElementsByTagName('*');
        a = div.getElementsByTagName('a')[0];
        if (!all || !a || !all.length) {
            return {};
        }

        // First batch of tests
        select = document.createElement('select');
        opt = select.appendChild(document.createElement('option'));
        input = div.getElementsByTagName('input')[0];

        a.style.cssText = 'top:1px;float:left;opacity:.5';
        support = {
            // 测试setAttribute是否会将className转换为络峰式
            // 如果是，我们需要在（ie6/7）的get/setAttribute使用attrFixes
            getSetAttribute: div.className !== 't',
            // 当使用.innerHTML检查是否有前置空白
            leadingWhitespace: div.firstChild.nodeType === 3,
            // 确保tbody不会自动插入到table里
            // IE会给空的table自动添加
            tbody: !div.getElementsByTagName('tbody').length,
            // 确保link元素在innerHTML中正确序列化
            // IE需要一个包裹元素
            htmlSerialize: !!div.getElementsByTagName('link').length,
            // 通过使用getAttribute获取style样式
            // IE使用.cssText
            style: /top/.test(a.getAttribute('style')),
            // 确保URLs不会被操纵
            // IE默认会标准化
            hrefNormalized: a.getAttribute('href') === '/a',
            // 确保元素的opacity属性值正确存在
            // （IR使用filter）
            // 这里用正则来解决webkit的一个问题
            opacity: /^0.5/.test(a.style.opacity),
            // 验证style的float
            // IE使用cssFloat
            cssFloat: !!a.style.cssFloat,
            // 检查默认checkbox/radio的value值
            // （webkit为“”， 其它为“on”）
            checkOn: !!input.value,
            // 确保select默认被选中的option有正确的selected属性
            // 在optgroup中，webkit和IE默认为false
            optSelected: opt.selected,
            // 测试form是否支持enctype
            enctype: !!document.createElement('form').enctype,
            // 确保深度克隆一个html5元素的时候不会出现outerHTML为undefined的情况
            html5Clone: document.createElement('nav').cloneNode(true).outerHTML !== '<:nav></:nav>',
            // 该属性在1.8中被弃用了，现在又重用了
            boxModel: document.compatMode === 'CSS1Compat',
            // 后期要用被重定义的
            deleteExpando: true,
            noCloneEvent: true,
            inlineBlockNeedsLayout: false,
            shrinkWrapBlocks: false,
            reliableMarginRight: true,
            boxSizingReliable: true,
            pixelPosition: false
        };

        // 确保checked状态也被克隆
        input.cheked = true;
        support.noCloneChecked = input.cloneNode(true).checked;

        // 确保select被禁用时，option元素没有被禁用
        // webkit会标记为禁用
        select.disabled = true;
        support.optDisabled = !opt.disabled;

        // Support: IE<9
        try {
            delete div.test;
        } catch (e) {
            support.deleteExpando = false;
        }

        // 我们是否要信任getAttribute('value')
        input = document.createElement('input');
        input.setAttribute('value', '');
        support.input = input.getAttribute('value') === '';

        // 检查input把type设置为radio后，是否还保留原来的value
        input.value = 't';
        input.setAttribute('type', 'radio');
        support.raduiValue = input.value === 't';

        // webkit会失去选中当name在checked属性设置后设置
        input.setAttribute('checked', 't');
        input.setAttribute('name', 't');

        fragment = document.createDocumentFragment();
        fragment.appendChild(input);

        // 检查当插入到DOM中的失去联系的checkbox是否保留着value的值为true
        support.appendChecked = input.checked;

        // webkit在文档碎片中不会正确克隆checked状态
        support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked;

        // Support: IE<9
        // Opera不会克隆事件（typeof div.attachEvent===undefined）
        // IE9-10通过attachEvent绑定的事件不会触发click()
        if (div.attachEvent) {
            div.attachEvent('onclick', function () {
                support.noCloneEvent = false;
            });

            div.cloneNode(true).click();
        }

        // Support: IE<9 (lack submit/change bubble), Firefox 17+ (lack focusin event)
        // Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP), test/csp.php
        for (i in {submit: true, change: true, focusin: true}) {
            div.setAttribute(eventName = 'on' + i, 'i');

            support[i + 'Bubble'] = eventName in window || div.attributes[eventName].expando === false;
        }

        div.style.backgroundClip = 'content-box';
        div.cloneNode(true).style.backgroundClip = '';
        support.clearCloneStyle = div.style.backgroundClip === 'content-box';

        // 当文档加载完毕后进行测试
        jQuery(function () {
            var container, marginDiv, tds,
                divReset = 'padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content:box;',
                body = document.getElementsByTagName('body')[0];

            if (!body) {
                // frameset没有body
                return;
            }

            container = document.createElement('div');
            container.style.cssText = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px;';

            body.appendChild(container).appendChild(div);

            // Support: IE8
            // Check if table cells still have offsetWidth/Height when they are set
            // to display:none and there are still other visible table cells in a
            // table row; if so, offsetWidth/Height are not reliable for use when
            // determining if an element has been hidden directly using
            // display:none (it is still safe to use offsets if a parent element is
            // hidden; don safety goggles and see bug #4512 for more information).
            div.innerHTML = '<table><tr><td></td><td>t</td></tr></table>';
            tds = div.getElementsByTagName('td');
            tds[0].style.cssText = 'padding:0;margin:0;border:0;display:none;';
            isSupported = (tds[0].offsetHeight === 0);

            tds[0].style.display = '';
            tds[1].style.display = 'none';

            // Support: IE8
            // 检查空的单元格是否仍然有offsetWidth/Height
            support.reliableHiddenOffsets = isSupported && (tds[0].offsetHeight === 0);

            // 检查box-sizing和margin行为
            div.innerHTML = '';
            div.style.cssText = 'box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top1%;';
            support.boxSizing = (div.offsetWidth === 4);
            support.doesNotIncludeMarginInBodyOffset = (body.offsetTop !== 1);

            // Use window.getComputedStyle because jsdom on node.js will break without it.
            if (window.getComputedStyle) {
                support.pixelPosition = (window.getComputedStyle(div, null) || {}).top !== '1%';
                support.boxSizingReliable = (window.getComputedStyle(div, null) || {width: '4px'}).width === '4px';

                // Check if div with explicit width and no margin-right incorrectly
                // gets computed margin-right based on width of container. (#3333)
                // Fails in WebKit before Feb 2011 nightlies
                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                marginDiv = div.appendChild(document.createElement('div'));
                marginDiv.style.cssText = div.style.cssText = divReset;
                marginDiv.style.marginRight = marginDiv.style.width = '0';
                div.style.width = '1px';

                support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight);
            }

            if (typeof div.style.zoom !== core_strundefined) {
                // Support: IE<8
                // Check if natively block-level elements act like inline-block
                // elements when setting their display to 'inline' and giving
                // them layout
                div.innerHTML = '';
                div.style.cssText = divReset + 'width:1px;padding:1px;display:inline;zoom:1';
                support.inlineBlockNeedsLayout = (div.offsetWidth === 3);

                // Support: IE6
                // Check if elements with layout shrink-wrap their children
                div.style.display = 'block';
                div.innerHTML = '<div></div>';
                div.firstChild.style.width = '5px';
                support.shrinkWrapBlocks = (div.offsetWidth !== 3);

                if (support.inlineBlockNeedsLayout) {
                    // Prevent IE 6 from affecting layout for positioned elements #11048
                    // Prevent IE from shrinking the body in IE 7 mode #12869
                    // Support: IE<8
                    body.style.zoom = 1;
                }
            }

            body.removeChild(container);

            // Null elements to avoid leaks in IE
            container = div = tds = marginDiv = null;
        });

        // Null elements to avoid leaks in IE
        all = select = fragment = opt = a = input = null;

        return support;
    })();
