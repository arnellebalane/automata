function JSFlap() {}
JSFlap.svgs = {};
JSFlap.nfas = {};
JSFlap.values = {};

JSFlap.transform = function(selector) {
  var container = document.querySelector(selector);
  var width = getComputedStyle(container)['width'];
  var height = getComputedStyle(container)['height'];
  var svg = JSFlap.SVG.create('svg', { width: width, height: height });
  var states = JSFlap.SVG.create('g', { class: 'states' });
  var transitions = JSFlap.SVG.create('g', { class: 'transitions' });
  var labels = document.createElement('div');
  labels.setAttribute('class', 'labels');
  labels.setAttribute('for', selector);
  labels.style.top = 0;
  labels.style.left = 0;
  labels.style.right = 0;
  labels.style.bottom = 0;
  container.appendChild(svg);
  svg.appendChild(transitions);
  svg.appendChild(states);
  var position = getComputedStyle(container)['position'];
  container.style.position = (position == 'relative' || position == 'absolute') ? position : 'relative';
  container.appendChild(labels);

  JSFlap.svgs[selector] = { canvas: svg, states: states, transitions: transitions, labels: labels };
  JSFlap.nfas[selector] = new NFA('ab');
  JSFlap.nfas[selector].states = {};
  JSFlap.nfas[selector].statesCount = 0;
  JSFlap.nfas[selector].startState = null;

  container.addEventListener('mousedown', function(e) {
    if (e.target.nodeName == 'circle') {
      if (e.shiftKey) {
        JSFlap.values['active-transition'] = JSFlap.startTransition(e);
      } else {
        JSFlap.values['active-state'] = e.target;
      }
    } else {
      JSFlap.values['active-state'] = JSFlap.addState(e, selector)
    }
  });

  container.addEventListener('mousemove', function(e) {
    if ('active-state' in JSFlap.values) {
      JSFlap.dragState(e, JSFlap.values['active-state']);
    }
    if ('active-transition' in JSFlap.values) {
      JSFlap.dragTransition(e, JSFlap.values['active-transition']);
    }
  });

  container.addEventListener('mouseup', function(e) {
    delete JSFlap.values['active-state'];
    if ('active-transition' in JSFlap.values) {
      if (e.target.nodeName == 'circle') {
        JSFlap.endTransition(e, JSFlap.values['active-transition']);
      } else {
        JSFlap.values['active-transition'].remove();
      }
      delete JSFlap.values['active-transition'];
    }
  });
}

JSFlap.addState = function(e, selector) {
  var svg = JSFlap.svgs[selector];
  var nfa = JSFlap.nfas[selector];
  var cx = e.pageX + svg.canvas.offsetLeft;
  var cy = e.pageY + svg.canvas.offsetTop;
  var state = nfa.addState();
  var $state = JSFlap.SVG.create('circle', { cx: cx, cy: cy, r: 12, label: state.label, container: selector });
  var label = document.createElement('p');
  label.setAttribute('label', state.label);
  label.textContent = state.label;
  label.style.top = cy + 'px';
  label.style.left = cx + 'px';
  svg.states.appendChild($state);
  svg.labels.appendChild(label);
  return $state;
}

JSFlap.dragState = function(e, state) {
  var container = state.getAttribute('container');
  var label = state.getAttribute('label');
  var svg = JSFlap.svgs[container];
  var $label = document.querySelector('p[label="' + label + '"]', svg.labels);
  var cx = e.pageX + svg.canvas.offsetLeft;
  var cy = e.pageY + svg.canvas.offsetTop;
  state.setAttribute('cx', cx);
  state.setAttribute('cy', cy);
  $label.style.top = cy + 'px';
  $label.style.left = cx + 'px';
}

JSFlap.startTransition = function(e) {
  var state = e.target;
  var container = state.getAttribute('container');
  var label = state.getAttribute('label');
  var sx = state.getAttribute('cx');
  var sy = state.getAttribute('cy');
  var svg = JSFlap.svgs[container];
  var dx = e.pageX + svg.canvas.offsetLeft;
  var dy = e.pageY + svg.canvas.offsetTop;
  var transition = JSFlap.SVG.create('path', { d: 'M' + sx + ',' + sy + ' L' + dx + ',' + dy, source: label, container: container });
  svg.transitions.appendChild(transition);
  return transition;
}

JSFlap.dragTransition = function(e, transition) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var label = transition.getAttribute('source');
  var source = document.querySelector('circle[label="' + label + '"]', svg.states);
  var sx = source.getAttribute('cx');
  var sy = source.getAttribute('cy');
  var dx = e.pageX + svg.canvas.offsetLeft;
  var dy = e.pageY + svg.canvas.offsetTop;
  transition.setAttribute('d', 'M' + sx + ',' + sy + 'L' + dx + ',' + dy);
}

JSFlap.endTransition = function(e, transition) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var sourceLabel = transition.getAttribute('source');
  var source = document.querySelector('circle[label="' + sourceLabel + '"]', svg.states);
  var destination = e.target;
  var destinationLabel = destination.getAttribute('label');
  var sx = source.getAttribute('cx');
  var sy = source.getAttribute('cy');
  var dx = destination.getAttribute('cx');
  var dy = destination.getAttribute('cy');
  transition.setAttribute('d', 'M' + sx + ',' + sy + ' L' + dx + ',' + dy);
  transition.setAttribute('destination', destinationLabel);
}





JSFlap.SVG = function() {}
JSFlap.SVG.create = function(type, attributes) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', type);
  if (attributes && typeof attributes == 'object') {
    for (var attribute in attributes) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }
  return element;
}