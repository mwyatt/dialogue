<?php

namespace Mwyatt\Dialogue\Controller;


/**
 * @author Martin Wyatt <martin.wyatt@gmail.com> 
 * @version	0.1
 * @license http://www.php.net/license/3_01.txt PHP License 3.01
 */
class Index extends \Mwyatt\Core\Controller
{


	public function home() {

                // gulp tasks
            $gulpTasks = [];
                // exec('gulp --tasks', $lines);
                // $lineParts = [];
                // foreach ($lines as $line) {
                //     if (!strpos($line, 'gulp')) {
                //         $lineParts = explode(' ', $line);
                //         $gulpTasks[] = end($lineParts);
                //     }
                // }
                $this->view->data->offsetSet('gulpTasks', $gulpTasks);

                exec('npm version', $lines);
                $npmVersion = 0;
                foreach ($lines as $line) {
                        if (strpos($line, 'mwyatt-codex')) {
                                $splits = explode('\'', $line);
                                $npmVersion = $splits[3];
                        }
                }
                $this->view->data->offsetSet('npmVersion', $npmVersion);
        
        $this->view->data->offsetSet('assetVersion', 1);
		$this->view->data->offsetSet('siteTitle', 'Codex');
		return $this->response($this->view->getTemplate('index'));
	}
}
