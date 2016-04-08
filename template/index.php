<html>
<head>
	<meta charset="UTF-8">
	<title>mwyatt/dialogue</title>
	<link rel="stylesheet" href="asset/common.bundle.css">
</head>
<body>

	<h1>Dialogue</h1>
	<ul>

<?php foreach ([1, 2, 3, 4, 5, 6] as $key): ?>
	
		<li><span class="link primary js-dialogue-<?php echo $key ?>">Open Example <?php echo $key ?></span></li>

<?php endforeach ?>
	
	</ul>
	<script src="asset/lib.js"></script>
	<script src="asset/common.bundle.js"></script>
</body>
</html>
