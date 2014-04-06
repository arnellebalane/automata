function JSFlap() {}
JSFlap.svgs = {};
JSFlap.nfas = {};
JSFlap.values = {};
JSFlap.prompts = {};
JSFlap.menus = {};

JSFlap.transform = function(selector) {
  var container = document.querySelector(selector);
  var width = getComputedStyle(container)['width'];
  var height = getComputedStyle(container)['height'];
  var svg = JSFlap.SVG.create('svg', { width: width, height: height });
  var states = JSFlap.SVG.create('g', { class: 'states' });
  var transitions = JSFlap.SVG.create('g', { class: 'transitions' });
  var arrowHeads = JSFlap.SVG.create('g', { class: 'arrow-heads' });
  var labels = document.createElement('div');
  var prompt = document.createElement('div');
  var menu = document.createElement('div');
  labels.setAttribute('class', 'labels');
  labels.setAttribute('for', selector);
  labels.style.top = 0;
  labels.style.left = 0;
  labels.style.right = 0;
  labels.style.bottom = 0;
  prompt.innerHTML = JSFlap.templates.promptSymbol;
  prompt = prompt.firstChild;
  menu.innerHTML = JSFlap.templates.contextMenu;
  menu = menu.firstChild;
  container.appendChild(svg);
  svg.appendChild(transitions);
  svg.appendChild(arrowHeads);
  svg.appendChild(states);
  var position = getComputedStyle(container)['position'];
  container.style.position = (position == 'relative' || position == 'absolute') ? position : 'relative';
  container.appendChild(labels);
  container.appendChild(prompt);
  container.appendChild(menu);

  JSFlap.svgs[selector] = { canvas: svg, states: states, transitions: transitions, arrowHeads: arrowHeads, labels: labels };
  JSFlap.nfas[selector] = new NFA('ab');
  JSFlap.nfas[selector].states = {};
  JSFlap.nfas[selector].statesCount = 0;
  JSFlap.nfas[selector].startState = null;
  JSFlap.prompts[selector] = prompt;
  JSFlap.menus[selector] = menu;

  svg.addEventListener('mousedown', function(e) {
    if ('prompted-transition' in JSFlap.values) {
      JSFlap.removeTransition(JSFlap.values['prompted-transition']);
      delete JSFlap.values['prompted-transition'];
    } else if ('contextmenu-state' in JSFlap.values) {
      JSFlap.menus[selector].classList.add('hidden');
      delete JSFlap.values['contextmenu-state'];
    } else {
      if (e.target.nodeName == 'circle') {
        if (e.shiftKey) {
          JSFlap.values['active-transition'] = JSFlap.startTransition(e);
        } else if (e.altKey) { 
          JSFlap.values['delete-state'] = e.target;
        } else {
          JSFlap.values['active-state'] = e.target;
        }
      } else {
        JSFlap.values['active-state'] = JSFlap.addState(e, selector)
      }
    }
  });

  svg.addEventListener('mousemove', function(e) {
    if ('active-state' in JSFlap.values) {
      JSFlap.dragState(e, JSFlap.values['active-state']);
    }

    if ('active-transition' in JSFlap.values) {
      JSFlap.dragTransition(e, JSFlap.values['active-transition']);
    }
  });

  svg.addEventListener('mouseup', function(e) {
    delete JSFlap.values['active-state'];
    if ('active-transition' in JSFlap.values) {
      if (e.target.nodeName == 'circle') {
        JSFlap.endTransition(e, JSFlap.values['active-transition']);
      } else {
        JSFlap.cancelTransition(selector);
      }
      delete JSFlap.values['active-transition'];
    }

    if ('delete-state' in JSFlap.values) {
      if (e.target.nodeName == 'circle') {
        JSFlap.removeState(e, selector);
      }
      delete JSFlap.values['delete-state'];
    }
  });

  svg.addEventListener('contextmenu', function(e) {
    if (e.target.nodeName == 'circle') {
      e.preventDefault();
      JSFlap.showContextMenu(e.target);
      JSFlap.values['contextmenu-state'] = e.target;
    }
  });

  prompt.addEventListener('submit', function(e) {
    e.preventDefault();
    var symbol = prompt.symbol.value.trim();
    JSFlap.activateTransition(JSFlap.values['prompted-transition'], symbol);
    delete JSFlap.values['prompted-transition'];
  });

  prompt.symbol.addEventListener('blur', function() {
    if ('prompted-transition' in JSFlap.values) {
      JSFlap.removeTransition(JSFlap.values['prompted-transition']);
      delete JSFlap.values['prompted-transition'];
    }
  });

  document.querySelector('a[data-action="start-state"]', menu).addEventListener('click', function(e) {
    e.preventDefault();
    JSFlap.setStartState(JSFlap.values['contextmenu-state']);
    JSFlap.menus[selector].classList.add('hidden');
    delete JSFlap.values['contextmenu-state'];
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

JSFlap.removeState = function(e, selector) {
  var svg = JSFlap.svgs[selector];
  var nfa = JSFlap.nfas[selector];
  var labelToRemove = $(e.target).attr('label');
  var state = nfa.removeState( labelToRemove );
  $('circle[label="' + labelToRemove + '"]').remove();
  $('p[label="' + labelToRemove + '"]').remove();
  $('path[source="' + labelToRemove + '"]').remove();
  $('path[destination="' + labelToRemove + '"]').remove();
  $('path[for*="' + labelToRemove + '"]').remove();
  $('span[for*="' + labelToRemove + '"]').remove();
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
  var indicator = document.querySelector('path.start-state-indicator[for="' + label + '"]', svg.canvas);
  if (indicator) {
    indicator.remove();
    var cx = parseInt(state.getAttribute('cx')) - 12;
    var cy = parseInt(state.getAttribute('cy'));
    var e1 = Math.coordinates({ x: cx, y: cy }, 10, 180 - 45);
    var e2 = Math.coordinates({ x: cx, y: cy }, 10, 180 + 45);
    indicator = JSFlap.SVG.create('path', {  d: 'M' + e1.x + ',' + e1.y + ' L' + cx + ',' + cy + ' ' + e2.x + ',' + e2.y, class: 'start-state-indicator indicator', for: label });
    svg.canvas.appendChild(indicator);
  }
  var transitions = document.querySelectorAll('path[source="' + label + '"], path[destination="' + label + '"]', svg.transitions);
  for (var i = 0; i < transitions.length; i++) {
    var sourceLabel = transitions[i].getAttribute('source');
    var destinationLabel = transitions[i].getAttribute('destination');
    var source = document.querySelector('circle[label="' + sourceLabel + '"]', svg.states);
    var destination = document.querySelector('circle[label="' + destinationLabel + '"]', svg.states);
    var sx = parseInt(source.getAttribute('cx'));
    var sy = parseInt(source.getAttribute('cy'));
    var dx = parseInt(destination.getAttribute('cx'));
    var dy = parseInt(destination.getAttribute('cy'));
    var angle = null;
    var origin = null;
    label = document.querySelector('span[for="' + sourceLabel + '-' + destinationLabel + '"]', svg.labels);
    if (source == destination) {
      var r = source.getAttribute('r');
      var s = { x: sx, y: sy - r };
      var d = { x: dx, y: dy - r };
      var c = { x1: -(r * 4), y1: -(r * 4), x2: (r * 4), y2: -(r * 4) };
      transitions[i].setAttribute('d', JSFlap.generatePathDefinition(s, c, d));
      var control = { x: s.x - 45, y: s.y -55 };
      var angle = Math.angle(d, control);
      var origin = Math.coordinates(d, 1, angle);
      label.style.top = s.y - r * 3.5 + 'px';
      label.style.left = s.x + 'px';
    } else {
      transitions[i].setAttribute('d', 'M' + sx + ',' + sy + ' L' + dx + ',' + dy);
      var angle = Math.angle({ x: dx, y: dy }, { x: sx, y: sy });
      var origin = Math.coordinates({ x: dx, y: dy }, 12, angle);
      var distance = Math.distance({ x: sx, y: sy }, { x: dx, y: dy });
      var middle = Math.coordinates({ x: dx, y: dy }, distance / 2, angle);
      var coordinates = Math.coordinates(middle, 7, angle + 90);
      label.style.top = coordinates.y + 'px';
      label.style.left = coordinates.x + 'px';
    }
    var arrowHead = JSFlap.getArrowHead(origin, angle);
    document.querySelector('path[for="' + sourceLabel + '-' + destinationLabel + '"]').setAttribute('d', arrowHead.getAttribute('d'));
    if (document.querySelector('path[source="' + destinationLabel + '"][destination="' + sourceLabel + '"]') && sourceLabel != destinationLabel) {
      JSFlap.curveTransition(transitions[i]);
    }
  }
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
  var angle = Math.angle({ x: dx, y: dy }, { x: sx, y: sy });
  var arrowHead = JSFlap.getArrowHead({ x: dx, y: dy }, angle);
  arrowHead.setAttribute('for', 'active-transition');
  svg.transitions.appendChild(transition);
  svg.arrowHeads.appendChild(arrowHead);
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
  document.querySelector('path[for="active-transition"]', svg.arrowHeads).remove();
  var angle = Math.angle({ x: dx, y: dy }, { x: sx, y: sy });
  var arrowHead = JSFlap.getArrowHead({ x: dx, y: dy }, angle);
  arrowHead.setAttribute('for', 'active-transition');
  svg.arrowHeads.appendChild(arrowHead);
}

JSFlap.endTransition = function(e, transition) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var sourceLabel = transition.getAttribute('source');
  var source = document.querySelector('circle[label="' + sourceLabel + '"]', svg.states);
  var destination = e.target;
  var destinationLabel = destination.getAttribute('label');
  var sx = parseInt(source.getAttribute('cx'));
  var sy = parseInt(source.getAttribute('cy'));
  var dx = parseInt(destination.getAttribute('cx'));
  var dy = parseInt(destination.getAttribute('cy'));
  var angle = null;
  var origin = null;
  var prompt = JSFlap.prompts[container];
  if (source == destination) {
    var r = source.getAttribute('r');
    var s = { x: sx, y: sy - r };
    var d = { x: dx, y: dy - r };
    var c = { x1: -(r * 4), y1: -(r * 4), x2: (r * 4), y2: -(r * 4) };
    transition.setAttribute('d', JSFlap.generatePathDefinition(s, c, d));
    var control = { x: s.x - 45, y: s.y - 55 };
    angle = Math.angle(d, control);
    origin = Math.coordinates(d, 1, angle);
    prompt.style.top = s.y - 50 + 'px';
    prompt.style.left = s.x + 5 + 'px';
  } else {
    transition.setAttribute('d', 'M' + sx + ',' + sy + ' L' + dx + ',' + dy);
    angle = Math.angle({ x: dx, y: dy }, { x: sx, y: sy });
    origin = Math.coordinates({ x: dx, y: dy }, 12, angle);
    var distance = Math.distance({ x: sx, y: sy }, { x: dx, y: dy });
    var middle = Math.coordinates({ x: dx, y: dy }, distance / 2, angle);
    prompt.style.top = middle.y - 15 + 'px';
    prompt.style.left = middle.x + 5 + 'px';
  }
  prompt.classList.remove('hidden');
  prompt.symbol.focus();
  JSFlap.values['prompted-transition'] = transition;
  transition.setAttribute('destination', destinationLabel);
  transition.setAttribute('label', sourceLabel + '-' + destinationLabel);
  document.querySelector('path[for="active-transition"]', svg.arrowHeads).remove();
  var arrowHead = JSFlap.getArrowHead(origin, angle);
  arrowHead.setAttribute('for', sourceLabel + '-' + destinationLabel);
  svg.arrowHeads.appendChild(arrowHead);
  var reverse = document.querySelector('path[source="' + destinationLabel + '"][destination="' + sourceLabel + '"]');
  if (reverse && sourceLabel != destinationLabel) {
    JSFlap.curveTransition(transition);
    JSFlap.curveTransition(reverse);
  }
}

JSFlap.activateTransition = function(transition, symbol) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var nfa = JSFlap.nfas[container];
  var sourceLabel = transition.getAttribute('source');
  var destinationLabel = transition.getAttribute('destination');
  var source = document.querySelector('circle[label="' + sourceLabel + '"]', svg.states);
  var destination = document.querySelector('circle[label="' + destinationLabel + '"]', svg.states);
  var sourceState = nfa.getState(sourceLabel);
  var destinationState = nfa.getState(destinationLabel);
  symbol = (symbol || '~').split(',');
  for (var i = 0; i < symbol.length; i++) {
    sourceState.transition(destinationState, symbol[i].trim());
  }
  symbol = symbol.join(',');
  var sx = parseInt(source.getAttribute('cx'));
  var sy = parseInt(source.getAttribute('cy'));
  var dx = parseInt(destination.getAttribute('cx'));
  var dy = parseInt(destination.getAttribute('cy'));
  var label = document.createElement('span');
  label.textContent = symbol;
  if (sourceLabel == destinationLabel) {
    var r = parseInt(source.getAttribute('r'));
    label.style.top = sy - r * 4.5 + 'px';
    label.style.left = sx + 'px';
  } else {
    var angle = Math.angle({ x: dx, y: dy }, { x: sx, y: sy });
    var distance = Math.distance({ x: sx, y: sy }, { x: dx, y: dy });
    var middle = Math.coordinates({ x: dx, y: dy }, distance / 2, angle);
    var coordinates = Math.coordinates(middle, 7, angle + 90);
    label.style.top = coordinates.y + 'px';
    label.style.left = coordinates.x + 'px';
  }
  label.setAttribute('for', transition.getAttribute('label'));
  svg.labels.appendChild(label);
  JSFlap.prompts[container].symbol.value = '';
  JSFlap.prompts[container].classList.add('hidden');
  var reverse = document.querySelector('path[source="' + destinationLabel + '"][destination="' + sourceLabel + '"]');
  if (reverse && sourceLabel != destinationLabel) {
    JSFlap.curveTransition(transition);
    JSFlap.curveTransition(reverse);
  }
}

JSFlap.cancelTransition = function(selector) {
  var svg = JSFlap.svgs[selector];
  JSFlap.values['active-transition'].remove();
  document.querySelector('path[for="active-transition"]', svg.arrowHeads).remove();
}

JSFlap.removeTransition = function(transition) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var label = transition.getAttribute('label');
  document.querySelector('path[for="' + label + '"]', svg.arrowHeads).remove();
  transition.remove();
  JSFlap.prompts[container].classList.add('hidden');
}

