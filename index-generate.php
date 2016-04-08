<?php

ob_start();

include 'template/index.php';

$content = ob_get_contents();

file_put_contents('index.html', $content);

ob_end_clean();

echo $content;
