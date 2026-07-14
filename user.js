// ==UserScript==
// @name         NGA版主举报管理工具
// @namespace    https://greasyfork.org/zh-CN/scripts/577814-nga%E7%89%88%E4%B8%BB%E4%B8%BE%E6%8A%A5%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7
// @version      1.2.7
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
// @downloadURL https://update.greasyfork.org/scripts/577814/NGA%E7%89%88%E4%B8%BB%E4%B8%BE%E6%8A%A5%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7.user.js
// @updateURL https://update.greasyfork.org/scripts/577814/NGA%E7%89%88%E4%B8%BB%E4%B8%BE%E6%8A%A5%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7.meta.js
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

    // ===================================
    // 注入 CSS (NGA配色 / commonui风格)
    // ===================================
    var styleEl = document.createElement('style');
    styleEl.textContent = [
        // ---- 遮罩与面板容器 ----
        '#nga-report-panel-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:3;justify-content:center;align-items:flex-start;padding-top:40px}',
        '#nga-report-panel-overlay.show{display:flex}',
        '#nga-report-panel{width:1100px;max-width:98vw;max-height:85vh;background:#fdf5e6;border:2px solid #ba8b5a;border-radius:3px;display:flex;flex-direction:column;box-shadow:0 0 20px rgba(0,0,0,0.4);font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;font-size:13px;color:#492e1b}',

        // ---- 面板头部 ----
        '#nga-report-panel-header{background:#492e1b;color:#fdf5e6;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}',
        '#nga-report-panel-header span{font-size:15px;font-weight:bold}',
        '#nga-report-panel-close{cursor:pointer;font-size:18px;color:#e0c090;line-height:1}',
        '#nga-report-panel-close:hover{color:#fff}',

        // ---- 标签页导航 ----
        '#nga-report-tabs{display:flex;background:#e8d8b8;border-bottom:2px solid #ba8b5a;flex-shrink:0}',
        '#nga-report-tabs .tab-btn{padding:8px 22px;cursor:pointer;color:#492e1b;font-size:13px;font-weight:bold;border-right:1px solid #c4a87c;background:#e8d8b8;transition:background 0.15s}',
        '#nga-report-tabs .tab-btn:hover{background:#f0e0c0}',
        '#nga-report-tabs .tab-btn.active{background:#fdf5e6;border-bottom:2px solid #fdf5e6;margin-bottom:-2px}',

        // ---- 面板主体 ----
        '#nga-report-panel-body{flex:1;overflow-y:auto;padding:10px}',
        '.nga-report-page{display:none}',
        '.nga-report-page.active{display:block}',

        // ---- 统计栏 ----
        '#nga-report-stats{background:#faf3e6;border:1px solid #d4c5a9;padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}',
        '#nga-report-stats span{color:#6b4e2e}',
        '#nga-report-stats strong{color:#c0392b}',

        // ---- 工具栏 ----
        '#nga-report-toolbar{display:flex;align-items:center;gap:8px;padding:6px 0;margin-bottom:10px}',
        '.toolbar-btn{padding:5px 16px;font-size:12px;font-weight:bold;cursor:pointer;background:#492e1b;color:#fdf5e6;border:1px solid #6b4e2e;border-radius:2px}',
        '.toolbar-btn:hover{background:#6b4e2e}',
        '.toolbar-btn.danger{background:#d4e6f1;border-color:#5b9bd5;color:#1a5276}',
        '.toolbar-btn.danger:hover{background:#bdd7ee}',

        // ---- 举报表格 ----
        '#nga-report-table-wrap{overflow-x:auto}',
        '#nga-report-table{width:100%;border-collapse:collapse;font-size:12px}',
        '#nga-report-table th{background:#e0cfa6;color:#492e1b;padding:7px 8px;border:1px solid #c4a87c;text-align:left;white-space:nowrap;font-weight:bold}',
        '#nga-report-table td{padding:6px 8px;border:1px solid #d4c5a9;vertical-align:top}',
        '#nga-report-table tr:nth-child(even) td{background:#faf7f0}',
        '#nga-report-table tr:hover td{background:#f0e4cc}',
        '#nga-report-table a{color:#b56700;text-decoration:none}',
        '#nga-report-table a:hover{color:#8b3a00;text-decoration:underline}',
        '#nga-report-table .col-mark{width:60px;text-align:center}',
        '#nga-report-table .col-state{min-width:68px}',
        '#nga-report-table .col-time{width:120px;white-space:nowrap}',
        '#nga-report-table .col-type{width:50px;text-align:center}',
        '#nga-report-table .col-reporter{width:88px}',
        '#nga-report-table .col-reporter a{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '#nga-report-table .col-reported-user{width:88px}',
        '#nga-report-table .col-reported-user a{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '#nga-report-table .col-title{min-width:160px}',
        '#nga-report-table .col-reason{min-width:140px}',
        '#nga-report-table .col-forum{width:100px}',
        '#nga-report-table .col-action{width:110px;text-align:center}',

        // ---- 标签：类型 / 状态 / 标记 ----
        '.type-tag{display:inline-block;padding:1px 6px;border-radius:2px;font-size:11px;font-weight:bold}',
        '.type-topic{background:#d4e6f1;color:#1a5276}',
        '.type-reply{background:#d5f5e3;color:#1e8449}',
        '.state-tag{display:inline-block;padding:1px 5px;margin:1px;border-radius:2px;font-size:11px;font-weight:bold;background:#d4e6f1;color:#1a5276}',
        '.status-tag{display:inline-block;padding:1px 6px;border-radius:2px;font-size:11px;font-weight:bold}',
        '.status-unprocessed{background:#d5d5d5;color:#555}',
        '.status-processed{background:#d4e6f1;color:#1a5276}',
        '.status-marked{background:#f9e79f;color:#7d6608}',

        // ---- 状态筛选按钮 ----
        '.status-filter-btn{display:inline-block;padding:3px 12px;margin:0 3px;font-size:12px;cursor:pointer;background:#fdf5e6;border:1px solid #c4a87c;color:#6b4e2e;border-radius:2px;white-space:nowrap}',
        '.status-filter-btn:hover{background:#e8d8b8;border-color:#8b6914}',
        '.status-filter-btn.active{background:#492e1b;color:#fdf5e6;border-color:#492e1b}',

        // ---- 操作按钮：完成 / 标记 ----
        '.complete-btn{display:inline-block;padding:2px 8px;margin:1px 2px;font-size:11px;cursor:pointer;background:#d5f5e3;border:1px solid #82b366;color:#1e8449;border-radius:2px;white-space:nowrap}',
        '.complete-btn:hover{background:#abebc6}',
        '.complete-btn.is-done{background:#d5d5d5;border-color:#aaa;color:#555}',
        '.complete-btn.is-done:hover{background:#c0c0c0}',
        '.mark-btn{display:inline-block;padding:2px 8px;margin:1px 2px;font-size:11px;cursor:pointer;background:#f9e79f;border:1px solid #d4ac0d;color:#7d6608;border-radius:2px;white-space:nowrap}',
        '.mark-btn:hover{background:#f5d76e}',
        '.mark-btn.is-marked{background:#d4e6f1;border-color:#5b9bd5;color:#1a5276}',
        '.mark-btn.is-marked:hover{background:#bdd7ee}',

        // ---- 加载提示 ----
        '#nga-report-loading{text-align:center;padding:40px;color:#8b6914;font-size:14px}',

        // ---- 分页控件 ----
        '#nga-report-pagination{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:10px;padding:8px 0}',
        '.pagination-btn{padding:4px 12px;font-size:12px;cursor:pointer;background:#fdf5e6;border:1px solid #c4a87c;color:#6b4e2e;border-radius:2px;white-space:nowrap}',
        '.pagination-btn:hover{background:#e8d8b8;border-color:#8b6914}',
        '.pagination-btn:disabled{background:#eee;color:#bbb;border-color:#ddd;cursor:default}',
        '.pagination-info{font-size:12px;color:#6b4e2e;margin:0 4px}',

        // ---- 版面筛选页 ----
        '.filter-header{font-size:14px;font-weight:bold;color:#492e1b;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #d4c5a9}',
        '.filter-desc{font-size:12px;color:#8b6914;margin-bottom:12px}',
        '.filter-group{margin-bottom:10px}',
        '.filter-group-title{font-size:13px;font-weight:bold;color:#492e1b;cursor:pointer;padding:5px 8px;background:#f0e8d5;border:1px solid #d4c5a9;border-radius:2px}',
        '.filter-group-title:hover{background:#e8d8b8}',
        '.filter-group-title .arrow{display:inline-block;transition:transform 0.2s;margin-right:4px;font-size:11px}',
        '.filter-group-title .arrow.open{transform:rotate(90deg)}',
        '.filter-children{margin-left:20px;display:none}',
        '.filter-children.open{display:block}',
        '.filter-item{padding:4px 8px;cursor:pointer;font-size:12px;color:#492e1b;border:1px solid transparent;margin:2px 0}',
        '.filter-item:hover{background:#f0e8d5}',
        '.filter-item.selected{background:#d5e8d4;border-color:#82b366;font-weight:bold}',
        '.filter-item input[type="checkbox"]{margin-right:6px}',
        '.filter-count{display:inline-block;margin-left:6px;padding:0 5px;border-radius:8px;font-size:10px;font-weight:bold;background:#e0cfa6;color:#6b4e2e}',

        // ---- 关键词监测页 ----
        '.keyword-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}',
        '.keyword-input{padding:5px 10px;font-size:13px;border:1px solid #c4a87c;border-radius:2px;color:#492e1b;background:#fff;flex:1;min-width:200px}',
        '.keyword-input:focus{outline:none;border-color:#8b6914;box-shadow:0 0 3px rgba(139,105,20,0.3)}',
        '.keyword-color-input{width:36px;height:30px;padding:2px;border:1px solid #c4a87c;border-radius:2px;cursor:pointer;background:#fff}',
        '.keyword-list{margin-top:8px}',
        '.keyword-item{display:flex;align-items:center;padding:8px 10px;border:1px solid #d4c5a9;margin-bottom:4px;background:#fff;border-radius:2px;gap:8px;flex-wrap:wrap}',
        '.keyword-item:hover{background:#faf7f0}',
        '.keyword-text{flex:1;font-size:13px;color:#492e1b;min-width:120px}',
        '.keyword-color-dot{display:inline-block;width:18px;height:18px;border-radius:3px;border:1px solid #ba8b5a;flex-shrink:0}',
        '.keyword-highlight{padding:0 2px;border-radius:2px}',
        // toggle switch
        '.kw-toggle{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0}',
        '.kw-toggle input{opacity:0;width:0;height:0}',
        '.kw-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:.2s;border-radius:22px}',
        '.kw-slider:before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background-color:#fff;transition:.2s;border-radius:50%}',
        '.kw-toggle input:checked+.kw-slider{background-color:#27ae60}',
        '.kw-toggle input:checked+.kw-slider:before{transform:translateX(18px)}',
        '.kw-delete-btn{padding:2px 10px;font-size:11px;cursor:pointer;background:#fadbd8;border:1px solid #e6a8a0;color:#c0392b;border-radius:2px;white-space:nowrap}',
        '.kw-delete-btn:hover{background:#f5b7b1}',
        '.keyword-empty{text-align:center;padding:30px;color:#8b6914;font-size:13px}',

        // ---- 设置页 ----
        '.settings-section{margin-bottom:16px;padding:10px;background:#faf7f0;border:1px solid #d4c5a9;border-radius:2px}',
        '.settings-section h3{font-size:14px;color:#492e1b;margin:0 0 8px 0;padding-bottom:6px;border-bottom:1px solid #d4c5a9}',
        '.settings-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0}',
        '.settings-label{color:#492e1b;font-size:13px}',
        '.settings-value{color:#8b6914;font-weight:bold}',
        '.settings-btn{padding:5px 16px;cursor:pointer;font-size:12px;font-weight:bold;border:1px solid #c4a87c;background:#fdf5e6;color:#6b4e2e;border-radius:2px}',
        '.settings-btn:hover{background:#e8d8b8;border-color:#8b6914}',
        '.settings-btn.danger{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '.settings-btn.danger:hover{background:#f5b7b1}',
        '.settings-msg{font-size:12px;color:#27ae60;margin-top:6px}',

        // ---- 滚动条 ----
        '#nga-report-panel-body::-webkit-scrollbar{width:8px}',
        '#nga-report-panel-body::-webkit-scrollbar-track{background:#f5eedb}',
        '#nga-report-panel-body::-webkit-scrollbar-thumb{background:#c4a87c;border-radius:4px}',

        // ---- 手机端适配 (屏幕宽度 ≤ 768px) ----
        '@media (max-width:768px){',
            // 面板全屏
            '#nga-report-panel-overlay{padding-top:0;align-items:stretch}',
            '#nga-report-panel{width:100%;max-width:100%;max-height:100vh;border:none;border-radius:0;font-size:14px}',
            '#nga-report-panel-header{padding:10px 14px}',
            '#nga-report-panel-header span{font-size:16px}',
            '#nga-report-panel-close{font-size:22px;padding:4px}',
            // 标签页
            '#nga-report-tabs .tab-btn{padding:10px 14px;font-size:14px}',
            // 面板主体
            '#nga-report-panel-body{padding:8px}',
            // 统计栏纵向堆叠
            '#nga-report-stats{flex-direction:column;align-items:flex-start;gap:6px}',
            '#nga-report-stats>div{width:100%}',
            // 工具栏
            '#nga-report-toolbar{gap:6px;flex-wrap:wrap}',
            '.toolbar-btn{padding:8px 18px;font-size:13px}',
            // 表格 - 强制横向滚动
            '#nga-report-table-wrap{-webkit-overflow-scrolling:touch}',
            '#nga-report-table{font-size:11px}',
            '#nga-report-table th,#nga-report-table td{padding:5px 6px}',
            // 标签
            '.type-tag,.state-tag,.status-tag{font-size:10px;padding:2px 5px}',
            '.state-tag{margin:2px 1px}',
            // 操作按钮
            '.complete-btn,.mark-btn{padding:4px 10px;font-size:12px;margin:2px}',
            // 状态筛选按钮
            '.status-filter-btn{padding:6px 14px;font-size:13px;margin:2px}',
            // 分页
            '#nga-report-pagination{flex-wrap:wrap;gap:4px}',
            '.pagination-btn{padding:6px 12px;font-size:13px}',
            '.pagination-info{font-size:13px}',
            // 筛选页
            '.filter-item{padding:8px 10px;font-size:13px}',
            '.filter-group-title{padding:8px 10px;font-size:14px}',
            '.filter-children{margin-left:12px}',
            '.filter-count{font-size:11px;padding:1px 6px}',
            // 关键词页
            '.keyword-toolbar{flex-direction:column;align-items:stretch}',
            '.keyword-input{min-width:auto}',
            '.keyword-item{gap:6px;padding:10px 8px}',
            '.keyword-text{font-size:14px}',
            // 设置页
            '.settings-row{flex-direction:column;align-items:flex-start;gap:4px}',
            '.settings-btn{padding:8px 18px;font-size:13px}',
            // 加载
            '#nga-report-loading{padding:30px;font-size:15px}',
        '}'
    ].join('\n');
    document.head.appendChild(styleEl);

    // 浅彩主题覆写样式
    var pastelStyleEl = document.createElement('style');
    pastelStyleEl.id = 'nga-report-pastel-theme';
    pastelStyleEl.textContent = [
        '#nga-report-panel-overlay.theme-pastel #nga-report-panel{background:#fff;border-color:#5bcffa;color:#333}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-panel-header{background:#5bcffa;color:#fff}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-panel-close{color:#fff}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-tabs{background:#f5abb9;border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-tabs .tab-btn{background:#f5abb9;color:#fff;border-color:#f0a0af}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-tabs .tab-btn:hover{background:#f8c5cf}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-tabs .tab-btn.active{background:#fff;color:#333;border-color:#fff}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-stats{background:#f0f9ff;border-color:#d0e8f5}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-stats span{color:#555}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-stats strong{color:#e05060}',
        '#nga-report-panel-overlay.theme-pastel .toolbar-btn{background:#5bcffa;color:#fff;border-color:#3db8e5}',
        '#nga-report-panel-overlay.theme-pastel .toolbar-btn:hover{background:#3db8e5}',
        '#nga-report-panel-overlay.theme-pastel .toolbar-btn.danger{background:#e8f4fd;border-color:#5bcffa;color:#2471a3}',
        '#nga-report-panel-overlay.theme-pastel .toolbar-btn.danger:hover{background:#d0eafc}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table th{background:#e8f4fd;color:#333;border-color:#d0e8f5}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table td{border-color:#e0e0e0}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table tr:nth-child(even) td{background:#fafafa}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table tr:hover td{background:#fff0f3}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table a{color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-table a:hover{color:#3db8e5}',
        '#nga-report-panel-overlay.theme-pastel .type-topic{background:#e8f4fd;color:#2471a3}',
        '#nga-report-panel-overlay.theme-pastel .type-reply{background:#e8f8e8;color:#1e8449}',
        '#nga-report-panel-overlay.theme-pastel .state-tag{background:#e8f4fd;color:#2471a3}',
        '#nga-report-panel-overlay.theme-pastel .status-unprocessed{background:#e0e0e0;color:#666}',
        '#nga-report-panel-overlay.theme-pastel .status-processed{background:#e8f4fd;color:#2471a3}',
        '#nga-report-panel-overlay.theme-pastel .status-marked{background:#fff0f3;color:#c0392b}',
        '#nga-report-panel-overlay.theme-pastel .status-filter-btn{background:#fff;border-color:#d0d0d0;color:#555}',
        '#nga-report-panel-overlay.theme-pastel .status-filter-btn:hover{background:#f0f0f0;border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .status-filter-btn.active{background:#5bcffa;color:#fff;border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .complete-btn{background:#e8f8e8;border-color:#82b366;color:#1e8449}',
        '#nga-report-panel-overlay.theme-pastel .complete-btn:hover{background:#c8e8c8}',
        '#nga-report-panel-overlay.theme-pastel .complete-btn.is-done{background:#e0e0e0;border-color:#bbb;color:#666}',
        '#nga-report-panel-overlay.theme-pastel .complete-btn.is-done:hover{background:#d0d0d0}',
        '#nga-report-panel-overlay.theme-pastel .mark-btn{background:#fff0f3;border-color:#f5abb9;color:#c0392b}',
        '#nga-report-panel-overlay.theme-pastel .mark-btn:hover{background:#fde0e5}',
        '#nga-report-panel-overlay.theme-pastel .mark-btn.is-marked{background:#e8f4fd;border-color:#5bcffa;color:#2471a3}',
        '#nga-report-panel-overlay.theme-pastel .mark-btn.is-marked:hover{background:#d0eafc}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-loading{color:#888}',
        '#nga-report-panel-overlay.theme-pastel .pagination-btn{background:#fff;border-color:#d0d0d0;color:#555}',
        '#nga-report-panel-overlay.theme-pastel .pagination-btn:hover{background:#f0f0f0;border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .pagination-btn:disabled{background:#f5f5f5;color:#ccc;border-color:#eee}',
        '#nga-report-panel-overlay.theme-pastel .pagination-info{color:#555}',
        '#nga-report-panel-overlay.theme-pastel .filter-header{color:#333;border-color:#e0e0e0}',
        '#nga-report-panel-overlay.theme-pastel .filter-desc{color:#888}',
        '#nga-report-panel-overlay.theme-pastel .filter-group-title{background:#f0f9ff;border-color:#d0e8f5;color:#333}',
        '#nga-report-panel-overlay.theme-pastel .filter-group-title:hover{background:#e0f0fa}',
        '#nga-report-panel-overlay.theme-pastel .filter-item{color:#333}',
        '#nga-report-panel-overlay.theme-pastel .filter-item:hover{background:#f0f9ff}',
        '#nga-report-panel-overlay.theme-pastel .filter-item.selected{background:#e8f8e8;border-color:#82b366}',
        '#nga-report-panel-overlay.theme-pastel .filter-count{background:#e8f4fd;color:#555}',
        '#nga-report-panel-overlay.theme-pastel .keyword-input{border-color:#d0d0d0;color:#333}',
        '#nga-report-panel-overlay.theme-pastel .keyword-input:focus{border-color:#5bcffa;box-shadow:0 0 3px rgba(91,207,250,0.3)}',
        '#nga-report-panel-overlay.theme-pastel .keyword-item{border-color:#e0e0e0}',
        '#nga-report-panel-overlay.theme-pastel .keyword-item:hover{background:#fafafa}',
        '#nga-report-panel-overlay.theme-pastel .keyword-text{color:#333}',
        '#nga-report-panel-overlay.theme-pastel .keyword-color-dot{border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .kw-delete-btn{background:#ffe0e5;border-color:#f5abb9;color:#c0392b}',
        '#nga-report-panel-overlay.theme-pastel .kw-delete-btn:hover{background:#fccdd5}',
        '#nga-report-panel-overlay.theme-pastel .keyword-empty{color:#888}',
        '#nga-report-panel-overlay.theme-pastel .kw-slider{background-color:#ddd}',
        '#nga-report-panel-overlay.theme-pastel .kw-toggle input:checked+.kw-slider{background-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .settings-section{background:#fafafa;border-color:#e0e0e0}',
        '#nga-report-panel-overlay.theme-pastel .settings-section h3{color:#333;border-color:#e0e0e0}',
        '#nga-report-panel-overlay.theme-pastel .settings-label{color:#333}',
        '#nga-report-panel-overlay.theme-pastel .settings-value{color:#888}',
        '#nga-report-panel-overlay.theme-pastel .settings-btn{background:#fff;border-color:#d0d0d0;color:#555}',
        '#nga-report-panel-overlay.theme-pastel .settings-btn:hover{background:#f0f0f0;border-color:#5bcffa}',
        '#nga-report-panel-overlay.theme-pastel .settings-btn.danger{background:#ffe0e5;border-color:#f5abb9;color:#c0392b}',
        '#nga-report-panel-overlay.theme-pastel .settings-btn.danger:hover{background:#fccdd5}',
        '#nga-report-panel-overlay.theme-pastel .settings-msg{color:#27ae60}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-panel-body::-webkit-scrollbar-track{background:#f0f0f0}',
        '#nga-report-panel-overlay.theme-pastel #nga-report-panel-body::-webkit-scrollbar-thumb{background:#c0c0c0}'
    ].join('\n');
    pastelStyleEl.disabled = true;
    document.head.appendChild(pastelStyleEl);

    // 沙漠主题覆写样式
    var desertStyleEl = document.createElement('style');
    desertStyleEl.id = 'nga-report-desert-theme';
    desertStyleEl.textContent = [
        '#nga-report-panel-overlay.theme-desert #nga-report-panel{background:#FDF4AF;border-color:#34908B;color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert #nga-report-panel-header{background:#34908B;color:#fff}',
        '#nga-report-panel-overlay.theme-desert #nga-report-panel-close{color:#FDF4AF}',
        '#nga-report-panel-overlay.theme-desert #nga-report-tabs{background:#6FBEB2;border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert #nga-report-tabs .tab-btn{background:#6FBEB2;color:#fff;border-color:#5aad9f}',
        '#nga-report-panel-overlay.theme-desert #nga-report-tabs .tab-btn:hover{background:#80cec2}',
        '#nga-report-panel-overlay.theme-desert #nga-report-tabs .tab-btn.active{background:#FDF4AF;color:#2c3e2d;border-color:#FDF4AF}',
        '#nga-report-panel-overlay.theme-desert #nga-report-stats{background:#f5f0d0;border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-stats span{color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert #nga-report-stats strong{color:#c0392b}',
        '#nga-report-panel-overlay.theme-desert .toolbar-btn{background:#34908B;color:#fff;border-color:#2a7a75}',
        '#nga-report-panel-overlay.theme-desert .toolbar-btn:hover{background:#2a7a75}',
        '#nga-report-panel-overlay.theme-desert .toolbar-btn.danger{background:#d4e6f1;border-color:#6FBEB2;color:#1a5276}',
        '#nga-report-panel-overlay.theme-desert .toolbar-btn.danger:hover{background:#bdd7ee}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table th{background:#e8e0c0;color:#2c3e2d;border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table td{border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table tr:nth-child(even) td{background:#faf5e0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table tr:hover td{background:#f0ebd0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table a{color:#34908B}',
        '#nga-report-panel-overlay.theme-desert #nga-report-table a:hover{color:#2a7a75}',
        '#nga-report-panel-overlay.theme-desert .type-topic{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-desert .type-reply{background:#d5f5e3;color:#1e8449}',
        '#nga-report-panel-overlay.theme-desert .state-tag{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-desert .status-unprocessed{background:#e0dcc0;color:#665}',
        '#nga-report-panel-overlay.theme-desert .status-processed{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-desert .status-marked{background:#f9e79f;color:#7d6608}',
        '#nga-report-panel-overlay.theme-desert .status-filter-btn{background:#FDF4AF;border-color:#d4cfa0;color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert .status-filter-btn:hover{background:#f0e8c0;border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .status-filter-btn.active{background:#34908B;color:#fff;border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .complete-btn{background:#d5f5e3;border-color:#82b366;color:#1e8449}',
        '#nga-report-panel-overlay.theme-desert .complete-btn:hover{background:#abebc6}',
        '#nga-report-panel-overlay.theme-desert .complete-btn.is-done{background:#e0dcc0;border-color:#bbb;color:#665}',
        '#nga-report-panel-overlay.theme-desert .complete-btn.is-done:hover{background:#d0ccb0}',
        '#nga-report-panel-overlay.theme-desert .mark-btn{background:#f9e79f;border-color:#d4ac0d;color:#7d6608}',
        '#nga-report-panel-overlay.theme-desert .mark-btn:hover{background:#f5d76e}',
        '#nga-report-panel-overlay.theme-desert .mark-btn.is-marked{background:#d4e6f1;border-color:#6FBEB2;color:#1a5276}',
        '#nga-report-panel-overlay.theme-desert .mark-btn.is-marked:hover{background:#bdd7ee}',
        '#nga-report-panel-overlay.theme-desert #nga-report-loading{color:#8b8554}',
        '#nga-report-panel-overlay.theme-desert .pagination-btn{background:#FDF4AF;border-color:#d4cfa0;color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert .pagination-btn:hover{background:#f0e8c0;border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .pagination-btn:disabled{background:#f5f0d0;color:#ccc;border-color:#e0dcc0}',
        '#nga-report-panel-overlay.theme-desert .pagination-info{color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert .filter-header{color:#2c3e2d;border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert .filter-desc{color:#8b8554}',
        '#nga-report-panel-overlay.theme-desert .filter-group-title{background:#f0e8c0;border-color:#d4cfa0;color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert .filter-group-title:hover{background:#e8d8b8}',
        '#nga-report-panel-overlay.theme-desert .filter-item{color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert .filter-item:hover{background:#f0e8c0}',
        '#nga-report-panel-overlay.theme-desert .filter-item.selected{background:#d5e8d4;border-color:#82b366}',
        '#nga-report-panel-overlay.theme-desert .filter-count{background:#e8e0c0;color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert .keyword-input{border-color:#d4cfa0;color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert .keyword-input:focus{border-color:#34908B;box-shadow:0 0 3px rgba(52,144,139,0.3)}',
        '#nga-report-panel-overlay.theme-desert .keyword-item{border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert .keyword-item:hover{background:#faf5e0}',
        '#nga-report-panel-overlay.theme-desert .keyword-text{color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert .keyword-color-dot{border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .kw-delete-btn{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '#nga-report-panel-overlay.theme-desert .kw-delete-btn:hover{background:#f5b7b1}',
        '#nga-report-panel-overlay.theme-desert .keyword-empty{color:#8b8554}',
        '#nga-report-panel-overlay.theme-desert .kw-slider{background-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert .kw-toggle input:checked+.kw-slider{background-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .settings-section{background:#faf5e0;border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert .settings-section h3{color:#2c3e2d;border-color:#d4cfa0}',
        '#nga-report-panel-overlay.theme-desert .settings-label{color:#2c3e2d}',
        '#nga-report-panel-overlay.theme-desert .settings-value{color:#8b8554}',
        '#nga-report-panel-overlay.theme-desert .settings-btn{background:#FDF4AF;border-color:#d4cfa0;color:#5a5530}',
        '#nga-report-panel-overlay.theme-desert .settings-btn:hover{background:#f0e8c0;border-color:#34908B}',
        '#nga-report-panel-overlay.theme-desert .settings-btn.danger{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '#nga-report-panel-overlay.theme-desert .settings-btn.danger:hover{background:#f5b7b1}',
        '#nga-report-panel-overlay.theme-desert .settings-msg{color:#27ae60}',
        '#nga-report-panel-overlay.theme-desert #nga-report-panel-body::-webkit-scrollbar-track{background:#f5f0d0}',
        '#nga-report-panel-overlay.theme-desert #nga-report-panel-body::-webkit-scrollbar-thumb{background:#6FBEB2}'
    ].join('\n');
    desertStyleEl.disabled = true;
    document.head.appendChild(desertStyleEl);

    // 迷彩主题覆写样式
    var camoStyleEl = document.createElement('style');
    camoStyleEl.id = 'nga-report-camo-theme';
    camoStyleEl.textContent = [
        '#nga-report-panel-overlay.theme-camo #nga-report-panel{background:#EEE;border-color:#777C6D;color:#444}',
        '#nga-report-panel-overlay.theme-camo #nga-report-panel-header{background:#777C6D;color:#EEE}',
        '#nga-report-panel-overlay.theme-camo #nga-report-panel-close{color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo #nga-report-tabs{background:#B7B89F;border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo #nga-report-tabs .tab-btn{background:#B7B89F;color:#fff;border-color:#a5a68d}',
        '#nga-report-panel-overlay.theme-camo #nga-report-tabs .tab-btn:hover{background:#c5c6ad}',
        '#nga-report-panel-overlay.theme-camo #nga-report-tabs .tab-btn.active{background:#EEE;color:#444;border-color:#EEE}',
        '#nga-report-panel-overlay.theme-camo #nga-report-stats{background:#e8e8e8;border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo #nga-report-stats span{color:#666}',
        '#nga-report-panel-overlay.theme-camo #nga-report-stats strong{color:#c0392b}',
        '#nga-report-panel-overlay.theme-camo .toolbar-btn{background:#777C6D;color:#EEE;border-color:#5f6457}',
        '#nga-report-panel-overlay.theme-camo .toolbar-btn:hover{background:#5f6457}',
        '#nga-report-panel-overlay.theme-camo .toolbar-btn.danger{background:#d4e6f1;border-color:#B7B89F;color:#1a5276}',
        '#nga-report-panel-overlay.theme-camo .toolbar-btn.danger:hover{background:#bdd7ee}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table th{background:#d8d9c8;color:#444;border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table td{border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table tr:nth-child(even) td{background:#f5f5f5}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table tr:hover td{background:#ebebe0}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table a{color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo #nga-report-table a:hover{color:#5f6457}',
        '#nga-report-panel-overlay.theme-camo .type-topic{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-camo .type-reply{background:#d5f5e3;color:#1e8449}',
        '#nga-report-panel-overlay.theme-camo .state-tag{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-camo .status-unprocessed{background:#ddd;color:#666}',
        '#nga-report-panel-overlay.theme-camo .status-processed{background:#d4e6f1;color:#1a5276}',
        '#nga-report-panel-overlay.theme-camo .status-marked{background:#f9e79f;color:#7d6608}',
        '#nga-report-panel-overlay.theme-camo .status-filter-btn{background:#EEE;border-color:#CBCBCB;color:#666}',
        '#nga-report-panel-overlay.theme-camo .status-filter-btn:hover{background:#e0e0e0;border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .status-filter-btn.active{background:#777C6D;color:#EEE;border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .complete-btn{background:#d5f5e3;border-color:#82b366;color:#1e8449}',
        '#nga-report-panel-overlay.theme-camo .complete-btn:hover{background:#abebc6}',
        '#nga-report-panel-overlay.theme-camo .complete-btn.is-done{background:#ddd;border-color:#bbb;color:#666}',
        '#nga-report-panel-overlay.theme-camo .complete-btn.is-done:hover{background:#ccc}',
        '#nga-report-panel-overlay.theme-camo .mark-btn{background:#f9e79f;border-color:#d4ac0d;color:#7d6608}',
        '#nga-report-panel-overlay.theme-camo .mark-btn:hover{background:#f5d76e}',
        '#nga-report-panel-overlay.theme-camo .mark-btn.is-marked{background:#d4e6f1;border-color:#B7B89F;color:#1a5276}',
        '#nga-report-panel-overlay.theme-camo .mark-btn.is-marked:hover{background:#bdd7ee}',
        '#nga-report-panel-overlay.theme-camo #nga-report-loading{color:#888}',
        '#nga-report-panel-overlay.theme-camo .pagination-btn{background:#EEE;border-color:#CBCBCB;color:#666}',
        '#nga-report-panel-overlay.theme-camo .pagination-btn:hover{background:#e0e0e0;border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .pagination-btn:disabled{background:#f0f0f0;color:#ccc;border-color:#eee}',
        '#nga-report-panel-overlay.theme-camo .pagination-info{color:#666}',
        '#nga-report-panel-overlay.theme-camo .filter-header{color:#444;border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo .filter-desc{color:#888}',
        '#nga-report-panel-overlay.theme-camo .filter-group-title{background:#e0e1d0;border-color:#CBCBCB;color:#444}',
        '#nga-report-panel-overlay.theme-camo .filter-group-title:hover{background:#d0d1c0}',
        '#nga-report-panel-overlay.theme-camo .filter-item{color:#444}',
        '#nga-report-panel-overlay.theme-camo .filter-item:hover{background:#e0e1d0}',
        '#nga-report-panel-overlay.theme-camo .filter-item.selected{background:#d5e8d4;border-color:#82b366}',
        '#nga-report-panel-overlay.theme-camo .filter-count{background:#d8d9c8;color:#666}',
        '#nga-report-panel-overlay.theme-camo .keyword-input{border-color:#CBCBCB;color:#444}',
        '#nga-report-panel-overlay.theme-camo .keyword-input:focus{border-color:#777C6D;box-shadow:0 0 3px rgba(119,124,109,0.3)}',
        '#nga-report-panel-overlay.theme-camo .keyword-item{border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo .keyword-item:hover{background:#f5f5f5}',
        '#nga-report-panel-overlay.theme-camo .keyword-text{color:#444}',
        '#nga-report-panel-overlay.theme-camo .keyword-color-dot{border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .kw-delete-btn{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '#nga-report-panel-overlay.theme-camo .kw-delete-btn:hover{background:#f5b7b1}',
        '#nga-report-panel-overlay.theme-camo .keyword-empty{color:#888}',
        '#nga-report-panel-overlay.theme-camo .kw-slider{background-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo .kw-toggle input:checked+.kw-slider{background-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .settings-section{background:#f5f5f5;border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo .settings-section h3{color:#444;border-color:#CBCBCB}',
        '#nga-report-panel-overlay.theme-camo .settings-label{color:#444}',
        '#nga-report-panel-overlay.theme-camo .settings-value{color:#888}',
        '#nga-report-panel-overlay.theme-camo .settings-btn{background:#EEE;border-color:#CBCBCB;color:#666}',
        '#nga-report-panel-overlay.theme-camo .settings-btn:hover{background:#e0e0e0;border-color:#777C6D}',
        '#nga-report-panel-overlay.theme-camo .settings-btn.danger{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '#nga-report-panel-overlay.theme-camo .settings-btn.danger:hover{background:#f5b7b1}',
        '#nga-report-panel-overlay.theme-camo .settings-msg{color:#27ae60}',
        '#nga-report-panel-overlay.theme-camo #nga-report-panel-body::-webkit-scrollbar-track{background:#e8e8e8}',
        '#nga-report-panel-overlay.theme-camo #nga-report-panel-body::-webkit-scrollbar-thumb{background:#B7B89F}'
    ].join('\n');
    camoStyleEl.disabled = true;
    document.head.appendChild(camoStyleEl);

    // 暗绿主题覆写样式
    var darkGreenStyleEl = document.createElement('style');
    darkGreenStyleEl.id = 'nga-report-darkgreen-theme';
    darkGreenStyleEl.textContent = [
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-panel{background:#18230F;border-color:#1F7D53;color:#c8d6c0}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-panel-header{background:#1F7D53;color:#e0f0e0}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-panel-close{color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-tabs{background:#27391C;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-tabs .tab-btn{background:#27391C;color:#b0c8a0;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-tabs .tab-btn:hover{background:#2f4522}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-tabs .tab-btn.active{background:#18230F;color:#c8d6c0;border-color:#18230F}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-stats{background:#1e2d14;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-stats span{color:#a0b898}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-stats strong{color:#e07060}',
        '#nga-report-panel-overlay.theme-darkgreen .toolbar-btn{background:#255F38;color:#e0f0e0;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .toolbar-btn:hover{background:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .toolbar-btn.danger{background:#1e3d2e;border-color:#255F38;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .toolbar-btn.danger:hover{background:#254a36}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table th{background:#27391C;color:#c8d6c0;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table td{border-color:#1e2d14;color:#b0c8a0}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table tr:nth-child(even) td{background:#1e2d14}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table tr:hover td{background:#223a18}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table a{color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-table a:hover{color:#3ddf80}',
        '#nga-report-panel-overlay.theme-darkgreen .type-topic{background:#1e3d2e;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .type-reply{background:#1e3d2e;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .state-tag{background:#1e3d2e;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .status-unprocessed{background:#2a2a2a;color:#999}',
        '#nga-report-panel-overlay.theme-darkgreen .status-processed{background:#1e3d2e;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .status-marked{background:#3d3520;color:#d4ac0d}',
        '#nga-report-panel-overlay.theme-darkgreen .status-filter-btn{background:#27391C;border-color:#255F38;color:#a0b898}',
        '#nga-report-panel-overlay.theme-darkgreen .status-filter-btn:hover{background:#2f4522;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .status-filter-btn.active{background:#1F7D53;color:#e0f0e0;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .complete-btn{background:#1e3d2e;border-color:#1F7D53;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .complete-btn:hover{background:#254a36}',
        '#nga-report-panel-overlay.theme-darkgreen .complete-btn.is-done{background:#2a2a2a;border-color:#555;color:#999}',
        '#nga-report-panel-overlay.theme-darkgreen .complete-btn.is-done:hover{background:#333}',
        '#nga-report-panel-overlay.theme-darkgreen .mark-btn{background:#3d3520;border-color:#d4ac0d;color:#d4ac0d}',
        '#nga-report-panel-overlay.theme-darkgreen .mark-btn:hover{background:#4a4028}',
        '#nga-report-panel-overlay.theme-darkgreen .mark-btn.is-marked{background:#1e3d2e;border-color:#1F7D53;color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .mark-btn.is-marked:hover{background:#254a36}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-loading{color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .pagination-btn{background:#27391C;border-color:#255F38;color:#a0b898}',
        '#nga-report-panel-overlay.theme-darkgreen .pagination-btn:hover{background:#2f4522;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .pagination-btn:disabled{background:#1e2d14;color:#556;border-color:#1e2d14}',
        '#nga-report-panel-overlay.theme-darkgreen .pagination-info{color:#a0b898}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-header{color:#c8d6c0;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-desc{color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-group-title{background:#27391C;border-color:#255F38;color:#c8d6c0}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-group-title:hover{background:#2f4522}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-item{color:#b0c8a0}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-item:hover{background:#27391C}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-item.selected{background:#1e3d2e;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .filter-count{background:#255F38;color:#e0f0e0}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-input{border-color:#255F38;color:#c8d6c0;background:#1e2d14}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-input:focus{border-color:#1F7D53;box-shadow:0 0 3px rgba(31,125,83,0.3)}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-item{border-color:#255F38;background:#1e2d14}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-item:hover{background:#223a18}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-text{color:#c8d6c0}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-color-dot{border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .kw-delete-btn{background:#3d2020;border-color:#a05050;color:#e07060}',
        '#nga-report-panel-overlay.theme-darkgreen .kw-delete-btn:hover{background:#4a2828}',
        '#nga-report-panel-overlay.theme-darkgreen .keyword-empty{color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .kw-slider{background-color:#444}',
        '#nga-report-panel-overlay.theme-darkgreen .kw-toggle input:checked+.kw-slider{background-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-section{background:#1e2d14;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-section h3{color:#c8d6c0;border-color:#255F38}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-label{color:#b0c8a0}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-value{color:#8fbf8f}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-btn{background:#27391C;border-color:#255F38;color:#a0b898}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-btn:hover{background:#2f4522;border-color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-btn.danger{background:#3d2020;border-color:#a05050;color:#e07060}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-btn.danger:hover{background:#4a2828}',
        '#nga-report-panel-overlay.theme-darkgreen .settings-msg{color:#1F7D53}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-panel-body::-webkit-scrollbar-track{background:#1e2d14}',
        '#nga-report-panel-overlay.theme-darkgreen #nga-report-panel-body::-webkit-scrollbar-thumb{background:#255F38}'
    ].join('\n');
    darkGreenStyleEl.disabled = true;
    document.head.appendChild(darkGreenStyleEl);

    // ========== 缓存Key ==========
    var CACHE_KEY = 'nga_report_cache';
    var FILTER_KEY = 'nga_report_filter';
    var STATUS_KEY = 'nga_report_status';
    var STATUS_FILTER_KEY = 'nga_report_status_filter';
    var KEYWORD_KEY = 'nga_keywords';
    var SYSTEM_FILTER_KEY = 'nga_system_filter';
    var THEME_KEY = 'nga_theme';
    var COLUMN_VISIBILITY_KEY = 'nga_column_visibility';
    var COLUMNS = [
        { key: 'mark', label: '标记', cls: 'col-mark' },
        { key: 'state', label: '状态', cls: 'col-state' },
        { key: 'time', label: '举报时间', cls: 'col-time' },
        { key: 'type', label: '类型', cls: 'col-type' },
        { key: 'reporter', label: '举报人', cls: 'col-reporter' },
        { key: 'title', label: '帖子标题', cls: 'col-title' },
        { key: 'reportedUser', label: '被举报人', cls: 'col-reported-user' },
        { key: 'reason', label: '举报理由', cls: 'col-reason' },
        { key: 'forum', label: '版块', cls: 'col-forum' }
        // 操作列始终显示，不在列表中
    ];
    var STATUS_UNPROCESSED = 0;
    var STATUS_PROCESSED = 1;
    var STATUS_MARKED = 2;
    var STATUS_LABELS = ['未处理', '已处理', '已标记'];
    var STATUS_CSS = ['status-unprocessed', 'status-processed', 'status-marked'];
    var PAGE_SIZE = 25;
    var currentPage = 0;

    var DATA_KEYS = [CACHE_KEY, STATUS_KEY, FILTER_KEY, STATUS_FILTER_KEY, STATE_CACHE_KEY, REPORTED_USER_CACHE_KEY, KEYWORD_KEY, SYSTEM_FILTER_KEY, COLUMN_VISIBILITY_KEY, THEME_KEY];

    function buildReportKey(r) {
        return r[6] + '_' + r[7] + '_' + r[1] + '_' + r[9];
    }

    function getStatusMap() {
        try {
            var raw = localStorage.getItem(STATUS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function saveStatusMap(map) {
        try { localStorage.setItem(STATUS_KEY, JSON.stringify(map)); } catch (e) {}
    }

    function getReportStatus(r) {
        var map = getStatusMap();
        var key = buildReportKey(r);
        return map.hasOwnProperty(key) ? map[key] : STATUS_UNPROCESSED;
    }

    function setReportStatus(r, status) {
        var map = getStatusMap();
        map[buildReportKey(r)] = status;
        saveStatusMap(map);
    }

    function getStatusFilter() {
        try {
            var raw = localStorage.getItem(STATUS_FILTER_KEY);
            return raw !== null ? parseInt(raw) : -1;
        } catch (e) { return -1; }
    }

    function setStatusFilter(filter) {
        try { localStorage.setItem(STATUS_FILTER_KEY, filter); } catch (e) {}
    }

    function isSystemFilterEnabled() {
        try { return localStorage.getItem(SYSTEM_FILTER_KEY) === '1'; } catch (e) { return false; }
    }

    function setSystemFilter(enabled) {
        try { localStorage.setItem(SYSTEM_FILTER_KEY, enabled ? '1' : '0'); } catch (e) {}
    }

    function getTheme() {
        try { return localStorage.getItem(THEME_KEY) || 'nga'; } catch (e) { return 'nga'; }
    }

    function setTheme(theme) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
        applyTheme(theme);
    }

    function applyTheme(theme) {
        var overlay = document.getElementById('nga-report-panel-overlay');
        if (overlay) {
            overlay.classList.toggle('theme-pastel', theme === 'pastel');
            overlay.classList.toggle('theme-desert', theme === 'desert');
            overlay.classList.toggle('theme-camo', theme === 'camo');
            overlay.classList.toggle('theme-darkgreen', theme === 'darkgreen');
        }
        if (pastelStyleEl) pastelStyleEl.disabled = theme !== 'pastel';
        if (desertStyleEl) desertStyleEl.disabled = theme !== 'desert';
        if (camoStyleEl) camoStyleEl.disabled = theme !== 'camo';
        if (darkGreenStyleEl) darkGreenStyleEl.disabled = theme !== 'darkgreen';
    }

    function getColumnVisibility() {
        var defaults = {};
        for (var i = 0; i < COLUMNS.length; i++) {
            defaults[COLUMNS[i].key] = true;
        }
        try {
            var raw = localStorage.getItem(COLUMN_VISIBILITY_KEY);
            if (!raw) return defaults;
            var saved = JSON.parse(raw);
            for (var k in defaults) {
                if (defaults.hasOwnProperty(k) && !saved.hasOwnProperty(k)) {
                    saved[k] = defaults[k];
                }
            }
            return saved;
        } catch (e) { return defaults; }
    }

    function isColumnVisible(key) {
        var vis = getColumnVisibility();
        return vis.hasOwnProperty(key) ? vis[key] : true;
    }

    function setColumnVisibility(key, visible) {
        var vis = getColumnVisibility();
        vis[key] = visible;
        try { localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(vis)); } catch (e) {}
    }

    // ========== 帖子状态解析 ==========
    var STATE_CACHE_KEY = 'nga_post_state_cache';
    var REPORTED_USER_CACHE_KEY = 'nga_reported_user_cache';

    function getPostStates(type) {
        var stateMap = [
            { mask: 1,        name: '附件' },
            { mask: 2,        name: '隐藏' },
            { mask: 8,        name: '延时' },
            { mask: 32,       name: '标记' },
            { mask: 128,      name: '编辑' },
            { mask: 256,      name: '占楼' },
            { mask: 512,      name: '审核中' },
            { mask: 1024,     name: '锁定' },
            { mask: 2048,     name: '处罚' },
            { mask: 8192,     name: '附件' },
            { mask: 16384,    name: '审核中' },
            { mask: 32768,    name: '合集' },
            { mask: 65536,    name: '直播' },
            { mask: 131072,   name: '本区' },
            { mask: 262144,   name: '匿名' },
            { mask: 524288,   name: '附件显示' },
            { mask: 2097152,  name: '版面' },
            { mask: 16777216, name: '下沉' },
            { mask: 67108864, name: '黑审' }
        ];
        var states = [];
        for (var i = 0; i < stateMap.length; i++) {
            if ((type & stateMap[i].mask) === stateMap[i].mask) {
                states.push(stateMap[i].name);
            }
        }
        return states;
    }

    function getStateCache() {
        try {
            var raw = localStorage.getItem(STATE_CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function saveStateCache(cache) {
        try { localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
    }

    function makeStateCacheKey(reportType, tid, pid) {
        return reportType === 13 ? ('tid_' + tid) : ('pid_' + pid);
    }

    function getReportedUserCache() {
        try {
            var raw = localStorage.getItem(REPORTED_USER_CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function saveReportedUserCache(cache) {
        try { localStorage.setItem(REPORTED_USER_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
    }

    function makeReportedUserCacheKey(reportType, tid, pid) {
        return 'ru_' + (reportType === 13 ? ('tid_' + tid) : ('pid_' + pid));
    }

    function fetchPostInfo(reportType, tid, pid, onState, onUser) {
        var stateKey = makeStateCacheKey(reportType, tid, pid);
        var userKey = makeReportedUserCacheKey(reportType, tid, pid);
        var stateCache = getStateCache();
        var userCache = getReportedUserCache();

        var hasState = stateCache.hasOwnProperty(stateKey);
        var hasUser = userCache.hasOwnProperty(userKey);

        if (hasState && hasUser) {
            onState(stateCache[stateKey]);
            onUser(userCache[userKey]);
            return;
        }

        // 已缓存的部分立即回调
        if (hasState) onState(stateCache[stateKey]);
        if (hasUser) onUser(userCache[userKey]);

        var url = reportType === 13
            ? '/read.php?tid=' + tid + '&__output=11'
            : '/read.php?pid=' + pid + '&__output=11';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;
        xhr.onload = function() {
            if (xhr.status !== 200) {
                if (!hasState) { onState([]); stateCache[stateKey] = []; saveStateCache(stateCache); }
                if (!hasUser) { onUser(null); userCache[userKey] = null; saveReportedUserCache(userCache); }
                return;
            }
            try {
                var resp = JSON.parse(xhr.responseText);
                var data = resp.data || resp;

                if (!hasState) {
                    var typeVal = reportType === 13
                        ? ((data.__T && data.__T.type) ? data.__T.type : 0)
                        : ((data.__R && data.__R.length > 0) ? (data.__R[0].type || 0) : 0);
                    var states = getPostStates(typeVal);
                    stateCache[stateKey] = states;
                    saveStateCache(stateCache);
                    onState(states);
                }

                if (!hasUser) {
                    var authorid = reportType === 13
                        ? ((data.__T && data.__T.authorid) ? data.__T.authorid : 0)
                        : ((data.__R && data.__R.length > 0) ? (data.__R[0].authorid || 0) : 0);
                    var result = null;
                    if (authorid === -1) {
                        result = { uid: -1, username: '匿名' };
                    } else if (authorid && data.__U && data.__U[authorid]) {
                        result = { uid: authorid, username: data.__U[authorid].username };
                    }
                    userCache[userKey] = result;
                    saveReportedUserCache(userCache);
                    onUser(result);
                }
            } catch (e) {
                if (!hasState) { onState([]); stateCache[stateKey] = []; saveStateCache(stateCache); }
                if (!hasUser) { onUser(null); userCache[userKey] = null; saveReportedUserCache(userCache); }
            }
        };
        xhr.onerror = function() {
            if (!hasState) { onState([]); stateCache[stateKey] = []; saveStateCache(stateCache); }
            if (!hasUser) { onUser(null); userCache[userKey] = null; saveReportedUserCache(userCache); }
        };
        xhr.ontimeout = function() {
            if (!hasState) { onState([]); stateCache[stateKey] = []; saveStateCache(stateCache); }
            if (!hasUser) { onUser(null); userCache[userKey] = null; saveReportedUserCache(userCache); }
        };
        xhr.send();
    }

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
                    '<div class="tab-btn" data-tab="2">关键词监测</div>' +
                    '<div class="tab-btn" data-tab="3">设置</div>' +
                '</div>' +
                '<div id="nga-report-panel-body">' +
                    '<div class="nga-report-page active" data-page="0">' +
                        '<div id="nga-report-stats">' +
                            '<span>共 <strong id="nga-report-count">0</strong> 条举报记录</span>' +
                            '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">' +
                                '<span style="font-size:12px;color:#6b4e2e;margin-right:4px;">状态筛选：</span>' +
                                '<button class="status-filter-btn active" data-status-filter="-1">全部</button>' +
                                '<button class="status-filter-btn" data-status-filter="0">未处理</button>' +
                                '<button class="status-filter-btn" data-status-filter="1">已处理</button>' +
                                '<button class="status-filter-btn" data-status-filter="2">已标记</button>' +
                            '</div>' +
                            '<span style="font-size:12px;color:#8b6914;" id="nga-report-last-update"></span>' +
                        '</div>' +
                        '<div id="nga-report-toolbar">' +
                            '<button id="nga-report-refresh-btn" class="toolbar-btn">刷新数据</button>' +
                            '<button id="nga-report-batch-complete-btn" class="toolbar-btn danger">一键完成</button>' +
                            '<button id="nga-report-open-unprocessed-btn" class="toolbar-btn danger">打开未处理</button>' +
                        '</div>' +
                        '<div id="nga-report-table-wrap">' +
                            '<div id="nga-report-loading">正在加载数据...</div>' +
                            '<table id="nga-report-table" style="display:none;">' +
                                '<thead><tr id="nga-report-thead-row"></tr></thead>' +
                                '<tbody id="nga-report-tbody"></tbody>' +
                            '</table>' +
                            '<div id="nga-report-pagination"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="nga-report-page" data-page="1">' +
                        '<div class="filter-header">筛选版面</div>' +
                        '<div class="filter-desc">(<b>仅本版</b>) 只匹配该版面；( <b>含子版</b> ) 同时匹配所有子版面。不勾选则显示全部。</div>' +
                        '<div class="filter-desc">版面后面的数字代表该版面（本地缓存）收到的举报数量统计，可能不完全，仅供参考。</div>' +
                        '<div id="nga-report-filter-tree"></div>' +
                        '<div style="margin-top:12px;">' +
                            '<button class="settings-btn" id="nga-filter-select-all">全选</button>' +
                            '<button class="settings-btn" id="nga-filter-deselect-all">取消全选</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="nga-report-page" data-page="2">' +
                        '<div class="filter-header">关键词监测</div>' +
                        '<div class="filter-desc">设置关键词后，举报列表中的<b>举报人</b>、<b>帖子标题</b>、<b>被举报人</b>、<b>举报理由</b>将高亮显示命中的关键词。</div>' +
                        '<div class="keyword-toolbar">' +
                            '<input type="text" class="keyword-input" id="nga-kw-text" placeholder="输入关键词" maxlength="50">' +
                            '<input type="color" class="keyword-color-input" id="nga-kw-color" value="#ffff00" title="高亮颜色">' +
                            '<button class="settings-btn" id="nga-kw-add">添加</button>' +
                        '</div>' +
                        '<div class="keyword-list" id="nga-keyword-list"></div>' +
                    '</div>' +
                    '<div class="nga-report-page" data-page="3">' +
                        '<div class="settings-section">' +
                            '<h3>功能开关</h3>' +
                            '<div class="settings-row"><span class="settings-label">屏蔽系统消息：</span><label class="kw-toggle"><input type="checkbox" id="nga-system-filter-toggle"><span class="kw-slider"></span></label></div>' +
                            '<div class="settings-row" style="flex-wrap:wrap;gap:4px;"><span class="settings-label" style="width:100%;margin-bottom:4px;">显示列：</span><div id="nga-column-toggles" style="display:flex;flex-wrap:wrap;gap:6px;border:1px solid #d4c5a9;border-radius:2px;padding:6px 8px;"></div></div>' +
                        '</div>' +
                        '<div class="settings-section">' +
                            '<h3>主题</h3>' +
                            '<div class="settings-row"><div style="display:flex;gap:12px;">' +
                                '<label style="cursor:pointer;font-size:12px;"><input type="radio" name="nga-theme" value="nga" class="theme-radio"> 原版</label>' +
                                '<label style="cursor:pointer;font-size:12px;"><input type="radio" name="nga-theme" value="pastel" class="theme-radio"> 珊瑚宫心海</label>' +
                                '<label style="cursor:pointer;font-size:12px;"><input type="radio" name="nga-theme" value="desert" class="theme-radio"> 沙漠</label>' +
                                '<label style="cursor:pointer;font-size:12px;"><input type="radio" name="nga-theme" value="camo" class="theme-radio"> 迷彩</label>' +
                                '<label style="cursor:pointer;font-size:12px;"><input type="radio" name="nga-theme" value="darkgreen" class="theme-radio"> 暗绿</label>' +
                            '</div></div>' +
                        '</div>' +
                        '<div class="settings-section">' +
                            '<h3>缓存管理</h3>' +
                            '<div class="settings-row"><span class="settings-label">本地缓存举报条数：</span><span class="settings-value" id="nga-settings-cache-count">0</span></div>' +
                            '<div class="settings-row"><span class="settings-label">本地已使用空间：</span><span class="settings-value" id="nga-settings-storage-size">-</span></div>' +
                            '<div class="settings-row"><span class="settings-label">最后更新时间：</span><span class="settings-value" id="nga-settings-last-update">-</span></div>' +
                            '<div style="margin-top:10px;">' +
                                '<button class="settings-btn danger" id="nga-clear-oldest-100">清除最旧的100条</button>' +
                                '<button class="settings-btn danger" id="nga-clear-all">清除全部缓存</button>' +
                            '</div>' +
                            '<div class="settings-msg" id="nga-settings-msg"></div>' +
                        '</div>' +
                        '<div class="settings-section">' +
                            '<h3>数据管理</h3>' +
                            '<div class="settings-row"><span class="settings-label">将举报数据、状态标记、筛选配置等导出为JSON文件，或从JSON文件导入。</span></div>' +
                            '<div style="margin-top:10px;">' +
                                '<button class="settings-btn" id="nga-export-data">导出数据</button>' +
                                '<button class="settings-btn" id="nga-import-overwrite">覆盖导入</button>' +
                                '<button class="settings-btn" id="nga-import-merge">合并导入</button>' +
                            '</div>' +
                            '<div class="settings-msg" id="nga-data-msg"></div>' +
                        '</div>' +
                        '<div class="settings-section">' +
                            '<h3>关于</h3>' +
                            '<div class="settings-row"><span class="settings-label">NGA举报管理工具</span></div>' +
                            '<div class="settings-row"><span class="settings-label">源代码Github仓库：</span><span class="settings-value"><a href="https://github.com/drpasserby/NGA_ReportTool" target="_blank">NGA_ReportTool</a></span></div>' +
                            '<div class="settings-row"><span class="settings-label">开发者：</span><span class="settings-value"><a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=62716817" target="_blank">UST</a>/<a href="http://wulvxinchen.cn/" target="_blank">WLXC</a></span></div>' +
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

        // 桌面端: .right / 手机端: #m_nav, .nav, .top_nav, #ucp_menu, .header-user
        var container = document.querySelector('.right');
        if (!container) {
            container = document.querySelector('#m_nav, #nav, .nav, .top_nav, #ucp_menu, .header-user, .user-menu, .m-top-bar');
        }
        if (container) {
            container.insertBefore(btnWrap, container.firstChild);
            log('按钮已添加到 ' + (container.className || container.id));
        } else {
            log('未找到合适的按钮容器，附加到 body');
            btnWrap.style.position = 'fixed';
            btnWrap.style.bottom = '20px';
            btnWrap.style.right = '20px';
            btnWrap.style.zIndex = '3';
            document.body.appendChild(btnWrap);
        }
        return btnWrap;
    }

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
        // log('=== 解析后的完整数据 ===');
        // console.log(LOG_PREFIX, JSON.stringify(data, null, 2));

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



    function fetchReportData() {
        return new Promise(function(resolve, reject) {
            var started = false;
            var maxAttempts = 20;
            var attempt = 0;

            function tryNuke() {
                attempt++;
                if (typeof __NUKE !== 'undefined' && typeof __NUKE.doRequest2 === 'function') {
                    if (started) return;
                    started = true;
                    console.warn(LOG_PREFIX, '★★★ [路径A] __NUKE.doRequest2 可用(第' + attempt + '次检测) ★★★');

                    var timeout = setTimeout(function() {
                        reject(new Error('__NUKE请求超时(15秒)'));
                    }, 15000);

                    __NUKE.doRequest2(
                        'f', function(d) {
                            clearTimeout(timeout);
                            var data = parseReportResponse(d, reject);
                            if (!data) return;
                            var reports = extractReports(data, reject);
                            if (reports) {
                                console.warn(LOG_PREFIX, '★★★ [路径A-成功] __NUKE.doRequest2 获取到 ' + reports.length + ' 条记录 ★★★');
                                resolve(reports);
                            }
                        },
                        'u', '/nuke.php?__lib=noti&__act=get_all&raw=3'
                    );
                } else if (attempt < maxAttempts) {
                    setTimeout(tryNuke, 500);
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
            var name = reports[i][2] === '#SYSTEM#' ? '系统消息' : reports[i][13];
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

    function getForumCounts(reports) {
        var exact = {};
        var ancestor = {};
        for (var i = 0; i < reports.length; i++) {
            var forum = reports[i][2] === '#SYSTEM#' ? '系统消息' : reports[i][13];
            if (!forum) continue;
            exact[forum] = (exact[forum] || 0) + 1;
            var parts = forum.split('>');
            for (var j = 0; j < parts.length; j++) {
                var prefix = parts.slice(0, j + 1).join('>');
                ancestor[prefix] = (ancestor[prefix] || 0) + 1;
            }
        }
        return { exact: exact, ancestor: ancestor };
    }

    function renderFilterItem(fullName, displayName, selectedForums, count, container) {
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
        if (typeof count === 'number') {
            var badge = document.createElement('span');
            badge.className = 'filter-count';
            badge.textContent = count;
            item.appendChild(badge);
        }
        container.appendChild(item);
    }

    function renderFilterTree(tree, selectedForums, container, counts) {
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
                    var groupTotal = (counts.ancestor[name] || 0);
                    titleDiv.innerHTML = '<span class="arrow">▶</span> ' + name + ' <span class="filter-count">' + groupTotal + '</span>';

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

                    renderFilterItem(name, name + ' (含子版)', selectedForums, counts.ancestor[name] || 0, childrenDiv);
                    renderFilterItem(name + '$exact', name + ' (仅本版)', selectedForums, counts.exact[name] || 0, childrenDiv);
                    renderFilterChildren(children, name, selectedForums, childrenDiv, counts);

                    groupDiv.appendChild(titleDiv);
                    groupDiv.appendChild(childrenDiv);
                    container.appendChild(groupDiv);
                } else {
                    renderFilterItem(name, name, selectedForums, counts.exact[name] || 0, container);
                }
            })();
        }
    }

    function renderFilterChildren(tree, prefix, selectedForums, container, counts) {
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

                    renderFilterItem(fullName, name + ' (含子版)', selectedForums, counts.ancestor[fullName] || 0, subGroup);
                    renderFilterItem(fullName + '$exact', name + ' (仅本版)', selectedForums, counts.exact[fullName] || 0, subGroup);

                    var innerDiv = document.createElement('div');
                    innerDiv.style.marginLeft = '16px';
                    renderFilterChildren(children, fullName, selectedForums, innerDiv, counts);
                    subGroup.appendChild(innerDiv);

                    container.appendChild(subGroup);
                } else {
                    renderFilterItem(fullName, fullName, selectedForums, counts.exact[fullName] || 0, container);
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
        var allReports = getAllReports();
        var tree = buildForumTree(allReports);
        var counts = getForumCounts(allReports);
        var container = document.getElementById('nga-report-filter-tree');
        if (container) {
            renderFilterTree(tree, config.selectedForums, container, counts);
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
                    allNames.push(fullName + '$exact');
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

    var FILTER_EXACT_SUFFIX = '$exact';

    function getFilteredReports(reports) {
        var filtered = reports;
        var config = getFilterConfig();

        // 版面筛选
        if (config.selectedForums && config.selectedForums.length > 0) {
            var ancestorSet = {};
            var exactSet = {};
            for (var i = 0; i < config.selectedForums.length; i++) {
                var f = config.selectedForums[i];
                if (f.indexOf(FILTER_EXACT_SUFFIX) > 0 && f.substring(f.length - FILTER_EXACT_SUFFIX.length) === FILTER_EXACT_SUFFIX) {
                    exactSet[f.substring(0, f.length - FILTER_EXACT_SUFFIX.length)] = true;
                } else {
                    ancestorSet[f] = true;
                }
            }
            filtered = filtered.filter(function(r) {
                if (r[2] === '#SYSTEM#' && (ancestorSet['系统消息'] || exactSet['系统消息'])) return true;
                var forum = r[13] || '';
                if (ancestorSet[forum] || exactSet[forum]) return true;
                var parts = forum.split('>');
                for (var j = 0; j < parts.length; j++) {
                    var ancestor = parts.slice(0, j + 1).join('>');
                    if (ancestorSet[ancestor]) return true;
                }
                return false;
            });
        }

        // 状态筛选
        var statusFilter = getStatusFilter();
        if (statusFilter !== -1) {
            filtered = filtered.filter(function(r) {
                return getReportStatus(r) === statusFilter;
            });
        }

        // 系统消息屏蔽
        if (isSystemFilterEnabled()) {
            filtered = filtered.filter(function(r) {
                return r[2] !== '#SYSTEM#';
            });
        }

        return filtered;
    }

    function getAllReports() { return getCachedReports(); }
    function getDisplayReports() { return getFilteredReports(getAllReports()); }

    // ========== 渲染表格 ==========
    function renderTableHeader() {
        var theadRow = document.getElementById('nga-report-thead-row');
        if (!theadRow) return;
        var html = '';
        for (var i = 0; i < COLUMNS.length; i++) {
            var col = COLUMNS[i];
            if (!isColumnVisible(col.key)) continue;
            html += '<th class="' + col.cls + '">' + col.label + '</th>';
        }
        html += '<th class="col-action">操作</th>';
        theadRow.innerHTML = html;
    }

    function renderTable(allReports) {
        var tbody = document.getElementById('nga-report-tbody');
        var table = document.getElementById('nga-report-table');
        var loading = document.getElementById('nga-report-loading');
        var countEl = document.getElementById('nga-report-count');

        if (!tbody) return;

        tbody.innerHTML = '';
        countEl.textContent = allReports.length;

        if (allReports.length === 0) {
            loading.style.display = 'block';
            loading.textContent = '暂无举报数据';
            table.style.display = 'none';
            document.getElementById('nga-report-pagination').innerHTML = '';
            return;
        }

        loading.style.display = 'none';
        table.style.display = '';

        var totalPages = Math.ceil(allReports.length / PAGE_SIZE);
        if (currentPage >= totalPages) currentPage = totalPages - 1;
        if (currentPage < 0) currentPage = 0;

        var start = currentPage * PAGE_SIZE;
        var pageReports = allReports.slice(start, start + PAGE_SIZE);

        for (var i = 0; i < pageReports.length; i++) {
            var r = pageReports[i];
            var ts = r[9], type = r[0], uid = r[1], nickname = r[2];
            var title = r[5], reason = r[11], forum = r[13], tid = r[6], pid = r[7];
            var status = getReportStatus(r);
            var reportKey = buildReportKey(r);
            var isSystem = nickname === '#SYSTEM#';

            var tr = document.createElement('tr');

            // 标记列
            if (isColumnVisible('mark')) {
                var tdMark = document.createElement('td');
                tdMark.className = 'col-mark';
                tdMark.innerHTML = '<span class="status-tag ' + STATUS_CSS[status] + '">' + STATUS_LABELS[status] + '</span>';
                tr.appendChild(tdMark);
            }

            // 状态列
            if (isColumnVisible('state')) {
                var tdState = document.createElement('td');
                tdState.className = 'col-state';
                if (isSystem) {
                    tdState.innerHTML = '<span style="color:#aaa;font-size:11px;">-</span>';
                } else {
                    tdState.innerHTML = '<span style="color:#999;font-size:11px;">加载中...</span>';
                    var cacheKey = makeStateCacheKey(type, tid, pid);
                    var stateCache = getStateCache();
                    if (stateCache.hasOwnProperty(cacheKey)) {
                        renderStateTags(tdState, stateCache[cacheKey]);
                    }
                }
                tr.appendChild(tdState);
            }

            if (isColumnVisible('time')) {
                var tdTime = document.createElement('td');
                tdTime.className = 'col-time';
                tdTime.textContent = formatTimestamp(ts);
                tr.appendChild(tdTime);
            }

            if (isColumnVisible('type')) {
                var tdType = document.createElement('td');
                tdType.className = 'col-type';
                if (isSystem) {
                    tdType.innerHTML = '<span class="type-tag" style="background:#e8d8b8;color:#6b4e2e">系统</span>';
                } else {
                    tdType.innerHTML = type === 13
                        ? '<span class="type-tag type-topic">主题</span>'
                        : '<span class="type-tag type-reply">回复</span>';
                }
                tr.appendChild(tdType);
            }

            if (isColumnVisible('reporter')) {
                var tdReporter = document.createElement('td');
                tdReporter.className = 'col-reporter';
                var reporterLink = document.createElement('a');
                if (isSystem) {
                    reporterLink.href = './nuke.php?func=message&r=51#p=1';
                    reporterLink.target = '_blank';
                    reporterLink.textContent = '系统';
                } else {
                    reporterLink.href = 'https://bbs.nga.cn/nuke.php?func=ucp&uid=' + uid;
                    reporterLink.target = '_blank';
                    reporterLink.innerHTML = highlightText(nickname);
                    reporterLink.title = 'UID: ' + uid;
                }
                tdReporter.appendChild(reporterLink);
                tr.appendChild(tdReporter);
            }

            if (isColumnVisible('title')) {
                var tdTitle = document.createElement('td');
                tdTitle.className = 'col-title';
                if (isSystem) {
                    tdTitle.textContent = '系统消息';
                } else {
                    var titleLink = document.createElement('a');
                    if (type === 14 && pid) {
                        titleLink.href = 'https://bbs.nga.cn/read.php?tid=' + tid + '&pid=' + pid + '&to=1';
                    } else {
                        titleLink.href = 'https://bbs.nga.cn/read.php?tid=' + tid;
                    }
                    titleLink.target = '_blank';
                    titleLink.innerHTML = highlightText(title);
                    titleLink.title = 'TID: ' + tid + (pid ? ' PID: ' + pid : '');
                    tdTitle.appendChild(titleLink);
                }
                tr.appendChild(tdTitle);
            }

            // 被举报人列
            if (isColumnVisible('reportedUser')) {
                var tdReportedUser = document.createElement('td');
                tdReportedUser.className = 'col-reported-user';
                if (isSystem) {
                    tdReportedUser.textContent = '系统消息';
                } else {
                    tdReportedUser.innerHTML = '<span style="color:#999;font-size:11px;">加载中...</span>';
                    var ruCacheKey = makeReportedUserCacheKey(type, tid, pid);
                    var ruCache = getReportedUserCache();
                    if (ruCache.hasOwnProperty(ruCacheKey)) {
                        renderReportedUser(tdReportedUser, ruCache[ruCacheKey]);
                    }
                }
                tr.appendChild(tdReportedUser);
            }

            if (isColumnVisible('reason')) {
                var tdReason = document.createElement('td');
                tdReason.className = 'col-reason';
                tdReason.innerHTML = isSystem ? '系统消息' : highlightText(reason);
                tr.appendChild(tdReason);
            }

            if (isColumnVisible('forum')) {
                var tdForum = document.createElement('td');
                tdForum.className = 'col-forum';
                tdForum.textContent = isSystem ? '系统消息' : forum;
                tr.appendChild(tdForum);
            }

            // 操作列始终显示
            var tdAction = document.createElement('td');
            tdAction.className = 'col-action';
            var completeBtnClass = status === STATUS_PROCESSED ? 'complete-btn is-done' : 'complete-btn';
            var markBtnClass = status === STATUS_MARKED ? 'mark-btn is-marked' : 'mark-btn';
            tdAction.innerHTML =
                '<button class="' + completeBtnClass + '" data-report-key="' + reportKey + '">完成</button> ' +
                '<button class="' + markBtnClass + '" data-report-key="' + reportKey + '">标记</button> ' +
                (!isSystem ? '<button class="complete-btn" style="background:#e8d8b8;border-color:#ba8b5a;color:#6b4e2e" onclick="commonui.cancelBubble(event);commonui.cancelEvent(event);ubbcode.fastViewPost(event,' + tid + ',' + (pid || 0) + ',0,this)">预览</button>' : '');
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        }

        // 事件委托：操作按钮
        tbody.onclick = function(e) {
            var target = e.target;
            var rk = target.getAttribute('data-report-key');
            if (!rk) return;
            var map = getStatusMap();
            var currentStatus = map.hasOwnProperty(rk) ? map[rk] : STATUS_UNPROCESSED;
            if (target.classList.contains('complete-btn')) {
                // 完成按钮：未处理 → 已处理；已处理 → 未处理
                var newStatus = (currentStatus === STATUS_PROCESSED) ? STATUS_UNPROCESSED : STATUS_PROCESSED;
                map[rk] = newStatus;
                saveStatusMap(map);
                refreshTable(true);
            } else if (target.classList.contains('mark-btn')) {
                // 标记按钮：已标记 → 已处理；其他 → 已标记
                var newStatus = (currentStatus === STATUS_MARKED) ? STATUS_PROCESSED : STATUS_MARKED;
                map[rk] = newStatus;
                saveStatusMap(map);
                refreshTable(true);
            }
        };

        // 异步加载当前页帖子状态
        fetchCurrentPageStates(pageReports);

        // 渲染分页控件
        renderPagination(allReports.length);
    }

    function fetchCurrentPageStates(pageReports) {
        var tbody = document.getElementById('nga-report-tbody');
        if (!tbody) return;
        for (var i = 0; i < pageReports.length; i++) {
            (function(r, row) {
                if (r[2] === '#SYSTEM#') return;
                var rptType = r[0], rptTid = r[6], rptPid = r[7];
                var stateTd = row.querySelector('.col-state');
                var ruTd = row.querySelector('.col-reported-user');
                fetchPostInfo(rptType, rptTid, rptPid, function(states) {
                    renderStateTags(stateTd, states);
                }, function(user) {
                    if (ruTd) renderReportedUser(ruTd, user);
                });
            })(pageReports[i], tbody.rows[i]);
        }
    }

    function renderPagination(totalCount) {
        var container = document.getElementById('nga-report-pagination');
        if (!container) return;
        var totalPages = Math.ceil(totalCount / PAGE_SIZE);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        var startNum = currentPage * PAGE_SIZE + 1;
        var endNum = Math.min((currentPage + 1) * PAGE_SIZE, totalCount);

        container.innerHTML =
            '<button class="pagination-btn" data-page="first"' + (currentPage === 0 ? ' disabled' : '') + '>首页</button>' +
            '<button class="pagination-btn" data-page="prev"' + (currentPage === 0 ? ' disabled' : '') + '>上一页</button>' +
            '<span class="pagination-info">第 ' + (currentPage + 1) + '/' + totalPages + ' 页 (' + startNum + '-' + endNum + '条)</span>' +
            '<button class="pagination-btn" data-page="next"' + (currentPage >= totalPages - 1 ? ' disabled' : '') + '>下一页</button>' +
            '<button class="pagination-btn" data-page="last"' + (currentPage >= totalPages - 1 ? ' disabled' : '') + '>末页</button>';
    }

    function goToPage(page, totalCount) {
        var totalPages = Math.ceil(totalCount / PAGE_SIZE);
        if (totalPages === 0) return;
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;
        currentPage = page;
        var reports = getDisplayReports();
        renderTable(reports);
    }

    // ========== 刷新表格 ==========
    // keepPage=true 保持当前页不变（标记/完成按钮操作），否则回到首页
    function refreshTable(keepPage) {
        if (!keepPage) currentPage = 0;
        var reports = getDisplayReports();
        renderTableHeader();
        renderTable(reports);
        updateStats();
        updateStatusFilterButtons();
        updateSettingsPage();
    }

    function renderStateTags(td, states) {
        td.innerHTML = '';
        if (!states || states.length === 0) {
            td.innerHTML = '<span style="color:#aaa;font-size:11px;">-</span>';
            return;
        }
        for (var i = 0; i < states.length; i++) {
            var tag = document.createElement('span');
            tag.className = 'state-tag';
            tag.textContent = states[i];
            td.appendChild(tag);
        }
    }

    function renderReportedUser(td, user) {
        td.innerHTML = '';
        if (!user) {
            td.innerHTML = '<span style="color:#aaa;font-size:11px;">-</span>';
            return;
        }
        if (user.uid === -1) {
            td.textContent = '匿名';
            return;
        }
        var link = document.createElement('a');
        link.href = 'https://bbs.nga.cn/nuke.php?func=ucp&uid=' + user.uid;
        link.target = '_blank';
        link.innerHTML = highlightText(user.username);
        link.title = 'UID: ' + user.uid;
        td.appendChild(link);
    }

    function updateStatusFilterButtons() {
        var currentFilter = getStatusFilter();
        var buttons = document.querySelectorAll('.status-filter-btn');
        for (var i = 0; i < buttons.length; i++) {
            var btnVal = parseInt(buttons[i].getAttribute('data-status-filter'));
            if (btnVal === currentFilter) {
                buttons[i].classList.add('active');
            } else {
                buttons[i].classList.remove('active');
            }
        }
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

    function getStorageSize() {
        var total = 0;
        for (var i = 0; i < DATA_KEYS.length; i++) {
            var val = localStorage.getItem(DATA_KEYS[i]);
            if (val) total += val.length * 2;
        }
        if (total < 1024) return total + ' B';
        if (total < 1048576) return (total / 1024).toFixed(1) + ' KB';
        return (total / 1048576).toFixed(2) + ' MB';
    }

    function renderColumnToggles() {
        var container = document.getElementById('nga-column-toggles');
        if (!container) return;
        var vis = getColumnVisibility();
        var html = '';
        for (var i = 0; i < COLUMNS.length; i++) {
            var col = COLUMNS[i];
            var checked = vis[col.key] ? ' checked' : '';
            html += '<label style="font-size:12px;cursor:pointer;white-space:nowrap;"><input type="checkbox" class="col-vis-toggle" data-col="' + col.key + '"' + checked + '> ' + col.label + '</label>';
        }
        container.innerHTML = html;
    }

    function updateSettingsPage() {
        var countEl = document.getElementById('nga-settings-cache-count');
        var sizeEl = document.getElementById('nga-settings-storage-size');
        var lastUpdateEl = document.getElementById('nga-settings-last-update');
        var sysToggle = document.getElementById('nga-system-filter-toggle');
        if (countEl) {
            var reports = getAllReports();
            countEl.textContent = reports.length;
            if (sizeEl) sizeEl.textContent = getStorageSize();
            if (lastUpdateEl) {
                lastUpdateEl.textContent = reports.length > 0 ? formatTimestamp(reports[0][9]) : '-';
            }
        }
        if (sysToggle) sysToggle.checked = isSystemFilterEnabled();
        renderColumnToggles();
        var themeRadio = document.querySelector('.theme-radio[value="' + getTheme() + '"]');
        if (themeRadio) themeRadio.checked = true;
    }

    // ╔══════════════════════════════════════════╗
    // ║ [编排器] refreshData                      ║
    // ║ 流程: fetch → merge → save → refresh UI  ║
    // ║ 调用: fetchReportData() → 主入口          ║
    // ╚══════════════════════════════════════════╝
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
            if (isSystemFilterEnabled()) {
                newReports = newReports.filter(function(r) { return r[2] !== '#SYSTEM#'; });
                log('屏蔽系统消息后剩余 ' + newReports.length + ' 条');
            }
            var existing = getCachedReports();
            var merged = mergeReports(existing, newReports);
            log('合并后共 ' + merged.length + ' 条记录');
            saveCache(merged);
            localStorage.removeItem(STATE_CACHE_KEY);
            localStorage.removeItem(REPORTED_USER_CACHE_KEY);
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

    // ========== 一键完成 ==========
    function batchComplete() {
        var reports = getAllReports();
        var map = getStatusMap();
        var count = 0;
        for (var i = 0; i < reports.length; i++) {
            var key = buildReportKey(reports[i]);
            var status = map.hasOwnProperty(key) ? map[key] : STATUS_UNPROCESSED;
            if (status === STATUS_UNPROCESSED) {
                map[key] = STATUS_PROCESSED;
                count++;
            }
        }
        saveStatusMap(map);
        refreshTable();
        log('一键完成: 已将 ' + count + ' 条未处理举报标记为已处理');
    }

    // ========== 打开未处理 ==========
    function openUnprocessed() {
        var reports = getDisplayReports();
        var map = getStatusMap();
        var opened = 0;
        for (var i = 0; i < reports.length; i++) {
            var r = reports[i];
            var key = buildReportKey(r);
            var status = map.hasOwnProperty(key) ? map[key] : STATUS_UNPROCESSED;
            if (status !== STATUS_UNPROCESSED) continue;
            var type = r[0], tid = r[6], pid = r[7];
            var url;
            if (type === 14 && pid) {
                url = 'https://bbs.nga.cn/read.php?tid=' + tid + '&pid=' + pid + '&to=1';
            } else {
                url = 'https://bbs.nga.cn/read.php?tid=' + tid;
            }
            window.open(url, '_blank');
            opened++;
        }
        log('打开未处理: 已打开 ' + opened + ' 个未处理举报链接');
    }

    // ========== 数据导入导出 ==========
    function exportData() {
        var exportObj = {
            version: 1,
            exportTime: new Date().toISOString(),
            data: {}
        };
        for (var i = 0; i < DATA_KEYS.length; i++) {
            var raw = localStorage.getItem(DATA_KEYS[i]);
            if (raw !== null) {
                try { exportObj.data[DATA_KEYS[i]] = JSON.parse(raw); } catch (e) {}
            }
        }
        var jsonStr = JSON.stringify(exportObj, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'nga_report_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showDataMsg('数据已导出', false);
    }

    function importFile(onLoad) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', function() {
            var file = input.files[0];
            if (!file) { document.body.removeChild(input); return; }
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var obj = JSON.parse(e.target.result);
                    if (!obj.data || typeof obj.data !== 'object') {
                        showDataMsg('文件格式无效：缺少 data 字段', true);
                        return;
                    }
                    onLoad(obj.data);
                } catch (err) {
                    showDataMsg('JSON 解析失败：' + err.message, true);
                }
                document.body.removeChild(input);
            };
            reader.readAsText(file);
        });
        input.click();
    }

    function importOverwrite() {
        importFile(function(importedData) {
            var keys = Object.keys(importedData);
            for (var i = 0; i < keys.length; i++) {
                localStorage.setItem(keys[i], JSON.stringify(importedData[keys[i]]));
            }
            refreshTable();
            refreshFilterUI();
            updateSettingsPage();
            renderKeywordList();
            showDataMsg('已覆盖导入 ' + keys.length + ' 个数据项');
        });
    }

    function importMerge() {
        importFile(function(importedData) {
            var merged = 0;
            var keys = Object.keys(importedData);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var imported = importedData[key];
                if (key === CACHE_KEY && Array.isArray(imported)) {
                    var existing = getCachedReports();
                    var mergedReports = mergeReports(existing, imported);
                    localStorage.setItem(key, JSON.stringify(mergedReports));
                } else if (key === KEYWORD_KEY && Array.isArray(imported)) {
                    var localKw = getKeywords();
                    var localIdMap = {};
                    for (var m = 0; m < localKw.length; m++) {
                        localIdMap[localKw[m].id] = true;
                    }
                    for (var n = 0; n < imported.length; n++) {
                        if (!localIdMap[imported[n].id]) {
                            localKw.push(imported[n]);
                        }
                    }
                    saveKeywords(localKw);
                } else if (key === STATUS_KEY || key === STATE_CACHE_KEY || key === REPORTED_USER_CACHE_KEY || key === COLUMN_VISIBILITY_KEY) {
                    var localObj = {};
                    try { localObj = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
                    for (var k in imported) {
                        if (imported.hasOwnProperty(k)) { localObj[k] = imported[k]; }
                    }
                    localStorage.setItem(key, JSON.stringify(localObj));
                } else {
                    localStorage.setItem(key, JSON.stringify(imported));
                }
                merged++;
            }
            refreshTable();
            refreshFilterUI();
            updateSettingsPage();
            renderKeywordList();
            showDataMsg('已合并导入 ' + merged + ' 个数据项');
        });
    }

    function showDataMsg(msg, isError) {
        var el = document.getElementById('nga-data-msg');
        if (el) {
            el.textContent = msg;
            el.style.color = isError ? '#c0392b' : '#27ae60';
            setTimeout(function() { el.textContent = ''; }, 3000);
        }
    }

    // ========== 关键词管理 ==========
    function getKeywords() {
        try {
            var raw = localStorage.getItem(KEYWORD_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveKeywords(keywords) {
        try { localStorage.setItem(KEYWORD_KEY, JSON.stringify(keywords)); } catch (e) {}
    }

    function addKeyword(text, bgColor) {
        var keywords = getKeywords();
        keywords.push({
            id: 'kw_' + Date.now(),
            text: text,
            enabled: true,
            bgColor: bgColor
        });
        saveKeywords(keywords);
        renderKeywordList();
    }

    function deleteKeyword(id) {
        var keywords = getKeywords();
        keywords = keywords.filter(function(k) { return k.id !== id; });
        saveKeywords(keywords);
        renderKeywordList();
    }

    function toggleKeyword(id) {
        var keywords = getKeywords();
        for (var i = 0; i < keywords.length; i++) {
            if (keywords[i].id === id) {
                keywords[i].enabled = !keywords[i].enabled;
                break;
            }
        }
        saveKeywords(keywords);
    }

    function updateKeywordColor(id, color) {
        var keywords = getKeywords();
        for (var i = 0; i < keywords.length; i++) {
            if (keywords[i].id === id) {
                keywords[i].bgColor = color;
                break;
            }
        }
        saveKeywords(keywords);
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function highlightText(text) {
        if (!text) return '';
        var keywords = getKeywords();
        var enabled = [];
        for (var i = 0; i < keywords.length; i++) {
            if (keywords[i].enabled) enabled.push(keywords[i]);
        }
        if (enabled.length === 0) return escapeHtml(text);
        // 按关键词长度降序排列，避免短关键词先匹配导致长关键词被截断
        enabled.sort(function(a, b) { return b.text.length - a.text.length; });
        var escaped = escapeHtml(text);
        for (var j = 0; j < enabled.length; j++) {
            var kw = enabled[j];
            var escapedKw = escapeHtml(kw.text);
            // 仅在 text 中不区分大小写替换
            var regex = new RegExp(escapedKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            escaped = escaped.replace(regex, function(matched) {
                return '<span class="keyword-highlight" style="background-color:' + kw.bgColor + '">' + matched + '</span>';
            });
        }
        return escaped;
    }

    function renderKeywordList() {
        var container = document.getElementById('nga-keyword-list');
        if (!container) return;
        var keywords = getKeywords();
        if (keywords.length === 0) {
            container.innerHTML = '<div class="keyword-empty">暂无关键词，请在上方添加</div>';
            return;
        }
        var html = '';
        for (var i = 0; i < keywords.length; i++) {
            var kw = keywords[i];
            html += '<div class="keyword-item">';
            html += '<span class="keyword-color-dot" style="background-color:' + kw.bgColor + '"></span>';
            html += '<span class="keyword-text">' + escapeHtml(kw.text) + '</span>';
            html += '<label class="kw-toggle">';
            html += '<input type="checkbox" class="kw-checkbox" data-kw-id="' + kw.id + '"' + (kw.enabled ? ' checked' : '') + '>';
            html += '<span class="kw-slider"></span>';
            html += '</label>';
            html += '<input type="color" class="keyword-color-input kw-color-picker" data-kw-id="' + kw.id + '" value="' + kw.bgColor + '" title="修改颜色">';
            html += '<button class="kw-delete-btn" data-kw-id="' + kw.id + '">删除</button>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // ========== 面板显示/隐藏 ==========
    function showPanel() {
        log('显示面板');
        var overlay = document.getElementById('nga-report-panel-overlay');
        if (overlay) {
            overlay.classList.add('show');
            applyTheme(getTheme());
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
        if (index === 2) renderKeywordList();
        if (index === 3) updateSettingsPage();
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

        document.getElementById('nga-report-batch-complete-btn').addEventListener('click', function() {
            log('一键完成按钮被点击');
            batchComplete();
        });

        document.getElementById('nga-report-open-unprocessed-btn').addEventListener('click', function() {
            log('打开未处理按钮被点击');
            openUnprocessed();
        });

        document.getElementById('nga-report-stats').addEventListener('click', function(e) {
            var btn = e.target.closest ? e.target.closest('.status-filter-btn') : null;
            if (!btn) return;
            var filterVal = parseInt(btn.getAttribute('data-status-filter'));
            if (!isNaN(filterVal)) {
                setStatusFilter(filterVal);
                updateStatusFilterButtons();
                refreshTable();
            }
        });

        document.getElementById('nga-report-pagination').addEventListener('click', function(e) {
            var btn = e.target.closest ? e.target.closest('.pagination-btn') : null;
            if (!btn || btn.disabled) return;
            var action = btn.getAttribute('data-page');
            var allReports = getDisplayReports();
            var totalPages = Math.ceil(allReports.length / PAGE_SIZE);
            if (action === 'first') { goToPage(0, allReports.length); }
            else if (action === 'prev') { goToPage(currentPage - 1, allReports.length); }
            else if (action === 'next') { goToPage(currentPage + 1, allReports.length); }
            else if (action === 'last') { goToPage(totalPages - 1, allReports.length); }
        });

        document.getElementById('nga-filter-select-all').addEventListener('click', selectAllForums);
        document.getElementById('nga-filter-deselect-all').addEventListener('click', deselectAllForums);
        document.getElementById('nga-clear-oldest-100').addEventListener('click', clearOldest100);
        document.getElementById('nga-clear-all').addEventListener('click', clearAll);

        document.getElementById('nga-system-filter-toggle').addEventListener('change', function() {
            setSystemFilter(this.checked);
            refreshTable();
            refreshFilterUI();
        });

        document.getElementById('nga-column-toggles').addEventListener('change', function(e) {
            var cb = e.target;
            if (!cb.classList.contains('col-vis-toggle')) return;
            setColumnVisibility(cb.getAttribute('data-col'), cb.checked);
            refreshTable();
        });

        document.querySelector('#nga-report-panel-body').addEventListener('change', function(e) {
            if (!e.target.classList.contains('theme-radio')) return;
            setTheme(e.target.value);
        });

        document.getElementById('nga-export-data').addEventListener('click', exportData);
        document.getElementById('nga-import-overwrite').addEventListener('click', importOverwrite);
        document.getElementById('nga-import-merge').addEventListener('click', importMerge);

        // 关键词监测页面事件
        var kwTextInput = document.getElementById('nga-kw-text');
        var kwColorInput = document.getElementById('nga-kw-color');

        document.getElementById('nga-kw-add').addEventListener('click', function() {
            var text = kwTextInput.value.trim();
            if (!text) return;
            addKeyword(text, kwColorInput.value);
            kwTextInput.value = '';
            refreshTable();
        });

        kwTextInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var text = kwTextInput.value.trim();
                if (!text) return;
                addKeyword(text, kwColorInput.value);
                kwTextInput.value = '';
                refreshTable();
            }
        });

        document.getElementById('nga-keyword-list').addEventListener('click', function(e) {
            var target = e.target;
            var kwId = target.getAttribute('data-kw-id');
            if (!kwId) return;
            if (target.classList.contains('kw-delete-btn')) {
                deleteKeyword(kwId);
                refreshTable();
            }
        });

        document.getElementById('nga-keyword-list').addEventListener('change', function(e) {
            var target = e.target;
            var kwId = target.getAttribute('data-kw-id');
            if (!kwId) return;
            if (target.classList.contains('kw-checkbox')) {
                toggleKeyword(kwId);
                refreshTable();
            } else if (target.classList.contains('kw-color-picker')) {
                updateKeywordColor(kwId, target.value);
                renderKeywordList();
                refreshTable();
            }
        });

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