JSFlap.curveTransition = function(transition) {
  var container = transition.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var sourceLabel = transition.getAttribute('source');
  var destinationLabel = transition.getAttribute('destination');
  var source = document.querySelector('circle[label="' + sourceLabel + '"]', svg.states);
  var destination = document.querySelector('circle[label="' + destinationLabel + '"]', svg.states);
  var s = { x: parseInt(source.getAttribute('cx')), y: parseInt(source.getAttribute('cy')) };
  var d = { x: parseInt(destination.getAttribute('cx')), y: parseInt(destination.getAttribute('cy')) };
  var distance = Math.distance(s, d);
  var angle = Math.angle(s, d);
  var origin1 = Math.coordinates(s, distance * 0.25, angle);
  var origin2 = Math.coordinates(s, distance * 0.75, angle);
  var control1 = Math.coordinates(origin1, distance * 0.2, angle + 90);
  var control2 = Math.coordinates(origin2, distance * 0.2, angle + 90);
  var control = { x1: control1.x - s.x, y1: control1.y - s.y, x2: control2.x - s.x, y2: control2.y - s.y };
  var path = JSFlap.generatePathDefinition(s, control, d);
  transition.setAttribute('d', path);
  angle = Math.angle(d, control2);
  var label = document.querySelector('span[for="' + sourceLabel + '-' + destinationLabel + '"]', svg.labels);
  var middle = Math.coordinates(d, distance / 2, angle);
  var coordinates = Math.coordinates(middle, distance * 0.2 - 7, angle + 90);
  if (label) {
    label.style.top = coordinates.y + 'px';
    label.style.left = coordinates.x + 'px';
  } else {
    var prompt = JSFlap.prompts[container];
    prompt.style.top = coordinates.y - 20 + 'px';
    prompt.style.left = coordinates.x + 3 + 'px';
  }
  if (distance < 50) {
    angle += 15;
  } else if (distance < 200) {
    angle += 10;
  }
  var origin = Math.coordinates(d, 12, angle);
  var arrowHead = JSFlap.getArrowHead(origin, angle);
  document.querySelector('path[for="' + sourceLabel + '-' + destinationLabel + '"]', svg.arrowHeads).setAttribute('d', arrowHead.getAttribute('d'));
}

