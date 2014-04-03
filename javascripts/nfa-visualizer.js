function NFAVisualizer() {}
NFAVisualizer.visualize = function(selector, nfa) {
  var container = document.querySelector(selector);
  var width = getComputedStyle(container)['width'];
  var height = getComputedStyle(container)['height'];
  var svg = SVG.create('svg', { width: width, height: height });
  var transitionsGroup = SVG.create('g', { class: 'transitions' });
  var statesGroup = SVG.create('g', { class: 'states' });
  var arrowHeadsGroup = SVG.create('g', { class: 'arrow-heads' });
  var labelsGroup = document.createElement('div');
  labelsGroup.setAttribute('class', 'labels');
  labelsGroup.setAttribute('for', selector);
  container.appendChild(svg);
  document.body.appendChild(labelsGroup);
  labelsGroup.style.top = container.offsetTop + 'px';
  labelsGroup.style.left = container.offsetLeft + 'px';
  labelsGroup.style.width = width;
  labelsGroup.style.height = height;
  svg.appendChild(transitionsGroup);
  svg.appendChild(statesGroup);
  svg.appendChild(arrowHeadsGroup);
  width = svg.width.baseVal.value;
  height = svg.height.baseVal.value;

  var states = {};
  var interval = width / (nfa.statesCount + 1);
  var i = 1;
  for (var label in nfa.states) {
    var state = SVG.create('circle', { cx: interval * i++, cy: height / 2, r: 12, label: label });
    states[label] = state;
    statesGroup.appendChild(state);
    var label = NFAVisualizer.getStateLabel(state);
    labelsGroup.appendChild(label);
  }

  for (var label in nfa.states) {
    var source = states[label];
    var state = nfa.states[label];
    for (var symbol in state.transitions) {
      for (var i = 0; i < state.transitions[symbol].length; i++) {
        var sl = state.label;
        var dl = state.transitions[symbol][i].label;
        var destination = states[dl];
        var s = NFAVisualizer.getStateCoordinates(source);
        var d = NFAVisualizer.getStateCoordinates(destination);
        var distance = Math.distance(s, d);

        var f = 3;
        var n = s.x < d.x ? 'r' : 'l';
        var c = NFAVisualizer.getCurveControlPoints(distance, f, n);

        if (document.querySelector('.transitions path[source="' + sl + '"][destination="' + dl + '"]')) {
          var transition = document.querySelector('.transitions path[source="' + sl + '"][destination="' + dl + '"]');
          var label = document.querySelector('.labels span[source="' + sl + '"][destination="' + dl + '"]');
          var symbols = transition.getAttribute('symbol').split(',');
          var found = false;
          for (var j = 0; j < symbols.length && !found; found = symbols[j] == symbol, j++);
          if (!found) {
            symbols.push(symbol);
            symbols = symbols.join(',');
            transition.setAttribute('symbol', symbols);
            label.setAttribute('symbol', symbols);
            label.textContent = symbols;
          }
        } else if (sl == dl) {
          c = { x1: -45, y1: -55, x2: 45, y2: -55 };
          var transition = document.querySelector('.transitions path[source="' + sl + '"][destination="' + dl + '"]');
          transition = SVG.create('path', { d: NFAVisualizer.generatePathDefinition(s, c, d), source: sl, destination: dl, symbol: symbol });
          var label = NFAVisualizer.getTransitionLabel(s, c, symbol);
          label.setAttribute('source', sl);
          label.setAttribute('destination', dl);
          label.setAttribute('symbol', symbol);
          var control = { x: s.x + c.x1, y: s.y + c.y1 };
          var angle = Math.angle(d, control) - 5;
          var origin = Math.coordinates(d, 12, angle);
          var arrowHead = NFAVisualizer.getArrowHead(origin, angle);
          arrowHead.setAttribute('source', sl);
          arrowHead.setAttribute('destination', dl);
          transitionsGroup.appendChild(transition);
          labelsGroup.appendChild(label);
          arrowHeadsGroup.appendChild(arrowHead);
        } else if (document.querySelector('.transitions path[source="' + sl + '"][destination="' + dl + '"]')
          || document.querySelector('.transitions path[source="' + dl + '"][destination="' + sl + '"]')
          || distance > interval * 1.5) {
          while (document.querySelector('.transitions path[d="' + NFAVisualizer.generatePathDefinition(s, c, d) + '"]') && f > 0) {
            f -= 2;
            c = NFAVisualizer.getCurveControlPoints(distance, f, n);
          }
          var points = { sx: s.x, sy: s.y, p1x: s.x + c.x1, p1y: s.y + c.y1, p2x: s.x + c.x2, p2y: s.y + c.y2, dx: d.x, dy: d.y };
          var transition = SVG.create('path', { d: NFAVisualizer.generatePathDefinition(s, c, d), source: sl, destination: dl, symbol: symbol });
          var label = NFAVisualizer.getTransitionLabel(s, c, symbol);
          label.setAttribute('source', sl);
          label.setAttribute('destination', dl);
          label.setAttribute('symbol', symbol);
          var control = { x: s.x + c.x2, y: s.y + c.y2 };
          if (interval < 150 && distance < interval * 1.5) {
            var controlDistance = Math.distance({ x: s.x + c.x1, y: s.y + c.y1 }, { x: s.x + c.x2, y: s.y + c.y2 });
            control.x = s.x + c.x1 + controlDistance * (s.x < d.x ? 0.75 : -0.75);
          }
          var angle = Math.angle(d, control);
          if (distance > interval * 2 && distance < interval * 6) {
            angle += 3;
          }
          var origin = Math.coordinates(d, 12, angle);
          var arrowHead = NFAVisualizer.getArrowHead(origin, angle);
          arrowHead.setAttribute('source', sl);
          arrowHead.setAttribute('destination', dl);
          transitionsGroup.appendChild(transition);
          labelsGroup.appendChild(label);
          arrowHeadsGroup.appendChild(arrowHead);
        } else {
          var transition = SVG.create('path', { d: 'M' + s.x + ',' + s.y + ' L' + d.x + ',' + d.y, source: sl, destination: dl, symbol: symbol });
          var control = { x1: 0, y1: 0, x2: distance, y2: 0 };
          if (s.x > d.x) {
            control.x2 *= -1;
          }
          var label = NFAVisualizer.getTransitionLabel(s, control, symbol);
          label.setAttribute('source', sl);
          label.setAttribute('destination', dl);
          label.setAttribute('symbol', symbol);
          var angle = Math.angle(d, s);
          var origin = Math.coordinates(d, 12, angle);
          var arrowHead = NFAVisualizer.getArrowHead(origin, angle);
          arrowHead.setAttribute('source', sl);
          arrowHead.setAttribute('destination', dl);
          transitionsGroup.appendChild(transition);
          labelsGroup.appendChild(label);
          arrowHeadsGroup.appendChild(arrowHead);
        }
      }
    }
  }

  var indicator = NFAVisualizer.getStartStateIndicator(states[nfa.getStartState().label]);
  svg.appendChild(indicator);

  var finalStates = nfa.getFinalStates();
  for (i = 0; i < finalStates.length; i++) {
    states[finalStates[i].label].classList.add('final');
  }
}

