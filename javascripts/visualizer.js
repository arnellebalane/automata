var startState = null;
var finalStates = [];
var statesPool = [];
var transitions = [];
var visSVG = $('svg');
var gCtxMenu = $('#gContextMenu');
var gCtxMenuLi = $('#gContextMenu li');
var gCtxMenuInputs = $('#gContextMenu input');
var off_top = visSVG.offset().top;
var off_left = visSVG.offset().left;
var count = 0;
var pathCounter = 0;
var activePath = null;
var activeState = null;
var pathEdit = null;
var openState = null;
var transitionArr = [];

var _NFA;
var STATES = [];
var FINAL_STATES = [];
var START_STATE;
_NFA = new NFA('ab');
_NFA.states = {};
_NFA.startState = null;
_NFA.statesCount = 0;
var loser;

$(document).ready( function(){

	$(document).on('contextmenu', visSVG, function(e){
		// alert('Context Menu event has fired!');
		return false;
	});

	function showContextMenu(e) {
		gCtxMenu.css("top", e.pageY);
		gCtxMenu.css("left", e.pageX);

		_g = getStateFromG();
		if (!_g.final) {
			$('input[value=final]').prop('checked', false);
		} else {
			$('input[value=final]').prop('checked', true);
		}

		gCtxMenu.show();
	}

	function hideContextMenu(){
		gCtxMenu.hide();
	}

	function contextMenuHidden() {
		return gCtxMenu.is(":hidden");
	}

	$('input[value=final]').on('click', function(){
		addFinalStateFromG($(this).value);
		hideContextMenu();
		activeState = null;
		console.log('Final:');
		console.log(finalStates);
	});

	$('input[value=Cancel]').on('mousedown', function(){
		hideContextMenu();
		activeState = null;
	});

	function addFinalStateFromG(id) {
		_id = $(activeState.attr('id', id)).attr('id');
		if (finalStates[_id] == null) {
			$('input[value=final]').prop('checked', false);
			statesPool[_id].final = true;
			finalStates[_id] = statesPool[_id];
			_NFA.states[_id].final = true;
			$('input[value=final]').prop('checked', true);
			styleAsFinal(activeState);
		} else {
			statesPool[_id].final = false;
			_NFA.states[_id].final = false;
			delete finalStates[_id];
			styleAsNormal(activeState);
			$('input[value=final]').prop('checked', false);
		}
	}

	function getStateFromG(id){
		_id = $(activeState.attr('id', id)).attr('id');
		return _state = statesPool[_id];
	}

	function styleAsFinal(g) {
		g.find('circle').attr({'stroke-width':5});
	}

	function styleAsNormal(g) {
		g.find('circle').attr({'stroke-width':1});	
	}

	visSVG.on('mousemove', function(e){
		var x = e.pageX - off_left;
		var y = e.pageY - off_top;
		
		if (activeState != null && e.which != 3 && contextMenuHidden()) {
			activeState.find('text').attr({
				'x': x - activeState.find('text').width()/2,
				'y': y - activeState.find('text').height() + 50
			});
			activeState.find('#symbol').attr({
				'x': (x - activeState.find('text').width()/2) - 30,
				'y': y - activeState.find('text').height() + 50
			});
			activeState.find('circle').attr({'cx': x, 'cy': y});

			for (var i = 0; i < transitions.length; i++) {
				var path = transitions[i];
				var line = $('#'+path['label']);
				var src = {x : $('#'+path['src']).find('circle').attr('cx'), y : $('#'+path['src']).find('circle').attr('cy')};
				var dest = {x : $('#'+path['dest']).find('circle').attr('cx'), y : $('#'+path['dest']).find('circle').attr('cy')};

				var angle = Math.angle(dest, src);
				var origin = Math.coordinates(dest, 30, angle);
				var arrowHead = NFAVisualizer.getArrowHead(origin, angle);

				if (path['src'] == activeState.attr('id')) {
					var x2 = line.find('line').attr('x2');
					var y2 = line.find('line').attr('y2');
					var textX = Math.abs(x2 - x)*.5 + Math.min(x2, x);
					var textY = Math.abs(y2 - y)*.5 + Math.min(y2, y);

					line.find('line').attr({'x1': x, 'y1': y});
					line.find('text').attr({'x': textX, 'y': textY});
				} else if (path['dest'] == activeState.attr('id')) {
					var x1 = line.find('line').attr('x1');
					var y1 = line.find('line').attr('y1');
					var textX = Math.abs(x1 - x)*.5 + Math.min(x1, x);
					var textY = Math.abs(y1 - y)*.5 + Math.min(y1, y);

					line.find('line').attr({'x2': x, 'y2': y});
					line.find('text').attr({'x': textX, 'y': textY});
				}

				if (path['src'] == activeState.attr('id') && path['dest'] == activeState.attr('id')) {
					var p1X = x - 100;
					var p1Y = y - 100;
					var p2X = x + 100;
					var p2Y = y - 100;
					textX = (p1X + p2X) / 2;
					textY = p1Y + 20;

					line.find('path').attr('d', 'M'+x+','+y+' C'+p1X+','+p1Y+' '+p2X+','+p2Y+' '+x+','+y);
					line.find('text').attr({'x': textX, 'y': textY});
				}
			}
		}

		if (openState != null  && e.which != 3) {
			var x1 = $('#'+activePath).find('line').attr('x1');
			var y1 = $('#'+activePath).find('line').attr('y1');
			var textX = Math.abs(x1 - x)*.5 + Math.min(x1, x);
			var textY = Math.abs(y1 - y)*.5 + Math.min(y1, y);
				
			$('#'+activePath).find('line').attr({'x2': x, 'y2': y});
			$('#'+activePath).find('text').attr({'x': textX, 'y': textY});
		}
	});

	visSVG.on('mouseup', function(e){
		if (activeState != null && e.which != 3) {
			var x = e.pageX - off_left;
			var y = e.pageY - off_top;
			activeState.find('text').attr({
				'x': x - activeState.find('text').width()/2,
				'y': y - activeState.find('text').height() + 50
			});
			activeState.find('#symbol').attr({
				'x': (x - activeState.find('text').width()/2) - 30,
				'y': y - activeState.find('text').height() + 50
			});
			activeState.find('circle').attr({'cx': x, 'cy': y});
			for (var i = 0; i < transitions.length; i++) {
				var path = transitions[i];
				var line = $('#'+path['label']);

				if (path['src'] == activeState.attr('id')) {
					var x2 = line.find('line').attr('x2');
					var y2 = line.find('line').attr('y2');
					var textX = Math.abs(x2 - x)*.5 + Math.min(x2, x);
					var textY = Math.abs(y2 - y)*.5 + Math.min(y2, y);
					
					line.find('line').attr({'x1': x, 'y1': y});
					line.find('text').attr({'x': textX, 'y': textY});
				}

				if (path['dest'] == activeState.attr('id')) {
					var x1 = line.find('line').attr('x1');
					var y1 = line.find('line').attr('y1');
					var textX = Math.abs(x1 - x)*.5 + Math.min(x1, x);
					var textY = Math.abs(y1 - y)*.5 + Math.min(y1, y);

					line.find('line').attr({'x2': x, 'y2': y});
					line.find('text').attr({'x': textX, 'y': textY});
				}
			}
			activeState = null;
		}
	});

	visSVG.on('mousedown', function(e){		
		if (activeState == null && pathEdit == null) {
			if (e.which != 3) {
				hideContextMenu();
			} else {

				_g = getStateFromG();
				if (!_g.final) {
					$('input[value=final]').prop('checked', false);
				} else {
					$('input[value=final]').prop('checked', true);
				}

				return;
			}
			var x = e.pageX - off_left;
			var y = e.pageY - off_top;
			var r = 30;

			$('#states').append($(document.createElementNS('http://www.w3.org/2000/svg', 'g'))
				.attr({'id': 'q'+count, 'x': x, 'y': y}));

			$('#q'+count).append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr(
					{'cx': x, 'cy': y, 'r': r, 'stroke': 'black', 'stroke-width': 1, 'fill': 'white'}
				)
			).append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'text')).attr(
					{'x': x, 'y': y, 'stroke': 'black', 'fill': 'black'}
				).html('Q'+count)
			);

			var textWidth = $('#q'+count+' text').width()/2;
			var textHeight = $('#q'+count+' text').height()/4;
			$('#q'+count+' text').attr({'x': x - textWidth, 'y': y + textHeight});

			if (openState != null && activePath != null) {
				$('#'+activePath).attr({'x2': x, 'y2': y});
				transitions[activePath]['dest'] = 'q'+count;

				activePath = null;
			}

			statesPool['q'+count] = new GState('q'+count, x, y);
			// if (_NFA.)
			_NFA.addState('q'+count);
			if (Object.size(statesPool) <= 1) {
				startState = statesPool['q'+count];
				_NFA.startState = _NFA.states['q'+count];

				// add start symbol
				$('#q'+count).append(
					$(document.createElementNS('http://www.w3.org/2000/svg', 'text')).attr(
					{'id': 'symbol', 'x': x-r*2, 'y': y+(r/3), 'stroke': 'black', 'fill': 'black'}
					).html('&#9658;')
				);
			}
			count++;
		} else {
			if (e.which != 3) {
				hideContextMenu();
			} else {
				return;
			}
		}
	});

	$('#states').on('mousedown', 'g', function(e){
		if (activeState == null) {
			activeState = $(this);
		}
		if (e.which == 3) {
			showContextMenu(e);
		} else {
			hideContextMenu();
		}
	});

	$('#states').on('dblclick', 'g',  function(e){
		if (activeState == null && openState == null && activePath == null && e.which != 3) {
			var x = e.pageX - off_left;
			var y = e.pageY - off_top;
			var x1 = $('#'+activePath).find('line').attr('x1');
			var y1 = $('#'+activePath).find('line').attr('y1');
			var textX = Math.abs(x1 - x)*.5 + Math.min(x1, x);
			var textY = Math.abs(y1 - y)*.5 + Math.min(y1, y);

			openState = $(this);
			activePath = 'path' + pathCounter;
			$('#transitions').append($(document.createElementNS('http://www.w3.org/2000/svg', 'g')).attr({'id': activePath}));
			$('#'+activePath).append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr(
					{'x1': x, 'y1': y, 'x2': x, 'y2': y, 'stroke': 'red', 'stroke-width': 2}
				)
			).append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'text')).attr(
					{'x': textX, 'y': textY, 'stroke': 'blue'}
				).html('[insert symbol here]')
			);
			transitions.push({label: activePath, src: openState.attr('id'), dest: null});
		}
	});

	$('#states').on('mouseup', 'g',  function(e){
		if (openState != null && activePath != null) {
			
			var x = e.pageX - off_left;
			var y = e.pageY - off_top;
			
			closeState = $(this);
			if (openState.attr('id') == closeState.attr('id')) {
				var p1X = x - 100;
				var p1Y = y - 100;
				var p2X = x + 100;
				var p2Y = y - 100;
				var textX = (p1X + p2X) / 2;
				var textY = p1Y + 20;

				$('#'+activePath).find('line').remove();
				// $('#'+activePath).find('text').remove();
				$('#'+activePath).prepend(
					$(document.createElementNS('http://www.w3.org/2000/svg', 'path')).attr(
						{'d': 'M'+x+','+y+' C'+p1X+','+p1Y+' '+p2X+','+p2Y+' '+x+','+y, 'fill': 'none', 'stroke': 'red', 'stroke-width': 2}
					)
				);

				$('#'+activePath).find('text').attr({'x': textX, 'y': textY});
			} else {
				var x1 = $('#'+activePath).find('line').attr('x1');
				var y1 = $('#'+activePath).find('line').attr('y1');
				var textX = Math.abs(x1 - x)*.5 + Math.min(x1, x);
				var textY = Math.abs(y1 - y)*.5 + Math.min(y1, y);

				$('#'+activePath).find('line').attr({'x2': x, 'y2': y});
				$('#'+activePath).find('text').attr({'x': textX, 'y': textY});
			}

			var alphabet = prompt('Enter symbols (must be comma-separated):', 'a, b');
			var elements = alphabet.split(', ');

			for (el in elements) {
				if (_NFA.alphabet.split('').indexOf(elements[el]) <= -1) {
					alert(elements[el] + ' not in alphabet');
					return;
				}
			}

			$('#'+activePath).find('text').html('[' + alphabet + ']');
			transitions[pathCounter]['dest'] = closeState.attr('id');

			// add transitions to GState
			s_id = $(openState.attr('id', $(this).value)).attr('id');
			s_state = statesPool[s_id];
			c_id = $(closeState.attr('id', $(this).value)).attr('id');
			c_state = statesPool[c_id];

			console.log(s_state + " " + c_state);
		
			transitionArr.push(c_state.label);
			if (Object.size(s_state.transitions) == 0) {
				for (var el in elements) {
					s_state.transitions[elements[el]] = [];
				}
			}
			for (var el in elements) { 
				s_state.transitions[elements[el]].push(c_state.label);
				_NFA.states[s_id].transition(_NFA.states[c_id], elements[el]);
			}
			console.log(s_state);

			pathCounter++;
			activePath = null;
			openState = null;
			closeState = null;
		}
	});

	// change-alphabet prompt here
	$('#transitions').on('mousedown', 'g', function(e) {
		pathEdit = prompt('Enter alphabets (must be comma-separated):', 'a, b');
		$(this).find('text').html('[' + pathEdit + ']');
	});

});