JSFlap.getArrowHead = function(origin, angle) {
  var e1 = Math.coordinates(origin, 6, angle + 25);
  var e2 = Math.coordinates(origin, 6, angle - 25);
  return JSFlap.SVG.create('path', { d: 'M' + e1.x + ',' + e1.y + ' L' + origin.x + ',' + origin.y + ' ' + e2.x + ',' + e2.y });
}

JSFlap.generatePathDefinition = function(source, control, destination) {
  return 'M' +  source.x + ',' + source.y 
    + ' C' + (source.x + control.x1) + ',' + (source.y + control.y1) + ' ' 
    + (source.x + control.x2) + ',' + (source.y + control.y2) + ' ' 
    + destination.x + ',' + destination.y;
}

JSFlap.showContextMenu = function(state) {
  var container = state.getAttribute('container');
  var cx = parseInt(state.getAttribute('cx'));
  var cy = parseInt(state.getAttribute('cy'));
  var menu = JSFlap.menus[container];
  menu.style.top = cy + 17 + 'px';
  menu.style.left = cx + 'px';
  menu.classList.remove('hidden');
}

JSFlap.setStartState = function(state) {
  var container = state.getAttribute('container');
  var svg = JSFlap.svgs[container];
  var nfa = JSFlap.nfas[container];
  var label = state.getAttribute('label');
  var _state = nfa.getState(label);
  nfa.setStartState(_state);
  var cx = parseInt(state.getAttribute('cx')) - 12;
  var cy = parseInt(state.getAttribute('cy'));
  var e1 = Math.coordinates({ x: cx, y: cy }, 10, 180 - 45);
  var e2 = Math.coordinates({ x: cx, y: cy }, 10, 180 + 45);
  var indicator = document.querySelector('path.start-state-indicator', svg.canvas);
  if (indicator) {
    indicator.remove();
  }
  indicator = JSFlap.SVG.create('path', { class: 'start-state-indicator indicator', for: label });
  indicator.setAttribute('d', 'M' + e1.x + ',' + e1.y + ' L' + cx + ',' + cy + ' ' + e2.x + ',' + e2.y);
  svg.canvas.appendChild(indicator);
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





JSFlap.templates = function() {}
JSFlap.templates.promptSymbol = '<form action="#" method="POST" id="prompt-transition-symbol" class="hidden"> \
                                    <input type="text" name="symbol"> \
                                  </form>';

JSFlap.templates.contextMenu = '<ul id="context-menu" class="hidden"> \
                                  <li><a href="#" data-action="start-state">Start State</a></li> \
                                  <li><a href="#" data-action="final-state">Final State</a></li> \
                                </ul>';