NFAVisualizer.getStateCoordinates = function(state) {
  return { x: parseInt(state.getAttribute('cx')), y: parseInt(state.getAttribute('cy')) };
}

NFAVisualizer.getCurveControlPoints = function(distance, factor, direction) {
  var points = {};
  points['x1'] = distance * (direction == 'r' ? 0.25 : -0.25);
  points['y1'] = distance / (direction == 'r' ? -factor : factor);
  points['x2'] = distance * (direction == 'r' ? 0.75 : -0.75);
  points['y2'] = distance / (direction == 'r' ? -factor : factor);
  return points;
}

NFAVisualizer.generatePathDefinition = function(source, control, destination) {
  return 'M' +  source.x + ',' + source.y 
    + ' C' + (source.x + control.x1) + ',' + (source.y + control.y1) + ' ' 
    + (source.x + control.x2) + ',' + (source.y + control.y2) + ' ' 
    + destination.x + ',' + destination.y;
}

NFAVisualizer.getStateLabel = function(state) {
  var label = document.createElement('p');
  label.textContent = state.getAttribute('label');
  label.style.top = state.getAttribute('cy') + 'px';
  label.style.left = state.getAttribute('cx') + 'px';
  label.setAttribute('for', state.getAttribute('label'));
  return label;
}

NFAVisualizer.getTransitionLabel = function(source, control, symbol) {
  var label = document.createElement('span');
  label.textContent = symbol;
  var top = source.y + control.y1 * 0.75;
  label.style.top = top + (source.y >= top ? -5 : 5) + 'px';
  label.style.left = source.x + (control.x1 + control.x2) / 2 + 'px';
  return label;
}

NFAVisualizer.getArrowHead = function(origin, angle) {
  var e1 = Math.coordinates(origin, 6, angle + 25);
  var e2 = Math.coordinates(origin, 6, angle - 25);
  return SVG.create('path', { d: 'M' + e1.x + ',' + e1.y + ' L' + origin.x + ',' + origin.y + ' ' + e2.x + ',' + e2.y });
}

