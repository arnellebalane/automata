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
  var dfa = new NFA(nfa.alphabet);
  var alphabet = nfa.alphabet.split('');
  var labelCtr = 1;
  var generatedStates = [];
  var finalDFAstates = [];
  var finalNFAstates = nfa.getFinalStates();

  var qZeroEClosures = NFAConverter.eClosure(nfa, nfa.states['q0'], []).sort();
  var deadState = {  
    label: "deadState", 
    transitions: {},
    containedStates:[]
  }
  var hasDeadState = false; 

  generatedStates.push({label: "q0", transitions: {}, containedStates: qZeroEClosures});

  var finished = false;
  while (!finished) {
    for (var i = 0; i < alphabet.length; i++) {
      var statesReached = [];
      var currSymbol = alphabet[i];
      var currState = generatedStates[0];
      for (var j = 0; j < currState.containedStates.length; j++) {
        var currContainedState = currState.containedStates[j];
        if (currSymbol in nfa.states[currContainedState].transitions) {
          var trans = nfa.states[currContainedState].transitions[currSymbol];
          for (var k = 0; k < trans.length; k++) {
            if (statesReached.indexOf(trans[k]) == -1) {
              statesReached.push(trans[k]);
            }
          }
        }
      }
      if (statesReached.length == 0) {
        hasDeadState = true;
        currState.transitions[currSymbol] = deadState.label;
        continue;
      }

      var eClosuresUnion = [];
      for (var l = 0; l < statesReached.length; l++) {
        var eClosure = NFAConverter.eClosure(nfa, statesReached[l], []);
        for (var m = 0; m < eClosure.length; m++) {
          if (eClosuresUnion.indexOf(eClosure[m]) == -1) {
            eClosuresUnion.push(eClosure[m]);
          }
        }
      }

      eClosuresUnion.sort();
      generatedState = {label : "q" + labelCtr, transitions: {}, containedStates : eClosuresUnion};
      generatedState.transitions[currSymbol] = "";
      labelCtr++;
      if (contains(finalDFAstates, generatedState)) {
        currState.transitions[currSymbol] = getLabel(finalDFAstates, generatedState);
        labelCtr--;
      } else {
        if (contains(generatedStates, generatedState)){
          currState.transitions[currSymbol] = getLabel(generatedStates, generatedState);
          labelCtr--;
        } else {
          currState.transitions[currSymbol] = generatedState.label;
          generatedStates.push(generatedState);
        }
      }
    }

    finalDFAstates.push(generatedStates.shift());

    if (generatedStates.length == 0) {
      finished = true;
    }    
  }

    finalDFAstates = setFinalStates(finalDFAstates, finalNFAstates);
    if (hasDeadState) {
      for (var i = 0; i < alphabet.length; i++) {
        deadState.transitions[alphabet[i]] = "deadState"
      }
      finalDFAstates.push(deadState);
    }


  dfa.states = {};
  dfa.statesCount = 0;
  dfa.startState = null;
  var convertedStates = {};
  
  for (var i = 0; i < finalDFAstates.length; i++) {
    convertedStates[finalDFAstates[i].label] = dfa.addState();
  }

  for (var i = 0; i < finalDFAstates.length; i++) {
    var unConvState = finalDFAstates[i];
    var convState = convertedStates[unConvState.label];
    convState.final = unConvState.final || false;
    for (var symbol in unConvState.transitions) {
      convState.transition(convertedStates[unConvState.transitions[symbol]], symbol);
    }
  }
  dfa.setStartState(dfa.getState('q0'));
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
    if (isEqual(source[i].containedStates, toCheck.containedStates)) {
      return true;
    } 
  } 
  return false;
}

function getLabel(source, toGet) {
  for (var i = 0; i < source.length; i++) {
    if (isEqual(source[i].containedStates, toGet.containedStates)) {
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
      for (var k = 0; k < finalDFAstates[i].containedStates.length; k++) {
        if (finalDFAstates[i].containedStates[k] == finalNFAstates[j].label) {
          finalDFAstates[i].final = true;
        }
      }
    }
  }

  return finalDFAstates;
}