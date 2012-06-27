/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YUI*/

YUI.add('yslow-config', function (Y) {
    Y.namespace('YSLOW').config = {
        host: 'http://localhost/~stoyanstefanov/yslow/',
        js: '{{BOOKMARKLET_JS}}',
        css: '{{BOOKMARKLET_CSS}}'
    };
});
