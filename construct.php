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
  <script src="javascripts/jsflap-v2.js"></script>
  <script src="javascripts/construct.js"></script>
  <title>automata</title>
</head>

<body>  
  <main class="construct">
    <a href="index.php" id="logo">automata</a>
    <div id="container"></div>
    <div id="arena"></div>
    <div id="indicators" class="hidden">
      <div id="mover"></div>
      <p id="input"></p>
    </div>
    <section id="actions">
      <input type="button" value="Test String" class="button" data-action="test-string">
      <input type="button" value="Convert to DFA" class="button" data-action="convert-to-dfa">
      <form action="#" method="GET" id="string-input" class="hidden">
        <input type="text" name="string">
        <input type="submit" value="Test" class="button">
      </form>
    </section>
  </main>
</body>
</html>