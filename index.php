<?php

$package = file_get_contents('./package.json');
$package = json_decode($package);

include './template/home.php';
