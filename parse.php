<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="stylesheets/reset.css">
  <link rel="stylesheet" href="stylesheets/fonts.css">
  <link rel="stylesheet" href="stylesheets/application.css">
  <link rel="stylesheet" href="stylesheets/visualizer.css">
  <script src="javascripts/jquery.js"></script>
  <script src="javascripts/regex2nfa.js"></script>
  <script src="javascripts/nfa2dfa.js"></script>
  <script src="javascripts/nfa-visualizer.js"></script>
  <script src="javascripts/parse.js"></script>
  <title>automata</title>
</head>

<body>
  <main class="parse">
    <a href="index.php" id="logo">automata</a>
    <div id="container"></div>
    <div id="indicators" class="hidden">
      <div id="mover"></div>
      <p id="input"></p>
    </div>
    <section id="actions" class="hidden">
      <input type="button" value="Test String" class="button" data-action="test-string">
      <input type="button" value="Convert to DFA" class="button" data-action="convert-to-dfa">
      <input type="button" value="Replace" class="button" data-action="replace">
      <form action="#" method="GET" id="string-input" class="hidden">
        <input type="text" name="string">
        <input type="submit" value="Test" class="button">
      </form>
    </section>

    <form action="#" method="GET" id="regex-input">
      <div class="field block">
        <label>regular expression</label>
        <input type="text" name="regex" autofocus>
      </div>
      <div class="field inline">
        <label>alphabet</label>
        <input type="text" name="alphabet">
      </div>
      <input type="submit" value="Parse" class="button">
    </form>
  </main>
</body>
</html>