<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${app_name|h}</title>
    % for script in scripts:
    <script src="${relpath(script)|h}"></script>
    % endfor
    <style type="text/css">${css_data|h}</style>
  </head>
  <body>
    <div id="main">
      <div id="game"></div>
      <p id="version">${version|h}</p>
    </div>
    <div id="instructions">
      <h1>Chaos Tomb</h1>
      <p>
	Chaos Tomb is an action platformer in the Metroidvania
	style. You are exploring the Chaos Tomb, and must fight
	monsters with the uncoventional weapons you find there. It is
	rumored that the ultimate weapon lies buried in the Chaos
	Tomb. Will you be the one to find it?
      </p>
      <h3>Controls</h3>
      <ul class="controls">
	<li><span>Arrow keys:</span> move and jump</li>
	<li><span>Down arrow:</span> interact</li>
	<li><span>Z:</span> previous weapon</li>
	<li><span>X:</span> next weapon</li>
	<li><span>C:</span> shoot / select menu item</li>
      </ul>
      <h3>Links</h3>
      <ul class="links">
	<li><a href="http://ludumdare.com/compo/ludum-dare-32/?action=preview&uid=7606">Ludum Dare project page</a></li>
	<li><a href="https://www.github.com/depp/chaostomb">Source code on GitHub</a></li>
	<li><a href="https://soundcloud.com/twoseventwo">Soundtrack on SoundCloud</a></li>
	<li><a href="https://twitter.com/DietrichEpp">Twitter: @DietrichEpp</a></li>
      </ul>
      <h3>Tips and Notes</h3>
      <p>
	The weapons are shuffled randomly when you start a new game.
	If you get a really bad loadout (say, Potato and Brick
	Breaker) and get frustrated, try starting again from the
	beginning.
      </p>
    </div>
  </body>
</html>