NFAVisualizer.getStartStateIndicator = function(state) {
  var cx = parseInt(state.getAttribute('cx')) - 12;
  var cy = parseInt(state.getAttribute('cy'));
  var e1 = Math.coordinates({ x: cx, y: cy }, 10, 180 - 45);
  var e2 = Math.coordinates({ x: cx, y: cy }, 10, 180 + 45);
  return SVG.create('path', { d: 'M' + e1.x + ',' + e1.y + ' L' + cx + ',' + cy + ' ' + e2.x + ',' + e2.y, class: 'indicator' });
}

NFAVisualizer.showCurveControlPoints = function(svg, points) {
  var c1 = SVG.create('circle', { cx: points.p1x, cy: points.p1y, r: 1, class: 'control' });
  var c2 = SVG.create('circle', { cx: points.p2x, cy: points.p2y, r: 1, class: 'control' });
  var l1 = SVG.create('path', { d: 'M' + points.sx + ',' + points.sy + ' L' + points.p1x + ',' + points.p1y, class: 'control' });
  var l2 = SVG.create('path', { d: 'M' + points.dx + ',' + points.dy + ' L' + points.p2x + ',' + points.p2y, class: 'control' });
  var l3 = SVG.create('path', { d: 'M' + points.p1x + ',' + points.p1y + ' L' + points.p2x + ',' + points.p2y, class: 'control' });
  var d1 = Math.distance({ x: points.sx, y: points.sy }, { x: points.p1x, y: points.p1y });
  var a1 = Math.angle({ x: points.sx, y: points.sy }, { x: points.p1x, y: points.p1y });
  var m1 = Math.coordinates({ x: points.sx, y: points.sy }, d1 / 2, a1);
  var c3 = SVG.create('circle', { cx: m1.x, cy: m1.y, r: 1, class: 'control' });
  var d2 = Math.distance({ x: points.dx, y: points.dy }, { x: points.p2x, y: points.p2y });
  var a2 = Math.angle({ x: points.dx, y: points.dy }, { x: points.p2x, y: points.p2y });
  var m2 = Math.coordinates({ x: points.dx, y: points.dy }, d2 / 2, a2);
  var c4 = SVG.create('circle', { cx: m2.x, cy: m2.y, r: 1, class: 'control' });
  var c5 = SVG.create('circle', { cx: (points.p1x + points.p2x) / 2, cy: points.p1y, r: 1, class: 'control' });
  var l4 = SVG.create('path', { d: 'M' + m1.x + ',' + m1.y + ' L' + (points.p1x + points.p2x) / 2 + ',' + points.p2y, class: 'control' });
  var l5 = SVG.create('path', { d: 'M' + m2.x + ',' + m2.y + ' L' + (points.p1x + points.p2x) / 2 + ',' + points.p2y, class: 'control' });
  var d3 = Math.distance({ x: points.p1x, y: points.p1y }, { x: points.p2x, y: points.p2y });
  var c6 = SVG.create('circle', { cx: points.p1x + d3 * (points.sx < points.dx ? 0.75 : -0.75), cy: points.p1y, r: 1, class: 'control' });
  var l6 = SVG.create('path', { d: 'M' + (points.p1x + d3 * (points.sx < points.dx ? 0.75 : -0.75)) + ',' + points.p1y + ' L' + points.dx + ',' + points.dy, class: 'control' });
  svg.appendChild(c1);
  svg.appendChild(c2);
  svg.appendChild(l1);
  svg.appendChild(l2);
  svg.appendChild(l3);
  svg.appendChild(c3);
  svg.appendChild(c4);
  svg.appendChild(c5);
  svg.appendChild(l4);
  svg.appendChild(l5);
  svg.appendChild(c6);
  svg.appendChild(l6);
}





function SVG() {}
SVG.create = function(type, attributes) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', type);
  if (attributes && typeof attributes == 'object') {
    for (var attribute in attributes) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }
  return element;
}





Math.distance = function(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

Math.angle = function(p1, p2) {
  var angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
  angle *= 180 / Math.PI;
  if (p2.x >= p1.x && p2.y < p1.y) {
    angle =  -angle;
  } else if (p2.x < p1.x && p2.y < p1.y || p2.x < p1.x && p2.y >= p1.y) {
    angle = 180 - angle;
  } else if (p2.x >= p1.x && p2.y >= p1.y) {
    angle = 360 - angle;
  }
  return angle % 360;
}

Math.coordinates = function(origin, length, angle) {
  angle *= Math.PI / 180;
  var x = origin.x + Math.cos(angle) * length;
  var y = origin.y - Math.sin(angle) * length;
  return { x: x, y: y };
}