function GState(label, x, y) {
	this.label = label;
	this.x = x;
	this.y = y;
	this.transitions = {};
	this.final = false;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function done() {
	loser = NFAConverter.convert(_NFA);
	NFAVisualizer.visualize('#container', loser);
	// $(window).scrollTop($('#container').offset().top);
	$('html, body').animate({scrollTop: $('#container').offset().top}, 500);
}

$('#actions input[data-action="test-string"]').on('click', function() {
	$('#string-input').toggleClass('hidden');
});

$('#string-input').on('submit', function(e) {
	e.preventDefault();
	var start = $('circle[label="q0"]');
  $('#mover').removeClass('hidden').css({ 'top': start.offset().top - 5 + 'px', 'left': start.offset().left - 5 + 'px' });
  $('#input').removeClass('accepted rejected');
  $('#indicators').removeClass('hidden');
  var string = $('#string-input input[name="string"]').val().trim();
  var events = [];
  loser.addEventListener('yield', function(e) {
    events.push(e);
  });
  var accepted = loser.accepts(string);

  display();
  function display() {
    if (events.length) {
      var event = events.shift();
      var state = $('circle[label="' + event.state.label + '"]');
      $('#mover').css({ 'top': state.offset().top - 6 + 'px', 'left': state.offset().left - 6 + 'px' });
      $('#input').text(event.input);
      setTimeout(display, 1000);
    } else {
      $('#input').text(accepted ? 'accepted' : 'rejected').addClass(accepted ? 'accepted' : 'rejected');
      $('#mover').addClass('hidden');
    }
  }
});