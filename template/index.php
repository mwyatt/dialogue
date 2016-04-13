<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
	<title>Dialogue</title>
	<link rel="stylesheet" href="asset/common.bundle.css">
</head>
<body>
	<h1 class="site-heading"><a href="#introduction" class="site-heading-link js-smooth-scroll">mwyatt/dialogue</a></h1>
	<ul>

<?php foreach ([1, 2, 3, 4, 5, 6] as $key): ?>
	
		<li><span class="link primary js-dialogue-<?php echo $key ?>">Open Example <?php echo $key ?></span></li>

<?php endforeach ?>
	
	</ul>
	<script src="asset/lib.js"></script>
	<script src="asset/common.bundle.js"></script>
</body>
</html>
