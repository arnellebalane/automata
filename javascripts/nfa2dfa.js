function NFAConverter() {}
NFAConverter.convert = function(nfa) {
  nfa = NFAConverter.expandStringTransitions(nfa);
  return nfa;
}

NFAConverter.expandStringTransitions = function(nfa) {
  for (var state in nfa.states) {
    for (var transition in nfa.states[state].transitions) {
      if (transition.length != 1) {
        for (var i = 0; i < nfa.states[state].transitions[transition].length; i++) {
          var stringTransition = transition;
          var currentState = nfa.states[state];
          for (var j = 0; j < transition.length - 1; j++) {
            var newState = nfa.addState();
            var first = stringTransition.charAt(0);
            stringTransition = stringTransition.substring(1, stringTransition.length);
            currentState.transition(newState, first);
            currentState = newState;
          }
          currentState.transition(nfa.states[state].transitions[transition][i], stringTransition);
        }
        delete nfa.states[state].transitions[transition];
      }
    }
  }
  return nfa;
}

NFAConverter.eClosure = function(nfa, state, eStates) {
  eStates.push(state.label);
  if ('~' in state.transitions) {
    var moreEStates = [];
    for (var i = 0; i < state.transitions['~'].length; i++) {
      if (eStates.indexOf(state.transitions['~'][i].label) == -1) {
        moreEStates = NFAConverter.eClosure(nfa, state.transitions['~'][i], eStates);
      } 
      for (var j = 0; j < moreEStates.length; j++) {
        if (eStates.indexOf(moreEStates[j]) == -1) {
          eStates.push(moreEStates[j]);
        }
      }
    } 
  }
  return eStates;
}

NFAConverter.convert = function(nfa) {
  var dfa = new NFA('ab');
  var alphabet = ['a', 'b'];
  var id = 1;
  var possibleNewStates = [];
  var finalNFAstates = nfa.getFinalStates();
  var finalDFAstates = [];
  var currentState = nfa.states['q0'];
  var eclosures = NFAConverter.eClosure(nfa, currentState, []).sort();
  var deadState = {  
    label: "deadState", 
    transitions : {a : "deadState", b : "deadState"}, 
    eclosure:[]
  }

  possibleNewStates.push({label: "q0", transitions : {}, eclosure: eclosures});

  var finished = false;
  while (!finished) {
    for (var i = 0; i < alphabet.length; i++) {
      var leadsTo = [];
      var currSymbol = alphabet[i];
      for (var j = 0; j < possibleNewStates[0].eclosure.length; j++) {
        if (currSymbol in nfa.states[possibleNewStates[0].eclosure[j]].transitions) {
          var trans = nfa.states[possibleNewStates[0].eclosure[j]].transitions[currSymbol];
          for (var k = 0; k < trans.length; k++) {
            if (leadsTo.indexOf(trans[k]) == -1) {
              leadsTo.push(trans[k]);
            }
          }
        }
      }

      if (leadsTo.length == 0) {
        possibleNewStates[0].transitions[currSymbol] = deadState.label;
        continue;
      }

      var eClosuresUnion = [];
      for (var l = 0; l < leadsTo.length; l++) {
        var eClosure = NFAConverter.eClosure(nfa, leadsTo[l], []);
        for (var m = 0; m < eClosure.length; m++) {
          if (eClosuresUnion.indexOf(eClosure[m]) == -1) {
            eClosuresUnion.push(eClosure[m]);
          }
        }
      }

      eClosuresUnion.sort();
      toBeAdded = {label : "q" + id, transitions: {}, eclosure : eClosuresUnion};
      toBeAdded.transitions[currSymbol] = "";
      id++;

      if (contains(finalDFAstates, toBeAdded)) {
        possibleNewStates[0].transitions[currSymbol] = getLabel(finalDFAstates, toBeAdded);
        id--;
      } else {
        if (contains(possibleNewStates, toBeAdded)) {
          possibleNewStates[0].transitions[currSymbol] = getLabel(possibleNewStates, toBeAdded);
          id--;
        } else {
          possibleNewStates[0].transitions[currSymbol] = toBeAdded.label;
          possibleNewStates.push(toBeAdded);
        }
      }
    }

    finalDFAstates.push(possibleNewStates.shift());

    if (possibleNewStates.length == 0) {
      finished = true;
    }
  }

  finalDFAstates = setFinalStates(finalDFAstates, finalNFAstates);
  finalDFAstates.push(deadState);

  console.log("omg final DFA states!");
  console.log(finalDFAstates);

  dfa.states = {};
  dfa.statesCount = 0;
  dfa.startState = null;
  var nStates = {};
  for (var i = 0; i < finalDFAstates.length; i++) {
    nStates[finalDFAstates[i].label] = dfa.addState();
  }

  console.info(nStates);

  for (var i = 0; i < finalDFAstates.length; i++) {
    var s = finalDFAstates[i];
    var state = nStates[s.label];
    state.final = s.final || false;
    for (var symbol in s.transitions) {
      state.transition(nStates[s.transitions[symbol]], symbol);
    }
  }
  dfa.setStartState(dfa.getState('q0'));
  console.warn(dfa);
  return dfa;
}





function isEqual(array1, array2) {
  if (array1.length == array2.length) {
    for (var i = 0; i < array1.length; i++) {
      if (array1[i] != array2[i]) return false;
    }
    return true;
  }
  return false;
} 

function contains(source, toCheck) {
  for (var i = 0; i < source.length; i++) {
    if (isEqual(source[i].eclosure, toCheck.eclosure)) {
      return true;
    } 
  } 
  return false;
}

function getLabel(source, toGet) {
  for (var i = 0; i < source.length; i++) {
    if (isEqual(source[i].eclosure, toGet.eclosure)) {
      return source[i].label;
    }
  }
}

function getStateByLabel(finalDFAstates, label) {
  for (var i = 0; i < finalDFAstates.length; i++) {
    if (label == finalDFAstates[i].label) {
      return finalDFAstates[i];
    }
  }
}

function setFinalStates(finalDFAstates, finalNFAstates) {
  for (var i = 0; i < finalDFAstates.length; i++) {
    for (var j = 0; j < finalNFAstates.length; j++) {
      for (var k = 0; k < finalDFAstates[i].eclosure.length; k++) {
        if (finalDFAstates[i].eclosure[k] == finalNFAstates[j].label) {
          finalDFAstates[i].final = true;
        }
      }
    }
  }

  return finalDFAstates;
}