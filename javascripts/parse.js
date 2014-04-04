$(document).ready(function() {
  parse.initialize();
  parse.actions();
});

var parse = {
  input: { form: { regex: null, string: null }, regex: null, alphabet: null, string: null },
  output: { nfa: null, dfa: null },
  initialize: function() {
    parse.input.form.regex = $('main.parse form#regex-input');
    parse.input.form.string = $('main.parse form#string-input');
    parse.input.regex = parse.input.form.regex.find('input[type="text"][name="regex"]');
    parse.input.alphabet = parse.input.form.regex.find('input[type="text"][name="alphabet"]');
    parse.input.string = parse.input.form.string.find('input[type="text"][name="string"]');

    parse.input.form.regex.find('input[type="text"]').on('keydown', function(e) {
      parse.input.form.regex.removeClass('invalid');
    });

    parse.input.regex.on('keyup', function(e) {
      if (!parse.input.alphabet.hasClass('modified')) {
        var value = $(this).val();
        var symbols = value.replace(/[+*()]/g, '').split('');
        var alphabet = [];
        symbols.map(function(symbol) {
          if (alphabet.indexOf(symbol) == -1) {
            alphabet.push(symbol);
          }
        });
        parse.input.alphabet.val(alphabet.join(','));
      }
    });

    parse.input.alphabet.on('change', function() {
      if ($(this).val().trim().length) {
        $(this).addClass('modified');
      }
    });

    parse.input.form.regex.on('submit', function(e) {
      e.preventDefault();
      var regex = parse.input.regex.val();
      var alphabet = parse.input.alphabet.val().trim().split(',').join('');
      try {
        parse.output.nfa = RegexParser.parse(regex, alphabet);
        parse.input.form.regex.addClass('hidden');
        NFAVisualizer.visualize('#container', parse.output.nfa);
        $('#actions').removeClass('hidden');
      } catch (error) {
        parse.input.form.regex.addClass('invalid');
        var input = document.querySelector('.parse input[name="regex"]');
        input.setCustomValidadity(error.messages);
      }
    });
  },
  actions: function() {
    $('.button[data-action="test-string"]').on('click', function() {
      $('#string-input').toggleClass('hidden');
      $('#string-input input[type="text"]').focus();
    });

    $('.button[data-action="convert-to-dfa"]').on('click', function() {
      parse.output.dfa = NFAConverter.convert(parse.output.nfa);
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      NFAVisualizer.visualize('#container', parse.output.dfa);
    });

    $('.button[data-action="replace"]').on('click', function() {
      parse.output.nfa = null;
      parse.output.dfa = null;
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      $('#actions, #indicators').addClass('hidden');
      parse.input.string.val('');
      parse.input.form.regex.removeClass('hidden');
      parse.input.regex.focus();
    });

    parse.input.form.string.on('submit', function(e) {
      e.preventDefault();
      var start = $('circle[label="q0"]');
      $('#mover').removeClass('hidden').css({ 'top': start.offset().top - 5 + 'px', 'left': start.offset().left - 5 + 'px' });
      $('#input').removeClass('accepted rejected');
      $('#indicators').removeClass('hidden');
      var string = parse.input.string.val().trim();
      var events = [];
      parse.output[parse.output.dfa ? 'dfa' : 'nfa'].addEventListener('yield', function(e) {
        events.push(e);
      });
      var accepted = parse.output[parse.output.dfa ? 'dfa' : 'nfa'].accepts(string);

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
  }
};