// ==UserScript==
// @name         NGA版主举报管理工具
// @namespace    https://bbs.nga.cn
// @version      1.0.1
// @description  NGA玩家社区网页版版主举报信息查看、筛选与管理工具
// @author       UST
// @match        *://bbs.nga.cn/*
// @match        *://g.nga.cn/*
// @match        *://nga.178.com/*
// @match        *://ngabbs.com/*
// @match        *://ngacn.cc/*
// @license      GPL-3.0
// @icon         http://bbs.nga.cn/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var LOG_PREFIX = '[NGA举报工具]';
    function log(msg, data) {
        console.log(LOG_PREFIX, msg, data || '');
    }
    function logError(msg, err) {
        console.error(LOG_PREFIX, msg, err || '');
    }

    log('脚本已加载 (页面上下文模式)');

    // ========== 注入 CSS ==========
    var styleEl = document.createElement('style');
    styleEl.textContent = `
        #nga-report-panel-overlay {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            justify-content: center;
            align-items: flex-start;
            padding-top: 40px;
        }
        #nga-report-panel-overlay.show {
            display: flex;
        }
        #nga-report-panel {
            width: 1100px;
            max-width: 98vw;
            max-height: 85vh;
            background: #fdf5e6;
            border: 2px solid #ba8b5a;
            border-radius: 3px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 20px rgba(0,0,0,0.4);
            font-family: "Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;
            font-size: 13px;
            color: #492e1b;
        }
        #nga-report-panel-header {
            background: #492e1b;
            color: #fdf5e6;
            padding: 8px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        #nga-report-panel-header span {
            font-size: 15px;
            font-weight: bold;
        }
        #nga-report-panel-close {
            cursor: pointer;
            font-size: 18px;
            color: #e0c090;
            line-height: 1;
        }
        #nga-report-panel-close:hover {
            color: #fff;
        }
        #nga-report-tabs {
            display: flex;
            background: #e8d8b8;
            border-bottom: 2px solid #ba8b5a;
            flex-shrink: 0;
        }
        #nga-report-tabs .tab-btn {
            padding: 8px 22px;
            cursor: pointer;
            color: #492e1b;
            font-size: 13px;
            font-weight: bold;
            border-right: 1px solid #c4a87c;
            background: #e8d8b8;
            transition: background 0.15s;
        }
        #nga-report-tabs .tab-btn:hover {
            background: #f0e0c0;
        }
        #nga-report-tabs .tab-btn.active {
            background: #fdf5e6;
            border-bottom: 2px solid #fdf5e6;
            margin-bottom: -2px;
        }
        #nga-report-panel-body {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .nga-report-page {
            display: none;
        }
        .nga-report-page.active {
            display: block;
        }
        #nga-report-stats {
            background: #faf3e6;
            border: 1px solid #d4c5a9;
            padding: 8px 12px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }
        #nga-report-stats span { color: #6b4e2e; }
        #nga-report-stats strong { color: #c0392b; }
        #nga-report-refresh-btn {
            padding: 4px 14px;
            background: #492e1b;
            color: #fdf5e6;
            border: 1px solid #6b4e2e;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            border-radius: 2px;
        }
        #nga-report-refresh-btn:hover { background: #6b4e2e; }
        #nga-report-table-wrap { overflow-x: auto; }
        #nga-report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        #nga-report-table th {
            background: #e0cfa6;
            color: #492e1b;
            padding: 7px 8px;
            border: 1px solid #c4a87c;
            text-align: left;
            white-space: nowrap;
            font-weight: bold;
        }
        #nga-report-table td {
            padding: 6px 8px;
            border: 1px solid #d4c5a9;
            vertical-align: top;
        }
        #nga-report-table tr:nth-child(even) td { background: #faf7f0; }
        #nga-report-table tr:hover td { background: #f0e4cc; }
        #nga-report-table a {
            color: #b56700;
            text-decoration: none;
        }
        #nga-report-table a:hover {
            color: #8b3a00;
            text-decoration: underline;
        }
        #nga-report-table .col-time { width: 130px; white-space: nowrap; }
        #nga-report-table .col-type { width: 56px; text-align: center; }
        #nga-report-table .col-reporter { width: 100px; }
        #nga-report-table .col-title { min-width: 180px; }
        #nga-report-table .col-reason { min-width: 160px; }
        #nga-report-table .col-forum { width: 110px; }
        #nga-report-table .col-action { width: 80px; text-align: center; }
        .type-tag {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 2px;
            font-size: 11px;
            font-weight: bold;
        }
        .type-topic { background: #d4e6f1; color: #1a5276; }
        .type-reply { background: #d5f5e3; color: #1e8449; }
        .action-btn {
            display: inline-block;
            padding: 2px 8px;
            margin: 1px 2px;
            font-size: 11px;
            cursor: pointer;
            background: #fdf5e6;
            border: 1px solid #c4a87c;
            color: #6b4e2e;
            border-radius: 2px;
            white-space: nowrap;
        }
        .action-btn:hover {
            background: #e8d8b8;
            border-color: #8b6914;
        }
        #nga-report-loading {
            text-align: center;
            padding: 40px;
            color: #8b6914;
            font-size: 14px;
        }
        .filter-header {
            font-size: 14px;
            font-weight: bold;
            color: #492e1b;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid #d4c5a9;
        }
        .filter-desc {
            font-size: 12px;
            color: #8b6914;
            margin-bottom: 12px;
        }
        .filter-group { margin-bottom: 10px; }
        .filter-group-title {
            font-size: 13px;
            font-weight: bold;
            color: #492e1b;
            cursor: pointer;
            padding: 5px 8px;
            background: #f0e8d5;
            border: 1px solid #d4c5a9;
            border-radius: 2px;
        }
        .filter-group-title:hover { background: #e8d8b8; }
        .filter-group-title .arrow {
            display: inline-block;
            transition: transform 0.2s;
            margin-right: 4px;
            font-size: 11px;
        }
        .filter-group-title .arrow.open { transform: rotate(90deg); }
        .filter-children {
            margin-left: 20px;
            display: none;
        }
        .filter-children.open { display: block; }
        .filter-item {
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            color: #492e1b;
            border: 1px solid transparent;
            margin: 2px 0;
        }
        .filter-item:hover { background: #f0e8d5; }
        .filter-item.selected {
            background: #d5e8d4;
            border-color: #82b366;
            font-weight: bold;
        }
        .filter-item input[type="checkbox"] { margin-right: 6px; }
        .settings-section {
            margin-bottom: 16px;
            padding: 10px;
            background: #faf7f0;
            border: 1px solid #d4c5a9;
            border-radius: 2px;
        }
        .settings-section h3 {
            font-size: 14px;
            color: #492e1b;
            margin: 0 0 8px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #d4c5a9;
        }
        .settings-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
        }
        .settings-label { color: #492e1b; font-size: 13px; }
        .settings-value { color: #8b6914; font-weight: bold; }
        .settings-btn {
            padding: 5px 16px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #c4a87c;
            background: #fdf5e6;
            color: #6b4e2e;
            border-radius: 2px;
        }
        .settings-btn:hover {
            background: #e8d8b8;
            border-color: #8b6914;
        }
        .settings-btn.danger {
            background: #fadbd8;
            border-color: #e6a8a0;
            color: #c0392b;
        }
        .settings-btn.danger:hover { background: #f5b7b1; }
        .settings-msg {
            font-size: 12px;
            color: #27ae60;
            margin-top: 6px;
        }
        #nga-report-panel-body::-webkit-scrollbar { width: 8px; }
        #nga-report-panel-body::-webkit-scrollbar-track { background: #f5eedb; }
        #nga-report-panel-body::-webkit-scrollbar-thumb { background: #c4a87c; border-radius: 4px; }
    `;
    document.head.appendChild(styleEl);

    // ========== 缓存Key ==========
    var CACHE_KEY = 'nga_report_cache';
    var FILTER_KEY = 'nga_report_filter';

    // ========== 创建主面板DOM ==========
    function createPanel() {
        log('创建面板DOM');
        var overlay = document.createElement('div');
        overlay.id = 'nga-report-panel-overlay';
        overlay.innerHTML =
            '<div id="nga-report-panel">' +
                '<div id="nga-report-panel-header">' +
                    '<span>NGA举报管理工具</span>' +
                    '<span id="nga-report-panel-close" title="关闭">✕</span>' +
                '</div>' +
                '<div id="nga-report-tabs">' +
                    '<div class="tab-btn active" data-tab="0">举报列表</div>' +
                    '<div class="tab-btn" data-tab="1">筛选版面</div>' +
                    '<div class="tab-btn" data-tab="2">设置</div>' +
                '</div>' +
                '<div id="nga-report-panel-body">' +
                    '<div class="nga-report-page active" data-page="0">' +
                        '<div id="nga-report-stats">' +
                            '<span>共 <strong id="nga-report-count">0</strong> 条举报记录</span>' +
                            '<div>' +
                                '<span style="margin-right:10px;font-size:12px;color:#8b6914;" id="nga-report-last-update"></span>' +
                                '<button id="nga-report-refresh-btn">刷新数据</button>' +
                            '</div>' +
                        '</div>' +
                        '<div id="nga-report-table-wrap">' +
                            '<div id="nga-report-loading">正在加载数据...</div>' +
                            '<table id="nga-report-table" style="display:none;">' +
                                '<thead><tr>' +
                                    '<th class="col-time">举报时间</th>' +
                                    '<th class="col-type">类型</th>' +
                                    '<th class="col-reporter">举报人</th>' +
                                    '<th class="col-title">帖子标题</th>' +
                                    '<th class="col-reason">举报理由</th>' +
                                    '<th class="col-forum">版块</th>' +
                                    '<th class="col-action">操作</th>' +
                                '</tr></thead>' +
                                '<tbody id="nga-report-tbody"></tbody>' +
                            '</table>' +
                        '</div>' +
                    '</div>' +
                    '<div class="nga-report-page" data-page="1">' +
                        '<div class="filter-header">筛选版面</div>' +
                        '<div class="filter-desc">勾选父版面可包含所有子版面；单独勾选子版面则只显示该子版面。不勾选任何版面则显示全部。</div>' +
                        '<div id="nga-report-filter-tree"></div>' +
                        '<div style="margin-top:12px;">' +
                            '<button class="settings-btn" id="nga-filter-select-all">全选</button>' +
                            '<button class="settings-btn" id="nga-filter-deselect-all">取消全选</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="nga-report-page" data-page="2">' +
                        '<div class="settings-section">' +
                            '<h3>缓存管理</h3>' +
                            '<div class="settings-row"><span class="settings-label">本地缓存举报条数：</span><span class="settings-value" id="nga-settings-cache-count">0</span></div>' +
                            '<div class="settings-row"><span class="settings-label">最后更新时间：</span><span class="settings-value" id="nga-settings-last-update">-</span></div>' +
                            '<div style="margin-top:10px;">' +
                                '<button class="settings-btn danger" id="nga-clear-oldest-100">清除最旧的100条</button>' +
                                '<button class="settings-btn danger" id="nga-clear-all">清除全部缓存</button>' +
                            '</div>' +
                            '<div class="settings-msg" id="nga-settings-msg"></div>' +
                        '</div>' +
                        '<div class="settings-section">' +
                            '<h3>关于</h3>' +
                            '<div class="settings-row"><span class="settings-label">NGA举报管理工具 v0.3</span></div>' +
                            '<div class="settings-row"><span class="settings-label">数据来源：</span><span style="font-size:12px;color:#8b6914;">bbs.nga.cn/nuke.php?__lib=noti&raw=3</span></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        log('面板DOM已创建');
        return overlay;
    }

    // ========== 创建打开按钮 ==========
    function createOpenButton() {
        log('创建打开按钮');
        var btnWrap = document.createElement('div');
        btnWrap.className = 'td';
        var a = document.createElement('a');
        a.className = 'mmdefault';
        a.href = 'javascript:void(0);';
        a.style.whiteSpace = 'nowrap';
        a.textContent = '举报管理';
        btnWrap.appendChild(a);

        var rightEl = document.querySelector('.right');
        if (rightEl) {
            rightEl.appendChild(btnWrap);
            log('按钮已添加到 .right');
        } else {
            log('.right 元素未找到');
            var navEl = document.querySelector('#m_nav, #nav, .nav, .top_nav');
            if (navEl) {
                navEl.appendChild(btnWrap);
            }
        }
        return btnWrap;
    }

    // ========== 数据解析公共函数 ==========
    function parseReportResponse(raw, reject) {
        var data;
        if (typeof raw === 'string') {
            var match = raw.match(/window\.script_muti_get_var_store\s*=\s*({[\s\S]*?});/);
            if (!match) {
                reject(new Error('未能从响应中匹配到数据JSON, 前500字符: ' + raw.substring(0, 500)));
                return null;
            }
            try { data = JSON.parse(match[1]); } catch (e) {
                reject(new Error('JSON解析失败: ' + e.message));
                return null;
            }
        } else if (raw && typeof raw === 'object') {
            data = raw;
        } else {
            reject(new Error('未知响应格式: ' + typeof raw));
            return null;
        }
        return data;
    }

    function extractReports(data, reject) {
        log('=== 解析后的完整数据 ===');
        console.log(LOG_PREFIX, JSON.stringify(data, null, 2));

        if (data.error) {
            reject(new Error('API错误: ' + JSON.stringify(data.error) + ' (请确认已登录NGA)'));
            return null;
        }
        if (!data.data) {
            reject(new Error('数据格式异常：缺少data字段, keys=' + Object.keys(data).join(',')));
            return null;
        }

        var notiData = data.data;
        var reports = [];
        var notiKeys = Object.keys(notiData);
        log('notiData keys: ' + notiKeys.join(', '));

        for (var k = 0; k < notiKeys.length; k++) {
            var key = notiKeys[k];
            var section = notiData[key];
            if (section && Array.isArray(section['1'])) {
                reports = reports.concat(section['1']);
                log('从 data["' + key + '"]["1"] 获取到 ' + section['1'].length + ' 条记录');
            }
            if (key === '1' && Array.isArray(section)) {
                reports = reports.concat(section);
                log('从 data["1"] 直接获取到 ' + section.length + ' 条记录');
            }
        }
        if (Array.isArray(notiData['1'])) {
            reports = reports.concat(notiData['1']);
        }

        log('=== 共解析到 ' + reports.length + ' 条举报记录 ===');
        if (reports.length > 0) {
            console.log(LOG_PREFIX, '举报数据明细(前3条):', JSON.stringify(reports.slice(0, 3), null, 2));
        }
        return reports;
    }

    // ========== XHR 回退方案（使用正确的 __act=get_all） ==========
    function fetchViaXHR(resolve, reject) {
        log('>>> 使用 XHR 回退方案');
        var url = '/nuke.php?__lib=noti&__act=get_all&raw=3';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');

        xhr.onload = function() {
            log('<<< XHR 响应状态: ' + xhr.status);
            if (xhr.status !== 200) {
                reject(new Error('HTTP ' + xhr.status));
                return;
            }
            var data = parseReportResponse(xhr.responseText, reject);
            if (!data) return;
            var reports = extractReports(data, reject);
            if (reports) resolve(reports);
        };
        xhr.onerror = function() { reject(new Error('XHR网络请求失败')); };
        xhr.send();
    }

    // ========== 数据获取（优先 NGA 原生 __NUKE.doRequest2，回退 XHR） ==========
    function fetchReportData() {
        log('>>> 开始获取举报数据');

        return new Promise(function(resolve, reject) {
            var started = false;
            var maxAttempts = 20;
            var attempt = 0;

            function tryNuke() {
                attempt++;
                if (typeof __NUKE !== 'undefined' && typeof __NUKE.doRequest2 === 'function') {
                    if (started) return;
                    started = true;
                    log('__NUKE 已就绪(第' + attempt + '次检测)，使用原生请求');
                    var timeout = setTimeout(function() {
                        reject(new Error('__NUKE请求超时(15秒)'));
                    }, 15000);

                    __NUKE.doRequest2(
                        'f', function(d) {
                            clearTimeout(timeout);
                            log('<<< __NUKE.doRequest2 回调');
                            log('原始响应类型: ' + typeof d);
                            console.log(LOG_PREFIX, '原始响应:', d);
                            var data = parseReportResponse(d, reject);
                            if (!data) return;
                            var reports = extractReports(data, reject);
                            if (reports) resolve(reports);
                        },
                        'u', '/nuke.php?__lib=noti&__act=get_all&raw=3'
                    );
                } else if (attempt < maxAttempts) {
                    setTimeout(tryNuke, 500);
                } else {
                    log('__NUKE 未就绪(等待' + (maxAttempts * 500 / 1000) + '秒)，使用 XHR 回退');
                    fetchViaXHR(resolve, reject);
                }
            }

            tryNuke();
        });
    }

    // ========== 缓存操作 ==========
    function getCachedReports() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            logError('读取缓存失败', e);
            return [];
        }
    }

    function saveCache(reports) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(reports));
        } catch (e) {
            logError('保存缓存失败', e);
        }
    }

    function mergeReports(existingList, newList) {
        var map = {};
        for (var i = 0; i < existingList.length; i++) {
            var r = existingList[i];
            var key = r[6] + '_' + r[7] + '_' + r[1] + '_' + r[9];
            map[key] = r;
        }
        for (var j = 0; j < newList.length; j++) {
            var nr = newList[j];
            var nk = nr[6] + '_' + nr[7] + '_' + nr[1] + '_' + nr[9];
            if (!map[nk]) { map[nk] = nr; }
        }
        var merged = [];
        for (var mk in map) {
            if (map.hasOwnProperty(mk)) { merged.push(map[mk]); }
        }
        merged.sort(function(a, b) { return b[9] - a[9]; });
        return merged;
    }

    function getFilterConfig() {
        try {
            var raw = localStorage.getItem(FILTER_KEY);
            return raw ? JSON.parse(raw) : { selectedForums: [] };
        } catch (e) { return { selectedForums: [] }; }
    }

    function saveFilterConfig(config) {
        try { localStorage.setItem(FILTER_KEY, JSON.stringify(config)); } catch (e) {}
    }

    // ========== 时间格式化 ==========
    function formatTimestamp(ts) {
        var d = new Date(ts * 1000);
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
               pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    // ========== 构建版面树 ==========
    function buildForumTree(reports) {
        var forumSet = {};
        for (var i = 0; i < reports.length; i++) {
            var name = reports[i][13];
            if (name) forumSet[name] = true;
        }
        var tree = {};
        var names = Object.keys(forumSet);
        for (var j = 0; j < names.length; j++) {
            var fullName = names[j];
            var parts = fullName.split('>');
            var current = tree;
            for (var k = 0; k < parts.length; k++) {
                var p = parts[k].trim();
                if (!current[p]) { current[p] = { _children: {} }; }
                if (k === parts.length - 1) {
                    current[p]._fullName = fullName;
                    current[p]._isLeaf = true;
                }
                current = current[p]._children;
            }
        }
        return tree;
    }

    function renderFilterItem(fullName, displayName, selectedForums, container) {
        var item = document.createElement('div');
        item.className = 'filter-item' + (selectedForums.indexOf(fullName) >= 0 ? ' selected' : '');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = selectedForums.indexOf(fullName) >= 0;
        (function(fn, checkbox) {
            cb.onchange = function() { updateFilterSelection(fn, checkbox.checked); };
            item.onclick = function(e) {
                if (e.target.tagName !== 'INPUT') {
                    checkbox.checked = !checkbox.checked;
                    updateFilterSelection(fn, checkbox.checked);
                }
            };
        })(fullName, cb);
        item.appendChild(cb);
        item.appendChild(document.createTextNode(displayName));
        container.appendChild(item);
    }

    function renderFilterTree(tree, selectedForums, container) {
        container.innerHTML = '';
        var sortedKeys = Object.keys(tree).sort();
        for (var i = 0; i < sortedKeys.length; i++) {
            (function() {
                var name = sortedKeys[i];
                var node = tree[name];
                var children = node._children;
                var hasChildren = Object.keys(children).length > 0;

                if (hasChildren) {
                    var groupDiv = document.createElement('div');
                    groupDiv.className = 'filter-group';

                    var titleDiv = document.createElement('div');
                    titleDiv.className = 'filter-group-title';
                    titleDiv.innerHTML = '<span class="arrow">▶</span> ' + name;

                    var childrenDiv = document.createElement('div');
                    childrenDiv.className = 'filter-children';

                    titleDiv.onclick = function() {
                        var arrow = this.querySelector('.arrow');
                        var isOpen = childrenDiv.classList.contains('open');
                        if (isOpen) {
                            arrow.classList.remove('open');
                            childrenDiv.classList.remove('open');
                        } else {
                            arrow.classList.add('open');
                            childrenDiv.classList.add('open');
                        }
                    };

                    renderFilterItem(name, name + ' (包含所有子版面)', selectedForums, childrenDiv);
                    renderFilterChildren(children, name, selectedForums, childrenDiv);

                    groupDiv.appendChild(titleDiv);
                    groupDiv.appendChild(childrenDiv);
                    container.appendChild(groupDiv);
                } else {
                    renderFilterItem(name, name, selectedForums, container);
                }
            })();
        }
    }

    function renderFilterChildren(tree, prefix, selectedForums, container) {
        var sortedKeys = Object.keys(tree).sort();
        for (var i = 0; i < sortedKeys.length; i++) {
            (function() {
                var name = sortedKeys[i];
                var node = tree[name];
                var fullName = prefix + '>' + name;
                var children = node._children;
                var hasChildren = Object.keys(children).length > 0;

                if (hasChildren) {
                    var subGroup = document.createElement('div');
                    subGroup.style.marginLeft = '16px';
                    subGroup.style.marginTop = '4px';

                    renderFilterItem(fullName, name + ' (包含所有子版面)', selectedForums, subGroup);

                    var innerDiv = document.createElement('div');
                    innerDiv.style.marginLeft = '16px';
                    renderFilterChildren(children, fullName, selectedForums, innerDiv);
                    subGroup.appendChild(innerDiv);

                    container.appendChild(subGroup);
                } else {
                    renderFilterItem(fullName, fullName, selectedForums, container);
                }
            })();
        }
    }

    function updateFilterSelection(forumName, checked) {
        var config = getFilterConfig();
        if (checked) {
            if (config.selectedForums.indexOf(forumName) < 0) {
                config.selectedForums.push(forumName);
            }
        } else {
            config.selectedForums = config.selectedForums.filter(function(f) { return f !== forumName; });
        }
        saveFilterConfig(config);
        refreshFilterUI();
        refreshTable();
    }

    function refreshFilterUI() {
        var config = getFilterConfig();
        var tree = buildForumTree(getAllReports());
        var container = document.getElementById('nga-report-filter-tree');
        if (container) {
            renderFilterTree(tree, config.selectedForums, container);
        }
    }

    function selectAllForums() {
        var reports = getAllReports();
        var tree = buildForumTree(reports);
        var allNames = [];

        function collectNames(t, prefix) {
            var keys = Object.keys(t);
            for (var i = 0; i < keys.length; i++) {
                var name = keys[i];
                var node = t[name];
                var fullName = prefix ? prefix + '>' + name : name;
                allNames.push(fullName);
                if (Object.keys(node._children).length > 0) {
                    collectNames(node._children, fullName);
                }
            }
        }
        collectNames(tree, '');
        saveFilterConfig({ selectedForums: allNames });
        refreshFilterUI();
        refreshTable();
    }

    function deselectAllForums() {
        saveFilterConfig({ selectedForums: [] });
        refreshFilterUI();
        refreshTable();
    }

    function getFilteredReports(reports) {
        var config = getFilterConfig();
        if (!config.selectedForums || config.selectedForums.length === 0) {
            return reports;
        }
        var selectedSet = {};
        for (var i = 0; i < config.selectedForums.length; i++) {
            selectedSet[config.selectedForums[i]] = true;
        }
        return reports.filter(function(r) {
            var forum = r[13] || '';
            if (selectedSet[forum]) return true;
            var parts = forum.split('>');
            for (var i = 0; i < parts.length; i++) {
                var ancestor = parts.slice(0, i + 1).join('>');
                if (selectedSet[ancestor]) return true;
            }
            return false;
        });
    }

    function getAllReports() { return getCachedReports(); }
    function getDisplayReports() { return getFilteredReports(getAllReports()); }

    // ========== 渲染表格 ==========
    function renderTable(reports) {
        var tbody = document.getElementById('nga-report-tbody');
        var table = document.getElementById('nga-report-table');
        var loading = document.getElementById('nga-report-loading');
        var countEl = document.getElementById('nga-report-count');

        if (!tbody) return;

        tbody.innerHTML = '';
        countEl.textContent = reports.length;

        if (reports.length === 0) {
            loading.style.display = 'block';
            loading.textContent = '暂无举报数据';
            table.style.display = 'none';
            return;
        }

        loading.style.display = 'none';
        table.style.display = '';

        for (var i = 0; i < reports.length; i++) {
            var r = reports[i];
            var ts = r[9], type = r[0], uid = r[1], nickname = r[2];
            var title = r[5], reason = r[11], forum = r[13], tid = r[6], pid = r[7];

            var tr = document.createElement('tr');

            var tdTime = document.createElement('td');
            tdTime.className = 'col-time';
            tdTime.textContent = formatTimestamp(ts);
            tr.appendChild(tdTime);

            var tdType = document.createElement('td');
            tdType.className = 'col-type';
            tdType.innerHTML = type === 13
                ? '<span class="type-tag type-topic">主题帖</span>'
                : '<span class="type-tag type-reply">回复</span>';
            tr.appendChild(tdType);

            var tdReporter = document.createElement('td');
            tdReporter.className = 'col-reporter';
            var reporterLink = document.createElement('a');
            reporterLink.href = 'https://bbs.nga.cn/nuke.php?func=ucp&uid=' + uid;
            reporterLink.target = '_blank';
            reporterLink.textContent = nickname;
            reporterLink.title = 'UID: ' + uid;
            tdReporter.appendChild(reporterLink);
            tr.appendChild(tdReporter);

            var tdTitle = document.createElement('td');
            tdTitle.className = 'col-title';
            var titleLink = document.createElement('a');
            if (type === 14 && pid) {
                titleLink.href = 'https://bbs.nga.cn/read.php?tid=' + tid + '&pid=' + pid + '&to=1';
            } else {
                titleLink.href = 'https://bbs.nga.cn/read.php?tid=' + tid;
            }
            titleLink.target = '_blank';
            titleLink.textContent = title;
            titleLink.title = 'TID: ' + tid + (pid ? ' PID: ' + pid : '');
            tdTitle.appendChild(titleLink);
            tr.appendChild(tdTitle);

            var tdReason = document.createElement('td');
            tdReason.className = 'col-reason';
            tdReason.textContent = reason;
            tr.appendChild(tdReason);

            var tdForum = document.createElement('td');
            tdForum.className = 'col-forum';
            tdForum.textContent = forum;
            tr.appendChild(tdForum);

            var tdAction = document.createElement('td');
            tdAction.className = 'col-action';
            tdAction.innerHTML =
                '<button class="action-btn view-post-btn" data-tid="' + tid + '" data-pid="' + (pid || 0) + '">看帖</button> ' +
                '<button class="action-btn view-user-btn" data-uid="' + uid + '">用户</button>';
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        }

        // 事件委托：看帖按钮
        tbody.onclick = function(e) {
            var target = e.target;
            if (target.classList.contains('view-post-btn')) {
                var tidVal = target.getAttribute('data-tid');
                var pidVal = target.getAttribute('data-pid');
                if (pidVal && pidVal !== '0') {
                    window.open('https://bbs.nga.cn/read.php?tid=' + tidVal + '&pid=' + pidVal + '&to=1', '_blank');
                } else {
                    window.open('https://bbs.nga.cn/read.php?tid=' + tidVal, '_blank');
                }
            } else if (target.classList.contains('view-user-btn')) {
                var uidVal = target.getAttribute('data-uid');
                window.open('https://bbs.nga.cn/nuke.php?func=ucp&uid=' + uidVal, '_blank');
            }
        };
    }

    // ========== 刷新表格 ==========
    function refreshTable() {
        var reports = getDisplayReports();
        renderTable(reports);
        updateStats();
        updateSettingsPage();
    }

    function updateStats() {
        var lastUpdateEl = document.getElementById('nga-report-last-update');
        if (lastUpdateEl) {
            var reports = getAllReports();
            if (reports.length > 0) {
                lastUpdateEl.textContent = '最新: ' + formatTimestamp(reports[0][9]);
            } else {
                lastUpdateEl.textContent = '';
            }
        }
    }

    function updateSettingsPage() {
        var countEl = document.getElementById('nga-settings-cache-count');
        var lastUpdateEl = document.getElementById('nga-settings-last-update');
        if (countEl) {
            var reports = getAllReports();
            countEl.textContent = reports.length;
            if (lastUpdateEl) {
                lastUpdateEl.textContent = reports.length > 0 ? formatTimestamp(reports[0][9]) : '-';
            }
        }
    }

    // ========== 刷新数据 ==========
    function refreshData() {
        log('refreshData 被调用');
        var loading = document.getElementById('nga-report-loading');
        var table = document.getElementById('nga-report-table');
        if (loading) {
            loading.style.display = 'block';
            loading.textContent = '正在从服务器获取数据...';
        }
        if (table) { table.style.display = 'none'; }

        fetchReportData().then(function(newReports) {
            log('fetch 成功，获得 ' + newReports.length + ' 条新记录');
            var existing = getCachedReports();
            var merged = mergeReports(existing, newReports);
            log('合并后共 ' + merged.length + ' 条记录');
            saveCache(merged);
            refreshTable();
            refreshFilterUI();
        }).catch(function(e) {
            logError('获取数据失败: ' + e.message, e);
            if (loading) {
                loading.textContent = '获取数据失败: ' + e.message + '，将显示缓存数据';
            }
            refreshTable();
        });
    }

    // ========== 清除缓存 ==========
    function clearOldest100() {
        var reports = getCachedReports();
        if (reports.length <= 100) {
            localStorage.removeItem(CACHE_KEY);
        } else {
            var sorted = reports.slice().sort(function(a, b) { return a[9] - b[9]; });
            var remaining = sorted.slice(100);
            remaining.sort(function(a, b) { return b[9] - a[9]; });
            saveCache(remaining);
        }
        refreshTable();
        refreshFilterUI();
        var msgEl = document.getElementById('nga-settings-msg');
        if (msgEl) {
            msgEl.textContent = '已清除最旧的100条记录';
            setTimeout(function() { msgEl.textContent = ''; }, 2000);
        }
    }

    function clearAll() {
        localStorage.removeItem(CACHE_KEY);
        refreshTable();
        refreshFilterUI();
        var msgEl = document.getElementById('nga-settings-msg');
        if (msgEl) {
            msgEl.textContent = '已清除全部缓存';
            setTimeout(function() { msgEl.textContent = ''; }, 2000);
        }
    }

    // ========== 面板显示/隐藏 ==========
    function showPanel() {
        log('显示面板');
        var overlay = document.getElementById('nga-report-panel-overlay');
        if (overlay) {
            overlay.classList.add('show');
            switchTab(0);
            refreshTable();
            refreshFilterUI();
            updateSettingsPage();
        }
    }

    function hidePanel() {
        var overlay = document.getElementById('nga-report-panel-overlay');
        if (overlay) { overlay.classList.remove('show'); }
    }

    function switchTab(index) {
        var tabBtns = document.querySelectorAll('#nga-report-tabs .tab-btn');
        var pages = document.querySelectorAll('#nga-report-panel-body .nga-report-page');
        for (var i = 0; i < tabBtns.length; i++) {
            tabBtns[i].classList.toggle('active', i === index);
        }
        for (var j = 0; j < pages.length; j++) {
            pages[j].classList.toggle('active', j === index);
        }
        if (index === 1) refreshFilterUI();
        if (index === 2) updateSettingsPage();
        if (index === 0) refreshTable();
    }

    // ========== 事件绑定 ==========
    function bindEvents() {
        log('绑定事件');
        document.getElementById('nga-report-panel-close').addEventListener('click', hidePanel);

        document.getElementById('nga-report-panel-overlay').addEventListener('click', function(e) {
            if (e.target === this) hidePanel();
        });

        document.getElementById('nga-report-tabs').addEventListener('click', function(e) {
            var btn = e.target.closest ? e.target.closest('.tab-btn') : null;
            if (!btn) return;
            var idx = parseInt(btn.getAttribute('data-tab'));
            if (!isNaN(idx)) switchTab(idx);
        });

        document.getElementById('nga-report-refresh-btn').addEventListener('click', function() {
            log('刷新按钮被点击');
            refreshData();
        });

        document.getElementById('nga-filter-select-all').addEventListener('click', selectAllForums);
        document.getElementById('nga-filter-deselect-all').addEventListener('click', deselectAllForums);
        document.getElementById('nga-clear-oldest-100').addEventListener('click', clearOldest100);
        document.getElementById('nga-clear-all').addEventListener('click', clearAll);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') hidePanel();
        });

        log('事件绑定完成');
    }

    // ========== 初始化 ==========
    function init() {
        log('开始初始化');
        try {
            createPanel();
            bindEvents();
            var btnWrap = createOpenButton();
            btnWrap.addEventListener('click', showPanel);
            log('开始首次自动获取举报数据');
            refreshData();
        } catch (e) {
            logError('初始化异常', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
