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
      <div id="instructions">
	<p>
	  <a href="http://ludumdare.com/compo/ludum-dare-32/?action=preview&uid=7606">Ludum Dare project page</a>
	</p>
	<p>Find the ultimate weapon!</p>
	<p>Controls:</p>
	<ul>
	  <li>Arrow keys: move and jump</li>
	  <li>Down arrow: interact</li>
	  <li>Z: previous weapon</li>
	  <li>X: next weapon</li>
	  <li>C: shoot</li>
	</ul>
      </div>
    </div>
  </body>
</html>
