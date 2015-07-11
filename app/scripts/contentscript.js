//https://gist.github.com/jonathantneal/3086586
(function(global) {
  function clean(css) {
    return css
      .replace(/\/\*[\W\w]*?\*\//g, '') // remove comments
      .replace(/^\s+|\s+$/g, '') // remove trailing spaces
      .replace(/\s*([:;{}])\s*/g, '$1') // remove trailing separator spaces
      .replace(/\};+/g, '}') // remove unnecessary separators
      .replace(/([^:;{}])}/g, '$1;}'); // add trailing separators
  }

  function refine(css, isBlock) {
    return /^@/.test(css) ? (css = css.split(' ')) && {
      identifier: css.shift().substr(1).toLowerCase(),
      parameters: css.join(' ')
    } : (isBlock ? /:$/ : /:/).test(css) ? (css = css.split(':')) && {
      property: css.shift(),
      value: css.join(':')
    } : css;
  }

  function parse(css, regExp, object) {
    for (var m;
      (m = regExp.exec(css)) !== null;) {
      if (m[2] === '{') {
        object.block.push(object = {
          selector: refine(m[1], true),
          block: [],
          parent: object
        });
      } else if (m[2] === '}') {
        object = object.parent;
      } else if (m[2] == ';') {
        object.block.push(refine(m[1]));
      }
    }
  }

  global.parseCSS = function(css) {
    return parse(clean(css), /([^{};]*)([;{}])/g, css = {
      block: []
    }), css;
  };
})(this);

function r(previousValue, currentValue, index, array) {
  return previousValue + ';' + currentValue;
}

function m(item) {
  return item.property + ':' + item.value;
}

//http://davidwalsh.name/add-rules-stylesheets
(function(global) {
  // Create the <style> tag
  var style = document.createElement('style');

  // Add a media (and/or media query) here if you'd like!
  // style.setAttribute('media', 'screen')
  // style.setAttribute('media', 'only screen and (max-width : 1024px)')

  // WebKit hack :(
  style.appendChild(document.createTextNode(''));

  // Add the <style> element to the page
  document.head.appendChild(style);

  global.getNewStyle = function(css) {
    return style.sheet;
  };
})(this);

function addCSSRule(sheet, selector, rules, index) {
  if ('insertRule' in sheet) {
    sheet.insertRule(selector + '{' + rules + '}', index);
  } else if ('addRule' in sheet) {
    sheet.addRule(selector, rules, index);
  }
}

function initContentScript() {
  var target = document.querySelectorAll('[src="about:blank"]');
  if (target.length) {
    target = target[0];

    var newIdName = 'life-dot-com-copy';
    var newContainer = document.createElement('div');
    newContainer.setAttribute('id', newIdName);

    var stylesObj = parseCSS(target.contentDocument.head.innerText);
    var sheet = getNewStyle();
    stylesObj.block.forEach(function(block) {
      if (block.selector === 'body') {
        addCSSRule(sheet, '#' + newIdName, block.block.map(m).reduce(r));
      } else {
        addCSSRule(sheet, '#' + newIdName + ' ' + block.selector, block.block.map(m).reduce(r));
      }
    });

    newContainer.innerHTML = target.contentDocument.body.innerHTML;
    document.getElementById('mainContent').innerHTML = newContainer.outerHTML;
  }
}

var timer = window.setInterval(function() {
  if (/loaded|complete/.test(document.readyState)) {
    initContentScript();
    clearInterval(timer);
  }
}, 10);
