<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
    <title><?php echo $package->name ?></title>
    <link href="https://fonts.googleapis.com/css?family=Libre+Franklin:100,200,300,400,500,600,700,800,900" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Work+Sans:100,200,300,400,500,600,700,800,900" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600" rel="stylesheet">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="asset/common.bundle.css">
</head>
<body>
    <div class="body-inner-container">
        <div class="site-heading-container">
            <div class="panel-spacing-bottom">
                <h1 class="site-heading"><?php echo $package->name ?> <span class="npm-version"><?php echo $package->version ?></span></h1>
                <div class="site-slogan"><?php echo str_replace(' http://mwyatt.github.io/dialogue/', '', $package->description) ?></div>
            </div>
            <div class="site-heading-menu panel-spacing-bottom">
                <div class="site-heading-menu-item"><a class="site-heading-menu-link" href="https://www.npmjs.com/package/mwyatt-dialogue" target="_blank">NPM</a></div>
                <div class="site-heading-menu-item"><a class="site-heading-menu-link" href="<?php echo $package->homepage ?>" target="_blank">Github</a></div>
            </div>
        </div>
        <div class="panel-spacing-bottom">
            <h2 class="demo-heading">Demo</h2>
            <nav class="demos-container">
                <button class="demo-dialogue js-dialogue-1">Basic</button>
                <button class="demo-dialogue js-dialogue-2">Inline Position</button>
                <button class="demo-dialogue js-dialogue-3">Hard Close</button>
                <button class="demo-dialogue js-dialogue-5">Ajax</button>
                <button class="demo-dialogue js-dialogue-6">Auto Width</button>
                <button class="demo-dialogue js-dialogue-7">Actions</button>
                <button class="demo-dialogue js-dialogue-8">
                Draggable</button>
            </nav>
        </div>
        <div class="panel-spacing-bottom">
            <h2 class="demo-heading">Author</h2>
            <a href="<?php echo $package->homepage ?>" target="_blank" class="link">mwyatt</a>
        </div>
        <div class="panel-tester">
            <span class="js-test-me">Positional Far Down</span>
        </div>
    </div>
    <script src="asset/common.bundle.js?<?php echo filemtime('asset/common.bundle.js') ?>"></script>
</body>
</html>
