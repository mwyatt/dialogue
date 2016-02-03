<html>
<head>
	<meta charset="UTF-8">
	<title>Dialogue</title>
	<link rel="stylesheet" href="asset/common.css">
</head>
<body>
	<h1>Dialogue</h1>
	<ul>

<?php foreach ([1, 2, 3, 4, 6] as $key): ?>
	
		<li><span class="link-primary js-dialogue-<?php echo $key ?>">Open Example <?php echo $key ?></span></li>

<?php endforeach ?>
	
	</ul>
	<script src="asset/common.js"></script>
</body>
</html>
