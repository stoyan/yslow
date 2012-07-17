var YSLOW3PO = {};
YSLOW3PO.is3p = function (url) {
  
  var patterns = [
    'ajax.googleapis.com',
    'apis.google.com',
    '.google-analytics.com',
    'connect.facebook.net',
    'platform.twitter.com',
    'code.jquery.com',
    'platform.linkedin.com',
    '.disqus.com',
    '.lognormal.com'
  ];
  var hostname = YSLOW.util.getHostname(url);
  var re;
  for (var i = 0; i < patterns.length; i++) {
    re = new RegExp(patterns[i]);
    if (re.test(hostname)) {
      return true;
    }
  }
  return false;
}

YSLOW.registerRule({
  id: '_3po_asyncjs',
  name: 'Load 3rd party JS asyncrhonously',
  info: "Use the JavaScript snippets that load the JS files asyncrhonously " +
        "in order to speed up the user experience.",
  category: ['Common'],
  config: {},
  url: 'http://www.phpied.com/3PO#async',

  lint: function (doc, cset, config) {
    var scripts = doc.getElementsByTagName('script');
    var comps = cset.getComponentsByType('js');
    var comp;
    var offenders = {};
    var score = 100;
    
    // find offenders
    for (i = 0, len = scripts.length; i < len; i++) {
      comp = scripts[i];
      if (comp.src && YSLOW3PO.is3p(comp.src)) {
        if (!comp.async && !comp.defer) {
          offenders[comp.src] = 1;
        }
      }
    }

    // match offenders to YSLOW components
    var offender_comps = [];
    for (var i = 0; i < comps.length; i++) {
      if (offenders[comps[i].url]) {
        offender_comps.push(comps[i]);
      }
    }

    // final sweep
    var message = offender_comps.length === 0 ? '' :
      'The following ' + YSLOW.util.plural('%num% script%s%', offender_comps.length) +
        ' not loaded asynchronously:';
    score -= offender_comps.length * 21;

    return {
      score: score,
      message: message,
      components: offender_comps
    };
  }
});



YSLOW.registerRule({
  id: '_3po_jsonce',
  name: 'Load the 3rd party JS only once',
  info: 'Loading the 3rd party JS files more than once per page is not ' +
        'necessary and slows down the user experience',
  category: ['Common'],
  config: {},
  url: 'http://www.phpied.com/3PO#once',
  

  lint: function (doc, cset, config) {
    var i, url, score, len,
        hash = {},
        offenders = [],
        comps = cset.getComponentsByType('js'),
        scripts = doc.getElementsByTagName('script');

    for (i = 0, len = scripts.length; i < len; i += 1) {
      url = scripts[i].src;
      if (!url || !YSLOW3PO.is3p(url) || scripts[i].async || scripts[i].defer) {
        continue;
      }
      if (typeof hash[url] === 'undefined') {
        hash[url] = 1;
      } else {
        hash[url] += 1;
      }
    }

    // match offenders to YSLOW components
    var offenders = [];
    for (var i = 0; i < comps.length; i++) {
      if (hash[comps[i].url] && hash[comps[i].url] > 1) {
        offenders.push(comps[i]);
      }
    }

    score = 100 - offenders.length * 11;

    return {
      score: score,
      message: (offenders.length > 0) ? YSLOW.util.plural(
          'There %are% %num% 3rd party JS file%s% included more than once on the page',
          offenders.length
      ) : '',
      components: offenders
    };
  }
});


YSLOW.registerRule({
  id: '_3po_fbxmlns',
  name: 'Define XML namespace',
  info: 'If you use tags like &lt;fb:like&gt; you need to define ' +
        'an XML namespace to make the plugin work in old IE versions',
  category: ['Facebook'],
  config: {},
  url: 'http://www.phpied.com/3PO#xmlns',

  lint: function (doc, cset, config) {
    var all = doc.getElementsByTagName('*');
    var nodename;
    var found = false;
    var score = 100;

    for (var i = 0, len = all.length; i < len; i += 1) {
      nodename = all[i].nodeName.toLowerCase();
      if (nodename.indexOf('fb:') === 0) {
        found = true;
        break;
      }
    }
    if (found && !doc.documentElement.getAttribute('xmlns:fb')) {
      score = 0;
    }
    return {
      score: score,
      message: score ? '' : 'Found &lt;' + YSLOW.util.escapeHtml(nodename) +
        '&gt; but the document is missing xmlns. ' +
        '<p>Add this to your &lt;html&gt; tag:</p>' +
        '<p><code>xmlns:fb="http://www.facebook.com/2008/fbml"</code></p>',
      components: []
    };
  }
});


YSLOW.registerRule({
  id: '_3po_fbroot',
  name: 'Add an #fb-root element',
  info: 'The Facebook JS SDK needs an element with id "fb-root"',
  category: ['Facebook'],
  config: {},
  url: 'http://www.phpied.com/3PO#fbroot',

  lint: function (doc, cset, config) {
    var fbroot = cset.getComponentsByType('doc')[0].body.indexOf('id="fb-root"') > 0;
    return {
      score: fbroot ? 100 : 0,
      message: fbroot ? '' : 'No fb-root found' +
        '<p>Add this to your page, before you inlude the JS SDK:</p>' +
        '<p><code>&lt;div id="fb-root"&gt;</code></p>',
      components: []
    };
  }
});


YSLOW.registerRule({
  id: '_3po_fbog',
  name: 'Include OG (Open Graph) meta tags',
  info: 'Open graph tags let you better describe your content',
  category: ['Facebook'],
  config: {},
  url: 'http://www.phpied.com/3PO#fbog',

  lint: function (doc, cset, config) {
    var metas = doc.getElementsByTagName('meta');
    var found = [];
    var prop;
    var found_message = 'No OG tags were found';
    
    for (var i = 0; i < metas.length; i++) {
      prop = metas[i].getAttribute('property');
      if (prop && prop.indexOf('og:') === 0) {
        found.push(prop);
      }
    }
    
    if (found.length) {
      found_message = "<p>These OG tags were found: <code>" +
        YSLOW.util.escapeHtml(found.join(', ')) + '</code></p>';
    }
    
    var advise = '<p>For more information, '+
      '<a href="javascript:document.ysview.openLink(\'https://developers.facebook.com/tools/debug/og/object?q=%s\')">click here</a> ' +
      'to run the Facebook Object Debugger tool</p>';
    advise = advise.replace('%s', encodeURIComponent(location.href));
    
    return {
      score: 'n/a',
      message: found_message + advise,
      components: []
    };
  }
});


YSLOW.registerRuleset({
  id: "3po",
  name: "3PO (3rd Party Optimization)",
  rules: {
    _3po_asyncjs: {},
    _3po_jsonce: {},
    _3po_fbxmlns: {},
    _3po_fbroot: {},
    _3po_fbog: {}
  },
  weights: {
    _3po_asyncjs: 10,
    _3po_jsonce: 10,
    _3po_fbxmlns: 5,
    _3po_fbroot: 5,
    _3po_fbog: 1
  } 
});


// HACK
YSLOW.util.Preference.getPref = function(name, def) {
  return name === "defaultRuleset" ? '3po' : def;
};

parent.YUI = parent.YUI || YUI;
parent.YSLOW = YSLOW;